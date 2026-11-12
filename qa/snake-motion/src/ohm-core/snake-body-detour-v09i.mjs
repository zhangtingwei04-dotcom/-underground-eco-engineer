/**
 * Public neutral Project OHM V0.9I — source-backed staging detours.
 *
 * Different from V0.9H's two signs: this generates genuinely distinct
 * temporary 2D STAGING routes, excludes static scene obstacles and most
 * nonlocal occupied body, then follows each candidate using exactly the
 * existing V0.9C source controller and V0.9D/G safety gates.
 *
 * No generated XY route is "safe" merely because this planner draws it.
 * A 160-frame preview can authorize at most one source-backed step.
 * It cannot certify a full return, swept 3D mesh/self-contact or terrain
 * forces. No original species, player data, skin, pose repair or teleport.
 */
import {createSnakeTerrariumCorridorV07c,snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';

export const SNAKE_BODY_DETOUR_V09I_VERSION='0.9I';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const p=(x,y)=>F({x,y});
const fieldScene=(scene,terrain)=>JSON.stringify({
 id:scene?.sceneId,revision:scene?.revision,minute:scene?.minute,
 objects:scene?.objects,terrain
});
function isValidState(state,scene,terrain,horizonFrames,seconds){
 if(state?.version!=='0.9C'||state.phase!=='moving_return'||
  state.pose?.points?.length!==24||
  state.relayState?.version!=='0.7U'||
  !Array.isArray(state.route)||state.route.length<2||
  !state.startFloor||![state.startFloor.x,state.startFloor.y].every(finite)||
  !scene||!terrain||!Number.isInteger(horizonFrames)||
  horizonFrames<30||horizonFrames>180||
  !finite(seconds)||seconds<=0||seconds>.05)
  throw new RangeError('v09i_invalid_return_source');
}
const lengthSquared=v=>dot(v,v);
function pointSegmentDistance(x,a,b){
 const ab={x:b.x-a.x,y:b.y-a.y};
 const t=lengthSquared(ab)>1e-10?
  Math.max(0,Math.min(1,dot({x:x.x-a.x,y:x.y-a.y},ab)/
   lengthSquared(ab))):0;
 return d(x,{x:a.x+t*ab.x,y:a.y+t*ab.y});
}
function boundsAndSceneClear(a,b,scene,pad){
 // The source scene owns AABB solid XY footprints, regardless of
 // rendering opacity. The endpoints alone are NOT enough.
 const bounds=q=>q.x>=pad&&q.x<=1000-pad&&
  q.y>=pad&&q.y<=400-pad;
 if(!bounds(a)||!bounds(b))return false;
 for(const o of scene.objects){
  const x0=o.x-pad,x1=o.x+o.width+pad,
   y0=o.y-pad,y1=o.y+o.depth+pad;
  let lo=0,hi=1;
  for(const [v,t,min,max] of [
   [a.x,b.x-a.x,x0,x1],[a.y,b.y-a.y,y0,y1]
  ]){
   if(Math.abs(t)<1e-10){
    if(v<min||v>max){lo=2;break;}
   }else{
    let enter=(min-v)/t,exit=(max-v)/t;
    if(enter>exit)[enter,exit]=[exit,enter];
    lo=Math.max(lo,enter);hi=Math.min(hi,exit);
   }
  }
  if(lo<=hi&&lo<=1&&hi>=0)return false;
 }
 return true;
}
function awayFromNonlocalBody(a,b,state,clearancePixels=23){
 // Sample the 2D staging corridors against canonical nonlocal joints 5+
 // (the first ~5 source links are the head/neck's own motion zone).
 // This is deliberately a proxy; 3D source safety must still be tested.
 const joints=state.pose.points.map(snakeFloorToTerrariumV07c);
 const length=d(a,b);
 const n=Math.max(1,Math.ceil(length/7));
 for(let k=0;k<=n;k++){
  const t=k/n;
  const q=p(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
  if(d(q,joints[0])<30)continue;
  for(let i=5;i<23;i++){
   if(pointSegmentDistance(q,joints[i],joints[i+1])<
      clearancePixels)return false;
  }
 }
 return true;
}
function candidatePaths(state,scene){
 const head=snakeFloorToTerrariumV07c(state.pose.points[0]);
 const vector=state.relayState.temporalState.v07sState.departure;
 const speed=Math.hypot(vector?.x??0,vector?.y??0);
 if(!finite(speed)||speed<.01||speed>.5)
  throw new RangeError('v09i_untrusted_source_direction');
 const forward={x:vector.x/speed,y:vector.y/speed};
 const side={x:-forward.y,y:forward.x};
 const target=state.startFloor;
 // Staging asks the head to progress forward and widen its turn BEFORE
 // aiming back. Return goal is still the original source startFloor.
 const configs=[
  ['forward_open',50,0,115,0],
  ['wide_left',55,22,120,63],
  ['wide_right',55,-22,120,-63],
  ['arc_left',70,38,120,98],
  ['arc_right',70,-38,120,-98]
 ];
 const candidates=[];
 const at=(along,offset)=>p(head.x+forward.x*along+side.x*offset,
  head.y+forward.y*along+side.y*offset);
 for(const [id,a,offsetA,b,offsetB] of configs){
  const first=at(a,offsetA),second=at(b,offsetB);
  const staging=[head,first,second];
  const open=staging.slice(1).every((stop,i)=>
   boundsAndSceneClear(staging[i],stop,scene,24)&&
   awayFromNonlocalBody(staging[i],stop,state));
  candidates.push(F({id,stageWaypoints:F(staging),
   proposedRoute:F([head,first,second,target]),
   stagingGeometryClear:open,
   stagingSceneAndBodyProxiesOnly:true
  }));
 }
 return F(candidates);
}
function shadowPreview(source,candidate,scene,terrain,horizonFrames,seconds){
 if(!candidate.stagingGeometryClear)
  return F({...candidate,accepted:false,reason:'staging_geometry_blocked',
   checkedSourceFrames:0,sourceLastFrame:source.verifiedFrames,
   lastHeadFloor:null,fullRouteProven:false});
 let state=F({...source,route:candidate.proposedRoute,
  // Different staging routes must actually affect desired steering;
  // do not force the inherited V0.9C interior-turn sign.
  returnTurnCommitted:false});
 let frames=0,reason=null,finalHead=null,minimumGap=Infinity;
 let result='preview_horizon_passed';
 for(;frames<horizonFrames;){
  const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
   state,scene,terrain,seconds
  });
  if(!['moving_return','return_head_arrived'].includes(next.phase)){
   result='source_rejected';
   reason=next.reason??next.phase;break;
  }
  if(next.phase==='return_head_arrived'){
   result='head_only_arrived_during_preview';
   state=next;
   finalHead=snakeFloorToTerrariumV07c(state.pose.points[0]);
   break;
  }
  if(next.verifiedFrames!==state.verifiedFrames+1){
   result='source_frame_discontinuity';
   reason='source_frame_increment_not_one';break;
  }
  const diagnostic=inspectSnakeSelfClearanceV09d({pose:next.pose});
  if(!diagnostic.candidateClearanceAccepted){
   result='source_rejected';
   reason='post_v09d_check_failed';break;
  }
  minimumGap=Math.min(minimumGap,diagnostic.minimumCapsuleGap);
  state=next;frames++;
  finalHead=snakeFloorToTerrariumV07c(state.pose.points[0]);
 }
 return F({...candidate,
  accepted:result==='preview_horizon_passed'&&
   frames===horizonFrames||
   result==='head_only_arrived_during_preview',
  result,reason,checkedSourceFrames:frames,
  sourceLastFrame:state.verifiedFrames,
  lastHeadFloor:finalHead,
  headDistanceToHome:finalHead?d(finalHead,source.startFloor):Infinity,
  minCapsuleGap:minimumGap,
  fullRouteProven:false,meshSweepCertified:false,
  actuallyMovedSource:false
 });
}
function baseResult(state,candidates,reason){
 return F({
  version:SNAKE_BODY_DETOUR_V09I_VERSION,ok:false,
  status:reason,sourceStartFrame:state.verifiedFrames,
  selectedCandidateId:null,selectedRoute:null,
  sourceJointsModified:false, sourceSceneModified:false,
  actuallyMovedSource:false,fullBodyReturnVerified:false,
  safeFullRouteFound:false,playerDataModified:false,
  skinApplied:false,meshSweepCertified:false,
  candidates:F(candidates)
 });
}
export function planSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames=160,seconds=1/30
}={}){
 isValidState(state,scene,terrain,horizonFrames,seconds);
 // Fail closed if caller's scene or terrain diverges from original V0.9C.
 if(state.sceneStamp!==fieldScene(scene,terrain)||
  state.sceneId!==scene.sceneId||
  state.sceneRevision!==scene.revision)
  return baseResult(state,[],'stale_scene_or_terrain');
 createSnakeTerrariumCorridorV07c(scene);
 const original=inspectSnakeSelfClearanceV09d({pose:state.pose});
 if(!original.candidateClearanceAccepted)
  return baseResult(state,[],'original_body_not_clear');
 const paths=candidatePaths(state,scene);
 const results=paths.map(candidate=>shadowPreview(
  state,candidate,scene,terrain,horizonFrames,seconds));
 const accepted=results.filter(v=>v.accepted);
 accepted.sort((a,b)=>
  a.headDistanceToHome-b.headDistanceToHome||
  b.minCapsuleGap-a.minCapsuleGap||
  a.id.localeCompare(b.id,'en'));
 const winner=accepted[0]??null;
 return F({
  version:SNAKE_BODY_DETOUR_V09I_VERSION,
  ok:!!winner,
  status:winner?'staging_source_preview_passed':
   'no_verified_staging_detour',
  sourceStartFrame:state.verifiedFrames,
  selectedCandidateId:winner?.id??null,
  selectedRoute:winner?.proposedRoute??null,
  candidates:F(results),
  evaluatedDistinctStagingRoutes:paths.length,
  sourceJointsModified:false,sourceSceneModified:false,
  actuallyMovedSource:false,
  // Source-backed first horizon is necessary, not proof of a full return.
  safeFullRouteFound:false,fullBodyReturnVerified:false,
  playerDataModified:false,skinApplied:false,meshSweepCertified:false
 });
}
export function advanceSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames=160,seconds=1/30
}={}){
 const preview=planSnakeBodyDetourV09i({
  state,scene,terrain,horizonFrames,seconds
 });
 if(!preview.ok)
  return F({version:SNAKE_BODY_DETOUR_V09I_VERSION,
   phase:'return_wait_for_space',previousState:state,
   reason:preview.status,preview,renderablePose:null,
   newlyAcceptedSourceStep:false,
   gameplayNavigationAuthorized:false,
   fullBodyReturnVerified:false,saveModified:false,
   skinApplied:false});
 const candidate=F({...state,
  route:preview.selectedRoute,returnTurnCommitted:false});
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:candidate,scene,terrain,seconds
 });
 if(next.phase!=='moving_return'||
  next.verifiedFrames!==state.verifiedFrames+1)
  return F({version:SNAKE_BODY_DETOUR_V09I_VERSION,
   phase:'return_wait_for_space',reason:'first_source_replay_rejected',
   previousState:state,preview,renderablePose:null,
   newlyAcceptedSourceStep:false,
   gameplayNavigationAuthorized:false,
   fullBodyReturnVerified:false,saveModified:false,
   skinApplied:false});
 return F({...next,
  v09iSourceBackedDetour:preview.selectedCandidateId,
  v09iPreviewHorizon:horizonFrames,
  newlyAcceptedSourceStep:true,
  safeFullRouteFound:false,fullBodyReturnVerified:false,
  gameplayNavigationAuthorized:false,skinApplied:false,
  saveModified:false});
}
