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
    if not signwriting or not signwriting.strip():
        raise ValueError("Empty signwriting input")

    movements = parse_fsw_movements(signwriting)

    if not movements:
        raise ValueError("No movements parsed from signwriting")

    pose_sequence = generate_pose_from_movements(movements)
    num_frames = pose_sequence.shape[0]

    body_data = np.zeros((num_frames, 1, NUM_JOINTS, 2), dtype=np.float32)
    for f in range(num_frames):
        for j in range(NUM_JOINTS):
            body_data[f, 0, j, 0] = pose_sequence[f, j, 0] * 512
            body_data[f, 0, j, 1] = pose_sequence[f, j, 1] * 512

    confidence = np.ones((num_frames, 1, NUM_JOINTS), dtype=np.float32)

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
