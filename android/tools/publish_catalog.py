#!/usr/bin/env python3
"""Prepare or verify the public, hash-addressed Nutrient catalog release.

The release files can be committed to the public GitHub repository. No secrets
or personal user data are used. Run --check in CI to detect stale manifests.
"""
from __future__ import annotations

import argparse
import json
from catalog_protocol import CATALOG_DIR, assemble_catalog, manifest_bytes


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    data, release = assemble_catalog()
    manifest = release["manifest"]
    files = {
        CATALOG_DIR / "latest.json": manifest_bytes(manifest),
        CATALOG_DIR / manifest["archive"]: release["archive"],
    }
    if not args.check:
        CATALOG_DIR.mkdir(parents=True, exist_ok=True)
    for path, contents in files.items():
        if path.exists() and path.read_bytes() == contents:
            continue
        if args.check:
            raise SystemExit(f"Outdated/missing published catalog: {path}")
        if path.exists() and path.name != "latest.json":
            raise SystemExit("Refusing to overwrite a content-addressed catalog")
        path.write_bytes(contents)
    print(json.dumps({"ok": True, "version": manifest["version"],
                      "products": manifest["productCount"],
                      "json_bytes": len(data),
                      "gzip_bytes": len(release["archive"])}))


if __name__ == "__main__":
    main()
