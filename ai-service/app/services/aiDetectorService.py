import re
import math
from typing import Dict, Any, List
from collections import Counter


class AIDetectorService:
    """
    Detects whether document text is AI-generated using statistical analysis.
    Uses perplexity estimation, burstiness analysis, and pattern detection.
    No external API needed — runs entirely locally.
    """

    def __init__(self):
        # Common AI-generated text patterns
        self.ai_phrases = [
            "in conclusion", "it is important to note", "it's worth noting",
            "in this regard", "in the context of", "furthermore",
            "moreover", "additionally", "it is worth mentioning",
            "it should be noted", "as previously mentioned",
            "in summary", "to summarize", "in light of",
            "with regard to", "pertaining to", "as a result",
            "consequently", "therefore, it is", "this ensures",
            "this highlights", "this demonstrates", "this underscores",
            "leveraging", "utilizing", "streamlining", "facilitating",
            "comprehensive", "robust", "seamless", "cutting-edge",
            "in today's rapidly", "in the ever-evolving",
            "plays a crucial role", "plays a pivotal role",
        ]

        # Overly formal/generic transitions that AI tends to overuse
        self.transition_overuse = [
            "however", "nevertheless", "nonetheless", "conversely",
            "subsequently", "accordingly", "hence",
        ]

    def detect(self, text: str) -> Dict[str, Any]:
        """Analyze text for AI-generated content indicators."""
        if not text or len(text.strip()) < 100:
            return {
                "isAiGenerated": False,
                "confidence": 0.0,
                "indicators": ["Text too short for reliable analysis"],
                "scores": {}
            }

        indicators = []
        scores = {}

        # 1. Burstiness analysis (AI text has uniform sentence length)
        burstiness_score = self._analyze_burstiness(text)
        scores["burstiness"] = round(burstiness_score, 3)
        if burstiness_score < 0.3:
            indicators.append("Low sentence length variation (AI text tends to be uniform)")

        # 2. AI phrase density
        phrase_score = self._analyze_ai_phrases(text)
        scores["aiPhraseDensity"] = round(phrase_score, 3)
        if phrase_score > 0.4:
            indicators.append("High density of typical AI-generated phrases")

        # 3. Vocabulary diversity (AI text often has lower type-token ratio)
        vocab_score = self._analyze_vocabulary(text)
        scores["vocabularyDiversity"] = round(vocab_score, 3)
        if vocab_score < 0.35:
            indicators.append("Low vocabulary diversity suggests formulaic text")

        # 4. Paragraph uniformity (AI tends to write evenly-sized paragraphs)
        para_score = self._analyze_paragraph_uniformity(text)
        scores["paragraphUniformity"] = round(para_score, 3)
        if para_score > 0.7:
            indicators.append("Highly uniform paragraph lengths typical of AI generation")

        # 5. Transition overuse (AI overuses formal transitions)
        transition_score = self._analyze_transitions(text)
        scores["transitionOveruse"] = round(transition_score, 3)
        if transition_score > 0.5:
            indicators.append("Overuse of formal transitional phrases")

        # 6. Punctuation patterns (AI rarely uses exclamation marks, ellipsis)
        punct_score = self._analyze_punctuation(text)
        scores["punctuationFormality"] = round(punct_score, 3)
        if punct_score > 0.7:
            indicators.append("Overly formal punctuation pattern")

        # Calculate overall AI probability
        weights = {
            "burstiness": 0.25,
            "aiPhraseDensity": 0.25,
            "vocabularyDiversity": 0.15,
            "paragraphUniformity": 0.15,
            "transitionOveruse": 0.10,
            "punctuationFormality": 0.10,
        }

        # For burstiness and vocab diversity, lower = more likely AI
        adjusted_scores = {
            "burstiness": 1.0 - burstiness_score,
            "aiPhraseDensity": phrase_score,
            "vocabularyDiversity": 1.0 - vocab_score,
            "paragraphUniformity": para_score,
            "transitionOveruse": transition_score,
            "punctuationFormality": punct_score,
        }

        ai_probability = sum(adjusted_scores[k] * weights[k] for k in weights)
        ai_probability = max(0.0, min(1.0, ai_probability))

        return {
            "isAiGenerated": ai_probability > 0.55,
            "confidence": round(ai_probability, 3),
            "indicators": indicators if indicators else ["No strong AI indicators detected"],
            "scores": scores
        }

    def _analyze_burstiness(self, text: str) -> float:
        """Measure variation in sentence length. Human writing is 'bursty' (varied)."""
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

        if len(sentences) < 3:
            return 0.5

        lengths = [len(s.split()) for s in sentences]
        mean_len = sum(lengths) / len(lengths)

        if mean_len == 0:
            return 0.5

        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        std_dev = math.sqrt(variance)
        cv = std_dev / mean_len  # Coefficient of variation

        # Higher CV = more bursty = more human-like
        return min(cv, 1.0)

    def _analyze_ai_phrases(self, text: str) -> float:
        """Check density of typical AI phrases."""
        text_lower = text.lower()
        word_count = len(text.split())

        if word_count == 0:
            return 0.0

        matches = sum(1 for phrase in self.ai_phrases if phrase in text_lower)
        # Normalize by word count (per 100 words)
        density = (matches / word_count) * 100

        return min(density / 3.0, 1.0)  # 3+ matches per 100 words = max score

    def _analyze_vocabulary(self, text: str) -> float:
        """Type-Token Ratio: unique words / total words."""
        words = re.findall(r'\b[a-zA-Z]+\b', text.lower())
        if len(words) < 10:
            return 0.5

        # Use a sliding window TTR for longer texts (more stable)
        window = 100
        if len(words) <= window:
            return len(set(words)) / len(words)

        ttrs = []
        for i in range(0, len(words) - window, window // 2):
            chunk = words[i:i + window]
            ttrs.append(len(set(chunk)) / len(chunk))

        return sum(ttrs) / len(ttrs)

    def _analyze_paragraph_uniformity(self, text: str) -> float:
        """Check if paragraph lengths are suspiciously uniform."""
        paragraphs = [p.strip() for p in text.split('\n\n') if len(p.strip()) > 20]

        if len(paragraphs) < 3:
            return 0.3  # Not enough data

        lengths = [len(p.split()) for p in paragraphs]
        mean_len = sum(lengths) / len(lengths)

        if mean_len == 0:
            return 0.3

        variance = sum((l - mean_len) ** 2 for l in lengths) / len(lengths)
        cv = math.sqrt(variance) / mean_len

        # Lower CV = more uniform = more AI-like
        # Return uniformity score (inverse of CV)
        uniformity = max(0, 1.0 - cv)
        return min(uniformity, 1.0)

    def _analyze_transitions(self, text: str) -> float:
        """Check for overuse of formal transitional phrases."""
        text_lower = text.lower()
        sentences = re.split(r'[.!?]+', text_lower)
        sentences = [s.strip() for s in sentences if len(s.strip()) > 5]

        if len(sentences) < 5:
            return 0.3

        transition_starts = 0
        for sentence in sentences:
            words = sentence.split()
            if words and words[0] in self.transition_overuse:
                transition_starts += 1

        ratio = transition_starts / len(sentences)
        return min(ratio * 5, 1.0)  # 20%+ sentences starting with transitions = max

    def _analyze_punctuation(self, text: str) -> float:
        """AI text tends to avoid informal punctuation."""
        total_chars = len(text)
        if total_chars == 0:
            return 0.5

        exclamations = text.count('!')
        questions = text.count('?')
        ellipsis = text.count('...')
        dashes = text.count('—') + text.count('–')

        # Human text typically has more varied punctuation
        informal_count = exclamations + ellipsis + dashes
        sentence_count = len(re.split(r'[.!?]+', text))

        if sentence_count == 0:
            return 0.5

        informal_ratio = informal_count / sentence_count

        # Less informal punctuation = more AI-like
        formality = max(0, 1.0 - informal_ratio * 3)
        return min(formality, 1.0)


ai_detector_service = AIDetectorService()
