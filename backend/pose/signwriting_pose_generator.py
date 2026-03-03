import numpy as np

NUM_JOINTS = 33
NUM_FRAMES = 40
RIGHT_HAND = 16  # MediaPipe index

def generate_pose_from_movements(movements):
    pose_sequence = []

    for t in range(NUM_FRAMES):
        joints = np.zeros((NUM_JOINTS, 3))

        for move in movements:
            if move == "UP":
                joints[RIGHT_HAND][1] = 0.5 + 0.01 * t
            elif move == "DOWN":
                joints[RIGHT_HAND][1] = 0.5 - 0.01 * t
            elif move == "RIGHT":
                joints[RIGHT_HAND][0] = 0.5 + 0.01 * t
            elif move == "LEFT":
                joints[RIGHT_HAND][0] = 0.5 - 0.01 * t
            elif move == "CIRCLE":
                joints[RIGHT_HAND][0] = 0.5 + 0.05 * np.cos(t / 4)
                joints[RIGHT_HAND][1] = 0.5 + 0.05 * np.sin(t / 4)

        pose_sequence.append(joints.tolist())

    return pose_sequence
