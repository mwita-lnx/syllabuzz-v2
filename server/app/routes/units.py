from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required

units = Blueprint('units', __name__, url_prefix='/api/units')

@units.route('/', methods=['GET'])
def get_units():
    """
    Get all units
    Optional query parameters:
    - faculty_code: Filter by faculty code
    - search: Search by unit code or name
    - page: Page number (default: 1)
    - limit: Number of units per page (default: 20)
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Get query parameters
        faculty_code = request.args.get('faculty_code')
        search = request.args.get('search')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Build query
        query = {}
        
        if faculty_code:
            query['faculty_code'] = faculty_code
            
        if search:
            query['$or'] = [
                {'code': {'$regex': search, '$options': 'i'}},
                {'name': {'$regex': search, '$options': 'i'}}
            ]
        
        # Execute query with pagination
        units = db.units.find(query).skip((page - 1) * limit).limit(limit)
        total = db.units.count_documents(query)
        
        # Convert to list and format response
        units_list = []
        for unit in units:
            units_list.append({
                'id': str(unit['_id']),
                'code': unit['code'],
                'name': unit['name'],
                'description': unit.get('description', ''),
                'faculty_code': unit['faculty_code'],
                'faculty': unit['faculty'],
                'keywords': unit.get('keywords', [])
            })
        
        return jsonify({
            'success': True,
            'data': units_list,
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

@units.route('/<unit_id>', methods=['GET'])
def get_unit(unit_id):
    """
    Get a specific unit by ID
    """
    try:
        # Validate unit_id
        if not ObjectId.is_valid(unit_id):
            return jsonify({"success": False, "error": "Invalid unit ID"}), 400
            
        db = current_app.config['MONGO_DB']
        
        # Get unit
        unit = db.units.find_one({"_id": ObjectId(unit_id)})
        
        if not unit:
            return jsonify({"success": False, "error": "Unit not found"}), 404
            
        # Format response
        unit_data = {
            'id': str(unit['_id']),
            'code': unit['code'],
            'name': unit['name'],
            'description': unit.get('description', ''),
            'faculty_code': unit['faculty_code'],
            'faculty': unit['faculty'],
            'keywords': unit.get('keywords', [])
        }
        
        return jsonify({
            'success': True,
            'data': unit_data
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@units.route('/', methods=['POST'])
@token_required
def create_unit():
    """
    Create a new unit
    Requires admin role
    Required body parameters:
    - code: Unit code
    - name: Unit name
    - faculty_code: Faculty code
    - faculty: Faculty name
    Optional body parameters:
    - description: Unit description
    - keywords: Array of keywords
    """
    try:
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Check if user is admin
        user_id = g.user_id
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or user.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin privileges required"}), 403
        
        # Validate required fields
        required_fields = ['code', 'name', 'faculty_code', 'faculty']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"success": False, "error": f"Missing required field: {field}"}), 400
        
        # Check if unit code already exists
        existing_unit = db.units.find_one({"code": data['code']})
        if existing_unit:
            return jsonify({"success": False, "error": "Unit code already exists"}), 409
        
        # Create unit document
        new_unit = {
            "code": data['code'],
            "name": data['name'],
            "description": data.get('description', ''),
            "faculty_code": data['faculty_code'],
            "faculty": data['faculty'],
            "keywords": data.get('keywords', []),
            "created_at": datetime.utcnow()
        }
        
        # Insert unit
        result = db.units.insert_one(new_unit)
        
        # Return created unit
        unit_data = {
            'id': str(result.inserted_id),
            'code': new_unit['code'],
            'name': new_unit['name'],
            'description': new_unit['description'],
            'faculty_code': new_unit['faculty_code'],
            'faculty': new_unit['faculty'],
            'keywords': new_unit['keywords']
        }
        
        return jsonify({
            'success': True,
            'message': 'Unit created successfully',
            'data': unit_data
        }), 201
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@units.route('/<unit_id>', methods=['PUT'])
@token_required
def update_unit(unit_id):
    """
    Update a unit
    Requires admin role
    """
    try:
        # Validate unit_id
        if not ObjectId.is_valid(unit_id):
            return jsonify({"success": False, "error": "Invalid unit ID"}), 400
            
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Check if user is admin
        user_id = g.user_id
        user = db.users.find_one({"_id": ObjectId(user_id)})
        
        if not user or user.get('role') != 'admin':
            return jsonify({"success": False, "error": "Admin privileges required"}), 403
        
        # Check if unit exists
        existing_unit = db.units.find_one({"_id": ObjectId(unit_id)})
        if not existing_unit:
            return jsonify({"success": False, "error": "Unit not found"}), 404
        
        # Fields that can be updated
        allowed_fields = ['name', 'description', 'faculty_code', 'faculty', 'keywords']
        update_data = {}
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
                
        # Update unit code if provided and not already used by another unit
        if 'code' in data and data['code'] != existing_unit['code']:
            code_exists = db.units.find_one({
                "code": data['code'],
                "_id": {"$ne": ObjectId(unit_id)}
            })
            
            if code_exists:
                return jsonify({"success": False, "error": "Unit code already exists"}), 409
                
            update_data['code'] = data['code']
        
        if not update_data:
            return jsonify({"success": False, "error": "No valid fields to update"}), 400
        
        # Update unit
        result = db.units.update_one(
            {"_id": ObjectId(unit_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Unit not found"}), 404
        
        # Get updated unit
        updated_unit = db.units.find_one({"_id": ObjectId(unit_id)})
        
        # Format response
        unit_data = {
            'id': str(updated_unit['_id']),
            'code': updated_unit['code'],
            'name': updated_unit['name'],
            'description': updated_unit.get('description', ''),
            'faculty_code': updated_unit['faculty_code'],
            'faculty': updated_unit['faculty'],
            'keywords': updated_unit.get('keywords', [])
        }
        
        return jsonify({
            'success': True,
            'message': 'Unit updated successfully',
            'data': unit_data
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@units.route('/faculties', methods=['GET'])
def get_faculties():
    """
    Get all faculties
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Aggregate faculties from units
        faculties = db.units.aggregate([
            {"$group": {
                "_id": "$faculty_code",
                "name": {"$first": "$faculty"}
            }},
            {"$sort": {"_id": 1}}
        ])
        
        # Convert to list and format response
        faculties_list = []
        for faculty in faculties:
            faculties_list.append({
                'code': faculty['_id'],
                'name': faculty['name']
            })
        
        return jsonify({
            'success': True,
            'data': faculties_list
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500