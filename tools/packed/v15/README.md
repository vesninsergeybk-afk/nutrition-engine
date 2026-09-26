# Packed v15 family tools

These files preserve the exact audited v15 builder and independent semantic audit used for the verified local checkpoint.

Why packed: the exact source bytes are retained as gzip+base64 chunks so GitHub Actions can reconstruct them and verify their SHA-256 before execution.

Expected source hashes:
- build_external_food_families_v15.py: 09174842b338645e94e23ab3bce9071abb2d364dd8c61ea119ebc5af9654e48f
- audit_external_food_families_v15.py: 02b6247fa58f38ef0855598c8126864bb26b564497e89184a7d2082f252e7a2f

The reproducibility workflow must fail if the reconstructed sources, counts, semantic audit, or output hashes differ from the verified v15 checkpoint.
