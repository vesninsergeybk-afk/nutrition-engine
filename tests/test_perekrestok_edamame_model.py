"""Check the proposed frozen edamame model before any runtime publication."""

import json
import math
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODEL = ROOT / "data/catalog-reviews/proposed-edamame-frozen-sr-mixed-2026-10-24.json"
POLICY = ROOT / "config/product-provenance-policy.v5.3.210-p1.3.json"


class EdamameModelTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.p = json.loads(MODEL.read_text(encoding="utf-8"))
        cls.fields = set(json.loads(POLICY.read_text(encoding="utf-8"))["nutrient_fields"])

    def test_complete_numeric_profile_and_unique_attribution(self):
        p = self.p
        values = p["nutrients_per_100g"]
        classified = [field for fields in p["nutrient_provenance"].values() for field in fields]
        self.assertEqual(self.fields, set(values))
        self.assertEqual(self.fields, set(classified))
        self.assertEqual(len(classified), len(set(classified)))
        self.assertTrue(all(isinstance(n, (int, float)) and math.isfinite(n) and n >= 0
                            for n in values.values()))

    def test_explicit_state_and_donor(self):
        p = self.p
        self.assertEqual("frozen", p["state"])
        self.assertEqual("USDA_FDC_SR:168410", p["primary_source"]["id"])
        self.assertEqual("USDA_FDC_SR:168411", p["completion_source"]["id"])
        self.assertEqual({"selenium_ug", "vitamin_a_mcg"},
                         set(p["completion_source"]["fields"]))
        self.assertEqual({"sfa", "unsat"}, set(p["nutrient_provenance"]["IMPUTED"]))
        self.assertEqual({"added_sugar", "vitamin_d_mcg", "vitamin_b12_mcg"},
                         set(p["nutrient_provenance"]["ASSUMED_ZERO"]))

    def test_fatty_acid_proxy_is_explicitly_scaled(self):
        v = self.p["nutrients_per_100g"]
        self.assertAlmostEqual(v["sfa"], 0.62 * 4.73 / 5.2, places=4)
        self.assertAlmostEqual(v["unsat"], (1.282 + 2.156) * 4.73 / 5.2, places=4)
        self.assertLessEqual(v["sfa"] + v["unsat"], v["fat_per_100g"])

    def test_missing_and_assumed_are_not_claimed_measured(self):
        p = self.p
        self.assertEqual("PROPOSED_MODEL_NOT_PUBLISHED_REQUIRES_REVIEW", p["status"])
        self.assertIn("NOT_READY_FOR_CANONICAL_PRODUCT_DATABASE", p["review_flags"])
        self.assertIn("HEI_EQUIVALENTS_NOT_CALIBRATED", p["review_flags"])
        self.assertNotIn("MEASURED", p["nutrient_provenance"])
        self.assertNotIn("LABEL", p["nutrient_provenance"])


if __name__ == "__main__":
    unittest.main()
