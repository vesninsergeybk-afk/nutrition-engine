#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
from pathlib import Path, PurePosixPath

from runtime_inventory import compute as compute_runtime

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / ".cloudflare" / "dist"

# Cloudflare Static Assets must never expose server-side PHP or project-internal
# material. The runtime inventory remains the source of truth for browser files,
# while server-only API paths are intentionally omitted here.
BLOCKED_TOP_LEVEL = {
    ".github",
    "_source_metadata",
    "api",
    "node_modules",
    "quality",
    "release",
    "reports",
    "tests",
    "tools",
    "validation",
}
BLOCKED_ROOT_FILES = {
    ".gitattributes",
    ".gitignore",
    ".htaccess",
    "hosting-check.html",
    "index-v5.3.208.html",
    "index-v5.3.209.html",
    "index-v5.3.210.html",
    "package-lock.json",
    "package.json",
    "playwright.config.cjs",
    "release-manifest.json",
    "requirements-stage5a-hosting.txt",
    "wrangler.jsonc",
}
REQUIRED_PUBLIC = {
    "_headers",
    "index.html",
    "privacy.html",
    "robots.txt",
    "security.html",
}


def is_server_only(rel: str) -> bool:
    return PurePosixPath(rel).parts[:1] == ("api",)


def is_blocked(rel: str) -> bool:
    p = PurePosixPath(rel)
    if not p.parts:
        return True
    if p.parts[0] in BLOCKED_TOP_LEVEL:
        return True
    if len(p.parts) == 1 and rel in BLOCKED_ROOT_FILES:
        return True
    lowered = rel.lower()
    if "gemini-secret" in lowered or "reference_answer_key_private" in lowered:
        return True
    return False


def main() -> None:
    runtime_files, missing = compute_runtime()

    # The public Git repository intentionally omits api/gemini-secret.php, and
    # the first Cloudflare deployment intentionally omits the entire PHP API.
    # Missing browser-side files are still fatal.
    missing_browser = sorted(rel for rel in missing if not is_server_only(rel))
    if missing_browser:
        raise SystemExit(
            "Cloudflare build aborted: browser runtime closure is incomplete: "
            + ", ".join(missing_browser)
        )

    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True, exist_ok=True)

    copied = []
    omitted = []
    for rel in runtime_files:
        if is_blocked(rel):
            omitted.append(rel)
            continue
        src = ROOT / rel
        if not src.is_file():
            raise SystemExit(f"Cloudflare build aborted: expected browser runtime file is missing: {rel}")
        dst = OUT / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        copied.append(rel)

    security_txt = ROOT / ".well-known" / "security.txt"
    if security_txt.is_file():
        dst = OUT / ".well-known" / "security.txt"
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(security_txt, dst)
        copied.append(".well-known/security.txt")

    missing_public = sorted(rel for rel in REQUIRED_PUBLIC if not (OUT / rel).is_file())
    if missing_public:
        raise SystemExit(
            "Cloudflare build aborted: required public files were not produced: "
            + ", ".join(missing_public)
        )

    # Fail closed if server-side code or known private artifacts enter the
    # directory that Cloudflare will serve publicly.
    unsafe = []
    for path in OUT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(OUT).as_posix()
        lowered = rel.lower()
        if (
            path.suffix.lower() == ".php"
            or "gemini-secret" in lowered
            or "reference_answer_key_private" in lowered
        ):
            unsafe.append(rel)
    if unsafe:
        raise SystemExit(
            "Cloudflare build aborted: unsafe static files detected: "
            + ", ".join(sorted(unsafe))
        )

    result = {
        "ok": True,
        "output": OUT.relative_to(ROOT).as_posix(),
        "copied_files": len(set(copied)),
        "server_only_runtime_files_omitted": len(set(omitted) | set(missing)),
        "gemini_api_migrated": False,
        "note": "Static calculator is deployable; PHP Gemini endpoints are intentionally not published.",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
