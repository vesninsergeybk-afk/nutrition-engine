#!/usr/bin/env python3
"""Export a source-derived MyoArm elbow-flexion teaching sweep.

This checkpoint does not invent muscle geometry. MuJoCo evaluates the pinned
MyoArm model at each elbow angle and supplies both rigid-body transforms and
the computed spatial-tendon wrapping path for BIClong/BICshort.
"""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

import mujoco
import myo_sim
import numpy as np

MYOSIM_REVISION = "93b0ca8f4ec90c9899ee7f05fee561e9911da91b"
SOURCE_MODEL = "myoarm_r"
ELBOW_JOINT = "elbow_flexion_r"
BODIES = {
    "humerus": "humerus_r",
    "ulna": "ulna_r",
    "radius": "radius_r",
}
TENDONS = {
    "biceps-long": "BIClong_tendon",
    "biceps-short": "BICshort_tendon",
}


def obj_id(model, obj_type, name: str) -> int:
    value = mujoco.mj_name2id(model, obj_type, name)
    if value < 0:
        raise ValueError(f"Missing MuJoCo object: {name}")
    return int(value)


def body_pose(model, data, body_name: str) -> dict:
    body_id = obj_id(model, mujoco.mjtObj.mjOBJ_BODY, body_name)
    quat = np.asarray(data.xquat[body_id], dtype=float)
    norm = float(np.linalg.norm(quat))
    if not norm > 1e-12:
        raise ValueError(f"Zero body quaternion: {body_name}")
    quat = quat / norm
    return {
        "position": [float(v) for v in data.xpos[body_id]],
        # MuJoCo xquat is [w, x, y, z].
        "quaternion": [float(v) for v in quat],
    }


def tendon_path(model, data, tendon_name: str) -> dict:
    tendon_id = obj_id(model, mujoco.mjtObj.mjOBJ_TENDON, tendon_name)
    start = int(data.ten_wrapadr[tendon_id])
    count = int(data.ten_wrapnum[tendon_id])
    if start < 0 or count <= 0:
        raise ValueError(f"No computed wrap path for {tendon_name}")

    rows = np.asarray(data.wrap_xpos[start : start + count], dtype=float)
    objects = np.asarray(data.wrap_obj[start : start + count], dtype=int)
    if rows.ndim != 2 or rows.shape[1] != 6:
        raise ValueError(
            f"Unexpected wrap_xpos shape for {tendon_name}: {rows.shape}"
        )

    points: list[list[float]] = []

    def append_point(values) -> None:
        point = [float(v) for v in values]
        if not all(math.isfinite(v) for v in point):
            raise ValueError(f"Non-finite tendon point: {tendon_name}")
        if points:
            distance = math.sqrt(
                sum((point[i] - points[-1][i]) ** 2 for i in range(3))
            )
            if distance <= 1e-9:
                return
        points.append(point)

    append_point(rows[0, :3])
    for row in rows:
        append_point(row[3:6])

    if len(points) < 2:
        raise ValueError(f"Computed tendon path too short: {tendon_name}")

    return {
        "length": float(data.ten_length[tendon_id]),
        "points": points,
        "wrapRows": [
            {
                "from": [float(v) for v in row[:3]],
                "to": [float(v) for v in row[3:6]],
                "object": [int(v) for v in obj],
            }
            for row, obj in zip(rows, objects)
        ],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--frames", type=int, default=121)
    args = parser.parse_args()

    if args.frames < 3:
        raise ValueError("Need at least three frames")

    model = myo_sim.load_model(SOURCE_MODEL)
    data = mujoco.MjData(model)

    joint_id = obj_id(model, mujoco.mjtObj.mjOBJ_JOINT, ELBOW_JOINT)
    qpos_address = int(model.jnt_qposadr[joint_id])
    joint_range = np.asarray(model.jnt_range[joint_id], dtype=float)
    min_angle = float(joint_range[0])
    max_angle = float(joint_range[1])
    if not (math.isfinite(min_angle) and math.isfinite(max_angle) and max_angle > min_angle):
        raise ValueError("Invalid elbow joint range")

    frames = []
    for frame_index in range(args.frames):
        progress = frame_index / (args.frames - 1)
        angle = min_angle + (max_angle - min_angle) * progress

        mujoco.mj_resetData(model, data)
        data.qpos[qpos_address] = angle
        mujoco.mj_forward(model, data)

        frames.append(
            {
                "progress": progress,
                "elbowFlexionRad": angle,
                "elbowFlexionDeg": math.degrees(angle),
                "bodies": {
                    semantic_id: body_pose(model, data, source_name)
                    for semantic_id, source_name in BODIES.items()
                },
                "musclePaths": {
                    semantic_id: tendon_path(model, data, tendon_name)
                    for semantic_id, tendon_name in TENDONS.items()
                },
            }
        )

    for semantic_id in TENDONS:
        start_length = frames[0]["musclePaths"][semantic_id]["length"]
        end_length = frames[-1]["musclePaths"][semantic_id]["length"]
        if not end_length < start_length:
            raise ValueError(
                f"{semantic_id} did not shorten over elbow flexion: "
                f"{start_length:.6f} -> {end_length:.6f}"
            )

    payload = {
        "schema": "myoarm-elbow-motion-v1",
        "sourceId": "myosim-arm",
        "sourceRepository": "MyoHub/myo_sim",
        "sourceRevision": MYOSIM_REVISION,
        "sourceModel": SOURCE_MODEL,
        "sourceStage": "mujoco-forward-kinematics",
        "movementId": "elbow-flexion",
        "joint": {
            "name": ELBOW_JOINT,
            "minRad": min_angle,
            "maxRad": max_angle,
            "minDeg": math.degrees(min_angle),
            "maxDeg": math.degrees(max_angle),
        },
        "bodies": BODIES,
        "tendons": TENDONS,
        "frames": frames,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        "MyoArm elbow export:",
        f"{args.frames} frames,",
        f"{math.degrees(min_angle):.1f}-{math.degrees(max_angle):.1f} deg",
    )
    for semantic_id in TENDONS:
        first = frames[0]["musclePaths"][semantic_id]
        last = frames[-1]["musclePaths"][semantic_id]
        print(
            semantic_id,
            f"length {first['length']:.6f}->{last['length']:.6f} m,",
            f"path points {len(first['points'])}->{len(last['points'])}",
        )


if __name__ == "__main__":
    main()
