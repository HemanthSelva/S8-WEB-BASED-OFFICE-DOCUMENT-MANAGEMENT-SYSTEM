from pydantic import BaseModel
from typing import List, Optional

class ProcessResponse(BaseModel):
    status: str
    documentId: str
    department: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    confidence: float = 0.0

class SearchResult(BaseModel):
    documentId: str
    score: float
    department: Optional[str] = None
    category: Optional[str] = None
    snippet: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]
