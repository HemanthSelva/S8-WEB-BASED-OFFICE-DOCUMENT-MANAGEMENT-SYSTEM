import io
import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import os
import fitz  # PyMuPDF
from concurrent.futures import ThreadPoolExecutor

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
    def _ocr_page(image: Image.Image) -> str:
        try:
            return pytesseract.image_to_string(image)
        except Exception as e:
            print(f"Page OCR Error: {e}")
            return ""

    @staticmethod
    def _process_image(file_data: bytes) -> str:
        image = Image.open(io.BytesIO(file_data))
        return OCRService._ocr_page(image)

    @staticmethod
    def _process_pdf(file_data: bytes) -> str:
        # 1. Try fast extraction with PyMuPDF
        try:
            doc = fitz.open(stream=file_data, filetype="pdf")
            text = ""
            # Limit fast extraction to first 10 pages for classification
            for i in range(min(10, len(doc))):
                text += doc[i].get_text() + "\n"
            
            # If we got significant text, return it
            if len(text.strip()) > 50:
                print(f"PDF: Fast text extraction successful ({len(text)} chars)")
                return text
        except Exception as e:
            print(f"Fast PDF extraction failed: {e}")

        # 2. Fallback to OCR if fast extraction failed or returned too little text
        print("PDF: Falling back to OCR processing (first 5 pages)...")
        # Optimization: Process only first 5 pages for classification/metadata
        # and reduce DPI for speed (200 -> 150)
        images = convert_from_bytes(file_data, first_page=1, last_page=5, dpi=150)
        
        # Use ThreadPoolExecutor to process pages in parallel
        with ThreadPoolExecutor(max_workers=min(len(images), os.cpu_count() or 4)) as executor:
            page_texts = list(executor.map(OCRService._ocr_page, images))
        
        return "\n".join(page_texts)

ocr_service = OCRService()
