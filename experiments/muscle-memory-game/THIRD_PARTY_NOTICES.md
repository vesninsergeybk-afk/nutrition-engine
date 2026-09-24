# Third-party data and software notices

## 3D anatomical data used in the MVP

The prototype currently references the muscle-system GLB published in:

- **Anatomi Simülatörü** — DrMuratAltun/anatomi-simulatoru
- derived from **Z-Anatomy — The libre 3D atlas of anatomy**
- ultimately derived from **BodyParts3D, © The Database Center for Life Science (DBCLS)**

The source project states the following licensing chain:

- BodyParts3D — CC BY-SA 2.1 Japan
- Z-Anatomy — CC BY-SA 4.0
- derived `systems/*.glb` files — CC BY-SA 4.0

Source attribution:
https://github.com/DrMuratAltun/anatomi-simulatoru/blob/main/ATTRIBUTION.md

Source data license:
https://github.com/DrMuratAltun/anatomi-simulatoru/blob/main/LICENSE-DATA.md

Z-Anatomy license:
https://github.com/Z-Anatomy/Models-of-human-anatomy/blob/master/License.txt

CC BY-SA 4.0:
https://creativecommons.org/licenses/by-sa/4.0/

## ShareAlike scope — do not assume a clean code/data boundary

An earlier prototype note treated the 3D data and application code as if the ShareAlike obligation clearly stopped at the model files. That is too strong and has been withdrawn.

In a public GitHub issue dated 31 August 2026, the Z-Anatomy owner stated that, in their interpretation, including the model inside an application implies sharing the application code under the same license:

https://github.com/Z-Anatomy/Models-of-human-anatomy/issues/8

Creative Commons itself explains that ShareAlike applies to Adapted Material, while collections/aggregations may be treated differently depending on whether the combined work is legally an adaptation:

https://wiki.creativecommons.org/wiki/4.0/ShareAlike

For this reason, this repository does **not** claim that a proprietary application can safely embed or tightly integrate the Z-Anatomy-derived GLB while keeping its code closed.

The current model is acceptable as an open technical prototype. Before a commercial release, either:

1. confirm an acceptable licensing architecture with qualified legal review / the licensor;
2. release the relevant combined work under a compatible open license; or
3. replace the anatomical asset with a source whose license fits the intended product model.

## Anatomical accuracy

The web-converted Z-Anatomy model is useful for interaction testing but should not be treated as the final anatomical source without review. The source project itself notes that the Z-Anatomy geometry is not a fully anatomist-validated atlas and that the muscle layer was decimated for browser delivery.

For production educational content, each selected structure should be checked against a reviewed anatomical source.

## three.js

The prototype loads three.js r185 and its GLTFLoader / OrbitControls modules from jsDelivr.

three.js is distributed under the MIT License:
https://github.com/mrdoob/three.js/blob/dev/LICENSE
