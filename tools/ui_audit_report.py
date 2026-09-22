#!/usr/bin/env python3
"""Summarise the UI audit capture into readable findings.

Reads reports/ui-audit/ (written by tests/e2e/ui-audit-capture.spec.js) and prints:

  1. colour contrast failures that are confirmed to be painted
  2. the type scale actually rendered, per viewport
  3. the first-screen reading order, per mobile route
  4. the headings each route exposes, in document order
  5. wording repeated inside a single screen

Measurement only; this tool never touches application code.
"""

from __future__ import annotations

import json
import pathlib
import sys
from collections import Counter

try:  # Windows consoles default to a legacy code page.
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:  # pragma: no cover - older runtimes
    pass

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTLINE = ROOT / "reports" / "ui-audit" / "outline"
VIEWPORTS = ("mobile", "tablet", "desktop")
ROUTES = (
    "profile",
    "ration",
    "analysis/overview",
    "analysis/nutrients",
    "analysis/hei",
    "correction",
    "report",
)


def load() -> dict:
    data = {}
    for path in sorted(OUTLINE.glob("*.json")):
        payload = json.loads(path.read_text(encoding="utf-8"))
        data[(payload["viewportName"], payload["requestedRoute"])] = payload
    return data


def is_large_text(font_size: float, font_weight) -> bool:
    weight = int(str(font_weight).replace("bold", "700") or 400)
    return font_size >= 24 or (font_size >= 18.66 and weight >= 700)


def section(title: str) -> None:
    print()
    print("=" * 78)
    print(title)
    print("=" * 78)


def metrics_section() -> None:
    path = ROOT / "reports" / "ui-audit" / "report.json"
    if not path.exists():
        return
    payload = json.loads(path.read_text(encoding="utf-8"))
    entries = payload["entries"]
    section("0. SCREEN COST AND ERGONOMICS")
    print()
    print(f'{"route":<20} {"vp":<8} {"screens":>7} {"interactive":>11} '
          f'{"smallTaps":>9} {"smallText":>9} {"buttons":>7} {"headings":>8}')
    print("-" * 84)
    for entry in sorted(entries, key=lambda e: (VIEWPORTS.index(e["viewport"]), e["route"])):
        print(f'{entry["route"]:<20} {entry["viewport"]:<8} {entry["screensOfScroll"]:>7} '
              f'{entry["interactiveCount"]:>11} {entry["smallTapTargetCount"]:>9} '
              f'{entry["smallTextCount"]:>9} {entry["buttonCount"]:>7} {entry["headingCount"]:>8}')

    print("\n-- mobile tap targets below 40px")
    for entry in sorted(entries, key=lambda e: e["route"]):
        if entry["viewport"] != "mobile":
            continue
        for target in entry["smallTapTargets"]:
            print(f'   {entry["route"]:<20} {target["w"]:>4}x{target["h"]:<4} "{target["label"]}"')

    print("\n-- mobile bottom navigation")
    for entry in sorted(entries, key=lambda e: e["route"]):
        if entry["viewport"] != "mobile":
            continue
        nav = entry.get("bottomNav")
        if nav:
            print(f'   {entry["route"]:<20} height={nav["height"]}px label={nav["labelFontSize"]}px'
                  f' items={nav["itemCount"]}')
            break


def contrast_section(data: dict) -> None:
    section("1. COLOUR CONTRAST (WCAG 2.1 AA: 4.5:1 normal, 3:1 large text)")
    for (viewport, route), payload in sorted(data.items()):
        confirmed, unverified = [], 0
        for entry in payload["entries"]:
            if entry["interactive"] and not entry["text"]:
                continue
            # Contrast measured over a gradient or an image is not a number worth
            # reporting; the harness marks those runs unreliable.
            if not entry.get("contrastReliable", True) or entry.get("contrast") is None:
                continue
            threshold = 3.0 if is_large_text(entry["fontSize"], entry["fontWeight"]) else 4.5
            if entry["contrast"] >= threshold:
                continue
            # Only runs proven to be painted count as failures; the rest are
            # counted separately because they sit outside the captured viewport.
            if entry.get("paintedOnTop") is True:
                confirmed.append(entry)
            else:
                unverified += 1
        if not confirmed and not unverified:
            continue
        print(f"\n-- {viewport} / {route}: {len(confirmed)} confirmed, {unverified} unverified")
        for entry in sorted(confirmed, key=lambda item: item["contrast"])[:8]:
            print(f'   {entry["contrast"]:>6}:1  {entry["fontSize"]:>6}px  {entry["color"]:<22} '
                  f'"{entry["text"][:48]}"')


