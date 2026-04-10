from fastapi import APIRouter

router = APIRouter()

models_ready = {"whisper": False, "signwriting": False}


@router.get("/health")
async def health():
    all_ready = all(models_ready.values())
    return {
        "status": "ready" if all_ready else "loading",
        "models": models_ready,
    }
