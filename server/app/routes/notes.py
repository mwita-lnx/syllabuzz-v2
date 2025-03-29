# app/routes/notes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.note import Note
from app.models.unit import Unit
from app.models.course import Course
from app.services.pdf_extraction import PDFExtractionService
from app.services.embedding_service import EmbeddingService
from werkzeug.utils import secure_filename
from bson import ObjectId
import os
from app.config import Config

notes_bp = Blueprint('notes', __name__)

@notes_bp.route('/unit/<unit_id>', methods=['GET'])
@jwt_required()
def get_unit_notes(unit_id):
    # Get filter parameters
    topic = request.args.get('topic')
    
    # Base query
    query = {'unit_id': ObjectId(unit_id)}
    
    # Apply filters
    if topic:
        query['topic'] = topic
    
    # Get notes
    notes = list(Note.collection.find(query))
    
    # Format notes for response
    formatted_notes = []
    for note in notes:
        formatted_note = {
            '_id': str(note['_id']),
            'title': note['title'],
            'topic': note.get('topic'),
            'pdf_path': note.get('pdf_path'),
            'page_numbers': note.get('page_numbers', [])
        }
        formatted_notes.append(formatted_note)
    
    return jsonify({'notes': formatted_notes}), 200

@notes_bp.route('/<note_id>', methods=['GET'])
@jwt_required()
def get_note(note_id):
    note = Note.get_by_id(note_id)
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    # Format note for response
    formatted_note = {
        '_id': str(note['_id']),
        'title': note['title'],
        'content': note['content'],
        'topic': note.get('topic'),
        'pdf_path': note.get('pdf_path'),
        'page_numbers': note.get('page_numbers', []),
        'unit_id': str(note['unit_id'])
    }
    
    return jsonify({'note': formatted_note}), 200

@notes_bp.route('/unit/<unit_id>/topics', methods=['GET'])
@jwt_required()
def get_unit_topics(unit_id):
    # Get all notes for the unit
    notes = Note.get_unit_notes(unit_id)
    
    # Extract unique topics
    topics = set()
    for note in notes:
        if 'topic' in note and note['topic']:
            topics.add(note['topic'])
    
    return jsonify({'topics': list(topics)}), 200

@notes_bp.route('/unit/<unit_id>/upload', methods=['POST'])
@jwt_required()
def upload_notes(unit_id):
    current_user_id = get_jwt_identity()
    unit = Unit.get_by_id(unit_id)
    
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    # Get the course to check authorization
    course = Course.get_by_id(str(unit['course_id']))
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Check if user is the instructor of this course
    if str(course['instructor_id']) != current_user_id:
        return jsonify({'error': 'You are not authorized to upload notes to this unit'}), 403
    
    # Check if file is present in request
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    
    # Check if filename is empty
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
        
    # Check file extension
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files are allowed'}), 400
    
    # Get additional data
    topic = request.form.get('topic')
    
    # Save file
    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)
    
    filename = secure_filename(f"{unit_id}_notes_{file.filename}")
    filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    # Process the PDF to extract notes sections
    pdf_service = PDFExtractionService()
    
    try:
        sections = pdf_service.extract_notes_sections(
            filepath, unit_id, topic
        )
        
        # Store each section as a note
        created_notes = []
        for section in sections:
            note = Note.create(
                title=section['title'],
                content=section['content'],
                unit_id=unit_id,
                topic=section['topic'],
                pdf_path=filepath,
                embeddings=section['embeddings']
            )
            created_notes.append(note)
        
        # Check for related questions and update them
        embedding_service = EmbeddingService()
        questions = []
        
        for question in questions:
            if 'embedding' in question and question['embedding']:
                related_notes = embedding_service.find_related_notes(
                    question['text'], unit_id
                )
                
                related_note_ids = [str(note_id) for note_id, _, _ in related_notes]
                
                # Update question with related note sections
                # Question.collection.update_one(
                #     {'_id': question['_id']},
                #     {'$set': {'related_sections': related_note_ids}}
                # )
        
        return jsonify({
            'message': f'Successfully processed {len(created_notes)} note sections',
            'notes_count': len(created_notes)
        }), 200
        
    except Exception as e:
        # Log the error
        print(f"Error processing notes: {str(e)}")
        return jsonify({'error': f'Error processing PDF: {str(e)}'}), 500

