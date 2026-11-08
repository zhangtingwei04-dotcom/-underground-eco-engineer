# Cloudflare cloud saves — bootstrap (2026-11-08)

## Current deployment
- Cloudflare Worker: `scales-seeds-save-api` (uploaded and deployed).
- D1 database: `scales-seeds-player-saves`; binding name `DB`.
- D1 schema created manually: `player_accounts`, `player_saves`, `save_revisions`.
- Worker has **only** `GET /health` and returns 404 for all other routes. No player-save API is available yet.
- The `databaseConnected` field means the binding exists, not that a database query was tested.
- This repository file mirrors the initial Worker source; subsequent deployments should keep it synchronized.

## Important security gate before enabling reads or writes
- Existing `AuthSystem` relies on Supabase Auth. Validate server-side identity using a verified access token; never trust a client-supplied `player_id`, nickname or URL parameter as authorization.
- Ensure authenticated subject owns the save. Do not allow anonymous writes, cross-user reads or unauthenticated recovery by public player ID.
- Version writes transactionally (current record + immutable history), enforce maximum payload size and optimistic revision checks; preserve historical backups.
- Add proper CORS allowlist once actual hosting origin is established.
- Confirm canonical Supabase URL/key configuration: `supabase-config.js` currently appears to assign a publishable key to URL and a REST URL to key. The client must not receive any service-role secret.
- Keep legacy Supabase and guest local saves working until migration, validation and rollback paths are tested.
- Do not automatically overwrite a newer remote save with a stale local save.
- Verify API end-to-end and use a separate test account before enabling game client calls.

## Next
1. Verify working Supabase login session and backend token validation approach.
2. Implement authenticated Worker routes and conflict-safe versioning.
3. Test create/read/restore against D1 with a dedicated test identity.
4. Integrate with `src/systems/cloud-save-system.js` using feature gating and gradual rollout.
