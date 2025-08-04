# server/app/utils/error_handler.py
# Standardized error handling utilities for Flask services

from flask import jsonify, current_app
from datetime import datetime
import traceback
import os

class AppError(Exception):
    """Base application error class"""
    def __init__(self, message, status_code=500, error_code=None, details=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or 'UNKNOWN_ERROR'
        self.details = details
    
    def to_dict(self):
        error_dict = {
            'message': self.message,
            'code': self.error_code
        }
        
        if self.details:
            error_dict['details'] = self.details
            
        # Add stack trace in development
        if os.environ.get('FLASK_DEBUG', 'False') == 'True':
            error_dict['stack'] = traceback.format_exc()
            
        return error_dict

class ValidationError(AppError):
    """Validation error"""
    def __init__(self, message, details=None):
        super().__init__(message, 400, 'VALIDATION_ERROR', details)

class AuthenticationError(AppError):
    """Authentication error"""
    def __init__(self, message='Authentication required'):
        super().__init__(message, 401, 'AUTHENTICATION_ERROR')

class AuthorizationError(AppError):
    """Authorization error"""
    def __init__(self, message='Insufficient permissions'):
        super().__init__(message, 403, 'AUTHORIZATION_ERROR')

class NotFoundError(AppError):
    """Resource not found error"""
    def __init__(self, resource='Resource'):
        super().__init__(f"{resource} not found", 404, 'NOT_FOUND_ERROR')

class ConflictError(AppError):
    """Resource conflict error"""
    def __init__(self, message='Resource already exists'):
        super().__init__(message, 409, 'CONFLICT_ERROR')

class RateLimitError(AppError):
    """Rate limit exceeded error"""
    def __init__(self, message='Too many requests'):
        super().__init__(message, 429, 'RATE_LIMIT_ERROR')

def create_response(success=True, data=None, error=None, message=None, status_code=200):
    """Create standardized API response"""
    response = {
        'success': success,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response['data'] = data
    if message:
        response['message'] = message
    if error:
        if isinstance(error, AppError):
            response['error'] = error.to_dict()
        else:
            response['error'] = {
                'message': str(error),
                'code': 'UNKNOWN_ERROR'
            }
    
    return jsonify(response), status_code

def handle_error(error):
    """Handle different types of errors and return appropriate response"""
    
    # Log the error
    if current_app:
        current_app.logger.error(f"Error occurred: {str(error)}", exc_info=True)
    
    # Handle AppError instances
    if isinstance(error, AppError):
        return create_response(success=False, error=error, status_code=error.status_code)
    
    # Handle common MongoDB errors
    if hasattr(error, 'code'):
        if error.code == 11000:  # Duplicate key error
            return create_response(
                success=False, 
                error=ConflictError('Resource already exists'),
                status_code=409
            )
    
    # Handle JWT errors
    error_name = error.__class__.__name__
    if error_name == 'ExpiredSignatureError':
        return create_response(
            success=False,
            error=AuthenticationError('Token has expired'),
            status_code=401
        )
    elif error_name == 'InvalidTokenError':
        return create_response(
            success=False,
            error=AuthenticationError('Invalid token'),
            status_code=401
        )
    
    # Handle validation errors from marshmallow or similar
    if error_name == 'ValidationError':
        return create_response(
            success=False,
            error=ValidationError(str(error)),
            status_code=400
        )
    
    # Handle generic exceptions
    return create_response(
        success=False,
        error=AppError('Internal server error', 500, 'INTERNAL_ERROR'),
        status_code=500
    )

def register_error_handlers(app):
    """Register error handlers with Flask app"""
    
    @app.errorhandler(AppError)
    def handle_app_error(error):
        return create_response(success=False, error=error, status_code=error.status_code)
    
    @app.errorhandler(404)
    def handle_not_found(error):
        return create_response(
            success=False,
            error=NotFoundError('Route'),
            status_code=404
        )
    
    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        return create_response(
            success=False,
            error=AppError('Method not allowed', 405, 'METHOD_NOT_ALLOWED'),
            status_code=405
        )
    
    @app.errorhandler(500)
    def handle_internal_error(error):
        return create_response(
            success=False,
            error=AppError('Internal server error', 500, 'INTERNAL_ERROR'),
            status_code=500
        )
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        return handle_error(error)