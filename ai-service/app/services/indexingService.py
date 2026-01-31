from elasticsearch import Elasticsearch
from app.core.config import settings
from typing import Dict, List, Any

class IndexingService:
    def __init__(self):
        self.client = Elasticsearch(
            settings.ELASTICSEARCH_NODE,
            verify_certs=False
        )
        self.index_name = settings.ELASTICSEARCH_INDEX

    def create_index_if_not_exists(self):
        if not self.client.indices.exists(index=self.index_name):
            mapping = {
                "mappings": {
                    "properties": {
                        "documentId": {"type": "keyword"},
                        "organizationId": {"type": "keyword"},
                        "content": {"type": "text"},
                        "embedding": {
                            "type": "dense_vector",
                            "dims": 384, # all-MiniLM-L6-v2 dimension
                            "index": True,
                            "similarity": "cosine"
                        },
                        "department": {"type": "keyword"},
                        "category": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "createdAt": {"type": "date"}
                    }
                }
            }
            self.client.indices.create(index=self.index_name, body=mapping)
            print(f"Created index: {self.index_name}")

    def index_document(self, doc_data: Dict[str, Any]):
        try:
            self.client.index(
                index=self.index_name,
                id=doc_data["documentId"],
                document=doc_data
            )
            return True
        except Exception as e:
            print(f"Error indexing document: {e}")
            return False

    def search(self, query_text: str, query_embedding: List[float], organization_id: str, limit: int = 10, filters: Dict[str, Any] = None):
        filter_conditions = [{"term": {"organizationId": organization_id}}]
        
        if filters:
            if filters.get("department"):
                filter_conditions.append({"term": {"department": filters["department"]}})
            if filters.get("category"):
                filter_conditions.append({"term": {"category": filters["category"]}})
            # Add more filters as needed

        # Hybrid Search: KNN + Keyword
        knn = {
            "field": "embedding",
            "query_vector": query_embedding,
            "k": limit,
            "num_candidates": 100,
            "filter": {
                "bool": {
                    "filter": filter_conditions
                }
            },
            "boost": 0.5
        }
        
        # Keyword query
        keyword_query = {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": query_text,
                        "fields": ["content", "department", "category", "tags"],
                        "fuzziness": "AUTO"
                    }
                },
                "filter": filter_conditions
            }
        }
        
        try:
            response = self.client.search(
                index=self.index_name,
                knn=knn,
                query=keyword_query,
                size=limit,
                _source=["documentId", "department", "category", "tags", "extractedData"],
                highlight={
                    "fields": {
                        "content": {}
                    }
                }
            )
        except Exception as e:
            print(f"Search error: {e}")
            return []
            
        return response['hits']['hits']

indexing_service = IndexingService()
