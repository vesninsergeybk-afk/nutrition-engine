#!/usr/bin/env python3
"""Will goose pass images to the model you have configured?

goose decides whether a model supports vision by looking the model id up in the
models.dev catalogue it embeds into its backend binary. If the id is absent, any
image sent to the session is replaced with
"[image omitted: model does not support vision]" — even when the provider itself
happily accepts images.

This script reports the verdict for the currently configured provider/model and
prints alternatives that goose recognises as image-capable.

    python tools/goose_vision_check.py
    python tools/goose_vision_check.py --binary <path to goosed binary>
    python tools/goose_vision_check.py --router-models reports/router-probe/vision-models.json
"""

from __future__ import annotations

import argparse
import json
import pathlib
import re
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

CONFIG = pathlib.Path.home() / "AppData" / "Roaming" / "Block" / "goose" / "config" / "config.yaml"
BINARY_CANDIDATES = [
    pathlib.Path.home() / "Downloads" / "Torrent" / "dist-windows" / "resources" / "bin" / "goose.exe",
    pathlib.Path.home() / "AppData" / "Local" / "Programs" / "goose" / "resources" / "bin" / "goose.exe",
]


def find_binary(explicit: str | None) -> pathlib.Path:
    if explicit:
        path = pathlib.Path(explicit)
        if not path.exists():
            raise SystemExit(f"binary not found: {path}")
        return path
    for candidate in BINARY_CANDIDATES:
        if candidate.exists():
            return candidate
    raise SystemExit("could not locate the goose backend binary; pass --binary")


def read_config() -> tuple[str | None, str | None]:
    if not CONFIG.exists():
        return None, None
    text = CONFIG.read_text(encoding="utf-8", errors="replace")
    active = re.search(r"^active_provider:\s*(\S+)", text, re.M)
    provider = active.group(1) if active else None
    model = None
    if provider:
        block = re.search(rf"^  {re.escape(provider)}:\n((?:    .*\n)+)", text, re.M)
        if block:
            found = re.search(r"^\s+model:\s*(\S+)", block.group(1), re.M)
            model = found.group(1) if found else None
    return provider, model


def canonical_vision_ids(data: bytes) -> dict:
    """Ids whose embedded catalogue entry declares image input."""
    result = {}
    for match in re.finditer(rb'"id"\s*:\s*"([A-Za-z0-9._/-]{3,60})"', data):
        start = data.rfind(b"{", 0, match.start())
        chunk = data[start:start + 900]
        if b'"image"' not in chunk or b'"input"' not in chunk:
            continue
        compact = chunk.replace(b"\n", b"")
        cost = re.search(rb'"cost"\s*:\s*\{\s*"input"\s*:\s*([0-9.]+)', compact)
        result[match.group(1).decode("ascii", "replace")] = (
            float(cost.group(1)) if cost else None
        )
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--binary", default=None)
    parser.add_argument("--router-models", default=None,
                        help="JSON list of models your router serves, to intersect with")
    args = parser.parse_args()

    provider, model = read_config()
    print(f"configured provider : {provider or 'not found'}")
    print(f"configured model    : {model or 'not found'}")

    binary = find_binary(args.binary)
    print(f"goose backend       : {binary}")
    data = binary.read_bytes()

    canonical = canonical_vision_ids(data)
    print(f"catalogue entries declaring image input: {len(canonical)}")

    if not model:
        print("\nno model configured; nothing to check")
        return 1

    if model in canonical:
        print(f"\nVERDICT: goose WILL pass images to '{model}'")
        cost = canonical[model]
        if cost is not None:
            print(f"         catalogue input cost: {cost} per million tokens")
        return 0

    print(f"\nVERDICT: goose will DROP images for '{model}' — the id is absent from its catalogue.")
    print("         Fix: switch to an id goose knows (see alternatives below).")

    if args.router_models:
        path = pathlib.Path(args.router_models)
        if path.exists():
            served = {entry["id"] for entry in json.loads(path.read_text(encoding="utf-8"))}
            both = sorted(set(canonical) & served)
            print(f"\nids that are both image-capable for goose and served by your router: {len(both)}")
            cheapest = sorted(
                (item for item in both if canonical[item] is not None),
                key=lambda item: canonical[item]
            )[:12]
            for item in cheapest:
                print(f"   {item:<48} {canonical[item]:>6.2f} $/M")
    else:
        print("\n(pass --router-models to also list ids your router can execute)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
