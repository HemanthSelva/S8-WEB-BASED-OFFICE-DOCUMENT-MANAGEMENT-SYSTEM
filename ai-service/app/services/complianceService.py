import re
import json
from typing import Dict, Any, List
from datetime import datetime
from groq import Groq
from app.core.config import settings


class ComplianceService:
    """Checks documents for compliance risks, missing elements, and legal issues."""

    def __init__(self):
        self.client = None
        if settings.GROQ_API_KEY:
            try:
                self.client = Groq(api_key=settings.GROQ_API_KEY)
            except Exception as e:
                print(f"Error initializing Groq for Compliance: {e}")

        # Rule-based compliance checks
        self.risk_patterns = {
            "missing_signature": {
                "check_type": "absence",
                "keywords": ["signature", "signed by", "authorized signatory", "digitally signed"],
                "severity": "HIGH",
                "message": "Document may be missing a signature or authorization"
            },
            "expired_date": {
                "check_type": "date_check",
                "keywords": ["expiry date", "valid until", "expires on", "expiration"],
                "severity": "CRITICAL",
                "message": "Document may contain expired terms or dates"
            },
            "confidentiality_missing": {
                "check_type": "absence",
                "keywords": ["confidential", "proprietary", "restricted", "classified"],
                "severity": "MEDIUM",
                "message": "Document lacks confidentiality markings for sensitive content"
            },
            "indemnity_clause": {
                "check_type": "presence",
                "keywords": ["indemnify", "indemnification", "hold harmless", "liability"],
                "severity": "HIGH",
                "message": "Document contains indemnity/liability clauses that need legal review"
            },
            "auto_renewal": {
                "check_type": "presence",
                "keywords": ["auto-renewal", "automatically renew", "auto renew"],
                "severity": "MEDIUM",
                "message": "Document contains auto-renewal clauses"
            },
            "termination_clause": {
                "check_type": "absence",
                "keywords": ["termination", "cancellation", "terminate this agreement"],
                "severity": "HIGH",
                "message": "Contract may be missing termination/cancellation provisions"
            },
            "gdpr_personal_data": {
                "check_type": "presence",
                "keywords": ["personal data", "data subject", "gdpr", "data protection", "personally identifiable"],
                "severity": "HIGH",
                "message": "Document references personal/GDPR data — ensure compliance controls are in place"
            },
            "payment_terms": {
                "check_type": "presence",
                "keywords": ["net 30", "net 60", "net 90", "payment terms", "due upon receipt"],
                "severity": "LOW",
                "message": "Document specifies payment terms"
            },
            "non_compete": {
                "check_type": "presence",
                "keywords": ["non-compete", "non compete", "restrictive covenant", "restraint of trade"],
                "severity": "HIGH",
                "message": "Document contains non-compete restrictions"
            }
        }

    def check_compliance(self, text: str, category: str = "General") -> Dict[str, Any]:
        """Run compliance checks on document text."""
        if not text or len(text.strip()) < 20:
            return {
                "riskLevel": "LOW",
                "riskScore": 0.0,
                "findings": [],
                "checkedRules": 0,
                "category": category
            }

        # Run rule-based checks first (always works)
        findings = self._rule_based_check(text, category)

        # If Groq is available and doc is a contract/legal doc, do deeper analysis
        if self.client and settings.GROQ_API_KEY and category in ["Contract", "Legal", "Policy"]:
            try:
                groq_findings = self._groq_compliance_check(text, category)
                findings.extend(groq_findings)
            except Exception as e:
                print(f"Groq compliance check failed: {e}")

        # Calculate overall risk
        risk_score, risk_level = self._calculate_risk(findings)

        return {
            "riskLevel": risk_level,
            "riskScore": round(risk_score, 2),
            "findings": findings,
            "checkedRules": len(self.risk_patterns),
            "category": category
        }

    def _rule_based_check(self, text: str, category: str) -> List[Dict]:
        text_lower = text.lower()
        findings = []

        for rule_id, rule in self.risk_patterns.items():
            keyword_found = any(kw in text_lower for kw in rule["keywords"])

            if rule["check_type"] == "presence" and keyword_found:
                # Flag presence of risky clauses
                findings.append({
                    "ruleId": rule_id,
                    "type": "warning",
                    "severity": rule["severity"],
                    "message": rule["message"],
                    "source": "rule_engine"
                })
            elif rule["check_type"] == "absence" and not keyword_found:
                # Only flag missing elements for relevant document types
                if category in ["Contract", "Legal", "Policy", "Invoice"]:
                    findings.append({
                        "ruleId": rule_id,
                        "type": "missing",
                        "severity": rule["severity"],
                        "message": rule["message"],
                        "source": "rule_engine"
                    })

        # Date expiry check
        self._check_expired_dates(text, findings)

        return findings

    def _check_expired_dates(self, text: str, findings: List[Dict]):
        """Check for dates that may have expired."""
        date_patterns = [
            r'(?:expir|valid until|expires? on)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})',
            r'(?:expir|valid until|expires? on)[:\s]*(\w+ \d{1,2},? \d{4})',
        ]

        for pattern in date_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                try:
                    # Try common date formats
                    for fmt in ["%m/%d/%Y", "%d/%m/%Y", "%m-%d-%Y", "%B %d, %Y", "%B %d %Y"]:
                        try:
                            parsed_date = datetime.strptime(match.strip(), fmt)
                            if parsed_date < datetime.now():
                                findings.append({
                                    "ruleId": "date_expired",
                                    "type": "critical",
                                    "severity": "CRITICAL",
                                    "message": f"Expired date found: {match}",
                                    "source": "date_analysis"
                                })
                            break
                        except ValueError:
                            continue
                except Exception:
                    pass

    def _groq_compliance_check(self, text: str, category: str) -> List[Dict]:
        """Deep compliance analysis using Groq LLM."""
        truncated = text[:8000]

        prompt = f"""
        Analyze this {category} document for compliance risks and legal concerns.
        Return a JSON array of findings:
        {{
            "findings": [
                {{
                    "ruleId": "descriptive_id",
                    "type": "warning" or "critical" or "info",
                    "severity": "LOW" or "MEDIUM" or "HIGH" or "CRITICAL",
                    "message": "Clear description of the finding"
                }}
            ]
        }}

        Focus on:
        1. Missing standard clauses for this document type
        2. Potentially unfavorable or risky terms
        3. Ambiguous language that could cause disputes
        4. Regulatory compliance issues

        Limit to top 5 most important findings.

        Document:
        ---
        {truncated}
        ---
        """

        response = self.client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a legal compliance analysis expert. Reply with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            model=settings.GROQ_MODEL,
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        result = json.loads(response.choices[0].message.content)
        ai_findings = result.get("findings", [])

        # Tag findings as from AI
        for f in ai_findings:
            f["source"] = "ai_analysis"

        return ai_findings[:5]

    def _calculate_risk(self, findings: List[Dict]) -> tuple:
        if not findings:
            return 0.0, "LOW"

        severity_scores = {"LOW": 1, "MEDIUM": 2, "HIGH": 4, "CRITICAL": 8}
        total = sum(severity_scores.get(f.get("severity", "LOW"), 1) for f in findings)

        # Normalize to 0-1 scale
        score = min(total / 20.0, 1.0)

        if score >= 0.7:
            level = "CRITICAL"
        elif score >= 0.4:
            level = "HIGH"
        elif score >= 0.2:
            level = "MEDIUM"
        else:
            level = "LOW"

        return score, level


compliance_service = ComplianceService()
