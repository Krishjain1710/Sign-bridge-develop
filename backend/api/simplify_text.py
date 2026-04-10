import requests
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from config import config, MAX_TEXT_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)


class TextRequest(BaseModel):
    text: str


@router.post("/simplify_text")
async def simplify_text(request: TextRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Text cannot be empty",
                "code": "EMPTY_TEXT",
                "stage": "simplify",
            },
        )

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail={
                "error": f"Text too long ({len(text)} chars). Max: {MAX_TEXT_LENGTH}",
                "code": "TEXT_TOO_LONG",
                "stage": "simplify",
            },
        )

    if not config.GROQ_API_KEY:
        return {
            "simplified_text": text,
            "warning": "Simplification unavailable (API key not configured). Using original text.",
        }

    headers = {
        "Authorization": f"Bearer {config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama3-70b-8192",
        "messages": [
            {
                "role": "user",
                "content": f"Simplify this text in one short sentence, and only return me the simplified text, nothing else. No bullet points, just a sentence: {text}",
            }
        ],
    }

    try:
        response = requests.post(
            config.GROQ_API_URL,
            json=payload,
            headers=headers,
            timeout=config.SIMPLIFY_TIMEOUT,
        )
        response.raise_for_status()
        simplified = (
            response.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
        )
        return {"simplified_text": simplified or text}

    except requests.Timeout:
        logger.warning("Groq API timeout, returning original text")
        return {
            "simplified_text": text,
            "warning": "Simplification timed out. Using original text.",
        }

    except requests.RequestException as e:
        logger.error(f"Groq API error: {e}")
        return {
            "simplified_text": text,
            "warning": "Simplification unavailable. Using original text.",
        }
