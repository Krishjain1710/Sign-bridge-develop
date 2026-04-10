import re
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from pose.local_pose_generator import generate_pose_from_signwriting
from config import MAX_FSW_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)

FSW_PATTERN = re.compile(r'[MS][0-9a-fA-Fx]+')


class PoseRequest(BaseModel):
    signwriting: str


@router.post("/generate_pose")
def generate_pose(req: PoseRequest):
    fsw = req.signwriting.strip()

    if not fsw:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "SignWriting notation cannot be empty",
                "code": "EMPTY_FSW",
                "stage": "pose",
            },
        )

    if len(fsw) > MAX_FSW_LENGTH:
        raise HTTPException(
            status_code=422,
            detail={
                "error": f"FSW too long ({len(fsw)} chars). Max: {MAX_FSW_LENGTH}",
                "code": "FSW_TOO_LONG",
                "stage": "pose",
            },
        )

    if not FSW_PATTERN.search(fsw):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid SignWriting notation format",
                "code": "INVALID_FSW",
                "stage": "pose",
            },
        )

    try:
        return generate_pose_from_signwriting(fsw)
    except Exception as e:
        logger.error(f"Pose generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Animation generation failed. Please try again.",
                "code": "POSE_ERROR",
                "stage": "pose",
            },
        )
