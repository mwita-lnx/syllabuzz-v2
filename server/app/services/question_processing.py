# app/services/question_processing.py
import re
from app import mongo
from app.services.embedding_service import EmbeddingService
from bson import ObjectId
from app.models.question import Question
from app.models.note import Note

class QuestionProcessingService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    def process_new_question(self, question_text, unit_id, source_type, source_id, year=None):
        """Process a new question and find related information"""
        # Get embedding for the question
        similar_question_id, embedding = self.embedding_service.find_similar_questions(
            question_text, unit_id
        )
        
        # Find related notes
        related_notes = self.embedding_service.find_related_notes(
            question_text, unit_id
        )
        
        related_section_ids = [str(note_id) for note_id, _, _ in related_notes]
        
        if similar_question_id:
            # If similar question exists, update its frequency
            Question.update_frequency(similar_question_id)
            
            # Get the group_id of the similar question
            similar_question = Question.get_by_id(similar_question_id)
            group_id = similar_question.get('group_id')
            
            if not group_id:
                # Create a new group if none exists
                group_id = str(ObjectId())
                mongo.db.questions.update_one(
                    {'_id': ObjectId(similar_question_id)},
                    {'$set': {'group_id': group_id}}
                )
        else:
            # No similar question found, create a new group
            group_id = str(ObjectId())
        
        # Create the new question
        question = Question.create(
            text=question_text,
            unit_id=unit_id,
            source_type=source_type,
            source_id=source_id,
            year=year,
            embedding=embedding,
            related_sections=related_section_ids,
            frequency=1,
            group_id=group_id
        )
        
        return question, related_notes
    
    def identify_question_topics(self, question_text):
        """
        Identify potential topics in a question using keyword extraction
        This is a simple implementation that could be enhanced with NLP techniques
        """
        # Simple keyword extraction (could be improved with NLP)
        common_topics = [
            "algorithm", "data structure", "function", "class", "method",
            "inheritance", "polymorphism", "encapsulation", "abstraction",
            "database", "SQL", "normalization", "transaction", "ACID",
            "network", "protocol", "TCP/IP", "OSI", "security",
            "cryptography", "hash", "encryption", "authentication",
            "operating system", "process", "thread", "scheduling", "memory",
            "file system", "distributed", "concurrent", "parallel"
        ]
        
        found_topics = []
        for topic in common_topics:
            if re.search(rf'\b{re.escape(topic)}\b', question_text, re.IGNORECASE):
                found_topics.append(topic)
                
        return found_topics
    
    def analyze_question_difficulty(self, question_text):
        """
        Estimate question difficulty based on text analysis
        This is a simple implementation that could be enhanced with ML
        """
        # Simple heuristics for difficulty assessment
        words = question_text.lower().split()
        word_count = len(words)
        
        # Check for certain keywords that might indicate complexity
        complexity_indicators = ["analyze", "evaluate", "compare", "contrast", 
                                "design", "develop", "implement", "optimize",
                                "complex", "advanced", "challenging"]
        
        complexity_count = sum(1 for word in words if word in complexity_indicators)
        
        # Check sentence length (longer sentences often indicate more complex questions)
        sentences = re.split(r'[.!?]+', question_text)
        avg_sentence_length = sum(len(s.split()) for s in sentences if s) / max(len([s for s in sentences if s]), 1)
        
        # Determine difficulty based on the metrics
        if word_count > 50 or complexity_count >= 2 or avg_sentence_length > 20:
            return "hard"
        elif word_count > 30 or complexity_count >= 1 or avg_sentence_length > 15:
            return "medium"
        else:
            return "easy"
    
    def get_question_highlights(self, question_id):
        """Get highlighted sections of notes for a question"""
        question = Question.get_by_id(question_id)
        if not question or not question.get('related_sections'):
            return []
        
        highlighted_sections = []
        
        for section_id in question['related_sections']:
            note = Note.get_by_id(section_id)
            if note:
                # Extract the most relevant part of the note
                # This is a simple implementation that could be improved
                sentences = re.split(r'[.!?]+', note['content'])
                
                # Score each sentence based on word overlap with question
                question_words = set(question['text'].lower().split())
                scored_sentences = []
                
                for sentence in sentences:
                    if len(sentence.strip()) < 10:  # Skip very short sentences
                        continue
                    
                    sentence_words = set(sentence.lower().split())
                    overlap = len(question_words.intersection(sentence_words))
                    score = overlap / max(len(sentence_words), 1)  # Normalize by sentence length
                    scored_sentences.append((sentence, score))
                
                # Sort by score (descending)
                scored_sentences.sort(key=lambda x: x[1], reverse=True)
                
                # Take top 3 sentences as highlights
                top_sentences = [s for s, _ in scored_sentences[:3]]
                
                highlighted_sections.append({
                    'note_id': str(note['_id']),
                    'title': note['title'],
                    'highlights': top_sentences,
                    'page_numbers': note.get('page_numbers', [])
                })
        
        return highlighted_sections