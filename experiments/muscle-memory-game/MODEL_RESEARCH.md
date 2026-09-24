# External anatomy model evidence

This note separates **model quality evidence** from **model files**.

## Human Reference Atlas / NIH 3D

NIH 3D describes the HRA 3D Reference Object Library as expert-reviewed reference organs. Models are developed by specialists in 3D medical illustration and approved by organ experts.

Useful evidence:
- HRA collection page: https://3d.nih.gov/collections/40
- HRA Male united body: https://3d.nih.gov/entries/3DPX-021022
- The HRA whole-body assembly is useful for provenance, expert-review workflow and coordinate-reference practices.
- It is **not** a complete detailed shoulder-muscle atlas; do not treat the HRA brand itself as proof that a shoulder muscle model exists or is superior.

## Visible Human Male arm muscles / NIH 3D

Right arm:
https://3d.nih.gov/entries/3DPX-012629?version=2

Left arm:
https://3d.nih.gov/entries/3DPX-012628?version=2

NIH says the models were created from Visible Human Male Cryo + CT; muscles and bones were segmented using 3D Slicer, then optimized and remeshed in ZBrush.

Value to us:
- independent imaging-derived comparison;
- useful visual check of shoulder/arm spatial relationships;
- not automatically a ground-truth whole-body coordinate system.

## AnatomyTOOL / Open3DModel

Rotator cuff example:
https://anatomytool.org/content/open3dmodel-rotator-cuff-muscles-english-labels

LUMC shoulder viewer:
https://caskanatomy.info/open3dviewer/?model=zone-shoulder

LUMC upper-limb muscle viewer:
https://caskanatomy.info/open3dviewer/?model=upper-limb-arm-muscles&subset=ligament-parts-hidden

Evidence that this is practical, not just theoretical:
- the LUMC viewer supports rotate, zoom, pan, select, per-structure show/hide;
- InjuryAtlas uses Open3DModel/AnatomyTOOL as a detailed shoulder model and uses the Open3DModel upper-limb source for shoulder ligaments/nerves.

## Humanum / BodyParts3D 3.0 95%

https://humanum.md/

Humanum is especially useful as an independent technical audit of the high-polygon BodyParts3D 3.0 data. It reports:
- 437 muscle meshes;
- 18,308,056 muscular-system triangles;
- 2,397,316 skeletal-system triangles;
- scapula: 121,816 triangles;
- 26,172,284 triangles across the BodyParts3D source geometry used by the page.

Humanum uses BodyParts3D 3.0 95% and says it chose 3.0 over 4.0 because its systems remain better interlocked in their use case. Treat that as a third-party engineering observation to test ourselves, not as an official DBCLS conclusion.

## Screenshots / visual inspection

For visual evaluation, keep screenshots tied to the exact source and version. Do not use generic commercial “anatomy model” screenshots as evidence.

Priority visual references:
1. AnatomyTOOL rotator cuff.
2. LUMC Open3DModel shoulder viewer.
3. NIH 3D Visible Human left/right arm muscles.
4. Humanum muscular + skeletal plates.
5. Current Z-Anatomy web viewer and future Z-Anatomy HQ shoulder export.

## Benchmark rule

A model is not promoted because it looks smoother.

For the same shoulder structures compare:
- recognizable 3D form;
- exact relation to scapula/clavicle/humerus;
- origin/insertion footprint plausibility;
- separation of muscle parts/heads;
- tendon/aponeurosis representation;
- topology artifacts/intersections;
- deep-layer accessibility;
- naming/provenance;
- mobile render cost.


## HRA united-male v1.10 — direct technical audit

The HRA male united GLB was downloaded and inspected inside our GitHub Actions workflow.

Verified:
- file size: 241,633,636 bytes;
- GLB 2.0 magic/header valid;
- 1 scene;
- 1,129 nodes;
- 918 meshes;
- SHA-256: `fae3ac193835e9e24cd13a0d0f11e6788183b290b0691b9b83ec81d907d94581`;
- cached as GitHub Actions artifact `hra-united-male-v1.10`.

Shoulder coverage check:
- searching all named GLB nodes/meshes found no deltoid, supraspinatus, infraspinatus, subscapularis, teres, trapezius, pectoralis, latissimus, biceps, triceps, serratus, rhomboid, levator scapulae, coracobrachialis, scapula, clavicle, or humerus names;
- the HRA v1.10 master ASCT+B ↔ 3D-model crosswalk also contained zero raw-text matches for the tested shoulder muscle/bone terms.

Interpretation: this confirms the **united HRA reference-organ body is not a detailed musculoskeletal shoulder atlas**. HRA remains valuable because of its formal expert-review and provenance workflow, not because it solves our muscle geometry problem.
