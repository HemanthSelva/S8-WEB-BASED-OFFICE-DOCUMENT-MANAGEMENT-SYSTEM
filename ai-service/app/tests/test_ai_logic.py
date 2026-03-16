import json
import pytest
from unittest.mock import MagicMock, patch

# No need for sys.path hacks if run with PYTHONPATH=. pytest from ai-service root

@pytest.fixture
def mock_settings():
    with patch('app.core.config.settings') as mock:
        mock.GROQ_API_KEY = "dummy_key"
        mock.GROQ_MODEL = "llama-3.3-70b-versatile"
        yield mock

def test_classify_with_rules_fallback(mock_settings):
    from app.services.classificationService import classification_service
    text = "This is an invoice for total amount $500.00 from Vendor X."
    result = classification_service._classify_with_rules(text)
    
    assert result["category"] == "Invoice"
    assert result["department"] == "Finance"
    assert "totalAmount" in result["extractedData"]
    assert result["extractedData"]["totalAmount"] == "500.00"

@patch('groq.Groq')
def test_classify_with_groq_mock(mock_groq, mock_settings):
    from app.services.classificationService import classification_service
    # Mocking the Groq client response
    mock_client = MagicMock()
    mock_groq.return_value = mock_client
    
    mock_response = MagicMock()
    mock_response.choices = [
        MagicMock(message=MagicMock(content=json.dumps({
            "department": "Finance",
            "category": "Invoice",
            "confidenceScore": 0.95,
            "suggestedTags": ["Invoice", "Finance", "Urgent"],
            "extractedData": {
                "totalAmount": "1250.00",
                "currency": "USD",
                "vendorName": "Tech Solutions Inc."
            }
        })))
    ]
    mock_client.chat.completions.create.return_value = mock_response
    
    # Manually set the client for testing
    classification_service.client = mock_client
    
    text = "Invoice for Tech Solutions Inc, total $1250.00"
    result = classification_service._classify_with_groq(text)
    
    assert result["category"] == "Invoice"
    assert result["extractedData"]["vendorName"] == "Tech Solutions Inc."
    assert result["extractedData"]["totalAmount"] == "1250.00"
