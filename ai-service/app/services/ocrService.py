import io
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import os

class OCRService:
    @staticmethod
    def extract_text(file_data: bytes, file_extension: str) -> str:
        file_extension = file_extension.lower()
        
        try:
            if file_extension in ['.pdf']:
                return OCRService._process_pdf(file_data)
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                return OCRService._process_image(file_data)
            else:
                return ""
        except Exception as e:
            print(f"OCR Error: {e}")
            return ""

    @staticmethod
    def _process_image(file_data: bytes) -> str:
        image = Image.open(io.BytesIO(file_data))
        text = pytesseract.image_to_string(image)
        return text

    @staticmethod
    def _process_pdf(file_data: bytes) -> str:
        images = convert_from_bytes(file_data)
        text = ""
        for image in images:
            text += pytesseract.image_to_string(image) + "\n"
        return text

ocr_service = OCRService()
