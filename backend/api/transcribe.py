from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import asyncio
import whisper
import tempfile
import os
import logging

from config import MAX_AUDIO_SIZE_MB, config

router = APIRouter()
logger = logging.getLogger(__name__)

# Load model ONCE at module level
model = whisper.load_model(config.WHISPER_MODEL, device=config.WHISPER_DEVICE)


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    content_type = audio.content_type or ""
    if content_type and content_type not in {
        "audio/webm", "audio/wav", "audio/ogg", "audio/mpeg",
        "audio/mp3", "application/octet-stream",
    }:
        raise HTTPException(
            status_code=422,
            detail={
                "error": f"Unsupported audio type: {content_type}",
                "code": "INVALID_AUDIO_TYPE",
                "stage": "transcribe",
            },
        )

    temp_path = None
    try:
        audio_bytes = await audio.read()

        size_mb = len(audio_bytes) / (1024 * 1024)
        if size_mb > MAX_AUDIO_SIZE_MB:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": f"Audio file too large ({size_mb:.1f}MB). Max: {MAX_AUDIO_SIZE_MB}MB",
                    "code": "AUDIO_TOO_LARGE",
                    "stage": "transcribe",
                },
            )

        if len(audio_bytes) == 0:
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "Audio file is empty",
                    "code": "EMPTY_AUDIO",
                    "stage": "transcribe",
                },
            )

        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
            f.write(audio_bytes)
            temp_path = f.name

        transcribe_opts = {
            "fp16": False,
            "task": "translate",
        }

        if language and language != "auto":
            transcribe_opts["language"] = language
        else:
            transcribe_opts["language"] = None

        result = await asyncio.to_thread(model.transcribe, temp_path, **transcribe_opts)
        detected_language = result.get("language", "en")

        return {
            "text": result["text"].strip(),
            "detected_language": detected_language,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Transcription failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Transcription failed. Please try again.",
                "code": "TRANSCRIBE_ERROR",
                "stage": "transcribe",
            },
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
