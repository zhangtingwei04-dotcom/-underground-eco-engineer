/**
 * PROJECT OHM public synthetic V0.9H — body-aware return preflight.
 *
 * Preview two inward/outward turn signs using the EXISTING 24-joint 0.9C
 * source controller and unchanged 0.9D capsule + 0.9G turning guards.
 * This does not plan a new route. It refuses to bless a bidirectional XY
 * graph when an actual source-body turn cannot pass the preview horizon.
 * Both trials are immutable, replayable shadows of the SAME source state.
 * No movement, head or mesh collision authority or player save is changed.
 */
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';

export const SNAKE_RETURN_SPACE_PREFLIGHT_V09H_VERSION='0.9H';
const F=Object.freeze;
const num=n=>typeof n==='number'&&Number.isFinite(n);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

function valid(state,scene,terrain,horizonFrames,seconds){
 if(state?.version!=='0.9C'||state.phase!=='moving_return'||
   state.pose?.points?.length!==24||
   state.relayState?.version!=='0.7U'||
   ![1,-1].includes(state.returnTurnSign)||
   state.returnTurnCommitted!==true||
   !Array.isArray(state.route)||state.route.length<2||
   !state.startFloor||!num(state.startFloor.x)||!num(state.startFloor.y)||
   !scene||!terrain||
   !Number.isInteger(horizonFrames)||horizonFrames<12||
   horizonFrames>180||!num(seconds)||seconds<=0||seconds>.05)
  throw new RangeError('v09h_requires_verified_source_return_turn');
}
function trial({state,scene,terrain,seconds,horizonFrames,sign}){
 // Only the routing preference changes in this shadow, not the source pose,
 // source bone positions, relay state or scene. V0.9C still advances the
 // original controls and V0.9D/G must check EVERY proposed source frame.
 let candidate=F({...state,returnTurnSign:sign});
 const startFrame=state.verifiedFrames;
 let steps=0,minimumCapsuleGap=Infinity,reason=null;
 let outcome='horizon_preview_clear',lastHead=null;
 while(steps<horizonFrames){
  const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
   state:candidate,scene,terrain,seconds
  });
  if(next.phase==='turn_space_hold'||
     next.phase==='self_clearance_stop'||next.phase==='stopped'){
   outcome='source_rejected';
   reason=next.reason??next.turnSpaceV09g??'source_stop';
   break;
  }
  if(next.phase==='return_head_arrived'){
   outcome='head_only_arrived_in_preview';
   lastHead=snakeFloorToTerrariumV07c(next.pose.points[0]);
   candidate=next;
   break;
  }
  if(next.phase!=='moving_return'||
     next.verifiedFrames<candidate.verifiedFrames||
     next.verifiedFrames>candidate.verifiedFrames+1){
   outcome='unexpected_source_transition';
   reason='return_phase_or_frame_not_proved';
   break;
  }
  // Explicitly audit every accepted candidate source pose (in addition
  // to the V0.9D guard inside V0.9G).
  const clearance=inspectSnakeSelfClearanceV09d({pose:next.pose});
  if(!clearance.candidateClearanceAccepted){
   outcome='source_rejected';
   reason='v09d_post_step_clearance_failed';
   break;
  }
  minimumCapsuleGap=Math.min(minimumCapsuleGap,
   clearance.minimumCapsuleGap);
  lastHead=snakeFloorToTerrariumV07c(next.pose.points[0]);
  steps++;
  candidate=next;
 }
 const clear=outcome==='horizon_preview_clear'&&
  steps===horizonFrames||
  outcome==='head_only_arrived_in_preview';
 return F({
  sign,outcome,reason,previewFrameCount:steps,
  sourceFrameAtEnd:candidate.verifiedFrames,
  returnedHeadOnly:outcome==='head_only_arrived_in_preview',
  safeForOneCandidateStep:clear,
  headDistanceToStartPixels:lastHead?
   dist(lastHead,state.startFloor):Infinity,
  minimumSourceCapsuleGap:minimumCapsuleGap,
  sourceHeadAndBonesUnchangedByPreflight:true,
  meshSurfaceSweepCertified:false,
  fullBodyReturnCertified:false
 });
}
/**
 * Only a successful entire source-backed preview can propose a sign. The
 * preferred sign wins exact ties; otherwise choose lower head-to-start
 * distance, then higher capsule separation, then original sign.
 * No previewed frame is committed by this function.
 */
