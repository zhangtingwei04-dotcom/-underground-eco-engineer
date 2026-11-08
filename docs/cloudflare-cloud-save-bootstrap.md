# Cloudflare cloud saves — deployment record (2026-11-08)

## Deployed infrastructure
- Cloudflare Worker: `scales-seeds-save-api` (100% deployment reported in Cloudflare API).
- Worker public endpoint configured: `https://scales-seeds-save-api.scales-seeds-game.workers.dev`.
- Cloudflare account workers.dev subdomain: `scales-seeds-game`; script subdomain enabled; preview URLs disabled.
- D1: `scales-seeds-player-saves`, binding `DB`. Database schema query confirmed `player_accounts`, `player_saves`, `save_revisions`.
- Worker plain-text configuration `SUPABASE_PUBLISHABLE_KEY` is **public publishable**, not a privileged service-role key.
- Server uses Supabase Auth `GET /auth/v1/user` to validate bearer access tokens; `user.id` determines save ownership. No client-chosen player ID is trusted.
- `GET /health`: service status; `GET /v1/save`: current user's save; `PUT /v1/save`: revision-checked write; `GET /v1/revisions`: recent metadata.
- All `/v1` endpoints require authentication. Explicit origin allowlist currently includes `https://zhangtingwei04-dotcom.github.io`; update after confirming actual deployment origin.
- Writes use D1 batch for account, current revision and history. The current initial 3-table schema is unchanged.
- Hard cap: 512 KiB request. Slot: main only. API currently lists revision metadata, but does not offer restore endpoint.
- Application still uses previous Supabase cloud-save implementation. **Do not claim end-to-end cloud sync works** until real login and save tests pass.
- The public config file `supabase-config.js` was corrected: publishable key and base URL now in correct fields.

## Validation status and known limitations
- Verified through Cloudflare management API: deployment, bindings, workers.dev settings, D1 table list.
- Could not verify HTTP response from workers.dev endpoint in this session (external network/DNS unavailable). Test `GET /health`, unauthenticated `GET /v1/save` (must return 401), and authenticated save/read/conflict cases before release.
- Never log access tokens or player save payloads.
- Test two distinct users to ensure user A cannot see user B's saves.
- Verify whether the game is hosted at the allowlisted origin; a different origin will be rejected until updated.
- Protect against newer remote data being replaced by stale local saves; require explicit conflict resolution in client.
- Inspect D1 revisions and use a test identity before real player data. Existing live users/data should not be migrated or overwritten yet.
- Consider rate limiting, backup retention, scheduled snapshots, schema migrations, monitoring, optional save restore, and production hardening.
- GitHub Worker source: `cloudflare/worker.js`. Keep deployed source synchronized.

## Next safe integration steps
1. Test Worker reachability and unauthorized-response using a browser / test tool.
2. Use a test Supabase login session for PUT/GET/revision-conflict tests.
3. Implement explicit cloud provider selection in `src/systems/cloud-save-system.js` behind a feature flag.
4. Verify guest local saves and previous Supabase saves remain intact. Only then enable progressive rollout.
