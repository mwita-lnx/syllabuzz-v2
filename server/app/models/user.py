# app/models/user.py
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from app import mongo

class User:
    collection = mongo.db.users
    
    @staticmethod
    def create_user(email, password, name, role='student'):
        """Create a new user"""
        user = {
            'email': email,
            'password_hash': generate_password_hash(password),
            'name': name,
            'role': role,  # 'student' or 'instructor'
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = User.collection.insert_one(user)
        user['_id'] = result.inserted_id
        return user
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        return User.collection.find_one({'email': email})
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password"""
        if not user or not 'password_hash' in user:
            return False
        return check_password_hash(user['password_hash'], password)
