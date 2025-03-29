from flask import Flask
from flask_cors import CORS
from flask_pymongo import PyMongo
from app.config import Config

mongo = PyMongo()


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    mongo.init_app(app)
    # jwt.init_app(app)
    
    # Allow CORS for specific origins and methods
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Register blueprints
    from app.routes.auth import auth
    # from app.routes.courses import courses_bp
    from app.routes.units import units
    # from app.routes.notes import notes_bp
    from app.routes.pastpapers import pastpapers
    from app.routes.saved import saved_items
    from app.routes.ratings import ratings
    
    app.register_blueprint(auth, url_prefix='/api/auth')
    # app.register_blueprint(courses_bp, url_prefix='/api/courses')
    app.register_blueprint(units, url_prefix='/api/units')
    # app.register_blueprint(notes_bp, url_prefix='/api/notes')
    app.register_blueprint(pastpapers, url_prefix='/api/pastpapers')
    app.register_blueprint(saved_items, url_prefix='/api/saved-items')
    app.register_blueprint(ratings, url_prefix='/api/ratings')

    
    return app

    



