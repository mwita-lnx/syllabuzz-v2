# server/app/utils/validation.py
# Enhanced validation utilities

import re
from bson import ObjectId
from functools import wraps
from flask import request
from .error_handler import ValidationError
import mimetypes
import os

def validate_objectid(value, field_name="ID"):
    """Validate MongoDB ObjectId"""
    if not value:
        raise ValidationError(f"{field_name} is required")
    
    if not ObjectId.is_valid(value):
        raise ValidationError(f"Invalid {field_name} format")
    
    return ObjectId(value)

def validate_email(email):
    """Validate email format"""
    if not email:
        raise ValidationError("Email is required")
    
    email_pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(email_pattern, email):
        raise ValidationError("Invalid email format")
    
    return email.lower().strip()

def validate_password(password):
    """Validate password strength"""
    if not password:
        raise ValidationError("Password is required")
    
    min_length = int(os.environ.get('PASSWORD_MIN_LENGTH', 8))
    
    if len(password) < min_length:
        raise ValidationError(f"Password must be at least {min_length} characters long")
    
    if not re.search(r'[a-z]', password):
        raise ValidationError("Password must contain at least one lowercase letter")
    
    if not re.search(r'[A-Z]', password):
        raise ValidationError("Password must contain at least one uppercase letter")
    
    if not re.search(r'\d', password):
        raise ValidationError("Password must contain at least one number")
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError("Password must contain at least one special character")
    
    return password

def validate_file_upload(file, allowed_extensions=None, max_size_mb=50):
    """Validate file upload"""
    if not file:
        raise ValidationError("No file provided")
    
    if file.filename == '':
        raise ValidationError("No file selected")
    
    # Check file extension
    if allowed_extensions:
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        if file_ext not in allowed_extensions:
            raise ValidationError(f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}")
    
    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    max_size_bytes = max_size_mb * 1024 * 1024
    if file_size > max_size_bytes:
        raise ValidationError(f"File size exceeds {max_size_mb}MB limit")
    
    # Validate MIME type
    mime_type, _ = mimetypes.guess_type(file.filename)
    if allowed_extensions and mime_type:
        allowed_mimes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'ppt': 'application/vnd.ms-powerpoint',
            'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        }
        
        expected_mime = None
        for ext in allowed_extensions:
            if ext in allowed_mimes and file.filename.lower().endswith(f'.{ext}'):
                expected_mime = allowed_mimes[ext]
                break
        
        if expected_mime and mime_type != expected_mime:
            raise ValidationError(f"File content does not match extension")
    
    return file

def validate_pagination(page=None, limit=None, max_limit=100):
    """Validate pagination parameters"""
    try:
        page = int(page) if page else 1
        limit = int(limit) if limit else 20
    except (ValueError, TypeError):
        raise ValidationError("Page and limit must be integers")
    
    if page < 1:
        raise ValidationError("Page must be greater than 0")
    
    if limit < 1:
        raise ValidationError("Limit must be greater than 0")
    
    if limit > max_limit:
        raise ValidationError(f"Limit cannot exceed {max_limit}")
    
    return page, limit

def validate_search_query(query, min_length=2, max_length=200):
    """Validate search query"""
    if not query:
        raise ValidationError("Search query is required")
    
    query = query.strip()
    
    if len(query) < min_length:
        raise ValidationError(f"Search query must be at least {min_length} characters")
    
    if len(query) > max_length:
        raise ValidationError(f"Search query cannot exceed {max_length} characters")
    
    # Prevent potentially malicious queries
    dangerous_patterns = [
        r'\$',  # MongoDB injection
        r'<script',  # XSS
        r'javascript:',  # XSS
        r'eval\(',  # Code injection
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, query, re.IGNORECASE):
            raise ValidationError("Invalid characters in search query")
    
    return query

def validate_json_body(required_fields=None, optional_fields=None):
    """Decorator to validate JSON request body"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                raise ValidationError("Request must be JSON")
            
            data = request.get_json()
            if not data:
                raise ValidationError("Request body is required")
            
            # Check required fields
            if required_fields:
                for field in required_fields:
                    if field not in data or data[field] is None:
                        raise ValidationError(f"Field '{field}' is required")
            
            # Check for unexpected fields
            if optional_fields is not None:
                allowed_fields = set(required_fields or []) | set(optional_fields or [])
                unexpected_fields = set(data.keys()) - allowed_fields
                if unexpected_fields:
                    raise ValidationError(f"Unexpected fields: {', '.join(unexpected_fields)}")
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def validate_rate_limit_key(key):
    """Validate rate limiting key"""
    if not key:
        raise ValidationError("Rate limit key is required")
    
    # Sanitize key to prevent injection
    sanitized_key = re.sub(r'[^a-zA-Z0-9:._-]', '', key)
    if len(sanitized_key) != len(key):
        raise ValidationError("Invalid characters in rate limit key")
    
    return sanitized_key

class QueryValidator:
    """Helper class for validating database queries"""
    
    @staticmethod
    def validate_sort_field(field, allowed_fields):
        """Validate sort field"""
        if field not in allowed_fields:
            raise ValidationError(f"Invalid sort field. Allowed fields: {', '.join(allowed_fields)}")
        return field
    
    @staticmethod
    def validate_filter_value(value, field_type='string'):
        """Validate filter value based on type"""
        if field_type == 'objectid':
            return validate_objectid(value)
        elif field_type == 'email':
            return validate_email(value)
        elif field_type == 'string':
            if not isinstance(value, str):
                raise ValidationError(f"Filter value must be a string")
            return value.strip()
        elif field_type == 'int':
            try:
                return int(value)
            except (ValueError, TypeError):
                raise ValidationError(f"Filter value must be an integer")
        elif field_type == 'bool':
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                return value.lower() in ('true', '1', 'yes', 'on')
            raise ValidationError(f"Filter value must be a boolean")
        else:
            return value