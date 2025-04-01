from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required
from app import mongo

saved_items = Blueprint('saved-items', __name__, url_prefix='/api/saved-items')

@saved_items.route('/', methods=['GET'])
@token_required
def get_saved_items():
    """
    Get saved items for the current user
    Optional query parameters:
    - type: Filter by item type (unit, note, pastpaper)
    - tags: Filter by tags (comma-separated list)
    """
    try:
        user_id = g.user_id
        db = mongo.db
        
        # Build query
        query = {"user_id": ObjectId(user_id)}
        
        # Apply filters
        item_type = request.args.get('type')
        if item_type:
            query["item_type"] = item_type
            
        tags = request.args.get('tags')
        if tags:
            tag_list = tags.split(',')
            query["tags"] = {"$in": tag_list}
        
        # Execute query
        cursor = db.saved_items.find(query).sort("saved_at", -1)
        items = list(cursor)
        
        # Format items with related data
        formatted_items = []
        for item in items:
            # Convert IDs to strings
            formatted_item = {
                'id': str(item['_id']),
                'user_id': str(item['user_id']),
                'item_id': str(item['item_id']),
                'item_type': item['item_type'],
                'saved_at': item['saved_at'].isoformat() if isinstance(item['saved_at'], datetime) else item['saved_at'],
                'tags': item.get('tags', []),
                'notes': item.get('notes', '')
            }
            
            # Fetch additional details based on item type
            collection_map = {
                "unit": "units",
                "note": "notes",
                "pastpaper": "past_papers"
            }
            
            if item['item_type'] in collection_map:
                collection = db[collection_map[item['item_type']]]
                entity = collection.find_one({"_id": ObjectId(item['item_id'])})
                
                if entity:
                    # Add basic info based on item type
                    if item['item_type'] == "unit":
                        formatted_item['details'] = {
                            'name': entity.get('name', ''),
                            'code': entity.get('code', ''),
                            'faculty': entity.get('faculty', '')
                        }
                    elif item['item_type'] == "note":
                        formatted_item['details'] = {
                            'title': entity.get('title', ''),
                            'type': entity.get('type', ''),
                            'faculty': entity.get('faculty', '')
                        }
                    elif item['item_type'] == "pastpaper":
                        formatted_item['details'] = {
                            'title': entity.get('title', ''),
                            'year': entity.get('year', ''),
                            'exam_type': entity.get('exam_type', '')
                        }
            
            formatted_items.append(formatted_item)
        
        return jsonify({
            "status": "success", 
            "data": formatted_items, 
            "count": len(formatted_items)
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500

@saved_items.route('/add', methods=['POST'])
@token_required
def save_item():
    """
    Save a new item for the current user
    Required body parameters:
    - type: Type of item (unit, note, pastpaper)
    - item_id: ID of the item to save
    Optional body parameters:
    - tags: Array of tag strings
    - notes: User notes about the saved item
    """
    try:
        user_id = g.user_id
        db = mongo.db
        data = request.json
        
        # Validate required fields
        if not data or 'type' not in data or 'item_id' not in data:
            return jsonify({"status": "error", "message": "Missing required fields: type and item_id"}), 400
            
        # Validate item type
        item_type = data['type']
        valid_types = ["unit", "note", "pastpaper"]
        if item_type not in valid_types:
            return jsonify({"status": "error", "message": f"Invalid item type. Must be one of: {valid_types}"}), 400
        
        # Check if the referenced item exists
        collection_map = {
            "unit": "units",
            "note": "notes",
            "pastpaper": "past_papers"
        }
        
        collection = db[collection_map[item_type]]
        try:
            item = collection.find_one({"_id": ObjectId(data['item_id'])})
        except:
            return jsonify({"status": "error", "message": "Invalid item ID format"}), 400
        
        if not item:
            return jsonify({"status": "error", "message": "Referenced item not found"}), 404
        
        # Check if already saved
        existing = db.saved_items.find_one({
            "user_id": ObjectId(user_id),
            "item_type": item_type,
            "item_id": ObjectId(data['item_id'])
        })
        
        if existing:
            return jsonify({
                "status": "success", 
                "message": "Item was already saved",
                "saved_item_id": str(existing['_id'])
            }), 200
        
        # Create saved item
        new_saved_item = {
            "user_id": ObjectId(user_id),
            "item_type": item_type,
            "item_id": ObjectId(data['item_id']),
            "saved_at": datetime.utcnow(),
            "tags": data.get('tags', []),
            "notes": data.get('notes', '')
        }
        
        result = db.saved_items.insert_one(new_saved_item)
        
        return jsonify({
            "status": "success",
            "message": "Item saved successfully",
            "saved_item_id": str(result.inserted_id)
        }), 201
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500

@saved_items.route('/remove', methods=['POST'])
@token_required
def unsave_item():
    """
    Remove a saved item
    Required body parameters:
    - type: Type of item (unit, note, pastpaper)
    - item_id: ID of the item to unsave
    """
    try:
        user_id = g.user_id
        db = mongo.db
        data = request.json
        
        # Validate required fields
        if not data or 'type' not in data or 'item_id' not in data:
            return jsonify({"status": "error", "message": "Missing required fields: type and item_id"}), 400
        
        # Find and delete the saved item
        result = db.saved_items.delete_one({
            "user_id": ObjectId(user_id),
            "item_type": data['type'],
            "item_id": ObjectId(data['item_id'])
        })
        
        if result.deleted_count == 0:
            return jsonify({"status": "error", "message": "Item not found or not saved by user"}), 404
            
        return jsonify({"status": "success", "message": "Item removed from saved items"})
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500

@saved_items.route('/update/<saved_item_id>', methods=['PUT'])
@token_required
def update_saved_item(saved_item_id):
    """
    Update tags or notes for a saved item
    """
    try:
        user_id = g.user_id
        db = mongo.db
        data = request.json
        
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400
            
        # Build update document
        update_doc = {}
        
        if 'tags' in data:
            update_doc['tags'] = data['tags']
            
        if 'notes' in data:
            update_doc['notes'] = data['notes']
            
        if not update_doc:
            return jsonify({"status": "error", "message": "No valid fields to update"}), 400
        
        # Update the saved item
        result = db.saved_items.update_one(
            {"_id": ObjectId(saved_item_id), "user_id": ObjectId(user_id)},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({"status": "error", "message": "Item not found or not owned by user"}), 404
            
        return jsonify({"status": "success", "message": "Saved item updated"})
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500

@saved_items.route('/check', methods=['GET'])
@token_required
def check_saved_status():
    """
    Check if an item is saved by the current user
    Required query parameters:
    - type: Type of item (unit, note, pastpaper)
    - item_id: ID of the item to check
    """
    try:
        user_id = g.user_id
        db = mongo.db
        
        # Get query parameters
        item_type = request.args.get('type')
        item_id = request.args.get('item_id')
        
        # Validate required fields
        if not item_type or not item_id:
            return jsonify({"status": "error", "message": "Missing required query parameters: type and item_id"}), 400
        
        # Check if the item is saved
        try:
            existing = db.saved_items.find_one({
                "user_id": ObjectId(user_id),
                "item_type": item_type,
                "item_id": ObjectId(item_id)
            })
        except:
            return jsonify({"status": "error", "message": "Invalid item ID format"}), 400
        
        return jsonify({
            "status": "success",
            "data": {
                "bookmarked": existing is not None,
                "saved_item_id": str(existing['_id']) if existing else None
            }
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"status": "error", "message": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "message": "An error occurred"}), 500