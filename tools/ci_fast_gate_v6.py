#!/usr/bin/env python3
"""Fast feedback gate for active/draft pull requests.

This intentionally does not replace the canonical full release gate. It catches the
high-value structural failures that commonly make later browser/full gates pointless,
while keeping feedback short enough for iterative work:
- runtime closure / missing files;
- static syntax, HTML integrity, permissions and secret scan;
- client guard stability;
- hosting closure.

The full core + browser + accessibility matrix still runs when a PR is marked ready
for review, on main, and on manual full runs.
"""

from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parents[1]
REPORTS = ROOT / "reports"
REPORTS.mkdir(exist_ok=True)
PY = sys.executable

SUITES = [
    ("runtime_inventory", [PY, "tools/runtime_inventory.py", "--json-out", "reports/runtime-inventory-fast.json"]),
    ("static_integrity", [PY, "tools/static_checks.py", "--json-out", "reports/static-checks-fast.json"]),
    ("client_guard", ["node", "tests/p0-4-client-guard-stability.test.js"]),
    ("hosting_check", ["node", "tests/p0-4-1-hosting-check.test.js"]),
    ("release1_navigation_context", ["node", "tests/release1-navigation-context-static.test.js"]),
]


def run_suite(name: str, command: list[str]) -> dict:
    print(f"[FAST START] {name}", flush=True)
    started = time.monotonic()
    proc = subprocess.run(
        command,
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    elapsed = round(time.monotonic() - started, 3)
    output = proc.stdout or ""
    if output:
        print(output, end="" if output.endswith("\n") else "\n")
    status = "PASS" if proc.returncode == 0 else "FAIL"
    print(f"[FAST {name}] {status} ({elapsed:.1f}s)", flush=True)
    return {
        "name": name,
        "status": status,
        "returncode": proc.returncode,
        "seconds": elapsed,
        "command": command,
    }


def main() -> int:
    started = time.monotonic()
    results = [run_suite(name, command) for name, command in SUITES]
    failed = [row["name"] for row in results if row["status"] != "PASS"]
    summary = {
        "schema_version": 1,
        "gate": "v6-fast-feedback",
        "purpose": "iterative draft-PR feedback; not a release substitute",
        "ok": not failed,
        "suite_count": len(results),
        "failed_count": len(failed),
        "failed": failed,
        "seconds": round(time.monotonic() - started, 3),
        "results": results,
    }
    (REPORTS / "ci-fast-gate-v6.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(
        {k: summary[k] for k in ("gate", "ok", "suite_count", "failed_count", "failed", "seconds")},
        ensure_ascii=False,
        indent=2,
    ))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
