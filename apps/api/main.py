from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Import routers
from .routes.ingest import router as ingest_router
from .routes.health import router as health_router
from .routes.query import router as query_router

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
app.include_router(ingest_router)
app.include_router(health_router)
app.include_router(query_router)

@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Anclora RAG API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)