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
