#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
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


VERSION_TOKEN_RE = re.compile(r"(\\?v=)[^\"'\\s)]+")


def compute_deploy_token(paths: list[str]) -> str:
    """Return a content-derived token for the complete public runtime closure."""
    digest = hashlib.sha256()
    for rel in sorted(set(paths)):
        src = ROOT / rel
        if not src.is_file() or is_blocked(rel):
            continue
        digest.update(rel.encode("utf-8"))
        digest.update(b"\\0")
        digest.update(hashlib.sha256(src.read_bytes()).digest())
    return digest.hexdigest()[:16]


def rewrite_version_tokens(path: Path, token: str) -> int:
    text = path.read_text(encoding="utf-8")
    rewritten, count = VERSION_TOKEN_RE.subn(lambda match: match.group(1) + token, text)
    if count:
        path.write_text(rewritten, encoding="utf-8")
    return count


def apply_deploy_cache_bust(token: str) -> int:
    """Make every browser entry point refer to one content-derived asset version."""
    targets = list(OUT.rglob("*.html"))
    runtime_dir = OUT / "assets" / "runtime"
    if runtime_dir.is_dir():
        targets.extend(runtime_dir.glob("runtime-manifest-*.js"))

    rewritten_refs = 0
    for path in targets:
        rewritten_refs += rewrite_version_tokens(path, token)

    stale = []
    for path in targets:
        text = path.read_text(encoding="utf-8")
        for match in VERSION_TOKEN_RE.finditer(text):
            value = match.group(0).split("=", 1)[1]
            if value != token:
                stale.append(f"{path.relative_to(OUT).as_posix()}:{value}")
    if stale:
        raise SystemExit(
            "Cloudflare build aborted: stale asset version tokens remain: "
            + ", ".join(stale[:20])
        )
    return rewritten_refs


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

    deploy_token = compute_deploy_token(runtime_files)
    rewritten_version_refs = apply_deploy_cache_bust(deploy_token)

    missing_public = sorted(rel for rel in REQUIRED_PUBLIC if not (OUT / rel).is_file())
    if missing_public:
        raise SystemExit(
            "Cloudflare build aborted: required public files were not produced: "
            + ", ".join(missing_public)
        )

    # Publishing the HTML without the APK update feed would leave Android
    # installs unable to discover new products. Verify the deployed closure.
    feed_root = OUT / "updates" / "catalog" / "v1"
    feed_manifest_path = feed_root / "manifest.json"
    if not feed_manifest_path.is_file():
        raise SystemExit("Cloudflare build aborted: APK catalog manifest not deployed")
    try:
        feed_manifest = json.loads(feed_manifest_path.read_text(encoding="utf-8"))
        overlay_rel = PurePosixPath(feed_manifest["overlay_path"])
        if (overlay_rel.is_absolute() or len(overlay_rel.parts) != 2
                or overlay_rel.parts[0] != "revisions"
                or not overlay_rel.name.endswith(".json")
                or ".." in overlay_rel.parts):
            raise ValueError("unsafe catalog overlay_path")
        feed_data = (feed_root / overlay_rel.as_posix()).read_bytes()
        if len(feed_data) != feed_manifest["overlay_bytes"]:
            raise ValueError("catalog overlay byte length mismatch")
        if hashlib.sha256(feed_data).hexdigest() != feed_manifest["overlay_sha256"]:
            raise ValueError("catalog overlay SHA-256 mismatch")
        overlay = json.loads(feed_data)
        if (feed_manifest.get("schema") != "nutrient-catalog-manifest/v1"
                or overlay.get("schema") != "nutrient-catalog-overlay/v1"
                or overlay.get("revision") != feed_manifest.get("current_revision")
                or overlay.get("expected_merged_count") != feed_manifest.get("expected_merged_count")):
            raise ValueError("catalog update schema/revision mismatch")
    except (ValueError, KeyError, TypeError, OSError) as error:
        raise SystemExit("Cloudflare build aborted: invalid APK catalog feed: " + str(error))

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
        "deploy_cache_token": deploy_token,
        "rewritten_version_refs": rewritten_version_refs,
        "note": "Static calculator is deployable; browser asset URLs are content-versioned and PHP Gemini endpoints are intentionally not published.",
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
