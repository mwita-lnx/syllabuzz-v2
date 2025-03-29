# app/services/embedding_service.py
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from app import mongo
from app.config import Config
from bson import ObjectId

class EmbeddingService:
    def __init__(self):
        self.model = SentenceTransformer(Config.EMBEDDING_MODEL)
    
    def get_embedding(self, text):
        """Generate embedding for a text"""
        return self.model.encode(text).tolist()
    
    def get_embeddings(self, texts):
        """Generate embeddings for multiple texts"""
        return self.model.encode(texts).tolist()
    
    def find_similar_questions(self, question_text, unit_id, threshold=0.85):
        """Find similar questions using embeddings"""
        # Get embedding for the new question
        question_embedding = self.get_embedding(question_text)
        
        # Get all questions for the unit
        questions = list(mongo.db.questions.find({'unit_id': ObjectId(unit_id)}))
        
        if not questions:
            return None, question_embedding
        
        # Extract embeddings from existing questions
        existing_embeddings = []
        for q in questions:
            if 'embedding' in q and q['embedding']:
                existing_embeddings.append((q['_id'], q['embedding']))
        
        if not existing_embeddings:
            return None, question_embedding
        
        # Compare embeddings
        max_similarity = 0
        most_similar_question = None
        
        for q_id, emb in existing_embeddings:
            similarity = cosine_similarity(
                [question_embedding], 
                [emb]
            )[0][0]
            
            if similarity > max_similarity:
                max_similarity = similarity
                most_similar_question = q_id
        
        # If similarity is above threshold, return the most similar question
        if max_similarity >= threshold:
            return most_similar_question, question_embedding
        
        return None, question_embedding
    
    def find_related_notes(self, question_text, unit_id, top_k=3):
        """Find note sections related to a question"""
        # Get embedding for the question
        question_embedding = self.get_embedding(question_text)
        
        # Get all notes for the unit
        notes = list(mongo.db.notes.find({'unit_id': ObjectId(unit_id)}))
        
        if not notes:
            return []
        
        # Extract embeddings from notes
        note_embeddings = []
        for note in notes:
            if 'embeddings' in note and note['embeddings']:
                note_embeddings.append((note['_id'], note['embeddings'], note['title']))
        
        if not note_embeddings:
            return []
        
        # Compare embeddings and find top-k most similar notes
        similarities = []
        
        for note_id, emb, title in note_embeddings:
            similarity = cosine_similarity(
                [question_embedding], 
                [emb]
            )[0][0]
            similarities.append((note_id, similarity, title))
        
        # Sort by similarity (descending)
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top-k results
        return similarities[:top_k]
    
    def group_similar_questions(self, unit_id, threshold=0.85):
        """Group similar questions together"""
        questions = list(mongo.db.questions.find({'unit_id': ObjectId(unit_id)}))
        
        if not questions:
            return
        
        # Questions without a group will be assigned to a new group
        ungrouped = [q for q in questions if not q.get('group_id')]
        
        for i, q1 in enumerate(ungrouped):
            # Skip if this question was assigned to a group in a previous iteration
            if mongo.db.questions.find_one({'_id': q1['_id']}).get('group_id'):
                continue
                
            # Create a new group ID for this question
            group_id = str(ObjectId())
            mongo.db.questions.update_one(
                {'_id': q1['_id']},
                {'$set': {'group_id': group_id}}
            )
            
            # Find similar questions and assign them to the same group
            for j in range(i+1, len(ungrouped)):
                q2 = ungrouped[j]
                
                if q1['embedding'] and q2['embedding']:
                    similarity = cosine_similarity(
                        [q1['embedding']], 
                        [q2['embedding']]
                    )[0][0]
                    
                    if similarity >= threshold:
                        mongo.db.questions.update_one(
                            {'_id': q2['_id']},
                            {'$set': {'group_id': group_id}}
                        )
