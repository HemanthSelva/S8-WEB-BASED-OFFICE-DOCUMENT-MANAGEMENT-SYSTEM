from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class ProcessResponse(BaseModel):
    status: str
    documentId: str
    department: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    confidence: float = 0.0
    extractedData: Dict[str, Any] = {}

class SearchResult(BaseModel):
    documentId: str
    score: float
    department: Optional[str] = None
    category: Optional[str] = None
    tags: List[str] = []
    extractedData: Dict[str, Any] = {}
    snippet: Optional[str] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]

class ChatResponse(BaseModel):
    answer: str
    confidence: float = 0.9
    source_found: bool = True