export function preflightSnakeReturnSpaceV09h({
 state,scene,terrain,seconds=1/30,horizonFrames=90
}={}){
 valid(state,scene,terrain,horizonFrames,seconds);
 const before=inspectSnakeSelfClearanceV09d({pose:state.pose});
 if(!before.candidateClearanceAccepted)
  return F({version:SNAKE_RETURN_SPACE_PREFLIGHT_V09H_VERSION,
   ok:false,status:'initial_source_not_clear',
   selectedSign:null,candidates:F([]),
   sourceFrameAtStart:state.verifiedFrames,
   actuallyMovedSource:false,alternateRouteFound:false,
   fullBodyReturnCertified:false,skinApplied:false,saveModified:false});
 const candidates=F([1,-1].map(sign=>trial({
  state,scene,terrain,seconds,horizonFrames,sign
 })));
 const approved=candidates.filter(x=>x.safeForOneCandidateStep);
 approved.sort((a,b)=>
   a.headDistanceToStartPixels-b.headDistanceToStartPixels||
   b.minimumSourceCapsuleGap-a.minimumSourceCapsuleGap||
   Number(b.sign===state.returnTurnSign)-
   Number(a.sign===state.returnTurnSign));
 const winner=approved[0]??null;
 return F({
  version:SNAKE_RETURN_SPACE_PREFLIGHT_V09H_VERSION,
  ok:winner!==null,
  status:winner?'source_horizon_preview_clear':'no_verified_turn_space',
  selectedSign:winner?.sign??null,
  candidates,previewHorizonFrames:horizonFrames,
  sourceFrameAtStart:state.verifiedFrames,
  sourceJointsUnchanged:true,sourceHeadColliderUnchanged:true,
  actuallyMovedSource:false,
  // Returned sign is not a new global route or a whole-body clearance
  // guarantee. Re-run V0.9D/G on every committed source step.
  alternateRouteFound:false,
  fullBodyReturnCertified:false,gameplayNavigationAuthorized:false,
  meshSurfaceSweepCertified:false,skinApplied:false,saveModified:false
 });
}
/**
 * Optional caller convenience: take at most ONE genuine, source-verified
 * step from the sign selected by preflight. Never commit preview frames.
 * If both signs fail: HOLD. No sign or frame is forged.
 */
export function advanceSnakeReturnWithPreflightV09h({
 state,scene,terrain,seconds=1/30,horizonFrames=90
}={}){
 const preview=preflightSnakeReturnSpaceV09h({
  state,scene,terrain,seconds,horizonFrames
 });
 if(!preview.ok)
  return F({version:SNAKE_RETURN_SPACE_PREFLIGHT_V09H_VERSION,
   phase:'return_wait_for_space',reason:preview.status,
   previousState:state,preview,renderablePose:null,
   newlyAcceptedSourceStep:false,returnRouteCompleted:false,
   gameplayNavigationAuthorized:false,saveModified:false,skinApplied:false});
 const chosen=F({...state,returnTurnSign:preview.selectedSign});
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:chosen,scene,terrain,seconds
 });
 if(!['moving_return','return_head_arrived'].includes(next.phase))
  return F({version:SNAKE_RETURN_SPACE_PREFLIGHT_V09H_VERSION,
   phase:'return_wait_for_space',
   reason:'one_step_replay_not_accepted',previousState:state,
   preview,renderablePose:null,newlyAcceptedSourceStep:false,
   returnRouteCompleted:false,gameplayNavigationAuthorized:false,
   saveModified:false,skinApplied:false});
 return F({...next,preflightV09h:'single_real_source_step_after_preview',
  preflightSelectedSign:preview.selectedSign,
  preflightPreviewFrames:horizonFrames,
  newlyAcceptedSourceStep:next.verifiedFrames>state.verifiedFrames,
  fullBodyReturnVerified:false,gameplayNavigationAuthorized:false,
  skinApplied:false,saveModified:false});
}
