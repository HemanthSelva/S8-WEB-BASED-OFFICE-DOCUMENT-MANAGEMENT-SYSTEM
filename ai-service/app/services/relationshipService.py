from typing import Dict, Any, List
from app.services.indexingService import indexing_service
from app.services.embeddingService import embedding_service

class RelationshipService:
    """Discovers relationships between documents using semantic similarity."""

    def detect_relationships(self, document_id: str, organization_id: str, limit: int = 5) -> Dict[str, Any]:
        """Find documents related to the given document."""
        try:
            # 1. Get the source document's content and embedding
            content = indexing_service.get_document_content(document_id, organization_id)
            if not content:
                return {"relatedDocuments": [], "totalFound": 0}

            # 2. Generate embedding for the source document
            truncated = content[:5000]
            query_embedding = embedding_service.generate_embedding(truncated)

            if not query_embedding:
                return {"relatedDocuments": [], "totalFound": 0}

            # 3. Search for similar documents (excluding self)
            similar_docs = self._find_similar(document_id, query_embedding, organization_id, limit)

            return {
                "relatedDocuments": similar_docs,
                "totalFound": len(similar_docs),
            }

        except Exception as e:
            print(f"Error detecting relationships: {e}")
            return {"relatedDocuments": [], "totalFound": 0}

    def _find_similar(self, exclude_id: str, embedding: list, org_id: str, limit: int) -> List[Dict]:
        """Query Elasticsearch for semantically similar documents."""
        try:
            knn = {
                "field": "embedding",
                "query_vector": embedding,
                "k": limit + 1,  # +1 because the source doc may be in results
                "num_candidates": 50,
                "filter": {
                    "bool": {
                        "filter": [
                            {"term": {"organizationId": org_id}},
                        ],
                        "must_not": [
                            {"term": {"documentId": exclude_id}}
                        ]
                    }
                }
            }

            response = indexing_service.client.search(
                index=indexing_service.index_name,
                knn=knn,
                size=limit,
                _source=["documentId", "title", "fileName", "department", "category", "tags"]
            )

            results = []
            for hit in response["hits"]["hits"]:
                source = hit["_source"]
                score = hit["_score"]

                # Determine relationship type based on similarity score
                if score > 0.85:
                    relationship = "duplicate"
                elif score > 0.7:
                    relationship = "strongly_related"
                elif score > 0.5:
                    relationship = "related"
                else:
                    relationship = "loosely_related"

                results.append({
                    "documentId": source.get("documentId"),
                    "title": source.get("title", "Untitled"),
                    "fileName": source.get("fileName"),
                    "department": source.get("department"),
                    "category": source.get("category"),
                    "similarity": round(score, 3),
                    "relationship": relationship,
                })

            return results

        except Exception as e:
            print(f"Elasticsearch similarity search error: {e}")
            return []


relationship_service = RelationshipService()
