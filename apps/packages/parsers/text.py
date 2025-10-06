def parse_text_bytes(text_bytes):
    """
    Parse text bytes into text.
    
    Args:
        text_bytes: Raw text bytes
        
    Returns:
        Decoded text
    """
    return text_bytes.decode('utf-8')
