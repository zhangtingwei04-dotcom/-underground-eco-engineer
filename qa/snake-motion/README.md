# Public OHM snake motion regression mirror

This is a deliberately **isolated, synthetic QA mirror** of selected source-backed snake geometry and renderer fixtures. It allows standard GitHub-hosted public Actions to test the current translucent V0.7–V0.8A visual skeleton while private development stays private.

- `src/ohm-core/` contains **the real modules required for the copied tests**, not a mock claiming to validate private source.
- `tests/snake-*.test.mjs` are copied regression cases, including V0.7Y slender body, V0.7Z physical-versus-optical clearance and V0.8A single-pass transparency.
- `snake-transparent-v07g-lab.html` is a synthetic, browser-safe landscape canvas fixture. It is **not** the complete game.
- `.github/workflows/public-snake-qa.yml` executes Node.js 22 unit tests and real Chrome screenshots.
- This mirror does not contain player saves, private history, personal identifiers, access tokens, licensed music, NPC narratives or unreleased research archives.
- Source synchronization is **manual and explicit**; a green public run validates the copied commit only. It does not prove that subsequent unmirrored changes in the private repository pass.
- No CI is authorized to fetch the private repository. The checkout token is read-only and has no private-repo permissions.

The view/screenshot checks are engineering diagnostics rather than release or collision certification. In particular, apparent 2D overlap is not equivalent to 3D contact.

## Public-first staging

Experimental fixes are tested here first; they **do not automatically update** private gameplay source. See [Promotion policy](PUBLIC_FIRST_PROMOTION.md). Full promotion requires strict moving-snake Chrome QA and human review of actual render captures. A failed strict quality gate must remain visible.

## Latest validated public experiment (V0.8C)

The opt-in corrected ground-departure pose `?qa_v07g=1&qa_v07u=1&qa_v08c=1&qa_v08a=1` passed 36 real Chrome images and the strict max bend tracked **across all simulated relay frames** on [run 43211645328](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43211645328). This does **not** promote it to the private game; see [test limitations and exact evidence](V08C_PUBLIC_QA_REPORT_20261112.md).

## Latest: source-verified obstacle lookahead (V0.8E)

Public experimental `snake-obstacle-lookahead-v08e.mjs` compares hand-authored departure candidates over 90 real source-backed simulation frames. If a tiny solid rock blocks the preferred route, regression tests demonstrate a safe alternative; when all candidates are blocked it selects nothing. A changed scene revision invalidates stale previews. See [V0.8E report](V08E_PUBLIC_OBSTACLE_LOOKAHEAD_20261112.md). **Not full autonomous navigation and not integrated in the private game.**

## Latest: V0.8F mid-motion safe pause and resume (public only)

`src/ohm-core/snake-dynamic-replan-v08f.mjs` preserves the actual 24-joint moving snake and authoritative V0.7S collision if a source V0.3d rock moves. It checks that the body can safely **remain at its current pose**, previews up to eight authored headings from the existing controller state over a fixed future horizon, and exposes a separate explicit resume function that rejects altered terrain revisions. Tests validate six separate interruption frames, a rock directly inside the body, and prevention of stale-state resume. It is not automatic gameplay navigation. [Engineering details](V08F_PUBLIC_DYNAMIC_REPLAN_20261112.md).

## Separate, reproducible pattern-data experiment (V1)

The public-only [pattern data contract](PATTERN_BLUEPRINT_V1_20261112.md) stores one immutable seed + explicit normalized surface descriptors per snake, independently of temporary skeletal ring count and real species genes. The unit tests cover save/load byte identity, resampling and growth invariance. **No actual skin, color texture or private player save has been changed.**

## Pattern V1.1 — source-anchored but **still unpainted**

