# Project OHM — Public-first experimental development and private promotion

## Decision (2026-11-12)

Experimental animal motion, transparent render, terrarium appearance, geometry and **synthetic test harnesses** are developed and stress-tested in the existing **public QA sandbox** first. Only a stable, explicitly reviewed and versioned candidate is then copied into the **private game repository** for integration into gameplay systems. The public and private repositories remain different trust domains.

**Public experiment:** `zhangtingwei04-dotcom/-underground-eco-engineer`, path `qa/snake-motion/`, workflow `.github/workflows/public-snake-qa.yml`.

**Private integration:** `zhangtingwei04-dotcom/scales-seeds-private-dev`, `main` remains the authoritative complete game, story, research and save code.

## Boundary and work cycle

1. **Propose a synthetic fixture and success criteria.** Use neutral 3D geometries, fake account IDs, local-only temporary state, independent Canvas. No private authentication, production API, player records, unreleased music or NPC content goes in the public sandbox.
2. **Iterate publicly.** Keep the 37 snake and 13 terrarium source-backed test cases, 5-zone real Chromium QA, separate V0.8A held-pose RGB comparison and strict moving-snake Chrome diagnostic. An experimentally green unit test never hides a red browser test.
3. **Qualify a promotion candidate.** Require source geometry tests and real intended-viewport screenshot tests to pass on the *same public commit*; resolve or document failing checks rather than skipping or loosening thresholds. Check for finite values, non-penetration proxy, head/neck alignment, stable animation, expected real pixel changes and no new skin. Verify visual screenshots, not just green logs. Document exact commit SHA, test run URL, parameters, sample count, and limitations.
4. **Promote deliberately.** Copy only the reviewed affected modules/tests using a new private integration commit (never change private history or ingest the public repo wholesale). Record the public source SHA and QA evidence in the private project memory. Add private-only adapters for saves/auth/NPCs and run focused integration checks; avoid mass CI loops on the exhausted private monthly budget.
5. **Rollback or rework publicly.** If a candidate fails private integration, preserve the last stable private implementation, fix the synthetic repro in public, then re-qualify it. Do not automatically promote public `main` on every push.

## Current promotion gate — V0.8C update (2026-11-12)

- Public candidate `qa_v08c=1` selectively changes **synthetic relay-mode authored ground departure** from `(0.1,+0.025)` to `(0.1,-0.025)`. The V0.7U baseline is unchanged without opt-in. This is scenario geometry tuning, NOT a general movement algorithm rewrite.
- Diagnostic V0.8B measured initial max bend `0.517618` rad, then the old baseline 90-step peak `0.971659` rad at head-side joint 1 with steering `0.24`. V0.8C with the opt-in route measured a 90-step peak `0.632991` rad. The **0.65 rad quality threshold was never relaxed**.
- Public Actions [43211645328](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43211645328) at public commit `5b268f5ce702b9678f5033abbb1206e2325254ed`: **all four jobs passed** — snake+terrarium Node regression, 5-zone real Chrome, V0.8A one-pass transparency A/B, and strict full 36-image Chrome two-landscape QA.
- The full Chrome QA now monitors **peak 3D source-bone bend across every relay frame**, rather than final pose alone, and rejects a candidate that exceeded 0.65 rad even if the last frame recovers.
- An independent review of extracted 1440×900 and 932×480 screenshots confirmed the engineering skeleton/terrarium was rendered and transparent; it does not establish artist-approved final quality or temporal smoothness.
- **Promotion still withheld.** One experimental vector / scene is not general movement robustness. Before private integration: evaluate frame-by-frame animation (not only final screenshots), multiple body orientations/near-wall situations, head motion versus anatomy, and other terrains; verify exact source and tests on the selected public commit. Preserve private main until these are done.

## Security, copyright and operational cautions

- Public source, including synthetic fixtures, becomes permanently copyable and attributable to its repository history; never assume obscurity or that switching visibility to private retracts it.
- Do not commit private keys, service-role tokens, user information, private design memory, private audio (especially assets labeled `unverified_do_not_publish`), third-party content without verified rights or closed-source engine business logic.
- Public Actions checkout uses read-only `contents: read`; no private token, cross-repository write token, public workflow pull of a private repository, or default automatic mirroring.
- When comparing future fixes, the approved public commit is the exact source of truth for candidate QA. The private game can diverge until deliberate promotion.
