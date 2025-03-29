from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required

saved_items = Blueprint('saved_items', __name__)

@saved_items.route('/', methods=['GET'])
@token_required
def get_saved_items():
    """
    Get saved items for the current user
    Optional query parameters:
    - item_type: Filter by item type (unit, note, room, paper)
    - tags: Filter by tags (comma-separated list)
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        
        # Build query
        query = {"user_id": ObjectId(user_id)}
        
        # Apply filters
        item_type = request.args.get('item_type')
        if item_type:
            query["item_type"] = item_type
            
        tags = request.args.get('tags')
        if tags:
            tag_list = tags.split(',')
            query["tags"] = {"$in": tag_list}
        
        # Execute query
        cursor = db.saved_items.find(query).sort("saved_at", -1)
        items = list(cursor)
        
        # Convert ObjectId to string for JSON serialization
        for item in items:
            item['_id'] = str(item['_id'])
            item['user_id'] = str(item['user_id'])
            item['item_id'] = str(item['item_id'])
        
        return jsonify({"success": True, "data": items})
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@saved_items.route('/', methods=['POST'])
@token_required
def save_item():
    """
    Save a new item for the current user
    Required body parameters:
    - item_type: Type of item (unit, note, room, paper)
    - item_id: ID of the item to save
    Optional body parameters:
    - tags: Array of tag strings
    - notes: User notes about the saved item
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Validate required fields
        if not data or 'item_type' not in data or 'item_id' not in data:
            return jsonify({"success": False, "error": "Missing required fields"}), 400
            
        # Validate item type
        valid_types = ["unit", "note", "room", "paper"]
        if data['item_type'] not in valid_types:
            return jsonify({"success": False, "error": f"Invalid item type. Must be one of: {valid_types}"}), 400
        
        # Check if the referenced item exists
        collection_map = {
            "unit": "units",
            "note": "study_notes",
            "room": "revision_rooms",
            "paper": "past_papers"
        }
        
        collection = db[collection_map[data['item_type']]]
        item = collection.find_one({"_id": ObjectId(data['item_id'])})
        
        if not item:
            return jsonify({"success": False, "error": "Referenced item not found"}), 404
        
        # Check if already saved
        existing = db.saved_items.find_one({
            "user_id": ObjectId(user_id),
            "item_type": data['item_type'],
            "item_id": ObjectId(data['item_id'])
        })
        
        if existing:
            return jsonify({"success": False, "error": "Item already saved"}), 409
        
        # Create saved item
        new_saved_item = {
            "user_id": ObjectId(user_id),
            "item_type": data['item_type'],
            "item_id": ObjectId(data['item_id']),
            "saved_at": datetime.utcnow(),
            "tags": data.get('tags', []),
            "notes": data.get('notes', '')
        }
        
        result = db.saved_items.insert_one(new_saved_item)
        
        return jsonify({
            "success": True,
            "message": "Item saved successfully",
            "id": str(result.inserted_id)
        }), 201
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@saved_items.route('/<item_id>', methods=['DELETE'])
@token_required
def unsave_item(item_id):
    """
    Remove a saved item
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        
        # Find and delete the saved item
        result = db.saved_items.delete_one({
            "_id": ObjectId(item_id),
            "user_id": ObjectId(user_id)
        })
        
        if result.deleted_count == 0:
            return jsonify({"success": False, "error": "Item not found or not owned by user"}), 404
            
        return jsonify({"success": True, "message": "Item removed from saved items"})
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@saved_items.route('/<item_id>', methods=['PATCH'])
@token_required
def update_saved_item(item_id):
    """
    Update tags or notes for a saved item
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        data = request.json
        
        if not data:
            return jsonify({"success": False, "error": "No data provided"}), 400
            
        # Build update document
        update_doc = {}
        
        if 'tags' in data:
            update_doc['tags'] = data['tags']
            
        if 'notes' in data:
            update_doc['notes'] = data['notes']
            
        if not update_doc:
            return jsonify({"success": False, "error": "No valid fields to update"}), 400
        
        # Update the saved item
        result = db.saved_items.update_one(
            {"_id": ObjectId(item_id), "user_id": ObjectId(user_id)},
            {"$set": update_doc}
        )
        
        if result.matched_count == 0:
            return jsonify({"success": False, "error": "Item not found or not owned by user"}), 404
            
        return jsonify({"success": True, "message": "Saved item updated"})
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500