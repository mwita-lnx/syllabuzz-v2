from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required

ratings = Blueprint('ratings', __name__)

@ratings.route('/paper/<paper_id>', methods=['POST'])
@token_required
def rate_paper(paper_id):
    """
    Rate the difficulty of a past paper
    Required body parameter:
    - rating: Integer from 1-5 (1 = very easy, 5 = very difficult)
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Validate input
        if not data or 'rating' not in data:
            return jsonify({"success": False, "error": "Rating value is required"}), 400
            
        rating = data['rating']
        
        # Validate rating value
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Rating must be an integer between 1 and 5"}), 400
            
        # Check if paper exists
        paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
        if not paper:
            return jsonify({"success": False, "error": "Past paper not found"}), 404
            
        # Check if user has already rated this paper
        existing_rating = db.past_papers.find_one({
            "_id": ObjectId(paper_id),
            "difficulty_ratings.user_id": ObjectId(user_id)
        })
        
        if existing_rating:
            # Update existing rating
            result = db.past_papers.update_one(
                {
                    "_id": ObjectId(paper_id),
                    "difficulty_ratings.user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "difficulty_ratings.$.rating": rating,
                        "difficulty_ratings.$.timestamp": datetime.utcnow()
                    }
                }
            )
        else:
            # Add new rating
            result = db.past_papers.update_one(
                {"_id": ObjectId(paper_id)},
                {
                    "$push": {
                        "difficulty_ratings": {
                            "user_id": ObjectId(user_id),
                            "rating": rating,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
            
        # Update average rating
        pipeline = [
            {"$match": {"_id": ObjectId(paper_id)}},
            {"$unwind": "$difficulty_ratings"},
            {"$group": {
                "_id": "$_id",
                "avg_rating": {"$avg": "$difficulty_ratings.rating"}
            }}
        ]
        
        avg_result = list(db.past_papers.aggregate(pipeline))
        
        if avg_result:
            avg_rating = avg_result[0]['avg_rating']
            db.past_papers.update_one(
                {"_id": ObjectId(paper_id)},
                {"$set": {"avg_difficulty_rating": avg_rating}}
            )
        
        return jsonify({
            "success": True,
            "message": "Paper difficulty rating updated successfully"
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ratings.route('/note/<note_id>', methods=['POST'])
@token_required
def rate_note(note_id):
    """
    Rate the quality of a study note
    Required body parameter:
    - rating: Integer from 1-5 (1 = poor quality, 5 = excellent quality)
    """
    try:
        user_id = g.user_id
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Validate input
        if not data or 'rating' not in data:
            return jsonify({"success": False, "error": "Rating value is required"}), 400
            
        rating = data['rating']
        
        # Validate rating value
        try:
            rating = int(rating)
            if rating < 1 or rating > 5:
                raise ValueError()
        except (ValueError, TypeError):
            return jsonify({"success": False, "error": "Rating must be an integer between 1 and 5"}), 400
            
        # Check if note exists
        note = db.study_notes.find_one({"_id": ObjectId(note_id)})
        if not note:
            return jsonify({"success": False, "error": "Study note not found"}), 404
            
        # Check if user has already rated this note
        existing_rating = db.study_notes.find_one({
            "_id": ObjectId(note_id),
            "quality_ratings.user_id": ObjectId(user_id)
        })
        
        if existing_rating:
            # Update existing rating
            result = db.study_notes.update_one(
                {
                    "_id": ObjectId(note_id),
                    "quality_ratings.user_id": ObjectId(user_id)
                },
                {
                    "$set": {
                        "quality_ratings.$.rating": rating,
                        "quality_ratings.$.timestamp": datetime.utcnow()
                    }
                }
            )
        else:
            # Add new rating
            result = db.study_notes.update_one(
                {"_id": ObjectId(note_id)},
                {
                    "$push": {
                        "quality_ratings": {
                            "user_id": ObjectId(user_id),
                            "rating": rating,
                            "timestamp": datetime.utcnow()
                        }
                    }
                }
            )
            
        # Update average rating
        pipeline = [
            {"$match": {"_id": ObjectId(note_id)}},
            {"$unwind": "$quality_ratings"},
            {"$group": {
                "_id": "$_id",
                "avg_rating": {"$avg": "$quality_ratings.rating"}
            }}
        ]
        
        avg_result = list(db.study_notes.aggregate(pipeline))
        
        if avg_result:
            avg_rating = avg_result[0]['avg_rating']
            db.study_notes.update_one(
                {"_id": ObjectId(note_id)},
                {"$set": {"avg_quality_rating": avg_rating}}
            )
        
        return jsonify({
            "success": True,
            "message": "Note quality rating updated successfully"
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ratings.route('/paper/<paper_id>', methods=['GET'])
def get_paper_ratings(paper_id):
    """
    Get ratings for a specific past paper
    Returns average rating and total number of ratings
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Get paper with ratings
        paper = db.past_papers.find_one(
            {"_id": ObjectId(paper_id)},
            {"difficulty_ratings": 1, "avg_difficulty_rating": 1}
        )
        
        if not paper:
            return jsonify({"success": False, "error": "Past paper not found"}), 404
            
        # Count total ratings
        total_ratings = len(paper.get("difficulty_ratings", []))
        avg_rating = paper.get("avg_difficulty_rating", 0)
        
        return jsonify({
            "success": True,
            "data": {
                "average_rating": avg_rating,
                "total_ratings": total_ratings
            }
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ratings.route('/note/<note_id>', methods=['GET'])
def get_note_ratings(note_id):
    """
    Get ratings for a specific study note
    Returns average rating and total number of ratings
    """
    try:
        db = current_app.config['MONGO_DB']
        
        # Get note with ratings
        note = db.study_notes.find_one(
            {"_id": ObjectId(note_id)},
            {"quality_ratings": 1, "avg_quality_rating": 1}
        )
        
        if not note:
            return jsonify({"success": False, "error": "Study note not found"}), 404
            
        # Count total ratings
        total_ratings = len(note.get("quality_ratings", []))
        avg_rating = note.get("avg_quality_rating", 0)
        
        return jsonify({
            "success": True,
            "data": {
                "average_rating": avg_rating,
                "total_ratings": total_ratings
            }
        })
        
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500