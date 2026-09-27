# BodyParts3D supplemental muscle attribution

The trainer uses BodyParts3D 4.0 as the base tissue model and may add real BodyParts3D 3.0 muscle meshes when the corresponding canonical 4.0 mesh is absent.

## Base model

BodyParts3D 4.0, © The Database Center for Life Science. The pinned browser-ready base is derived from `ashemag/human-atlas` commit `1c38bf35c254a891200d3cedecfd57abebe83d8d`.

## Trunk supplements

Latissimus dorsi and rectus abdominis use registered BodyParts3D 3.0 geometry documented by `japan4415/training-logger`. The registration preserves scale and orientation and fits translation against bilateral external oblique. Reported fitted RMS nearest-vertex residual is about 2.5 mm, with independent chest/teres references about 3.5–5.5 mm.

Internal oblique, transversus abdominis, multifidus, pyramidalis and quadratus lumborum are BodyParts3D 3.0 meshes from a pinned GitHub mirror of the historical dataset and use the same trunk coordinate registration. Their source FMA IDs remain unchanged.

## Facial supplements

Forty-seven facial-expression and masticatory muscle meshes use the registered BodyParts3D 3.0 facial pack from `choxos/OMFAtlas`. Its similarity registration was fitted to mandible, frontal bone and right maxilla and independently checked against the left maxilla; reported held-out surface RMS is about 0.258 mm.

Right and left depressor septi nasi are additional BodyParts3D 3.0 meshes transformed with that same validated facial registration.

## License handling

Historical BodyParts3D 3.0 files and the facial pack retain the conservative historical attribution:

> BodyParts3D, Copyright© The Database Center for Life Science licensed by CC Attribution-Share Alike 2.1 Japan.

The supplemental 3.0 geometry must not be silently relabeled as native 4.0 geometry. Source version, FMA identity and registration provenance are retained in code and documentation.
