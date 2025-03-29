
# app/models/question.py
from datetime import datetime
from bson import ObjectId
from app import mongo

class Question:
    collection = mongo.db.questions
    
    @staticmethod
    def create(text, unit_id, source_type, source_id, year=None, embedding=None, 
               related_sections=None, difficulty=None, frequency=1, group_id=None):
        """
        Create a new question
        source_type: 'exam' or 'cat'
        """
        question = {
            'text': text,
            'unit_id': ObjectId(unit_id),
            'source_type': source_type,  # 'exam' or 'cat'
            'source_id': source_id,  # ID of the exam or CAT
            'year': year,
            'embedding': embedding,  # Vector embedding
            'related_sections': related_sections or [],  # List of related note section IDs
            'difficulty': difficulty,
            'frequency': frequency,  # How many times this or similar questions appeared
            'group_id': group_id,  # ID of the question group (for similar questions)
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = Question.collection.insert_one(question)
        question['_id'] = result.inserted_id
        return question
    
    @staticmethod
    def get_by_id(question_id):
        """Get question by ID"""
        return Question.collection.find_one({'_id': ObjectId(question_id)})
    
    @staticmethod
    def get_unit_questions(unit_id):
        """Get all questions for a unit"""
        return list(Question.collection.find({'unit_id': ObjectId(unit_id)}))
    
    @staticmethod
    def get_questions_by_group(group_id):
        """Get all questions in a group"""
        return list(Question.collection.find({'group_id': group_id}))
    
    @staticmethod
    def get_frequent_questions(unit_id, min_frequency=2):
        """Get questions that appear frequently"""
        return list(Question.collection.find({
            'unit_id': ObjectId(unit_id),
            'frequency': {'$gte': min_frequency}
        }))
    
    @staticmethod
    def update_frequency(question_id):
        """Increment question frequency"""
        Question.collection.update_one(
            {'_id': ObjectId(question_id)},
            {'$inc': {'frequency': 1}}
        )
