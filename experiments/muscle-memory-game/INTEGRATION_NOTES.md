# GitHub integration review

This file records useful open-source projects evaluated for the anatomy learning tool and the decision taken for each one.

## Integrated as interaction patterns

### ashemag/human-atlas

- Code: MIT.
- Current anatomy dataset in that project: BodyParts3D 4.0, CC BY 4.0.
- Useful ideas already adapted into this MVP:
  - separate exploration and assessment modes;
  - strict tap-versus-drag/multitouch distinction;
  - merged geometry while retaining per-structure identity;
  - structure focus and isolation;
  - compact mobile controls;
  - search as a route into direct structure inspection.

A future data migration to its BodyParts3D 4.0 pipeline is worth prototyping separately because it offers 2,234 source meshes, 3,432 named concepts, current CC BY 4.0 data licensing, browser-ready chunks, and richer system metadata.

## Already available in current Three.js, no extra dependency required

### mrdoob/three.js — OrbitControls

The currently used r185 already supports the navigation features needed for the first teaching tool:

- zoom to cursor;
- pan;
- two-finger dolly + pan;
- min/max camera distance;
- target-radius bounds.

Therefore `camera-controls` is not added yet.

## Candidate: yomotsu/camera-controls

MIT. Strong candidate if we later need:

- smooth programmable camera transitions;
- click-to-set orbit point;
- fitToBox / fitToSphere;
- boundaries and collision;
- richer touch mappings.

Current decision: keep OrbitControls until those features are truly needed.

## Candidate: gkjohnson/three-mesh-bvh

MIT. Useful for accelerated raycasting and spatial queries when the scene grows.

Current decision: do not build a client-side BVH yet. The present model is responsive enough, and BVH construction itself has a startup cost on mobile. Revisit after adding deep layers / BodyParts3D 4.0.

## Candidate: open-spaced-repetition/ts-fsrs

MIT. Actively maintained implementation of FSRS.

Potential teaching use:
- schedule previously learned muscles;
- keep weak muscle/function pairs returning over days;
- separate immediate practice from long-term retention.

Current decision: not integrate mechanically into the six-item MVP. An FSRS rating must correspond to meaningful recall quality; mapping every correct click to “Good” and every error to “Again” would be an unvalidated shortcut. For now the trainer only increases the within-session probability of items that were missed.

## Candidate: google/model-viewer

Apache-2.0. Excellent general-purpose GLB viewer and AR surface.

Current decision: not suitable as the main engine because our app needs per-triangle educational selection, custom quiz logic, layers, and structure-level state. May later be useful for simple AR demonstrations.

## Candidate: Kitware viewers / Osseus

Useful references for clipping planes, transparency, measurement, and medical-viewer conventions.

Current decision: clipping planes and measurements are not first-line learning goals for muscle recognition. Revisit only if future lessons explicitly teach spatial relationships, cross-sections, or distances.

## Pedagogical modes now supported

### Trainer

The learner receives a structure prompt and selects it on the body. Incorrect targets gain a larger chance of returning during the same session. This is deliberately a short-term adaptive loop, not long-term spaced repetition.

### Explore

The learner can tap any muscle without being graded, search by source name, focus the camera on it, isolate it, restore surrounding anatomy, change standard views, and adjust the skeletal landmark layer.

The next mode to add should be “layers / depth” rather than another quiz format, because deep shoulder structures are currently not physically accessible on the intact model.
