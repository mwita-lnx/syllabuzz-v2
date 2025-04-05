from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from pymongo.errors import PyMongoError
from app import mongo
from functools import wraps
import jwt
import bcrypt
import re
import redis
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app import mongo

db = mongo.db

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize Redis for token blacklisting (optional - can be enabled in production)
# redis_client = redis.Redis(host='localhost', port=6379, db=0)

auth = Blueprint('auth', __name__)

# Define standard response format
def create_response(success=True, message=None, data=None, error=None, status_code=200):
    """Standardized response format"""
    response = {
        'success': success
    }
    
    if message:
        response['message'] = message
    if data is not None:
        response['data'] = data
    if error:
        response['error'] = error
        
    return jsonify(response), status_code

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return create_response(success=False, error="Authentication token is missing", status_code=401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Check if token is blacklisted (optional - for production)
            # if redis_client.exists(f"blacklist:{token}"):
            #     return create_response(success=False, error="Token has been revoked", status_code=401)
            
            # Set current user in flask g object for access in the route
            user_id = payload['user_id']
            
            # Fetch user from database - replace this with your actual user fetch logic
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                # If user not found, use the payload as a fallback
                current_user = {
                    '_id': user_id,
                    'role': payload.get('role', 'user'),
                    'email': payload.get('email', '')
                }
            else:
                # Format user document
                current_user = dict(user)
                current_user['_id'] = str(user['_id'])
            
            # Store in g for other decorators
            g.current_user = current_user
            g.user_id = user_id
            
            # Pass the user to the decorated function
            return f(current_user=current_user, *args, **kwargs)
            
        except jwt.ExpiredSignatureError:
            return create_response(success=False, error="Token has expired", status_code=401)
        except jwt.InvalidTokenError:
            return create_response(success=False, error="Invalid token", status_code=401)
        except Exception as e:
            current_app.logger.error(f"Auth error: {str(e)}")
            return create_response(success=False, error="Authentication error", status_code=500)
            
    return decorated

# Role-based access control decorator
def role_required(roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'current_user') or not g.current_user:
                return create_response(success=False, error="Authentication required", status_code=401)
                
            user_role = g.current_user.get('role')
            
            if user_role not in roles:
                return create_response(success=False, error="Insufficient permissions", status_code=403)
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

# Helper function to generate tokens
def generate_tokens(user_data):
    """Generate access and refresh tokens"""
    # Access token - short lived
    access_token_payload = {
        "user_id": str(user_data['_id']),
        "email": user_data['email'],
        "role": user_data['role'],
        "name": user_data['name'],
        "exp": datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    }
    
    access_token = jwt.encode(
        access_token_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Refresh token - longer lived
    refresh_token_payload = {
        "user_id": str(user_data['_id']),
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=30)  # 30 days expiry
    }
    
    refresh_token = jwt.encode(
        refresh_token_payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )
    
    # Store refresh token in database for better control
    mongo.db.refresh_tokens.insert_one({
        "user_id": ObjectId(user_data['_id']),
        "token": refresh_token,
        "expires_at": datetime.utcnow() + timedelta(days=30),
        "created_at": datetime.utcnow(),
        "ip_address": request.remote_addr,
        "user_agent": request.user_agent.string
    })
    
    return access_token, refresh_token

# Password validation
def is_valid_password(password):
    """Check if password meets minimum requirements"""
    # At least 8 characters, containing at least one number and one letter
    if len(password) < 8:
        return False
    if not re.search(r'[A-Za-z]', password) or not re.search(r'\d', password):
        return False
    return True

@auth.route('/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    """
    Register a new user
    Required body parameters:
    - email: User's email
    - password: User's password
    - name: User's full name
    - faculty: User's faculty
    Optional body parameters:
    - units: Array of unit codes
    - role: User's role (default: 'student')
    """
    try:
        db = mongo.db
        data = request.json
        
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'faculty']
        for field in required_fields:
            if field not in data or not data[field]:
                return create_response(success=False, error=f"Missing required field: {field}", status_code=400)
        
        # Validate email format
        email_pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
        if not re.match(email_pattern, data['email']):
            return create_response(success=False, error="Invalid email format", status_code=400)
        
        # Validate password strength
        if not is_valid_password(data['password']):
            return create_response(
                success=False, 
                error="Password must be at least 8 characters and contain at least one letter and one number", 
                status_code=400
            )
        
        # Check if email already exists
        existing_user = db.users.find_one({"email": data['email'].lower()})
        if existing_user:
            return create_response(success=False, error="Email already registered", status_code=409)
        
        # Hash password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
        
        # Create user document
        new_user = {
            "email": data['email'].lower(),
            "password": hashed_password,
            "name": data['name'],
            "faculty": data['faculty'],
            "units": data.get('units', []),
            "role": data.get('role', 'student'),
            "created_at": datetime.utcnow(),
            "last_login": None,
            "verified": False
        }
        
        # Insert user
        result = db.users.insert_one(new_user)
        
        # Get complete user document with ID
        user = db.users.find_one({"_id": result.inserted_id})
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user)
        
        return create_response(
            success=True,
            message="User registered successfully",
            data={
                "token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": str(user['_id']),
                    "email": user['email'],
                    "name": user['name'],
                    "faculty": user['faculty'],
                    "role": user['role']
                }
            },
            status_code=201
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    """
    Log in a user
    Required body parameters:
    - email: User's email
    - password: User's password
    """
    try:
        db = mongo.db
        data = request.json
        
        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            return create_response(success=False, error="Email and password are required", status_code=400)
        
        # Find user by email
        user = db.users.find_one({"email": data['email'].lower()})
        
        if not user:
            return create_response(success=False, error="Invalid email or password", status_code=401)
        
        # Verify password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
            return create_response(success=False, error="Invalid email or password", status_code=401)
        
        # Update last login timestamp
        db.users.update_one(
            {"_id": user['_id']},
            {"$set": {"last_login": datetime.utcnow()}}
        )
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user)
        
        return create_response(
            success=True,
            message="Login successful",
            data={
                "token": access_token,
                "refresh_token": refresh_token,
                "user": {
                    "id": str(user['_id']),
                    "email": user['email'],
                    "name": user['name'],
                    "faculty": user['faculty'],
                    "role": user['role']
                }
            }
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/refresh', methods=['POST'])
def refresh_token():
    """
    Refresh access token using refresh token
    Required body parameters:
    - refresh_token: The refresh token
    """
    try:
        data = request.json
        
        if not data or 'refresh_token' not in data:
            return create_response(success=False, error="Refresh token is required", status_code=400)
        
        refresh_token = data['refresh_token']
        
        try:
            # Decode and validate refresh token
            payload = jwt.decode(
                refresh_token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Verify this is a refresh token
            if payload.get('type') != 'refresh':
                return create_response(success=False, error="Invalid token type", status_code=400)
            
            user_id = payload['user_id']
            
            # Check if token exists in database and is valid
            db = mongo.db
            token_record = db.refresh_tokens.find_one({
                "user_id": ObjectId(user_id),
                "token": refresh_token,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not token_record:
                return create_response(success=False, error="Invalid or expired refresh token", status_code=401)
            
            # Get user record
            user = db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return create_response(success=False, error="User not found", status_code=404)
            
            # Generate new access token
            access_token_payload = {
                "user_id": str(user['_id']),
                "email": user['email'],
                "role": user['role'],
                "name": user['name'],
                "exp": datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
            }
            
            new_access_token = jwt.encode(
                access_token_payload,
                current_app.config['JWT_SECRET_KEY'],
                algorithm='HS256'
            )
            
            return create_response(
                success=True,
                message="Token refreshed successfully",
                data={
                    "token": new_access_token
                }
            )
            
        except jwt.ExpiredSignatureError:
            return create_response(success=False, error="Refresh token has expired", status_code=401)
        except jwt.InvalidTokenError:
            return create_response(success=False, error="Invalid refresh token", status_code=401)
            
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/logout', methods=['POST'])
@token_required
def logout():
    """
    Log out a user by invalidating refresh tokens
    Requires authentication
    Optional body parameters:
    - refresh_token: The refresh token to invalidate (if not provided, all tokens will be invalidated)
    """
    try:
        db = mongo.db
        data = request.json
        user_id = g.user_id
        
        # Get current token
        auth_header = request.headers.get('Authorization')
        current_token = auth_header.split(' ')[1] if auth_header else None
        
        # Add token to blacklist (optional - for production)
        # if current_token:
        #     # Get token expiration time
        #     payload = jwt.decode(current_token, current_app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        #     exp_timestamp = payload.get('exp', 0)
        #     current_timestamp = datetime.utcnow().timestamp()
        #     ttl = max(int(exp_timestamp - current_timestamp), 0)
        #     
        #     # Add to Redis blacklist with expiry
        #     if ttl > 0:
        #         redis_client.setex(f"blacklist:{current_token}", ttl, '1')
        
        # If refresh token provided, invalidate only that token
        if data and 'refresh_token' in data:
            db.refresh_tokens.delete_one({
                "user_id": ObjectId(user_id),
                "token": data['refresh_token']
            })
        else:
            # Otherwise invalidate all refresh tokens for this user
            db.refresh_tokens.delete_many({"user_id": ObjectId(user_id)})
        
        return create_response(
            success=True,
            message="Logged out successfully"
        )
        
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/profile', methods=['GET'])
@token_required
def get_profile():
    """
    Get user profile
    Requires authentication
    """
    try:
        user_id = g.user_id
        
        # Get user profile
        db = mongo.db
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return create_response(success=False, error="User not found", status_code=404)
        
        # Return user profile without password
        user_data = {
            "id": str(user['_id']),
            "email": user['email'],
            "name": user['name'],
            "faculty": user['faculty'],
            "units": user.get('units', []),
            "role": user['role'],
            "created_at": user.get('created_at'),
            "last_login": user.get('last_login')
        }
        
        return create_response(
            success=True,
            data=user_data
        )
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    """
    Update user profile
    Requires authentication
    """
    try:
        user_id = g.user_id
        data = request.json
        
        if not data:
            return create_response(success=False, error="No data provided", status_code=400)
        
        # Fields that can be updated
        allowed_fields = ['name', 'faculty', 'units']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if not update_data:
            return create_response(success=False, error="No valid fields to update", status_code=400)
        
        # Add update timestamp
        update_data['updated_at'] = datetime.utcnow()
        
        # Update user profile
        db = mongo.db
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return create_response(success=False, error="User not found", status_code=404)
        
        # Get updated user profile
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        # Return updated user profile without password
        user_data = {
            "id": str(user['_id']),
            "email": user['email'],
            "name": user['name'],
            "faculty": user['faculty'],
            "units": user.get('units', []),
            "role": user['role']
        }
        
        return create_response(
            success=True,
            message="Profile updated successfully",
            data=user_data
        )
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/password', methods=['PUT'])
@token_required
def change_password():
    """
    Change user password
    Requires authentication
    Required body parameters:
    - current_password: User's current password
    - new_password: User's new password
    """
    try:
        user_id = g.user_id
        data = request.json
        
        # Validate required fields
        if not data or 'current_password' not in data or 'new_password' not in data:
            return create_response(success=False, error="Current and new passwords are required", status_code=400)
        
        # Validate new password strength
        if not is_valid_password(data['new_password']):
            return create_response(
                success=False, 
                error="New password must be at least 8 characters and contain at least one letter and one number", 
                status_code=400
            )
        
        # Get user
        db = mongo.db
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return create_response(success=False, error="User not found", status_code=404)
        
        # Verify current password
        if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password']):
            return create_response(success=False, error="Current password is incorrect", status_code=401)
        
        # Hash new password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), salt)
        
        # Update password
        result = db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "password": hashed_password,
                    "password_updated_at": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            return create_response(success=False, error="User not found", status_code=404)
        
        # Invalidate all refresh tokens for this user for security
        db.refresh_tokens.delete_many({"user_id": ObjectId(user_id)})
        
        return create_response(
            success=True,
            message="Password changed successfully"
        )
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/verify', methods=['POST'])
def verify_token():
    """
    Verify JWT token
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return create_response(success=False, error="Authentication token is missing", status_code=401)
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            
            # Check if token is blacklisted (optional - for production)
            # if redis_client.exists(f"blacklist:{token}"):
            #     return create_response(success=False, error="Token has been revoked", status_code=401)
            
            return create_response(
                success=True,
                message="Token is valid",
                data=payload
            )
            
        except jwt.ExpiredSignatureError:
            return create_response(success=False, error="Token has expired", status_code=401)
        except jwt.InvalidTokenError:
            return create_response(success=False, error="Invalid token", status_code=401)
            
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/forgot-password', methods=['POST'])
@limiter.limit("5 per hour")
def forgot_password():
    """
    Initiate password reset process
    Required body parameters:
    - email: User's email
    """
    try:
        data = request.json
        
        if not data or 'email' not in data:
            return create_response(success=False, error="Email is required", status_code=400)
        
        email = data['email'].lower()
        
        # Find user
        db = mongo.db
        user = db.users.find_one({"email": email})
        
        # For security reasons, don't reveal if the email exists or not
        if not user:
            return create_response(
                success=True,
                message="If your email is registered, you will receive password reset instructions"
            )
        
        # Generate password reset token
        reset_token = str(ObjectId())
        expires_at = datetime.utcnow() + timedelta(hours=1)
        
        # Store reset token
        db.password_resets.insert_one({
            "user_id": user['_id'],
            "token": reset_token,
            "expires_at": expires_at,
            "created_at": datetime.utcnow(),
            "ip_address": request.remote_addr,
            "used": False
        })
        
        # In a real app, send an email with reset link
        # reset_link = f"{frontend_url}/reset-password?token={reset_token}"
        # send_email(email, 'Password Reset', f'Click the link to reset your password: {reset_link}')
        
        # For now, just return the token (in production, this would not be returned)
        return create_response(
            success=True,
            message="If your email is registered, you will receive password reset instructions",
            data={"reset_token": reset_token}  # Remove this in production
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/reset-password', methods=['POST'])
@limiter.limit("5 per hour")
def reset_password():
    """
    Reset password using reset token
    Required body parameters:
    - token: Password reset token
    - new_password: New password
    """
    try:
        data = request.json
        
        if not data or 'token' not in data or 'new_password' not in data:
            return create_response(success=False, error="Token and new password are required", status_code=400)
        
        token = data['token']
        new_password = data['new_password']
        
        # Validate new password strength
        if not is_valid_password(new_password):
            return create_response(
                success=False, 
                error="New password must be at least 8 characters and contain at least one letter and one number", 
                status_code=400
            )
        
        # Find valid reset token
        db = mongo.db
        reset_record = db.password_resets.find_one({
            "token": token,
            "expires_at": {"$gt": datetime.utcnow()},
            "used": False
        })
        
        if not reset_record:
            return create_response(success=False, error="Invalid or expired token", status_code=400)
        
        # Get user
        user = db.users.find_one({"_id": reset_record['user_id']})
        
        if not user:
            return create_response(success=False, error="User not found", status_code=404)
        
        # Hash new password
        salt = bcrypt.gensalt()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), salt)
        
        # Update password
        db.users.update_one(
            {"_id": user['_id']},
            {
                "$set": {
                    "password": hashed_password,
                    "password_updated_at": datetime.utcnow()
                }
            }
        )
        
        # Mark token as used
        db.password_resets.update_one(
            {"_id": reset_record['_id']},
            {"$set": {"used": True, "used_at": datetime.utcnow()}}
        )
        
        # Invalidate all refresh tokens for this user for security
        db.refresh_tokens.delete_many({"user_id": user['_id']})
        
        return create_response(
            success=True,
            message="Password has been reset successfully"
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/sessions', methods=['GET'])
@token_required
def get_active_sessions():
    """
    Get user's active sessions (refresh tokens)
    Requires authentication
    """
    try:
        user_id = g.user_id
        
        # Get refresh tokens
        db = mongo.db
        tokens = list(db.refresh_tokens.find(
            {
                "user_id": ObjectId(user_id),
                "expires_at": {"$gt": datetime.utcnow()}
            },
            {
                "_id": 1,
                "created_at": 1,
                "expires_at": 1,
                "ip_address": 1,
                "user_agent": 1
            }
        ))
        
        # Format tokens
        sessions = []
        for token in tokens:
            sessions.append({
                "id": str(token['_id']),
                "created_at": token.get('created_at'),
                "expires_at": token.get('expires_at'),
                "ip_address": token.get('ip_address'),
                "user_agent": token.get('user_agent')
            })
        
        return create_response(
            success=True,
            data={"sessions": sessions}
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)

@auth.route('/sessions/<session_id>', methods=['DELETE'])
@token_required
def revoke_session(session_id):
    """
    Revoke a specific session (refresh token)
    Requires authentication
    """
    try:
        user_id = g.user_id
        
        # Delete refresh token
        db = mongo.db
        result = db.refresh_tokens.delete_one({
            "_id": ObjectId(session_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            return create_response(success=False, error="Session not found or not owned by you", status_code=404)
        
        return create_response(
            success=True,
            message="Session revoked successfully"
        )
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return create_response(success=False, error="Database error", status_code=500)
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return create_response(success=False, error="An error occurred", status_code=500)