@notes_bp.route('/<note_id>', methods=['PUT'])
@jwt_required()
def update_note(note_id):
    current_user_id = get_jwt_identity()
    note = Note.get_by_id(note_id)
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    # Check if user is authorized (instructor of the course)
    unit = Unit.get_by_id(str(note['unit_id']))
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    course = Course.get_by_id(str(unit['course_id']))
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    if str(course['instructor_id']) != current_user_id:
        return jsonify({'error': 'You are not authorized to update this note'}), 403
    
    data = request.get_json()
    
    # Update fields
    updates = {}
    if 'title' in data:
        updates['title'] = data['title']
    if 'content' in data:
        updates['content'] = data['content']
        # Update embedding
        embedding_service = EmbeddingService()
        updates['embeddings'] = embedding_service.get_embedding(data['content'])
    if 'topic' in data:
        updates['topic'] = data['topic']
    
    if updates:
        Note.collection.update_one(
            {'_id': ObjectId(note_id)},
            {'$set': updates}
        )
    
    # Get updated note
    updated_note = Note.get_by_id(note_id)
    
    return jsonify({
        'message': 'Note updated successfully',
        'note': {
            '_id': str(updated_note['_id']),
            'title': updated_note['title'],
            'topic': updated_note.get('topic')
        }
    }), 200

@notes_bp.route('/<note_id>', methods=['DELETE'])
@jwt_required()
def delete_note(note_id):
    current_user_id = get_jwt_identity()
    note = Note.get_by_id(note_id)
    
    if not note:
        return jsonify({'error': 'Note not found'}), 404
    
    # Check if user is authorized (instructor of the course)
    unit = Unit.get_by_id(str(note['unit_id']))
    if not unit:
        return jsonify({'error': 'Unit not found'}), 404
    
    course = Course.get_by_id(str(unit['course_id']))
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    if str(course['instructor_id']) != current_user_id:
        return jsonify({'error': 'You are not authorized to delete this note'}), 403
    
    # Remove from related questions
    # for question in Question.collection.find({'related_sections': str(note['_id'])}):
    #     Question.collection.update_one(
    #         {'_id': question['_id']},
    #         {'$pull': {'related_sections': str(note['_id'])}}
    #     )
    
    # Delete the note
    Note.collection.delete_one({'_id': ObjectId(note_id)})
    
    return jsonify({
        'message': 'Note deleted successfully'
    }), 200

@notes_bp.route('/search', methods=['POST'])
@jwt_required()
def search_notes():
    data = request.get_json()
    
    if not data or 'query' not in data or 'unit_id' not in data:
        return jsonify({'error': 'Missing query or unit_id'}), 400
    
    query_text = data['query']
    unit_id = data['unit_id']
    
    # Use the embedding service to find related notes
    embedding_service = EmbeddingService()
    
    # Get embedding for the query
    query_embedding = embedding_service.get_embedding(query_text)
    
    # Get all notes for the unit
    notes = Note.get_unit_notes(unit_id)
    
    if not notes:
        return jsonify({'results': []}), 200
    
    # Compare embeddings to find similar notes
    from sklearn.metrics.pairwise import cosine_similarity
    
    results = []
    for note in notes:
        if 'embeddings' in note and note['embeddings']:
            similarity = cosine_similarity(
                [query_embedding], 
                [note['embeddings']]
            )[0][0]
            
            if similarity >= 0.6:  # Minimum similarity threshold
                # Extract a highlight from the content
                import re
                from nltk.tokenize import sent_tokenize
                
                sentences = sent_tokenize(note['content'])
                query_words = set(query_text.lower().split())
                
                # Find the most relevant sentence
                best_sentence = ""
                best_score = 0
                
                for sentence in sentences:
                    sentence_words = set(sentence.lower().split())
                    overlap = len(query_words.intersection(sentence_words))
                    score = overlap / max(len(sentence_words), 1)
                    
                    if score > best_score:
                        best_score = score
                        best_sentence = sentence
                
                # Truncate if needed
                highlight = best_sentence if best_sentence else note['content'][:150] + "..."
                
                results.append({
                    '_id': str(note['_id']),
                    'title': note['title'],
                    'highlight': highlight,
                    'similarity': float(similarity),
                    'topic': note.get('topic')
                })
    
    # Sort by similarity (descending)
    results.sort(key=lambda x: x['similarity'], reverse=True)
    
    # Return top 10 results
    return jsonify({'results': results[:10]}), 200