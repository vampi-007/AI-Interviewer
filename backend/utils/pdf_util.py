from PyPDF2 import PdfReader
from fastapi import  HTTPException
def extract_text_from_pdf(file):
    """Extract text from an uploaded PDF file (in-memory)."""
    text = ""
    try:
        reader = PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() or ''
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting text: {str(e)}")
    return text