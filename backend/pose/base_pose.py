"""Full-body 33-joint base pose for sign language animation."""

import numpy as np

JOINT_NAMES = [
    "NOSE",
    "LEFT_EYE_INNER",
    "LEFT_EYE",
    "LEFT_EYE_OUTER",
    "RIGHT_EYE_INNER",
    "RIGHT_EYE",
    "RIGHT_EYE_OUTER",
    "LEFT_EAR",
    "RIGHT_EAR",
    "MOUTH_LEFT",
    "MOUTH_RIGHT",
    "LEFT_SHOULDER",
    "RIGHT_SHOULDER",
    "LEFT_ELBOW",
    "RIGHT_ELBOW",
    "LEFT_WRIST",
    "RIGHT_WRIST",
    "LEFT_PINKY",
    "RIGHT_PINKY",
    "LEFT_INDEX",
    "RIGHT_INDEX",
    "LEFT_THUMB",
    "RIGHT_THUMB",
    "LEFT_HIP",
    "RIGHT_HIP",
    "LEFT_KNEE",
    "RIGHT_KNEE",
    "LEFT_ANKLE",
    "RIGHT_ANKLE",
    "LEFT_HEEL",
    "RIGHT_HEEL",
    "LEFT_FOOT_INDEX",
    "RIGHT_FOOT_INDEX",
]

NUM_JOINTS = len(JOINT_NAMES)

BASE_POSE = np.array([
    [0.50, 0.175],  # NOSE
    [0.485, 0.158],  # LEFT_EYE_INNER
    [0.465, 0.156],  # LEFT_EYE
    [0.44, 0.162],  # LEFT_EYE_OUTER
    [0.515, 0.158],  # RIGHT_EYE_INNER
    [0.535, 0.156],  # RIGHT_EYE
    [0.56, 0.162],  # RIGHT_EYE_OUTER
    [0.415, 0.19],  # LEFT_EAR
    [0.585, 0.19],  # RIGHT_EAR
    [0.475, 0.222],  # MOUTH_LEFT
    [0.525, 0.222],  # MOUTH_RIGHT
    [0.40, 0.25],  # LEFT_SHOULDER
    [0.60, 0.25],  # RIGHT_SHOULDER
    [0.33, 0.37],  # LEFT_ELBOW
    [0.67, 0.37],  # RIGHT_ELBOW
    [0.30, 0.49],  # LEFT_WRIST
    [0.70, 0.49],  # RIGHT_WRIST
    [0.28, 0.52],  # LEFT_PINKY
    [0.72, 0.52],  # RIGHT_PINKY
    [0.27, 0.54],  # LEFT_INDEX
    [0.73, 0.54],  # RIGHT_INDEX
    [0.29, 0.53],  # LEFT_THUMB
    [0.71, 0.53],  # RIGHT_THUMB
    [0.44, 0.52],  # LEFT_HIP
    [0.56, 0.52],  # RIGHT_HIP
    [0.43, 0.66],  # LEFT_KNEE
    [0.57, 0.66],  # RIGHT_KNEE
    [0.42, 0.82],  # LEFT_ANKLE
    [0.58, 0.82],  # RIGHT_ANKLE
    [0.41, 0.86],  # LEFT_HEEL
    [0.59, 0.86],  # RIGHT_HEEL
    [0.43, 0.89],  # LEFT_FOOT_INDEX
    [0.57, 0.89],  # RIGHT_FOOT_INDEX
], dtype=np.float32)

LIMBS = [
    (7, 3), (3, 2), (2, 1), (1, 4),          # Upper-left to upper-center
    (4, 5), (5, 6), (6, 8),                  # Upper-right to side
    (8, 10), (10, 9), (9, 7),                # Lower face arc
    (0, 1), (0, 4), (0, 9), (0, 10),         # Nose anchors
    (9, 10),                                  # Mouth
    (3, 6), (2, 5),                           # Brow/eye bridge
    (7, 8),                                   # Head width guide
    (11, 12),                                 # Shoulders
    (11, 13), (13, 15),                       # Left arm
    (12, 14), (14, 16),                       # Right arm
    (15, 17), (15, 19), (15, 21),             # Left hand links
    (16, 18), (16, 20), (16, 22),             # Right hand links
    (11, 23), (12, 24), (23, 24),             # Torso
    (23, 25), (25, 27), (27, 29), (29, 31),   # Left leg
    (24, 26), (26, 28), (28, 30), (30, 32),   # Right leg
]

COLORS = [(100, 200, 200)] * NUM_JOINTS

RIGHT_ARM = [12, 14, 16, 18, 20, 22]
LEFT_ARM = [11, 13, 15, 17, 19, 21]
RIGHT_HAND_JOINTS = [16, 18, 20, 22]
LEFT_HAND_JOINTS = [15, 17, 19, 21]
FINGER_JOINTS_RIGHT = [20, 22]
FINGER_JOINTS_LEFT = [19, 21]
