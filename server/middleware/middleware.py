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

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize Redis for token blacklisting (optional - can be enabled in production)
# redis_client = redis.Redis(host='localhost', port=6379, db=0)

auth = Blueprint('auth', __name__)

# Define standard response format
def create_response(success=True, message=None, data=None, error=None, status_code=200):
    """Create a standardized response format"""
    response = {
        "success": success
    }
    
    if message:
        response["message"] = message
    if data is not None:
        response["data"] = data
    if error:
        response["error"] = error
        
    return jsonify(response), status_code

# Authentication decorator for protected routes
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
            g.current_user = payload
            g.user_id = user_id
            
            return f(*args, **kwargs)
            
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
            if not g.current_user:
                return create_response(success=False, error="Authentication required", status_code=401)
                
            user_role = g.current_user.get('role')
            
            if user_role not in roles:
                return create_response(success=False, error="Insufficient permissions", status_code=403)
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
