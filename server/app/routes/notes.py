from flask import Blueprint, request, jsonify, current_app, send_from_directory
from pymongo import MongoClient
from bson import ObjectId
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime
from functools import wraps
import jwt
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, PointIdsList, MatchAny
import fitz  # PyMuPDF for PDF processing
from app import mongo, QDRANT_HOST, QDRANT_PORT
from app.utils.validation import (
    validate_objectid, validate_file_upload, validate_pagination,
    validate_search_query, validate_json_body
)
from app.utils.error_handler import ValidationError, NotFoundError, AuthorizationError
from sentence_transformers import SentenceTransformer
import numpy as np
import hashlib
import pickle

# Initialize MongoDB client
db = mongo.db
notes_collection = db.notes
references_collection = db.references
users_collection = db.users

# REMNDER: Ensure Tto implement grpc for communication with Qdrant

# Initialize Qdrant client for vector search
qdrant_client = QdrantClient(
    host=QDRANT_HOST,
    port=QDRANT_PORT,
  
)

# Create the notes blueprint
notes_bp = Blueprint('notes', __name__, url_prefix='/api/notes')


class EmbeddingService:
    """Service for generating and caching embeddings using sentence-transformers"""
    _instance = None
    _model = None
    
    def __new__(cls, model_name='all-MiniLM-L6-v2', use_cache=True, cache_dir='embeddings_cache'):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self, model_name='all-MiniLM-L6-v2', use_cache=True, cache_dir='embeddings_cache'):
        if self._initialized:
            return
            
        self.model_name = model_name
        self.use_cache = use_cache
        self.cache_dir = cache_dir
        self._initialized = True
        
        # Create cache directory if it doesn't exist
        if use_cache and not os.path.exists(cache_dir):
            os.makedirs(cache_dir)
    
    @property
    def model(self):
        """Lazy load the model to save memory"""
        if self._model is None:
            current_app.logger.info(f"Loading embedding model: {self.model_name}")
            self._model = SentenceTransformer(self.model_name)
        return self._model
    
    def get_embedding(self, text):
        """Get embedding for a text, using cache if enabled"""
        if not self.use_cache:
            return self.model.encode(text)
        
        # Create a hash of the text for the cache key
        text_hash = hashlib.md5(text.encode()).hexdigest()
        cache_file = os.path.join(self.cache_dir, f"{text_hash}.pkl")
        
        # Check if embedding is in cache
        if os.path.exists(cache_file):
            with open(cache_file, 'rb') as f:
                return pickle.load(f)
        
        # Generate embedding
        embedding = self.model.encode(text)
        
        # Save to cache
        with open(cache_file, 'wb') as f:
            pickle.dump(embedding, f)
        
        return embedding
    
    def get_embeddings(self, texts):
        """Get embeddings for multiple texts"""
        if not self.use_cache:
            return self.model.encode(texts)
        
        # Try to get embeddings from cache first
        embeddings = []
        texts_to_encode = []
        cache_indices = []
        
        for i, text in enumerate(texts):
            text_hash = hashlib.md5(text.encode()).hexdigest()
            cache_file = os.path.join(self.cache_dir, f"{text_hash}.pkl")
            
            if os.path.exists(cache_file):
                with open(cache_file, 'rb') as f:
                    embeddings.append(pickle.load(f))
            else:
                texts_to_encode.append(text)
                cache_indices.append(i)
        
        # If there are texts not in cache, encode them
        if texts_to_encode:
            new_embeddings = self.model.encode(texts_to_encode)
            
            # Save to cache and insert at correct positions
            for idx, embedding in zip(cache_indices, new_embeddings):
                text = texts[idx]
                text_hash = hashlib.md5(text.encode()).hexdigest()
                cache_file = os.path.join(self.cache_dir, f"{text_hash}.pkl")
                
                with open(cache_file, 'wb') as f:
                    pickle.dump(embedding, f)
                
                embeddings.insert(idx, embedding)
        
        return np.array(embeddings)


# Helper function to convert ObjectId to string in MongoDB documents
def format_doc(doc):
    if doc is None:
        return None
    doc['_id'] = str(doc['_id'])
    return doc


