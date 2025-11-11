from fastapi import APIRouter

router = APIRouter(prefix="/visitors", tags=["Visitors"])

@router.get("/")
async def get_visitors():
    return {"visitors": []}