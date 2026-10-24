"""Offline safety tests for the manual retailer catalogue intake."""

import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools/audit_perekrestok_catalog.py"
spec = importlib.util.spec_from_file_location("retailer_audit", SCRIPT)
audit_module = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = audit_module
spec.loader.exec_module(audit_module)


class PerekrestokAuditTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.products = audit_module.load_baseline()
        cls.snapshot = json.loads((ROOT / "data/catalog-reviews/perekrestok-2026-10-23.sample.json").read_text(encoding="utf-8"))
        cls.report = audit_module.audit(cls.snapshot, cls.products)
        cls.by_sku = {x["sku"]: x for x in cls.report["results"]}

    def test_baseline_is_canonical(self):
        self.assertEqual(len(self.products), 1105)
        self.assertEqual(self.report["sampled_sku_count"], 14)
        self.assertEqual(self.report["distinct_target_variants"], 13)

    def test_curd_two_percent_not_confused_with_grainy(self):
        candidate = self.by_sku["4121611"]
        self.assertEqual(candidate["status"], "MISSING_VARIANT")
        self.assertFalse(candidate["matching_baseline"])
        self.assertNotIn("curd_grain", [p["key"] for p in candidate["related_baseline"]])

    def test_prepared_couscous_does_not_cover_dry(self):
        candidate = self.by_sku["4151856"]
        self.assertEqual(candidate["status"], "MISSING_VARIANT")
        self.assertTrue(any("Кускус" in p["name_ru"] for p in candidate["related_baseline"]))

    def test_frozen_and_cooked_edamame_differ(self):
        self.assertEqual(self.by_sku["4372351"]["status"], "MISSING_VARIANT")

    def test_missing_new_foods(self):
        for sku in ("44173", "4192696", "4192697"):
            self.assertEqual(self.by_sku[sku]["status"], "MISSING_FOOD")

    def test_cherry_is_misnamed_existing_usda_profile(self):
        cherry = self.by_sku["5013"]
        self.assertEqual(cherry["status"], "ALREADY_REPRESENTED_MISNAMED")
        self.assertIn("cherry", cherry["matching_baseline"])
        self.assertEqual("EXISTING_PROFILE_NEEDS_RENAME", cherry["import_eligibility"])

    def test_source_bad_records_are_blocked(self):
        artichoke = self.by_sku["4388857"]
        self.assertIn("ZERO_LABEL_PLACEHOLDER_DO_NOT_IMPORT", artichoke["quality_warnings"])
        self.assertEqual(artichoke["import_eligibility"], "BLOCKED_LABEL_INVALID")
        smetana = self.by_sku["3478958"]
        self.assertIn("FAT_PERCENT_CONFLICT_WITH_LABEL", smetana["quality_warnings"])
        self.assertEqual(smetana["import_eligibility"], "BLOCKED_LABEL_INVALID")

    def test_no_retailer_card_autocompletes_micronutrients(self):
        self.assertTrue(all(x["micronutrients"] == "NOT_PROVIDED_BY_SKU_LABEL" for x in self.report["results"]))
        self.assertTrue(all(x["import_eligibility"] != "READY_TO_IMPORT" for x in self.report["results"]))

    def test_existing_bad_fat_labels_are_detected(self):
        by_key = {x["key"]: x for x in self.report["baseline_fat_label_warnings"]}
        self.assertIn("curd_5_pct", by_key)
        self.assertIn("curd_9_pct", by_key)
        self.assertNotIn("dark_chocolate_70_other", by_key)

    def test_rejects_untrusted_source_url(self):
        sample = json.loads(json.dumps(self.snapshot))
        sample["products"][0]["source_url"] = "https://example.org/other-4121611"
        with self.assertRaises(ValueError):
            audit_module.validate_snapshot(sample)

    def test_proposed_two_percent_curd_has_full_but_honest_provenance(self):
        proposed = json.loads((ROOT / "data/catalog-reviews/proposed-curd-prostokvashino-2pct-2026-10-23.json").read_text(encoding="utf-8"))
        policy = json.loads((ROOT / "config/product-provenance-policy.v5.3.210-p1.3.json").read_text(encoding="utf-8"))
        fields = policy["nutrient_fields"]
        values = proposed["nutrients_per_100g"]
        methods = proposed["nutrient_provenance"]
        classified = [field for group in methods.values() for field in group]
        self.assertEqual(set(fields), set(values))
        self.assertEqual(sorted(fields), sorted(classified))
        self.assertTrue(all(isinstance(value, (int, float)) for value in values.values()))
        self.assertEqual(set(methods["LABEL"]), {"kcal", "protein_per_100g", "fat_per_100g", "carbs_per_100g"})
        for field in fields:
            if values[field] == 0:
                self.assertIn(field, methods["ASSUMED_ZERO"])
        self.assertIn("NOT_READY_FOR_CANONICAL_PRODUCT_DATABASE", proposed["review_flags"])


if __name__ == "__main__":
    unittest.main()
