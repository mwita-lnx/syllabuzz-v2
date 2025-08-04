# server/app/utils/database.py
# Database utilities and transaction support

from contextlib import contextmanager
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from app import mongo
from .error_handler import AppError
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

@contextmanager
def db_transaction():
    """Context manager for MongoDB transactions"""
    client = mongo.cx
    session = client.start_session()
    
    try:
        with session.start_transaction():
            yield session
            # Transaction is automatically committed if no exception
    except Exception as e:
        # Transaction is automatically aborted on exception
        logger.error(f"Database transaction failed: {str(e)}")
        raise AppError(f"Database operation failed: {str(e)}", 500)
    finally:
        session.end_session()

def safe_find_one(collection, query, error_message="Document not found"):
    """Safely find one document with proper error handling"""
    try:
        document = collection.find_one(query)
        if not document:
            raise AppError(error_message, 404)
        return document
    except PyMongoError as e:
        logger.error(f"Database query failed: {str(e)}")
        raise AppError("Database query failed", 500)

def safe_insert_one(collection, document, error_message="Failed to create document"):
    """Safely insert document with error handling"""
    try:
        result = collection.insert_one(document)
        if not result.inserted_id:
            raise AppError(error_message, 500)
        return result
    except PyMongoError as e:
        logger.error(f"Database insert failed: {str(e)}")
        if e.code == 11000:  # Duplicate key error
            raise AppError("Resource already exists", 409)
        raise AppError(error_message, 500)

def safe_update_one(collection, query, update, error_message="Failed to update document"):
    """Safely update document with error handling"""
    try:
        result = collection.update_one(query, update)
        if result.matched_count == 0:
            raise AppError("Document not found", 404)
        return result
    except PyMongoError as e:
        logger.error(f"Database update failed: {str(e)}")
        raise AppError(error_message, 500)

def safe_delete_one(collection, query, error_message="Failed to delete document"):
    """Safely delete document with error handling"""
    try:
        result = collection.delete_one(query)
        if result.deleted_count == 0:
            raise AppError("Document not found", 404)
        return result
    except PyMongoError as e:
        logger.error(f"Database delete failed: {str(e)}")
        raise AppError(error_message, 500)

def paginate_query(collection, query, page=1, limit=20, sort=None):
    """Execute paginated query with consistent error handling"""
    try:
        # Get total count
        total_count = collection.count_documents(query)
        
        # Calculate pagination
        skip = (page - 1) * limit
        total_pages = (total_count + limit - 1) // limit
        
        # Execute query
        cursor = collection.find(query).skip(skip).limit(limit)
        
        if sort:
            cursor = cursor.sort(sort)
        
        documents = list(cursor)
        
        return {
            'documents': documents,
            'pagination': {
                'total': total_count,
                'page': page,
                'limit': limit,
                'pages': total_pages,
                'has_next': page < total_pages,
                'has_prev': page > 1
            }
        }
    except PyMongoError as e:
        logger.error(f"Paginated query failed: {str(e)}")
        raise AppError("Database query failed", 500)

def create_indexes():
    """Create database indexes for better performance"""
    try:
        db = mongo.db
        
        # Notes collection indexes
        db.notes.create_index([("unit_id", 1)])
        db.notes.create_index([("faculty", 1)])
        db.notes.create_index([("type", 1)])
        db.notes.create_index([("created_at", -1)])
        db.notes.create_index([("title", "text"), ("description", "text")])
        
        # Users collection indexes
        db.users.create_index([("email", 1)], unique=True)
        db.users.create_index([("faculty", 1)])
        db.users.create_index([("role", 1)])
        
        # Refresh tokens indexes
        db.refresh_tokens.create_index([("user_id", 1)])
        db.refresh_tokens.create_index([("expires_at", 1)], expireAfterSeconds=0)
        db.refresh_tokens.create_index([("token", 1)])
        
        # Password resets indexes
        db.password_resets.create_index([("user_id", 1)])
        db.password_resets.create_index([("token", 1)])
        db.password_resets.create_index([("expires_at", 1)], expireAfterSeconds=0)
        
        # References collection indexes
        db.references.create_index([("note_id", 1)])
        
        # Units collection indexes
        db.units.create_index([("course_id", 1)])
        db.units.create_index([("code", 1)])
        db.units.create_index([("name", "text"), ("description", "text")])
        
        logger.info("Database indexes created successfully")
        
    except PyMongoError as e:
        logger.error(f"Failed to create indexes: {str(e)}")
        raise AppError("Failed to create database indexes", 500)

def cleanup_expired_data():
    """Clean up expired data (tokens, reset codes, etc.)"""
    try:
        db = mongo.db
        from datetime import datetime
        
        current_time = datetime.utcnow()
        
        # Clean expired refresh tokens
        result1 = db.refresh_tokens.delete_many({"expires_at": {"$lt": current_time}})
        
        # Clean expired password reset tokens
        result2 = db.password_resets.delete_many({"expires_at": {"$lt": current_time}})
        
        # Clean used password reset tokens older than 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        result3 = db.password_resets.delete_many({
            "used": True,
            "used_at": {"$lt": seven_days_ago}
        })
        
        logger.info(f"Cleanup completed: {result1.deleted_count} refresh tokens, "
                   f"{result2.deleted_count} reset tokens, {result3.deleted_count} used reset tokens")
        
        return {
            'refresh_tokens_deleted': result1.deleted_count,
            'reset_tokens_deleted': result2.deleted_count,
            'used_reset_tokens_deleted': result3.deleted_count
        }
        
    except PyMongoError as e:
        logger.error(f"Data cleanup failed: {str(e)}")
        raise AppError("Data cleanup failed", 500)