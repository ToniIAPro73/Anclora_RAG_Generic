def parse_markdown_bytes(b: bytes) -> str:
    return b.decode(errors="ignore")
