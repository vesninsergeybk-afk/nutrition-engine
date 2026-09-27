#!/usr/bin/env python3
"""
Reproducibly crop mapped muscle artwork from local copies of the source PDFs.

The public repository intentionally does not contain third-party source PDFs or
permission-unverified artwork. This helper reads source-art.js, renders only the
needed PDF pages, crops the normalized rectangles stored in the registry and
writes local preview assets.

Example:
  python reference-data/extract-source-art.py \
    --source methodic-grandsecret-back="/path/Урок 8. Методическое пособие Мышцы спины.pdf" \
    --source methodic-grandsecret-head="/path/Урок 13. Методическое пособие Мышцы головы.pdf" \
    --out-dir /tmp/muscle-source-art

The generated files remain local until publication rights are confirmed and the
corresponding source-art.js entries are explicitly changed to asset-ready.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError as exc:
    raise SystemExit("PyMuPDF (fitz) is required") from exc

try:
    from PIL import Image
except ImportError as exc:
    raise SystemExit("Pillow is required") from exc


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--registry",
        type=Path,
        default=Path(__file__).with_name("source-art.js"),
    )
    parser.add_argument(
        "--source",
        action="append",
        default=[],
        metavar="SOURCE_ID=PDF_PATH",
        help="Map one sourceId from source-art.js to a local PDF.",
    )
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--dpi", type=int, default=220)
    parser.add_argument(
        "--scope",
        choices=["exact", "all"],
        default="exact",
        help="By default group-supplement artwork is not extracted.",
    )
    return parser.parse_args()


def load_registry(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    match = re.search(
        r"export const REFERENCE_SOURCE_ART = Object\.freeze\(\s*(\[.*?\])\s*\);",
        text,
        flags=re.S,
    )
    if not match:
        raise RuntimeError(f"Cannot locate REFERENCE_SOURCE_ART in {path}")
    return json.loads(match.group(1))


def parse_sources(values: list[str]) -> dict[str, Path]:
    result: dict[str, Path] = {}
    for raw in values:
        if "=" not in raw:
            raise ValueError(f"--source must be SOURCE_ID=PDF_PATH, got: {raw}")
        source_id, pdf_path = raw.split("=", 1)
        source_id = source_id.strip()
        path = Path(pdf_path).expanduser().resolve()
        if not source_id or not path.exists():
            raise ValueError(f"Invalid source mapping: {raw}")
        result[source_id] = path
    return result


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", value).strip("-")
    return cleaned or "artwork"


def crop_page(
    document: fitz.Document,
    page_number: int,
    crop: dict,
    dpi: int,
) -> Image.Image:
    page = document.load_page(page_number - 1)
    scale = dpi / 72.0
    pix = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    image = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

    left = round(crop["x"] * image.width)
    top = round(crop["y"] * image.height)
    right = round((crop["x"] + crop["width"]) * image.width)
    bottom = round((crop["y"] + crop["height"]) * image.height)

    left = max(0, min(left, image.width - 1))
    top = max(0, min(top, image.height - 1))
    right = max(left + 1, min(right, image.width))
    bottom = max(top + 1, min(bottom, image.height))

    return image.crop((left, top, right, bottom))


def main() -> int:
    args = parse_args()
    registry = load_registry(args.registry)
    sources = parse_sources(args.source)
    args.out_dir.mkdir(parents=True, exist_ok=True)

    opened: dict[str, fitz.Document] = {}
    output_manifest: list[dict] = []
    missing_sources: set[str] = set()

    try:
        for item in registry:
            if args.scope == "exact" and item.get("artScope") == "group-supplement":
                continue

            source_id = item["sourceId"]
            pdf_path = sources.get(source_id)
            if not pdf_path:
                missing_sources.add(source_id)
                continue

            document = opened.get(source_id)
            if document is None:
                document = fitz.open(pdf_path)
                opened[source_id] = document

            page = int(item["page"])
            if page < 1 or page > document.page_count:
                raise RuntimeError(
                    f"{item['id']}: page {page} outside {pdf_path.name} "
                    f"(1..{document.page_count})"
                )

            image = crop_page(
                document,
                page,
                item["cropNormalized"],
                args.dpi,
            )

            structure_part = item.get("structureId") or "group"
            filename = (
                safe_name(structure_part)
                + "__"
                + safe_name(item["id"])
                + ".webp"
            )
            output_path = args.out_dir / filename
            image.save(output_path, "WEBP", quality=92, method=6)

            output_manifest.append(
                {
                    "id": item["id"],
                    "sourceId": source_id,
                    "page": page,
                    "artScope": item["artScope"],
                    "structureId": item.get("structureId"),
                    "structureIds": item.get("structureIds"),
                    "output": str(output_path),
                }
            )
    finally:
        for document in opened.values():
            document.close()

    manifest_path = args.out_dir / "extracted-source-art.json"
    manifest_path.write_text(
        json.dumps(output_manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(
        f"Extracted {len(output_manifest)} artwork crop(s) to {args.out_dir}. "
        f"Manifest: {manifest_path}"
    )

    if missing_sources:
        print(
            "Skipped sourceId(s) without local PDF mapping: "
            + ", ".join(sorted(missing_sources)),
            file=sys.stderr,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
