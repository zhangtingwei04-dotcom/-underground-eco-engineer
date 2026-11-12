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

## Current promotion gate

- V0.7Y slender translucent rig, V0.7Z clearance and V0.8A single-pass alpha are under QA.
- Source-backed unit suite, pixel terrarium Chromium and V0.8A held-pose Chrome A/B passed in the public run [43208050027](https://github.com/zhangtingwei04-dotcom/-underground-eco-engineer/actions/runs/43208050027).
- **BLOCKED:** Strict real moving-snake Chrome QA reported local 3D bend **0.737558 rad**, above the existing visual threshold **0.65 rad**. This is a quality defect, not a reason to raise the threshold. Full two-landscape-mode QA (36 PNGs) is not accepted.
- **No promotion of unqualified public changes** into private `main`. Previously committed V0.8A private experiments are historical baseline, not evidence that new public iterations passed.

## Security, copyright and operational cautions

- Public source, including synthetic fixtures, becomes permanently copyable and attributable to its repository history; never assume obscurity or that switching visibility to private retracts it.
- Do not commit private keys, service-role tokens, user information, private design memory, private audio (especially assets labeled `unverified_do_not_publish`), third-party content without verified rights or closed-source engine business logic.
- Public Actions checkout uses read-only `contents: read`; no private token, cross-repository write token, public workflow pull of a private repository, or default automatic mirroring.
- When comparing future fixes, the approved public commit is the exact source of truth for candidate QA. The private game can diverge until deliberate promotion.
