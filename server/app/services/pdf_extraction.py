# app/services/pdf_extraction.py
import os
import re
import fitz  # PyMuPDF
import nltk
from nltk.tokenize import sent_tokenize
from app.config import Config
from app.services.embedding_service import EmbeddingService

# Download NLTK resources
nltk.download('punkt', quiet=True)

class PDFExtractionService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    def extract_text_from_pdf(self, pdf_path):
        """Extract text from PDF file"""
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        doc = fitz.open(pdf_path)
        text_by_page = []
        
        for page_num, page in enumerate(doc):
            text = page.get_text()
            text_by_page.append((page_num + 1, text))
        
        return text_by_page
    
    def extract_questions_from_exam(self, pdf_path, unit_id, year=None, source_type="exam"):
        """Extract questions from past papers"""
        text_by_page = self.extract_text_from_pdf(pdf_path)
        all_questions = []
        
        # Regular expressions for question patterns
        question_patterns = [
            r'(?:^|\n)(?:Q|Question)[\s\.:]?(\d+)[\.\)]?\s*(.*?)(?=(?:^|\n)(?:Q|Question)[\s\.:]?\d+|\Z)',
            r'(?:^|\n)(\d+)[\.\)]\s*(.*?)(?=(?:^|\n)\d+[\.\)]|\Z)',
            r'(?:^|\n)(?:QUESTION|Question)\s*(\d+)[\.\:]?\s*(.*?)(?=(?:^|\n)(?:QUESTION|Question)\s*\d+|\Z)'
        ]
        
        source_id = os.path.basename(pdf_path)
        
        for page_num, text in text_by_page:
            for pattern in question_patterns:
                matches = re.finditer(pattern, text, re.DOTALL | re.MULTILINE)
                
                for match in matches:
                    question_number = match.group(1)
                    question_text = match.group(2).strip()
                    
                    # Further clean the question text
                    question_text = re.sub(r'\s+', ' ', question_text).strip()
                    
                    # Skip very short or likely non-question texts
                    if len(question_text) < 10 or not re.search(r'[.?]', question_text):
                        continue
                    
                    # Get embedding for the question
                    embedding = self.embedding_service.get_embedding(question_text)
                    
                    # Create question object
                    question = {
                        'text': question_text,
                        'unit_id': unit_id,
                        'source_type': source_type,  # 'exam' or 'cat'
                        'source_id': source_id,
                        'year': year,
                        'page_number': page_num,
                        'question_number': question_number,
                        'embedding': embedding
                    }
                    
                    all_questions.append(question)
        
        return all_questions
    
    def extract_notes_sections(self, pdf_path, unit_id, topic=None):
        """Extract sections from lecture notes"""
        text_by_page = self.extract_text_from_pdf(pdf_path)
        all_sections = []
        
        # Combine all text for initial processing
        full_text = ' '.join([text for _, text in text_by_page])
        
        # Try to identify headings and section breaks
        heading_patterns = [
            r'(?:^|\n)(?:Chapter|CHAPTER)\s+\d+[\.:]\s*(.*?)(?=\n)',
            r'(?:^|\n)(?:\d+\.)\s+(.*?)(?=\n)',
            r'(?:^|\n)([A-Z][A-Z\s]+)(?=\n)'
        ]
        
        potential_headings = []
        for pattern in heading_patterns:
            matches = re.finditer(pattern, full_text)
            for match in matches:
                heading = match.group(1).strip()
                if len(heading) > 3 and len(heading) < 100:  # Reasonable heading length
                    potential_headings.append((match.start(), heading))
        
        # Sort headings by position in text
        potential_headings.sort()
        
        # If we found headings, use them to divide content
        if potential_headings:
            sections = []
            for i, (pos, heading) in enumerate(potential_headings):
                if i < len(potential_headings) - 1:
                    next_pos = potential_headings[i+1][0]
                    content = full_text[pos:next_pos].strip()
                else:
                    content = full_text[pos:].strip()
                
                # Skip very short sections (likely false positives)
                if len(content) < 100:
                    continue
                    
                sections.append((heading, content))
        else:
            # If no headings found, divide by pages or paragraphs
            sections = []
            for page_num, text in text_by_page:
                # Get first sentence as "heading"
                sentences = sent_tokenize(text.strip())
                if sentences:
                    heading = sentences[0][:50] + "..." if len(sentences[0]) > 50 else sentences[0]
                    sections.append((f"Page {page_num}: {heading}", text))
        
        # Process sections
        for heading, content in sections:
            # Generate embedding for the section
            embedding = self.embedding_service.get_embedding(content)
            
            # Create note section
            section = {
                'title': heading,
                'content': content,
                'unit_id': unit_id,
                'topic': topic,
                'pdf_path': pdf_path,
                'embeddings': embedding
            }
            
            all_sections.append(section)
        
        return all_sections
