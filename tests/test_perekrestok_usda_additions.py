"""Validation of reviewed USDA additions without needing the large USDA ZIP."""

import importlib.util
import json
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools/build_perekrestok_sr_legacy_additions.py"
spec = importlib.util.spec_from_file_location("build_perekrestok", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PerekrestokUSDAAdditionsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.snapshot = json.loads((ROOT / "data/catalog-reviews/usda-sr-legacy-2026-10-23.json")
                                  .read_text(encoding="utf-8"))
        cls.products = cls.snapshot["products"]
        cls.canonical = []
        for i in range(1, 13):
            path = ROOT / f"data/products.v5.3.210-p1.3.part-{i:02}.json"
            cls.canonical.extend(json.loads(path.read_text(encoding="utf-8")))

    def test_core_untouched_and_keys_distinct(self):
        self.assertEqual(1105, len(self.canonical))
        keys = [p["key"] for p in self.canonical] + [p["key"] for p in self.products]
        self.assertEqual(len(keys), len(set(keys)))

    def test_five_complete_profiles(self):
        self.assertEqual(5, len(self.products))
        self.assertEqual(33, len(module.ALL_NUTRIENTS))
        for product in self.products:
            with self.subTest(product=product["key"]):
                self.assertEqual(set(product["nutrient_provenance_v1_3"]),
                                 {"BORROWED", "CALCULATED", "SOURCE_REPORTED_ZERO", "ASSUMED_ZERO"})
                groups = product["nutrient_provenance_v1_3"]
                classified = [field for fields in groups.values() for field in fields]
                self.assertEqual(set(classified), module.ALL_NUTRIENTS)
                self.assertEqual(len(classified), len(set(classified)))
                self.assertTrue(all(isinstance(product[f], (int, float)) and product[f] >= 0
                                    for f in module.ALL_NUTRIENTS))
                self.assertGreaterEqual(product["carbs_per_100g"] + .1,
                                        product["sugar_per_100g"])
                self.assertLessEqual(product["sfa"] + product["unsat"],
                                     product["fat_per_100g"] + .12)
                self.assertEqual("CONDITIONALLY_ACCEPTED",
                                 product["data_quality_v1_3"]["review_status"])

    def test_all_fields_in_policy(self):
        policy = json.loads((ROOT / "config/product-provenance-policy.v5.3.210-p1.3.json")
                            .read_text(encoding="utf-8"))
        policy_fields = set(policy["nutrient_fields"]) if "nutrient_fields" in policy else None
        if policy_fields is not None:
            self.assertEqual(module.ALL_NUTRIENTS, policy_fields)

    def test_cherry_identity_fixed_not_duplicated(self):
        original = next(p for p in self.canonical if p["key"] == "cherry")
        self.assertEqual("USDA_FDC_SR:171719", original["source_id"])
        self.assertEqual("Вишня (сырая)", original["name_ru"])
        self.assertEqual("prepared", original["state"])
        correction = self.snapshot["existing_record_correction"]
        self.assertEqual(original["source_id"], correction["expected_source_id"])
        self.assertEqual(original["fdc_description"], correction["expected_fdc_description"])
        self.assertEqual("Черешня, свежая (сырая)", correction["name_ru"])
        self.assertEqual("raw", correction["state"])
        self.assertIn("вишня", next(p for p in self.products if p["fdc_id"] == 173954)["search_aliases"])

    def test_deferred_products_are_not_zero_filled(self):
        self.assertEqual({168410, 169699, 172521},
                         {item["fdc_id"] for item in self.snapshot["blocked"]})
        for item in self.snapshot["blocked"]:
            self.assertTrue(item["missing_fields"])
            self.assertEqual("NO_AUTOMATIC_ZERO_FILL", item["review_status"])

    def test_sugar_cannot_exceed_carbohydrates(self):
        base = {"fdcId": 999999, "foodNutrients": [
            {"nutrient": {"id": id_}, "amount": 0} for id_ in module.NUTRIENTS.values()
        ] + [{"nutrient": {"id": id_}, "amount": 0} for id_ in module.FDC_UNSAT]}
        by_id = {v: k for k, v in module.NUTRIENTS.items()}
        for row in base["foodNutrients"]:
            if by_id.get(row["nutrient"]["id"]) == "sugar_per_100g":
                row["amount"] = 20
            if by_id.get(row["nutrient"]["id"]) == "carbs_per_100g":
                row["amount"] = 10
        with self.assertRaisesRegex(ValueError, "Sugars exceed carbs"):
            module.field_values(base)

    def test_browser_bundle_loads_five_and_keeps_existing(self):
        js = ROOT / "assets/data/products-perekrestok-reviewed.v20261023.js"
        original_js = ROOT / "assets/data/products-supplemental.v20261023.js"
        node_code = """
            const fs=require('fs'),vm=require('vm'),assert=require('assert');
            const w={},ctx={window:w};
            vm.runInNewContext(fs.readFileSync(process.argv[1],'utf8'),ctx);
            vm.runInNewContext(fs.readFileSync(process.argv[2],'utf8'),ctx);
            assert.equal(w.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__.length,6);
            assert.equal(w.__NUTRIENT_SUPPLEMENTAL_EXPECTED_COUNT__,6);
            assert.equal(w.__NUTRIENT_PRODUCT_CORRECTIONS__[0].key,'cherry');
            assert.equal(new Set(w.__NUTRIENT_SUPPLEMENTAL_PRODUCTS__.map(x=>x.key)).size,6);
        """
        subprocess.run(["node", "-e", node_code, str(original_js), str(js)],
                       check=True, cwd=ROOT, capture_output=True, text=True)

    def test_front_end_integration_modern_and_legacy(self):
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        compatible_html = (ROOT / "index-v5.3.210.html").read_text(encoding="utf-8")
        self.assertEqual(html, compatible_html, "Both supported HTML entrypoints must stay identical")
        self.assertIn("products-perekrestok-reviewed.v20261023.js", html)
        self.assertLess(html.index("products-supplemental.v20261023.js"),
                        html.index("products-perekrestok-reviewed.v20261023.js"))
        for path in (ROOT / "assets/js/00-runtime-bootstrap-v6.0.0-beta6.js",
                     ROOT / "assets/legacy/js/00-runtime-bootstrap-v6.0.0-beta6.legacy.js"):
            src = path.read_text(encoding="utf-8")
            self.assertIn("__NUTRIENT_PRODUCT_CORRECTIONS__", src)
            self.assertIn("__NUTRIENT_SUPPLEMENTAL_EXPECTED_COUNT__", src)
            self.assertIn("found.fdc_description !== change.expected_fdc_description", src)
            self.assertIn("if (change.state) found.state = change.state", src)
            subprocess.run(["node", "--check", str(path)], check=True, capture_output=True)


if __name__ == "__main__":
    unittest.main()
