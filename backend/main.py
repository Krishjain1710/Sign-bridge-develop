from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import uvicorn

# Ensure whisper finds a working ffmpeg. On Windows, chocolatey-style shims
# can crash with 0xC0000142 when invoked with piped stdio (as whisper does),
# so prepend the first ffmpeg.exe we can locate that runs directly.
def _ensure_ffmpeg_on_path():
    candidates = [
        os.environ.get("FFMPEG_DIR"),
        r"C:\Users\Krish\Downloads\ffmpeg-8.0.1-essentials_build\ffmpeg-8.0.1-essentials_build\bin",
        r"C:\ffmpeg\bin",
    ]
    for d in candidates:
        if d and os.path.isfile(os.path.join(d, "ffmpeg.exe")):
            os.environ["PATH"] = d + os.pathsep + os.environ.get("PATH", "")
            return
_ensure_ffmpeg_on_path()

from api.signwriting_translation_pytorch import router as signwriting_translation_pytorch_router
from api.simplify_text import router as simplify_text_router
from api.pose_generation import router as pose_generation_router
from api.transcribe import router as transcribe_router
from api.health import router as health_router, models_ready
from config import config

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.get_cors_origins(),
    allow_credentials=config.CORS_ALLOW_CREDENTIALS,
    allow_methods=config.CORS_ALLOW_METHODS,
    allow_headers=config.CORS_ALLOW_HEADERS,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

logging.basicConfig(level=getattr(logging, config.LOG_LEVEL))

app.include_router(transcribe_router)
app.include_router(signwriting_translation_pytorch_router)
app.include_router(simplify_text_router)
app.include_router(pose_generation_router)
app.include_router(health_router)

@app.on_event("startup")
async def startup_event():
    logging.info("Models loading on startup...")

    # Whisper is imported/loaded synchronously in api.transcribe at module import.
    # If that module imported cleanly, the model is already in memory.
    try:
        from api import transcribe as _transcribe  # noqa: F401
        models_ready["whisper"] = True
        logging.info("Whisper model ready.")
    except Exception:
        logging.exception("Whisper failed to load at startup.")
        models_ready["whisper"] = False

    # SignWriting translator is lazy — warm it up here so /health reflects reality
    # and the first request doesn't pay the load cost.
    try:
        from api.signwriting_translation_pytorch import get_translator
        get_translator()
        models_ready["signwriting"] = True
        logging.info("SignWriting translator ready.")
    except Exception:
        logging.exception("SignWriting translator failed to load at startup.")
        models_ready["signwriting"] = False

    logging.info("Startup complete.")

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT, reload=config.DEBUG)
