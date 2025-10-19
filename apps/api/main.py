import os
import sys

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables from .env file (for local development)
# This will load from apps/api/.env when running locally
load_dotenv()

# Add current directory and parent directories to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)  # apps/
project_root = os.path.dirname(parent_dir)  # project root

for path in [current_dir, parent_dir, project_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

# Configure structured logging BEFORE importing other modules
from utils.logging_config import get_logger, setup_logging

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
USE_JSON_LOGS = os.getenv("USE_JSON_LOGS", "false").lower() == "true"
setup_logging(level=LOG_LEVEL, use_json=USE_JSON_LOGS)

logger = get_logger(__name__)

try:
    from middleware import CorrelationIdMiddleware
    from routes.auth import router as auth_router
    from routes.documents import router as documents_router
    from routes.health import router as health_router
    from routes.ingest import router as ingest_router
    from routes.query import router as query_router

    # from routes.batch import router as batch_router  # Temporarily disabled
except ImportError as e:
    logger.error(f"Import error: {e}", exc_info=True)
    print(f"Import error: {e}")
    print("Available paths:", sys.path)
    print("Current directory:", current_dir)
    print("Parent directory:", parent_dir)
    print("Project root:", project_root)
    raise

# Create FastAPI application
app = FastAPI(
    title="Anclora RAG API",
    description="RAG (Retrieval-Augmented Generation) API for document processing and querying",
    version="1.0.0",
)

# Add correlation ID middleware (must be added FIRST for proper request tracking)
app.add_middleware(CorrelationIdMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"FastAPI application initialized - version=1.0.0 log_level={LOG_LEVEL}")

# Include routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(query_router)
# Temporarily disabled batch router due to import errors
# app.include_router(batch_router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Anclora RAG API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "ingest": "/ingest",
            "query": "/query",
            "batch": "/batch"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

