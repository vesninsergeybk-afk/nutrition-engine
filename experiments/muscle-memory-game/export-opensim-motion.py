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


def normalize_quaternion(quat: List[float]) -> List[float]:
    norm = math.sqrt(sum(value * value for value in quat))
    if not norm > 1e-12:
        raise ValueError("OpenSim returned a zero quaternion")
    return [value / norm for value in quat]


def quaternion_conjugate(quat: List[float]) -> List[float]:
    return [quat[0], -quat[1], -quat[2], -quat[3]]


def quaternion_multiply(a: List[float], b: List[float]) -> List[float]:
    aw, ax, ay, az = a
    bw, bx, by, bz = b
    return [
        aw * bw - ax * bx - ay * by - az * bz,
        aw * bx + ax * bw + ay * bz - az * by,
        aw * by - ax * bz + ay * bw + az * bx,
        aw * bz + ax * by - ay * bx + az * bw,
    ]


def rotate_vector(quat: List[float], vector: List[float]) -> List[float]:
    rotated = quaternion_multiply(
        quaternion_multiply(quat, [0.0, *vector]),
        quaternion_conjugate(quat),
    )
    return rotated[1:]


def transform_in_ground(body, state) -> Dict[str, List[float]]:
    transform = body.getTransformInGround(state)
    return {
        "position": simtk_values(transform.p(), 3),
        "quaternion": normalize_quaternion(
            simtk_values(transform.R().convertRotationToQuaternion(), 4)
        ),
    }


def body_transform(
    body,
    state,
    reference_body=None,
) -> Dict[str, List[float]]:
    body_world = transform_in_ground(body, state)
    if reference_body is None:
        return body_world

    reference_world = transform_in_ground(reference_body, state)
    reference_inverse = quaternion_conjugate(reference_world["quaternion"])
    relative_position = rotate_vector(
        reference_inverse,
        [
            body_world["position"][i] - reference_world["position"][i]
            for i in range(3)
        ],
    )
    relative_quaternion = normalize_quaternion(
        quaternion_multiply(reference_inverse, body_world["quaternion"])
    )
    return {
        "position": relative_position,
        "quaternion": relative_quaternion,
    }


def is_translation_coordinate(name: str) -> bool:
    return bool(re.search(r"_t[xyz]$", name))


def moving_average(values: List[float], window: int) -> List[float]:
    if window < 1:
        raise ValueError("Smoothing window must be >= 1")
    if window % 2 == 0:
        raise ValueError("Smoothing window must be odd")
    half = window // 2
    smoothed: List[float] = []
    for index in range(len(values)):
        start = max(0, index - half)
        end = min(len(values), index + half + 1)
        chunk = values[start:end]
        smoothed.append(sum(chunk) / len(chunk))
    return smoothed


