from pose.signwriting_parser import parse_signwriting
from pose.signwriting_pose_generator import generate_pose_from_movements

def generate_pose_from_signwriting(signwriting: str) -> dict:
    if not signwriting or not signwriting.strip():
        raise ValueError("Empty signwriting input")

    movements = parse_signwriting(signwriting)

    if not movements:
        raise ValueError("No movements parsed from signwriting")

    pose = generate_pose_from_movements(movements)

    if not pose:
        raise ValueError("Pose generation failed")

    return {
        "format": "mediapipe_skeleton",
        "frames": len(pose),
        "joints_per_frame": 33,
        "pose": pose,
        "movements": movements
    }
