"""Cubic Bezier easing and keyframe interpolation for smooth animation."""

import numpy as np


def ease_in_out(t: float) -> float:
    """Cubic ease-in-out: smooth acceleration and deceleration."""
    return t * t * (3.0 - 2.0 * t)


def full_movement_curve(t: float) -> float:
    """Complete movement with anticipation + main + follow-through."""
    if t < 0.15:
        return -0.1 * ease_in_out(t / 0.15)
    elif t < 0.75:
        progress = (t - 0.15) / 0.60
        return -0.1 + 1.15 * ease_in_out(progress)
    else:
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
