"""Generate 17-joint pose sequences from parsed FSW movements."""

import numpy as np
from typing import List

from pose.base_pose import (
    BASE_POSE, NUM_JOINTS,
    RIGHT_HAND_JOINTS, LEFT_HAND_JOINTS,
    FINGER_JOINTS_RIGHT, FINGER_JOINTS_LEFT,
)
from pose.movement_types import MovementType, MovementDef, MOVEMENT_AMPLITUDE, compute_frames
from pose.interpolation import full_movement_curve, interpolate_poses


def _apply_directional(base: np.ndarray, joints: List[int], dx: float, dy: float, t: float) -> np.ndarray:
    pose = base.copy()
    curve = full_movement_curve(t)
    for j in joints:
        pose[j, 0] += dx * curve * MOVEMENT_AMPLITUDE
        pose[j, 1] += dy * curve * MOVEMENT_AMPLITUDE
    return pose


def _apply_circle(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    angle = t * 2 * np.pi
    curve = full_movement_curve(min(t * 3, 1.0))
    for j in joints:
        pose[j, 0] += np.cos(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve
        pose[j, 1] += np.sin(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve
    return pose


def _apply_wave(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    wave = np.sin(t * 3 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.6
    envelope = full_movement_curve(t)
    for j in joints:
        pose[j, 0] += wave * envelope
    return pose


def _apply_tap(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
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


def _apply_twist(base: np.ndarray, hand_joints: List[int], finger_joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    angle = t * np.pi * 1.5
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
    pose = base.copy()
    curve = full_movement_curve(t)
    if len(finger_joints) >= 2:
        pose[finger_joints[0], 0] -= 0.03 * curve
        pose[finger_joints[1], 0] += 0.03 * curve
    return pose


def _apply_shake(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    shake = np.sin(t * 5 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.3
    envelope = 1.0 - abs(2 * t - 1)
    for j in joints:
        pose[j, 0] += shake * envelope
    return pose


def _get_target_joints(hand: str):
    if hand == "right":
        return RIGHT_HAND_JOINTS, FINGER_JOINTS_RIGHT
    elif hand == "left":
        return LEFT_HAND_JOINTS, FINGER_JOINTS_LEFT
    else:
        return (
            RIGHT_HAND_JOINTS + LEFT_HAND_JOINTS,
            FINGER_JOINTS_RIGHT + FINGER_JOINTS_LEFT,
        )


def generate_movement_frames(movement: MovementDef, num_frames: int) -> np.ndarray:
    frames = np.zeros((num_frames, NUM_JOINTS, 2), dtype=np.float32)
    hand_joints, finger_joints = _get_target_joints(movement.hand)
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


def generate_pose_from_movements(movements) -> np.ndarray:
    if not movements:
        frames = np.zeros((30, NUM_JOINTS, 2), dtype=np.float32)
        for f in range(30):
            frames[f] = BASE_POSE.copy()
        return frames

    # Handle both List[MovementDef] and List[str] for backward compat
    if movements and isinstance(movements[0], str):
        from pose.movement_types import MovementDef as MD
        movements = [MD(movement_type=MovementType(m), hand="right") for m in movements]

    total_frames = compute_frames(len(movements))
    frames_per = total_frames // len(movements)
    transition_frames = 10

    all_frames = []

    for i, movement in enumerate(movements):
        move_frames = generate_movement_frames(movement, frames_per)
        all_frames.append(move_frames)

        if i < len(movements) - 1:
            end_pose = move_frames[-1]
            next_start = BASE_POSE.copy()
            transition = interpolate_poses(end_pose, next_start, transition_frames)
            all_frames.append(transition)

    return np.concatenate(all_frames, axis=0)
