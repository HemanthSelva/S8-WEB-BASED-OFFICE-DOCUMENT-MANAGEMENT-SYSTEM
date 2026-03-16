from sentence_transformers import SentenceTransformer
from app.core.config import settings
import numpy as np
import time

class EmbeddingService:
    def __init__(self):
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        self.model = SentenceTransformer(settings.EMBEDDING_MODEL)

    def generate_embedding(self, text: str) -> list:
        if not text:
            return []
        
        # Truncate text for performance on large documents
        # Most models have a sequence limit anyway, and for document-level 
        # embedding/classification, the first 10k chars is usually sufficient.
        truncated_text = text[:10000]
        
        # Generate embedding
        t0 = time.time()
        embedding = self.model.encode(truncated_text)
        print(f"  [Embedding] Encode took: {time.time() - t0:.2f}s")
        
        # Normalize (optional, but good for cosine similarity)
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
            
        return embedding.tolist()

embedding_service = EmbeddingService()
