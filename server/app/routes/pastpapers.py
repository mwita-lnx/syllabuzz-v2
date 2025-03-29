from flask import Blueprint, request, jsonify, current_app, g, send_file
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required
import os
import uuid
from werkzeug.utils import secure_filename

pastpapers = Blueprint('pastpapers', __name__, url_prefix='/api/pastpapers')

# Helper function to check allowed file extensions
def allowed_file(filename):
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@pastpapers.route('/', methods=['GET'])
def get_papers():
    """
    Get all past papers
    Optional query parameters:
    - unit_id: Filter by unit ID
    - unit_code: Filter by unit code
    - faculty_code: Filter by faculty code
    - year: Filter by year
    - semester: Filter by semester
    - exam_type: Filter by exam type
    - difficulty: Filter by difficulty
    - search: Search in title, topics
    - sort: Sort field (default: year)
    - order: Sort order (asc or desc, default: desc)
    - page: Page number (default: 1)
    - limit: Number of papers per page (default: 20)
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Get query parameters
        unit_id = request.args.get('unit_id')
        unit_code = request.args.get('unit_code')
        faculty_code = request.args.get('faculty_code')
        year = request.args.get('year')
        semester = request.args.get('semester')
        exam_type = request.args.get('exam_type')
        difficulty = request.args.get('difficulty')
        search = request.args.get('search')
        sort = request.args.get('sort', 'year')
        order = request.args.get('order', 'desc')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Build query
        query = {}
        
        if unit_id and ObjectId.is_valid(unit_id):
            query['unit_id'] = ObjectId(unit_id)
            
        if unit_code:
            query['unit_code'] = unit_code
            
        if faculty_code:
            query['faculty_code'] = faculty_code
            
        if year:
            query['year'] = year
            
        if semester:
            query['semester'] = semester
            
        if exam_type:
            query['exam_type'] = exam_type
            
        if difficulty:
            query['difficulty'] = difficulty
            
        if search:
            query['$or'] = [
                {'title': {'$regex': search, '$options': 'i'}},
                {'topics': {'$in': [{'$regex': search, '$options': 'i'}]}}
            ]
        
        # Determine sort direction
        sort_direction = -1 if order.lower() == 'desc' else 1
        
        # Execute query with pagination
        papers = db.past_papers.find(query).sort(sort, sort_direction).skip((page - 1) * limit).limit(limit)
        total = db.past_papers.count_documents(query)
        
        # Convert to list and format response
        papers_list = []
        for paper in papers:
            papers_list.append({
                'id': str(paper['_id']),
                'title': paper['title'],
                'unit_id': str(paper['unit_id']),
                'unit_code': paper['unit_code'],
                'unit_name': paper['unit_name'],
                'year': paper['year'],
                'exam_type': paper['exam_type'],
                'semester': paper['semester'],
                'faculty_code': paper['faculty_code'],
                'faculty': paper['faculty'],
                'difficulty': paper['difficulty'],
                'topics': paper.get('topics', []),
                'avg_difficulty_rating': paper.get('avg_difficulty_rating', 0),
                'created_at': paper['created_at'].isoformat() if 'created_at' in paper else None
            })
        
        return jsonify({
            'success': True,
            'data': papers_list,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/<paper_id>', methods=['GET'])
def get_paper(paper_id):
    """
    Get a specific past paper by ID
    """
    try:
        # Validate paper_id
        if not ObjectId.is_valid(paper_id):
            return jsonify({"success": False, "error": "Invalid paper ID"}), 400
            
        db = current_app.config['MONGO_DB']
        
        # Get paper
        paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        
        if not paper:
            return jsonify({"success": False, "error": "Paper not found"}), 404
            
        # Format response
        paper_data = {
            'id': str(paper['_id']),
            'title': paper['title'],
            'unit_id': str(paper['unit_id']),
            'unit_code': paper['unit_code'],
            'unit_name': paper['unit_name'],
            'year': paper['year'],
            'exam_type': paper['exam_type'],
            'semester': paper['semester'],
            'faculty_code': paper['faculty_code'],
            'faculty': paper['faculty'],
            'file_path': paper['file_path'],
            'difficulty': paper['difficulty'],
            'topics': paper.get('topics', []),
            'avg_difficulty_rating': paper.get('avg_difficulty_rating', 0),
            'total_ratings': len(paper.get('difficulty_ratings', [])),
            'created_at': paper['created_at'].isoformat() if 'created_at' in paper else None
        }
        
        return jsonify({
            'success': True,
            'data': paper_data
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/<paper_id>/download', methods=['GET'])
def download_paper(paper_id):
    """
    Download a past paper file
    """
    try:
        # Validate paper_id
        if not ObjectId.is_valid(paper_id):
            return jsonify({"success": False, "error": "Invalid paper ID"}), 400
            
        db = current_app.config['MONGO_DB']
        
        # Get paper
        paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        
        if not paper:
            return jsonify({"success": False, "error": "Paper not found"}), 404
            
        # Check if file exists
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], paper['file_path'])
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "File not found"}), 404
            
        # Return file
        return send_file(
            file_path,
            as_attachment=True,
            download_name=os.path.basename(paper['file_path'])
        )
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/', methods=['POST'])
@token_required
def upload_paper():
    """
    Upload a new past paper
    Required form parameters:
    - title: Paper title
    - unit_id: Unit ID
    - year: Exam year
    - exam_type: Type of exam
    - semester: Semester
    - file: Paper file (PDF, DOC, DOCX)
    Optional form parameters:
    - difficulty: Paper difficulty
    - topics: Array of topics
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Check if request has the file part
        if 'file' not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400
            
        file = request.files['file']
        
        # Check if file is empty
        if file.filename == '':
            return jsonify({"success": False, "error": "No file selected"}), 400
            
        # Check if file type is allowed
        if not allowed_file(file.filename):
            return jsonify({"success": False, "error": "File type not allowed. Allowed types: PDF, DOC, DOCX"}), 400
            
        # Get form data
        title = request.form.get('title')
        unit_id = request.form.get('unit_id')
        year = request.form.get('year')
        exam_type = request.form.get('exam_type')
        semester = request.form.get('semester')
        difficulty = request.form.get('difficulty', 'medium')
        topics = request.form.getlist('topics')
        
        # Validate required fields
        if not title or not unit_id or not year or not exam_type or not semester:
            return jsonify({
                "success": False,
                "error": "Missing required fields. Required: title, unit_id, year, exam_type, semester"
            }), 400
            
        # Validate unit_id
        if not ObjectId.is_valid(unit_id):
            return jsonify({"success": False, "error": "Invalid unit ID"}), 400
            
        # Get unit
        unit = db.units.find_one({"_id": ObjectId(unit_id)})
        if not unit:
            return jsonify({"success": False, "error": "Unit not found"}), 404
            
        # Generate unique filename
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'papers')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(upload_dir, unique_filename)
        file.save(file_path)
        
        # Create paper document
        new_paper = {
            "title": title,
            "unit_id": ObjectId(unit_id),
            "unit_code": unit['code'],
            "unit_name": unit['name'],
            "year": year,
            "exam_type": exam_type,
            "semester": semester,
            "faculty_code": unit['faculty_code'],
            "faculty": unit['faculty'],
            "file_path": os.path.join('papers', unique_filename),
            "difficulty": difficulty,
            "topics": topics,
            "difficulty_ratings": [],
            "avg_difficulty_rating": 0,
            "created_at": datetime.utcnow()
        }
        
        # Insert paper
        result = db.past_papers.insert_one(new_paper)
        
        # Return uploaded paper
        paper_data = {
            'id': str(result.inserted_id),
            'title': new_paper['title'],
            'unit_id': str(new_paper['unit_id']),
            'unit_code': new_paper['unit_code'],
            'unit_name': new_paper['unit_name'],
            'year': new_paper['year'],
            'exam_type': new_paper['exam_type'],
            'semester': new_paper['semester'],
            'faculty_code': new_paper['faculty_code'],
            'faculty': new_paper['faculty'],
            'difficulty': new_paper['difficulty'],
            'topics': new_paper['topics'],
            'created_at': new_paper['created_at'].isoformat()
        }
        
        return jsonify({
            'success': True,
            'message': 'Paper uploaded successfully',
            'data': paper_data
        }), 201
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/<paper_id>', methods=['PUT'])
@token_required
def update_paper(paper_id):
    """
    Update a past paper
    Required body parameters:
    - paper ID in URL
    Optional body parameters:
    - title: Paper title
    - year: Exam year
    - exam_type: Type of exam
    - semester: Semester
    - difficulty: Paper difficulty
    - topics: Array of topics
    """
    try:
        # Validate paper_id
        if not ObjectId.is_valid(paper_id):
            return jsonify({"success": False, "error": "Invalid paper ID"}), 400
            
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Check if paper exists
        existing_paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        if not existing_paper:
            return jsonify({"success": False, "error": "Paper not found"}), 404
        
        # Fields that can be updated
        allowed_fields = ['title', 'year', 'exam_type', 'semester', 'difficulty', 'topics']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
                
        if not update_data:
            return jsonify({"success": False, "error": "No valid fields to update"}), 400
        
        # Update paper
        result = db.past_papers.update_one(
            {"_id": ObjectId(paper_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Paper not found"}), 404
        
        # Get updated paper
        updated_paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        
        # Format response
        paper_data = {
            'id': str(updated_paper['_id']),
            'title': updated_paper['title'],
            'unit_id': str(updated_paper['unit_id']),
            'unit_code': updated_paper['unit_code'],
            'unit_name': updated_paper['unit_name'],
            'year': updated_paper['year'],
            'exam_type': updated_paper['exam_type'],
            'semester': updated_paper['semester'],
            'faculty_code': updated_paper['faculty_code'],
            'faculty': updated_paper['faculty'],
            'difficulty': updated_paper['difficulty'],
            'topics': updated_paper.get('topics', []),
            'avg_difficulty_rating': updated_paper.get('avg_difficulty_rating', 0),
            'created_at': updated_paper['created_at'].isoformat() if 'created_at' in updated_paper else None
        }
        
        return jsonify({
            'success': True,
            'message': 'Paper updated successfully',
            'data': paper_data
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/unit/<unit_id>', methods=['GET'])
def get_papers_by_unit(unit_id):
    """
    Get past papers for a specific unit
    """
    try:
        # Validate unit_id
        if not ObjectId.is_valid(unit_id):
            return jsonify({"success": False, "error": "Invalid unit ID"}), 400
            
        # Redirect to main papers endpoint with unit_id filter
        return get_papers()
    
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/search', methods=['GET'])
def search_papers():
    """
    Search past papers
    Required query parameters:
    - q: Search query
    """
    try:
        query = request.args.get('q')
        
        if not query:
            return jsonify({"success": False, "error": "Search query is required"}), 400
            
        # Redirect to main papers endpoint with search filter
        request.args = request.args.copy()
        request.args['search'] = query
        return get_papers()
    
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@pastpapers.route('/similar/<paper_id>', methods=['GET'])
def find_similar_papers(paper_id):
    """
    Find similar past papers based on topics and other metadata
    """
    try:
        # Validate paper_id
        if not ObjectId.is_valid(paper_id):
            return jsonify({"success": False, "error": "Invalid paper ID"}), 400
            
        db = current_app.config['MONGO_DB']
        
        # Get paper
        paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        
        if not paper:
            return jsonify({"success": False, "error": "Paper not found"}), 404
            
        # Find similar papers based on unit and topics
        query = {
            "_id": {"$ne": ObjectId(paper_id)},
            "$or": [
                {"unit_id": paper["unit_id"]},
                {"topics": {"$in": paper.get("topics", [])}}
            ]
        }
        
        similar_papers = db.past_papers.find(query).limit(10)
        
        # Convert to list and format response
        papers_list = []
        for similar in similar_papers:
            papers_list.append({
                'id': str(similar['_id']),
                'title': similar['title'],
                'unit_id': str(similar['unit_id']),
                'unit_code': similar['unit_code'],
                'unit_name': similar['unit_name'],
                'year': similar['year'],
                'exam_type': similar['exam_type'],
                'semester': similar['semester'],
                'faculty_code': similar['faculty_code'],
                'faculty': similar['faculty'],
                'difficulty': similar['difficulty'],
                'topics': similar.get('topics', []),
                'avg_difficulty_rating': similar.get('avg_difficulty_rating', 0),
                'created_at': similar['created_at'].isoformat() if 'created_at' in similar else None
            })
        
        return jsonify({
            'success': True,
            'data': papers_list
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500