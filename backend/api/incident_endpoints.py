from fastapi import APIRouter

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("/")
async def get_incidents():
    return {"incidents": []}