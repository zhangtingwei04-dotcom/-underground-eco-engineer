# Project OHM V0.8F — Public mid-motion safe-stop / route replan

Date: 2026-11-12, Asia/Taipei

**EXPERIMENTAL PUBLIC-ONLY MODULE. NOT IN PRIVATE GAME.**

## Source and test evidence

- `src/ohm-core/snake-dynamic-replan-v08f.mjs` — synthetic source-backed pause/replan and explicit resume.
- `tests/snake-dynamic-replan-v08f.test.mjs` — changed scene, complete actual resumed 60-frame trace, full source/temporal checks, in-body obstacle rejection, changed-revision and changed-heightfield rejection, and no-route negative.
- `tests/snake-dynamic-replan-timing-v08f.test.mjs` — six distinct moving-time interruptions.
- Public Actions [43217943680](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43217943680) validated the six-time sweep and the earlier 60-frame tracing logic with **all five jobs successful**. The added no-alternative negative test will need its own confirming run. All code at root stays segregated under `qa/snake-motion`.

## Actual mid-motion test

Initially, the same 2.28-unit transparent snake lowers from the V0.7P resting 13-bone source and continues on the source-backed V0.7U 24-bone motion controller. At moving frame 30, the synthetic V0.3d environment receives a NEW **real 6×6 pixel solid rock at (620,45)**. This is a source-scene geometry revision and invalidates the older controller.

The new V0.8F stage:

1. **Stops without moving any source body vertex**. Copies the current 24-joint pose, original motion frames and prior velocities; it does not recreate the 13-joint animal or teleport to the starting position.
2. Rebinds the old source pose against the *new* authoritative scene revision, then makes a **zero-duration V0.7S source validation**. If the rock intersects the current body/head/ground contacts, the system refuses to claim there is a safe displayable pose.
3. Simulates each hand-authored candidate from the ACTUAL 24-joint moving controller — preserving the existing head-led temporal phase, frame count, body length, source terrain/head collision and 0.65-radian visual bend gate.
4. Provides a **paused** state and chosen forecast if one option stays safe over the requested horizon. The caller must invoke `resumeReplannedSnakeV08f` explicitly with exactly the SAME source rock/terrain snapshot. A re-moved rock or altered terrain invalidates the entire plan.
5. Executes the real controller step from the same 24-joint frame with no invented or skipped motion. A traced 60-step resumed run matched the forecaster's maximum bend and original source pose continuity.

### Frame-30 rock appearance results

| Authored direction | Forecast result | Source reason |
| --- | --- | --- |
| Corrected (+0.10, −0.025) | rejected, before predicted frame 44 | real 2D XY footprint collision |
| Cautious (+0.10, −0.050) | accepted, 60/60 predicted steps | maximum actual 3D bend 0.536731 radians |
| Narrow (+0.08, −0.050) | accepted, 60/60 predicted steps | maximum actual 3D bend 0.506697 radians |

The actual selected **cautious route** was resumed for 60 source-backed frames. This yields 30 original frames + 60 resumed frames on the SAME total-length body without a continuity reset. Per-frame source collision, bend and displacement gates pass; the 60-frame measured max bend agrees with the preview.

### New obstacle appears at different times

| Moving frame when rock appears | First accepted authored direction |
| ---: | --- |
| 10 | corrected (+0.10, −0.025) |
| 20 | cautious (+0.10, −0.050) |
| 30 | cautious (+0.10, −0.050) |
| 40 | cautious (+0.10, −0.050) |
| 50 | narrow (+0.08, −0.050) |
| 60 | narrow (+0.08, −0.050) |

Each scenario checked a full 60-step route from the current in-flight state and an explicit first-frame resume under the new rock. This is meaningful timing sensitivity, not a canned route result.

### Fail-closed controls

- Rock appears **directly over the current source body**: return `phase:'stop'`, `pose:null`, `resumeState:null`; never claim the snake is safely stationary inside solid rock.
- New obstacle invalidates the source V0.3d revision while the animal is moving; unchanged-source no-op is distinguished from true scene changes.
- If the same rock is repositioned again AFTER pause, or the ground heightfield changes, explicit resume rejects the stale source snapshot.
- If **all authored options** are blocked but the current pose remains collision-free, the state is `paused_no_route`; the same 24-joint stationary body is preserved, but no candidate is falsely authorized for movement.
- Every change is generated from frozen test inputs and source validators. No skin, player data, saves, NPCs, environment gameplay mutation, or private resources are copied into public.

## Limitations and next gate

V0.8F **does not invent a new route by itself**. It considers only a short list of pre-authored heading choices, and checks only a finite future frame horizon. It must replan again after a new source change. This is local synthetic pause/replan, not general obstacle navigation, animal intelligence or a real physics engine.

Existing Chrome tests cover the translucent snake, two landscape sizes, 36 full-scene PNGs and 14 earlier intermediate images, **but they do not yet show a live rendered V0.8F obstacle arriving mid-animation**. Before private integration, add a dedicated live Chrome V0.8F scene demo with pause/snapshot and resume visuals, inspect complete temporal smoothness and head/collar anatomy, test more dynamic obstacle shapes and finite-horizon replan expiry.

**Decision: keep all V0.8F changes in public QA; do not merge them into the private full game.**
