
# app/models/note.py
from datetime import datetime
from bson import ObjectId
from app import mongo

class Note:
    collection = mongo.db.notes
    
    @staticmethod
    def create(title, content, unit_id, topic, pdf_path=None, page_numbers=None, 
               embeddings=None, section_id=None):
        """Create a new note section"""
        note = {
            'title': title,
            'content': content,
            'unit_id': ObjectId(unit_id),
            'topic': topic,
            'pdf_path': pdf_path,
            'page_numbers': page_numbers or [],
            'embeddings': embeddings,  # Vector embeddings for content
            'section_id': section_id,  # For hierarchical organization
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = Note.collection.insert_one(note)
        note['_id'] = result.inserted_id
        return note
    
    @staticmethod
    def get_by_id(note_id):
        """Get note by ID"""
        return Note.collection.find_one({'_id': ObjectId(note_id)})
    
    @staticmethod
    def get_unit_notes(unit_id):
        """Get all notes for a unit"""
        return list(Note.collection.find({'unit_id': ObjectId(unit_id)}))
    
    @staticmethod
    def get_topic_notes(unit_id, topic):
        """Get notes for a specific topic in a unit"""
        return list(Note.collection.find({
            'unit_id': ObjectId(unit_id),
            'topic': topic
        }))