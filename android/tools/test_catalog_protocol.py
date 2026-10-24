#!/usr/bin/env python3
"""Reproducible publisher tests; no network or Android SDK required."""
import copy
import gzip
import json
import unittest

from catalog_protocol import assemble_catalog, validate_products, sha256, manifest_bytes


class CatalogProtocolTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.json_bytes, release = assemble_catalog()
        cls.manifest = release["manifest"]
        cls.gzip_bytes = release["archive"]
        cls.products = json.loads(cls.json_bytes)

    def test_data_and_manifest_are_reproducible(self):
        again, release = assemble_catalog()
        self.assertEqual(again, self.json_bytes)
        self.assertEqual(release["archive"], self.gzip_bytes)
        self.assertEqual(release["manifest"], self.manifest)
        self.assertEqual(gzip.decompress(self.gzip_bytes), self.json_bytes)
        self.assertEqual(sha256(self.json_bytes), self.manifest["jsonSha256"])
        self.assertEqual(sha256(self.gzip_bytes), self.manifest["gzipSha256"])
        self.assertEqual(len(self.products), self.manifest["productCount"])

    def test_reviewed_catalog_contains_all_1121_foods(self):
        self.assertEqual(len(self.products), 1121)
        self.assertEqual(self.manifest["origin"]["supplementalCount"], 16)
        cherry = next(p for p in self.products if p["key"] == "cherry")
        self.assertEqual(cherry["source_id"], "USDA_FDC_SR:171719")
        self.assertEqual(cherry["name_ru"], "Черешня, свежая (сырая)")
        self.assertEqual(len({p["key"] for p in self.products}), 1121)

    def test_dairy_products_are_retail_label_plus_explicitly_modelled_micros(self):
        records = [p for p in self.products if p.get("source_id", "").startswith("PEREKRESTOK_SKU:")]
        self.assertEqual(len(records), 10)
        for p in records:
            self.assertEqual(len(set(sum(p["nutrient_provenance_v1_3"].values(), []))), 33)
            self.assertEqual(p["data_quality_v1_3"]["confidence_tier"], "LOW")
            self.assertEqual(len(p["nutrient_provenance_v1_3"]["LABEL"]), 4)

    def test_validation_rejects_missing_nutrient(self):
        row = copy.deepcopy(self.products[0])
        row.pop("vitamin_b12_mcg")
        with self.assertRaisesRegex(ValueError, "vitamin_b12_mcg"):
            validate_products([row])

    def test_validation_rejects_duplicate_key(self):
        with self.assertRaisesRegex(ValueError, "duplicate"):
            validate_products([self.products[0], self.products[0]])

    def test_validation_rejects_unknown_as_zero_without_provenance(self):
        row = copy.deepcopy(self.products[0])
        row["nutrient_provenance_v1_3"] = {}
        with self.assertRaisesRegex(ValueError, "provenance"):
            validate_products([row])


if __name__ == "__main__":
    unittest.main()
