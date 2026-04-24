import logging
import requests
import base64
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)

# Exact API used by the official ahzia/Sign-bridge project for high-quality ML poses
POSE_API_URL = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose"

class PoseRequest(BaseModel):
    text: str
    spoken_language: str = "en"
    signed_language: str = "ase"

@router.post("/generate_pose")
async def generate_pose(request: PoseRequest):
    """
    Generate high-quality pose data from text using the official sign-mt cloud function.
    This exactly replicates the original SignBridge project's animation logic.
    """
    try:
        # Construct the API URL
        params = {
            'text': request.text.strip(),
            'spoken': request.spoken_language,
            'signed': request.signed_language
        }
        
        logger.info(f"Generating professional animation for: {request.text[:50]}...")
        
        # Make the API call - it returns binary pose data directly
        response = requests.get(POSE_API_URL, params=params, timeout=20)
        response.raise_for_status()
        
        # The API returns binary pose data directly
        pose_data = response.content
        
        # Return binary data as base64 encoded for the pose-viewer
        pose_data_b64 = base64.b64encode(pose_data).decode('utf-8')
        
        return {
            "pose_data": pose_data_b64,
            "data_format": "binary_base64",
            "source": "sign_mt_cloud_function"
        }
        
    except requests.RequestException as e:
        logger.error(f"External Pose API failed: {e}")
        raise HTTPException(status_code=503, detail=f"Animation service unavailable: {str(e)}")
    except Exception as e:
        logger.error(f"Internal error in pose generation: {e}")
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
