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


# Realistic amplitude for signs (not too exaggerated)
MOVEMENT_AMPLITUDE = 0.15

def _apply_directional(base: np.ndarray, joints: List[int], dx: float, dy: float, t: float) -> np.ndarray:
    pose = base.copy()
    curve = full_movement_curve(t)
    
    # Identify elbows for more natural movement
    # Left Elbow: 13, Right Elbow: 14
    elbows = [13, 14]
    
    for j in joints:
        factor = 0.5 if j in elbows else 1.0
        pose[j, 0] += dx * curve * MOVEMENT_AMPLITUDE * factor
        pose[j, 1] += dy * curve * MOVEMENT_AMPLITUDE * factor
    return pose


def _apply_circle(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    angle = t * 2 * np.pi
    curve = full_movement_curve(min(t * 3, 1.0))
    elbows = [13, 14]
    for j in joints:
        factor = 0.5 if j in elbows else 1.0
        pose[j, 0] += np.cos(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve * factor
        pose[j, 1] += np.sin(angle) * MOVEMENT_AMPLITUDE * 0.8 * curve * factor
    return pose


def _apply_wave(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    wave = np.sin(t * 3 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.6
    envelope = full_movement_curve(t)
    elbows = [13, 14]
    for j in joints:
        factor = 0.5 if j in elbows else 1.0
        pose[j, 0] += wave * envelope * factor
    return pose


def _apply_tap(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    elbows = [13, 14]
    if t < 0.4:
        curve = full_movement_curve(t / 0.4)
        dy = MOVEMENT_AMPLITUDE * 0.5 * curve
    else:
        curve = full_movement_curve((t - 0.4) / 0.6)
        dy = MOVEMENT_AMPLITUDE * 0.5 * (1.0 - curve)
    for j in joints:
        factor = 0.5 if j in elbows else 1.0
        pose[j, 1] += dy * factor
    return pose

# (Twist, Pinch, Spread, Shake updated to include elbow handling if they move the whole hand)
def _apply_shake(base: np.ndarray, joints: List[int], t: float) -> np.ndarray:
    pose = base.copy()
    shake = np.sin(t * 5 * 2 * np.pi) * MOVEMENT_AMPLITUDE * 0.3
    envelope = 1.0 - abs(2 * t - 1)
    elbows = [13, 14]
    for j in joints:
        factor = 0.5 if j in elbows else 1.0
        pose[j, 0] += shake * envelope * factor
    return pose


def _get_target_joints(hand: str):
    # Include elbows (13, 14) in the primary movement joints
    if hand == "right":
        return [14] + RIGHT_HAND_JOINTS, FINGER_JOINTS_RIGHT
    elif hand == "left":
        return [13] + LEFT_HAND_JOINTS, FINGER_JOINTS_LEFT
    else:
        return (
            [13, 14] + RIGHT_HAND_JOINTS + LEFT_HAND_JOINTS,
            FINGER_JOINTS_RIGHT + FINGER_JOINTS_LEFT,
        )


def generate_movement_frames(movement: MovementDef, num_frames: int, start_pose: np.ndarray = None) -> np.ndarray:
    frames = np.zeros((num_frames, NUM_JOINTS, 2), dtype=np.float32)
    hand_joints, finger_joints = _get_target_joints(movement.hand)
    mt = movement.movement_type
    
    base = start_pose if start_pose is not None else BASE_POSE.copy()

    for f in range(num_frames):
        t = f / max(1, num_frames - 1)

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
    transition_frames = 12

    all_frames = []
    current_start_pose = BASE_POSE.copy()

    for i, movement in enumerate(movements):
        # Generate movement starting from current_start_pose
        move_frames = generate_movement_frames(movement, frames_per, start_pose=current_start_pose)
        all_frames.append(move_frames)

        last_pose = move_frames[-1]
        
        if i < len(movements) - 1:
            # Blend the last pose with BASE_POSE (50% return to neutral)
            # to mimic human 're-centering' between signs
            next_base = last_pose * 0.5 + BASE_POSE * 0.5
            
            # Create a smooth transition to the next_base
            transition = interpolate_poses(last_pose, next_base, transition_frames)
            all_frames.append(transition)
            current_start_pose = next_base
    
    # Finally, transition back to BASE_POSE at the very end
    final_transition = interpolate_poses(all_frames[-1][-1], BASE_POSE, 20)
    all_frames.append(final_transition)

    return np.concatenate(all_frames, axis=0)
