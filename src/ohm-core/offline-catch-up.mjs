/**
 * Ohm Core offline catch-up PLAN only.
 * No timers, storage, rewards, NPC mutations or network. This is NOT a save migration.
 * The caller must provide trusted lastSeen/now when authoritative outcomes matter.
 */
export const MAX_OFFLINE_DAYS = 30;
const DAY_MS=86400000;
const CHECKPOINT_HOURS=6;
const SIX_HOURS_MS=CHECKPOINT_HOURS*3600000;

/** Estimate checkpoints crossed for the fixed +08:00 pilot world-time zone.
 *  Do not use counts to grant rewards. Future time zones need a zone-aware adapter.
 */
export function planOfflineCatchUp({lastSeenMs,nowMs,maxDays=MAX_OFFLINE_DAYS,offsetMinutes=480}={}) {
  if(!Number.isSafeInteger(lastSeenMs)||!Number.isSafeInteger(nowMs)||
    !Number.isSafeInteger(maxDays)||maxDays<1||maxDays>MAX_OFFLINE_DAYS||
    !Number.isInteger(offsetMinutes)||offsetMinutes< -720||offsetMinutes>840)
    return {ok:false,error:'invalid_offline_context'};
  if(nowMs<lastSeenMs) return {ok:false,error:'clock_reversed'};
  const elapsedMs=nowMs-lastSeenMs;
  if(!Number.isSafeInteger(elapsedMs)) return {ok:false,error:'duration_overflow'};
  const appliedMs=Math.min(elapsedMs,maxDays*DAY_MS);
  const effectiveStart=nowMs-appliedMs;
  const offsetMs=offsetMinutes*60000;
  // Checkpoints at local 00, 06, 12, 18, excluding start and including now.
  const crossed=Math.floor((nowMs+offsetMs)/SIX_HOURS_MS)-
    Math.floor((effectiveStart+offsetMs)/SIX_HOURS_MS);
  return {
    ok:true,
    elapsedMs,
    appliedMs,
    elapsedDays:elapsedMs/DAY_MS,
    capped:elapsedMs>appliedMs,
    checkpointCount:crossed,
    // Informational only: no replaying intermediate NPC/world events.
    settlement:'summary_only',
    requiresTrustedTime:true,
    stateChangesApplied:false
  };
}
