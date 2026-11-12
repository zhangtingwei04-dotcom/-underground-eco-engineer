# OHM public experiment — per-snake pattern identity v1 (data only)
Date: 2026-11-12 (Asia/Taipei)

## Scope
This PUBLIC synthetic module represents neutral pattern data for future
creature skin work. **No actual pixels, copyrighted pattern textures,
species genetics, full DNA, pixel shader, or game save integrations**.

Files:
- `src/ohm-core/snake-pattern-blueprint-v1.mjs`: pure seed -> frozen
  explicit UV marks, strict validation/serialization, and UV-index sampling.
- `tests/snake-pattern-blueprint-v1.test.mjs`: deterministic generation,
  JSON load/save, growth and 13/24+ skeleton resampling, checksum and version
  guards, fail-closed invalid data.

## Approved identity contract
The animal's **existing unique animal ID** stays in the private game save.
Store a separate `patternBlueprint` alongside it. Pattern identity is
`{version, generator, seed, speciesId, styleId, paletteId, marks,
integrityChecksum}`. The pattern is created once, then **persisted with
explicit normalized mark descriptors**, not regenerated at each load.
A simple non-cryptographic FNV-1a checksum detects accidental mismatch,
but it is NOT an anti-cheat signature, encryption, or privacy protection.

This initial neutral profile does not infer gene inheritance or map specific
hognose/corn morphs. A distinct future **genetics/phenotype module** can
select a supported profile when creating a snake, while a separate
render/skin module will sample the immutable pattern. Do not persist
changing ring/bone indices as identity.

## UV placement convention
- Longitudinal `u` is the body surface position from head (0) to tail (1).
- Circular `v` is the surface angle normalized to [0,1):
  dorsal seam near 0/1; belly center near 0.5. The seam wraps.
- The stored marks use `u,v,lengthU,widthV` plus deterministic
  asymmetry/irregularity traits; their positions do not change with growth.
- Rendering may calculate transient sample ring/radial indices at
  13 joints, 24 joints or more, or scale distances by current body length.
  These derived indices are NEVER stored as the snake's identity.

## Persistent compatibility rule
This is version 1 and must stay frozen after adoption. If a future
algorithm changes, use a new generator ID and explicit migration policy.
An unsupported version or modified descriptor fails closed instead of
silently creating a different snake.

## Privacy and promotion
Only neutral mathematical fixtures and fake numeric seeds are in public QA.
No private game state, unique animal records, secrets, NPC/stories or
unreleased original pattern art are copied. A green public test does not
authorize automatic private integration.

The skin remains **transparent/unapplied** until natural motion, real skin
geometry and pixel-art consistency are reviewed. This is a test design
and data structure; no player-visible snake is changed.

## V1 fixed design clarifications
- `markCount` is stored explicitly so loading can reproduce the same descriptor count.
- `patternId` incorporates seed, species, style, palette and count. It identifies the **pattern recipe**, not a globally unique animal. Keep the existing animal record ID as the primary snake identity.
- The circumference coordinate has canonical seam values `0 <= v < 1`, even under decimal rounding. Future rendering must preserve the orientation convention, particularly when a moving body frame flips.
