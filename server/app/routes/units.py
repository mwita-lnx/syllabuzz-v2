# units/routes.py
from flask import Blueprint, request, jsonify, current_app
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
from functools import wraps
import jwt
from app import mongo
import os
import json
from werkzeug.utils import secure_filename

# Import auth decorators
from .auth import token_required, role_required

# Initialize MongoDB client
db = mongo.db
units_collection = db.units

# Create units blueprint
units_bp = Blueprint('units', __name__, url_prefix='/api/units')

# Helper function to format MongoDB documents
def format_doc(doc):
    """Convert MongoDB ObjectId to string and format dates"""
    if doc is None:
        return None
    
    result = dict(doc)
    result['_id'] = str(doc['_id'])
    
    # Format datetime fields
    for field in ['created_at', 'updated_at']:
        if field in result and isinstance(result[field], datetime):
            result[field] = result[field].isoformat()
    
    return result

# Units Routes

@units_bp.route('/', methods=['GET'])
def get_units():
    """Get all units with optional filtering"""
    try:
        # Extract query parameters
        faculty = request.args.get('faculty')
        search_query = request.args.get('query')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Build the query
        query = {}
        
        if faculty:
            query['facultyCode'] = faculty
        
        if search_query:
            # Text search
            query['$or'] = [
                {'name': {'$regex': search_query, '$options': 'i'}},
                {'code': {'$regex': search_query, '$options': 'i'}},
                {'description': {'$regex': search_query, '$options': 'i'}}
            ]
        
        # Get total count for pagination
        total_count = units_collection.count_documents(query)
        
        # Fetch units with pagination
        units = list(units_collection.find(query)
                    .sort('code', 1)
                    .skip((page - 1) * limit)
                    .limit(limit))
        
        # Format units for response
        formatted_units = [format_doc(unit) for unit in units]
        
        return jsonify({
            'status': 'success',
            'units': formatted_units,
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': (total_count + limit - 1) // limit  # Ceiling division
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching units: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@units_bp.route('/<unit_id>', methods=['GET'])
def get_unit(unit_id):
    """Get a specific unit by ID"""
    try:
        unit = units_collection.find_one({'_id': ObjectId(unit_id)})
        if not unit:
            return jsonify({'status': 'error', 'message': 'Unit not found'}), 404
        
        # Format unit for response
        formatted_unit = format_doc(unit)
        
        return jsonify({
            'status': 'success',
            'data': formatted_unit
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching unit: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@units_bp.route('/', methods=['POST'])
@token_required
def create_unit(current_user):
    """Create a new unit"""
    try:
        current_app.logger.info(f"Request form data: {request.form}")
        current_app.logger.info(f"Request files: {request.files}")
        
        # Process form data
        data = {}
        
        # Handle basic text fields
        for field in ['name', 'code', 'description', 'faculty', 'facultyCode', 'level']:
            if field in request.form:
                data[field] = request.form.get(field)
        
        # Handle credits field (convert to integer)
        if 'credits' in request.form:
            try:
                data['credits'] = int(request.form.get('credits'))
            except ValueError:
                data['credits'] = 3  # Default value
        
        # Parse JSON array fields
        for field in ['keywords', 'syllabus', 'prerequisites', 'instructors']:
            if field in request.form:
                try:
                    # Try to parse as JSON
                    data[field] = json.loads(request.form.get(field))
                except json.JSONDecodeError:
                    # Fallback: split by comma if simple string
                    if field != 'instructors':  # Instructors is complex, should be valid JSON
                        data[field] = [item.strip() for item in request.form.get(field).split(',') if item.strip()]
                    else:
                        data[field] = []
        
        # Handle file uploads
        uploaded_files = []
        if 'files' in request.files:
            files = request.files.getlist('files')
            
            for file in files:
                if file and file.filename:
                    # Secure the filename
                    filename = secure_filename(file.filename)
                    
                    # Create directory if it doesn't exist
                    upload_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], 'units')
                    os.makedirs(upload_folder, exist_ok=True)
                    
                    # Save file
                    file_path = os.path.join(upload_folder, filename)
                    file.save(file_path)
                    
                    # Store file info
                    uploaded_files.append({
                        'filename': filename,
                        'path': file_path,
                        'mime_type': file.content_type,
                        'size': os.path.getsize(file_path)
                    })
        
        # Add uploaded files to data
        if uploaded_files:
            data['files'] = uploaded_files
        
        # Check required fields
        required_fields = ['name', 'code', 'faculty', 'facultyCode']
        missing_fields = [field for field in required_fields if field not in data or not data[field]]
        
        if missing_fields:
            return jsonify({
                'success': False,
                'error': f'Missing required fields: {", ".join(missing_fields)}'
            }), 400
        
        # Check if unit code already exists
        existing_unit = units_collection.find_one({'code': data['code']})
        if existing_unit:
            return jsonify({
                'success': False,
                'error': 'Unit code already exists'
            }), 409
        
        # Prepare unit document with all data
        new_unit = {
            **data,
            'created_at': datetime.now(),
            'created_by': str(current_user['_id']),
        }
        
        # Insert unit into database
        result = units_collection.insert_one(new_unit)
        unit_id = str(result.inserted_id)
        
        current_app.logger.info(f"Successfully created unit with ID: {unit_id}")
        
        return jsonify({
            'success': True,
            'message': 'Unit created successfully',
            'data': {
                'unit_id': unit_id
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"Error creating unit: {str(e)}")
        import traceback
        current_app.logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Failed to create unit: {str(e)}'
        }), 500
    
@units_bp.route('/<unit_id>', methods=['PUT'])
@token_required
@role_required(['admin', 'moderator'])
def update_unit(current_user, unit_id):
    """Update a unit (admin/moderator only)"""
    try:
        data = request.json
        
        # Get the unit
        unit = units_collection.find_one({'_id': ObjectId(unit_id)})
        if not unit:
            return jsonify({'status': 'error', 'message': 'Unit not found'}), 404
        
        # Fields that can be updated
        allowed_fields = [
            'name', 'description', 'faculty', 'facultyCode', 
            'keywords', 'syllabus', 'prerequisites', 'instructors',
            'credits', 'level'
        ]
        
        # Filter allowed fields
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        update_data['updated_at'] = datetime.now()
        update_data['updated_by'] = str(current_user['_id'])
        
        # Update the unit
        units_collection.update_one(
            {'_id': ObjectId(unit_id)},
            {'$set': update_data}
        )
        
        return jsonify({
            'status': 'success',
            'message': 'Unit updated successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error updating unit: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@units_bp.route('/<unit_id>', methods=['DELETE'])
@token_required
@role_required(['admin'])
def delete_unit(current_user, unit_id):
    """Delete a unit (admin only)"""
    try:
        # Get the unit
        unit = units_collection.find_one({'_id': ObjectId(unit_id)})
        if not unit:
            return jsonify({'status': 'error', 'message': 'Unit not found'}), 404
        
        # Delete the unit
        units_collection.delete_one({'_id': ObjectId(unit_id)})
        
        return jsonify({
            'status': 'success',
            'message': 'Unit deleted successfully'
        })
        
    except Exception as e:
        current_app.logger.error(f"Error deleting unit: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@units_bp.route('/faculty/<faculty_code>', methods=['GET'])
def get_units_by_faculty(faculty_code):
    """Get units by faculty code"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Query units by faculty code
        query = {'facultyCode': faculty_code}
        
        # Get total count for pagination
        total_count = units_collection.count_documents(query)
        
        # Fetch units with pagination
        units = list(units_collection.find(query)
                    .sort('code', 1)
                    .skip((page - 1) * limit)
                    .limit(limit))
        
        # Format units for response
        formatted_units = [format_doc(unit) for unit in units]
        
        return jsonify({
            'status': 'success',
            'units': formatted_units,
            'total': total_count,
            'page': page,
            'limit': limit,
            'pages': (total_count + limit - 1) // limit  # Ceiling division
        })
        
    except Exception as e:
        current_app.logger.error(f"Error fetching units by faculty: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500