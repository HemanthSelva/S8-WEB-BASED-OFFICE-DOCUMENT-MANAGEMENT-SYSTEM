from sentence_transformers import SentenceTransformer
from app.core.config import settings
import numpy as np

class EmbeddingService:
    def __init__(self):
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

    def generate_embedding(self, text: str) -> list:
        if not text:
            return []
        
        # Generate embedding
        embedding = self.model.encode(text)
        
        # Normalize (optional, but good for cosine similarity)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
            
        return embedding.tolist()

embedding_service = EmbeddingService()
