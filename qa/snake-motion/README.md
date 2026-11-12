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
