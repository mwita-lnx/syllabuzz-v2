from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from pymongo.errors import PyMongoError
from app import mongo
import jwt
import bcrypt

auth = Blueprint('auth', __name__)
JWT_SECRET = 'your_secret_key' 

@auth.route('/register', methods=['POST'])
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
       # Replace with your actual secret key
        db = mongo.db
        data = request.json
        # Validate required fields
        required_fields = ['email', 'password', 'name', 'faculty']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Check if email already exists
        existing_user = db.users.find_one({"email": data['email']})
        if existing_user:
            return jsonify({"success": False, "error": "Email already registered"}), 409
        
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
            "created_at": datetime.utcnow()
        }
        
        # Insert user
        result = db.users.insert_one(new_user)
        
        # Generate JWT token
        token_payload = {
            "user_id": str(result.inserted_id),
            "email": data['email'],
            "role": new_user['role'],
            "name": new_user['name'],
            "exp": datetime.utcnow() + timedelta(days=30)  # Token expires in 30 days
        }
        
        token = jwt.encode(
            token_payload,
           JWT_SECRET,
            algorithm='HS256'
        )
        
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": str(result.inserted_id),
                "email": new_user['email'],
                "name": new_user['name'],
                "faculty": new_user['faculty'],
                "role": new_user['role']
            }
        }), 201
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@auth.route('/login', methods=['POST'])
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
            return jsonify({"success": False, "error": "Email and password are required"}), 400
        
        # Find user by email
        user = db.users.find_one({"email": data['email'].lower()})
        
        if not user:
            return jsonify({"success": False, "error": "Invalid email or password"}), 401
        
        # Verify password
        if not bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
            return jsonify({"success": False, "error": "Invalid email or password"}), 401
        
        # Generate JWT token
        token_payload = {
            "user_id": str(user['_id']),
            "email": user['email'],
            "role": user['role'],
            'name': user['name'],
            "exp": datetime.utcnow() + timedelta(days=30)  # Token expires in 30 days
        }
        
        token = jwt.encode(
            token_payload,
           JWT_SECRET,
            algorithm='HS256'
        )
        
        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": token,
            "user": {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "faculty": user['faculty'],
                "role": user['role']
            }
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@auth.route('/profile', methods=['GET'])
def get_profile():
    """
    Get user profile
    Requires authentication
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "Authentication token is missing"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
               JWT_SECRET,
                algorithms=['HS256']
            )
            
            user_id = payload['user_id']
            
            # Get user profile
            db = mongo.db
            user = db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            # Return user profile without password
            user_data = {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "faculty": user['faculty'],
                "units": user['units'],
                "role": user['role']
            }
            
            return jsonify({
                "success": True,
                "data": user_data
            })
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@auth.route('/profile', methods=['PUT'])
def update_profile():
    """
    Update user profile
    Requires authentication
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "Authentication token is missing"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
               JWT_SECRET,
                algorithms=['HS256']
            )
            
            user_id = payload['user_id']
            data = request.json
            
            if not data:
                return jsonify({"success": False, "error": "No data provided"}), 400
            
            # Fields that can be updated
            allowed_fields = ['name', 'faculty', 'units']
            update_data = {}
            
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if not update_data:
                return jsonify({"success": False, "error": "No valid fields to update"}), 400
            
            # Update user profile
            db = mongo.db
            result = db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            
            if result.matched_count == 0:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            # Get updated user profile
            user = db.users.find_one({"_id": ObjectId(user_id)})
            
            # Return updated user profile without password
            user_data = {
                "id": str(user['_id']),
                "email": user['email'],
                "name": user['name'],
                "faculty": user['faculty'],
                "units": user['units'],
                "role": user['role']
            }
            
            return jsonify({
                "success": True,
                "message": "Profile updated successfully",
                "data": user_data
            })
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@auth.route('/password', methods=['PUT'])
def change_password():
    """
    Change user password
    Requires authentication
    Required body parameters:
    - current_password: User's current password
    - new_password: User's new password
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "Authentication token is missing"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
               JWT_SECRET,
                algorithms=['HS256']
            )
            
            user_id = payload['user_id']
            data = request.json
            
            # Validate required fields
            if not data or 'current_password' not in data or 'new_password' not in data:
                return jsonify({"success": False, "error": "Current and new passwords are required"}), 400
            
            # Get user
            db = mongo.db
            user = db.users.find_one({"_id": ObjectId(user_id)})
            
            if not user:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            # Verify current password
            if not bcrypt.checkpw(data['current_password'].encode('utf-8'), user['password']):
                return jsonify({"success": False, "error": "Current password is incorrect"}), 401
            
            # Hash new password
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(data['new_password'].encode('utf-8'), salt)
            
            # Update password
            result = db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"password": hashed_password}}
            )
            
            if result.matched_count == 0:
                return jsonify({"success": False, "error": "User not found"}), 404
            
            return jsonify({
                "success": True,
                "message": "Password changed successfully"
            })
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401
            
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500
    

@auth.route('/verify', methods=['POST'])
def verify_token():
    """
    Verify JWT token
    Requires authentication
    """
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"success": False, "error": "Authentication token is missing"}), 401
        
        token = auth_header.split(' ')[1]
        
        try:
            # Decode and validate token
            payload = jwt.decode(
                token,
               JWT_SECRET,
                algorithms=['HS256']
            )
            
            return jsonify({
                "success": True,
                "message": "Token is valid",
                "data": payload
            })
            
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "error": "Invalid token"}), 401
            
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500