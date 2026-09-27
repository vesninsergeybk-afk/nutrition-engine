# BodyParts3D muscle coverage audit

This comparison is one reproducible coverage index for supplemental BodyParts3D muscle geometry. It is supplemented by independently verified regional packs because a single historical GitHub mirror does not enumerate every usable 3.0 muscle mesh.

- BodyParts3D 3.0 muscle meshes indexed: **292**
- Same FMA muscle IDs represented in the pinned BodyParts3D 4.0 atlas: **243**
- Real BodyParts3D 3.0 muscle meshes missing from that 4.0 atlas: **49**

A missing 4.0 mesh is not treated as anatomically absent. Supplemental geometry keeps its source version, registration method and license metadata.

## Priority gaps

- FMA46836 — left buccinator
- FMA13893 — left internal oblique
- FMA13359 — left latissimus dorsi
- FMA13378 — left rectus abdominis
- FMA46840 — left risorius
- FMA49008 — left temporalis
- FMA22345 — left transversus abdominis
- FMA46813 — left zygomaticus major
- FMA46815 — left zygomaticus minor
- FMA46841 — orbicularis oris
- FMA46835 — right buccinator
- FMA13892 — right internal oblique
- FMA13358 — right latissimus dorsi
- FMA13377 — right rectus abdominis
- FMA46839 — right risorius
- FMA49007 — right temporalis
- FMA22344 — right transversus abdominis
- FMA46812 — right zygomaticus major
- FMA46814 — right zygomaticus minor

The machine-readable mirror comparison is in `bodyparts-muscle-coverage.json`. Independently verified facial and trunk packs expand the confirmed missing set beyond the mirror-only count. Current confirmed union: **65 distinct BodyParts3D 3.0 muscle FMA IDs absent from the pinned 4.0 atlas**. Two extensor digitorum brevis meshes remain intentionally disabled until foot-specific registration is checked.
