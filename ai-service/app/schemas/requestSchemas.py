from pydantic import BaseModel
from typing import Optional, Dict, Any

class DocumentProcessRequest(BaseModel):
    documentId: str
    organizationId: str
    filePath: str
    title: Optional[str] = None
    fileName: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: str
    organizationId: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None

class ChatRequest(BaseModel):
    documentId: str
    organizationId: str
    message: str
    history: Optional[list] = []
