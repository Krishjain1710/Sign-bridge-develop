import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from signwriting_translation.bin import load_sockeye_translator, tokenize_spoken_text, translate

from config import MAX_TEXT_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)

_translator = None
_tokenizer_path = None


def get_translator():
    global _translator, _tokenizer_path
    if _translator is None:
        model_path = "sign/sockeye-text-to-factored-signwriting"
        _translator, _tokenizer_path = load_sockeye_translator(model_path)
    return _translator


class TextRequest(BaseModel):
    text: str


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
        translator = get_translator()
        tokenized_text = tokenize_spoken_text(text)
        model_input = f"$en $ase {tokenized_text}"
        outputs = translate(translator, [model_input])

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
