# Project OHM V0.8D — public-only continuous motion and terrain QA
Date: 2026-11-12, Asia/Taipei

## Scope and status
**Experimental public code only. Do not promote to private gameplay yet.**

Source of truth: public repository `zhangtingwei04-dotcom/-underground-eco-engineer`, under `qa/snake-motion/`. Final code under test for this report: `9f53e3c8e826a42254717de68dcb97619da8e041`. GitHub Actions [43213753721](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43213753721) **5/5 jobs passed**, including actual Chrome rendering and source-backed Node tests.

### What changed
- `src/ohm-core/snake-temporal-continuity-v08d.mjs`: read-only, actual 3D bone-angle / joint-step / per-step tangent rotation sampling, validates fixed 2.28-unit total and 13/24 source joint identity. No editing of physical state, visual skin, gameplay, saves, or ecology.
- `tests/snake-temporal-continuity-v08d.test.mjs`: 4 source-backed 90-frame movement directions; positive candidates and an intentionally failing old-angle visual control. A synthetic instant whole-chain jump is independently detected even though its static bend metric passes.
- `snake-transparent-v07g-lab.html` + `tests/snake-front-glass-v07n-cdp-browser-qa.mjs`: explicit `qa_v08d_frame` synthetic capture, two true landscape viewports, real glass-canvas RGB digest, 3D source head position and cumulative bend sampled per frame. Existing V0.8C safety gate 0.65 rad unchanged.
- `.github/workflows/public-snake-qa.yml`: a separate real-Chrome frame sequence job; PNGs are temporary CI artifacts retained three days, not copied into the public game.
- `tests/snake-terrain-variation-v08d.test.mjs`: five independently constructed synthetic rock/floor scenarios plus a deliberate in-path obstructing rock negative control.

## Measured 90-frame source motion

| Authored departure (X, Y) | Peak static joint bend (radians) | Max per-frame tangent rotation (radians) | Max joint displacement / frame | Frames exceeding 0.65 |
| :--- | ---: | ---: | ---: | ---: |
| (+0.10, −0.025) V0.8C | 0.632991 | 0.029290 | 0.003436 | 0 |
| (+0.10, −0.050) | 0.517461 | 0.027189 | 0.003727 | 0 |
| (+0.08, −0.050) | 0.517461 | 0.022220 | 0.003145 | 0 |
| (+0.10, +0.025) old negative | 0.971659 | 0.034405 | 0.003436 | 60 |

The first three are **specific accepted synthetic routes**, not a general path planner. The old path remains a negative control that must fail the stricter *visual* bend limit despite meeting pre-existing source physics proxies. A position-jump input changes all coordinates by 0.3 units and is correctly detected by the temporal step metric.

## Real Chrome visual time-series

- [Actions 43213753721](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43213753721) has **five successful jobs**: source-backed Node suite, five-zone ecology UI Chromium, strict two-viewport 36-image V0.8C browser, V0.8A alpha-held A/B, and new V0.8D real intermediate frames.
- V0.8D captures **7 real frames × 2 viewports = 14 PNGs**, at simulation steps 40, 93, 105, 120, 140, 160 and 175. Viewports: 1440×900 and 932×480.
- Chrome telemetry reports for corrected route: head moved from `(x=.650,y=-1.277,z=.433)` in raised pose at frame 40 to `(x=.894,y=-1.337,z=.135)` at frame 175. Same world XYZ in both viewports; terrain canvas RGB changes across sampled moving frames, and cumulative source-bone bend never exceeds `0.632991` rad at the sampled checkpoints.
- Cumulative bend monitor is evaluated on **every relay frame**, while saved image review consists of **seven selected moments**, not an uninterrupted video. The captured engineering-image contact sheet was visually inspected for scene presence and pose progression. This is not evidence of fully natural motion or pixel-art completion.

## Five modified terrain scenarios and obstruction

| Scenario | Rock positions | Floor height | 90 grounded steps | Strict bend guard |
| :--- | :--- | ---: | ---: | :--- |
| Baseline | original | 0.00 | 90/90 | pass |
| Rock objects shifted | +12 source pixels | 0.00 | 90/90 | pass |
| Rock objects shifted | −12 source pixels | 0.00 | 90/90 | pass |
| Slightly raised floor | original | +0.03 world | 90/90 | pass |
| Raised floor and rocks | +10 source pixels | +0.03 world | 90/90 | pass |

All five reported the **same max bend 0.632991 rad and same rotation 0.029290 rad**, because no modified rock entered the tested source trajectory. They verify coordinate/collision compatibility across benign variations; they **do not demonstrate reactive climbing, navigation, obstacle avoidance or terrain-generated movement**.

**Negative obstacle control:** a solid rock deliberately placed inside the final grounded source path (`x=600,y=10,width=65,depth=70` source pixels) is rejected by the existing source scene-footprint collision gate. An obstructed pose is not accepted simply because it was rendered previously elsewhere.

## Remaining gate before moving to private
1. Test genuinely interacting rocks/slopes/turnarounds with source-validated alternate routes, not simply translation of harmless obstacles.
2. Inspect a complete actual motion animation / high-density series for subtle joint snapping, head-neck silhouette, glass overlap, and raster flicker; 7 screenshots cannot substitute for a video.
3. Compare species body proportions (corn snake / western hognose) while retaining skin-free transparent 3D source rig.
4. Verify no behavior/ecology/save regression in the private game when a stable reviewed module is **explicitly** promoted; public QA green does not automatically mean private integration passed.

**Decision: retain V0.8D in public QA; do not copy it into `scales-seeds-private-dev` yet.**
