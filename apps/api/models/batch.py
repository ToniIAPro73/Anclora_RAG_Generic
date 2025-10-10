from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from uuid import UUID, uuid4


class BatchStatus(str, Enum):
    PENDING = "pending"
    VALIDATING = "validating"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    PARTIAL = "partial"


class IngestionBatch(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    user_id: UUID
    name: str
    description: Optional[str] = None
    status: BatchStatus = BatchStatus.PENDING
    total_files: int = 0
    processed_files: int = 0
    failed_files: int = 0
    total_size_bytes: int = 0
    qdrant_collection: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    error_summary: Optional[dict] = None

    class Config:
        use_enum_values = True
