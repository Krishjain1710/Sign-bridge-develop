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

# Detailed limb connections matching MediaPipe Holistic / sign.mt style
LIMBS = [
    # Face (More detail for a "human" look)
    (0, 1), (1, 2), (2, 3), (3, 7),
    (0, 4), (4, 5), (5, 6), (6, 8),
    (9, 10), # Mouth
    
    # Body
    (11, 12), (11, 13), (13, 15),
    (12, 14), (14, 16),
    (11, 23), (12, 24), (23, 24),
    (23, 25), (25, 27),
    (24, 26), (26, 28),
    
    # Hands (Full finger connections)
    (15, 17), (17, 19), (19, 21), # Left
    (16, 18), (18, 20), (20, 22), # Right
]

# High-contrast color palette (R, G, B) - Using Blue/Red/White standard
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)
RED = (255, 0, 0)

COLORS = []
for limb in LIMBS:
    p1, p2 = limb
    # Right side uses Blue, Left uses Red, Face uses White
    right_indices = [4, 5, 6, 8, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32]
    if p1 < 11 and p2 < 11:
        COLORS.append(WHITE)
    elif p1 in right_indices or p2 in right_indices:
        COLORS.append(BLUE)
    else:
        COLORS.append(RED)

RIGHT_ARM = [12, 14, 16, 18, 20, 22]
LEFT_ARM = [11, 13, 15, 17, 19, 21]
RIGHT_HAND_JOINTS = [16, 18, 20, 22]
LEFT_HAND_JOINTS = [15, 17, 19, 21]
FINGER_JOINTS_RIGHT = [20, 22]
FINGER_JOINTS_LEFT = [19, 21]
