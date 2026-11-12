# V0.8B Public bend-sweep research — 2026-11-12

## Purpose
Find why the source-backed transparent snake's head/neck turn is visually too tight without gaming the strict Chrome acceptance threshold of **0.65 rad (~37.24°)**. The diagnostic uses a **synthetic 13-point wall-rest → same-length 24-point ground handoff** and measures real 3D joint angles for 90 simulation steps. It is an exploratory scenario, not a player animation or release authorization.

## Observed values (public Actions run 43209279999)

| Authored steering (rad) | Peak measured 3D joint bend (rad) | Peak bend (degrees) | Joint index | Accepted by existing source guards |
| ---: | ---: | ---: | ---: | :---: |
| 0.00 | 0.831228 | 47.63° | 1 | yes |
| 0.04 | 0.852219 | 48.83° | 1 | yes |
| 0.08 | 0.874235 | 50.09° | 1 | yes |
| 0.12 | 0.897183 | 51.40° | 1 | yes |
| 0.16 | 0.921063 | 52.77° | 1 | yes |
| 0.20 | 0.945883 | 54.20° | 1 | yes |
| 0.24 | 0.971659 | 55.67° | 1 | yes |

All values came from actual Node 22 source simulation, not visual guesswork. The 90-step sweep covers the maximum encountered over time; the earlier **Chrome 176-frame** run reported **0.737558 rad** in its last 24-joint relay pose, a different measurement window. Both exceed the currently required 0.65 rad visual guard.

## Findings

- The **first joint after the head** is the dominant tight bend. This persists even with **zero added steering** (0.831 rad), so simply lowering the user-authored heading cannot solve the problem.
- Existing source guards accept these poses; their physical and motion checks do not guarantee a visually natural head-to-neck curvature. Keep a separate stricter visual guard rather than weakening it.
- Do **not** revise default turn `0.24` yet or quietly increase the Chrome assertion threshold. Investigate V0.7S head-first follower and its V0.7T ramp with a gentle curvature distribution over several source links.
- Candidate fixes must preserve the unchanged 2.28 body length, 23 fixed 3D links, original head/rock collision authority, surface contact, 13→24 continuity, skin-free rendering, and save/ecology isolation.
- Test new candidates only in the public simulation sandbox. Private game code remains unmodified until the complete browser comparison is stable.

Diagnostic: `qa/snake-motion/tests/snake-bend-envelope-v08b.test.mjs`. Live CI: https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43209279999
