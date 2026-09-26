#!/usr/bin/env python3
"""Probe dynamic OpenSim GeometryPaths for Motion Lab muscle rendering.

This is deliberately a verification tool, not a renderer. It proves that the
pinned Thoracoscapular model exposes current muscle-path points at two states
of the same verified CMC teaching excursion.
"""

from __future__ import annotations

import argparse
import importlib.util
import math
import pathlib
from typing import Iterable, List

import pyopensim as osim


def load_export_helpers():
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


def current_path_points(muscle, state, reference_transform) -> List[List[float]]:
    geometry_path = muscle.getGeometryPath()
    geometry_path.updateGeometry(state)
    current_path = geometry_path.getCurrentPath(state)

    if hasattr(current_path, "getSize"):
        size = int(current_path.getSize())
        getter = current_path.get
    else:
        size = len(current_path)
        getter = current_path.__getitem__

    points: List[List[float]] = []
    for index in range(size):
        path_point = getter(index)
        world = path_point.getLocationInGround(state)
        relative = reference_transform.shiftBaseStationToFrame(world)
        point = simtk_values(relative, 3)
        if not all(math.isfinite(value) for value in point):
            raise ValueError("Muscle path contains a non-finite point")
        points.append(point)
    return points


def polyline_length(points: Iterable[List[float]]) -> float:
    pts = list(points)
    return sum(
        math.dist(pts[index - 1], pts[index])
        for index in range(1, len(pts))
    )


def max_point_displacement(
    first: List[List[float]],
    second: List[List[float]],
) -> float:
    if not first or not second:
        return 0.0
    if len(first) == len(second):
        return max(math.dist(a, b) for a, b in zip(first, second))

    # Wrapping may activate/deactivate intermediate path points between states.
    # Endpoints must still move consistently; compare them without pretending
    # that differently sized paths have one-to-one interior correspondence.
    return max(
        math.dist(first[0], second[0]),
        math.dist(first[-1], second[-1]),
    )


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
    parser.add_argument("--phase-coordinate", required=True)
    parser.add_argument(
        "--muscles",
        required=True,
        help="comma-separated OpenSim muscle names",
    )
    args = parser.parse_args()

    helpers = load_export_helpers()
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
    if len(phase_rows) < 2:
        raise ValueError("Teaching phase has too few rows")

    model = osim.Model(args.model)
    state = model.initSystem()
    thorax = model.getBodySet().get("thorax")
    muscles = model.getMuscles()

    selected_names = [
        item.strip()
        for item in args.muscles.split(",")
        if item.strip()
    ]
    first_row = phase_rows[0]
    last_row = phase_rows[-1]
    snapshots = []

    for row in (first_row, last_row):
        apply_row(model, state, labels, row, in_degrees)
        reference_transform = thorax.getTransformInGround(state)
        frame = {}
        for name in selected_names:
            muscle = muscles.get(name)
            points = current_path_points(
                muscle,
                state,
                reference_transform,
            )
            length = float(muscle.getLength(state))
            if len(points) < 2:
                raise ValueError(name + ": current path has fewer than 2 points")
            if not (0.02 < length < 1.5):
                raise ValueError(name + ": implausible musculotendon path length")
            if not (0.01 < polyline_length(points) < 1.5):
                raise ValueError(name + ": implausible path-point polyline")
            frame[name] = {
                "time": float(row[0]),
                "points": points,
                "musculotendonLength": length,
            }
        snapshots.append(frame)

    for name in selected_names:
        first = snapshots[0][name]
        last = snapshots[1][name]
        displacement = max_point_displacement(
            first["points"],
            last["points"],
        )
        length_change = (
            last["musculotendonLength"] - first["musculotendonLength"]
        )
        if displacement < 1e-4:
            raise ValueError(name + ": path did not move across the teaching phase")
        print(
            "OpenSim muscle path:",
            name,
            "points=" + str(len(first["points"])) + "->" +
            str(len(last["points"])),
            "length=" +
            f"{first['musculotendonLength']:.4f}->" +
            f"{last['musculotendonLength']:.4f}m",
            "deltaLength=" + f"{length_change:+.4f}m",
            "maxEndpointOrPointMove=" + f"{displacement:.4f}m",
        )

    print(
        "OpenSim muscle-path probe:",
        f"phase={phase['sourceStartTime']:.3f}-" +
        f"{phase['sourceEndTime']:.3f}s",
        "quality=" + f"{phase['progressQuality']:.3f}",
        "dedup=" + str(duplicate_rows_removed),
        "status=verified-dynamic-path-access",
    )


if __name__ == "__main__":
    main()
