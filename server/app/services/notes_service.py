# notes_service.py
from pymongo import MongoClient, DESCENDING, ASCENDING
from bson import ObjectId
from datetime import datetime
import os

class NotesService:
    """Service class for handling notes operations with MongoDB"""
    
    def __init__(self, mongo_uri='mongodb://localhost:27017/', db_name='syllabuzz'):
        """Initialize the notes service with MongoDB connection"""
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.notes_collection = self.db['notes']
        self.references_collection = self.db['references']
        self.bookmarks_collection = self.db['bookmarks']
        self.highlights_collection = self.db['highlights']
        
        # Create indexes for better query performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create MongoDB indexes for better query performance"""
        # Notes collection indexes
        self.notes_collection.create_index([('title', 'text'), ('description', 'text')])
        self.notes_collection.create_index([('facultyCode', ASCENDING)])
        self.notes_collection.create_index([('type', ASCENDING)])
        self.notes_collection.create_index([('unit_id', ASCENDING)])
        self.notes_collection.create_index([('published_at', DESCENDING)])
        
        # References collection indexes
        self.references_collection.create_index([('note_id', ASCENDING)])
        self.references_collection.create_index([('pageNumber', ASCENDING)])
        
        # Bookmarks collection indexes
        self.bookmarks_collection.create_index([('user_id', ASCENDING)])
        self.bookmarks_collection.create_index([('note_id', ASCENDING)])
        
        # Highlights collection indexes
        self.highlights_collection.create_index([('user_id', ASCENDING)])
        self.highlights_collection.create_index([('note_id', ASCENDING)])
    
    def _format_doc(self, doc):
        """Convert MongoDB ObjectId to string and handle date formatting"""
        if doc is None:
            return None
        
        result = dict(doc)
        result['_id'] = str(doc['_id'])
        
        # Format datetime fields
        for field in ['created_at', 'updated_at']:
            if field in result and isinstance(result[field], datetime):
                result[field] = result[field].isoformat()
        
        return result
    
    def get_all_notes(self, filters=None, sort_by='recent', page=1, limit=20):
        """Get all notes with optional filtering and pagination"""
        query = filters or {}
        
        # Define sorting options
        sort_options = {
            'recent': [('published_at', DESCENDING)],
            'relevance': [('relevance_score', DESCENDING)],
            'az': [('title', ASCENDING)],
            'za': [('title', DESCENDING)]
        }
        
        # Count total documents for pagination
        total = self.notes_collection.count_documents(query)
        
        # Get notes with pagination
        notes = list(self.notes_collection.find(query)
                    .sort(sort_options.get(sort_by, sort_options['recent']))
                    .skip((page - 1) * limit)
                    .limit(limit))
        
        # Format notes
        formatted_notes = [self._format_doc(note) for note in notes]
        
        return {
            'notes': formatted_notes,
            'total': total,
            'page': page,
            'limit': limit,
            'pages': (total + limit - 1) // limit  # Ceiling division
        }
    
    def get_note_by_id(self, note_id):
        """Get a note by its ID with references"""
        try:
            # Convert string ID to ObjectId
            note_id_obj = ObjectId(note_id)
            
            # Get the note
            note = self.notes_collection.find_one({'_id': note_id_obj})
            if not note:
                return None
            
            # Get references for this note
            references = list(self.references_collection.find({'note_id': note_id}))
            formatted_references = [self._format_doc(ref) for ref in references]
            
            # Format the note
            formatted_note = self._format_doc(note)
            formatted_note['references'] = formatted_references
            
            return formatted_note
            
        except Exception as e:
            print(f"Error getting note: {str(e)}")
            return None
    
    def create_note(self, note_data, file_path=None, user_id=None):
        """Create a new note"""
        try:
            # Prepare the note document
            new_note = {
                'title': note_data.get('title', ''),
                'description': note_data.get('description', ''),
                'file_path': file_path,
                'url': note_data.get('url', ''),
                'source_name': note_data.get('source_name', ''),
                'published_at': note_data.get('published_at', datetime.now().strftime('%Y-%m-%d')),
                'type': note_data.get('type', 'notes'),
                'faculty': note_data.get('faculty', ''),
                'facultyCode': note_data.get('facultyCode', ''),
                'unit_id': note_data.get('unit_id', None),
                'unit_name': note_data.get('unit_name', ''),
                'unit_code': note_data.get('unit_code', ''),
                'categories': note_data.get('categories', []),
                'author': note_data.get('author', ''),
                'institution': note_data.get('institution', ''),
                'total_pages': note_data.get('total_pages', 0),
                'created_at': datetime.now(),
                'created_by': user_id
            }
            
            # Add metadata if provided
            if 'metadata' in note_data:
                new_note['metadata'] = note_data['metadata']
            
            # Insert the note
            result = self.notes_collection.insert_one(new_note)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error creating note: {str(e)}")
            return None
    
    def update_note(self, note_id, update_data):
        """Update a note"""
        try:
            # Convert string ID to ObjectId
            note_id_obj = ObjectId(note_id)
            
            # Fields that can be updated
            allowed_fields = [
                'title', 'description', 'source_name', 'published_at', 
                'type', 'faculty', 'facultyCode', 'categories', 
                'author', 'institution', 'metadata'
            ]
            
            # Filter allowed fields
            update_fields = {k: v for k, v in update_data.items() if k in allowed_fields}
            update_fields['updated_at'] = datetime.now()
            
            # Update the note
            result = self.notes_collection.update_one(
                {'_id': note_id_obj},
                {'$set': update_fields}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error updating note: {str(e)}")
            return False
    
    def delete_note(self, note_id):
        """Delete a note and its references"""
        try:
            # Convert string ID to ObjectId
            note_id_obj = ObjectId(note_id)
            
            # Get the note to check file path
            note = self.notes_collection.find_one({'_id': note_id_obj})
            if not note:
                return False
            
            # Delete the file if it exists
            if 'file_path' in note and os.path.exists(note['file_path']):
                os.remove(note['file_path'])
            
            # Delete references
            self.references_collection.delete_many({'note_id': note_id})
            
            # Delete bookmarks
            self.bookmarks_collection.delete_many({'note_id': note_id})
            
            # Delete highlights
            self.highlights_collection.delete_many({'note_id': note_id})
            
            # Delete the note
            result = self.notes_collection.delete_one({'_id': note_id_obj})
            
            return result.deleted_count > 0
            
        except Exception as e:
            print(f"Error deleting note: {str(e)}")
            return False
    
    def add_reference(self, note_id, reference_data):
        """Add a reference to a note"""
        try:
            # Prepare the reference document
            new_reference = {
                'note_id': note_id,
                'pageNumber': reference_data.get('pageNumber'),
                'text': reference_data.get('text', ''),
                'title': reference_data.get('title', f"Reference on page {reference_data.get('pageNumber')}"),
                'created_at': datetime.now()
            }
            
            # Add metadata if provided
            if 'metadata' in reference_data:
                new_reference['metadata'] = reference_data['metadata']
            
            # Insert the reference
            result = self.references_collection.insert_one(new_reference)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error adding reference: {str(e)}")
            return None
    
    def get_references(self, note_id):
        """Get all references for a note"""
        try:
            references = list(self.references_collection.find({'note_id': note_id}))
            return [self._format_doc(ref) for ref in references]
            
        except Exception as e:
            print(f"Error getting references: {str(e)}")
            return []
    
    def add_bookmark(self, user_id, note_id, page_number, title=None):
        """Add a bookmark for a user"""
        try:
            # Check if bookmark already exists
            existing = self.bookmarks_collection.find_one({
                'user_id': user_id,
                'note_id': note_id,
                'pageNumber': page_number
            })
            
            if existing:
                return str(existing['_id'])
            
            # Create new bookmark
            bookmark = {
                'user_id': user_id,
                'note_id': note_id,
                'pageNumber': page_number,
                'title': title or f"Bookmark on page {page_number}",
                'created_at': datetime.now()
            }
            
            result = self.bookmarks_collection.insert_one(bookmark)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error adding bookmark: {str(e)}")
            return None
    
    def get_user_bookmarks(self, user_id):
        """Get all bookmarks for a user"""
        try:
            bookmarks = list(self.bookmarks_collection.find({'user_id': user_id}))
            formatted_bookmarks = []
            
            for bookmark in bookmarks:
                # Get note information
                note_id = bookmark.get('note_id')
                note = self.notes_collection.find_one({'_id': ObjectId(note_id)}) if note_id else None
                
                formatted_bookmark = self._format_doc(bookmark)
                if note:
                    formatted_bookmark['note'] = {
                        '_id': str(note['_id']),
                        'title': note.get('title', ''),
                        'type': note.get('type', ''),
                        'faculty': note.get('faculty', '')
                    }
                
                formatted_bookmarks.append(formatted_bookmark)
            
            return formatted_bookmarks
            
        except Exception as e:
            print(f"Error getting bookmarks: {str(e)}")
            return []
    
    def add_highlight(self, user_id, note_id, highlight_data):
        """Add a highlight for a user"""
        try:
            # Prepare the highlight document
            new_highlight = {
                'user_id': user_id,
                'note_id': note_id,
                'pageNumber': highlight_data.get('pageNumber'),
                'text': highlight_data.get('text', ''),
                'color': highlight_data.get('color', '#FFFF00'),
                'created_at': datetime.now()
            }
            
            # Insert the highlight
            result = self.highlights_collection.insert_one(new_highlight)
            return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error adding highlight: {str(e)}")
            return None
    
    def get_user_highlights(self, user_id, note_id=None):
        """Get all highlights for a user, optionally filtered by note"""
        try:
            query = {'user_id': user_id}
            if note_id:
                query['note_id'] = note_id
                
            highlights = list(self.highlights_collection.find(query))
            return [self._format_doc(highlight) for highlight in highlights]
            
        except Exception as e:
            print(f"Error getting highlights: {str(e)}")
            return []

    def get_notes_by_unit(self, unit_id, page=1, limit=20):
        """Get notes related to a specific unit"""
        return self.get_all_notes(
            filters={'unit_id': unit_id},
            page=page,
            limit=limit
        )
    
    def get_notes_by_faculty(self, faculty_code, page=1, limit=20):
        """Get notes related to a specific faculty"""
        return self.get_all_notes(
            filters={'facultyCode': faculty_code},
            page=page,
            limit=limit
        )
    
    def get_notes_by_type(self, note_type, page=1, limit=20):
        """Get notes of a specific type"""
        return self.get_all_notes(
            filters={'type': note_type},
            page=page,
            limit=limit
        )