from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
import uvicorn

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
    models_ready["whisper"] = True
    models_ready["signwriting"] = True
    logging.info("All models ready.")

if __name__ == "__main__":
    uvicorn.run(app, host=config.HOST, port=config.PORT, reload=config.DEBUG)
