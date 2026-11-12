# OHM Snake V0.8C — public-only validated motion candidate

Date: 2026-11-12 (Taiwan)

## Source of truth
- Public GitHub repo `zhangtingwei04-dotcom/-underground-eco-engineer`.
- Approved experimental implementation/test commit `5b268f5ce702b9678f5033abbb1206e2325254ed` (public Action run [43211645328](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43211645328)).
- Private game repository **intentionally not updated**: no promotion while high-frequency motion QA remains necessary.

## Root cause and candidate
- V0.8B source-backed 24-joint 90-frame sweep diagnosed a head-adjacent first-joint bend caused by advancing the head predominantly sideways relative to the resting source bone orientation. Initial max: `0.51761847` radians; old `departure={x:0.1,y:+0.025}` + `steer=0.24` reached `0.97165882` radians at joint 1/frame 54.
- Synthetic opt-in V0.8C (`qa_v08c=1`) uses `departure={x:0.1,y:-0.025}` in relay simulation, **without** changing bone-follower implementation, body length, original head collider, scene authority, skin, ecology or save.
- 90-frame experimental vector sweep with same `0.24` turn: peak `0.63299064` radians (below **unchanged 0.65** gate), no source collision rejection, head travel `0.272213` units. Other tested departure angles such as `{x:0.1,y:+0.025}` remain known bad for this scene.
- V0.8C is a **scene-specific authored departure direction**, not evidence that the general arbitrary pathing controller is solved.

## Real test evidence
- All **four** public Actions jobs pass on run 43211645328: snake+terrarium Node source-backed regressions, five-zone Chrome Canvas UI, V0.8A one-pass alpha-held A/B, and full strict snake-v08c Chrome.
- Chrome driver produced **36 screenshots**, across **1440×900** and **932×480** landscape viewports, covering base/terrain/wall hold/handoff/relay/3D diagnostics/transparent one-pass alpha. Chrome engine used the exact public source and rendered real canvas pixels.
- New read-only `src/ohm-core/snake-bend-monitor-v08c.mjs` validates 13/24 source joints, 2.28-length fixed link chain, finite 3D vertices, and records the maximum across **every relay simulation step**. Browser QA requires cumulative maximum under **0.65 radians** (not merely the last frame).
- V0.7Z inspected sampled nonlocal proxy-capsule clearance and ring flips; these are **not** full continuous triangle-mesh intersection proofs.
- Chrome screenshots were downloaded and visually checked: no skin, thin translucent U-to-ground snake rendered with plants and rocks in both landscape layouts. **Still engineering art**, not a release-quality creature appearance. The terminal screenshot alone cannot certify smooth inter-frame animation.
- Artifact screenshots from the run are temporary GitHub Actions files (retention three days), not permanent in the game repository.

## Work remaining before private promotion
1. Capture/inspect actual intermediate frames or video for temporal continuity and head/neck appearance, including turn onset, reversal and rest.
2. Verify multiple route orientations and tighter rock/glass positions; check geometry safety and smoothness without relying on a single handpicked `departure`.
3. Confirm no flicker, alpha overlap or head-jump regression at mobile landscape sizes and under slower device conditions.
4. Only then review the stable changes and integrate a minimal compatible module set in private main; run private-only save and scene adapter tests while keeping secret data private.

Current decision: **keep experimenting publicly; do not promote V0.8C into private game yet.**
