import json
from typing import Dict, Any
from groq import Groq
from app.core.config import settings

class SummaryService:
    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"Error initializing Groq for Summary: {e}")

    def summarize(self, text: str, title: str = "") -> Dict[str, Any]:
        """Generate a summary for a document."""
        if not text or len(text.strip()) < 50:
            return {
                "summary": "Document content too short to summarize.",
                "keyPoints": [],
                "wordCount": len(text.split()) if text else 0,
            }

        if self.client and settings.GROQ_API_KEY:
            try:
                return self._summarize_with_groq(text, title)
            except Exception as e:
                print(f"Groq summary failed, using extractive fallback: {e}")

        return self._summarize_extractive(text, title)

    def _summarize_with_groq(self, text: str, title: str) -> Dict[str, Any]:
        truncated = text[:12000]

        prompt = f"""
        Analyze the following document and provide a JSON response with:
        {{
            "summary": "A concise 2-3 sentence summary of the document",
            "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
            "wordCount": <number of words in original>
        }}

        Document Title: {title}
        Document Text:
        ---
        {truncated}
        ---
        """

        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a document summarization expert. Reply only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            model=settings.GROQ_MODEL,
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content)
        if "summary" not in result:
            result["summary"] = "Summary generation incomplete."
        if "keyPoints" not in result:
            result["keyPoints"] = []
        result["wordCount"] = len(text.split())
        return result

    def _summarize_extractive(self, text: str, title: str) -> Dict[str, Any]:
        """Extractive summarization fallback - picks the most important sentences."""
        sentences = [s.strip() for s in text.replace('\n', '. ').split('. ') if len(s.strip()) > 20]

        if not sentences:
            return {"summary": text[:200], "keyPoints": [], "wordCount": len(text.split())}

        # Score sentences by position (first sentences are often most important)
        # and by keyword density
        important_words = set()
        if title:
            important_words = set(title.lower().split())

        scored = []
        for i, sentence in enumerate(sentences[:30]):  # Only check first 30 sentences
            score = 0
            # Position bonus (earlier = better)
            score += max(0, 10 - i) * 0.5
            # Length bonus (medium length sentences preferred)
            word_count = len(sentence.split())
            if 10 <= word_count <= 40:
                score += 3
            # Keyword match bonus
            words = set(sentence.lower().split())
            overlap = words & important_words
            score += len(overlap) * 2
            scored.append((score, sentence))

        scored.sort(reverse=True)
        top_sentences = [s for _, s in scored[:3]]
        summary = '. '.join(top_sentences)
        if not summary.endswith('.'):
            summary += '.'

        key_points = [s for _, s in scored[:5]]

        return {
            "summary": summary[:500],
            "keyPoints": key_points[:3],
            "wordCount": len(text.split()),
        }


summary_service = SummaryService()
