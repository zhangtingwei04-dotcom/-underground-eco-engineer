/**
 * PUBLIC synthetic OHM V0.9C — source-validated, multi-frame route follower.
 * Uses a V0.9B source-scene XY route and a V0.9A 24-joint departure;
 * subsequent turns preserve the SAME V0.7U relay/temporal/body state.
 *
 * No new physics authority. This does not certify self-collision, physical
 * forces, climbing, underground life, true complete 3D return or animal
 * welfare. The safe-return *graph* is XY only, and stops remain possible.
 * No formal player saves, no Journal or skin.
 */
import {planSnakeSceneAutonomyV09b,findSnakeSceneRouteV09b}
 from './snake-scene-route-v09b.mjs';
import {verifySnakeAutonomousSegmentV09a}
 from './snake-autonomous-intent-v09a.mjs';
import {advanceSnakeCurvatureRelayV07u}
 from './snake-curvature-relay-v07u.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from './snake-temporal-continuity-v08d.mjs';
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {pauseAndReplanSnakeV08f}
 from './snake-dynamic-replan-v08f.mjs';

export const SNAKE_ROUTE_FOLLOWER_VERSION='0.9C';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const MAX_TURN_PER_FRAME=.016;
const TOLERANCE_PIXELS=9;
const norm=v=>Math.hypot(v.x,v.y);
const stamp=(scene,terrain)=>JSON.stringify({
 id:scene?.sceneId,revision:scene?.revision,minute:scene?.minute,
 objects:scene?.objects,terrain
});
const staticStop=(reason,other={})=>F({
 ok:false,version:SNAKE_ROUTE_FOLLOWER_VERSION,
 phase:'stopped',reason,renderablePose:null,
 sourcePoseAccepted:false,gameplayNavigationAuthorized:false,
 destinationArrived:false,skinApplied:false,
 playerObservationRecorded:false,saveModified:false,...other
});
function followPoint(path,head,lookahead){
 if(!Array.isArray(path)||path.length<2)return null;
 let best=null,along=0,length=0;
 const lengths=[0];
 for(let i=1;i<path.length;i++){
  length+=distance(path[i],path[i-1]);lengths.push(length);
 }
 for(let i=1;i<path.length;i++){
  const a=path[i-1],b=path[i],dx=b.x-a.x,dy=b.y-a.y;
  const len2=dx*dx+dy*dy;
  if(len2<1e-10)continue;
  const t=clamp(((head.x-a.x)*dx+(head.y-a.y)*dy)/len2,0,1);
  const p={x:a.x+t*dx,y:a.y+t*dy};
  const d=distance(p,head),pos=lengths[i-1]+t*(lengths[i]-lengths[i-1]);
  if(best===null||d<best.d-1e-8||
    Math.abs(d-best.d)<1e-8&&pos>best.s)
   best={s:pos,d};
 }
 if(!best)return null;
 const requested=Math.min(length,best.s+lookahead);
 for(let i=1;i<path.length;i++){
  if(lengths[i]>=requested-1e-8){
   const ratio=lengths[i]-lengths[i-1]>1e-8?
    (requested-lengths[i-1])/(lengths[i]-lengths[i-1]):0;
   return F({x:path[i-1].x+(path[i].x-path[i-1].x)*ratio,
    y:path[i-1].y+(path[i].y-path[i-1].y)*ratio,
    nearestPathDistancePixels:best.d,progressPixels:best.s,
    totalPixels:length});
  }
 }
 return F({...path.at(-1),nearestPathDistancePixels:best.d,
  progressPixels:best.s,totalPixels:length});
}
const frozenState=s=>F(s);
/**
 * Start from a fully rested real 13-bone source, use the SAME 24-bone source
 * for 60 initial frames. A new body is never spawned at route waypoints.
 */
