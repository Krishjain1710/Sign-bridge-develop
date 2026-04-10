# VocaSign Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform VocaSign from a working prototype into a competition-ready app with a visual overhaul, significantly improved animations, clean architecture, reliable pipeline, and high-impact new features.

**Architecture:** The work is split into 6 phases that build on each other: (1) Backend reliability & animation rewrite, (2) Frontend architecture cleanup (contexts), (3) UI visual overhaul, (4) Pipeline integration & error handling, (5) New features, (6) Polish & accessibility. Each phase produces working, testable software.

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS (frontend), FastAPI + Python 3.11 + PyTorch + Whisper (backend), pose-format library (animation).

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `backend/api/health.py` | Health check endpoint with model readiness |
| `backend/pose/base_pose.py` | Anatomical base pose definition (17 joints) |
| `backend/pose/movement_types.py` | 12 movement type definitions and easing functions |
| `backend/pose/two_hand_parser.py` | FSW parsing for two-handed sign detection |
| `backend/pose/interpolation.py` | Cubic Bezier easing and keyframe interpolation |
| `frontend/src/contexts/TranslationContext.tsx` | Translation pipeline state and actions |
| `frontend/src/contexts/PanelContext.tsx` | Panel open/close state management |
| `frontend/src/components/Toolbar.tsx` | Collapsible toolbar below header |
| `frontend/src/components/PanelRenderer.tsx` | Renders active panel based on PanelContext |
| `frontend/src/components/Onboarding.tsx` | 3-step first-time onboarding overlay |
| `frontend/src/components/ExportControls.tsx` | Animation/SignWriting export buttons |
| `frontend/src/components/PracticeMode.tsx` | Quiz-style sign learning practice |
| `frontend/src/components/SignBreakdown.tsx` | FSW symbol breakdown display |
| `frontend/src/components/AccessibilityHelp.tsx` | Keyboard shortcuts & help panel |
| `frontend/src/hooks/useStreamingRecorder.ts` | Chunked audio recording for live translation |
| `frontend/src/hooks/useOnboarding.ts` | Onboarding completion state (localStorage) |

### Modified Files

| File | Changes |
|------|---------|
| `backend/main.py` | Model preloading on startup, health router, structured errors |
| `backend/config.py` | Timeout configs, validation constants |
| `backend/api/transcribe.py` | Input validation, structured error responses, model reuse |
| `backend/api/simplify_text.py` | Validation, graceful degradation, structured errors |
| `backend/api/signwriting_translation_pytorch.py` | Validation, model caching, structured errors |
| `backend/api/pose_generation.py` | Validation, structured errors |
| `backend/pose/signwriting_parser.py` | Expanded to 12 movement types |
| `backend/pose/signwriting_pose_generator.py` | Complete rewrite: 17 joints, interpolation, two-handed |
| `backend/pose/local_pose_generator.py` | Updated for 17-joint skeleton |
| `frontend/src/pages/App.tsx` | Slim down to ~30 lines using contexts |
| `frontend/src/index.css` | New Clarity design tokens, remove glassmorphism |
| `frontend/src/config.ts` | Health endpoint, new color tokens |
| `frontend/src/services/ApiService.ts` | AbortSignal support, health check, structured errors |
| `frontend/src/components/Header.tsx` | Simplified: logo + minimal controls |
| `frontend/src/components/InputSection.tsx` | Consume TranslationContext, new card style |
| `frontend/src/components/SignWritingSection.tsx` | Context, export button, new card style |
| `frontend/src/components/AnimationSection.tsx` | Context, export button, new card style |
| `frontend/src/components/PipelineProgress.tsx` | Animated stepper with icons |
| `frontend/src/components/PoseViewer.tsx` | Updated for 17-joint skeleton |
| `frontend/src/components/LearningMode.tsx` | Practice mode, sign breakdown, progress |
| `frontend/src/components/TranscriptionDisplay.tsx` | Streaming typing animation |
| `frontend/src/components/HistoryPanel.tsx` | New card style |
| `frontend/src/components/FavoritesPanel.tsx` | New card style |
| `frontend/src/components/SettingsPanel.tsx` | New card style |
| `frontend/src/components/PhraseBook.tsx` | New card style, toolbar integration |
| `frontend/src/components/AudioRecorder.tsx` | Streaming chunk support |
| `frontend/src/components/SimplifyChoiceModal.tsx` | New card style |
| `frontend/src/hooks/useAudioRecorder.ts` | onChunk callback for streaming |

---

## Phase 1: Backend Reliability & Animation Rewrite

### Task 1: Health Check Endpoint

**Files:**
- Create: `backend/api/health.py`
- Modify: `backend/main.py`
- Modify: `frontend/src/config.ts`
- Modify: `frontend/src/services/ApiService.ts`

- [ ] **Step 1: Create health endpoint**

Create `backend/api/health.py`:

```python
from fastapi import APIRouter

router = APIRouter()

# Will be set to True by main.py after models load
models_ready = {"whisper": False, "signwriting": False}


@router.get("/health")
async def health():
    all_ready = all(models_ready.values())
    return {
        "status": "ready" if all_ready else "loading",
        "models": models_ready,
    }
```

- [ ] **Step 2: Register health router in main.py**

In `backend/main.py`, add after the existing router imports (line 9):

```python
from api.health import router as health_router, models_ready
```

Add after the existing `app.include_router` lines (after line 30):

```python
app.include_router(health_router)
```

Add a startup event before the `if __name__` block:

```python
@app.on_event("startup")
async def startup_event():
    logging.info("Models loading on startup...")
    # Whisper is already loaded at module level in transcribe.py
    models_ready["whisper"] = True
    # SignWriting translator loads on first call; mark ready
    models_ready["signwriting"] = True
    logging.info("All models ready.")
```

- [ ] **Step 3: Add health endpoint to frontend config**

In `frontend/src/config.ts`, add to `API_ENDPOINTS` object (line 86):

```typescript
export const API_ENDPOINTS = {
  HEALTH: `${config.BACKEND_URL}/health`,
  TRANSCRIBE: `${config.BACKEND_URL}/transcribe`,
  SIMPLIFY_TEXT: `${config.BACKEND_URL}/simplify_text`,
  TRANSLATE_SIGNWRITING: `${config.BACKEND_URL}/translate_signwriting`,
  GENERATE_POSE: `${config.BACKEND_URL}/generate_pose`,
} as const;
```

- [ ] **Step 4: Add health check to ApiService**

In `frontend/src/services/ApiService.ts`, add after the imports (line 2):

```typescript
export interface HealthResponse {
  status: 'ready' | 'loading';
  models: { whisper: boolean; signwriting: boolean };
}
```

Add as first method in the ApiService object (after line 30):

```typescript
  async checkHealth(): Promise<HealthResponse> {
    const response = await axios.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    return response.data;
  },
```

- [ ] **Step 5: Commit**

```bash
git add backend/api/health.py backend/main.py frontend/src/config.ts frontend/src/services/ApiService.ts
git commit -m "feat: add health check endpoint for model readiness"
```

---

### Task 2: Backend Input Validation & Structured Errors

**Files:**
- Modify: `backend/api/transcribe.py`
- Modify: `backend/api/simplify_text.py`
- Modify: `backend/api/signwriting_translation_pytorch.py`
- Modify: `backend/api/pose_generation.py`
- Modify: `backend/config.py`

- [ ] **Step 1: Add validation constants to config.py**

In `backend/config.py`, add before the `Config` class (line 8):

```python
# Validation constants
MAX_AUDIO_SIZE_MB = 25
MAX_TEXT_LENGTH = 1000
MAX_FSW_LENGTH = 500
ALLOWED_AUDIO_TYPES = {"audio/webm", "audio/wav", "audio/ogg", "audio/mpeg", "audio/mp3"}
```

Add inside the `Config` class after `LOG_LEVEL` (line 53):

```python
    # Timeouts (seconds)
    TRANSCRIBE_TIMEOUT: int = int(os.getenv("TRANSCRIBE_TIMEOUT", 30))
    SIMPLIFY_TIMEOUT: int = int(os.getenv("SIMPLIFY_TIMEOUT", 10))
    TRANSLATE_TIMEOUT: int = int(os.getenv("TRANSLATE_TIMEOUT", 15))
    POSE_TIMEOUT: int = int(os.getenv("POSE_TIMEOUT", 10))
```

- [ ] **Step 2: Update transcribe.py with validation and structured errors**

Replace the full content of `backend/api/transcribe.py`:

```python
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import Optional
import whisper
import tempfile
import os
import logging

from config import MAX_AUDIO_SIZE_MB

router = APIRouter()

logger = logging.getLogger(__name__)

# Load model ONCE at module level
model = whisper.load_model("base", device="cpu")


@router.post("/transcribe")
async def transcribe(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    # Validate file type
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

        # Validate file size
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

        result = model.transcribe(temp_path, **transcribe_opts)
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
```

- [ ] **Step 3: Update simplify_text.py with validation and graceful degradation**

Replace the full content of `backend/api/simplify_text.py`:

```python
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
        # Graceful degradation: return original text with warning
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
        # Graceful degradation on timeout
        logger.warning("Groq API timeout, returning original text")
        return {
            "simplified_text": text,
            "warning": "Simplification timed out. Using original text.",
        }

    except requests.RequestException as e:
        logger.error(f"Groq API error: {e}")
        # Graceful degradation: return original text instead of failing
        return {
            "simplified_text": text,
            "warning": f"Simplification unavailable. Using original text.",
        }
```

- [ ] **Step 4: Update signwriting_translation_pytorch.py with validation**

Replace the full content of `backend/api/signwriting_translation_pytorch.py`:

```python
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from signwriting_translation.bin import load_sockeye_translator, tokenize_spoken_text, translate

from config import MAX_TEXT_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)

# Cache translator at module level
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
```

- [ ] **Step 5: Update pose_generation.py with validation**

Replace the full content of `backend/api/pose_generation.py`:

```python
import re
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from pose.local_pose_generator import generate_pose_from_signwriting
from config import MAX_FSW_LENGTH

router = APIRouter()
logger = logging.getLogger(__name__)

FSW_PATTERN = re.compile(r'[MS][0-9a-fA-Fx]+')


class PoseRequest(BaseModel):
    signwriting: str


@router.post("/generate_pose")
def generate_pose(req: PoseRequest):
    fsw = req.signwriting.strip()

    if not fsw:
        raise HTTPException(
            status_code=422,
            detail={
                "error": "SignWriting notation cannot be empty",
                "code": "EMPTY_FSW",
                "stage": "pose",
            },
        )

    if len(fsw) > MAX_FSW_LENGTH:
        raise HTTPException(
            status_code=422,
            detail={
                "error": f"FSW too long ({len(fsw)} chars). Max: {MAX_FSW_LENGTH}",
                "code": "FSW_TOO_LONG",
                "stage": "pose",
            },
        )

    if not FSW_PATTERN.search(fsw):
        raise HTTPException(
            status_code=422,
            detail={
                "error": "Invalid SignWriting notation format",
                "code": "INVALID_FSW",
                "stage": "pose",
            },
        )

    try:
        return generate_pose_from_signwriting(fsw)
    except Exception as e:
        logger.error(f"Pose generation failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Animation generation failed. Please try again.",
                "code": "POSE_ERROR",
                "stage": "pose",
            },
        )
```

- [ ] **Step 6: Commit**

```bash
git add backend/config.py backend/api/transcribe.py backend/api/simplify_text.py backend/api/signwriting_translation_pytorch.py backend/api/pose_generation.py
git commit -m "feat: add input validation, structured errors, and graceful degradation to all endpoints"
```

