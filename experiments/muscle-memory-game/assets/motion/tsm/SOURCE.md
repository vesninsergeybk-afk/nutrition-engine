# Thoracoscapular Motion Lab assets

Project-local runtime copies from:

- upstream repository: `ComputationalBiomechanicsLab/rmr-solver`
- pinned upstream revision: `d40ebd8ba658633993e531e408c0d96df30ff367`
- upstream model lineage: Thoracoscapular Shoulder Model
- upstream license for data/models: CC BY 4.0
- local purpose: source-native bone geometry for the independent Motion Lab scene

## Vendored geometry

- `geometry/thorax.vtp` <- `OpenSim Models/for CMC/Geometry/thorax.vtp` (upstream blob `7ada8fa546a2630a26176a14c5544aee4cf66c83`)
- `geometry/clavicle.vtp` <- `OpenSim Models/for CMC/Geometry/clavicle.vtp` (upstream blob `5998e18d2a4069a0568f2816d29ea57827ecaa98`)
- `geometry/scapula.vtp` <- `OpenSim Models/for CMC/Geometry/scapula.vtp` (upstream blob `697b8663def1572c1c0a06c908ebbff0680ce62b`)
- `geometry/humerus.vtp` <- `OpenSim Models/for CMC/Geometry/humerus.vtp` (upstream blob `35bbd351d6acebf1cdc147d9e9a81e91001598c8`)

Only geometry needed by the current shoulder Motion Lab is vendored. The full upstream OpenSim model and raw result sets remain pinned build/provenance sources and are not shipped as browser runtime assets.

## Citation

Seth A, Dong M, Matias R, Delp S. Muscle contributions to upper-extremity movement and work from a musculoskeletal model of the human shoulder. Frontiers in Neurorobotics. 2019;13:90.

Belli I, Joshi S, Prendergast JM, Beck I, Della Santina C, Peternel L, Seth A. Does enforcing glenohumeral joint stability matter? A new rapid muscle redundancy solver highlights the importance of non-superficial shoulder muscles. PLOS ONE. 2023;18(11):e0295003.

The exact upstream data/model license notice is preserved in `LICENSE_DATA.txt`.
