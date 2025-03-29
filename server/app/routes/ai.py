from flask import Blueprint, request, jsonify, current_app, g
from bson.objectid import ObjectId
from datetime import datetime
from pymongo.errors import PyMongoError
from middleware.middleware import token_required
import os
import random
import re
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import openai

# Initialize NLTK resources
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')
    
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

ai = Blueprint('ai', __name__, url_prefix='/api/ai')

# Initialize Sentence Transformer model for embeddings
model = None
def get_model():
    global model
    if model is None:
        model = SentenceTransformer('all-MiniLM-L6-v2')
    return model

@ai.route('/analyze/<paper_id>', methods=['GET'])
@token_required
def analyze_paper(paper_id):
    """
    Analyze a past paper for difficulty, topics, and structure
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
            
        # Get paper file path
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], paper['file_path'])
        if not os.path.exists(file_path):
            return jsonify({"success": False, "error": "Paper file not found"}), 404
        
        # In a real implementation, this would extract text from the PDF/DOC
        # and analyze its content for difficulty, topics, etc.
        # For this example, we'll generate a placeholder analysis
        
        # Get unit information for context
        unit = db.units.find_one({"_id": paper['unit_id']})
        unit_keywords = unit.get('keywords', []) if unit else []
        
        # Generate a basic analysis
        analysis = {
            'difficulty_score': paper.get('avg_difficulty_rating', 0) or random.uniform(2.5, 4.5),
            'estimated_completion_time': random.randint(60, 180),  # minutes
            'question_count': random.randint(5, 15),
            'topics_detected': paper.get('topics', []) or sample_topics_for_unit(unit_keywords),
            'question_types': sample_question_types(),
            'structure_analysis': {
                'has_multiple_choice': random.choice([True, False]),
                'has_short_answer': random.choice([True, False]),
                'has_long_answer': True,
                'has_calculation': unit.get('faculty_code') in ['SCI', 'ENG', 'BUS'],
            }
        }
        
        # Update paper with detected topics if not already set
        if not paper.get('topics'):
            db.past_papers.update_one(
                {"_id": ObjectId(paper_id)},
                {"$set": {"topics": analysis['topics_detected']}}
            )
        
        return jsonify({
            'success': True,
            'data': analysis
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ai.route('/predict/<unit_id>', methods=['GET'])
@token_required
def predict_exam_questions(unit_id):
    """
    Predict likely exam questions for a unit based on past papers
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
            
        # Get past papers for the unit
        papers = list(db.past_papers.find({"unit_id": ObjectId(unit_id)}).sort("year", -1).limit(5))
        
        if not papers:
            return jsonify({"success": False, "error": "No past papers found for this unit"}), 404
            
        # In a real implementation, this would analyze past papers and use ML/AI
        # to predict likely exam questions
        # For this example, we'll generate placeholder predictions
        
        predictions = {
            'likely_topics': predict_likely_topics(papers, unit),
            'predicted_questions': generate_sample_questions(papers, unit),
            'topic_frequencies': calculate_topic_frequency(papers),
            'confidence_score': random.uniform(0.65, 0.95),
            'based_on_papers': [str(paper['_id']) for paper in papers]
        }
        
        return jsonify({
            'success': True,
            'data': predictions
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ai.route('/generate/questions', methods=['POST'])
@token_required
def generate_practice_questions():
    """
    Generate practice questions based on topics and difficulty
    Required body parameters:
    - unit_id: Unit ID
    - topics: Array of topics
    - difficulty: Desired difficulty level
    - count: Number of questions to generate (default: 5)
    """
    try:
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Validate required fields
        if not data or 'unit_id' not in data or 'topics' not in data:
            return jsonify({"success": False, "error": "Unit ID and topics are required"}), 400
            
        # Validate unit_id
        unit_id = data['unit_id']
        if not ObjectId.is_valid(unit_id):
            return jsonify({"success": False, "error": "Invalid unit ID"}), 400
            
        # Get unit
        unit = db.units.find_one({"_id": ObjectId(unit_id)})
        
        if not unit:
            return jsonify({"success": False, "error": "Unit not found"}), 404
            
        # Get parameters
        topics = data['topics']
        difficulty = data.get('difficulty', 'medium')
        count = int(data.get('count', 5))
        
        # In a real implementation, this would use OpenAI or a local model
        # to generate practice questions based on the topics
        # For this example, we'll generate placeholder questions
        
        # Generate questions
        open_ai_key = current_app.config.get('OPENAI_API_KEY')
        
        if open_ai_key:
            # Use OpenAI to generate questions
            questions = generate_questions_with_openai(unit, topics, difficulty, count, open_ai_key)
        else:
            # Use template-based generation
            questions = generate_template_questions(unit, topics, difficulty, count)
        
        return jsonify({
            'success': True,
            'data': {
                'questions': questions,
                'unit': {
                    'id': str(unit['_id']),
                    'code': unit['code'],
                    'name': unit['name']
                },
                'topics': topics,
                'difficulty': difficulty
            }
        })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

@ai.route('/similarity-analysis', methods=['POST'])
@token_required
def similarity_analysis():
    """
    Analyze similarity between papers or questions
    Required body parameters:
    - paper_ids: Array of paper IDs to compare
    or
    - texts: Array of text snippets to compare
    """
    try:
        db = current_app.config['MONGO_DB']
        data = request.json
        
        # Validate input
        if not data or ('paper_ids' not in data and 'texts' not in data):
            return jsonify({"success": False, "error": "Either paper_ids or texts are required"}), 400
            
        # Process papers if paper_ids provided
        if 'paper_ids' in data:
            paper_ids = data['paper_ids']
            
            # Validate paper_ids
            for paper_id in paper_ids:
                if not ObjectId.is_valid(paper_id):
                    return jsonify({"success": False, "error": f"Invalid paper ID: {paper_id}"}), 400
            
            # Get papers
            papers = []
            for paper_id in paper_ids:
                paper = db.past_papers.find_one({"_id": ObjectId(paper_id)})
                if paper:
                    papers.append(paper)
            
            if len(papers) < 2:
                return jsonify({"success": False, "error": "At least two valid papers are required for comparison"}), 400
                
            # In a real implementation, this would extract text from papers
            # and compute semantic similarity using embeddings
            # For this example, we'll generate a placeholder similarity matrix
            
            # Generate similarity matrix
            similarity_matrix = generate_similarity_matrix(len(papers))
            
            paper_info = [{
                'id': str(paper['_id']),
                'title': paper['title'],
                'year': paper['year'],
                'exam_type': paper['exam_type']
            } for paper in papers]
            
            return jsonify({
                'success': True,
                'data': {
                    'papers': paper_info,
                    'similarity_matrix': similarity_matrix,
                    'average_similarity': np.mean(similarity_matrix).item()
                }
            })
            
        # Process text snippets if texts provided
        else:
            texts = data['texts']
            
            if len(texts) < 2:
                return jsonify({"success": False, "error": "At least two texts are required for comparison"}), 400
                
            # Generate embeddings and compute similarity
            embeddings = compute_embeddings(texts)
            similarity_matrix = compute_similarity_matrix(embeddings)
            
            return jsonify({
                'success': True,
                'data': {
                    'texts': [text[:100] + '...' if len(text) > 100 else text for text in texts],
                    'similarity_matrix': similarity_matrix.tolist(),
                    'average_similarity': np.mean(similarity_matrix).item()
                }
            })
    
    except PyMongoError as e:
        current_app.logger.error(f"Database error: {str(e)}")
        return jsonify({"success": False, "error": "Database error"}), 500
    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({"success": False, "error": "An error occurred"}), 500

# Helper functions for AI blueprint

def sample_topics_for_unit(unit_keywords):
    """Generate sample topics based on unit keywords"""
    all_topics = [
        "Introduction to the subject", "Theoretical foundations", "Basic concepts",
        "Advanced techniques", "Practical applications", "Case studies",
        "Research methodologies", "Data analysis", "Critical evaluation",
        "Problem solving", "Ethical considerations", "Historical development",
        "Current trends", "Future directions", "Comparative analysis"
    ]
    
    # Add unit-specific keywords if available
    if unit_keywords:
        topics = unit_keywords[:5]  # Use up to 5 unit keywords
        # Add some generic topics
        remaining = 5 - len(topics)
        if remaining > 0:
            topics.extend(random.sample(all_topics, remaining))
        return topics
    else:
        # Use generic topics
        return random.sample(all_topics, 5)

def sample_question_types():
    """Generate sample question types with distribution"""
    question_types = {
        "multiple_choice": random.randint(0, 5),
        "short_answer": random.randint(1, 5),
        "essay": random.randint(0, 3),
        "calculation": random.randint(0, 5),
        "case_study": random.randint(0, 2)
    }
    # Filter out types with zero questions
    return {k: v for k, v in question_types.items() if v > 0}

def predict_likely_topics(papers, unit):
    """Predict likely topics based on past papers"""
    # Collect all topics from past papers
    all_topics = []
    for paper in papers:
        all_topics.extend(paper.get('topics', []))
    
    # Count topic frequencies
    topic_counts = {}
    for topic in all_topics:
        topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    # Sort by frequency
    sorted_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
    
    # Return top topics
    return [topic for topic, count in sorted_topics[:8]]

def generate_sample_questions(papers, unit):
    """Generate sample questions based on past papers and unit"""
    # Templates for different question types
    templates = {
        "multiple_choice": [
            "Which of the following best describes {topic}?",
            "What is the primary characteristic of {topic}?",
            "Which statement about {topic} is correct?"
        ],
        "short_answer": [
            "Define {topic} and provide an example.",
            "Explain the significance of {topic} in relation to {related_topic}.",
            "Describe the key features of {topic}."
        ],
        "essay": [
            "Critically analyze the role of {topic} in {context}.",
            "Compare and contrast {topic} and {related_topic}.",
            "Discuss the evolution of {topic} and its implications for {context}."
        ],
        "calculation": [
            "Calculate the {metric} for the following {topic} scenario: {scenario}",
            "Solve the following problem related to {topic}: {scenario}",
            "Using the principles of {topic}, determine the {metric} in the following case: {scenario}"
        ]
    }
    
    # Collect topics from papers
    topics = []
    for paper in papers:
        topics.extend(paper.get('topics', []))
    
    # Deduplicate topics
    unique_topics = list(set(topics))
    
    # If not enough topics, add unit keywords
    if len(unique_topics) < 3 and 'keywords' in unit:
        unique_topics.extend(unit['keywords'])
        unique_topics = list(set(unique_topics))
    
    # Generate questions
    questions = []
    for _ in range(8):  # Generate 8 sample questions
        # Select random question type
        q_type = random.choice(list(templates.keys()))
        
        # Select random template
        template = random.choice(templates[q_type])
        
        # Select random topic
        topic = random.choice(unique_topics) if unique_topics else "the subject"
        
        # Select related topic (different from main topic)
        related_topics = [t for t in unique_topics if t != topic]
        related_topic = random.choice(related_topics) if related_topics else "related concepts"
        
        # Generate context
        context = unit['name']
        
        # Generate scenario for calculation questions
        scenario = f"A problem involving {topic} with variables x and y."
        
        # Generate metric for calculation questions
        metrics = ["result", "value", "output", "coefficient", "rate", "ratio"]
        metric = random.choice(metrics)
        
        # Format question
        question = template.format(
            topic=topic,
            related_topic=related_topic,
            context=context,
            scenario=scenario,
            metric=metric
        )
        
        questions.append({
            "type": q_type,
            "question": question,
            "topics": [topic],
            "difficulty": random.choice(["easy", "medium", "hard"])
        })
    
    return questions

def calculate_topic_frequency(papers):
    """Calculate topic frequency across papers"""
    # Collect all topics
    topic_counts = {}
    for paper in papers:
        for topic in paper.get('topics', []):
            topic_counts[topic] = topic_counts.get(topic, 0) + 1
    
    # Convert to list format
    frequency_list = [{"topic": topic, "count": count} for topic, count in topic_counts.items()]
    
    # Sort by count (descending)
    frequency_list.sort(key=lambda x: x["count"], reverse=True)
    
    return frequency_list

def generate_similarity_matrix(size):
    """Generate a random similarity matrix"""
    # Create a symmetric matrix with 1s on diagonal
    matrix = np.zeros((size, size))
    for i in range(size):
        for j in range(i, size):
            if i == j:
                matrix[i, j] = 1.0
            else:
                # Random similarity value between 0.3 and 0.9
                sim = random.uniform(0.3, 0.9)
                matrix[i, j] = sim
                matrix[j, i] = sim
    
    return matrix.tolist()

def compute_embeddings(texts):
    """Compute embeddings for text snippets"""
    model = get_model()
    return model.encode(texts)

def compute_similarity_matrix(embeddings):
    """Compute similarity matrix from embeddings"""
    return cosine_similarity(embeddings)

def generate_questions_with_openai(unit, topics, difficulty, count, api_key):
    """Generate questions using OpenAI API"""
    openai.api_key = api_key
    
    # Create prompt
    prompt = f"""Generate {count} practice questions for a university course on {unit['name']} ({unit['code']}).
    
Topics to focus on:
{', '.join(topics)}

Difficulty level: {difficulty}

For each question, provide:
1. The question text
2. The question type (multiple_choice, short_answer, essay, calculation)
3. Topic tags
4. Difficulty rating
5. A sample answer or solution

Format each question as a JSON object."""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful academic assistant that generates exam questions."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Extract generated text
        generated_text = response.choices[0].message.content
        
        # In a real implementation, you would parse the JSON objects from the response
        # For this example, we'll generate placeholder questions
        questions = []
        for i in range(count):
            questions.append({
                "type": random.choice(["multiple_choice", "short_answer", "essay", "calculation"]),
                "question": f"Question {i+1} about {random.choice(topics)}",
                "topics": [random.choice(topics)],
                "difficulty": difficulty
            })
        
        return questions
        
    except Exception as e:
        current_app.logger.error(f"OpenAI API error: {str(e)}")
        # Fall back to template-based generation
        return generate_template_questions(unit, topics, difficulty, count)

def generate_template_questions(unit, topics, difficulty, count):
    """Generate questions using templates"""
    # Templates for different question types
    templates = {
        "multiple_choice": [
            "Which of the following best describes {topic}?",
            "What is the primary characteristic of {topic}?",
            "Which statement about {topic} is correct?"
        ],
        "short_answer": [
            "Define {topic} and provide an example.",
            "Explain the significance of {topic} in relation to {unit_name}.",
            "Describe the key features of {topic}."
        ],
        "essay": [
            "Critically analyze the role of {topic} in the field of {unit_name}.",
            "Compare and contrast different approaches to {topic}.",
            "Discuss the implications of {topic} for future developments in {unit_name}."
        ],
        "calculation": [
            "Calculate the results for the following problem related to {topic}: [problem details]",
            "Using {topic} principles, solve this equation: [equation]",
            "Apply {topic} techniques to find the solution to this problem: [problem details]"
        ]
    }
    
    questions = []
    for i in range(count):
        # Select random question type based on difficulty
        if difficulty == "easy":
            q_types = ["multiple_choice", "short_answer"]
        elif difficulty == "medium":
            q_types = ["multiple_choice", "short_answer", "calculation"]
        else:  # hard
            q_types = ["short_answer", "essay", "calculation"]
            
        q_type = random.choice(q_types)
        
        # Select random template
        template = random.choice(templates[q_type])
        
        # Select random topic
        topic = random.choice(topics)
        
        # Format question
        question = template.format(
            topic=topic,
            unit_name=unit['name']
        )
        
        questions.append({
            "type": q_type,
            "question": question,
            "topics": [topic],
            "difficulty": difficulty
        })
    
    return questions