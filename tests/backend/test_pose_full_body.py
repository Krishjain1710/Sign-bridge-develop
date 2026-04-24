import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))

from pose.local_pose_generator import generate_pose_from_signwriting


def test_pose_generation_uses_full_body_33_joints():
    result = generate_pose_from_signwriting(
        "M500x500S14c20489x524S27106515x543S30a00482x482S33e00482x482"
    )

    assert result["joints_per_frame"] == 33
    assert result["frames"] > 0
