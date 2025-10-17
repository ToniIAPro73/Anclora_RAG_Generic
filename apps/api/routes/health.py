import os
from datetime import datetime

from fastapi import APIRouter

router = APIRouter(tags=["health"])

# Get version from environment variable or default
API_VERSION = os.getenv("API_VERSION", "1.0.0")


@router.get("/health")
@router.head("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": API_VERSION,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }