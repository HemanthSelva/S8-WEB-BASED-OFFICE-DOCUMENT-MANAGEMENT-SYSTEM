from pydantic import BaseModel
from typing import Optional, Dict, Any

class DocumentProcessRequest(BaseModel):
    documentId: str
    organizationId: str
    filePath: str
    metadata: Optional[Dict[str, Any]] = None

class SearchRequest(BaseModel):
    query: str
    organizationId: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None
