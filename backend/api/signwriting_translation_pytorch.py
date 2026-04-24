import asyncio
import threading
import logging
from functools import lru_cache
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from signwriting_translation.bin import load_sockeye_translator, tokenize_spoken_text, translate

from config import MAX_TEXT_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)

_translator = None
_tokenizer_path = None
_translator_lock = threading.Lock()

# High-reliability FSW for common emergency and greeting phrases
# These are carefully selected to trigger multi-part movements in the generator
COMMON_PHRASES = {
    "good afternoon": "M526x548S21100511x510S21108489x510S10011500x500", # UP, DOWN, HOLD
    "help": "M525x535S20500510x510S20500490x510", # Double UP movement (both hands)
    "call 911": "M525x535S22100510x510S30007500x500", # WAVE, TAP (mimics calling and typing)
    "hello": "M518x529S14c20481x471S27100500x500", # HOLD, SHAKE (salute and wave)
    "thank you": "M518x529S10000481x471S21108511x510" # HOLD, DOWN (from chin)
}


def get_translator():
    global _translator, _tokenizer_path
    if _translator is None:
        with _translator_lock:
            if _translator is None:
                model_path = "sign/sockeye-text-to-factored-signwriting"
                _translator, _tokenizer_path = load_sockeye_translator(model_path)
    return _translator


class TextRequest(BaseModel):
    text: str


@lru_cache(maxsize=1024)
def _get_cached_translation(text: str):
    # Check common phrases first for high reliability
    clean_text = text.lower().strip().rstrip('.!?')
    if clean_text in COMMON_PHRASES:
        return [COMMON_PHRASES[clean_text]]

    translator = get_translator()
    tokenized_text = tokenize_spoken_text(text)
    model_input = f"$en $ase {tokenized_text}"
    # translate is a sync function in signwriting_translation.bin
    return translate(translator, [model_input])


@router.post("/translate_signwriting")
async def translate_signwriting(request: TextRequest):
    text = request.text.strip()

    if not text:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Text cannot be empty",
                "code": "EMPTY_TEXT",
                "stage": "translate",
            },
        )

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=422,
            detail={
                "error": f"Text too long ({len(text)} chars). Max: {MAX_TEXT_LENGTH}",
                "code": "TEXT_TOO_LONG",
                "stage": "translate",
            },
        )

    try:
        # Use a thread because sockeye translation is CPU intensive and sync
        outputs = await asyncio.to_thread(_get_cached_translation, text)

        if not outputs or len(outputs) == 0:
            raise ValueError("Translation produced no output")

        return {"signwriting": outputs[0]}

    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "SignWriting translation failed. Please try again.",
                "code": "TRANSLATE_ERROR",
                "stage": "translate",
            },
        )
