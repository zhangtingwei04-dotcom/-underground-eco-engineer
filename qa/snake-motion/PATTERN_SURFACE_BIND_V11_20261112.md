# Project OHM V1.1 — neutral UV pattern-to-geometry anchoring (public QA)

Date: 2026-11-12 (Asia/Taipei).

## Intent
Link previously accepted *data-only* random blueprint V1 to existing source-validated
transparent snake surfaces without putting actual colored/pixel skin on the body.
This is a **read-only adapter** used only by the public QA lab; it does not affect
the private game, its saves, genetics, or creature rendering.

## Geometry conventions
- V1 blueprint: longitudinal `u = 0` near head and `u = 1` near tail.
- Blueprint circumference `v=0` dorsal/top seam, `v=.5` belly.
- V0.7Q transparent ring starts j=0 at side. For its transported frame, the
  equivalent ring azimuth is `(v + .25) mod 1` (v0 => ring j=radial/4).
- On each V0.7Q or V0.7Y body ring quad, sample the **actual two rendered
  triangles** using barycentric weights. Do not approximate across a
  non-coplanar quad and leave the collision-checked mesh.
- `u,v` and descriptor IDs are immutable after generating a snake. The
  adapter emits **transient** XYZ, front-glass screen XY, triangle IDs and
  interpolation weights. All are recreated from the exact moving pose,
  and none are persisted or used as the animal's pattern identity.
- V0.7Y slim body may be supplied only when its source head/bone/collider
  identity and vertex arrays agree with the tested mesh. Otherwise it
  fails closed. No substitute skin, unseen body or new collision authority.

## Exact tests
`tests/snake-pattern-surface-bind-v11.test.mjs` checks:
1. 13 source joints and 24 source joints with identical physical straight
   2.28-unit span; every descriptor's UV and ID remain identical.
2. Every mapped XYZ can be reconstructed **from the three existing mesh
   triangle vertices**, not an imaginary screen-space or painted surface.
3. Dorsal marks lie above the cross-section's center and wrap correctly.
4. 10% growth of a 24-joint synthetic animal from 2.28 to 2.508 source
   units changes its physical mark spacing while UV identity stays fixed.
5. An actual V0.7Y source-checked slender mesh uses the exact
   `bodyCandidate.vertices` in surface anchors.
6. Bad version, modified bone/skin, mixed 13/24 source, false slim
   mesh or nonfinite body length fails closed.

**Important:** synthetic growth is a test geometry only: no claim that V0.7S
supports real in-game growing bones, biological coloring, inheritance, scale
microstructure or pixel rendering.

## Remaining before rendering a prototype skin
Research species-appropriate morphology and pattern anatomy from credible
sources, design a genuinely removable V2/skin shader, validate optical
pixel consistency and animation over time, separate genotype from
phenotype/pattern identity, avoid changing source collisions or saves
without explicit private integration review.

**All work public-only; no private player save or original art copied.**
