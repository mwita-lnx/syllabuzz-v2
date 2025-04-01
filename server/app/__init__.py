from flask import Flask, jsonify
from flask_cors import CORS
from flask_pymongo import PyMongo
from app.config import Config
import logging
from logging.handlers import RotatingFileHandler
import os
from werkzeug.exceptions import HTTPException

# Initialize extensions
mongo = PyMongo()

upload_folder = os.path.join(os.path.dirname(__file__), '../uploads')


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Setup logging
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        file_handler = RotatingFileHandler('logs/app.log', maxBytes=10240, backupCount=10)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Notes App startup')
    
    # Initialize extensions
    mongo.init_app(app)
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Register blueprints
    from app.routes.auth import auth
    from app.routes.units import units_bp
    from app.routes.notes import notes_bp
    from app.routes.pastpapers import pastpapers
    from app.routes.saved import saved_items
    from app.routes.ratings import ratings
    
    app.register_blueprint(auth, url_prefix='/api/auth')
    app.register_blueprint(units_bp, url_prefix='/api/units')
    app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(pastpapers, url_prefix='/api/pastpapers')
    app.register_blueprint(saved_items, url_prefix='/api/saved-items')
    app.register_blueprint(ratings, url_prefix='/api/ratings')
    
    # Error handlers
    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        """Handle HTTP exceptions"""
        response = e.get_response()
        response.data = jsonify({
            "status": "error",
            "code": e.code,
            "name": e.name,
            "message": e.description,
        }).data
        response.content_type = "application/json"
        return response
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle other exceptions"""
        app.logger.error(f"Unhandled exception: {str(e)}")
        return jsonify({
            "status": "error",
            "message": "An unexpected error occurred",
        }), 500
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint"""
        return jsonify({
            "status": "success",
            "message": "Notes API is running"
        })
    
    return app