export function startSnakeRouteFollowerV09c({
 actorId='synthetic_snake',scene,terrain,wallState,ecologySnapshot,
 needs={},dayPhase='day',siteFloors,gridPixels=20,
 bodyClearancePixels=22,horizonFrames=60,
 autoReturn=false
}={}){
 if(typeof autoReturn!=='boolean')throw new RangeError('v09c_invalid_return_option');
 const plan=planSnakeSceneAutonomyV09b({
  actorId,scene,terrain,wallState,ecologySnapshot,needs,dayPhase,
  siteFloors,gridPixels,bodyClearancePixels,horizonFrames
 });
 if(!plan.ok)return staticStop('no_authorized_initial_segment',{
  plan,actorId,sceneRevision:scene?.revision??null
 });
 const checked=verifySnakeAutonomousSegmentV09a({
  plan:plan.motion,wallState,scene,terrain
 });
 if(!checked.ok)return staticStop('first_segment_source_rejected',{
  plan,reasonDetail:checked.reason,actorId
 });
 const target=siteFloors[plan.motion.targetId],start=plan.sourceHeadFloor;
 const route=findSnakeSceneRouteV09b({
  scene,startFloor:start,goalFloor:target,gridPixels,
  bodyClearancePixels,expectedRevision:scene.revision
 });
 if(route.status!=='SAFE_GRID_BIDIRECTIONAL')
  return staticStop('graph_invalidated_before_start',{plan,actorId});
 return frozenState({
  version:SNAKE_ROUTE_FOLLOWER_VERSION,phase:'moving_outbound',
  actorId,sceneId:scene.sceneId,sceneRevision:scene.revision,
  sceneStamp:stamp(scene,terrain),
  route:F(route.path),returnGraph:F(route.returnPath),
  startFloor:start,goalFloor:F({...target}),
  gridPixels,bodyClearancePixels,
  autoReturn,completedOutbound:false,completedReturn:false,
  targetSiteId:plan.motion.targetId,actionKind:plan.motion.chosenActivity,
  relayState:checked.nextRelayState,pose:checked.pose,
  verifiedFrames:checked.completedEvent.verifiedFrames,
  stepCountAfterStart:0,rejections:F([]),
  status:'24_joint_source_checked_initial_segment_with_scene_xy_graph',
  sourceCollisionEveryStep:true,fullBodyReturnVerified:false,
  selfContactVerified:false,
  destinationArrived:false,
  skinApplied:false,playerObservationRecorded:false,
  saveModified:false,gameplayNavigationAuthorized:false
 });
}
/** Input world revision and terrain must match *every frame*. */
export function advanceSnakeRouteFollowerV09c({
 state,scene,terrain,seconds=1/30
}={}){
 if(state?.version!==SNAKE_ROUTE_FOLLOWER_VERSION||
   !['moving_outbound','moving_return'].includes(state.phase)||
   state.pose?.points?.length!==24||
   state.relayState?.version!=='0.7U'||
   !finite(seconds)||seconds<=0||seconds>.05)
  throw new RangeError('v09c_invalid_follower_step');
 if(state.sceneId!==scene?.sceneId||
    state.sceneRevision!==scene?.revision||
    state.sceneStamp!==stamp(scene,terrain))
  return staticStop('changed_scene_requires_source_replan',{
   actorId:state.actorId,sceneRevision:scene?.revision??null,
   previousState:state
  });
 const now=snakeFloorToTerrariumV07c(state.pose.points[0]);
 const goal=state.phase==='moving_return'?state.startFloor:state.goalFloor;
 if(distance(now,goal)<=TOLERANCE_PIXELS){
  if(state.phase==='moving_return')
   return frozenState({...state,phase:'return_head_arrived',
    completedReturn:true,verifiedArrivalHeadOnly:true,
    destinationArrived:false,fullBodyReturnVerified:false,
    status:'verified_head_return_with_source_24_joint_all_motion_frames_no_self_contact_certification'});
  if(!state.autoReturn)
   return frozenState({...state,phase:'outbound_head_arrived',
    completedOutbound:true,verifiedArrivalHeadOnly:true,
    destinationArrived:false,
    status:'head_near_goal_not_entire_animal_in_hide_or_water'});
  const back=findSnakeSceneRouteV09b({
   scene,startFloor:now,goalFloor:state.startFloor,
   expectedRevision:state.sceneRevision,
   gridPixels:state.gridPixels,
   bodyClearancePixels:state.bodyClearancePixels
  });
  if(back.status!=='SAFE_GRID_BIDIRECTIONAL')
   return staticStop('return_route_no_longer_reversible',{
    actorId:state.actorId,previousState:state
   });
  return frozenState({...state,phase:'moving_return',
   completedOutbound:true,route:F(back.path),
   status:'return_route_xy_recomputed_24_joint_source_follow_required'});
 }
 const target=followPoint(state.route,now,30);
 if(!target||target.nearestPathDistancePixels>65)
  return staticStop('physical_head_drifted_from_route',{
   actorId:state.actorId,drift:target?.nearestPathDistancePixels??null,
   previousState:state});
 const desired=Math.atan2(target.y-now.y,target.x-now.x);
 if(!finite(desired)||distance(now,target)<1e-4)
  return staticStop('no_valid_forward_lookahead',{
   actorId:state.actorId,previousState:state});
 const old=state.relayState.temporalState.v07sState.departure;
 const speed=norm(old);
 if(speed<.01||speed>.5)
  return staticStop('invalid_source_velocity',{actorId:state.actorId});
 const current=Math.atan2(old.y,old.x);
 const next=current+clamp(angleDelta(desired,current),
  -MAX_TURN_PER_FRAME,MAX_TURN_PER_FRAME);
 const controlled=F({...state.relayState,
  sourceDeparture:F({x:speed*Math.cos(next),y:speed*Math.sin(next)}),
  turnRadians:0
 });
 const step=advanceSnakeCurvatureRelayV07u(controlled,{scene,terrain,seconds});
 if(!step.ok)return staticStop('source_'+step.reason,{
  actorId:state.actorId,previousState:state});
 const quality=inspectSnakeTemporalContinuityV08d({
  previousPose:state.pose,pose:step.pose,seconds,
  visualBendLimit:.65
 });
 if(!quality.visualBendAccepted||quality.maxJointStep>.012+1e-9||
    quality.maxStepTangentRotationRadians>.045+1e-9)
  return staticStop('source_continuity_rejected',{
   actorId:state.actorId,previousState:state});
 // All 24 source nodes remain the same creature, and the V0.7S
 // checker already validated body/head/ground against the true scene.
 const nextState=frozenState({...state,
  relayState:step.nextState,pose:step.pose,
  verifiedFrames:state.verifiedFrames+1,
  stepCountAfterStart:state.stepCountAfterStart+1,
  lastHeadFloor:snakeFloorToTerrariumV07c(step.pose.points[0]),
  maximumBendLastFrame:quality.maximumBendRadians,
  maximumStepLastFrame:quality.maxJointStep,
  status:'source_checked_single_frame_not_all_route_arrival'
 });
 return nextState;
}
/**
 * When a scene changes, only V0.8F may prove whether the held body is still
 * valid. Even an accepted pause does NOT autonomously resume an old route.
 * A caller must explicitly decide how to restart navigation on new geometry.
 */
