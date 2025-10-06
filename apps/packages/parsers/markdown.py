import markdown
from bs4 import BeautifulSoup

def parse_markdown_bytes(markdown_bytes):
    """
    Parse Markdown bytes into text.
    
    Args:
        markdown_bytes: Raw Markdown bytes
        
    Returns:
        Extracted text from the Markdown
    """
    md_text = markdown_bytes.decode('utf-8')
    html = markdown.markdown(md_text)
    soup = BeautifulSoup(html, 'html.parser')
    return soup.get_text()
