from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import APIKeyHeader
import uvicorn
from datetime import datetime
import os

from app.core.config import settings
from app.schemas.requestSchemas import DocumentProcessRequest, SearchRequest
from app.schemas.responseSchemas import ProcessResponse, SearchResponse, SearchResult
from app.utils.fileLoader import file_loader
from app.utils.textCleaner import TextCleaner
from app.services.ocrService import ocr_service
from app.services.embeddingService import embedding_service
from app.services.classificationService import classification_service
from app.services.indexingService import indexing_service

app = FastAPI(title=settings.APP_NAME)

# Security
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)

async def get_api_key(api_key: str = Security(api_key_header)):
    if api_key != settings.AI_SERVICE_API_KEY:
        raise HTTPException(
            status_code=403,
            detail="Could not validate credentials"
        )
    return api_key

@app.on_event("startup")
async def startup_event():
    # Ensure index exists on startup
    try:
        indexing_service.create_index_if_not_exists()
    except Exception as e:
        print(f"Warning: Could not connect to Elasticsearch on startup: {e}")

@app.get("/")
def read_root():
    return {"status": "online", "service": settings.APP_NAME}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": settings.APP_NAME}

@app.get("/health/ai")
def health_check_ai():
    return {"status": "ok", "service": "IntelliDocX AI Engine", "models_loaded": True}

@app.post("/ai/process-document", response_model=ProcessResponse, dependencies=[Depends(get_api_key)])
async def process_document(request: DocumentProcessRequest):
    try:
        # 1. Download file
        print(f"Processing document: {request.documentId} from {request.filePath}")
        file_data = file_loader.download_file(request.filePath)
        
        # Determine extension
        file_ext = os.path.splitext(request.filePath)[1]
        
        # 2. Extract Text (OCR if needed)
        raw_text = ocr_service.extract_text(file_data, file_ext)
        if not raw_text:
            raise HTTPException(status_code=400, detail="Could not extract text from document")
            
        # 3. Clean Text
        clean_text = TextCleaner.clean_text(raw_text)
        embedding_text = TextCleaner.normalize_for_embedding(raw_text)
        
        # 4. Generate Embedding
        embedding = embedding_service.generate_embedding(embedding_text)
        
        # 5. Classify
        classification = classification_service.classify_document(clean_text, embedding)
        
        # 6. Index
        doc_data = {
            "documentId": request.documentId,
            "organizationId": request.organizationId,
            "content": clean_text,
            "embedding": embedding,
            "department": classification["department"],
            "category": classification["category"],
            "tags": classification["suggestedTags"],
            "createdAt": datetime.utcnow().isoformat()
        }
        
        indexing_service.index_document(doc_data)
        
        return ProcessResponse(
            status="success",
            documentId=request.documentId,
            department=classification["department"],
            category=classification["category"],
            tags=classification["suggestedTags"],
            confidence=classification["confidenceScore"]
        )

    except Exception as e:
        print(f"Error processing document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ai/search", response_model=SearchResponse, dependencies=[Depends(get_api_key)])
async def search_documents(request: SearchRequest):
    try:
        # 1. Generate embedding for query
        query_text = TextCleaner.normalize_for_embedding(request.query)
        query_embedding = embedding_service.generate_embedding(query_text)
        
        # 2. Search in Elasticsearch
        hits = indexing_service.search(request.query, query_embedding, request.organizationId, request.limit, request.filters)
        
        # 3. Format results
        results = []
        for hit in hits:
            source = hit.get("_source", {})
            highlight = hit.get("highlight", {}).get("content", [])
            snippet = highlight[0] if highlight else ""
            
            results.append(SearchResult(
                documentId=source.get("documentId"),
                score=hit.get("_score"),
                department=source.get("department"),
                category=source.get("category"),
                snippet=snippet
            ))
            
        return SearchResponse(results=results)

    except Exception as e:
        print(f"Error searching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