export function probeSnakeRouteChangedSceneV09c({
 state,updatedScene,terrain,horizonFrames=60
}={}){
 if(state?.version!==SNAKE_ROUTE_FOLLOWER_VERSION||
  state.relayState?.version!=='0.7U'||
  !['moving_outbound','moving_return'].includes(state.phase)||
  !updatedScene||!terrain)
  throw new RangeError('v09c_invalid_changed_scene_probe');
 if(state.sceneStamp===stamp(updatedScene,terrain))
  return F({version:SNAKE_ROUTE_FOLLOWER_VERSION,
   phase:'no_scene_change',ok:false,sourcePoseVerified:false});
 const old=state.relayState.temporalState.v07sState.departure;
 const speed=norm(old),heading=Math.atan2(old.y,old.x);
 const angles=[0,-.18,.18,-.32,.32];
 const candidates=angles.map((v,i)=>({
  id:'safe_probe_'+i,
  departure:{x:speed*Math.cos(heading+v),
   y:speed*Math.sin(heading+v)},turnRadians:0
 }));
 const paused=pauseAndReplanSnakeV08f({
  relayState:state.relayState,scene:updatedScene,terrain,
  candidates,horizonFrames
 });
 return F({
  version:SNAKE_ROUTE_FOLLOWER_VERSION,
  phase:'paused_scene_probe',ok:paused.ok,
  sourcePoseVerified:paused.sourcePoseRevalidated===true,
  selected:paused.selected,reason:paused.reason,
  pose:paused.pose,bodyMoved:false,
  safeResumeForOldDestinationAuthorized:false,
  routeRecalculated:false,privateSaveModified:false,
  skinApplied:false,paused
 });
}
