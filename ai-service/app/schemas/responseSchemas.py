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

class SummaryResponse(BaseModel):
    summary: str
    keyPoints: List[str]
    wordCount: int

class ComplianceFinding(BaseModel):
    ruleId: str
    type: str
    severity: str
    message: str
    source: str

class ComplianceResponse(BaseModel):
    riskLevel: str
    riskScore: float
    findings: List[ComplianceFinding]
    checkedRules: int
    category: str

class RelatedDocument(BaseModel):
    documentId: str
    title: str
    fileName: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    similarity: float
    relationship: str

class RelationshipResponse(BaseModel):
    relatedDocuments: List[RelatedDocument]
    totalFound: int

class AIDetectorResponse(BaseModel):
    isAiGenerated: bool
    confidence: float
    indicators: List[str]
    scores: Dict[str, float]
