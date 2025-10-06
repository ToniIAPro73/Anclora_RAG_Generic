from pypdf import PdfReader
from io import BytesIO

def parse_pdf_bytes(pdf_bytes):
    """
    Parse PDF bytes into text.
    
    Args:
        pdf_bytes: Raw PDF bytes
        
    Returns:
        Extracted text from the PDF
    """
    pdf_file = BytesIO(pdf_bytes)
    reader = PdfReader(pdf_file)
    text = ''
    
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text + '\n\n'
            
    return text
