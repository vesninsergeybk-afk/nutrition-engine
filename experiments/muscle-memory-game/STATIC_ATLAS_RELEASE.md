# Static Atlas v1

## Release scope

This branch ships the anatomy trainer as a static atlas and learning tool.

Included:
- Atlas and Training as the public top-level modes.
- Z-Anatomy and BodyParts3D anatomy sources.
- A side Display drawer that leaves the 3D model visible on desktop.
- Bone display, BodyParts3D tissue layers, connective-tissue sublayers, and Z-Anatomy safety landmarks.
- Region-scoped anatomical muscle peeling where the depth map has been verified.
- Source-backed muscle reference cards.
- Local public-domain atlas illustrations when reuse rights have been verified.

Not included in this release:
- Motion mode.
- Kinematic previews or simulated contractions.
- Unverified anatomical depth inference.
- Copyrighted atlas images without explicit reuse permission.

## Release gate

The release is acceptable only when:
1. the fast contract suite passes;
2. Z-Anatomy and BodyParts3D browser checkpoints pass;
3. learning-core and learning-practical browser checkpoints pass;
4. mobile Atlas browser checkpoint passes;
5. Motion-only browser jobs remain outside the static release gate.