---

### Task 3: Animation Base Pose & Joint System (17 Joints)

**Files:**
- Create: `backend/pose/base_pose.py`
- Create: `backend/pose/movement_types.py`
- Create: `backend/pose/interpolation.py`

- [ ] **Step 1: Create base pose definition**

Create `backend/pose/base_pose.py`:

```python
"""Anatomically correct 17-joint base pose for sign language animation."""

import numpy as np

# 17 joints with normalized coordinates (0-1 range, 512x512 canvas)
JOINT_NAMES = [
    "NOSE",
    "NECK",
    "MID_SPINE",
    "LEFT_SHOULDER",
    "RIGHT_SHOULDER",
    "LEFT_ELBOW",
    "RIGHT_ELBOW",
    "LEFT_WRIST",
    "RIGHT_WRIST",
    "LEFT_HIP",
    "RIGHT_HIP",
    "LEFT_HAND",
    "RIGHT_HAND",
    "LEFT_INDEX",
    "RIGHT_INDEX",
    "LEFT_THUMB",
    "RIGHT_THUMB",
]

NUM_JOINTS = len(JOINT_NAMES)

# Neutral standing pose — arms slightly away from body, relaxed
BASE_POSE = np.array([
    [0.50, 0.15],  # NOSE
    [0.50, 0.22],  # NECK
    [0.50, 0.45],  # MID_SPINE
    [0.38, 0.25],  # LEFT_SHOULDER
    [0.62, 0.25],  # RIGHT_SHOULDER
    [0.30, 0.38],  # LEFT_ELBOW
    [0.70, 0.38],  # RIGHT_ELBOW
    [0.28, 0.50],  # LEFT_WRIST
    [0.72, 0.50],  # RIGHT_WRIST
    [0.42, 0.55],  # LEFT_HIP
    [0.58, 0.55],  # RIGHT_HIP
    [0.27, 0.53],  # LEFT_HAND
    [0.73, 0.53],  # RIGHT_HAND
    [0.26, 0.55],  # LEFT_INDEX
    [0.74, 0.55],  # RIGHT_INDEX
    [0.29, 0.54],  # LEFT_THUMB
    [0.71, 0.54],  # RIGHT_THUMB
], dtype=np.float32)

# Limb connections for rendering
LIMBS = [
    (0, 1),    # nose -> neck
    (1, 2),    # neck -> mid_spine
    (1, 3),    # neck -> left_shoulder
    (1, 4),    # neck -> right_shoulder
    (3, 5),    # left_shoulder -> left_elbow
    (4, 6),    # right_shoulder -> right_elbow
    (5, 7),    # left_elbow -> left_wrist
    (6, 8),    # right_elbow -> right_wrist
    (2, 9),    # mid_spine -> left_hip
    (2, 10),   # mid_spine -> right_hip
    (7, 11),   # left_wrist -> left_hand
    (8, 12),   # right_wrist -> right_hand
    (11, 13),  # left_hand -> left_index
    (12, 14),  # right_hand -> right_index
    (11, 15),  # left_hand -> left_thumb
    (12, 16),  # right_hand -> right_thumb
]

COLORS = [(100, 200, 200)] * NUM_JOINTS

# Joint groups for movement targeting
RIGHT_ARM = [4, 6, 8, 12, 14, 16]  # r_shoulder, r_elbow, r_wrist, r_hand, r_index, r_thumb
LEFT_ARM = [3, 5, 7, 11, 13, 15]   # l_shoulder, l_elbow, l_wrist, l_hand, l_index, l_thumb
RIGHT_HAND_JOINTS = [8, 12, 14, 16]  # wrist, hand, index, thumb
LEFT_HAND_JOINTS = [7, 11, 13, 15]
FINGER_JOINTS_RIGHT = [14, 16]  # index, thumb
FINGER_JOINTS_LEFT = [13, 15]
```

- [ ] **Step 2: Create movement types with easing**

Create `backend/pose/movement_types.py`:

```python
"""Movement type definitions for sign language animation."""

from enum import Enum
from dataclasses import dataclass
import numpy as np


class MovementType(Enum):
    UP = "UP"
    DOWN = "DOWN"
    LEFT = "LEFT"
    RIGHT = "RIGHT"
    CIRCLE = "CIRCLE"
    WAVE = "WAVE"
    TAP = "TAP"
    TWIST = "TWIST"
    PINCH = "PINCH"
    SPREAD = "SPREAD"
    SHAKE = "SHAKE"
    HOLD = "HOLD"
    IDLE = "IDLE"


@dataclass
class MovementDef:
    """Defines how a movement type affects joint positions."""
    movement_type: MovementType
    # Which hand: "right", "left", "both"
    hand: str = "right"


# Amplitude of movements in normalized space (0-1)
MOVEMENT_AMPLITUDE = 0.12

# How many frames each movement takes as a base
FRAMES_PER_MOVEMENT = 30


def compute_frames(num_movements: int, num_signs: int = 1) -> int:
    """Calculate total frame count based on complexity."""
    frames = FRAMES_PER_MOVEMENT + max(0, num_movements - 1) * 20 + max(0, num_signs - 1) * 10
    return min(150, max(30, frames))
```

- [ ] **Step 3: Create interpolation module**

Create `backend/pose/interpolation.py`:

```python
"""Cubic Bezier easing and keyframe interpolation for smooth animation."""

import numpy as np


def ease_in_out(t: float) -> float:
    """Cubic ease-in-out: smooth acceleration and deceleration."""
    return t * t * (3.0 - 2.0 * t)


def anticipation_curve(t: float) -> float:
    """Slight pullback before main movement (first 15% of time)."""
    if t < 0.15:
        # Move backward slightly (10% of amplitude)
        return -0.1 * ease_in_out(t / 0.15)
    else:
        # Main movement from -0.1 to 1.0
        progress = (t - 0.15) / 0.85
        return -0.1 + 1.1 * ease_in_out(progress)


def follow_through_curve(t: float) -> float:
    """Main movement with overshoot and settle (last 25% of time)."""
    if t < 0.75:
        return ease_in_out(t / 0.75)
    else:
        # Overshoot to 1.05, then settle to 1.0
        settle_t = (t - 0.75) / 0.25
        overshoot = 1.05
        return overshoot - (overshoot - 1.0) * ease_in_out(settle_t)


def full_movement_curve(t: float) -> float:
    """Complete movement with anticipation + main + follow-through."""
    if t < 0.15:
        # Anticipation: slight pullback
        return -0.1 * ease_in_out(t / 0.15)
    elif t < 0.75:
        # Main movement
        progress = (t - 0.15) / 0.60
        return -0.1 + 1.15 * ease_in_out(progress)
    else:
        # Follow-through: overshoot then settle
        settle_t = (t - 0.75) / 0.25
        return 1.05 - 0.05 * ease_in_out(settle_t)


def interpolate_poses(pose_a: np.ndarray, pose_b: np.ndarray, num_frames: int) -> np.ndarray:
    """Smoothly interpolate between two poses over num_frames using ease-in-out."""
    frames = np.zeros((num_frames, *pose_a.shape), dtype=np.float32)
    for f in range(num_frames):
        t = f / max(1, num_frames - 1)
        alpha = ease_in_out(t)
        frames[f] = pose_a + alpha * (pose_b - pose_a)
    return frames
```

- [ ] **Step 4: Commit**

```bash
git add backend/pose/base_pose.py backend/pose/movement_types.py backend/pose/interpolation.py
git commit -m "feat: add 17-joint base pose, 12 movement types, and interpolation system"
```

---

### Task 4: Rewrite SignWriting Parser for Two-Handed Detection

**Files:**
- Create: `backend/pose/two_hand_parser.py`
- Modify: `backend/pose/signwriting_parser.py`

- [ ] **Step 1: Create two-hand parser**

Create `backend/pose/two_hand_parser.py`:

```python
"""Parse FSW notation to detect which hand(s) are involved and their movements."""

import re
from typing import List, Tuple
from pose.movement_types import MovementType, MovementDef


def parse_sign_box_center(fsw: str) -> Tuple[int, int]:
    """Extract sign box center from FSW M-token. Returns (cx, cy)."""
    match = re.search(r'M(\d+)x(\d+)', fsw)
    if match:
        return int(match.group(1)), int(match.group(2))
    return 500, 500  # default center


def parse_symbol_positions(fsw: str) -> List[Tuple[str, int, int]]:
    """Extract all symbols with their positions from FSW.

    Returns list of (symbol_hex, x, y) tuples.
    """
    pattern = re.compile(r'S([0-9a-fA-F]{5})(\d+)x(\d+)')
    results = []
    for match in pattern.finditer(fsw):
        sym_hex = match.group(1)
        x = int(match.group(2))
        y = int(match.group(3))
        results.append((sym_hex, x, y))
    return results


def determine_hand(sym_x: int, center_x: int) -> str:
    """Determine which hand based on symbol position relative to sign box center."""
    offset = sym_x - center_x
    if abs(offset) <= 20:
        return "both"
    elif offset < 0:
        return "left"
    else:
        return "right"


def classify_movement(sym_hex: str) -> MovementType:
    """Classify a symbol ID into a movement type using ISWA 2010 ranges."""
    try:
        sym_id = int(sym_hex[:3], 16)
    except ValueError:
        return MovementType.IDLE

    variation = 0
    if len(sym_hex) > 3:
        try:
            variation = int(sym_hex[3], 16)
        except ValueError:
            pass

    # Movement symbols (0x205 - 0x27F)
    if 0x205 <= sym_id <= 0x214:
        # Straight wall-plane movements
        if variation < 4:
            return MovementType.UP
        elif variation < 8:
            return MovementType.RIGHT
        elif variation < 12:
            return MovementType.DOWN
        else:
            return MovementType.LEFT

    elif 0x215 <= sym_id <= 0x21D:
        # Curved wall-plane movements
        return MovementType.CIRCLE

    elif 0x21E <= sym_id <= 0x22F:
        # Diagonal movements — wave-like
        return MovementType.WAVE

    elif 0x230 <= sym_id <= 0x245:
        # Floor plane movements
        return MovementType.RIGHT

    elif 0x246 <= sym_id <= 0x260:
        # Rotation/circular
        return MovementType.TWIST

    elif 0x261 <= sym_id <= 0x270:
        # Finger movements — pinch/spread
        if variation % 2 == 0:
            return MovementType.PINCH
        else:
            return MovementType.SPREAD

    elif 0x271 <= sym_id <= 0x27F:
        # Wrist movements
        return MovementType.SHAKE

    elif 0x300 <= sym_id <= 0x36D:
        # Contact symbols — tap
        return MovementType.TAP

    # Hand shape symbols don't produce movement
    elif 0x100 <= sym_id <= 0x204:
        return MovementType.HOLD

    return MovementType.IDLE


def parse_fsw_movements(fsw: str) -> List[MovementDef]:
    """Parse a full FSW string into a list of MovementDefs with hand assignment.

    This is the main entry point for the two-handed parser.
    """
    center_x, _ = parse_sign_box_center(fsw)
    symbols = parse_symbol_positions(fsw)

    if not symbols:
        return [MovementDef(movement_type=MovementType.IDLE, hand="right")]

    movements = []
    for sym_hex, sym_x, sym_y in symbols:
        move_type = classify_movement(sym_hex)
        if move_type == MovementType.IDLE:
            continue

        hand = determine_hand(sym_x, center_x)
        movements.append(MovementDef(movement_type=move_type, hand=hand))

    if not movements:
        return [MovementDef(movement_type=MovementType.IDLE, hand="right")]

    return movements
```

- [ ] **Step 2: Update signwriting_parser.py to use new parser**

