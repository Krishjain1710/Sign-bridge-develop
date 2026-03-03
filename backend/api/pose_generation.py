from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pose.local_pose_generator import generate_pose_from_signwriting

router = APIRouter()

class PoseRequest(BaseModel):
    signwriting: str

@router.post("/generate_pose")
def generate_pose(req: PoseRequest):
    try:
        return generate_pose_from_signwriting(req.signwriting)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
