#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
from collections import Counter
from pathlib import Path

GATE_ISSUE = "PROVENANCE_METHOD_SCHEMA_GATE"


def load_json(path: str):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--proposals", required=True)
    ap.add_argument("--production-policy", required=True)
    ap.add_argument("--contract", required=True)
    ap.add_argument("--out-dir", required=True)
    args = ap.parse_args()

    proposals = load_json(args.proposals)
    production_policy = load_json(args.production_policy)
    contract = load_json(args.contract)
    out = Path(args.out_dir)
    out.mkdir(parents=True, exist_ok=True)

    fields = list(production_policy["nutrient_fields"])
    allowed = set(contract["allowed_resolved_methods"])
    assert len(fields) == contract["canonical_nutrient_count"] == 33
    assert contract["production_policy_changed"] is False
    assert contract["production_enablement"] is False
    assert "SOURCE_REPORTED" not in set(production_policy["nutrient_methods"])

    resolved = []
    errors = []
    method_counts = Counter()
    remaining_issue_counts = Counter()
    status_counts = Counter()

    for proposal in proposals:
        x = copy.deepcopy(proposal)
        family = x["family_key"]
        nutrients = x.get("nutrients") or {}
        pre = x.get("nutrient_provenance_import_v15") or {}
        missing_declared = set(x.get("missing_nutrients") or [])

        if set(nutrients.keys()) != set(fields):
            errors.append(f"{family}:nutrient_key_set")

        if GATE_ISSUE not in set(x.get("issues") or []):
            errors.append(f"{family}:missing_expected_gate_issue")

        resolved_detail = {}
        for field in fields:
            value = nutrients.get(field)
            meta = pre.get(field) or {}
            input_method = meta.get("method")

            if value is None:
                method = "MISSING"
                if field not in missing_declared:
                    errors.append(f"{family}:{field}:null_not_declared_missing")
                detail = {
                    "method": method,
                    "reason": "source_value_absent",
                }
            elif field == "added_sugar" and input_method == "ASSUMED_ZERO":
                if float(value) != 0.0:
                    errors.append(f"{family}:{field}:assumed_zero_nonzero")
                method = "ASSUMED_ZERO"
                detail = {
                    "method": method,
                    "reason": meta.get("reason") or "plain_single_ingredient_identity",
                }
            elif field == "salt":
                sodium = nutrients.get("sodium_mg")
                if sodium is None:
                    errors.append(f"{family}:{field}:salt_present_sodium_missing")
                else:
                    expected = float(sodium) * 2.54 / 1000.0
                    if abs(float(value) - expected) > 1e-9:
                        errors.append(f"{family}:{field}:salt_formula")
                method = "CALCULATED"
                detail = {
                    "method": method,
                    "formula": "sodium_mg*2.54/1000",
                    "source_registry_id": meta.get("source_registry_id"),
                    "source_record_id": meta.get("source_record_id"),
                }
            elif field == "unsat":
                method = "CALCULATED"
                detail = {
                    "method": method,
                    "formula": "source_MUFA_plus_PUFA",
                    "source_registry_id": meta.get("source_registry_id"),
                    "source_record_id": meta.get("source_record_id"),
                }
            else:
                if input_method != "SOURCE_REPORTED_COMPAT":
                    errors.append(f"{family}:{field}:unexpected_input_method:{input_method}")
                registry = meta.get("source_registry_id")
                record = meta.get("source_record_id")
                if not registry or record in (None, ""):
                    errors.append(f"{family}:{field}:missing_source_identity")
                if float(value) == 0.0:
                    method = "SOURCE_REPORTED_ZERO"
                else:
                    method = "SOURCE_REPORTED"
                detail = {
                    "method": method,
                    "source_registry_id": registry,
                    "source_record_id": str(record) if record is not None else None,
                    "claim_scope": "official_source_row_value_only",
                }

            if method not in allowed:
                errors.append(f"{family}:{field}:method_not_allowed:{method}")
            method_counts[method] += 1
            resolved_detail[field] = detail

        if set(resolved_detail.keys()) != set(fields):
            errors.append(f"{family}:resolved_key_set")

        remaining = [i for i in (x.get("issues") or []) if i != GATE_ISSUE]
        for issue in remaining:
            remaining_issue_counts[issue] += 1

        after = "READY_FOR_NEXT_STAGING_GATE" if not remaining else "BLOCKED_OTHER_GATES"
        status_counts[after] += 1

        x["step4b_provenance_policy_version"] = contract["policy_version"]
        x["nutrient_provenance_resolved_v15"] = resolved_detail
        x["issues_after_step4b"] = remaining
        x["status_after_step4b"] = after
        resolved.append(x)

    # Cross-proposal invariants.
    if len(resolved) != 89:
        errors.append(f"proposal_count:{len(resolved)}")
    if len({x["family_id"] for x in resolved}) != len(resolved):
        errors.append("duplicate_family_id")
    if len({x["product_key_proposed"] for x in resolved}) != len(resolved):
        errors.append("duplicate_product_key")

    # No value mutation is permitted in 4B.
    for before, after in zip(proposals, resolved):
        if before.get("nutrients") != after.get("nutrients"):
            errors.append(f"{before['family_key']}:nutrient_value_drift")

    # Null semantics: every null is MISSING and every non-null is not MISSING.
    for x in resolved:
        for field in fields:
            value = x["nutrients"].get(field)
            method = x["nutrient_provenance_resolved_v15"][field]["method"]
            if (value is None) != (method == "MISSING"):
                errors.append(f"{x['family_key']}:{field}:null_method_mismatch")
            if method == "SOURCE_REPORTED_ZERO" and float(value) != 0.0:
                errors.append(f"{x['family_key']}:{field}:source_zero_nonzero")
            if method == "SOURCE_REPORTED" and float(value) == 0.0:
                errors.append(f"{x['family_key']}:{field}:reported_nonzero_is_zero")

    total_classified = sum(method_counts.values())
    expected_total = len(resolved) * len(fields)
    if total_classified != expected_total:
        errors.append(f"classification_count:{total_classified}!={expected_total}")

    report = {
        "schema_version": 1,
        "policy_version": contract["policy_version"],
        "step": "4B",
        "status": "PASS" if not errors else "FAIL",
        "proposals": len(resolved),
        "nutrients_per_proposal": len(fields),
        "total_nutrient_classifications": total_classified,
        "method_counts": dict(sorted(method_counts.items())),
        "status_after_step4b": dict(sorted(status_counts.items())),
        "remaining_issue_counts": dict(sorted(remaining_issue_counts.items())),
        "provenance_gate_remaining": sum(
            GATE_ISSUE in set(x.get("issues_after_step4b") or []) for x in resolved
        ),
        "nutrient_values_changed": False,
        "null_to_zero_coercion": False,
        "production_policy_changed": False,
        "production_main_changed": False,
        "errors": errors,
    }

    (out / "import_proposals_v15_step4b.json").write_text(
        json.dumps(resolved, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (out / "step4b_provenance_gate_report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