def type_scale_section(data: dict) -> None:
    section("2. TYPE SCALE ACTUALLY RENDERED")
    for viewport in VIEWPORTS:
        sizes = Counter()
        for (vp, _route), payload in data.items():
            if vp != viewport:
                continue
            for entry in payload["entries"]:
                sizes[entry["fontSize"]] += 1
        if not sizes:
            continue
        total = sum(sizes.values())
        below = sum(count for size, count in sizes.items() if size < 12)
        print(f"\n-- {viewport}: {total} rendered runs, {len(sizes)} distinct sizes, "
              f"{below} below 12px ({below / total * 100:.1f}%)")
        for size, count in sorted(sizes.items()):
            bar = "#" * min(50, round(count / total * 200))
            flag = "  <-- below readable minimum" if size < 12 else ""
            print(f"   {size:>6}px {count:>5}  {bar}{flag}")


def reading_order_section(data: dict) -> None:
    section("3. FIRST-SCREEN READING ORDER (mobile, top -> down)")
    for route in ROUTES:
        payload = data.get(("mobile", route))
        if not payload:
            continue
        entries = sorted((e for e in payload["entries"] if e["top"] < 900), key=lambda e: e["top"])
        print(f"\n-- mobile / {route}: {len(entries)} rendered runs in the first screen")
        for entry in entries[:16]:
            marker = "*" if entry["interactive"] else " "
            print(f'   {entry["top"]:>5}px {entry["fontSize"]:>6}px {entry["tag"]:<7}{marker} '
                  f'"{entry["text"][:52]}"')


def heading_section(data: dict) -> None:
    section("4. HEADINGS EXPOSED BY EACH ROUTE (desktop, document order)")
    for route in ROUTES:
        payload = data.get(("desktop", route))
        if not payload:
            continue
        heads = sorted((e for e in payload["entries"] if e["tag"] in ("H1", "H2", "H3", "H4")),
                       key=lambda e: e["top"])
        print(f"\n-- desktop / {route}: {len(heads)} headings")
        print("   " + " | ".join(f'{h["tag"]}:{h["text"][:34]}' for h in heads))


def repetition_section(data: dict) -> None:
    section("5. WORDING REPEATED INSIDE ONE SCREEN (mobile)")
    for (viewport, route), payload in sorted(data.items()):
        if viewport != "mobile":
            continue
        counter = Counter(e["text"] for e in payload["entries"] if e["text"] and not e["interactive"])
        repeats = [(text, count) for text, count in counter.items() if count > 1]
        if not repeats:
            continue
        print(f"\n-- mobile / {route}")
        for text, count in sorted(repeats, key=lambda item: -item[1])[:6]:
            print(f'   x{count}  "{text[:66]}"')


def main() -> int:
    if not OUTLINE.exists():
        print(f"No capture found at {OUTLINE.as_posix()}.")
        print("Run: npx playwright test tests/e2e/ui-audit-capture.spec.js --project=chromium")
        return 1
    data = load()
    if not data:
        print("Capture directory is empty.")
        return 1
    print(f"Loaded {len(data)} outline captures from {OUTLINE.as_posix()}")
    metrics_section()
    contrast_section(data)
    type_scale_section(data)
    reading_order_section(data)
    heading_section(data)
    repetition_section(data)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