# JWT Token validation decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            print(current_app.config['SECRET_KEY'], data)
            current_user = users_collection.find_one({'_id': ObjectId(data['user_id'])})
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception as e:
            return jsonify({'message': f'Token is invalid: {str(e)}'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# Text chunking function
def chunk_text(text, chunk_size=512, overlap=0.2):
    """Split text into overlapping chunks of specified size"""
    chunks = []
    overlap_size = int(chunk_size * overlap)
    
    if len(text) <= chunk_size:
        chunks.append(text)
    else:
        start = 0
        while start < len(text):
            end = min(start + chunk_size, len(text))
            chunks.append(text[start:end])
            start += chunk_size - overlap_size
            
    return chunks


# Routes for notes

@notes_bp.route('/', methods=['GET'])
@token_required
def get_notes(current_user):
    """Get all notes with optional filtering"""
    try:
        # Extract and validate query parameters
        faculty = request.args.get('faculty', '').strip()
        note_type = request.args.get('type', '').strip()
        search_query = request.args.get('query', '').strip()
        unit_id = request.args.get('unit_id', '').strip()
        sort_by = request.args.get('sort_by', 'recent')
        
        # Validate pagination
        page, limit = validate_pagination(
            request.args.get('page'), 
            request.args.get('limit')
        )
        
        # Validate search query if provided
        if search_query:
            search_query = validate_search_query(search_query)
        
        # Validate unit_id if provided
        if unit_id:
            unit_id = str(validate_objectid(unit_id, 'Unit ID'))
        
        # Build the query
        query = {}
        
        if faculty:
            query['facultyCode'] = faculty
        
        if note_type:
            query['type'] = note_type
            
        if unit_id:
            query['unit_id'] = unit_id
            
        # Text search if query is provided
        if search_query:
            # Use Qdrant for semantic search
            search_results = perform_vector_search(search_query, unit_id)
            note_ids = [result['note_id'] for result in search_results]
            query['_id'] = {'$in': [ObjectId(id) for id in note_ids]}
        
        # Sort options
        sort_options = {
            'recent': [('published_at', -1)],
            'relevance': [('relevance_score', -1)],
            'az': [('title', 1)],
            'za': [('title', -1)]
        }
        
        # Get total count for pagination
        total_count = notes_collection.count_documents(query)
        
        # Fetch notes with pagination
        notes = list(notes_collection.find(query)
                    .sort(sort_options.get(sort_by, sort_options['recent']))
                    .skip((page - 1) * limit)
                    .limit(limit))
        
        # Format notes for response
        formatted_notes = [format_doc(note) for note in notes]
        
        return jsonify({
            'status': 'success',
            'data': formatted_notes,
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': (total_count + limit - 1) // limit  # Ceiling division
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching notes: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/<note_id>', methods=['GET'])
def get_note(note_id):
    """Get a specific note by ID"""
    try:
        note = notes_collection.find_one({'_id': ObjectId(note_id)})
        if not note:
            return jsonify({'status': 'error', 'message': 'Note not found'}), 404
        
        # Get references for this note
        references = list(references_collection.find({'note_id': note_id}))
        formatted_references = [format_doc(ref) for ref in references]
        
        # Add references to note
        formatted_note = format_doc(note)
        formatted_note['references'] = formatted_references
        
        return jsonify({
            'status': 'success',
            'note': formatted_note
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching note: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/', methods=['POST'])
@token_required
def create_note(current_user):
    """Create a new note with PDF upload"""
    try:
        # Check if PDF file is included in request
        if 'file' not in request.files:
            return jsonify({'status': 'error', 'message': 'No file provided'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'status': 'error', 'message': 'No file selected'}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'status': 'error', 'message': 'Only PDF files are allowed'}), 400
        
        # Get note data
        note_data = json.loads(request.form.get('data', '{}'))
        
        # Save the file
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # Process the PDF to extract text and references
        text_by_page, total_pages, references = process_pdf(file_path)
        
        # Extract and validate unit_id if provided
        unit_id = note_data.get('unit_id')
        unit_name = note_data.get('unit_name', '')
        unit_code = note_data.get('unit_code', '')
        
        # Validate unit_id if provided
        if unit_id:
            # Ensure it's a valid ObjectId format
            if not ObjectId.is_valid(unit_id):
                return jsonify({'status': 'error', 'message': 'Invalid unit ID format'}), 400
                
            # Check if the unit exists in the database
            unit = db.units.find_one({"_id": ObjectId(unit_id)})
            if not unit:
                return jsonify({'status': 'error', 'message': 'Unit not found'}), 404
                
            # Use the unit information from the database
            unit_name = unit.get('name', '')
            unit_code = unit.get('code', '')
        
        # Create note in MongoDB
        new_note = {
            'title': note_data.get('title', filename),
            'description': note_data.get('description', ''),
            'file_path': file_path,
            'url': f"/api/notes/file/{unique_filename}",
            'source_name': note_data.get('source_name', ''),
            'published_at': note_data.get('published_at', datetime.now().strftime('%Y-%m-%d')),
            'type': note_data.get('type', 'notes'),
            'faculty': note_data.get('faculty', ''),
            'facultyCode': note_data.get('facultyCode', ''),
            'unit_name': unit_name,
            'unit_code': unit_code,
            'categories': note_data.get('categories', []),
            'author': note_data.get('author', ''),
            'institution': note_data.get('institution', ''),
            'total_pages': total_pages,
            'created_at': datetime.now(),
            'created_by': str(current_user['_id']),
            'metadata': note_data.get('metadata', {})
        }
        
        # Only add unit_id if it's valid
        if unit_id and ObjectId.is_valid(unit_id):
            new_note['unit_id'] = unit_id
        
        # Insert note into MongoDB
        result = notes_collection.insert_one(new_note)
        note_id = str(result.inserted_id)
        
        # Store the references in MongoDB
        for ref in references:
            ref['note_id'] = note_id
            references_collection.insert_one(ref)
        
        # Get chunking parameters from request or use defaults
        use_cache = request.form.get('use_cache', 'true').lower() == 'true'
        chunk_size = int(request.form.get('chunk_size', 512))
        overlap = float(request.form.get('overlap', 0.2))
        
        # Store text content in Qdrant for vector search
        store_text_in_qdrant(
            note_id, 
            text_by_page, 
            use_cache=use_cache,
            chunk_size=chunk_size,
            overlap=overlap
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Note created successfully',
            'note_id': note_id
        })
        
    except Exception as e:
        current_app.logger.error(f"Error creating note: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/<note_id>', methods=['PUT'])
@token_required
def update_note(current_user, note_id):
    """Update a note's metadata"""
    try:
        # Get the note
        note = notes_collection.find_one({'_id': ObjectId(note_id)})
        if not note:
            return jsonify({'status': 'error', 'message': 'Note not found'}), 404
        
        # Check if user is authorized to update the note
        if str(note.get('created_by')) != str(current_user['_id']) and current_user.get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'Unauthorized to update this note'}), 403
        
        # Get update data
        data = request.json
        
        # Fields that can be updated
        allowed_fields = [
            'title', 'description', 'source_name', 'published_at', 
            'type', 'faculty', 'facultyCode', 'categories', 
            'author', 'institution', 'metadata'
        ]
        
        # Filter allowed fields
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.now()
        
        # Update the note
        notes_collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': update_data}
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Note updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error updating note: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/<note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user, note_id):
    """Delete a note"""
    try:
        # Get the note
        note = notes_collection.find_one({'_id': ObjectId(note_id)})
        if not note:
            return jsonify({'status': 'error', 'message': 'Note not found'}), 404
        
        # Check if user is authorized to delete the note
        if str(note.get('created_by')) != str(current_user['_id']) and current_user.get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'Unauthorized to delete this note'}), 403
        
        # Delete the file
        if 'file_path' in note and os.path.exists(note['file_path']):
            os.remove(note['file_path'])
            
        # Delete references from references collection
        references_collection.delete_many({'note_id': note_id})
        
        # Delete note from notes collection
        notes_collection.delete_one({'_id': ObjectId(note_id)})
        
        # Delete vectors from Qdrant
        delete_from_qdrant(note_id)
        
        return jsonify({
            'status': 'success',
            'message': 'Note deleted successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error deleting note: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/file/<filename>', methods=['GET'])
def get_file(filename):
    """Serve the PDF file from the uploads folder."""
    try:
        # Build the path to the file
        upload_folder = os.path.abspath(current_app.config['UPLOAD_FOLDER'])
        file_path = os.path.join(upload_folder, filename)
        
        # Ensure the file exists
        if not os.path.exists(file_path):
            return jsonify({"error": "File not found"}), 404

        # Return the file with the correct MIME type for PDFs
        return send_from_directory(
            upload_folder,  # Folder path
            filename,  # File name
            mimetype='application/pdf',  # MIME type for PDFs
            as_attachment=False  # Set True if you want the file to be downloaded
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notes_bp.route('/references/<note_id>', methods=['GET'])
def get_references(note_id):
    """Get all references for a note"""
    try:
        references = list(references_collection.find({'note_id': note_id}))
        formatted_references = [format_doc(ref) for ref in references]
        
        return jsonify({
            'status': 'success',
            'references': formatted_references
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching references: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/references/<reference_id>', methods=['PUT'])
@token_required
def update_reference(current_user, reference_id):
    """Update a reference"""
    try:
        # Get the reference
        reference = references_collection.find_one({'_id': ObjectId(reference_id)})
        if not reference:
            return jsonify({'status': 'error', 'message': 'Reference not found'}), 404
        
        # Get the note to check permissions
        note = notes_collection.find_one({'_id': ObjectId(reference['note_id'])})
        if not note:
            return jsonify({'status': 'error', 'message': 'Associated note not found'}), 404
        
        # Check if user is authorized to update the reference
        if str(note.get('created_by')) != str(current_user['_id']) and current_user.get('role') != 'admin':
            return jsonify({'status': 'error', 'message': 'Unauthorized to update this reference'}), 403
        
        # Get update data
        data = request.json
        
        # Fields that can be updated
        allowed_fields = ['title', 'text', 'color', 'metadata']
        
        # Filter allowed fields
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.now()
        
        # Update the reference
        references_collection.update_one(
            {'_id': ObjectId(reference_id)},
            {'$set': update_data}
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Reference updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error updating reference: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


@notes_bp.route('/search', methods=['GET'])
def search_notes():
    """Search notes using vector search"""
    try:
        query = request.args.get('q', '')
        unit_id = request.args.get('unit_id')
        note_id = request.args.get('note_id')
        limit = int(request.args.get('limit', 20))
        use_cache = request.args.get('use_cache', 'true').lower() == 'true'
        
        if not query:
            return jsonify({'status': 'error', 'message': 'Query parameter is required'}), 400
        
        # Perform vector search
        search_results = perform_vector_search(
            query, 
            unit_id=unit_id, 
            note_id=note_id, 
            limit=limit, 
            use_cache=use_cache
        )
        
        # Get note information for results
        note_ids = set(result['note_id'] for result in search_results)
        notes_map = {}
        
        for note_id in note_ids:
            note = notes_collection.find_one({'_id': ObjectId(note_id)})
            if note:
                formatted_note = format_doc(note)
                formatted_note['matches'] = []
                notes_map[note_id] = formatted_note
        
        # Group matches by note
        for result in search_results:
            note_id = result['note_id']
            if note_id in notes_map:
                notes_map[note_id]['matches'].append({
                    'text': result['text'],
                    'context': result['context'],
                    'page': result['page'],
                    'similarity_score': result['similarity_score']
                })
        
        # Convert to list and sort by highest similarity score
        notes_list = list(notes_map.values())
        for note in notes_list:
            note['matches'].sort(key=lambda x: x['similarity_score'], reverse=True)
            # Add highest score to note for sorting
            if note['matches']:
                note['highest_score'] = note['matches'][0]['similarity_score']
            else:
                note['highest_score'] = 0
        
        # Sort notes by highest match score
        notes_list.sort(key=lambda x: x['highest_score'], reverse=True)
        
        return jsonify({
            'status': 'success',
            'query': query,
            'results_count': len(notes_list),
            'results': notes_list
        })
        
    except Exception as e:
        current_app.logger.error(f"Error searching notes: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# Helper Functions

def process_pdf(file_path):
    """Process PDF to extract text, identify pages, and detect potential references"""
    try:
        text_by_page = {}
        references = []
        
        # Open the PDF
        doc = fitz.open(file_path)
        total_pages = len(doc)
        
        # Process each page
        for page_num, page in enumerate(doc, 1):
            # Extract text from the page
            text = page.get_text()
            text_by_page[page_num] = text
            
            # Look for potential references (citations, footnotes, etc.)
            # This is a basic implementation - you might want to use more sophisticated methods
            lines = text.split('\n')
            for i, line in enumerate(lines):
                # Simple heuristic for references: starts with a number or [X] pattern
                if (line.strip().startswith('[') and ']' in line) or \
                   (line.strip() and line.strip()[0].isdigit() and '.' in line[:5]):
                    
                    # Create a reference entry
                    reference = {
                        'pageNumber': page_num,
                        'text': line.strip(),
                        'title': f"Reference on page {page_num}",
                        'created_at': datetime.now()
                    }
                    references.append(reference)
        
        return text_by_page, total_pages, references
        
    except Exception as e:
        current_app.logger.error(f"Error processing PDF: {str(e)}")
        raise


def store_text_in_qdrant(note_id, text_by_page, use_cache=True, chunk_size=512, overlap=0.2):
    """Store extracted text in Qdrant for vector search with text chunking"""
    try:
        # Initialize embedding service
        embedding_service = EmbeddingService(use_cache=use_cache)
        
        # Check if collection exists, create if it doesn't
        collection_name = "notes_content"
        collections = qdrant_client.get_collections().collections
        collection_exists = any(c.name == collection_name for c in collections)
        
        if not collection_exists:
            # Get the vector size from the embedding model
            vector_size = len(embedding_service.get_embedding("test"))
            
            # Create a new collection for notes with appropriate vector dimensions
            qdrant_client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
            )
        
        # Store each page's text as chunks
        points = []
        
        for page_num, text in text_by_page.items():
            # Chunk the text
            chunks = chunk_text(text, chunk_size=chunk_size, overlap=overlap)
            
            # Generate embeddings for all chunks
            chunk_embeddings = embedding_service.get_embeddings(chunks)
            
            for i, (chunk, embedding) in enumerate(zip(chunks, chunk_embeddings)):
                # Generate a UUID for the point ID
                point_id = str(uuid.uuid4())
                
                # Extract a brief context around the chunk to provide more information
                start_pos = text.find(chunk)
                context_start = max(0, start_pos - 50)
                context_end = min(len(text), start_pos + len(chunk) + 50)
                context = text[context_start:context_end]
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),  # Convert numpy array to list
                    payload={
                        "note_id": note_id,
                        "page": page_num,
                        "chunk_index": i,
                        "text": chunk,
                        "context": context,
                        "chunk_position": start_pos,
                        "collection_name": collection_name,
                        "point_id": point_id
                    }
                )
                points.append(point)
        
        # Upsert points to Qdrant in batches of 100
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i+batch_size]
            qdrant_client.upsert(
                collection_name=collection_name,
                points=batch
            )
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"Error storing text in Qdrant: {str(e)}")
        raise


def perform_vector_search(query, unit_id=None, note_id=None, limit=20, use_cache=True):
    """Perform vector search in Qdrant with optional filters"""
    try:
        # Initialize embedding service
        embedding_service = EmbeddingService(use_cache=use_cache)
        
        # Generate embedding for the query
        query_embedding = embedding_service.get_embedding(query)
        
        # Build filter if unit_id or note_id is provided
        search_filter = None
        if unit_id or note_id:
            filter_conditions = []
            
            if unit_id:
                # We need to first get the notes with this unit_id
                notes_with_unit = list(notes_collection.find({'unit_id': unit_id}, {'_id': 1}))
                note_ids = [str(note['_id']) for note in notes_with_unit]
                
                if note_ids:
                    filter_conditions.append(
                        FieldCondition(
                            key="note_id",
                            match=MatchAny(any=note_ids)
                        )
                    )
                else:
                    # If no notes with this unit_id, return empty results
                    return []
            
            if note_id:
                filter_conditions.append(
                    FieldCondition(
                        key="note_id",
                        match=MatchValue(value=note_id)
                    )
                )
            
            search_filter = Filter(
                must=filter_conditions
            )
        
        # Perform the search
        search_result = qdrant_client.search(
            collection_name="notes_content",
            query_vector=query_embedding.tolist(),
            limit=limit,
            query_filter=search_filter
        )
        
        # Format results
        results = []
        for scored_point in search_result:
            results.append({
                "text": scored_point.payload["text"],
                "context": scored_point.payload["context"],
                "page": scored_point.payload["page"],
                "note_id": scored_point.payload["note_id"],
                "similarity_score": scored_point.score
            })
        
        return results
        
    except Exception as e:
        current_app.logger.error(f"Error performing vector search: {str(e)}")
        raise


def delete_from_qdrant(note_id):
    """Delete a note's vectors from Qdrant"""
    try:
        collection_name = "notes_content"
        
        # Build the filter for the note_id
        search_filter = Filter(
            must=[
                FieldCondition(
                    key="note_id",
                    match=MatchValue(value=note_id)
                )
            ]
        )
        
        # Use the scroll method to get all points with the note_id
        # We'll use pagination to handle potentially large numbers of chunks
        limit = 100
        offset = None
        all_point_ids = []
        
        while True:
            scroll_response = qdrant_client.scroll(
                collection_name=collection_name,
                scroll_filter=search_filter,
                limit=limit,
                offset=offset
            )
            
            points = scroll_response.points
            if not points:
                break
                
            # Extract the IDs
            point_ids = [point.id for point in points]
            all_point_ids.extend(point_ids)
            
            # Set offset for next iteration
            offset = points[-1].id
        
        # Delete the points in batches
        batch_size = 100
        for i in range(0, len(all_point_ids), batch_size):
            batch = all_point_ids[i:i+batch_size]
            qdrant_client.delete(
                collection_name=collection_name,
                points_selector=PointIdsList(points=batch)
            )
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"Error deleting from Qdrant: {str(e)}")
        raise