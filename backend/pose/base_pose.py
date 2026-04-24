"""Full-body 33-joint base pose for sign language animation with a clean, blank oval head."""

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

# Perfectly aligned coordinates for a clean oval head and proportional body
BASE_POSE = np.array([
    [0.50, 0.12],   # 0: HEAD TOP
    [0.48, 0.17],   # 1: LEFT_EYE_INNER
    [0.46, 0.17],   # 2: LEFT_EYE
    [0.43, 0.17],   # 3: LEFT_EYE_OUTER
    [0.52, 0.17],   # 4: RIGHT_EYE_INNER
    [0.54, 0.17],   # 5: RIGHT_EYE
    [0.57, 0.17],   # 6: RIGHT_EYE_OUTER
    [0.38, 0.20],   # 7: LEFT_EAR
    [0.62, 0.20],   # 8: RIGHT_EAR
    [0.45, 0.28],   # 9: CHIN_LEFT
    [0.55, 0.28],   # 10: CHIN_RIGHT
    
    # Body (Realistic proportions)
    [0.35, 0.38],   # 11: LEFT_SHOULDER
    [0.65, 0.38],   # 12: RIGHT_SHOULDER
    [0.30, 0.52],   # 13: LEFT_ELBOW
    [0.70, 0.52],   # 14: RIGHT_ELBOW
    [0.28, 0.65],   # 15: LEFT_WRIST
    [0.72, 0.65],   # 16: RIGHT_WRIST
    [0.26, 0.68],   # 17: LEFT_PINKY
    [0.74, 0.68],   # 18: RIGHT_PINKY
    [0.25, 0.70],   # 19: LEFT_INDEX
    [0.75, 0.70],   # 20: RIGHT_INDEX
    [0.27, 0.69],   # 21: LEFT_THUMB
    [0.73, 0.69],   # 22: RIGHT_THUMB
    [0.44, 0.65],   # 23: LEFT_HIP
    [0.56, 0.65],   # 24: RIGHT_HIP
    [0.43, 0.78],   # 25: LEFT_KNEE
    [0.57, 0.78],   # 26: RIGHT_KNEE
    [0.42, 0.90],   # 27: LEFT_ANKLE
    [0.58, 0.90],   # 28: RIGHT_ANKLE
    [0.41, 0.93],   # 29: LEFT_HEEL
    [0.59, 0.93],   # 30: RIGHT_HEEL
    [0.43, 0.96],   # 31: LEFT_FOOT_INDEX
    [0.57, 0.96],   # 32: RIGHT_FOOT_INDEX
], dtype=np.float32)

# Point connections (limbs) - Standardized for a clean, proportional face
LIMBS = [
    # FACE OVAL (Outer boundary loop only - no internal features)
    (7, 0), (0, 8), (8, 10), (10, 9), (9, 7),
    
    # BODY
    (11, 12),                                 # Shoulders
    (11, 13), (13, 15),                       # Left arm
    (12, 14), (14, 16),                       # Right arm
    (15, 17), (15, 19), (15, 21),             # Left hand
    (16, 18), (16, 20), (16, 22),             # Right hand
    (11, 23), (12, 24), (23, 24),             # Torso
    (23, 25), (25, 27), (27, 29), (29, 31),   # Left leg
    (24, 26), (26, 28), (28, 30), (30, 32),   # Right leg
]

# High-contrast color palette (R, G, B)
RED_ORANGE = (255, 69, 58)
BLUE = (10, 132, 255)

COLORS = []
for limb in LIMBS:
    p1, p2 = limb
    # Right side limbs use Blue
    right_indices = [4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
    
    if p1 in right_indices and p2 in right_indices:
        COLORS.append(BLUE)
    else:
        # Left side and Face components use Red/Orange
        COLORS.append(RED_ORANGE)

RIGHT_ARM = [12, 14, 16, 18, 20, 22]
LEFT_ARM = [11, 13, 15, 17, 19, 21]
RIGHT_HAND_JOINTS = [16, 18, 20, 22]
LEFT_HAND_JOINTS = [15, 17, 19, 21]
FINGER_JOINTS_RIGHT = [20, 22]
FINGER_JOINTS_LEFT = [19, 21]
