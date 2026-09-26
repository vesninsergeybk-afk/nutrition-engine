#!/usr/bin/env python3
"""Export OpenSim coordinate storage to verified rigid-body motion clips."""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import re
from typing import Dict, List, Tuple

import pyopensim as osim


def parse_storage(
    path: pathlib.Path,
) -> Tuple[bool, List[str], List[List[float]], int]:
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
        raise ValueError(f"{path}: invalid OpenSim storage table")

    deduplicated: List[List[float]] = []
    duplicate_rows_removed = 0
    for row in rows:
        if not deduplicated:
            deduplicated.append(row)
            continue

        dt = row[0] - deduplicated[-1][0]
        if dt < 0:
            raise ValueError(f"{path}: timestamps must not decrease")
        if abs(dt) <= 1e-12:
            max_delta = max(
                abs(row[index] - deduplicated[-1][index])
                for index in range(len(row))
            )
            if max_delta > 1e-12:
                raise ValueError(
                    f"{path}: duplicate timestamp contains different states"
                )
            duplicate_rows_removed += 1
            continue
        deduplicated.append(row)

    return in_degrees, labels, deduplicated, duplicate_rows_removed


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


def max_abs_delta(a: List[float], b: List[float]) -> float:
    return max(abs(a[i] - b[i]) for i in range(len(a)))


def transform_in_ground(body, state) -> Dict[str, List[float]]:
    transform = body.getTransformInGround(state)
    return {
        "position": simtk_values(transform.p(), 3),
        # SimTK Quaternion uses [e0,e1,e2,e3] = [w,x,y,z].
        "quaternion": normalize_quaternion(
            simtk_values(transform.R().convertRotationToQuaternion(), 4)
        ),
    }


