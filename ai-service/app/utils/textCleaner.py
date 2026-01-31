import re
import string

class TextCleaner:
    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        
        # Lowercase
        text = text.lower()
        
        # Remove special characters but keep basic punctuation
        # Replace non-alphanumeric (except basic punctuation) with space
        text = re.sub(r'[^a-z0-9\s.,?!-]', ' ', text)
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text

    @staticmethod
    def normalize_for_embedding(text: str) -> str:
        # More aggressive cleaning for embedding
        text = text.lower()
        # Remove all punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text
