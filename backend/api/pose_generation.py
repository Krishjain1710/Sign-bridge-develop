import logging
import requests
import base64
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from config import config
from pose.local_pose_generator import generate_pose_from_signwriting
from api.signwriting_translation_pytorch import _get_cached_translation

router = APIRouter()
logger = logging.getLogger(__name__)

# High-quality Cloud Function API from the SignBridge repository
POSE_API_URL = "https://us-central1-sign-mt.cloudfunctions.net/spoken_text_to_signed_pose"

class PoseRequest(BaseModel):
    text: str = ""
    signwriting: str = ""
    spoken_language: str = "en"
    signed_language: str = "ase"

@router.post("/generate_pose")
async def generate_pose(req: PoseRequest):
    """
    Generate pose data. 
    Matches the SignBridge remote repository logic for high-quality animation.
    """
    
    # Priority 1: External Cloud Function API for highest quality (smooth curves)
    text_to_pose = req.text.strip()
    if text_to_pose:
        try:
            params = {
                'text': text_to_pose,
                'spoken': req.spoken_language,
                'signed': req.signed_language
            }
            logger.info(f"Attempting high-quality pose generation for: {text_to_pose[:50]}...")
            
            response = requests.get(POSE_API_URL, params=params, timeout=15)
            response.raise_for_status()
            
            return {
                "pose_data": base64.b64encode(response.content).decode('utf-8'),
                "data_format": "binary_base64",
                "source": "external_cloud_function"
            }
        except Exception as e:
            logger.warning(f"External Cloud Function failed: {e}")

    # Priority 2: Local Generator fallback (Refined skeleton)
    fsw = req.signwriting.strip()
    
    # If FSW is missing but we have text, we translate it locally to ensure the fallback works!
    if not fsw and text_to_pose:
        try:
            logger.info(f"FSW empty. Translating text locally for fallback: {text_to_pose[:30]}")
            # _get_cached_translation returns a list of strings
            outputs = await asyncio.to_thread(_get_cached_translation, text_to_pose)
            if outputs and len(outputs) > 0:
                fsw = outputs[0].strip()
        except Exception as trans_err:
            logger.error(f"Local translation failed during pose fallback: {trans_err}")

    if fsw:
        try:
            logger.info(f"Using local pose generation for signwriting: {fsw[:30]}...")
            result = generate_pose_from_signwriting(fsw)
            result["source"] = "local_generator"
            return result
        except Exception as e:
            logger.error(f"Local pose generation failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to generate animation: {str(e)}")

    # Error: Neither text nor signwriting available
    logger.error(f"Pose generation called without valid input. Text: '{text_to_pose}', FSW: '{fsw}'")
    raise HTTPException(
        status_code=400, 
        detail="No animation input provided. Please provide text or SignWriting notation."
    )