Replace the full content of `backend/pose/signwriting_parser.py`:

```python
"""Legacy-compatible wrapper around the two-hand parser.

Returns simple movement string lists for backward compatibility,
but the main animation system should use two_hand_parser.parse_fsw_movements() directly.
"""

from pose.two_hand_parser import parse_fsw_movements


def parse_signwriting(signwriting: str):
    """Extract movement strings from FSW. Returns list of movement name strings."""
    movement_defs = parse_fsw_movements(signwriting)
    return [m.movement_type.value for m in movement_defs]
```

- [ ] **Step 3: Commit**

```bash
git add backend/pose/two_hand_parser.py backend/pose/signwriting_parser.py
git commit -m "feat: two-handed FSW parser with 12 movement types and hand detection"
```

---

### Task 5: Rewrite Pose Generator (17 Joints, Interpolation, Two-Handed)

**Files:**
- Modify: `backend/pose/signwriting_pose_generator.py`
- Modify: `backend/pose/local_pose_generator.py`

- [ ] **Step 1: Rewrite signwriting_pose_generator.py**

Replace the full content of `backend/pose/signwriting_pose_generator.py`:

```python
"""Generate 17-joint pose sequences from parsed FSW movements."""

import numpy as np
from typing import List

from pose.base_pose import (
    BASE_POSE, NUM_JOINTS,
    RIGHT_ARM, LEFT_ARM,
    RIGHT_HAND_JOINTS, LEFT_HAND_JOINTS,
    FINGER_JOINTS_RIGHT, FINGER_JOINTS_LEFT,
)
from pose.movement_types import MovementType, MovementDef, MOVEMENT_AMPLITUDE, compute_frames
from pose.interpolation import full_movement_curve, interpolate_poses


def _apply_directional(base: np.ndarray, joints: List[int], dx: float, dy: float,
                       t: float) -> np.ndarray:
    """Apply a directional movement to specific joints at time t."""
    pose = base.copy()
    curve = full_movement_curve(t)
    for j in joints:
        pose[j, 0] += dx * curve * MOVEMENT_AMPLITUDE
        pose[j, 1] += dy * curve * MOVEMENT_AMPLITUDE
    return pose


def _apply_circle(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    """Apply circular movement to joints at time t."""
    pose = base.copy()
    angle = t * 2 * np.pi
    curve = full_movement_curve(min(t * 3, 1.0))  # ramp up amplitude
    for j in joints:
        pose[j, 0] += np.cos(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve
        pose[j, 1] += np.sin(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve
    return pose


def _apply_wave(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    """Oscillating side-to-side movement, 3 cycles."""
    pose = base.copy()
    wave = np.sin(t * 3 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.6
    envelope = full_movement_curve(t)
    for j in joints:
        pose[j, 0] += wave * envelope
    return pose


def _apply_tap(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    """Quick down-up contact movement."""
    pose = base.copy()
    if t < 0.4:
        curve = full_movement_curve(t / 0.4)
        dy = MOVEMENT_AMPLITUDE * 0.5 * curve
    else:
        curve = full_movement_curve((t - 0.4) / 0.6)
        dy = MOVEMENT_AMPLITUDE * 0.5 * (1.0 - curve)
    for j in joints:
        pose[j, 1] += dy
    return pose


def _apply_twist(base: np.ndarray, hand_joints: List[int],
                 finger_joints: List[int], t: float) -> np.ndarray:
    """Wrist rotation — fingers rotate around wrist."""
    pose = base.copy()
    angle = t * np.pi * 1.5  # 270 degree rotation
    radius = 0.03
    curve = full_movement_curve(t)
    for j in finger_joints:
        base_offset_x = pose[j, 0] - pose[hand_joints[0], 0]
        base_offset_y = pose[j, 1] - pose[hand_joints[0], 1]
        rot_x = base_offset_x * np.cos(angle * curve) - base_offset_y * np.sin(angle * curve)
        rot_y = base_offset_x * np.sin(angle * curve) + base_offset_y * np.cos(angle * curve)
        pose[j, 0] = pose[hand_joints[0], 0] + rot_x
        pose[j, 1] = pose[hand_joints[0], 1] + rot_y
    return pose


def _apply_pinch(base: np.ndarray, finger_joints: List[int], t: float) -> np.ndarray:
    """Index and thumb converge."""
    pose = base.copy()
    curve = full_movement_curve(t)
    if len(finger_joints) >= 2:
        mid_x = (pose[finger_joints[0], 0] + pose[finger_joints[1], 0]) / 2
        mid_y = (pose[finger_joints[0], 1] + pose[finger_joints[1], 1]) / 2
        for j in finger_joints:
            pose[j, 0] += (mid_x - pose[j, 0]) * curve * 0.8
            pose[j, 1] += (mid_y - pose[j, 1]) * curve * 0.8
    return pose


def _apply_spread(base: np.ndarray, finger_joints: List[int], t: float) -> np.ndarray:
    """Index and thumb diverge."""
    pose = base.copy()
    curve = full_movement_curve(t)
    if len(finger_joints) >= 2:
        pose[finger_joints[0], 0] -= 0.03 * curve
        pose[finger_joints[1], 0] += 0.03 * curve
    return pose


def _apply_shake(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    """Rapid small oscillation, 5 cycles."""
    pose = base.copy()
    shake = np.sin(t * 5 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.3
    envelope = 1.0 - abs(2 * t - 1)  # fade in and out
    for j in joints:
        pose[j, 0] += shake * envelope
    return pose


def _get_target_joints(hand: str):
    """Get the joint groups for a given hand specification."""
    if hand == "right":
        return RIGHT_HAND_JOINTS, FINGER_JOINTS_RIGHT, RIGHT_ARM
    elif hand == "left":
        return LEFT_HAND_JOINTS, FINGER_JOINTS_LEFT, LEFT_ARM
    else:
        # Both hands
        return (
            RIGHT_HAND_JOINTS + LEFT_HAND_JOINTS,
            FINGER_JOINTS_RIGHT + FINGER_JOINTS_LEFT,
            RIGHT_ARM + LEFT_ARM,
        )


def generate_movement_frames(movement: MovementDef, num_frames: int) -> np.ndarray:
    """Generate frames for a single movement, returning shape (num_frames, NUM_JOINTS, 2)."""
    frames = np.zeros((num_frames, NUM_JOINTS, 2), dtype=np.float32)
    hand_joints, finger_joints, arm_joints = _get_target_joints(movement.hand)
    mt = movement.movement_type

    for f in range(num_frames):
        t = f / max(1, num_frames - 1)
        base = BASE_POSE.copy()

        if mt == MovementType.UP:
            frames[f] = _apply_directional(base, hand_joints, 0, -1, t)
        elif mt == MovementType.DOWN:
            frames[f] = _apply_directional(base, hand_joints, 0, 1, t)
        elif mt == MovementType.LEFT:
            frames[f] = _apply_directional(base, hand_joints, -1, 0, t)
        elif mt == MovementType.RIGHT:
            frames[f] = _apply_directional(base, hand_joints, 1, 0, t)
        elif mt == MovementType.CIRCLE:
            frames[f] = _apply_circle(base, hand_joints, t)
        elif mt == MovementType.WAVE:
            frames[f] = _apply_wave(base, hand_joints, t)
        elif mt == MovementType.TAP:
            frames[f] = _apply_tap(base, hand_joints, t)
        elif mt == MovementType.TWIST:
            frames[f] = _apply_twist(base, hand_joints, finger_joints, t)
        elif mt == MovementType.PINCH:
            frames[f] = _apply_pinch(base, finger_joints, t)
        elif mt == MovementType.SPREAD:
            frames[f] = _apply_spread(base, finger_joints, t)
        elif mt == MovementType.SHAKE:
            frames[f] = _apply_shake(base, hand_joints, t)
        elif mt in (MovementType.HOLD, MovementType.IDLE):
            frames[f] = base
        else:
            frames[f] = base

    return frames


def generate_pose_from_movements(movements: List[MovementDef]) -> np.ndarray:
    """Generate a complete pose sequence from a list of MovementDefs.

    Returns shape (total_frames, NUM_JOINTS, 2) in normalized 0-1 space.
    """
    if not movements:
        # Return 30 frames of base pose
        frames = np.zeros((30, NUM_JOINTS, 2), dtype=np.float32)
        for f in range(30):
            frames[f] = BASE_POSE.copy()
        return frames

    total_frames = compute_frames(len(movements))
    frames_per = total_frames // len(movements)
    transition_frames = 10

    all_frames = []

    for i, movement in enumerate(movements):
        move_frames = generate_movement_frames(movement, frames_per)
        all_frames.append(move_frames)

        # Add transition to next movement (if not last)
        if i < len(movements) - 1:
            end_pose = move_frames[-1]
            next_start = BASE_POSE.copy()  # next movement starts from base
            transition = interpolate_poses(end_pose, next_start, transition_frames)
            all_frames.append(transition)

    return np.concatenate(all_frames, axis=0)
```

- [ ] **Step 2: Rewrite local_pose_generator.py for 17-joint skeleton**

Replace the full content of `backend/pose/local_pose_generator.py`:

```python
"""Convert pose sequences to .pose binary format for the pose-viewer web component."""

import io
import base64
import numpy as np
from pose_format import Pose
from pose_format.pose_header import PoseHeader, PoseHeaderDimensions, PoseHeaderComponent
from pose_format.numpy import NumPyPoseBody

from pose.base_pose import JOINT_NAMES, LIMBS, COLORS, NUM_JOINTS
from pose.two_hand_parser import parse_fsw_movements
from pose.signwriting_pose_generator import generate_pose_from_movements


def generate_pose_from_signwriting(signwriting: str) -> dict:
    """Main entry point: FSW string -> .pose binary (base64).

    Pipeline: FSW -> parse movements -> generate frames -> encode .pose
    """
    if not signwriting or not signwriting.strip():
        raise ValueError("Empty signwriting input")

    movements = parse_fsw_movements(signwriting)

    if not movements:
        raise ValueError("No movements parsed from signwriting")

    # Generate pose sequence: shape (num_frames, NUM_JOINTS, 2)
    pose_sequence = generate_pose_from_movements(movements)
    num_frames = pose_sequence.shape[0]

    # Scale from 0-1 normalized to 512x512 pixel space
    body_data = np.zeros((num_frames, 1, NUM_JOINTS, 2), dtype=np.float32)
    for f in range(num_frames):
        for j in range(NUM_JOINTS):
            body_data[f, 0, j, 0] = pose_sequence[f, j, 0] * 512  # X
            body_data[f, 0, j, 1] = pose_sequence[f, j, 1] * 512  # Y

    confidence = np.ones((num_frames, 1, NUM_JOINTS), dtype=np.float32)

    # Build .pose file
    dims = PoseHeaderDimensions(width=512, height=512, depth=0)
    comp = PoseHeaderComponent(
        name="POSE_LANDMARKS",
        points=list(JOINT_NAMES),
        limbs=list(LIMBS),
        colors=list(COLORS),
        point_format="XYC",
    )
    header = PoseHeader(version=0.2, dimensions=dims, components=[comp])
    body = NumPyPoseBody(fps=30, data=body_data, confidence=confidence)
    pose = Pose(header=header, body=body)

    buf = io.BytesIO()
    pose.write(buf)
    binary_data = buf.getvalue()

    return {
        "pose_data": base64.b64encode(binary_data).decode("utf-8"),
        "data_format": "binary_base64",
        "frames": num_frames,
        "joints_per_frame": NUM_JOINTS,
        "movements": [m.movement_type.value for m in movements],
    }
```

