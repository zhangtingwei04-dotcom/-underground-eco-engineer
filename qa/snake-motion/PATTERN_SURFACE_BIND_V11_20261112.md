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

## V1.1 actual moving-pose regression (2026-11-12)

- `tests/snake-pattern-surface-live-v11.test.mjs` maps exactly the same neutral UV mark identity on **95 actual V0.7P raised / lowering source frames**, performs the **13-to-24 joint source-preserving handoff**, and then follows **90 actual V0.7U corrected turning steps** (91 24-joint bind calls including initial handoff).
- Actual maximum per-frame mark displacement on the moving V0.7Q surface: **0.0118211 world units** in wall motion and **0.0035947 world units** after grounded turn. Source 13→24 handoff maximum mark displacement was **0.0104966 world units**. These are physical motion / resampling changes, not new random seeds.
- This test used an unchanged pattern recipe throughout, preserved original source constraints and did not paint a single pixel of skin.
- GitHub Actions [43224419365](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43224419365): **5/5 jobs successful**, includes this moving-pose test and unchanged earlier Chrome QA. The new pattern adapter is not yet demonstrated as a rendered pixel skin.
- See [species evidence and limits](PATTERN_SPECIES_EVIDENCE_20261112.md) before assigning real species-specific pattern/genes.
