"""Anatomically correct 17-joint base pose for sign language animation."""

import numpy as np

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

RIGHT_ARM = [4, 6, 8, 12, 14, 16]
LEFT_ARM = [3, 5, 7, 11, 13, 15]
RIGHT_HAND_JOINTS = [8, 12, 14, 16]
LEFT_HAND_JOINTS = [7, 11, 13, 15]
FINGER_JOINTS_RIGHT = [14, 16]
FINGER_JOINTS_LEFT = [13, 15]