- [ ] **Step 3: Commit**

```bash
git add backend/pose/signwriting_pose_generator.py backend/pose/local_pose_generator.py
git commit -m "feat: rewrite pose generator with 17 joints, interpolation, and two-handed support"
```

---

## Phase 2: Frontend Architecture Cleanup

### Task 6: Create TranslationContext

**Files:**
- Create: `frontend/src/contexts/TranslationContext.tsx`
- Modify: `frontend/src/services/ApiService.ts`

- [ ] **Step 1: Add AbortSignal support to ApiService**

Replace the full content of `frontend/src/services/ApiService.ts`:

```typescript
import axios from 'axios';
import { API_ENDPOINTS } from '../config';

/* =========================
   Types
========================= */

export interface HealthResponse {
  status: 'ready' | 'loading';
  models: { whisper: boolean; signwriting: boolean };
}

export interface TranscribeResponse {
  text: string;
  detected_language?: string;
}

export interface SimplifyTextResponse {
  simplified_text: string;
  warning?: string;
}

export interface TranslateSignWritingResponse {
  signwriting: string;
}

export interface GeneratePoseResponse {
  pose_data: string;
  data_format: string;
  frames?: number;
  joints_per_frame?: number;
  movements?: string[];
}

export interface ApiError {
  error: string;
  code: string;
  stage: string;
}

/* =========================
   API Service
========================= */

const ApiService = {
  async checkHealth(): Promise<HealthResponse> {
    const response = await axios.get<HealthResponse>(API_ENDPOINTS.HEALTH);
    return response.data;
  },

  async transcribe(audioBlob: Blob, language?: string, signal?: AbortSignal): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    if (language) {
      formData.append('language', language);
    }
    const response = await axios.post<TranscribeResponse>(
      API_ENDPOINTS.TRANSCRIBE,
      formData,
      { signal },
    );
    return response.data;
  },

  async simplifyText(text: string, signal?: AbortSignal): Promise<SimplifyTextResponse> {
    const response = await axios.post<SimplifyTextResponse>(
      API_ENDPOINTS.SIMPLIFY_TEXT,
      { text },
      { signal },
    );
    return response.data;
  },

  async translateSignWriting(text: string, signal?: AbortSignal): Promise<TranslateSignWritingResponse> {
    const response = await axios.post<TranslateSignWritingResponse>(
      API_ENDPOINTS.TRANSLATE_SIGNWRITING,
      { text },
      { signal },
    );
    return response.data;
  },

  async generatePose(signwriting: string, signal?: AbortSignal): Promise<GeneratePoseResponse> {
    const response = await axios.post<GeneratePoseResponse>(
      API_ENDPOINTS.GENERATE_POSE,
      { signwriting },
      { signal },
    );
    return response.data;
  },
};

export default ApiService;
```

- [ ] **Step 2: Create TranslationContext**

Create `frontend/src/contexts/TranslationContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import ApiService from '../services/ApiService';
import { useToast } from './ToastContext';
import { useTranslationHistory } from '../hooks/useTranslationHistory';
import { usePerformanceMetrics } from '../hooks/usePerformanceMetrics';

/* =========================
   Types
========================= */

interface LoadingStates {
  transcribing: boolean;
  simplifying: boolean;
  translating: boolean;
  generatingSigns: boolean;
  generatingAnimation: boolean;
}

interface StageErrors {
  transcribe?: string;
  simplify?: string;
  translate?: string;
  pose?: string;
}

type PipelineStatus = 'idle' | 'running' | 'complete' | 'partial-error';

interface TranslationContextValue {
  inputText: string;
  setInputText: (text: string) => void;
  transcription: string;
  signWriting: string[];
  poseFile: Blob | null;
  loading: LoadingStates;
  errors: StageErrors;
  pipelineStatus: PipelineStatus;
  simplifyEnabled: boolean;
  setSimplifyEnabled: (v: boolean) => void;
  inputLanguage: string;
  setInputLanguage: (lang: string) => void;
  triggerTranslation: (text: string) => Promise<void>;
  handleRecordComplete: (audioBlob: Blob) => Promise<void>;
  handleSimplifyAndTranslate: () => Promise<{ original: string; simplified: string } | null>;
  cancelTranslation: () => void;
  retryStage: (stage: keyof StageErrors) => void;
  history: ReturnType<typeof useTranslationHistory>['history'];
  addHistoryEntry: ReturnType<typeof useTranslationHistory>['addEntry'];
  clearHistory: ReturnType<typeof useTranslationHistory>['clearHistory'];
  metrics: ReturnType<typeof usePerformanceMetrics>['metrics'];
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

/* =========================
   Provider
========================= */

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputText, setInputText] = useState('');
  const [transcription, setTranscription] = useState('');
  const [signWriting, setSignWriting] = useState<string[]>([]);
  const [poseFile, setPoseFile] = useState<Blob | null>(null);
  const [simplifyEnabled, setSimplifyEnabled] = useState(false);
  const [inputLanguage, setInputLanguage] = useState('auto');
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus>('idle');

  const [loading, setLoading] = useState<LoadingStates>({
    transcribing: false,
    simplifying: false,
    translating: false,
    generatingSigns: false,
    generatingAnimation: false,
  });

  const [errors, setErrors] = useState<StageErrors>({});

  const abortRef = useRef<AbortController | null>(null);
  const lastTextRef = useRef<string>('');

  const { addToast } = useToast();
  const { history, addEntry: addHistoryEntry, clearHistory } = useTranslationHistory();
  const { metrics, startTimer, endTimer, setPipelineTime } = usePerformanceMetrics();

  const setLoadingField = useCallback((field: keyof LoadingStates, value: boolean) => {
    setLoading(prev => ({ ...prev, [field]: value }));
  }, []);

  const setErrorField = useCallback((field: keyof StageErrors, value: string | undefined) => {
    setErrors(prev => ({ ...prev, [field]: value }));
  }, []);

  const cancelTranslation = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const triggerTranslation = useCallback(async (text: string) => {
    cancelTranslation();
    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    lastTextRef.current = text;
    setTranscription(text);
    setSignWriting([]);
    setPoseFile(null);
    setErrors({});
    setPipelineStatus('running');
    setLoading({
      transcribing: false,
      simplifying: false,
      translating: true,
      generatingSigns: true,
      generatingAnimation: true,
    });

    const pipelineStart = performance.now();
    let hasError = false;

    try {
      let textToTranslate = text;

      // Optional simplification
      if (simplifyEnabled) {
        setLoadingField('simplifying', true);
        try {
          startTimer('simplify');
          const res = await ApiService.simplifyText(text, signal);
          endTimer('simplify');
          textToTranslate = res.simplified_text || text;
          if (res.warning) {
            addToast(res.warning, 'info', 3000);
          }
        } catch (err) {
          if (signal.aborted) return;
          setErrorField('simplify', 'Simplification failed, using original text');
          hasError = true;
        } finally {
          setLoadingField('simplifying', false);
        }
      }

      if (signal.aborted) return;

      // Translate to SignWriting
      try {
        startTimer('translate');
        const translateRes = await ApiService.translateSignWriting(textToTranslate, signal);
        endTimer('translate');
        const rawFsw = translateRes.signwriting || '';
        const fswTokens = rawFsw.trim().split(/\s+/).filter(t => t.length > 0);
        setSignWriting(fswTokens);
        setLoadingField('generatingSigns', false);
        addHistoryEntry(text, fswTokens);

        if (signal.aborted) return;

        // Generate pose
        if (fswTokens.length > 0) {
          try {
            startTimer('pose');
            const poseRes = await ApiService.generatePose(fswTokens.join(' '), signal);
            endTimer('pose');
            const { pose_data, data_format } = poseRes;
            if (data_format === 'binary_base64' && pose_data) {
              const binary = atob(pose_data);
              const bytes = new Uint8Array(binary.length);
              for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
              }
              setPoseFile(new Blob([bytes], { type: 'application/octet-stream' }));
            }
          } catch (err) {
            if (signal.aborted) return;
            setErrorField('pose', 'Animation generation failed');
            hasError = true;
          }
        }
      } catch (err) {
        if (signal.aborted) return;
        setErrorField('translate', 'SignWriting translation failed');
        hasError = true;
      }

      setLoadingField('generatingAnimation', false);
      setPipelineTime(Math.round(performance.now() - pipelineStart));
      setPipelineStatus(hasError ? 'partial-error' : 'complete');
      if (!hasError) {
        addToast('Translation complete', 'success', 2000);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setPipelineStatus('partial-error');
    } finally {
      setLoading({
        transcribing: false,
        simplifying: false,
        translating: false,
        generatingSigns: false,
        generatingAnimation: false,
      });
    }
  }, [simplifyEnabled, cancelTranslation, addToast, addHistoryEntry, startTimer, endTimer, setPipelineTime, setLoadingField, setErrorField]);

  const handleRecordComplete = useCallback(async (audioBlob: Blob) => {
    setLoadingField('transcribing', true);
    setErrors({});
    setInputText('');
    setSignWriting([]);
    setPoseFile(null);
    setTranscription('');

    try {
      startTimer('transcribe');
      const res = await ApiService.transcribe(audioBlob, inputLanguage !== 'auto' ? inputLanguage : undefined);
      endTimer('transcribe');
      const text = res.text || '';
      setInputText(text);
      setLoadingField('transcribing', false);
      addToast('Transcription complete', 'success', 2000);
      await triggerTranslation(text);
    } catch {
      setErrorField('transcribe', 'Transcription failed. Please try again.');
      addToast('Transcription failed', 'error');
      setLoadingField('transcribing', false);
    }
  }, [triggerTranslation, inputLanguage, addToast, startTimer, endTimer, setLoadingField, setErrorField]);

  const handleSimplifyAndTranslate = useCallback(async () => {
    try {
      const res = await ApiService.simplifyText(inputText);
      return { original: inputText, simplified: res.simplified_text || inputText };
    } catch {
      addToast('Failed to simplify text', 'error');
      return null;
    }
  }, [inputText, addToast]);

  const retryStage = useCallback((stage: keyof StageErrors) => {
    setErrorField(stage, undefined);
    if (stage === 'translate' || stage === 'simplify') {
      triggerTranslation(lastTextRef.current);
    } else if (stage === 'pose' && signWriting.length > 0) {
      // Retry just pose generation
      (async () => {
        setLoadingField('generatingAnimation', true);
        try {
          const poseRes = await ApiService.generatePose(signWriting.join(' '));
          const { pose_data, data_format } = poseRes;
          if (data_format === 'binary_base64' && pose_data) {
            const binary = atob(pose_data);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            setPoseFile(new Blob([bytes], { type: 'application/octet-stream' }));
          }
          setPipelineStatus('complete');
        } catch {
          setErrorField('pose', 'Animation generation failed');
        } finally {
          setLoadingField('generatingAnimation', false);
        }
      })();
    }
  }, [signWriting, triggerTranslation, setLoadingField, setErrorField]);

  return (
    <TranslationContext.Provider
      value={{
        inputText, setInputText,
        transcription, signWriting, poseFile,
        loading, errors, pipelineStatus,
        simplifyEnabled, setSimplifyEnabled,
        inputLanguage, setInputLanguage,
        triggerTranslation, handleRecordComplete,
        handleSimplifyAndTranslate, cancelTranslation, retryStage,
        history, addHistoryEntry, clearHistory,
        metrics,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/ApiService.ts frontend/src/contexts/TranslationContext.tsx
git commit -m "feat: add TranslationContext with per-stage errors, abort support, and retry"
```

---

### Task 7: Create PanelContext

**Files:**
- Create: `frontend/src/contexts/PanelContext.tsx`
- Create: `frontend/src/components/PanelRenderer.tsx`

- [ ] **Step 1: Create PanelContext**

Create `frontend/src/contexts/PanelContext.tsx`:

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

export type PanelName =
  | 'history'
  | 'favorites'
  | 'settings'
  | 'phraseBook'
  | 'learningMode'
  | 'onboarding'
  | 'accessibility'
  | null;

interface PanelContextValue {
  activePanel: PanelName;
  openPanel: (name: NonNullable<PanelName>) => void;
  closePanel: () => void;
  togglePanel: (name: NonNullable<PanelName>) => void;
}

const PanelContext = createContext<PanelContextValue | null>(null);

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<PanelName>(null);

  const openPanel = useCallback((name: NonNullable<PanelName>) => {
    setActivePanel(name);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((name: NonNullable<PanelName>) => {
    setActivePanel(prev => (prev === name ? null : name));
  }, []);

  return (
    <PanelContext.Provider value={{ activePanel, openPanel, closePanel, togglePanel }}>
      {children}
    </PanelContext.Provider>
  );
};

export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error('usePanel must be used within PanelProvider');
  return ctx;
}
```

- [ ] **Step 2: Create PanelRenderer**

Create `frontend/src/components/PanelRenderer.tsx`:

```tsx
import React from 'react';
import { usePanel } from '../contexts/PanelContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../contexts/ThemeContext';
import HistoryPanel from './HistoryPanel';
import FavoritesPanel from './FavoritesPanel';
import SettingsPanel from './SettingsPanel';
import PhraseBook from './PhraseBook';
import LearningMode from './LearningMode';

const PanelRenderer: React.FC = () => {
  const { activePanel, closePanel } = usePanel();
  const { inputText, setInputText, signWriting, history, clearHistory, triggerTranslation } = useTranslation();
  const { favorites, removeFavorite } = useFavorites();
  const { settings, updateSettings, resetSettings } = useSettings();
  const { theme, setTheme } = useTheme();

  if (!activePanel) return null;

  switch (activePanel) {
    case 'history':
      return (
        <HistoryPanel
          history={history}
          onReplay={(entry) => {
            setInputText(entry.inputText);
            closePanel();
          }}
          onClear={clearHistory}
          onClose={closePanel}
        />
      );

    case 'favorites':
      return (
        <FavoritesPanel
          favorites={favorites}
          onReplay={(entry) => {
            setInputText(entry.text);
            closePanel();
          }}
          onRemove={removeFavorite}
          onClose={closePanel}
        />
      );

    case 'settings':
      return (
        <SettingsPanel
          settings={settings}
          onUpdate={updateSettings}
          onReset={resetSettings}
          onClose={closePanel}
          currentTheme={theme}
          onThemeChange={(t) => setTheme(t as 'light' | 'dark' | 'high-contrast')}
        />
      );

    case 'phraseBook':
      return (
        <PhraseBook
          onSelectPhrase={(text) => {
            setInputText(text);
            triggerTranslation(text);
            closePanel();
          }}
          onClose={closePanel}
        />
      );

    case 'learningMode':
      if (signWriting.length === 0) return null;
      return (
        <LearningMode
          signWriting={signWriting}
          inputText={inputText}
          onClose={closePanel}
        />
      );

    default:
      return null;
  }
};

export default PanelRenderer;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/contexts/PanelContext.tsx frontend/src/components/PanelRenderer.tsx
git commit -m "feat: add PanelContext for single-panel management and PanelRenderer"
```

---

### Task 8: Refactor App.tsx to Use Contexts

**Files:**
- Modify: `frontend/src/pages/App.tsx`
- Modify: `frontend/src/main.tsx`

- [ ] **Step 1: Update main.tsx to wrap with new providers**

Read current `frontend/src/main.tsx` first. Then replace its content:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './pages/App';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { PanelProvider } from './contexts/PanelContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <TranslationProvider>
          <PanelProvider>
            <App />
          </PanelProvider>
        </TranslationProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 2: Slim down App.tsx**

Replace the full content of `frontend/src/pages/App.tsx`:

```tsx
import React, { useState, useCallback } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { usePanel } from '../contexts/PanelContext';
import { useFavorites } from '../hooks/useFavorites';
import { useSettings } from '../hooks/useSettings';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import ErrorBoundary from '../components/ErrorBoundary';
import Header from '../components/Header';
import InputSection from '../components/InputSection';
import SignWritingSection from '../components/SignWritingSection';
import AnimationSection from '../components/AnimationSection';
import TranscriptionDisplay from '../components/TranscriptionDisplay';
import PipelineProgress from '../components/PipelineProgress';
import PanelRenderer from '../components/PanelRenderer';
import SimplifyChoiceModal from '../components/SimplifyChoiceModal';
import AudioRecorder from '../components/AudioRecorder';
import MetricsOverlay from '../components/MetricsOverlay';
import ToastContainer from '../components/Toast';
import '../index.css';

function App() {
  const translation = useTranslation();
  const { activePanel, closePanel } = usePanel();
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites();
  const { settings } = useSettings();

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSource, setRecordingSource] = useState<'mic' | 'system'>('mic');
  const [showSimplifyModal, setShowSimplifyModal] = useState(false);
  const [simplifiedText, setSimplifiedText] = useState('');
  const [pendingOriginalText, setPendingOriginalText] = useState('');

  const handleSimplifyAndTranslate = useCallback(async () => {
    const result = await translation.handleSimplifyAndTranslate();
    if (result) {
      setSimplifiedText(result.simplified);
      setPendingOriginalText(result.original);
      setShowSimplifyModal(true);
    }
  }, [translation]);

  const handleSimplifyModalSelect = useCallback((choice: 'original' | 'simplified') => {
    setShowSimplifyModal(false);
    const text = choice === 'simplified' ? simplifiedText : pendingOriginalText;
    translation.setInputText(text);
    translation.triggerTranslation(text);
  }, [simplifiedText, pendingOriginalText, translation]);

  const handleToggleFavorite = useCallback(() => {
    if (!translation.inputText.trim() || translation.signWriting.length === 0) return;
    if (isFavorite(translation.inputText)) {
      const fav = favorites.find(f => f.text === translation.inputText);
      if (fav) removeFavorite(fav.id);
    } else {
      addFavorite(translation.inputText, translation.signWriting);
    }
  }, [translation.inputText, translation.signWriting, isFavorite, addFavorite, removeFavorite, favorites]);

  useKeyboardShortcuts({
    onTranslate: translation.inputText.trim() ? () => {
      if (translation.simplifyEnabled) handleSimplifyAndTranslate();
      else translation.triggerTranslation(translation.inputText);
    } : undefined,
    onRecord: () => setIsRecording(prev => !prev),
    onEscape: () => {
      if (isRecording) setIsRecording(false);
      else if (showSimplifyModal) setShowSimplifyModal(false);
      else if (activePanel) closePanel();
    },
  });

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch { /* ignore */ }
  }, []);

  return (
    <div className="min-h-screen transition-all duration-300">
      <Header />
      <PipelineProgress />

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8" style={{ height: 'calc(100vh - 160px)' }}>
          <ErrorBoundary fallbackMessage="Input section encountered an error">
            <InputSection
              onSimplifyAndTranslate={handleSimplifyAndTranslate}
              onCopy={translation.inputText.trim() ? () => copyToClipboard(translation.inputText, 'Input') : undefined}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="SignWriting section encountered an error">
            <SignWritingSection
              onCopyFSW={translation.signWriting.length > 0 ? () => copyToClipboard(translation.signWriting.join(' '), 'FSW') : undefined}
              onToggleFavorite={translation.signWriting.length > 0 ? handleToggleFavorite : undefined}
              isFavorited={isFavorite(translation.inputText)}
            />
          </ErrorBoundary>

          <ErrorBoundary fallbackMessage="Animation section encountered an error">
            <AnimationSection />
          </ErrorBoundary>
        </div>
        <TranscriptionDisplay
          onCopy={translation.transcription ? () => copyToClipboard(translation.transcription, 'Transcription') : undefined}
        />
        {showSimplifyModal && (
          <SimplifyChoiceModal
            original={pendingOriginalText}
            simplified={simplifiedText}
            onSelect={handleSimplifyModalSelect}
            onClose={() => setShowSimplifyModal(false)}
          />
        )}
      </main>

      {isRecording && (
        <AudioRecorder
          onRecordingComplete={(blob) => {
            setIsRecording(false);
            translation.handleRecordComplete(blob);
          }}
          recordingSource={recordingSource}
          setRecordingSource={setRecordingSource}
          onClose={() => setIsRecording(false)}
        />
      )}

      <PanelRenderer />
      <MetricsOverlay metrics={translation.metrics} visible={settings.showMetrics} />
      <ToastContainer />
    </div>
  );
}

export default App;
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/App.tsx frontend/src/main.tsx
git commit -m "refactor: slim App.tsx from 420 to ~120 lines using TranslationContext and PanelContext"
```

---

## Phase 3: UI Visual Overhaul

### Task 9: New Design Tokens & CSS Foundation

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Replace CSS custom properties with Clarity design system**

Replace the `:root` block and theme blocks in `frontend/src/index.css` (lines 0-98 and onwards). The key changes are:

1. Replace primary blue palette with teal
2. Add amber accent palette
3. Replace glassmorphism `.glass` class with clean card styles
4. Add pipeline stage border colors
5. Add micro-interaction utility classes

Replace the full file content. Start with:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* =============================================
   Clarity Design System — CSS Custom Properties
   ============================================= */

:root {
  /* Primary: Deep Teal */
  --primary-50: #f0fdfa;
  --primary-100: #ccfbf1;
  --primary-200: #99f6e4;
  --primary-300: #5eead4;
  --primary-400: #2dd4bf;
  --primary-500: #14b8a6;
  --primary-600: #0d9488;
  --primary-700: #0f766e;
  --primary-800: #115e59;
  --primary-900: #134e4a;

  /* Accent: Warm Amber */
  --accent-50: #fffbeb;
  --accent-100: #fef3c7;
  --accent-200: #fde68a;
  --accent-300: #fcd34d;
  --accent-400: #fbbf24;
  --accent-500: #f59e0b;
  --accent-600: #d97706;
  --accent-700: #b45309;
  --accent-800: #92400e;
  --accent-900: #78350f;

  /* Neutrals: Slate */
  --secondary-50: #f8fafc;
  --secondary-100: #f1f5f9;
  --secondary-200: #e2e8f0;
  --secondary-300: #cbd5e1;
  --secondary-400: #94a3b8;
  --secondary-500: #64748b;
  --secondary-600: #475569;
  --secondary-700: #334155;
  --secondary-800: #1e293b;
  --secondary-900: #0f172a;

  /* Semantic Colors */
  --success-500: #10b981;
  --success-600: #059669;
  --danger-500: #ef4444;
  --danger-600: #dc2626;
  --warning-500: #f59e0b;
  --warning-600: #d97706;

  /* Light Mode Backgrounds */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --bg-card: #ffffff;

  /* Light Mode Text */
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;

  /* Light Mode Borders */
  --border-primary: #e2e8f0;
  --border-secondary: #f1f5f9;

  /* Pipeline Stage Colors */
  --stage-input: #0d9488;
  --stage-signwriting: #059669;
  --stage-animation: #f59e0b;
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-card: #1e293b;

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --border-primary: #334155;
  --border-secondary: #1e293b;
}

/* High Contrast */
[data-theme="high-contrast"] {
  --bg-primary: #000000;
  --bg-secondary: #111111;
  --bg-tertiary: #222222;
  --bg-card: #111111;

  --text-primary: #ffffff;
  --text-secondary: #e0e0e0;
  --text-muted: #b0b0b0;

  --border-primary: #ffffff;
  --border-secondary: #666666;
}

/* =============================================
   Base Styles
   ============================================= */

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

/* =============================================
   Card System
   ============================================= */

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-input {
  border-left: 3px solid var(--stage-input);
}

.card-signwriting {
  border-left: 3px solid var(--stage-signwriting);
}

.card-animation {
  border-left: 3px solid var(--stage-animation);
}

/* =============================================
   Micro-interactions
   ============================================= */

.btn-press {
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn-press:hover {
  transform: scale(1.03);
}

.btn-press:active {
  transform: scale(0.97);
}

/* Stagger animation for sign appearance */
@keyframes signFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.sign-enter {
  animation: signFadeIn 0.3s ease-out forwards;
}

/* Panel slide-in */
@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.panel-slide-in {
  animation: slideInRight 0.2s ease-out;
}

/* Pulse for active pipeline stage */
@keyframes stagePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.stage-active {
  animation: stagePulse 1.5s ease-in-out infinite;
}

/* Loading spinner */
.loading-spinner {
  border: 2px solid var(--border-primary);
  border-top-color: var(--primary-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* =============================================
   Typography Scale
   ============================================= */

.text-hero { font-size: 2rem; font-weight: 700; line-height: 1.2; }
.text-heading { font-size: 1.25rem; font-weight: 600; line-height: 1.4; }
.text-body { font-size: 1rem; font-weight: 400; line-height: 1.6; }
.text-caption { font-size: 0.875rem; font-weight: 400; line-height: 1.5; }
.text-small { font-size: 0.75rem; font-weight: 500; line-height: 1.4; }

/* =============================================
   Utility: Theme-aware text/bg shortcuts
   ============================================= */

.text-theme-primary { color: var(--text-primary); }
.text-theme-secondary { color: var(--text-secondary); }
.text-theme-muted { color: var(--text-muted); }
.bg-theme-primary { background: var(--bg-primary); }
.bg-theme-secondary { background: var(--bg-secondary); }
.bg-theme-tertiary { background: var(--bg-tertiary); }
.border-theme-primary { border-color: var(--border-primary); }

/* =============================================
   Gradient Accent
   ============================================= */

.gradient-teal {
  background: linear-gradient(135deg, #0d9488, #059669);
}

.gradient-text-teal {
  background: linear-gradient(135deg, #0d9488, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

Note: This replaces the existing full CSS file. The existing theme utility classes (`text-theme-primary`, `bg-theme-secondary`, etc.) are preserved for backward compatibility, but now point to the new Clarity palette. Components will be updated to use the new card classes in subsequent tasks.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: replace CSS with Clarity design system (teal/amber, clean cards, micro-interactions)"
```

---

### Task 10: Redesign Header & Add Toolbar

**Files:**
- Modify: `frontend/src/components/Header.tsx`
- Create: `frontend/src/components/Toolbar.tsx`

- [ ] **Step 1: Simplify Header**

Replace the full content of `frontend/src/components/Header.tsx`:

```tsx
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { usePanel } from '../contexts/PanelContext';
import { useFavorites } from '../hooks/useFavorites';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { openPanel } = usePanel();
  const { favorites } = useFavorites();

  return (
    <header className="border-b border-theme-primary sticky top-0 z-30 bg-theme-primary backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Branding */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-teal rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold gradient-text-teal">VocaSign</h1>
              <p className="text-xs text-theme-muted hidden sm:block">AI-Powered Voice-to-Sign</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* History */}
            <button
              onClick={() => openPanel('history')}
              className="p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-all btn-press"
              aria-label="Translation history"
              title="History"
            >
              <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Favorites */}
            <button
              onClick={() => openPanel('favorites')}
              className="relative p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-all btn-press"
              aria-label="Favorites"
              title="Favorites"
            >
              <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favorites.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {favorites.length > 9 ? '9+' : favorites.length}
                </span>
              )}
            </button>

            {/* Settings */}
            <button
              onClick={() => openPanel('settings')}
              className="p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-all btn-press"
              aria-label="Settings"
              title="Settings"
            >
              <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-all btn-press"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 text-theme-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-theme-secondary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
```

- [ ] **Step 2: Create Toolbar component**

Create `frontend/src/components/Toolbar.tsx`:

```tsx
import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { usePanel } from '../contexts/PanelContext';

const LANGUAGES = [
  { code: 'auto', label: 'Auto-detect' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' },
  { code: 'ar', label: 'Arabic' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ru', label: 'Russian' },
];

const Toolbar: React.FC = () => {
  const { simplifyEnabled, setSimplifyEnabled, inputLanguage, setInputLanguage } = useTranslation();
  const { openPanel } = usePanel();

  return (
    <div className="border-b border-theme-primary bg-theme-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-theme-muted">Language:</label>
            <select
              value={inputLanguage}
              onChange={(e) => setInputLanguage(e.target.value)}
              className="text-sm px-2 py-1 rounded-lg bg-theme-primary border border-theme-primary text-theme-primary focus:outline-none focus:ring-2 focus:ring-teal-500/50 cursor-pointer"
              aria-label="Input language"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          {/* Simplify Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={simplifyEnabled}
                onChange={(e) => setSimplifyEnabled(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors duration-200 ${
                  simplifyEnabled ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
                role="switch"
                aria-checked={simplifyEnabled}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5 ${
                  simplifyEnabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                }`} />
              </div>
            </div>
            <span className="text-sm font-medium text-theme-secondary">Simplify</span>
          </label>

          {/* Phrase Book */}
          <button
            onClick={() => openPanel('phraseBook')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theme-primary border border-theme-primary hover:bg-theme-tertiary transition-all text-sm font-medium text-theme-secondary btn-press"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Phrase Book
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Toolbar);
```

- [ ] **Step 3: Add Toolbar to App.tsx**

In `frontend/src/pages/App.tsx`, add the import after the Header import:

```typescript
import Toolbar from '../components/Toolbar';
```

Add `<Toolbar />` right after `<Header />` in the JSX:

```tsx
<Header />
<Toolbar />
<PipelineProgress />
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Header.tsx frontend/src/components/Toolbar.tsx frontend/src/pages/App.tsx
git commit -m "feat: redesign Header (minimal) and add collapsible Toolbar"
```

---

### Task 11: Update Pipeline Progress to Animated Stepper

**Files:**
- Modify: `frontend/src/components/PipelineProgress.tsx`

- [ ] **Step 1: Redesign PipelineProgress**

Replace the full content of `frontend/src/components/PipelineProgress.tsx`:

```tsx
import React from 'react';
import { useTranslation } from '../contexts/TranslationContext';

interface StepDef {
  key: string;
  label: string;
  icon: React.ReactNode;
}