def body_transform(
    body,
    state,
    reference_body=None,
    verify_native: bool = True,
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
    pose = {
        "position": relative_position,
        "quaternion": relative_quaternion,
    }

    if verify_native:
        body_native = body.getTransformInGround(state)
        reference_native = reference_body.getTransformInGround(state)

        native_position = simtk_values(
            reference_native.shiftBaseStationToFrame(body_native.p()),
            3,
        )
        if max_abs_delta(native_position, relative_position) > 1e-8:
            raise ValueError(
                "Manual thorax-relative translation disagrees with SimTK Transform"
            )

        basis = (
            ([1.0, 0.0, 0.0], osim.Vec3(1.0, 0.0, 0.0)),
            ([0.0, 1.0, 0.0], osim.Vec3(0.0, 1.0, 0.0)),
            ([0.0, 0.0, 1.0], osim.Vec3(0.0, 0.0, 1.0)),
        )
        for basis_list, basis_native in basis:
            world_axis = body_native.xformFrameVecToBase(basis_native)
            native_relative_axis = simtk_values(
                reference_native.xformBaseVecToFrame(world_axis),
                3,
            )
            manual_relative_axis = rotate_vector(
                relative_quaternion,
                basis_list,
            )
            if max_abs_delta(
                native_relative_axis,
                manual_relative_axis,
            ) > 1e-8:
                raise ValueError(
                    "Manual thorax-relative rotation disagrees with SimTK Transform"
                )

    return pose


def is_translation_coordinate(name: str) -> bool:
    return bool(re.search(r"_t[xyz]$", name))


def time_window_average(
    rows: List[List[float]],
    values: List[float],
    window_seconds: float,
) -> List[float]:
    if not window_seconds > 0:
        raise ValueError("Smoothing window must be > 0 seconds")
    half = window_seconds / 2.0
    result: List[float] = []
    left = 0
    right = 0
    running_sum = 0.0

    for index, row in enumerate(rows):
        time = row[0]
        while right < len(rows) and rows[right][0] <= time + half + 1e-12:
            running_sum += values[right]
            right += 1
        while left < len(rows) and rows[left][0] < time - half - 1e-12:
            running_sum -= values[left]
            left += 1
        count = right - left
        if count <= 0:
            raise ValueError("Empty temporal smoothing window")
        result.append(running_sum / count)
    return result


def extract_teaching_phase(
    labels: List[str],
    rows: List[List[float]],
    coordinate_name: str,
    direction: str,
    start_fraction: float,
    end_fraction: float,
    smoothing_seconds: float,
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
        raw_values if direction == "increasing" else [-value for value in raw_values]
    )
    smoothed = time_window_average(rows, oriented_values, smoothing_seconds)

    # These source files contain one intended repetition. Select its dominant
    # excursion: the global oriented peak and the minimum preceding that peak.
    peak_index = max(range(len(smoothed)), key=smoothed.__getitem__)
    baseline_index = min(range(peak_index + 1), key=smoothed.__getitem__)
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
            for index in range(
                start_index if start_index is not None else baseline_index,
                peak_index + 1,
            )
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
        "peakPolicy": "dominant-global-peak",
        "startFraction": start_fraction,
        "endFraction": end_fraction,
        "smoothingSeconds": smoothing_seconds,
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


def sample_rows_by_rate(
    rows: List[List[float]],
    target_hz: float,
) -> List[List[float]]:
    if not target_hz > 0:
        raise ValueError("Target sample rate must be > 0")
    if len(rows) < 2:
        return rows

    start = rows[0][0]
    end = rows[-1][0]
    interval = 1.0 / target_hz
    selected_indices = [0]
    source_index = 1
    target_time = start + interval

    while target_time < end - 1e-12:
        while (
            source_index < len(rows)
            and rows[source_index][0] < target_time
        ):
            source_index += 1
        if source_index >= len(rows):
            break

        before_index = max(0, source_index - 1)
        after_index = source_index
        chosen = min(
            (before_index, after_index),
            key=lambda index: abs(rows[index][0] - target_time),
        )
        if chosen > selected_indices[-1]:
            selected_indices.append(chosen)
        target_time += interval

    if selected_indices[-1] != len(rows) - 1:
        tail_gap = rows[-1][0] - rows[selected_indices[-1]][0]
        if (
            len(selected_indices) > 1
            and tail_gap < interval * 0.5
        ):
            # Avoid a tiny terminal interval that would create an artificial
            # playback-speed spike. Replace the last target sample with the
            # exact phase endpoint instead of adding an extra near-duplicate.
            selected_indices[-1] = len(rows) - 1
        else:
            selected_indices.append(len(rows) - 1)

    return [rows[index] for index in selected_indices]


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
    parser.add_argument("--source-stage", default=None)
    parser.add_argument(
        "--desired-kinematics-lowpass-hz",
        type=float,
        default=None,
    )
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
    parser.add_argument("--phase-smoothing-seconds", type=float, default=0.2)
    parser.add_argument("--sample-hz", type=float, default=60.0)
    args = parser.parse_args()

    in_degrees, labels, rows, duplicate_rows_removed = parse_storage(
        pathlib.Path(args.motion)
    )
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
        raise ValueError("No storage coordinate names matched the OpenSim model")

    source_phase = None
    phase_rows = rows
    if args.phase_coordinate:
        phase_rows, source_phase = extract_teaching_phase(
            labels=labels,
            rows=rows,
            coordinate_name=args.phase_coordinate,
            direction=args.phase_direction,
            start_fraction=args.phase_start_fraction,
            end_fraction=args.phase_end_fraction,
            smoothing_seconds=args.phase_smoothing_seconds,
        )

    export_rows = sample_rows_by_rate(phase_rows, args.sample_hz)
    if source_phase is not None:
        source_phase["exportedRowCount"] = len(export_rows)
        source_phase["targetSampleHz"] = args.sample_hz

    frames = []
    first_time = float(export_rows[0][0])

    for row in export_rows:
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
                verify_native=True,
            )
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
        "sourceStage": args.source_stage,
        "desiredKinematicsLowpassHz": args.desired_kinematics_lowpass_hz,
        "coordinateSpace": (
            "body-relative" if args.reference_body else "opensim-ground"
        ),
        "referenceBody": args.reference_body,
        "sourcePhase": source_phase,
        "targetSampleHz": args.sample_hz,
        "sourceDuplicateRowsRemoved": duplicate_rows_removed,
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
            + f"quality={source_phase['progressQuality']:.3f}, "
            + f"filter={source_phase['smoothingSeconds']:.3f}s"
        )
    print(
        f"exported {len(frames)} frames at target {args.sample_hz:.1f} Hz "
        + f"from {len(phase_rows)} selected rows ({len(rows)} source rows, "
        + f"{duplicate_rows_removed} identical duplicate rows removed) -> {output}"
    )


if __name__ == "__main__":
    main()
