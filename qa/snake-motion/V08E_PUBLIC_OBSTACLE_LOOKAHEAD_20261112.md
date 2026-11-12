# OHM Snake V0.8E — public obstacle lookahead and actual authored detours
Date: 2026-11-12 (Taiwan)

## Result and evidence

**Public-only engineering experiment, NOT promoted to private gameplay.**

- Public source/test commit: `942f51075e6fdfeab01e53ccf0441ec55e06b76a`.
- GitHub Actions: [run 43216016337](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43216016337) — **all 5 jobs successful**: snake+ecology source-backed Node tests, 5-zone terrarium Chrome, 2-landscape full snake Chrome, V0.8A alpha A/B, and 14-frame V0.8D motion Chrome.
- Experimental module: `src/ohm-core/snake-obstacle-lookahead-v08e.mjs`.
- Checked cases: `tests/snake-obstacle-lookahead-v08e.test.mjs` plus `tests/snake-obstacle-position-scan-v08e.test.mjs`.
- Baseline V0.8D animation and geometry modules, gameplay systems, original source collision authority, private repository, player saves and skin **unchanged**.

## Mechanism

The user/author supplies an **ordered list of up to eight synthetic candidate movement vectors**, with bounded direction and shallow authored steering. Before starting, V0.8E copies the same **fully rested V0.7P 13-joint source** into each independent candidate, resegments to the same-length **24-joint** representation using canonical V0.7S, applies V0.7T acceleration ramp and V0.7U head-led follower, and validates all **90 predicted frames** by the unmodified collision/head/ground authorities. V0.8D also measures strict visual maximum bend (0.65 rad), frame displacement and 3D per-frame tangent rotation. A route only qualifies when it clears the full horizon.

The selector chooses the first source-safe authored option. If all candidates fail, it returns `selected:null` and `no_source_safe_candidate`, without fake success frames or teleportation. It records the first rejection reason/frame for each. It does **not** generate waypoints, perform full physics, detect animal intent or dynamically steer during execution.

### Verified real obstacle cases

Source V0.3d floor coordinates, not UI pixels. All obstacle rectangles are **real solid collision objects**, not screen overlays. Object sizes are 6×6 pixels with height 120 source units for the first two cases.

| Synthetic scene rock | Previous V0.8C route | Preview selection | Result |
| --- | --- | --- | --- |
| No blocking rock | Old (+0.10,+0.025) exceeds the 0.65 rad bend limit | Corrected (+0.10,−0.025) | 90/90 steps, strict visual limit passes |
| (620,45) | Corrected (+0.10,−0.025) fails source footprint at **frame 73** | Cautious (+0.10,−0.050) | 90/90 steps; maximum bend **0.517461 rad** |
| (610,45) | Corrected blocked at **frame 50**, cautious blocked at **frame 85** | Narrow (+0.08,−0.050) | 90/90 steps; maximum bend **0.517461 rad** |
| (600,10), large rock 65×70 | All four authored directions blocked by source footprint around frames 15–16 | **No candidate** | Correct safe stop, no route fabricated |

Grid search scanned **24 independently constructed tiny-rock positions**: 3 positions differentiated genuinely blocked from genuinely safe candidates, 22 positions had at least one safe candidate, 2 positions had no candidate accepted. The handpicked positions above are retained as *deterministic regression cases*; a pass does not establish broad open-world reliability.

**Stale authority test:** after an approved preview, changing the authoritative rock location increments the V0.3d scene revision. Reusing the *old* 13-joint wall state against the changed scene rejects every candidate with `handoff_source_scene_or_terrain_changed`. Previously selected movement must never be reused without a fresh source validation.

## Safety and realism limitations

- Only explicit, ordered, authored departure candidates are evaluated; the module does **not** spontaneously invent a path around an obstacle.
- Preview is at rest and finite-horizon. It cannot safely authorize continuous movement if the scene changes or the planned horizon expires.
- V0.7S handles 2D body-capsule against scene XY footprint, 3D ground height and full head collider; it is **not** full continuously swept triangle mesh self-collision or verified animal biomechanics.
- Current successful routes are free of *sampled* collision/visual problems in the specified 90-frame windows. That cannot certify arbitrary rock patterns, sloped routes, substrate friction, true navigation, or natural motion of a specific species.
- No external services, paid resources, private IP assets, NPC data, player saves, secret keys, or new skin were added.

## Next experiment before private promotion

Build a **safe stop-and-replan controller** for a new rock appearing while the snake is *already moving*, retaining strict V0.7S source authority without splicing a new path into a stale state. Verify more route orientations, moving rocks, obstruction timing, full chronological raster animation and species-dependent proportions. Do not promote until broad, high-frequency public QA and visual review are satisfactorily complete.
