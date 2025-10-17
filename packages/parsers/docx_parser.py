import io
import logging
import zipfile

from docx import Document

logger = logging.getLogger(__name__)


def parse_docx_bytes(b: bytes) -> str:
    """
    Parse DOCX file bytes and extract text content.

    Args:
        b: Bytes of the DOCX file

    Returns:
        Extracted text content

    Raises:
        ValueError: If the file is not a valid DOCX file
    """
    # DOCX files are ZIP archives - validate first
    if not _is_valid_zip(b):
        logger.warning("Invalid DOCX file: not a valid ZIP archive")
        raise ValueError(
            "Invalid DOCX file format. DOCX files must be valid ZIP archives. "
            "The file may be corrupted or not a real DOCX file."
        )

    # Validate minimum size (empty DOCX is ~2KB)
    if len(b) < 100:
        logger.warning(f"DOCX file too small: {len(b)} bytes")
        raise ValueError(
            f"DOCX file is too small ({len(b)} bytes). "
            "Valid DOCX files are typically at least 2KB in size."
        )

    try:
        doc = Document(io.BytesIO(b))
        text = "\n".join(p.text for p in doc.paragraphs).strip()

        # If document is empty, log warning but don't fail
        if not text:
            logger.warning("DOCX file parsed but contains no text content")
            return ""

        return text

    except Exception as e:
        logger.error(f"Failed to parse DOCX file: {str(e)}", exc_info=True)
        raise ValueError(
            f"Failed to parse DOCX file: {str(e)}. "
            "The file may be corrupted or use an unsupported DOCX format."
        )


def _is_valid_zip(b: bytes) -> bool:
    """
    Check if bytes represent a valid ZIP file.

    DOCX files are ZIP archives, so this validates the basic structure.
    """
    try:
        # Check ZIP magic number (PK\x03\x04 or PK\x05\x06)
        if len(b) < 4:
            return False

        # Valid ZIP file signatures
        if b[:4] not in (b'PK\x03\x04', b'PK\x05\x06'):
            return False

        # Try to open as ZIP to validate structure
        with zipfile.ZipFile(io.BytesIO(b), 'r') as zf:
            # DOCX must contain specific files
            namelist = zf.namelist()

            # Check for essential DOCX structure
            # At minimum, should have [Content_Types].xml
            if '[Content_Types].xml' not in namelist:
                logger.debug("ZIP file missing [Content_Types].xml - not a valid DOCX")
                return False

            # Try to validate it's readable
            zf.testzip()

        return True

    except (zipfile.BadZipFile, RuntimeError, KeyError):
        return False
    except Exception as e:
        logger.debug(f"Unexpected error validating ZIP: {e}")
        return False
