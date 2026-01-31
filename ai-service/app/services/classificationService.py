from typing import List, Dict
import numpy as np

class ClassificationService:
    def __init__(self):
        self.departments = ["HR", "Finance", "Legal", "Engineering", "Operations"]
        self.categories = ["Invoice", "Contract", "Resume", "Policy", "Report", "Offer Letter"]
        
        # Simple keyword-based rules for initialization
        self.rules = {
            "HR": ["resume", "cv", "hiring", "offer letter", "candidate", "employee", "onboarding"],
            "Finance": ["invoice", "bill", "payment", "tax", "audit", "salary", "expense"],
            "Legal": ["contract", "agreement", "nda", "terms", "clause", "signature", "party"],
            "Engineering": ["design", "architecture", "spec", "diagram", "code", "technical"],
            "Operations": ["schedule", "logistics", "inventory", "supply", "report", "process"]
        }
        
        self.category_rules = {
            "Invoice": ["invoice", "bill to", "total amount", "due date"],
            "Contract": ["agreement", "parties", "witnesseth", "term"],
            "Resume": ["experience", "education", "skills", "summary"],
            "Policy": ["policy", "procedure", "guidelines", "compliance"],
            "Report": ["report", "status", "analysis", "findings"],
            "Offer Letter": ["offer", "salary", "start date", "benefits"]
        }

    def classify_document(self, text: str, embedding: List[float] = None) -> Dict:
        text_lower = text.lower()
        
        # 1. Keyword based scoring
        dept_scores = {dept: 0 for dept in self.departments}
        cat_scores = {cat: 0 for cat in self.categories}
        
        for dept, keywords in self.rules.items():
            for keyword in keywords:
                if keyword in text_lower:
                    dept_scores[dept] += 1
                    
        for cat, keywords in self.category_rules.items():
            for keyword in keywords:
                if keyword in text_lower:
                    cat_scores[cat] += 1
        
        # Determine best match
        best_dept = max(dept_scores, key=dept_scores.get)
        best_cat = max(cat_scores, key=cat_scores.get)
        
        # Calculate simplistic confidence
        dept_conf = min(dept_scores[best_dept] * 0.2, 1.0) if dept_scores[best_dept] > 0 else 0.0
        cat_conf = min(cat_scores[best_cat] * 0.2, 1.0) if cat_scores[best_cat] > 0 else 0.0
        
        final_conf = (dept_conf + cat_conf) / 2
        
        tags = []
        if dept_conf > 0.4: tags.append(best_dept)
        if cat_conf > 0.4: tags.append(best_cat)

        # Extract metadata
        extracted_data = self._extract_metadata(text, best_cat)
        
        return {
            "department": best_dept if dept_conf > 0.3 else None,
            "category": best_cat if cat_conf > 0.3 else None,
            "confidenceScore": final_conf,
            "suggestedTags": tags,
            "extractedData": extracted_data
        }

    def _extract_metadata(self, text: str, category: str) -> Dict:
        import re
        data = {}
        text_lower = text.lower()
        
        if category == "Invoice":
            # GST (India format example: 22AAAAA0000A1Z5)
            gst = re.search(r'\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}', text)
            if gst: data["gst"] = gst.group(0)
            
            # Amount
            amount = re.search(r'total\s*[:\-]?\s*[\$₹]?\s*([\d,]+\.?\d*)', text_lower)
            if amount: data["totalAmount"] = amount.group(1)

        elif category == "Resume":
            # Email
            email = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
            if email: data["email"] = email.group(0)
            
            # Phone
            phone = re.search(r'[\+\(]?[1-9][0-9 .\-\(\)]{8,}[0-9]', text)
            if phone: data["phone"] = phone.group(0)
            
        elif category == "Contract":
            # Date
            date = re.search(r'\d{1,2}[-/]\d{1,2}[-/]\d{2,4}', text)
            if date: data["date"] = date.group(0)

        return data

classification_service = ClassificationService()
