import os
import json
from typing import List
from dotenv import load_dotenv

load_dotenv(override=True)

class Config:
    """Configuration class for the SignBridge backend"""

    # ======================
    # Server Configuration
    # ======================
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", 8000))
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

    # ======================
    # API Keys & Services
    # ======================
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_API_URL: str = os.getenv(
        "GROQ_API_URL",
        "https://api.groq.com/openai/v1/chat/completions"
    )

    # ======================
    # Whisper Configuration
    # ======================
    WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")
    WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")

    # ======================
    # CORS Configuration
    # ======================
    @classmethod
    def get_cors_origins(cls) -> List[str]:
        cors_origins = os.getenv("CORS_ORIGINS", '["*"]')
        try:
            return json.loads(cors_origins)
        except Exception:
            return [o.strip() for o in cors_origins.split(",") if o.strip()]

    CORS_ALLOW_CREDENTIALS: bool = (
        os.getenv("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"
    )
    CORS_ALLOW_METHODS: List[str] = ["*"]
    CORS_ALLOW_HEADERS: List[str] = ["*"]

    # ======================
    # Logging
    # ======================
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # ======================
    # Validation
    # ======================
    @classmethod
    def validate(cls) -> None:
        if not cls.GROQ_API_KEY:
            print("⚠ GROQ_API_KEY not set → /simplify_text disabled")

    @classmethod
    def backend_url(cls) -> str:
        return f"http://{cls.HOST}:{cls.PORT}"


config = Config()
config.validate()
