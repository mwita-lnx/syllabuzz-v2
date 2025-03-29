from flask import request, jsonify, current_app, g
from functools import wraps
import jwt
from bson.objectid import ObjectId

def token_required(f):
    """
    Decorator for routes that require a valid JWT token
    Sets g.user_id with the user ID from the token if valid
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            
        if not token:
            return jsonify({'success': False, 'error': 'Authentication token is missing'}), 401
        
        try:
            # Decode token and validate
            data = jwt.decode(
                token, 
                current_app.config['JWT_SECRET'], 
                algorithms=['HS256']
            )
            
            # Check if user exists
            user_id = data['user_id']
            db = current_app.config['MONGO_DB']
            user = db.users.find_one({'_id': ObjectId(user_id)})
            
            if not user:
                return jsonify({'success': False, 'error': 'User not found'}), 401
                
            # Set user_id in Flask's g object for use in the route handler
            g.user_id = user_id
            
        except jwt.ExpiredSignatureError:
            return jsonify({'success': False, 'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'success': False, 'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated