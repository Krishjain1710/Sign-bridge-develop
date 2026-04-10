"""Movement type definitions for sign language animation."""

from enum import Enum
from dataclasses import dataclass


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
    hand: str = "right"


MOVEMENT_AMPLITUDE = 0.12
FRAMES_PER_MOVEMENT = 30


def compute_frames(num_movements: int, num_signs: int = 1) -> int:
    """Calculate total frame count based on complexity."""
    frames = FRAMES_PER_MOVEMENT + max(0, num_movements - 1) * 20 + max(0, num_signs - 1) * 10
    return min(150, max(30, frames))
