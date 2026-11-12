/**
 * OHM SNAKE V0.7U — opt-in, very shallow head-led bend relay.
 *
 * Only wraps the already certified V0.7T resting 24-joint, 2.28-length
 * animal. The head takes a slow AUTHORED inward turn, while V0.7S's
 * link-length-preserving follower propagates the resulting curve rearward.
 * V0.7T alone owns speed/acceleration limits, V0.7S owns rock/ground/head
 * safety. This module NEVER authorizes old V0.7A's 2.5-unit route.
 *
 * Contact/quiet-joint outputs below are VISUAL DIAGNOSTICS, not proof of
 * real wall friction, animal muscles, traction or load transfer.
 * On any rejected step, return NULL pose/head/nextState.
 */
import {advanceSnakeGroundTemporalV07t}
 from './snake-ground-temporal-v07t.mjs';

export const SNAKE_CURVATURE_RELAY_VERSION='0.7U';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const inRange=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const fail=s=>{throw new RangeError(s)};
const pointDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clip=(n,a,b)=>Math.max(a,Math.min(n,b));
const smooth=t=>{const v=clip(t,0,1);return v*v*(3-2*v)};
const denial=(reason,extra={})=>F({
 version:SNAKE_CURVATURE_RELAY_VERSION,ok:false,reason,
 pose:null,head:null,nextState:null,skinApplied:false,
 physicsVerified:false,realContactMigrationVerified:false,
 muscleWaveVerified:false,gameTravelRouteAuthorized:false,
 playableCaveAuthorized:false,...extra
});
function bends(points){
 const result=[];
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const x1=b.x-a.x,y1=b.y-a.y;
  const x2=c.x-b.x,y2=c.y-b.y;
  const m1=Math.hypot(x1,y1),m2=Math.hypot(x2,y2);
  if(m1<1e-5||m2<1e-5)fail('v07u_degenerate_ground_bend');
  result.push(Math.atan2(x1*y2-y1*x2,x1*x2+y1*y2));
 }
 return F(result);
}
const wrapped=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function velocities(now,before,seconds){
 if(seconds===0)return F(now.map(()=>0));
 return F(now.map((p,i)=>pointDist(p,before[i])/seconds));
}
const contactProxy=(indices,speeds,cutoff,points)=>{
 const grounded=new Set(indices);
 const quiet=[],moving=[];
 for(let i=0;i<points.length;i++){
  if(!grounded.has(i))continue;
  if(speeds[i]<=cutoff)quiet.push(i);
  else moving.push(i);
 }
 const center=quiet.length?F({
  x:quiet.reduce((a,i)=>a+points[i].x,0)/quiet.length,
  y:quiet.reduce((a,i)=>a+points[i].y,0)/quiet.length
 }):null;
 return F({
  quietIndices:F(quiet),movingIndices:F(moving),
  supportProxyCenter:center,
  allGroundedCount:indices.length,
  // Quiet does NOT mean mechanically anchored. At this stage the whole
  // low-body z-line rests on a flat authored ground plane.
  contactForcesComputed:false
 });
};
export function createSnakeCurvatureRelayV07u({
 temporalState,turnRadians=.24,
 turnStartSeconds=.42,turnDurationSeconds=1.2,
 angularStepLimit=.035,quietSpeedCutoff=.022
}={}){
 const source=temporalState?.v07sState;
 const departure=source?.departure;
 const points=source?.pose?.points;
 if(temporalState?.version!=='0.7T'||
    temporalState.sourceVersion!=='0.7S'||
    temporalState.frames!==0||temporalState.elapsedSeconds!==0||
    source?.version!=='0.7S'||
    source.frames!==0||source.seconds!==0||
    source.sourceJointCount!==13||source.targetJointCount!==24||
    !inRange(source.sourceTotalLength,2.28-1e-9,2.28+1e-9)||
    !Array.isArray(points)||points.length!==24||
    !inRange(departure?.x,-.5,.5)||
    !inRange(departure?.y,-.5,.5)||
    !inRange(turnRadians,-.32,.32)||
    !inRange(turnStartSeconds,.15,1.2)||
    !inRange(turnDurationSeconds,.7,2)||
    !inRange(angularStepLimit,.002,.1)||
    !inRange(quietSpeedCutoff,.005,.1))
  fail('v07u_requires_resting_same_animal_source_with_safe_shallow_turn');
 const initialBends=bends(points);
 const departureSpeed=Math.hypot(departure.x,departure.y);
 if(departureSpeed<.01)fail('v07u_zero_authorized_departure');
 return F({
  version:SNAKE_CURVATURE_RELAY_VERSION,
  temporalState,sourceDeparture:F({...departure}),
  sourceTotalLength:source.sourceTotalLength,
  turnRadians,turnStartSeconds,turnDurationSeconds,
  angularStepLimit,quietSpeedCutoff,
  initialBends,previousBends:initialBends,
  firstBendFrames:F(Array.from({length:22},()=>null)),
  frames:0,seconds:0,
  lastQuietIndices:F([...source.contactIndices]),
  quietFramesObserved:0,movingFramesObserved:0,
  coexistFramesObserved:0,
  status:'authored_shallow_turn_and_ground_quiet_proxy_not_real_contact_physics'
 });
}
export function advanceSnakeCurvatureRelayV07u(state,{
 scene,terrain,seconds=1/30
}={}){
 if(state?.version!==SNAKE_CURVATURE_RELAY_VERSION||
    state.temporalState?.version!=='0.7T'||
    state.initialBends?.length!==22||
    state.previousBends?.length!==22||
    state.firstBendFrames?.length!==22||
    !Number.isInteger(state.frames)||state.frames<0||
    state.frames!==state.temporalState.frames||
    !inRange(seconds,0,.1)||
    !inRange(state.seconds,0,60))
  fail('v07u_invalid_relay_state_or_clock');
 const t=state.seconds+seconds;
 const turn=state.turnRadians*smooth(
  (t-state.turnStartSeconds)/state.turnDurationSeconds
 );
 const c=Math.cos(turn),s=Math.sin(turn),v=state.sourceDeparture;
 const departure=F({x:c*v.x-s*v.y,y:s*v.x+c*v.y});
 const src=state.temporalState.v07sState;
 // A derived *ephemeral* copy is supplied to the V0.7S validator.
 // Scene identity, revision, objects, terrain, 3D pose and bone length
 // are preserved exactly; only the authored shallow heading changes.
 const steered=F({...src,departure});
 const source=F({...state.temporalState,v07sState:steered});
 const step=advanceSnakeGroundTemporalV07t(source,{
  scene,terrain,seconds
 });
 if(!step.ok)return denial(step.reason,{
  underlyingVersion:'0.7T',upstreamRejected:true
 });
 const now=step.pose.points,previous=src.pose.points;
 const currentBends=bends(now);
 const deltas=F(currentBends.map((b,i)=>Math.abs(
  wrapped(b,state.previousBends[i])
 )));
 const maxStep=Math.max(...deltas);
 if(maxStep>state.angularStepLimit+1e-8)
  return denial('v07u_unbounded_curvature_rotation',{
   maxAngularStep:maxStep
  });
 const changed=F(currentBends.map((b,i)=>Math.abs(
  wrapped(b,state.initialBends[i])
  )));
 const first=F(changed.map((v,i)=>
  state.firstBendFrames[i]??(v>.0006?state.frames+1:null)
 ));
 const speeds=velocities(now,previous,seconds);
 const proxy=contactProxy(step.nextState.v07sState.contactIndices,
  speeds,state.quietSpeedCutoff,now);
 if(proxy.allGroundedCount<20)
  return denial('v07u_ground_support_proxy_lost');
 const frontCurvatureChange=Math.max(...changed.slice(0,5));
 const middleCurvatureChange=Math.max(...changed.slice(5,14));
 const rearCurvatureChange=Math.max(...changed.slice(14));
 const firstFront=first.slice(0,5).filter(v=>v!==null);
 const firstRear=first.slice(14).filter(v=>v!==null);
 // Reject blatantly reversed bend propagation, not demand that the tail
 // already bends in the first 2-3 seconds.
 if(firstRear.length&&firstFront.length&&
    Math.min(...firstRear)<Math.min(...firstFront))
  return denial('v07u_rear_curvature_before_head');
 const nextState=F({
  ...state,temporalState:step.nextState,
  seconds:t,frames:state.frames+1,
  previousBends:currentBends,firstBendFrames:first,
  lastQuietIndices:proxy.quietIndices,
  quietFramesObserved:state.quietFramesObserved+
   (proxy.quietIndices.length>0?1:0),
  movingFramesObserved:state.movingFramesObserved+
   (proxy.movingIndices.length>0?1:0),
  coexistFramesObserved:state.coexistFramesObserved+
   (proxy.quietIndices.length>0&&proxy.movingIndices.length>0?1:0)
 });
 return F({
  version:SNAKE_CURVATURE_RELAY_VERSION,
  ok:true,reason:null,pose:step.pose,head:step.head,nextState,
  frames:nextState.frames,seconds:t,
  steerRadians:turn,headTravel:step.headTravel,
  sourceTotalLength:state.sourceTotalLength,
  originalDeparture:state.sourceDeparture,
  currentDeparture:departure,
  angularChangeMax:maxStep,
  frontCurvatureChange,middleCurvatureChange,rearCurvatureChange,
  firstFrontBendFrame:firstFront.length?Math.min(...firstFront):null,
  firstRearBendFrame:firstRear.length?Math.min(...firstRear):null,
  quietFramesObserved:nextState.quietFramesObserved,
  movingFramesObserved:nextState.movingFramesObserved,
  coexistFramesObserved:nextState.coexistFramesObserved,
  visualQuietGroundCount:proxy.quietIndices.length,
  visualMovingGroundCount:proxy.movingIndices.length,
  visualQuietGroundIndices:proxy.quietIndices,
  visualMovingGroundIndices:proxy.movingIndices,
  visualSupportProxyCenter:proxy.supportProxyCenter,
  allGroundedCount:proxy.allGroundedCount,
  sourceBoneLengthMaintained:step.sourceBoneLengthMaintained,
  sourceHeadCollisionChecked:step.sourceHeadCollisionChecked,
  sceneAuthorityPreserved:step.sceneAuthorityPreserved,
  groundAccelerationGatePassed:true,
  gameTravelRouteAuthorized:false,
  physicsVerified:false,realContactMigrationVerified:false,
  muscleWaveVerified:false,playableCaveAuthorized:false,
  skinApplied:false,
  status:'front_to_rear_bend_change_diagnostics_with_shallow_authored_heading'
 });
}
