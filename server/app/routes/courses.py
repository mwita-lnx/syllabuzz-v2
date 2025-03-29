# app/routes/courses.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.course import Course
from app.models.unit import Unit
from app.models.user import User
from bson import ObjectId

courses_bp = Blueprint('courses', __name__)

@courses_bp.route('/', methods=['GET'])
@jwt_required()
def get_courses():
    current_user_id = get_jwt_identity()
    user = User.collection.find_one({'_id': ObjectId(current_user_id)})
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user['role'] == 'instructor':
        # Instructors see courses they created
        courses = Course.get_instructor_courses(current_user_id)
    else:
        # Students see all courses
        courses = Course.get_all()
    
    # Format courses for response
    formatted_courses = []
    for course in courses:
        formatted_courses.append({
            '_id': str(course['_id']),
            'name': course['name'],
            'code': course['code'],
            'description': course['description']
        })
    
    return jsonify({'courses': formatted_courses}), 200

@courses_bp.route('/<course_id>', methods=['GET'])
@jwt_required()
def get_course(course_id):
    course = Course.get_by_id(course_id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Get units for this course
    units = Unit.get_course_units(course_id)
    formatted_units = []
    
    for unit in units:
        formatted_units.append({
            '_id': str(unit['_id']),
            'name': unit['name'],
            'code': unit['code'],
            'description': unit['description']
        })
    
    # Format course for response
    formatted_course = {
        '_id': str(course['_id']),
        'name': course['name'],
        'code': course['code'],
        'description': course['description'],
        'units': formatted_units
    }
    
    return jsonify({'course': formatted_course}), 200

@courses_bp.route('/', methods=['POST'])
@jwt_required()
def create_course():
    current_user_id = get_jwt_identity()
    user = User.collection.find_one({'_id': ObjectId(current_user_id)})
    
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Only instructors can create courses'}), 403
    
    data = request.get_json()
    
    # Check if required fields are present
    if not all(k in data for k in ['name', 'code', 'description']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Create new course
    course = Course.create(
        name=data['name'],
        code=data['code'],
        description=data['description'],
        instructor_id=current_user_id
    )
    
    return jsonify({
        'message': 'Course created successfully',
        'course': {
            '_id': str(course['_id']),
            'name': course['name'],
            'code': course['code'],
            'description': course['description']
        }
    }), 201

@courses_bp.route('/<course_id>', methods=['PUT'])
@jwt_required()
def update_course(course_id):
    current_user_id = get_jwt_identity()
    course = Course.get_by_id(course_id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Check if user is the instructor of this course
    if str(course['instructor_id']) != current_user_id:
        return jsonify({'error': 'You are not authorized to update this course'}), 403
    
    data = request.get_json()
    
    # Update fields
    updates = {}
    if 'name' in data:
        updates['name'] = data['name']
    if 'code' in data:
        updates['code'] = data['code']
    if 'description' in data:
        updates['description'] = data['description']
    
    if updates:
        Course.collection.update_one(
            {'_id': ObjectId(course_id)},
            {'$set': updates}
        )
    
    # Get updated course
    updated_course = Course.get_by_id(course_id)
    
    return jsonify({
        'message': 'Course updated successfully',
        'course': {
            '_id': str(updated_course['_id']),
            'name': updated_course['name'],
            'code': updated_course['code'],
            'description': updated_course['description']
        }
    }), 200

@courses_bp.route('/<course_id>', methods=['DELETE'])
@jwt_required()
def delete_course(course_id):
    current_user_id = get_jwt_identity()
    course = Course.get_by_id(course_id)
    
    if not course:
        return jsonify({'error': 'Course not found'}), 404
    
    # Check if user is the instructor of this course
    if str(course['instructor_id']) != current_user_id:
        return jsonify({'error': 'You are not authorized to delete this course'}), 403
    
    # Delete the course and its associated units
    units = Unit.get_course_units(course_id)
    
    for unit in units:
        Unit.collection.delete_one({'_id': unit['_id']})
    
    Course.collection.delete_one({'_id': ObjectId(course_id)})
    
    return jsonify({
        'message': 'Course and its units deleted successfully'
    }), 200