def extract_teaching_phase(
    labels: List[str],
    rows: List[List[float]],
    coordinate_name: str,
    direction: str,
    start_fraction: float,
    end_fraction: float,
    smoothing_window: int,
) -> Tuple[List[List[float]], Dict[str, float | int | str]]:
    if coordinate_name not in labels:
        raise ValueError("Phase coordinate missing from motion: " + coordinate_name)
    if direction not in {"increasing", "decreasing"}:
        raise ValueError("Phase direction must be increasing or decreasing")
    if not (0 <= start_fraction < end_fraction <= 1):
        raise ValueError("Phase fractions must satisfy 0 <= start < end <= 1")

    coordinate_index = labels.index(coordinate_name)
    raw_values = [float(row[coordinate_index]) for row in rows]
    oriented_values = (
        raw_values
        if direction == "increasing"
        else [-value for value in raw_values]
    )
    smoothed = moving_average(oriented_values, smoothing_window)

    peak_index = max(range(len(smoothed)), key=smoothed.__getitem__)
    baseline_index = min(
        range(peak_index + 1),
        key=smoothed.__getitem__,
    )
    amplitude = smoothed[peak_index] - smoothed[baseline_index]
    if not amplitude > 1e-8:
        raise ValueError(
            "Phase coordinate has no usable movement amplitude before its peak"
        )

    start_target = smoothed[baseline_index] + amplitude * start_fraction
    end_target = smoothed[baseline_index] + amplitude * end_fraction

    start_index = next(
        (
            index
            for index in range(baseline_index, peak_index + 1)
            if smoothed[index] >= start_target
        ),
        None,
    )
    end_index = next(
        (
            index
            for index in range(start_index or baseline_index, peak_index + 1)
            if smoothed[index] >= end_target
        ),
        None,
    )
    if start_index is None or end_index is None or end_index <= start_index:
        raise ValueError("Could not isolate a clean teaching phase")

    selected = rows[start_index : end_index + 1]
    selected_smooth = smoothed[start_index : end_index + 1]
    path_length = sum(
        abs(selected_smooth[index] - selected_smooth[index - 1])
        for index in range(1, len(selected_smooth))
    )
    net_progress = selected_smooth[-1] - selected_smooth[0]
    progress_quality = net_progress / max(path_length, 1e-12)
    if progress_quality < 0.9:
        raise ValueError(
            "Selected teaching phase is too non-monotonic: "
            + f"{progress_quality:.3f}"
        )

    sign = 1.0 if direction == "increasing" else -1.0
    metadata: Dict[str, float | int | str] = {
        "coordinate": coordinate_name,
        "direction": direction,
        "startFraction": start_fraction,
        "endFraction": end_fraction,
        "smoothingWindow": smoothing_window,
        "sourceStartTime": float(rows[start_index][0]),
        "sourceEndTime": float(rows[end_index][0]),
        "sourceDuration": float(rows[end_index][0] - rows[start_index][0]),
        "baselineValue": sign * smoothed[baseline_index],
        "peakValue": sign * smoothed[peak_index],
        "startValue": float(raw_values[start_index]),
        "endValue": float(raw_values[end_index]),
        "progressQuality": float(progress_quality),
        "sourceRowCount": len(rows),
        "selectedRowCount": len(selected),
    }
    return selected, metadata


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
    parser.add_argument(
        "--reference-body",
        default=None,
        help="Optional OpenSim body used as the coordinate frame for exported poses",
    )
    parser.add_argument(
        "--phase-coordinate",
        default=None,
        help="Optional source coordinate used to isolate one clean teaching phase",
    )
    parser.add_argument(
        "--phase-direction",
        choices=["increasing", "decreasing"],
        default="increasing",
    )
    parser.add_argument("--phase-start-fraction", type=float, default=0.05)
    parser.add_argument("--phase-end-fraction", type=float, default=0.95)
    parser.add_argument("--phase-smoothing-window", type=int, default=21)
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

    reference_body = None
    if args.reference_body:
        if args.reference_body not in source_body_names:
            raise ValueError("Model missing reference body: " + args.reference_body)
        reference_body = body_set.get(args.reference_body)

    coordinate_columns = {
        label: labels.index(label)
        for label in labels[1:]
        if label in coord_map
    }
    if not coordinate_columns:
        raise ValueError("No .mot coordinate names matched the OpenSim model")

    source_phase = None
    export_rows = rows
    if args.phase_coordinate:
        export_rows, source_phase = extract_teaching_phase(
            labels=labels,
            rows=rows,
            coordinate_name=args.phase_coordinate,
            direction=args.phase_direction,
            start_fraction=args.phase_start_fraction,
            end_fraction=args.phase_end_fraction,
            smoothing_window=args.phase_smoothing_window,
        )

    frames = []
    stride = max(1, args.stride)
    first_time = float(export_rows[0][0])

    for row_index, row in enumerate(export_rows):
        if row_index % stride and row_index != len(export_rows) - 1:
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
            atlas_id: body_transform(
                body_set.get(source_name),
                state,
                reference_body=reference_body,
            )
            for atlas_id, source_name in body_map.items()
        }

        if reference_body is not None:
            reference_pose = body_transform(
                reference_body,
                state,
                reference_body=reference_body,
            )
            if any(abs(value) > 1e-8 for value in reference_pose["position"]):
                raise ValueError("Reference-body translation did not cancel")
            identity = reference_pose["quaternion"]
            if min(abs(identity[0] - 1.0), abs(identity[0] + 1.0)) > 1e-8:
                raise ValueError("Reference-body rotation did not cancel")
            if any(abs(value) > 1e-8 for value in identity[1:]):
                raise ValueError("Reference-body rotation did not cancel")

        frames.append({"time": source_time - first_time, "bodies": bodies})

    clip = {
        "schema": "motion-clip-v1",
        "id": args.clip_id,
        "pilotId": args.pilot_id,
        "movementId": args.movement_id,
        "sourceId": args.source_id,
        "sourceRevision": args.source_revision,
        "sourceMotion": args.source_motion,
        "coordinateSpace": (
            "body-relative" if args.reference_body else "opensim-ground"
        ),
        "referenceBody": args.reference_body,
        "sourcePhase": source_phase,
        "frames": frames,
    }
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(clip, separators=(",", ":")),
        encoding="utf-8",
    )
    if source_phase:
        print(
            "teaching phase "
            + f"{source_phase['coordinate']} "
            + f"{source_phase['sourceStartTime']:.3f}-"
            + f"{source_phase['sourceEndTime']:.3f}s, "
            + f"quality={source_phase['progressQuality']:.3f}"
        )
    print(
        f"exported {len(frames)} frames from {len(export_rows)} selected rows "
        + f"({len(rows)} source rows) -> {output}"
    )


if __name__ == "__main__":
    main()
