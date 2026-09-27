# BodyParts3D muscle coverage

This audit separates three different situations that previously looked identical in the UI:

1. a muscle is present in BodyParts3D 4.0 and correctly classified;
2. a muscle is present in 4.0 but mislabeled as another system (for example `skeletal` or `connective`);
3. the 4.0 atlas truly lacks that FMA mesh and a registered BodyParts3D 3.0 supplement is required.

## Current verified coverage

- Historical BodyParts3D 3.0 muscle tree checked: **293** FMA muscle meshes.
- Those FMA IDs genuinely absent from the pinned 4.0 atlas across **all** atlas systems: **49**.
- Independent registered facial pack adds additional confirmed 3.0 muscles that are also absent from 4.0.
- Confirmed missing union: **65 distinct muscle FMA IDs**.
- Registered in the trainer: **65 / 65**.
- Confirmed unresolved gaps in the audited sets: **0**.

The complete machine-readable inventory is `bodyparts-muscle-coverage.json`.

## Registration used for supplements

- Trunk: BodyParts3D 3.0 -> 4.0 registration checked against shared trunk structures.
- Face: similarity registration using mandible, frontal bone and maxilla; independent held-out maxilla surface error is about 0.26 mm.
- Foot: separate right/left similarity registration fitted to talus, calcaneus and five metatarsals. Fitted bone-center RMS is about 0.91-0.95 mm; held-out neighboring muscle-center checks are approximately 0.93-4.52 mm.

No missing muscle is added merely because its name is absent from the `muscular` system. FMA identity is checked across the entire 4.0 atlas first, which prevents duplicates of muscles that BodyParts3D mislabeled as `skeletal` or `connective`.
