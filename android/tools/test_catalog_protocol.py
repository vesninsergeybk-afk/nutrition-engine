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

    def test_reviewed_catalog_contains_all_1164_foods(self):
        self.assertEqual(len(self.products), 1164)
        self.assertEqual(self.manifest["origin"]["supplementalCount"], 59)
        cherry = next(p for p in self.products if p["key"] == "cherry")
        self.assertEqual(cherry["source_id"], "USDA_FDC_SR:171719")
        self.assertEqual(cherry["name_ru"], "Черешня, свежая (сырая)")
        self.assertEqual(len({p["key"] for p in self.products}), 1164)

    def test_dairy_products_are_retail_label_plus_explicitly_modelled_micros(self):
        records = [p for p in self.products if p.get("source_id", "").startswith("PEREKRESTOK_SKU:")]
        self.assertEqual(len(records), 53)
        for p in records:
            self.assertEqual(len(set(sum(p["nutrient_provenance_v1_3"].values(), []))), 33)
            self.assertEqual(p["data_quality_v1_3"]["confidence_tier"], "LOW")
            self.assertEqual(len(p["nutrient_provenance_v1_3"]["LABEL"]), 4)
            self.assertEqual(p.get("barcode"), None)

    def test_new_dairy_fat_variants_and_mislabelled_legacy_records(self):
        records = {p["key"]: p for p in self.products}
        expected = {
            "pervyy_vkus_kefir_0_pct_500ml": 0.1,
            "agrokompleks_kefir_1_5_pct_400g": 1.5,
            "molochnyy_znak_kefir_2_5_pct_900g": 2.5,
            "vkusnoteevo_kefir_3_2_pct_900g": 3.2,
            "gorodetskiy_bifido_kefir_3_5_pct_400g": 3.5,
            "molochnyy_znak_curd_0_5_pct_180g": 0.5,
            "prost_curd_1_8_pct_180g": 1.8,
            "vyatushka_curd_3_pct_200g": 3,
            "svetaevo_soft_curd_0_5_pct_150g": 0.5,
            "parmalat_cream_11_pct_200g": 11,
            "sheksninskiy_cream_15_pct_470g": 15,
            "krestyanskoe_butter_72_5_pct_180g": 72.5,
            "nytvenskiy_sandwich_butter_61_5_pct_175g": 61.5,
            "minskaya_marka_soft_curd_4_pct_400g": 4,
            "karat_plus_grainy_curd_4_pct_200g": 4,
            "vkusnyy_den_sweet_curd_raisins_9_pct_180g": 9,
            "polyanka_sweet_curd_raisins_16_5_pct_250g": 16.5,
            "sovetskie_traditsii_glazed_curd_vanilla_5_pct_45g": 11,
            "svitlogorye_glazed_curd_vanilla_16_pct_40g": 20,
            "asenevskaya_ferma_ayran_2_pct_330g": 2,
            "pestravka_ryazhenka_strawberry_2_2_pct_270g": 2.2,
        }
        for key, fat in expected.items():
            self.assertAlmostEqual(records[key]["fat_per_100g"], fat)
        for key in ("kefir_3_2_pct", "curd_5_pct", "curd_9_pct",
                    "cream_10_pct", "cream_20_pct", "sour_cream_15_pct",
                    "sour_cream_20_pct"):
            self.assertIn("справочный состав", records[key]["name_ru"])
        self.assertEqual(records["krestyanskoe_butter_72_5_pct_180g"]["category"], "Oils & Fats")
        for key in ("alexandrov_glazed_curd_vanilla_26_pct_50g",
                    "vkusnoteevo_sweet_curd_mass_vanilla_20_pct_180g",
                    "sovetskie_traditsii_glazed_curd_vanilla_5_pct_45g",
                    "pestravka_ryazhenka_strawberry_2_2_pct_270g"):
            row = records[key]
            self.assertGreater(row["added_sugar"], 0)
            self.assertIn("added_sugar", row["nutrient_provenance_v1_3"]["CALCULATED"])

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
