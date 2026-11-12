/**
 * Public neutral Project OHM V0.9J — bounded autonomous source return.
 *
 * Unlike an endless V0.9I staging loop, this controller:
 * - re-evaluates BODY geometry at fixed, finite 24-joint source intervals;
 * - measures actual head-to-home progress, tail occupancy and stalling;
 * - fails closed on collision, environmental revision or budget expiry;
 * - rests rather than fabricating a new position or claiming full arrival.
 *
 * Each choice is a V0.9I SHADOW trial through unchanged V0.9C, V0.9D/G.
 * Replanning itself commits zero pose frames. Movement commits exactly
 * one source frame with existing guards. Head arrival is NOT full-body
 * arrival, 3D swept collision, animal welfare or a physics proof.
 */
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';
import {planSnakeBodyDetourV09i}
 from './snake-body-detour-v09i.mjs';
import {chooseSnakeGoalReturnV09k}
 from './snake-goal-return-selection-v09k.mjs';

export const SNAKE_RETURN_AUTOPILOT_V09J_VERSION='0.9J';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const stamp=(scene,terrain)=>JSON.stringify({
 id:scene?.sceneId,revision:scene?.revision,minute:scene?.minute,
 objects:scene?.objects,terrain
});
function measurements(source){
 const joints=source.pose.points.map(snakeFloorToTerrariumV07c);
 const x=joints.map(p=>p.x),y=joints.map(p=>p.y);
 const head=joints[0],tail=joints.at(-1);
 return F({
  head:F({x:head.x,y:head.y}),
  tail:F({x:tail.x,y:tail.y}),
  headToHomePx:dist(head,source.startFloor),
  tailToHomePx:dist(tail,source.startFloor),
  headTailSeparationPx:dist(head,tail),
  footprintBounds:F({minX:Math.min(...x),maxX:Math.max(...x),
   minY:Math.min(...y),maxY:Math.max(...y)})
 });
}
function stop(state,phase,reason,other={}){
 return F({...state,phase,reason,changedSourcePose:false,
  allowedGameplayMotion:false,fullBodyReturnVerified:false,
  playerObservationRecorded:false,skinApplied:false,saveModified:false,
  ...other});
}
function validateConfig({
 source,scene,terrain,replanIntervalFrames,
 previewHorizonFrames,maxReturnFrames,maxReplans,
 maximumStallWindows,minimumHomeProgressPx,
 maximumHeadDistanceToHomePx,seconds,routeSelectionMode
}){
 if(source?.version!=='0.9C'||source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  source.relayState?.version!=='0.7U'||
  !source.startFloor||!finite(source.startFloor.x)||
  !finite(source.startFloor.y)||!scene||!terrain||
  !Number.isInteger(replanIntervalFrames)||
  replanIntervalFrames<40||replanIntervalFrames>180||
  !Number.isInteger(previewHorizonFrames)||
  previewHorizonFrames<replanIntervalFrames||
  previewHorizonFrames>180||
  !Number.isInteger(maxReturnFrames)||maxReturnFrames<120||
  maxReturnFrames>2000||
  !Number.isInteger(maxReplans)||maxReplans<1||maxReplans>20||
  !Number.isInteger(maximumStallWindows)||
  maximumStallWindows<1||maximumStallWindows>8||
  !finite(minimumHomeProgressPx)||minimumHomeProgressPx<0||
  minimumHomeProgressPx>20||
  !finite(maximumHeadDistanceToHomePx)||
  maximumHeadDistanceToHomePx<100||
  maximumHeadDistanceToHomePx>600||
  !finite(seconds)||seconds<=0||seconds>.05||
  !['legacy_nearest_head','goal_revisit_v09k'].includes(routeSelectionMode))
  throw new RangeError('v09j_invalid_controller_source_or_config');
}
export function startSnakeReturnAutopilotV09j({
 source,scene,terrain,replanIntervalFrames=160,
 previewHorizonFrames=160,maxReturnFrames=1200,
 maxReplans=8,maximumStallWindows=4,
 minimumHomeProgressPx=5,maximumHeadDistanceToHomePx=260,
 routeSelectionMode='legacy_nearest_head',seconds=1/30
}={}){
 validateConfig({source,scene,terrain,replanIntervalFrames,
  previewHorizonFrames,maxReturnFrames,maxReplans,
  maximumStallWindows,minimumHomeProgressPx,
  maximumHeadDistanceToHomePx,seconds,routeSelectionMode});
 if(source.sceneId!==scene.sceneId||
  source.sceneRevision!==scene.revision||
  source.sceneStamp!==stamp(scene,terrain))
  throw new RangeError('v09j_stale_source_scene');
 const check=inspectSnakeSelfClearanceV09d({pose:source.pose});
 if(!check.candidateClearanceAccepted)
  throw new RangeError('v09j_initial_source_collision_risk');
 const body=measurements(source);
 return F({
  version:SNAKE_RETURN_AUTOPILOT_V09J_VERSION,
  phase:'active_return',reason:null,
  source,sceneStamp:stamp(scene,terrain),
  sourceStartFrame:source.verifiedFrames,
  replanIntervalFrames,previewHorizonFrames,maxReturnFrames,
  maxReplans,maximumStallWindows,
  minimumHomeProgressPx,maximumHeadDistanceToHomePx,seconds,
  routeSelectionMode,
  framesCommitted:0,replansPerformed:0,stepsSinceReplan:0,
  stalledWindows:0,
  initialDistanceToHomePx:body.headToHomePx,
  bestDistanceToHomePx:body.headToHomePx,
  bestTailDistanceToHomePx:body.tailToHomePx,
  baselineReplanDistancePx:body.headToHomePx,
  baselineReplanTailDistancePx:body.tailToHomePx,
  body,
  visitedHeadFloors:F([body.head]),
  chosenDetourId:null,detourHistory:F([]),
  noMotionWhenResting:true,sourceJointsRewritten:false,
  headOnlyArrivalVerified:false,
  fullBodyReturnVerified:false,allowedGameplayMotion:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * Run ONE controller tick. Replan only at segment boundaries; each
 * planned route is independently revalidated during actual source steps.
 * Terminal states are idempotent and do not advance virtual time.
 */
export function advanceSnakeReturnAutopilotV09j({
 state,scene,terrain
}={}){
 if(state?.version!==SNAKE_RETURN_AUTOPILOT_V09J_VERSION||
  !scene||!terrain)throw new RangeError('v09j_invalid_tick');
 if(state.phase!=='active_return')return state;
 if(state.sceneStamp!==stamp(scene,terrain)||
  state.source.sceneStamp!==stamp(scene,terrain)||
  state.source.sceneId!==scene.sceneId||
  state.source.sceneRevision!==scene.revision)
  return stop(state,'resting_scene_changed',
   'scene_revision_requires_new_source_validation');
 if(state.framesCommitted>=state.maxReturnFrames)
  return stop(state,'resting_budget_exhausted',
   'maximum_return_source_frames_reached');
 let current=state;
 if(!state.chosenDetourId||
    state.stepsSinceReplan>=state.replanIntervalFrames){
  if(state.replansPerformed>=state.maxReplans)
   return stop(state,'resting_budget_exhausted',
    'maximum_source_replans_reached');
  const currentDistance=state.body.headToHomePx;
  const gained=state.baselineReplanDistancePx-currentDistance;
  const tailGained=state.baselineReplanTailDistancePx-
   state.body.tailToHomePx;
  // A turning snake can move its head AWAY while its trailing body
  // genuinely approaches the goal. Require BOTH head and tail to stall
  // before declaring a non-improving 160-frame window. Still bound the
  // overall head range and total frames/replans to prevent endless loops.
  const stalled=state.replansPerformed===0?0:
   gained<state.minimumHomeProgressPx&&
   tailGained<state.minimumHomeProgressPx?
    state.stalledWindows+1:0;
  if(stalled>=state.maximumStallWindows)
   return stop(state,'resting_no_progress',
    'repeated_return_staging_without_home_progress',
    {stalledWindows:stalled});
  if(currentDistance>state.maximumHeadDistanceToHomePx)
   return stop(state,'resting_far_from_home',
    'head_moved_beyond_bounded_return_radius');
  const planned=planSnakeBodyDetourV09i({
   state:state.source,scene,terrain,
   horizonFrames:state.previewHorizonFrames,
   seconds:state.seconds
  });
  // V0.9K is opt-in: score only source-verified V0.9I candidates
  // against the original source-owned goal graph and REAL visited head
  // locations. Legacy V0.9J remains unchanged for A/B regression.
  const visited=F([...state.visitedHeadFloors,
   state.body.head].slice(-20));
  const ranked=state.routeSelectionMode==='goal_revisit_v09k'?
   chooseSnakeGoalReturnV09k({source:state.source,scene,planned,
    visitedHeadFloors:visited}):null;
  const selectedId=ranked?ranked.selectedId:planned.selectedCandidateId;
  const selectedRoute=ranked?ranked.selectedRoute:planned.selectedRoute;
  const selectionOk=ranked?ranked.ok:planned.ok;
  const log=F({sourceFrame:state.source.verifiedFrames,
   selectedId,
   attempted:planned.candidates.length,
   approved:planned.candidates.filter(c=>c.accepted).length,
   headDistancePx:currentDistance,
   tailDistancePx:state.body.tailToHomePx,
   homeImprovementSinceLastReplanPx:gained,
   tailImprovementSinceLastReplanPx:tailGained,
   stalledWindows:stalled,
   routeSelected:selectionOk,
   goalRankStatus:ranked?.status??null,
   goalRankedCandidates:ranked?.candidateScores??null});
  const history=F([...state.detourHistory,log]);
  if(!selectionOk)
   return stop({...state,detourHistory:history},
    'resting_no_safe_detour',ranked?.status??planned.status);
  current=F({...state,
   source:F({...state.source,route:selectedRoute,
    returnTurnCommitted:false}),
   detourHistory:history,chosenDetourId:selectedId,
   visitedHeadFloors:visited,
   replansPerformed:state.replansPerformed+1,
   stepsSinceReplan:0,baselineReplanDistancePx:currentDistance,
   baselineReplanTailDistancePx:state.body.tailToHomePx,
   stalledWindows:stalled});
 }
 const step=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:current.source,scene,terrain,seconds:state.seconds
 });
 if(step.phase==='return_head_arrived'){
  return stop({...current,source:step,headOnlyArrivalVerified:true},
   'head_only_arrived','head_close_to_origin_full_body_unverified');
 }
 if(step.phase!=='moving_return'||
   step.verifiedFrames!==current.source.verifiedFrames+1)
  return stop(current,'resting_source_safety',
   'v09c_v09d_v09g_step_rejected',
   {lastRejectedReason:step.reason??step.phase});
 const body=measurements(step);
 if(body.headToHomePx>state.maximumHeadDistanceToHomePx)
  return stop(current,'resting_far_from_home',
   'next_source_step_outside_return_bounds',
   {lastRejectedReason:'head_distance_exceeded'});
 return F({...current,source:step,body,
  framesCommitted:current.framesCommitted+1,
  stepsSinceReplan:current.stepsSinceReplan+1,
  bestDistanceToHomePx:Math.min(current.bestDistanceToHomePx,
   body.headToHomePx),
  bestTailDistanceToHomePx:Math.min(
   current.bestTailDistanceToHomePx,body.tailToHomePx),
  changedSourcePose:true,
  sourceJointsRewritten:false,
  allowedGameplayMotion:false,
  fullBodyReturnVerified:false,saveModified:false,skinApplied:false});
}
