from fastapi import APIRouter, Response

router = APIRouter()

models_ready = {"whisper": False, "signwriting": False}


@router.get("/health")
async def health():
    all_ready = all(models_ready.values())
    return {
        "status": "ready" if all_ready else "loading",
        "models": models_ready,
    }


@router.get("/")
async def root():
    return {"message": "Sign Bridge backend is running.", "health": "/health"}


@router.get("/favicon.ico", include_in_schema=False)
async def favicon():
    # Avoid noisy 404s from browser automatic favicon requests.
    return Response(status_code=204)
