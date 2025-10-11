from fastapi import APIRouter

router = APIRouter(tags=["health"])

@router.get("/health")
@router.head("/health")
async def health_check():
    return {"status": "healthy"}