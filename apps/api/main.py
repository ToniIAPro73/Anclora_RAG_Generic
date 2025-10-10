from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routers
import sys
import os

# Add current directory and parent directories to Python path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)  # apps/
project_root = os.path.dirname(parent_dir)  # project root

for path in [current_dir, parent_dir, project_root]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from routes.ingest import router as ingest_router
    from routes.health import router as health_router
    from routes.query import router as query_router
    # from routes.batch import router as batch_router  # TODO: Fix import path
except ImportError as e:
    print(f"Import error: {e}")
    print("Available paths:", sys.path)
    print("Current directory:", current_dir)
    print("Parent directory:", parent_dir)
    print("Project root:", project_root)
    raise

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="Anclora RAG API",
    description="RAG (Retrieval-Augmented Generation) API for document processing and querying",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health_router)
app.include_router(ingest_router)
app.include_router(query_router)
# app.include_router(batch_router)  # TODO: Fix import path

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
