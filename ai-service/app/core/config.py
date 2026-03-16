import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "IntelliDocX AI Service"
    API_V1_STR: str = "/api/v1"
    
    # Elasticsearch
    ELASTICSEARCH_NODE: str = os.getenv("ELASTICSEARCH_NODE", "http://elasticsearch:9200")
    ELASTICSEARCH_INDEX: str = "intellidocx_documents"
    
    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    MINIO_BUCKET: str = os.getenv("MINIO_BUCKET", "intellidocx-documents")
    MINIO_SECURE: bool = False
    
    # Security
    AI_SERVICE_API_KEY: str = os.getenv("AI_SERVICE_API_KEY", "intellidocx-ai-secret-key")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    GROQ_TIMEOUT: float = 30.0

    class Config:
        env_file = ".env"

settings = Settings()
print("AI Service Config Loaded Successfully")