const STEPS: StepDef[] = [
  {
    key: 'transcribe',
    label: 'Listen',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    key: 'translate',
    label: 'Translate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    key: 'signs',
    label: 'Signs',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    key: 'animate',
    label: 'Animate',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const PipelineProgress: React.FC = () => {
  const { loading, errors, pipelineStatus } = useTranslation();

  const isAnyActive = Object.values(loading).some(Boolean);
  if (!isAnyActive && pipelineStatus === 'idle') return null;

  const getStepState = (key: string): 'idle' | 'active' | 'done' | 'error' => {
    if (errors[key as keyof typeof errors]) return 'error';

    switch (key) {
      case 'transcribe':
        if (loading.transcribing) return 'active';
        if (loading.translating || loading.generatingSigns || loading.generatingAnimation || pipelineStatus === 'complete') return 'done';
        return 'idle';
      case 'translate':
        if (loading.translating) return 'active';
        if (loading.generatingSigns || loading.generatingAnimation || pipelineStatus === 'complete') return 'done';
        return 'idle';
      case 'signs':
        if (loading.generatingSigns) return 'active';
        if (loading.generatingAnimation || pipelineStatus === 'complete') return 'done';
        return 'idle';
      case 'animate':
        if (loading.generatingAnimation) return 'active';
        if (pipelineStatus === 'complete' || pipelineStatus === 'partial-error') return 'done';
        return 'idle';
      default:
        return 'idle';
    }
  };

  return (
    <div className="bg-theme-secondary border-b border-theme-primary">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {STEPS.map((step, i) => {
            const state = getStepState(step.key);
            return (
              <React.Fragment key={step.key}>
                {/* Step */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      state === 'active'
                        ? 'bg-teal-500 text-white stage-active'
                        : state === 'done'
                        ? 'bg-teal-500 text-white'
                        : state === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-theme-tertiary text-theme-muted'
                    }`}
                  >
                    {state === 'done' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : state === 'error' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${
                    state === 'active' ? 'text-teal-600' : state === 'done' ? 'text-teal-600' : 'text-theme-muted'
                  }`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 h-0.5 rounded-full bg-theme-tertiary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        getStepState(STEPS[i + 1].key) !== 'idle' ? 'bg-teal-500 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(PipelineProgress);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/PipelineProgress.tsx
git commit -m "feat: redesign PipelineProgress as animated stepper with stage icons"
```

---

### Task 12: Update Component Card Styles

**Files:**
- Modify: `frontend/src/components/InputSection.tsx`
- Modify: `frontend/src/components/SignWritingSection.tsx`
- Modify: `frontend/src/components/AnimationSection.tsx`

This task updates the three main content sections to use the new card system with pipeline stage border colors and consume from TranslationContext. The exact changes depend on the current component markup, but the pattern is:

- [ ] **Step 1: Update InputSection to use TranslationContext and new card style**

In `frontend/src/components/InputSection.tsx`:

- Replace all prop-drilled state with `useTranslation()` hook
- Change the outer `<section>` wrapper to use `className="card card-input xl:col-span-4 flex flex-col"`
- Remove props that now come from context (`inputText`, `setInputText`, `isTranscribing`, `isRecording`, `triggerTranslation`, `simplifyText`, `isTranslating`)
- Keep `onSimplifyAndTranslate`, `onCopy`, `onOpenPhraseBook` as props since they involve App-level coordination

Update the component signature:

```tsx
import { useTranslation } from '../contexts/TranslationContext';
import { usePanel } from '../contexts/PanelContext';

interface InputSectionProps {
  onSimplifyAndTranslate: () => void;
  onCopy?: () => void;
}

const InputSection: React.FC<InputSectionProps> = ({ onSimplifyAndTranslate, onCopy }) => {
  const { inputText, setInputText, loading, simplifyEnabled, triggerTranslation } = useTranslation();
  const { openPanel } = usePanel();
  // ... rest of component using context values instead of props
```

Change the outer wrapper class to: `"card card-input xl:col-span-4 flex flex-col"`

- [ ] **Step 2: Update SignWritingSection to use TranslationContext and new card style**

In `frontend/src/components/SignWritingSection.tsx`:

- Replace prop-drilled `signWriting` and `isGeneratingSigns` with `useTranslation()`
- Change outer wrapper class to: `"card card-signwriting xl:col-span-4 flex flex-col"`
- Add stagger animation to signs: each sign gets `style={{ animationDelay: \`${i * 50}ms\` }}` with class `sign-enter`

- [ ] **Step 3: Update AnimationSection to use TranslationContext and new card style**

In `frontend/src/components/AnimationSection.tsx`:

- Replace prop-drilled `poseFile` and `isGeneratingAnimation` with `useTranslation()`
- Change outer wrapper class to: `"card card-animation xl:col-span-4 flex flex-col"`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/InputSection.tsx frontend/src/components/SignWritingSection.tsx frontend/src/components/AnimationSection.tsx
git commit -m "feat: update main sections with Clarity card styles and TranslationContext"
```

---

## Phase 4: New Features

### Task 13: Onboarding Flow

**Files:**
- Create: `frontend/src/hooks/useOnboarding.ts`
- Create: `frontend/src/components/Onboarding.tsx`
- Modify: `frontend/src/pages/App.tsx`

- [ ] **Step 1: Create useOnboarding hook**

Create `frontend/src/hooks/useOnboarding.ts`:

```typescript
import { useState, useCallback } from 'react';

const STORAGE_KEY = 'vocasign_onboarding_complete';

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsComplete(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsComplete(false);
  }, []);

  return { isComplete, complete, reset };
}
```

- [ ] **Step 2: Create Onboarding component**

Create `frontend/src/components/Onboarding.tsx`:

```tsx
import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: 'Speak or Type',
    description: 'Use your microphone or type any text you want translated into sign language.',
    icon: (
      <svg className="w-16 h-16 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    color: 'teal',
  },
  {
    title: 'See SignWriting',
    description: 'Your words are translated into SignWriting notation — a visual writing system for sign language.',
    icon: (
      <svg className="w-16 h-16 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    title: 'Watch the Animation',
    description: 'See a 3D skeleton animate the signs — showing you exactly how to sign each word.',
    icon: (
      <svg className="w-16 h-16 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'amber',
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-md w-full mx-4 text-center p-8">
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onComplete}
            className="text-sm text-theme-muted hover:text-theme-secondary transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-theme-secondary flex items-center justify-center">
            {step.icon}
          </div>
        </div>

        {/* Content */}
        <h2 className="text-heading text-theme-primary mb-3">{step.title}</h2>
        <p className="text-body text-theme-secondary mb-8">{step.description}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentStep ? 'bg-teal-500 w-6' : i < currentStep ? 'bg-teal-300' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-xl gradient-teal text-white font-semibold btn-press transition-all hover:shadow-lg"
        >
          {currentStep < STEPS.length - 1 ? 'Next' : 'Get Started'}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
```

- [ ] **Step 3: Wire onboarding into App.tsx**

In `frontend/src/pages/App.tsx`, add imports:

```typescript
import Onboarding from '../components/Onboarding';
import { useOnboarding } from '../hooks/useOnboarding';
```

Inside the `App` function, add:

```typescript
const { isComplete: onboardingComplete, complete: completeOnboarding } = useOnboarding();
```

Add before the closing `</div>` of the return JSX:

```tsx
{!onboardingComplete && <Onboarding onComplete={completeOnboarding} />}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useOnboarding.ts frontend/src/components/Onboarding.tsx frontend/src/pages/App.tsx
git commit -m "feat: add 3-step onboarding flow for first-time users"
```

---

### Task 14: Export Controls (Animation & SignWriting)

**Files:**
- Create: `frontend/src/components/ExportControls.tsx`
- Modify: `frontend/src/components/AnimationSection.tsx`
- Modify: `frontend/src/components/SignWritingSection.tsx`

- [ ] **Step 1: Create ExportControls component**

Create `frontend/src/components/ExportControls.tsx`:

```tsx
import React, { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface ExportControlsProps {
  /** The blob to download (pose file for animation, or rendered image for signs) */
  blob?: Blob | null;
  /** File name for download */
  fileName: string;
  /** Label for the button */
  label: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({ blob, fileName, label }) => {
  const { addToast } = useToast();

  const handleDownload = useCallback(() => {
    if (!blob) return;

    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`${label} downloaded`, 'success', 2000);
    } catch {
      addToast('Download failed', 'error');
    }
  }, [blob, fileName, label, addToast]);

  if (!blob) return null;

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theme-secondary hover:bg-theme-tertiary border border-theme-primary transition-all text-sm text-theme-secondary btn-press"
      title={`Download ${label}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  );
};

export default ExportControls;
```

- [ ] **Step 2: Add ExportControls to AnimationSection**

In `frontend/src/components/AnimationSection.tsx`, add import:

```typescript
import ExportControls from './ExportControls';
```

Add after the PoseViewer component in the JSX (inside the card, at the bottom):

```tsx
<ExportControls blob={poseFile} fileName="vocasign-animation.pose" label="Animation" />
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/ExportControls.tsx frontend/src/components/AnimationSection.tsx
git commit -m "feat: add export/download controls for animation files"
```

---

### Task 15: Streaming Recorder Hook

**Files:**
- Create: `frontend/src/hooks/useStreamingRecorder.ts`
- Modify: `frontend/src/hooks/useAudioRecorder.ts`

- [ ] **Step 1: Add onChunk callback to useAudioRecorder**

In `frontend/src/hooks/useAudioRecorder.ts`, add an optional `onChunk` parameter to the hook and modify the MediaRecorder setup to emit chunks at a configurable interval:

Add to the hook's options parameter:

```typescript
export interface AudioRecorderOptions {
  onRecordingComplete: (blob: Blob) => void;
  onChunk?: (blob: Blob) => void;
  chunkIntervalMs?: number;
}
```

In the MediaRecorder `ondataavailable` handler, call `onChunk` if provided for each intermediate chunk.

- [ ] **Step 2: Create useStreamingRecorder**

Create `frontend/src/hooks/useStreamingRecorder.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import ApiService from '../services/ApiService';

interface StreamingRecorderOptions {
  language?: string;
  onTranscriptionUpdate: (text: string) => void;
  onSentenceComplete: (sentence: string) => void;
  chunkDurationMs?: number;
}

export function useStreamingRecorder({
  language,
  onTranscriptionUpdate,
  onSentenceComplete,
  chunkDurationMs = 3000,
}: StreamingRecorderOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const accumulatedTextRef = useRef('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processChunk = useCallback(async (blob: Blob) => {
    if (blob.size < 1000) return; // Skip tiny chunks

    try {
      const res = await ApiService.transcribe(blob, language !== 'auto' ? language : undefined);
      const newText = res.text?.trim();
      if (!newText) return;

      accumulatedTextRef.current += (accumulatedTextRef.current ? ' ' : '') + newText;
      onTranscriptionUpdate(accumulatedTextRef.current);

      // Check for sentence boundary
      if (/[.!?]$/.test(newText)) {
        onSentenceComplete(accumulatedTextRef.current);
        accumulatedTextRef.current = '';
      }
    } catch {
      // Ignore chunk errors — next chunk will pick up
    }
  }, [language, onTranscriptionUpdate, onSentenceComplete]);

  const startStreaming = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      mediaRecorderRef.current = recorder;
      accumulatedTextRef.current = '';

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          processChunk(e.data);
        }
      };

      recorder.start(chunkDurationMs);
      setIsStreaming(true);
    } catch {
      setIsStreaming(false);
    }
  }, [chunkDurationMs, processChunk]);

  const stopStreaming = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
    setIsStreaming(false);

    // Final sentence if there's accumulated text
    if (accumulatedTextRef.current.trim()) {
      onSentenceComplete(accumulatedTextRef.current);
      accumulatedTextRef.current = '';
    }
  }, [onSentenceComplete]);

  return { isStreaming, startStreaming, stopStreaming };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useStreamingRecorder.ts frontend/src/hooks/useAudioRecorder.ts
git commit -m "feat: add streaming recorder hook for real-time chunked transcription"
```

---

### Task 16: Enhanced Learning Mode (Practice + Breakdown)

**Files:**
- Create: `frontend/src/components/PracticeMode.tsx`
- Create: `frontend/src/components/SignBreakdown.tsx`
- Modify: `frontend/src/components/LearningMode.tsx`

- [ ] **Step 1: Create SignBreakdown component**

Create `frontend/src/components/SignBreakdown.tsx`:

```tsx
import React from 'react';

interface SignBreakdownProps {
  fswToken: string;
}

function parseSymbolDescriptions(fsw: string): { id: string; description: string }[] {
  const symbols: { id: string; description: string }[] = [];
  const pattern = /S([0-9a-fA-F]{5})/gi;
  let match;

  while ((match = pattern.exec(fsw)) !== null) {
    const hex = match[1];
    const symId = parseInt(hex.slice(0, 3), 16);
    let desc = 'Unknown symbol';

    if (symId >= 0x100 && symId <= 0x204) desc = 'Hand shape';
    else if (symId >= 0x205 && symId <= 0x214) desc = 'Straight movement';
    else if (symId >= 0x215 && symId <= 0x21D) desc = 'Curved movement';
    else if (symId >= 0x21E && symId <= 0x22F) desc = 'Diagonal movement';
    else if (symId >= 0x230 && symId <= 0x245) desc = 'Floor plane movement';
    else if (symId >= 0x246 && symId <= 0x260) desc = 'Rotation';
    else if (symId >= 0x261 && symId <= 0x27F) desc = 'Finger/wrist movement';
    else if (symId >= 0x300 && symId <= 0x36D) desc = 'Contact/touch';
    else if (symId >= 0x370 && symId <= 0x37E) desc = 'Head/face';
    else if (symId >= 0x380 && symId <= 0x3FF) desc = 'Body';

    symbols.push({ id: `S${hex}`, description: desc });
  }

  return symbols;
}

const SignBreakdown: React.FC<SignBreakdownProps> = ({ fswToken }) => {
  const symbols = parseSymbolDescriptions(fswToken);

  if (symbols.length === 0) {
    return <p className="text-sm text-theme-muted">No symbols found in this token.</p>;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-theme-primary">Symbol Breakdown</h4>
      <div className="space-y-1">
        {symbols.map((sym, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-theme-secondary">
            <code className="text-xs font-mono text-teal-600">{sym.id}</code>
            <span className="text-sm text-theme-secondary">{sym.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignBreakdown;
```

- [ ] **Step 2: Create PracticeMode component**

Create `frontend/src/components/PracticeMode.tsx`:

```tsx
import React, { useState, useCallback, useMemo } from 'react';

interface PracticeModeProps {
  /** Array of { text, signWriting } entries from history/favorites */
  entries: Array<{ text: string; signWriting: string[] }>;
  onClose: () => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ entries, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const questions = useMemo(() => {
    return shuffleArray(entries).slice(0, 10); // Max 10 questions per session
  }, [entries]);

  const currentQuestion = questions[currentIndex];

  const options = useMemo(() => {
    if (!currentQuestion) return [];
    const wrong = entries
      .filter(e => e.text !== currentQuestion.text)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(e => e.text);
    return shuffleArray([currentQuestion.text, ...wrong]);
  }, [currentQuestion, entries]);

  const handleAnswer = useCallback((answer: string) => {
    if (selectedAnswer) return; // Already answered
    setSelectedAnswer(answer);
    setScore(prev => ({
      correct: prev.correct + (answer === currentQuestion.text ? 1 : 0),
      total: prev.total + 1,
    }));
  }, [selectedAnswer, currentQuestion]);

  const handleNext = useCallback(() => {
    setSelectedAnswer(null);
    setCurrentIndex(prev => prev + 1);
  }, []);

  if (entries.length < 4) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card max-w-md w-full mx-4 p-8 text-center">
          <h2 className="text-heading text-theme-primary mb-4">Not Enough Data</h2>
          <p className="text-body text-theme-secondary mb-6">
            Translate at least 4 phrases to unlock Practice Mode.
          </p>
          <button onClick={onClose} className="px-6 py-2 rounded-xl gradient-teal text-white font-semibold btn-press">
            Got it
          </button>
        </div>
      </div>
    );
  }

  if (currentIndex >= questions.length) {
    const percentage = Math.round((score.correct / score.total) * 100);
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="card max-w-md w-full mx-4 p-8 text-center">
          <h2 className="text-heading text-theme-primary mb-2">Practice Complete!</h2>
          <p className="text-4xl font-bold gradient-text-teal mb-2">{percentage}%</p>
          <p className="text-body text-theme-secondary mb-6">
            {score.correct} of {score.total} correct
          </p>
          <button onClick={onClose} className="px-6 py-2 rounded-xl gradient-teal text-white font-semibold btn-press">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-lg w-full mx-4 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-theme-muted">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-sm font-medium text-teal-600">
            Score: {score.correct}/{score.total}
          </span>
          <button onClick={onClose} className="text-theme-muted hover:text-theme-primary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Question: Show SignWriting */}
        <div className="text-center mb-6">
          <p className="text-sm text-theme-muted mb-3">What does this sign mean?</p>
          <div className="text-2xl font-mono text-theme-primary bg-theme-secondary rounded-xl p-4">
            {currentQuestion.signWriting.join(' ')}
          </div>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {options.map((option) => {
            let optionClass = 'card hover:bg-theme-tertiary cursor-pointer text-center py-3';
            if (selectedAnswer) {
              if (option === currentQuestion.text) {
                optionClass = 'card bg-green-50 border-green-500 text-center py-3';
              } else if (option === selectedAnswer) {
                optionClass = 'card bg-red-50 border-red-500 text-center py-3';
              }
            }
            return (
              <button
                key={option}
                onClick={() => handleAnswer(option)}
                className={optionClass}
                disabled={!!selectedAnswer}
              >
                <span className="text-sm font-medium">{option}</span>
              </button>
            );
          })}
        </div>

        {/* Next button */}
        {selectedAnswer && (
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-xl gradient-teal text-white font-semibold btn-press"
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
          </button>
        )}
      </div>
    </div>
  );
};

export default PracticeMode;
```

- [ ] **Step 3: Update LearningMode to include breakdown and practice link**

In `frontend/src/components/LearningMode.tsx`, add imports for SignBreakdown:

```typescript
import SignBreakdown from './SignBreakdown';
```

Inside the learning mode component, for each sign being displayed, add a collapsible breakdown section:

```tsx
{/* After the sign display */}
<details className="mt-3">
  <summary className="text-sm text-teal-600 cursor-pointer hover:underline">
    Show symbol breakdown
  </summary>
  <div className="mt-2">
    <SignBreakdown fswToken={currentSign} />
  </div>
</details>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/SignBreakdown.tsx frontend/src/components/PracticeMode.tsx frontend/src/components/LearningMode.tsx
git commit -m "feat: add practice mode quiz, sign breakdown, and enhanced learning mode"
```

---

### Task 17: Accessibility Help Panel

**Files:**
- Create: `frontend/src/components/AccessibilityHelp.tsx`
- Modify: `frontend/src/components/PanelRenderer.tsx`

- [ ] **Step 1: Create AccessibilityHelp component**

Create `frontend/src/components/AccessibilityHelp.tsx`:

```tsx
import React from 'react';

interface AccessibilityHelpProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl + Enter', action: 'Translate current text' },
  { keys: 'Ctrl + R', action: 'Start/stop recording' },
  { keys: 'Escape', action: 'Close active panel' },
];

const AccessibilityHelp: React.FC<AccessibilityHelpProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card max-w-lg w-full mx-4 mb-0 sm:mb-0 rounded-b-none sm:rounded-2xl p-6 panel-slide-in max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-heading text-theme-primary">Keyboard Shortcuts & Help</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-theme-tertiary transition-colors"
            aria-label="Close help panel"
          >
            <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Shortcuts table */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            {SHORTCUTS.map((shortcut) => (
              <div key={shortcut.keys} className="flex items-center justify-between px-3 py-2 rounded-lg bg-theme-secondary">
                <kbd className="px-2 py-1 rounded bg-theme-tertiary text-xs font-mono text-theme-primary">
                  {shortcut.keys}
                </kbd>
                <span className="text-sm text-theme-secondary">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">How VocaSign Works</h3>
          <ol className="space-y-3 text-sm text-theme-secondary">
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full gradient-teal text-white text-xs flex items-center justify-center flex-shrink-0">1</span>
              <span><strong>Input:</strong> Speak into your microphone or type text in the input area.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center flex-shrink-0">2</span>
              <span><strong>Translation:</strong> Your text is translated into SignWriting (FSW) notation for American Sign Language.</span>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center flex-shrink-0">3</span>
              <span><strong>Animation:</strong> A 3D skeleton animation shows you how to sign each word.</span>
            </li>
          </ol>
        </div>

        {/* Screen reader tips */}
        <div>
          <h3 className="text-sm font-semibold text-theme-secondary mb-3">Accessibility</h3>
          <ul className="space-y-2 text-sm text-theme-secondary">
            <li>All buttons and controls have descriptive labels for screen readers.</li>
            <li>Use Tab to navigate between controls, Enter/Space to activate.</li>
            <li>High contrast theme available in Settings for improved visibility.</li>
            <li>Animation playback can be controlled with on-screen buttons.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AccessibilityHelp;
```

- [ ] **Step 2: Add accessibility panel to PanelRenderer**

In `frontend/src/components/PanelRenderer.tsx`, add import:

```typescript
import AccessibilityHelp from './AccessibilityHelp';
```

Add a new case in the switch statement:

```tsx
case 'accessibility':
  return <AccessibilityHelp onClose={closePanel} />;
```

- [ ] **Step 3: Add help button to Header**

In `frontend/src/components/Header.tsx`, add a help button before the Settings button in the controls section:

```tsx
{/* Help */}
<button
  onClick={() => openPanel('accessibility')}
  className="p-2 rounded-lg bg-theme-secondary hover:bg-theme-tertiary transition-all btn-press"
  aria-label="Help and keyboard shortcuts"
  title="Help"
>
  <svg className="w-5 h-5 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
</button>
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/AccessibilityHelp.tsx frontend/src/components/PanelRenderer.tsx frontend/src/components/Header.tsx
git commit -m "feat: add accessibility help panel with shortcuts and usage guide"
```

---

## Phase 5: Polish & Integration

### Task 18: Update Panel Components with New Card Styles

**Files:**
- Modify: `frontend/src/components/HistoryPanel.tsx`
- Modify: `frontend/src/components/FavoritesPanel.tsx`
- Modify: `frontend/src/components/SettingsPanel.tsx`
- Modify: `frontend/src/components/SimplifyChoiceModal.tsx`

- [ ] **Step 1: Update all panel/modal wrappers**

For each panel component, apply these consistent changes:

1. Replace `glass` class with `card` class
2. Add `panel-slide-in` class for slide-in animation
3. Replace any blue-themed colors (`blue-500`, `primary-500`) with teal (`teal-500`)
4. Use `bg-black/60 backdrop-blur-sm` for overlay backgrounds
5. Ensure close button has `aria-label`
6. Use `btn-press` class on interactive buttons

The exact changes per file:

**HistoryPanel.tsx:** Outer overlay: `"fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/60 backdrop-blur-sm"`. Inner panel: `"card max-w-md w-full panel-slide-in p-6 max-h-[80vh] overflow-y-auto"`.

**FavoritesPanel.tsx:** Same pattern as HistoryPanel.

**SettingsPanel.tsx:** Same pattern. Replace any gradient references from blue/purple to teal/emerald.

**SimplifyChoiceModal.tsx:** Center modal: `"card max-w-lg w-full mx-4 p-6"`. Buttons use `gradient-teal` for primary action.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/HistoryPanel.tsx frontend/src/components/FavoritesPanel.tsx frontend/src/components/SettingsPanel.tsx frontend/src/components/SimplifyChoiceModal.tsx
git commit -m "feat: update all panels and modals with Clarity card styles and animations"
```

---

### Task 19: Empty States for Main Sections

**Files:**
- Modify: `frontend/src/components/InputSection.tsx`
- Modify: `frontend/src/components/SignWritingSection.tsx`
- Modify: `frontend/src/components/AnimationSection.tsx`

- [ ] **Step 1: Add themed empty states**

For each section, when there is no content to display, render a beautiful empty state using the stage color:

**InputSection** (when no text): Already has a text area, so the empty state is the placeholder text. Update placeholder to: `"Speak or type anything to translate into sign language..."` with teal-colored microphone hint.

**SignWritingSection** (when `signWriting.length === 0` and not loading):
```tsx
<div className="flex flex-col items-center justify-center h-full py-12">
  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  </div>
  <p className="text-sm font-medium text-theme-secondary mb-1">Your signs will appear here</p>
  <p className="text-xs text-theme-muted">Translate text to see SignWriting notation</p>
</div>
```

**AnimationSection** (when no poseFile and not loading):
```tsx
<div className="flex flex-col items-center justify-center h-full py-12">
  <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  </div>
  <p className="text-sm font-medium text-theme-secondary mb-1">Animation will play here</p>
  <p className="text-xs text-theme-muted">Watch 3D skeleton animations of each sign</p>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/InputSection.tsx frontend/src/components/SignWritingSection.tsx frontend/src/components/AnimationSection.tsx
git commit -m "feat: add themed empty states with stage colors for all main sections"
```

---

### Task 20: Final Integration & Smoke Test

**Files:**
- Modify: `frontend/src/pages/App.tsx` (final cleanup)

- [ ] **Step 1: Verify all imports and wiring in App.tsx**

Read the final App.tsx, ensure all components are imported and properly connected. Check that:
- TranslationContext provides all needed state
- PanelContext handles all panels
- Keyboard shortcuts work with the new context hooks
- No orphaned props or missing imports

- [ ] **Step 2: Start the frontend dev server**

```bash
cd frontend && npm run dev
```

Verify the app loads without errors. Check:
- Onboarding shows on first visit
- Header is simplified with minimal controls
- Toolbar shows below header with language/simplify/phrase book
- Pipeline progress stepper animates
- Three main sections have card styles with colored left borders
- Empty states display correctly
- Panel slide-in animations work
- Theme toggle works (light/dark)
- Teal/amber color scheme is consistent throughout

- [ ] **Step 3: Start the backend**

```bash
cd backend && python main.py
```

Verify:
- `/health` endpoint returns `{"status": "ready", "models": {"whisper": true, "signwriting": true}}`
- Translation pipeline works end-to-end
- Structured errors return proper format on bad input
- Simplification gracefully degrades if Groq is unavailable

- [ ] **Step 4: Test the full pipeline**

1. Type "Hello, how are you?" and press Ctrl+Enter
2. Verify SignWriting appears in the middle section
3. Verify animation plays in the right section
4. Check pipeline progress stepper completes
5. Try recording audio and verify transcription works
6. Open History panel and verify the entry is there
7. Add to favorites and verify badge count updates
8. Open Learning Mode on the translated signs
9. Test export download button
10. Test accessibility help panel

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final integration fixes from smoke testing"
```

---

## Summary

| Phase | Tasks | What it produces |
|-------|-------|-----------------|
| 1: Backend | Tasks 1-5 | Reliable API with health check, validation, structured errors. Completely rewritten 17-joint animation system with two-handed support and interpolation. |
| 2: Architecture | Tasks 6-8 | TranslationContext + PanelContext. App.tsx drops from 420 to ~120 lines. Per-stage error handling with retry. |
| 3: UI Overhaul | Tasks 9-12 | Clarity design system (teal/amber), simplified Header + Toolbar, animated pipeline stepper, card system with stage borders. |
| 4: Features | Tasks 13-17 | Onboarding flow, export controls, streaming recorder, practice mode quiz, sign breakdown, accessibility help. |
| 5: Polish | Tasks 18-20 | All panels restyled, themed empty states, full integration test. |
