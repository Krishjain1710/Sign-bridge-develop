#!/usr/bin/env python3
"""Validate SignBridge translation + animation quality with a fixed dataset.

Usage example:
    python scripts/validate_sign_pipeline.py \
      --backend-url http://127.0.0.1:8000 \
      --dataset tests/validation/golden_dataset.sample.json \
      --output-dir tests/validation/output
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import re
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests


FSW_TOKEN_PATTERN = re.compile(r"^[MBLRSW0-9a-fxp.+-]+$", re.IGNORECASE)


@dataclass
class SampleResult:
    sample_id: str
    text: str
    translate_ok: bool
    pose_ok: bool
    generated_fsw: str
    token_count: int
    frame_count: int
    joints_per_frame: int
    movements: List[str]
    failed_checks: List[str]
    error: str


def _load_dataset(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        raise FileNotFoundError(f"Dataset not found: {path}")
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, list):
        raise ValueError("Dataset file must contain a JSON array.")
    return raw


def _validate_fsw_tokens(fsw: str) -> List[str]:
    problems: List[str] = []
    if not fsw.strip():
        return ["empty_signwriting"]
    tokens = fsw.split()
    for token in tokens:
        if not FSW_TOKEN_PATTERN.match(token):
            problems.append(f"invalid_token:{token}")
    return problems


def _check_expected_fields(sample: Dict[str, Any], fsw: str, failures: List[str]) -> None:
    expected_exact = sample.get("expected_fsw_exact")
    if expected_exact is not None and fsw != expected_exact:
        failures.append("expected_fsw_mismatch")

    expected_contains = sample.get("expected_fsw_contains", [])
    if expected_contains:
        for required in expected_contains:
            if required not in fsw:
                failures.append(f"missing_expected_substring:{required}")


def _run_one_sample(backend_url: str, sample: Dict[str, Any], timeout_seconds: int) -> SampleResult:
    sample_id = str(sample.get("id", "unknown"))
    text = str(sample.get("text", "")).strip()

    if not text:
        return SampleResult(
            sample_id=sample_id,
            text=text,
            translate_ok=False,
            pose_ok=False,
            generated_fsw="",
            token_count=0,
            frame_count=0,
            joints_per_frame=0,
            movements=[],
            failed_checks=["empty_text_input"],
            error="Dataset sample text is empty.",
        )

    failed_checks: List[str] = []
    error_message = ""
    generated_fsw = ""
    frame_count = 0
    joints_per_frame = 0
    movements: List[str] = []
    translate_ok = False
    pose_ok = False

    try:
        t_resp = requests.post(
            f"{backend_url}/translate_signwriting",
            json={"text": text},
            timeout=timeout_seconds,
        )
        if t_resp.status_code != 200:
            failed_checks.append(f"translate_http_{t_resp.status_code}")
            raise RuntimeError(f"translate_signwriting failed: {t_resp.text[:200]}")

        payload = t_resp.json()
        generated_fsw = str(payload.get("signwriting", "")).strip()
        failed_checks.extend(_validate_fsw_tokens(generated_fsw))
        _check_expected_fields(sample, generated_fsw, failed_checks)
        translate_ok = len([f for f in failed_checks if not f.startswith("missing_expected_substring") and f != "expected_fsw_mismatch"]) == 0
        if not generated_fsw:
            translate_ok = False
            failed_checks.append("missing_signwriting_field")

        p_resp = requests.post(
            f"{backend_url}/generate_pose",
            json={"signwriting": generated_fsw},
            timeout=timeout_seconds,
        )
        if p_resp.status_code != 200:
            failed_checks.append(f"pose_http_{p_resp.status_code}")
            raise RuntimeError(f"generate_pose failed: {p_resp.text[:200]}")

        pose_payload = p_resp.json()
        pose_data = pose_payload.get("pose_data", "")
        if not pose_data:
            failed_checks.append("missing_pose_data")
        else:
            try:
                base64.b64decode(pose_data, validate=True)
            except Exception:
                failed_checks.append("invalid_base64_pose_data")

        frame_count = int(pose_payload.get("frames", 0) or 0)
        joints_per_frame = int(pose_payload.get("joints_per_frame", 0) or 0)
        movements_raw = pose_payload.get("movements", [])
        if isinstance(movements_raw, list):
            movements = [str(m) for m in movements_raw]
        else:
            failed_checks.append("invalid_movements_field")

        if frame_count <= 0:
            failed_checks.append("non_positive_frame_count")
        if joints_per_frame <= 0:
            failed_checks.append("non_positive_joint_count")

        pose_ok = not any(
            check.startswith("pose_")
            or check in {
                "missing_pose_data",
                "invalid_base64_pose_data",
                "non_positive_frame_count",
                "non_positive_joint_count",
                "invalid_movements_field",
            }
            for check in failed_checks
        )

        if "expected_fsw_mismatch" in failed_checks or any(c.startswith("missing_expected_substring:") for c in failed_checks):
            translate_ok = False

    except Exception as exc:
        error_message = str(exc)
        translate_ok = False
        pose_ok = False

    return SampleResult(
        sample_id=sample_id,
        text=text,
        translate_ok=translate_ok,
        pose_ok=pose_ok,
        generated_fsw=generated_fsw,
        token_count=len(generated_fsw.split()) if generated_fsw else 0,
        frame_count=frame_count,
        joints_per_frame=joints_per_frame,
        movements=movements,
        failed_checks=failed_checks,
        error=error_message,
    )


def _write_machine_report(
    output_dir: Path,
    backend_url: str,
    dataset_path: Path,
    results: List[SampleResult],
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    report_path = output_dir / f"validation_report_{now}.json"

    total = len(results)
    pass_translate = sum(1 for r in results if r.translate_ok)
    pass_pose = sum(1 for r in results if r.pose_ok)
    pass_both = sum(1 for r in results if r.translate_ok and r.pose_ok)

    payload = {
        "generated_at_utc": now,
        "backend_url": backend_url,
        "dataset_path": str(dataset_path),
        "summary": {
            "total_samples": total,
            "translate_pass": pass_translate,
            "pose_pass": pass_pose,
            "full_pipeline_pass": pass_both,
            "full_pipeline_pass_rate": round((pass_both / total) * 100, 2) if total else 0,
        },
        "results": [asdict(r) for r in results],
    }
    report_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return report_path


def _write_human_review_sheet(output_dir: Path, results: List[SampleResult]) -> Path:
    now = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    csv_path = output_dir / f"human_review_sheet_{now}.csv"
    fields = [
        "sample_id",
        "text",
        "generated_fsw",
        "movements",
        "meaning_accuracy_0_2",
        "signwriting_validity_0_2",
        "motion_clarity_0_2",
        "motion_naturalness_0_2",
        "overall_understandability_0_2",
        "reviewer_notes",
    ]
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        for r in results:
            writer.writerow(
                {
                    "sample_id": r.sample_id,
                    "text": r.text,
                    "generated_fsw": r.generated_fsw,
                    "movements": " ".join(r.movements),
                    "meaning_accuracy_0_2": "",
                    "signwriting_validity_0_2": "",
                    "motion_clarity_0_2": "",
                    "motion_naturalness_0_2": "",
                    "overall_understandability_0_2": "",
                    "reviewer_notes": "",
                }
            )
    return csv_path


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate SignBridge sign + animation pipeline.")
    parser.add_argument("--backend-url", default="http://127.0.0.1:8000", help="Backend base URL")
    parser.add_argument("--dataset", required=True, help="Path to golden dataset JSON file")
    parser.add_argument("--output-dir", default="tests/validation/output", help="Directory for reports")
    parser.add_argument("--timeout-seconds", type=int, default=60, help="HTTP timeout for each request")
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    output_dir = Path(args.output_dir)
    dataset = _load_dataset(dataset_path)

    results = [_run_one_sample(args.backend_url.rstrip("/"), sample, args.timeout_seconds) for sample in dataset]
    report = _write_machine_report(output_dir, args.backend_url, dataset_path, results)
    review_sheet = _write_human_review_sheet(output_dir, results)

    total = len(results)
    full_pass = sum(1 for r in results if r.translate_ok and r.pose_ok)
    print(f"Validated {total} samples")
    print(f"Full pipeline pass: {full_pass}/{total}")
    print(f"Machine report: {report}")
    print(f"Human review sheet: {review_sheet}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