The public-only [V1.1 pattern surface adapter](PATTERN_SURFACE_BIND_V11_20261112.md) places a V1 seed-once blueprint onto the **actual existing V0.7Q or V0.7Y collision-sampled surface triangles** using fixed longitudinal/circumference UV. Unit QA includes 95 wall frames, 13→24 resegmentation, 90 ground turning frames and synthetic growth; no painted skin or private integration. [Evidence-gated species pattern research](PATTERN_SPECIES_EVIDENCE_20261112.md) is kept separately; corn snake research is stronger than currently verified western hognose commercial morph genetics.

## V0.9A — Neutral autonomous intent with source-checked short movement

[Engineering report](V09A_PUBLIC_AUTONOMY_20261112.md) and `snake-autonomous-intent-v09a.mjs` connect ecology availability and need-driven shelter/explore/rest ranking to the **real source-backed V0.8E 24-joint short movement preview**. A second test executes the actual 60-frame movement from the same source, reports *segment completion only*, and rejects changed scenes or blocked moves. **No pathfinding, safe return, true destination arrival, observed journal, player save, painted skin, private character or game integration is claimed.**

## V0.9B — scene-derived grid path, two-way XY check and real short-segment preview

New [V0.9B engineering report](V09B_PUBLIC_SCENE_DERIVED_AUTONOMY_20261112.md) covers `snake-scene-route-v09b.mjs`: derived V0.3d AABB grid route and reverse route, unreachable/inside-rock approach, non-authored heading candidates, then V0.9A/V0.8E 24-joint short physical movement gate. [Five-job Actions run 43242734864](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43242734864) is green. **2D graph return ≠ demonstrated full-body 3D return; short movement ≠ site arrival.** No new dedicated visual-motion browser QA, game integration or skin.

## V0.9C — real 24-joint outbound/head-return and changed-scene pause/resume

[Audited public V0.9C engineering report](V09C_PUBLIC_FULL_BODY_ROUTE_RETURN_20261112.md): actual same-animal V0.7U source continuation (692 frames) reached a synthetic goal and brought the source head back within 9 floor pixels of its origin without teleporting, while all frames passed V0.7S collision and V0.8D continuity checks. Moving rock changes invoke a V0.8F safe pause and a **fresh V0.9B graph** before any one-step source continuation. [Five jobs green on Action #43246837991](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43246837991). **This does NOT validate self-collision, complete 3D return force/contact, actual shelter arrival, V0.9C-specific Chrome animation, new gameplay saves, or private integration.**

## V0.9D — source self-clearance and dedicated Chrome QA (unsafe roundtrip detected)

[Read the V0.9D safety and visual evidence report](V09D_PUBLIC_SELF_CONTACT_AND_CHROME_20261112.md), [interactive engineering lab](snake-autonomy-v09d-lab.html). The opt-in `snake-self-clearance-v09d.mjs` samples 190 nonadjacent 24-joint tapered-capsule pairs each source pose and **rejects** a suspect frame. On the former V0.9C 692-frame head roundtrip it detects 163 candidate-overlap frames, with the strict guard stopping before the first; this **invalidates claims of physically plausible full-body return** despite the head completing the route. An independent 2-landscape Chrome job captures real frames. Default lab playback stops at the first suspect self-contact; `?unsafe=1` displays the unapproved diagnostic sequence only. Does not alter player game, source skeleton, skin or saves.

## V0.9E — real 3D stacking classification, never whitelist penetration

[Public V0.9E source and test report](V09E_PUBLIC_BODY_STACKING_20261112.md) introduces `snake-body-contact-v09e.mjs` and `snake-body-contact-v09e.test.mjs`. It distinguishes geometry-separated overpasses, possible terrain-supported vertical touch, unknown support, and potential 3D penetration, **without changing the strict V0.9D collision acceptance**. Tested synthetic 24-link helices and the known unsafe V0.9C 692-frame return: the first suspect overlap must still stop before source frame 531. [Six GitHub jobs green](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43253929889). **No actual lift/contact-force solver, no new stacking animation shown in Chrome, no source body edits, no real player/game integration.**
