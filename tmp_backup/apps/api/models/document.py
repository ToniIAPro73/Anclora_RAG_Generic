from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class DocumentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    CHUNKED = "chunked"
    COMPLETED = "completed"
    FAILED = "failed"


class BatchDocument(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    batch_id: UUID
    filename: str
    source_type: str  # "file_upload", "github", "gdrive"
    file_size: int
    mime_type: Optional[str] = None
    status: DocumentStatus = DocumentStatus.PENDING
    chunks_count: Optional[int] = None
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True
