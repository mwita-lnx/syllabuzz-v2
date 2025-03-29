from bson.objectid import ObjectId

def validate_saved_item(data):
    """
    Validate saved item data.
    
    Returns:
    {
        'error': True/False,
        'message': Error message if error is True
    }
    """
    # Check required fields
    required_fields = ['item_type', 'item_id']
    for field in required_fields:
        if field not in data:
            return {'error': True, 'message': f'Missing required field: {field}'}
    
    # Validate item type
    valid_item_types = ['unit', 'note', 'room', 'paper']
    if data['item_type'] not in valid_item_types:
        return {'error': True, 'message': f'Invalid item type. Must be one of: {", ".join(valid_item_types)}'}
    
    # Validate item_id format
    try:
        ObjectId(data['item_id'])
    except:
        return {'error': True, 'message': 'Invalid item_id format'}
    
    # Validate tags if provided
    if 'tags' in data:
        if not isinstance(data['tags'], list):
            return {'error': True, 'message': 'Tags must be an array'}
        
        for tag in data['tags']:
            if not isinstance(tag, str):
                return {'error': True, 'message': 'Each tag must be a string'}
    
    # Validate notes if provided
    if 'notes' in data and not isinstance(data['notes'], str):
        return {'error': True, 'message': 'Notes must be a string'}
    
    return {'error': False, 'message': ''}

def validate_rating(data):
    """
    Validate rating data.
    
    Returns:
    {
        'error': True/False,
        'message': Error message if error is True
    }
    """
    # Check required fields
    required_fields = ['item_type', 'item_id', 'rating_type', 'rating']
    for field in required_fields:
        if field not in data:
            return {'error': True, 'message': f'Missing required field: {field}'}
    
    # Validate item type
    valid_item_types = ['paper', 'note']
    if data['item_type'] not in valid_item_types:
        return {'error': True, 'message': f'Invalid item type. Must be one of: {", ".join(valid_item_types)}'}
    
    # Validate rating type based on item type
    valid_rating_types = {
        'paper': ['difficulty'],
        'note': ['quality']
    }
    
    if data['rating_type'] not in valid_rating_types.get(data['item_type'], []):
        valid_types = valid_rating_types.get(data['item_type'], [])
        return {'error': True, 'message': f'Invalid rating type for {data["item_type"]}. Must be one of: {", ".join(valid_types)}'}
    
    # Validate item_id format
    try:
        ObjectId(data['item_id'])
    except:
        return {'error': True, 'message': 'Invalid item_id format'}
    
    # Validate rating value
    try:
        rating = float(data['rating'])
        if rating < 1 or rating > 5:
            return {'error': True, 'message': 'Rating must be between 1 and 5'}
    except:
        return {'error': True, 'message': 'Rating must be a number'}
    
    # Validate comment if provided
    if 'comment' in data and not isinstance(data['comment'], str):
        return {'error': True, 'message': 'Comment must be a string'}
    
    return {'error': False, 'message': ''}