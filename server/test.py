from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Connect to Qdrant (adjust URL and API key if needed)
client = QdrantClient("localhost", port=6333)

# Collection name
test_collection = "test_vectors"

# Create a collection
client.recreate_collection(
    collection_name=test_collection,
    vectors_config=VectorParams(size=3, distance=Distance.COSINE),
)

# Insert some vectors
data = [
    PointStruct(id=1, vector=[0.1, 0.2, 0.3], payload={"label": "A"}),
    PointStruct(id=2, vector=[0.4, 0.5, 0.6], payload={"label": "B"}),
    PointStruct(id=3, vector=[0.7, 0.8, 0.9], payload={"label": "C"}),
]
client.upsert(collection_name=test_collection, points=data)

# Perform a search
query_vector = [0.35, 0.45, 0.55]
search_result = client.search(
    collection_name=test_collection,
    query_vector=query_vector,
    limit=2
)

# Display search results
for res in search_result:
    print(f"ID: {res.id}, Score: {res.score}, Payload: {res.payload}")