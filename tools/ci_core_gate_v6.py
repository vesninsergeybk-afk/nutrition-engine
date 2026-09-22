#!/usr/bin/env python3
"""Canonical V6 CI core gate.

Runs only calculation, normative, provenance, validation, integrity and security
checks that remain valid for the current V6 needs-checkpoint hosting tree.
Legacy UI architecture/version/evidence checks stay outside this blocking gate.
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
    ("validation_policy_generated", [PY, "tools/generate_validation_package.py", "--check", "--json-out", "reports/p2-0-generation-check.json"]),
    ("validation_readiness_analytics", [PY, "tools/analyze_validation_readiness.py", "--json-out", "reports/p2-0-analytics.json"]),
    ("validation_readiness", ["node", "tests/p2-0-validation-readiness.test.js"]),
    ("external_evidence_gate", [PY, "tests/p2-0-external-evidence-gate.test.py"]),
    ("ux_contract_generated", [PY, "tools/generate_ux_contract.py", "--check", "--json-out", "reports/p1-5-generation-check.json"]),
    ("formula_registry_generated", [PY, "tools/generate_formula_registry.py", "--check", "--json-out", "reports/p1-4-generation-check.json"]),
    ("formula_registry_analytics", [PY, "tools/analyze_formula_registry.py", "--json-out", "reports/p1-4b-analytics.json"]),
    ("formula_registry", ["node", "tests/p1-4-formula-registry.test.js"]),
    ("hei2020_hf3", ["node", "tests/hei2020-hf3.test.js"]),
    ("product_provenance_generated", [PY, "tools/generate_product_provenance.py", "--check", "--json-out", "reports/p1-3-generation-check.json"]),
    ("product_provenance_analytics", [PY, "tools/analyze_product_provenance.py", "--json-out", "reports/p1-3b-analytics.json"]),
    ("product_provenance", ["node", "tests/p1-3-product-provenance.test.js"]),
    ("normative_registry_generated", [PY, "tools/generate_normative_registry.py", "--check"]),
    ("normative_registry", ["node", "tests/p1-2-normative-registry.test.js"]),
    ("runtime_inventory", [PY, "tools/runtime_inventory.py", "--json-out", "reports/runtime-inventory.json"]),
    ("static_integrity", [PY, "tools/static_checks.py", "--json-out", "reports/static-checks.json"]),
    ("low_weight", ["node", "tests/p0-2-low-weight-safety.test.js"]),
    ("protected_modes", ["node", "tests/p0-3-protected-modes.test.js"]),
    ("legacy_fail_closed", ["node", "tests/p0-3-legacy-fail-closed.test.js"]),
    ("clinical_revalidation", ["node", "tests/p0-3-2-1-independent-revalidation.test.js"]),
    ("server_guard", ["php", "tests/p0-4-api-cost-abuse-guard.test.php"]),
    ("cross_process", ["node", "tests/p0-4-cross-process-guard.test.js"]),
    ("client_guard", ["node", "tests/p0-4-client-guard-stability.test.js"]),
    ("http_csrf", [PY, "tests/p0-4-1-http-session-csrf.test.py"]),
    ("storage_policy", [PY, "tests/p0-4-1-storage-policy.test.py"]),
    ("hosting_check", ["node", "tests/p0-4-1-hosting-check.test.js"]),
]


def run_suite(name: str, command: list[str]) -> dict:
    print(f"[START] {name}", flush=True)
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
    print(f"[{name}] {status} ({elapsed:.1f}s)", flush=True)
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
        "gate": "canonical-v6-core",
        "ok": not failed,
        "suite_count": len(results),
        "failed_count": len(failed),
        "failed": failed,
        "seconds": round(time.monotonic() - started, 3),
        "results": results,
        "excluded_legacy_contracts": [
            "stage-4/stage-5A UI architecture assertions",
            "historical hard-coded release-version assertions",
            "evidence tests requiring pre-existing browser report files",
            "privileged local Apache ownership test",
            "Python Playwright DOM regression duplicated by the current browser matrix",
            "runtime generator/consolidation assertions for superseded hosting packaging",
        ],
    }
    (REPORTS / "ci-core-gate-v6.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps({k: summary[k] for k in ("gate", "ok", "suite_count", "failed_count", "failed", "seconds")}, ensure_ascii=False, indent=2))
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
