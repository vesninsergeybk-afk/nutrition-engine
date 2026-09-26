#!/usr/bin/env python3
"""Export an OpenSim .mot trajectory to rigid-body transform motion clips."""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import re
from typing import Dict, List, Tuple

import pyopensim as osim


def parse_mot(path: pathlib.Path) -> Tuple[bool, List[str], List[List[float]]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    in_degrees = any(
        re.match(r"\s*inDegrees\s*=\s*yes\s*$", line, re.I) for line in lines
    )
    try:
        end = next(
            i for i, line in enumerate(lines) if line.strip().lower() == "endheader"
        )
    except StopIteration as exc:
        raise ValueError(f"{path}: missing endheader") from exc
    labels = re.split(r"\s+", lines[end + 1].strip())
    rows: List[List[float]] = []
    for line in lines[end + 2 :]:
        if not line.strip():
            continue
        values = [float(item) for item in re.split(r"\s+", line.strip())]
        if len(values) != len(labels):
            raise ValueError(
                f"{path}: row has {len(values)} values; expected {len(labels)}"
            )
        rows.append(values)
    if not rows or labels[0] != "time":
        raise ValueError(f"{path}: invalid motion table")
    return in_degrees, labels, rows


def simtk_values(value, count: int) -> List[float]:
    out: List[float] = []
    for i in range(count):
        try:
            out.append(float(value.get(i)))
        except AttributeError:
            out.append(float(value[i]))
    return out


def body_transform(body, state) -> Dict[str, List[float]]:
    transform = body.getTransformInGround(state)
    position = simtk_values(transform.p(), 3)
    quat = simtk_values(transform.R().convertRotationToQuaternion(), 4)
    norm = math.sqrt(sum(v * v for v in quat))
    if not norm > 1e-12:
        raise ValueError("OpenSim returned a zero quaternion")
    return {
        "position": position,
        "quaternion": [value / norm for value in quat],
    }


def is_translation_coordinate(name: str) -> bool:
    return bool(re.search(r"_t[xyz]$", name))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--motion", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--clip-id", required=True)
    parser.add_argument("--pilot-id", required=True)
    parser.add_argument("--movement-id", required=True)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--source-revision", required=True)
    parser.add_argument("--source-motion", required=True)
    parser.add_argument("--body-map", required=True, help="atlasId=opensimBody,...")
    parser.add_argument("--stride", type=int, default=1)
    args = parser.parse_args()

    in_degrees, labels, rows = parse_mot(pathlib.Path(args.motion))
    model = osim.Model(str(pathlib.Path(args.model)))
    state = model.initSystem()

    coordinates = model.getCoordinateSet()
    coord_map = {
        coordinates.get(i).getName(): coordinates.get(i)
        for i in range(coordinates.getSize())
    }
    body_set = model.getBodySet()

    body_map: Dict[str, str] = {}
    for item in args.body_map.split(","):
        atlas_id, source_name = item.split("=", 1)
        body_map[atlas_id.strip()] = source_name.strip()

    source_body_names = {
        body_set.get(i).getName() for i in range(body_set.getSize())
    }
    missing_bodies = [
        source_name
        for source_name in body_map.values()
        if source_name not in source_body_names
    ]
    if missing_bodies:
        raise ValueError("Model missing bodies: " + ", ".join(missing_bodies))

    coordinate_columns = {
        label: labels.index(label)
        for label in labels[1:]
        if label in coord_map
    }
    if not coordinate_columns:
        raise ValueError("No .mot coordinate names matched the OpenSim model")

    frames = []
    stride = max(1, args.stride)
    first_time = float(rows[0][0])

    for row_index, row in enumerate(rows):
        if row_index % stride and row_index != len(rows) - 1:
            continue
        source_time = float(row[0])
        state.setTime(source_time)
        for name, column in coordinate_columns.items():
            value = float(row[column])
            if in_degrees and not is_translation_coordinate(name):
                value = math.radians(value)
            coord_map[name].setValue(state, value, False)
        model.realizePosition(state)

        bodies = {
            atlas_id: body_transform(body_set.get(source_name), state)
            for atlas_id, source_name in body_map.items()
        }
        frames.append({"time": source_time - first_time, "bodies": bodies})

    clip = {
        "schema": "motion-clip-v1",
        "id": args.clip_id,
        "pilotId": args.pilot_id,
        "movementId": args.movement_id,
        "sourceId": args.source_id,
        "sourceRevision": args.source_revision,
        "sourceMotion": args.source_motion,
        "frames": frames,
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(clip, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"exported {len(frames)} frames from {len(rows)} source rows -> {output}")


if __name__ == "__main__":
    main()
