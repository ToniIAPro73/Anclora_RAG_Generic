import docx
from io import BytesIO

def parse_docx_bytes(docx_bytes):
    """
    Parse DOCX bytes into text.
    
    Args:
        docx_bytes: Raw DOCX bytes
        
    Returns:
        Extracted text from the DOCX
    """
    docx_file = BytesIO(docx_bytes)
    doc = docx.Document(docx_file)
    
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
        
    return '\n'.join(full_text)
