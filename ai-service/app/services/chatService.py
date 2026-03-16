import json
from typing import List, Dict, Any, Optional
from groq import Groq
from app.core.config import settings
from app.services.indexingService import indexing_service

class ChatService:
    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                # Basic initialization to avoid internal argument conflicts
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"Error initializing Groq client for Chat: {e}")

    async def query_document(self, document_id: str, organization_id: str, message: str, history: List[Dict] = []) -> Dict[str, Any]:
        """Queries a document using Groq for RAG."""
        
        # 1. Get document content
        content = indexing_service.get_document_content(document_id, organization_id)
        
        if not content:
            return {
                "answer": "I'm sorry, I couldn't find the content for this document. It might not have been processed correctly.",
                "confidence": 0.0,
                "source_found": False
            }

        if not self.client:
            return {
                "answer": "AI Chat is currently unavailable (API key missing).",
                "confidence": 0.0,
                "source_found": True
            }

        # 2. Build prompt
        # We limit the context size
        context = content[:15000] 
        
        system_prompt = f"""
        You are an intelligent document assistant for IntelliDocX. 
        Analyze the following document content and answer the user's question accurately.
        If the answer is not in the document, say you don't know based on the provided text.
        
        DOCUMENT CONTENT:
        ---
        {context}
        ---
        
        Provide a concise and helpful answer.
        """

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history (up to last 5 exchanges)
        for turn in history[-10:]:
            messages.append(turn)
            
        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            response = self.client.chat.completions.create(
                messages=messages,
                model=settings.GROQ_MODEL,
                temperature=0.2, # Lower temperature for better accuracy
            )
            
            answer = response.choices[0].message.content
            
            return {
                "answer": answer,
                "confidence": 0.95,
                "source_found": True
            }
        except Exception as e:
            print(f"Groq Chat error: {e}")
            return {
                "answer": f"An error occurred while processing your request: {str(e)}",
                "confidence": 0.0,
                "source_found": True
            }

chat_service = ChatService()
