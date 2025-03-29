
# app/models/course.py
from datetime import datetime
from bson import ObjectId
from app import mongo

class Course:
    collection = mongo.db.courses
    
    @staticmethod
    def create(name, code, description, instructor_id):
        """Create a new course"""
        course = {
            'name': name,
            'code': code,
            'description': description,
            'instructor_id': ObjectId(instructor_id),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = Course.collection.insert_one(course)
        course['_id'] = result.inserted_id
        return course
    
    @staticmethod
    def get_by_id(course_id):
        """Get course by ID"""
        return Course.collection.find_one({'_id': ObjectId(course_id)})
    
    @staticmethod
    def get_instructor_courses(instructor_id):
        """Get all courses by instructor"""
        return list(Course.collection.find({'instructor_id': ObjectId(instructor_id)}))
    
    @staticmethod
    def get_all():
        """Get all courses"""
        return list(Course.collection.find())
