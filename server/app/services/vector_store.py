# vector_store.py
from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue, Range
import numpy as np
import uuid
import logging
from pdf_processor import PDFProcessor
from typing import List, Dict, Any, Optional, Union

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VectorStore:
    """Class for managing vector storage and search with Qdrant"""
    
    def __init__(self, host='localhost', port=6333, collection_name='notes_content'):
        """Initialize the vector store with Qdrant connection"""
        self.client = QdrantClient(host=host, port=port)
        self.collection_name = collection_name
        self.embedding_dim = 384  # Dimension for the default model (all-MiniLM-L6-v2)
        self.pdf_processor = PDFProcessor()
        
        # Ensure collection exists
        self._ensure_collection()
    
    def _ensure_collection(self):
        """Ensure the collection exists in Qdrant"""
        collections = self.client.get_collections().collections
        collection_exists = any(collection.name == self.collection_name for collection in collections)
        
        if not collection_exists:
            logger.info(f"Creating collection: {self.collection_name}")
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                )
            )
    
    def index_document(self, note_id: str, text_by_page: Dict[int, str], metadata: Dict[str, Any]) -> bool:
        """
        Index document text in the vector store
        
        Args:
            note_id (str): Unique identifier for the note
            text_by_page (dict): Dictionary mapping page numbers to text content
            metadata (dict): Additional metadata for the document
            
        Returns:
            bool: Success status
        """
        try:
            # Generate embeddings for document chunks
            embeddings_data = self.pdf_processor._generate_embeddings(text_by_page)
            
            if not embeddings_data or 'embeddings' not in embeddings_data:
                logger.warning(f"No embeddings generated for note: {note_id}")
                return False
            
            # Prepare points for Qdrant
            points = []
            
            for i, (embedding, chunk_metadata) in enumerate(zip(
                embeddings_data['embeddings'], 
                embeddings_data['metadata']
            )):
                # Create a unique ID for this chunk
                chunk_id = f"{note_id}_{chunk_metadata['page']}_{i}"
                
                # Create the point
                point = PointStruct(
                    id=chunk_id,
                    vector=embedding,
                    payload={
                        "note_id": note_id,
                        "page": chunk_metadata['page'],
                        "text": chunk_metadata['text'],
                        "chunk_index": i,
                        # Add additional metadata fields
                        "title": metadata.get('title', ''),
                        "author": metadata.get('author', ''),
                        "faculty": metadata.get('faculty', ''),
                        "faculty_code": metadata.get('faculty_code', ''),
                        "unit_id": metadata.get('unit_id', ''),
                        "type": metadata.get('type', 'notes')
                    }
                )
                
                points.append(point)
            
            # Upsert points to Qdrant in batches
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i+batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch
                )
            
            logger.info(f"Indexed {len(points)} chunks for note: {note_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error indexing document: {str(e)}")
            return False
    
    def search(self, 
               query: str, 
               limit: int = 10, 
               unit_id: Optional[str] = None,
               faculty_code: Optional[str] = None,
               note_type: Optional[str] = None) -> List[Dict]:
        """
        Search for relevant document chunks
        
        Args:
            query (str): Search query text
            limit (int): Maximum number of results to return
            unit_id (str, optional): Filter by unit ID
            faculty_code (str, optional): Filter by faculty code
            note_type (str, optional): Filter by note type
            
        Returns:
            list: List of search results
        """
        try:
            # Generate embedding for the query
            query_embedding = self.pdf_processor.generate_embeddings_for_search(query)
            
            # Build filter conditions
            filter_conditions = []
            
            if unit_id:
                filter_conditions.append(
                    FieldCondition(
                        key="unit_id",
                        match=MatchValue(value=unit_id)
                    )
                )
            
            if faculty_code:
                filter_conditions.append(
                    FieldCondition(
                        key="faculty_code",
                        match=MatchValue(value=faculty_code)
                    )
                )
            
            if note_type:
                filter_conditions.append(
                    FieldCondition(
                        key="type",
                        match=MatchValue(value=note_type)
                    )
                )
            
            # Create the filter
            search_filter = Filter(must=filter_conditions) if filter_conditions else None
            
            # Perform the search
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                limit=limit,
                query_filter=search_filter
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "note_id": result.payload["note_id"],
                    "page": result.payload["page"],
                    "text": result.payload["text"],
                    "title": result.payload.get("title", ""),
                    "similarity_score": result.score
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            return []
    
    def delete_document(self, note_id: str) -> bool:
        """
        Delete a document from the vector store
        
        Args:
            note_id (str): ID of the note to delete
            
        Returns:
            bool: Success status
        """
        try:
            # Find all points with this note_id prefix
            response = self.client.scroll(
                collection_name=self.collection_name,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="note_id",
                            match=MatchValue(value=note_id)
                        )
                    ]
                ),
                limit=1000  # Adjust based on expected max chunks per document
            )
            
            # Extract IDs to delete
            point_ids = [point.id for point in response[0]]
            
            if not point_ids:
                logger.warning(f"No vectors found for note: {note_id}")
                return True
            
            # Delete the points
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=point_ids
            )
            
            logger.info(f"Deleted {len(point_ids)} vectors for note: {note_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False
    
    def get_similar_chunks(self, note_id: str, page: int, chunk_index: int, limit: int = 5) -> List[Dict]:
        """
        Find chunks similar to a specific chunk
        
        Args:
            note_id (str): ID of the note
            page (int): Page number
            chunk_index (int): Index of the chunk
            limit (int): Maximum number of results
            
        Returns:
            list: List of similar chunks
        """
        try:
            # Get the vector for the specified chunk
            chunk_id = f"{note_id}_{page}_{chunk_index}"
            
            # Find the point in Qdrant
            points = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[chunk_id]
            )
            
            if not points:
                logger.warning(f"Chunk not found: {chunk_id}")
                return []
            
            # Get the vector from the retrieved point
            vector = points[0].vector
            
            # Search for similar vectors, excluding the original chunk
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=vector,
                limit=limit + 1,  # +1 to account for the original that we'll filter out
                query_filter=Filter(
                    must_not=[
                        FieldCondition(
                            key="id",
                            match=MatchValue(value=chunk_id)
                        )
                    ]
                )
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "note_id": result.payload["note_id"],
                    "page": result.payload["page"],
                    "text": result.payload["text"],
                    "title": result.payload.get("title", ""),
                    "similarity_score": result.score
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error finding similar chunks: {str(e)}")
            return []
    
    def get_document_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about the vector store
        
        Returns:
            dict: Statistics about indexed documents
        """
        try:
            # Get collection info
            collection_info = self.client.get_collection(self.collection_name)
            
            # Count unique notes
            response = self.client.scroll(
                collection_name=self.collection_name,
                limit=0,  # We only need the count
                with_payload=False,
                with_vectors=False
            )
            
            total_chunks = response[1].total
            
            # Scroll through chunks to count unique notes
            all_notes = set()
            all_faculties = set()
            all_units = set()
            
            # Use batched requests to get all unique note_ids
            offset = 0
            batch_size = 1000
            while True:
                response = self.client.scroll(
                    collection_name=self.collection_name,
                    limit=batch_size,
                    offset=offset,
                    with_vectors=False
                )
                
                points, next_offset = response
                
                if not points:
                    break
                
                for point in points:
                    all_notes.add(point.payload.get("note_id"))
                    all_faculties.add(point.payload.get("faculty_code"))
                    all_units.add(point.payload.get("unit_id"))
                
                if next_offset.offset is None:
                    break
                    
                offset = next_offset.offset
            
            return {
                "total_chunks": total_chunks,
                "unique_notes": len(all_notes),
                "unique_faculties": len(all_faculties) - (1 if None in all_faculties else 0),
                "unique_units": len(all_units) - (1 if None in all_units else 0),
                "vector_dimension": collection_info.config.params.vectors.size,
                "distance_metric": collection_info.config.params.vectors.distance
            }
            
        except Exception as e:
            logger.error(f"Error getting statistics: {str(e)}")
            return {
                "error": str(e)
            }