from fastapi import APIRouter, UploadFile, File, HTTPException
import whisper
import tempfile
import os

router = APIRouter()

# Load model ONCE (fast)
model = whisper.load_model("base", device="cpu")

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as f:
            f.write(await audio.read())
            temp_path = f.name

        result = model.transcribe(
            temp_path,
            task="translate",   # force English output
            language="en",
            fp16=False
        )

        return {"text": result["text"].strip()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)
