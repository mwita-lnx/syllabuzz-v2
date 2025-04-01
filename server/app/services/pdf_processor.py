# pdf_processor.py
import os
import re
import fitz  # PyMuPDF
from datetime import datetime
import uuid
import hashlib
from sentence_transformers import SentenceTransformer
import nltk
from nltk.tokenize import sent_tokenize
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Download NLTK resources if not already downloaded
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class PDFProcessor:
    """Class for processing PDFs, extracting text, and identifying references"""
    
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        """Initialize the PDF processor"""
        self.model = None
        self.model_name = model_name
        
        # Lazy load the embedding model when needed
        # This saves memory until the model is actually required
    
    def _load_model(self):
        """Load the sentence transformer model for embeddings"""
        if self.model is None:
            logger.info(f"Loading embedding model: {self.model_name}")
            self.model = SentenceTransformer(self.model_name)
    
    def process_pdf(self, file_path, extract_references=True, generate_embeddings=True):
        """
        Process a PDF file to extract text and references
        
        Args:
            file_path (str): Path to the PDF file
            extract_references (bool): Whether to extract references
            generate_embeddings (bool): Whether to generate embeddings
            
        Returns:
            tuple: (text_by_page, metadata, references, embeddings)
        """
        try:
            # Open the PDF
            doc = fitz.open(file_path)
            total_pages = len(doc)
            
            # Text by page dictionary
            text_by_page = {}
            
            # Document metadata
            metadata = self._extract_metadata(doc)
            metadata['total_pages'] = total_pages
            
            # References list
            references = []
            
            # Process each page
            for page_num, page in enumerate(doc, 1):
                # Extract text from the page
                text = page.get_text()
                text_by_page[page_num] = text
                
                # Extract references if enabled
                if extract_references:
                    page_refs = self._extract_references(text, page_num)
                    references.extend(page_refs)
            
            # Generate embeddings if enabled
            embeddings = None
            if generate_embeddings:
                embeddings = self._generate_embeddings(text_by_page)
            
            return text_by_page, metadata, references, embeddings
            
        except Exception as e:
            logger.error(f"Error processing PDF: {str(e)}")
            raise
    
    def _extract_metadata(self, doc):
        """Extract metadata from the PDF document"""
        metadata = {
            'title': doc.metadata.get('title', ''),
            'author': doc.metadata.get('author', ''),
            'subject': doc.metadata.get('subject', ''),
            'keywords': doc.metadata.get('keywords', ''),
            'creator': doc.metadata.get('creator', ''),
            'producer': doc.metadata.get('producer', ''),
            'creation_date': doc.metadata.get('creationDate', ''),
            'modification_date': doc.metadata.get('modDate', ''),
            'file_size': doc.size,
            'page_count': len(doc)
        }
        
        # Extract title from first page if not in metadata
        if not metadata['title']:
            try:
                first_page_text = doc[0].get_text()
                lines = first_page_text.strip().split('\n')
                # Heuristic: first non-empty line might be the title
                for line in lines:
                    if line.strip():
                        metadata['title'] = line.strip()
                        break
            except:
                pass
        
        return metadata
    
    def _extract_references(self, text, page_num):
        """
        Extract potential references from text
        
        This function uses various heuristics to identify references:
        1. Citation patterns like [1], [Smith et al., 2020]
        2. Footnote markers like ¹, ², ³
        3. Section headers that might indicate references
        """
        references = []
        
        # Split text into lines
        lines = text.split('\n')
        
        # Patterns for references
        citation_pattern = r'\[\d+\]|\[\w+\s+et\s+al\.?,\s+\d{4}\]'
        footnote_pattern = r'[¹²³⁴⁵⁶⁷⁸⁹]'
        reference_section_patterns = [
            r'^references$', 
            r'^bibliography$',
            r'^works cited$',
            r'^citations$'
        ]
        
        # Check if this page contains a references section
        is_reference_section = False
        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            for pattern in reference_section_patterns:
                if re.match(pattern, line_lower):
                    is_reference_section = True
                    # Add the section header as a reference
                    reference = {
                        'id': str(uuid.uuid4()),
                        'pageNumber': page_num,
                        'text': f"References section starts here: {line.strip()}",
                        'title': "References Section",
                        'type': 'section',
                        'created_at': datetime.now()
                    }
                    references.append(reference)
                    break
        
        # Process lines for references
        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue
            
            # Check for citation pattern
            citations = re.findall(citation_pattern, line)
            if citations:
                reference = {
                    'id': str(uuid.uuid4()),
                    'pageNumber': page_num,
                    'text': line,
                    'title': f"Citation on page {page_num}",
                    'type': 'citation',
                    'created_at': datetime.now()
                }
                references.append(reference)
                continue
            
            # Check for footnote pattern
            if re.search(footnote_pattern, line):
                reference = {
                    'id': str(uuid.uuid4()),
                    'pageNumber': page_num,
                    'text': line,
                    'title': f"Footnote on page {page_num}",
                    'type': 'footnote',
                    'created_at': datetime.now()
                }
                references.append(reference)
                continue
            
            # If we're in a reference section, each line could be a reference
            if is_reference_section and len(line) > 30:  # Minimum length to be a reference
                reference = {
                    'id': str(uuid.uuid4()),
                    'pageNumber': page_num,
                    'text': line,
                    'title': f"Reference from bibliography",
                    'type': 'bibliography',
                    'created_at': datetime.now()
                }
                references.append(reference)
        
        return references
    
    def _generate_embeddings(self, text_by_page):
        """Generate embeddings for each chunk of text"""
        self._load_model()  # Ensure model is loaded
        
        embeddings = {}
        chunks = []
        chunk_metadata = []
        
        # Process each page into sentence chunks
        for page_num, text in text_by_page.items():
            # Skip if text is too short
            if len(text) < 10:
                continue
                
            # Split text into sentences
            sentences = sent_tokenize(text)
            
            # Process sentences into chunks
            current_chunk = ""
            for sentence in sentences:
                # Skip very short sentences
                if len(sentence) < 5:
                    continue
                    
                # Add sentence to current chunk
                if len(current_chunk) + len(sentence) < 512:
                    current_chunk += sentence + " "
                else:
                    # Store the chunk and start a new one
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                        chunk_metadata.append({
                            'page': page_num,
                            'text': current_chunk[:100] + "..." if len(current_chunk) > 100 else current_chunk
                        })
                    current_chunk = sentence + " "
            
            # Add the last chunk if not empty
            if current_chunk:
                chunks.append(current_chunk.strip())
                chunk_metadata.append({
                    'page': page_num,
                    'text': current_chunk[:100] + "..." if len(current_chunk) > 100 else current_chunk
                })
        
        # Generate embeddings for all chunks
        if chunks:
            chunk_embeddings = self.model.encode(chunks)
            
            # Store embeddings with metadata
            embeddings = {
                'embeddings': chunk_embeddings.tolist(),
                'metadata': chunk_metadata
            }
        
        return embeddings
    
    def extract_chapters_and_sections(self, text_by_page):
        """Extract chapters and sections from the PDF"""
        chapters = []
        
        # Patterns for chapter and section headings
        chapter_patterns = [
            r'^Chapter\s+\d+[\.:]\s+(.+)$',
            r'^CHAPTER\s+\d+[\.:]\s+(.+)$',
            r'^\d+[\.:]\s+(.+)$'
        ]
        
        section_patterns = [
            r'^\d+\.\d+[\.:]\s+(.+)$',
            r'^[A-Z]\.\s+(.+)$',
            r'^\d+\.\s+(.+)$'
        ]
        
        current_chapter = None
        
        # Process each page
        for page_num, text in text_by_page.items():
            lines = text.split('\n')
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Check for chapter patterns
                for pattern in chapter_patterns:
                    match = re.match(pattern, line, re.IGNORECASE)
                    if match:
                        title = match.group(1) if match.groups() else line
                        current_chapter = {
                            'id': str(uuid.uuid4()),
                            'title': title,
                            'pageNumber': page_num,
                            'type': 'chapter',
                            'sections': []
                        }
                        chapters.append(current_chapter)
                        break
                
                # Check for section patterns if we have a current chapter
                if current_chapter:
                    for pattern in section_patterns:
                        match = re.match(pattern, line, re.IGNORECASE)
                        if match:
                            title = match.group(1) if match.groups() else line
                            section = {
                                'id': str(uuid.uuid4()),
                                'title': title,
                                'pageNumber': page_num,
                                'type': 'section'
                            }
                            current_chapter['sections'].append(section)
                            break
        
        return chapters
    
    def generate_embeddings_for_search(self, text, model=None):
        """Generate embeddings for search query text"""
        if model is None:
            self._load_model()
            model = self.model
            
        return model.encode(text).tolist()