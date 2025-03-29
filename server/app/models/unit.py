
# app/models/unit.py
from datetime import datetime
from bson import ObjectId
from app import mongo

class Unit:
    collection = mongo.db.units
    
    @staticmethod
    def create(name, code, description, course_id):
        """Create a new unit"""
        unit = {
            'name': name,
            'code': code,
            'description': description,
            'course_id': ObjectId(course_id),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = Unit.collection.insert_one(unit)
        unit['_id'] = result.inserted_id
        return unit
    
    @staticmethod
    def get_by_id(unit_id):
        """Get unit by ID"""
        return Unit.collection.find_one({'_id': ObjectId(unit_id)})
    
    @staticmethod
    def get_course_units(course_id):
        """Get all units in a course"""
        return list(Unit.collection.find({'course_id': ObjectId(course_id)}))
