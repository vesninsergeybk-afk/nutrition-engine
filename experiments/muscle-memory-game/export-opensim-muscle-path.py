#!/usr/bin/env python3
"""Export a wrap-aware OpenSim muscle path across one verified teaching phase."""

from __future__ import annotations

import argparse
import importlib.util
import json
import math
import pathlib
from typing import Iterable, List

import pyopensim as osim


def load_motion_helpers():
    helper_path = pathlib.Path(__file__).with_name("export-opensim-motion.py")
    spec = importlib.util.spec_from_file_location(
        "motion_export_helpers",
        helper_path,
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Could not load export-opensim-motion.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def simtk_values(value, count: int) -> List[float]:
    return [float(value[index]) for index in range(count)]


def polyline_length(points: Iterable[List[float]]) -> float:
    pts = list(points)
    return sum(
        math.dist(pts[index - 1], pts[index])
        for index in range(1, len(pts))
    )


def current_path_points(muscle, state, reference_transform):
    geometry_path = muscle.getGeometryPath()
    geometry_path.updateGeometry(state)
    current_path = geometry_path.getCurrentPath(state)

    if hasattr(current_path, "getSize"):
        size = int(current_path.getSize())
        getter = current_path.get
    else:
        size = len(current_path)
        getter = current_path.__getitem__

    points = []
    point_types = []
    for index in range(size):
        path_point = getter(index)
        world = path_point.getLocationInGround(state)
        relative = reference_transform.shiftBaseStationToFrame(world)
        point = simtk_values(relative, 3)
        if not all(math.isfinite(value) for value in point):
            raise ValueError("Muscle path contains a non-finite point")
        points.append(point)
        point_types.append(
            path_point.getConcreteClassName()
            if hasattr(path_point, "getConcreteClassName")
            else type(path_point).__name__
        )

    if len(points) < 2:
        raise ValueError("Current muscle path has fewer than two points")
    return points, point_types


def resample_polyline(points: List[List[float]], count: int) -> List[List[float]]:
    if count < 2:
        raise ValueError("Resampled path needs at least two points")

    cumulative = [0.0]
    for index in range(1, len(points)):
        cumulative.append(
            cumulative[-1] + math.dist(points[index - 1], points[index])
        )
    total = cumulative[-1]
    if not total > 1e-9:
        raise ValueError("Muscle path has near-zero length")

    result = []
    segment = 1
    for sample_index in range(count):
        target = total * sample_index / (count - 1)
        while segment < len(cumulative) - 1 and cumulative[segment] < target:
            segment += 1

        a_index = max(0, segment - 1)
        b_index = min(len(points) - 1, segment)
        a_distance = cumulative[a_index]
        b_distance = cumulative[b_index]
        alpha = (
            0.0
            if b_distance <= a_distance
            else (target - a_distance) / (b_distance - a_distance)
        )
        result.append(
            [
                points[a_index][axis]
                + (points[b_index][axis] - points[a_index][axis]) * alpha
                for axis in range(3)
            ]
        )
    return result


def apply_row(model, state, labels, row, in_degrees):
    coordinates = model.getCoordinateSet()
    coord_map = {
        coordinates.get(index).getName(): coordinates.get(index)
        for index in range(coordinates.getSize())
    }
    for column, name in enumerate(labels[1:], start=1):
        coordinate = coord_map.get(name)
        if coordinate is None:
            continue
        value = float(row[column])
        if in_degrees and not name.endswith(("_tx", "_ty", "_tz")):
            value = math.radians(value)
        coordinate.setValue(state, value, False)
    state.setTime(float(row[0]))
    model.realizePosition(state)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True)
    parser.add_argument("--motion", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--semantic-id", required=True)
    parser.add_argument("--muscle", required=True)
    parser.add_argument("--phase-coordinate", required=True)
    parser.add_argument("--reference-body", default="thorax")
    parser.add_argument("--resampled-points", type=int, default=24)
    parser.add_argument("--sample-hz", type=float, default=60.0)
    args = parser.parse_args()

    helpers = load_motion_helpers()
    in_degrees, labels, rows, duplicate_rows_removed = helpers.parse_storage(
        pathlib.Path(args.motion)
    )
    phase_rows, phase = helpers.extract_teaching_phase(
        labels=labels,
        rows=rows,
        coordinate_name=args.phase_coordinate,
        direction="increasing",
        start_fraction=0.05,
        end_fraction=0.95,
        smoothing_seconds=0.2,
    )
    export_rows = helpers.sample_rows_by_rate(phase_rows, args.sample_hz)

    model = osim.Model(args.model)
    state = model.initSystem()
    reference_body = model.getBodySet().get(args.reference_body)
    muscle = model.getMuscles().get(args.muscle)

    frames = []
    first_time = float(export_rows[0][0])
    previous_resampled = None
    max_point_speed = 0.0
    source_point_counts = set()
    point_types_seen = set()

    for row in export_rows:
        apply_row(model, state, labels, row, in_degrees)
        reference_transform = reference_body.getTransformInGround(state)
        source_points, point_types = current_path_points(
            muscle,
            state,
            reference_transform,
        )
        source_point_counts.add(len(source_points))
        point_types_seen.update(point_types)

        resampled = resample_polyline(
            source_points,
            args.resampled_points,
        )
        length = float(muscle.getLength(state))
        line_length = polyline_length(source_points)

        if not (0.01 < length < 1.5):
            raise ValueError("Implausible musculotendon length")
        if not (0.01 < line_length < 1.5):
            raise ValueError("Implausible source-path polyline length")

        time = float(row[0]) - first_time
        if previous_resampled is not None:
            dt = time - frames[-1]["time"]
            if not dt > 0:
                raise ValueError("Non-positive path-frame interval")
            max_point_speed = max(
                max_point_speed,
                max(
                    math.dist(a, b) / dt
                    for a, b in zip(previous_resampled, resampled)
                ),
            )

        frames.append(
            {
                "time": time,
                "sourcePointCount": len(source_points),
                "sourcePointTypes": point_types,
                "musculotendonLength": length,
                "sourcePolylineLength": line_length,
                "points": resampled,
            }
        )
        previous_resampled = resampled

    if len(frames) < 3:
        raise ValueError("Too few exported muscle-path frames")
    if max_point_speed > 3.0:
        raise ValueError(
            f"Muscle centerline discontinuity: {max_point_speed:.3f} m/s"
        )

    payload = {
        "schema": "motion-muscle-path-v1",
        "semanticId": args.semantic_id,
        "sourceMuscleName": args.muscle,
        "sourceId": "thoracoscapular-shoulder",
        "sourceStage": "opensim-geometry-path",
        "referenceBody": args.reference_body,
        "coordinateSpace": "body-relative",
        "centerlinePolicy": "source-polyline-arc-length-resample",
        "resampledPointCount": args.resampled_points,
        "targetSampleHz": args.sample_hz,
        "sourceDuplicateRowsRemoved": duplicate_rows_removed,
        "sourcePhase": phase,
        "sourcePointCounts": sorted(source_point_counts),
        "sourcePointTypesSeen": sorted(point_types_seen),
        "maxResampledPointSpeed": max_point_speed,
        "frames": frames,
    }

    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(payload, separators=(",", ":")),
        encoding="utf-8",
    )

    print(
        "OpenSim muscle path export:",
        args.semantic_id,
        "source=" + args.muscle,
        "frames=" + str(len(frames)),
        "sourcePoints=" + ",".join(map(str, sorted(source_point_counts))),
        "resampled=" + str(args.resampled_points),
        "maxPointSpeed=" + f"{max_point_speed:.3f}m/s",
        "types=" + ",".join(sorted(point_types_seen)),
    )


if __name__ == "__main__":
    main()
