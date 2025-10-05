import io, pdfplumber
def parse_pdf_bytes(b: bytes) -> str:
    out = []
    with pdfplumber.open(io.BytesIO(b)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            out.append(txt.strip())
    return "\n\n".join(out).strip()
