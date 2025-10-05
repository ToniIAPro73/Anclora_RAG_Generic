def parse_text_bytes(b: bytes) -> str:
    return b.decode(errors="ignore")
