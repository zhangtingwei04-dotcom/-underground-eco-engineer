/**
 * Project OHM SNAKE V0.7T — cautious head-led first ground steps.
 *
 * Wrap ONLY a completed V0.7S same-animal 13->24 ground handoff.
 * V0.7S alone owns the immutable 3D pose, source scene XY rock checks,
 * actual head collider, ground heightfield and fixed bone links.
 *
 * Temporal controller: a smooth ramp from near-still to the authored
 * V0.7S head speed, an acceleration limit, and conservative back-body
 * settling diagnostics. No new force/friction/contact authority; no
 * V0.7A unrelated 2.5-length path, animal intent or skin.
 *
 * Each failed frame returns null pose/nextState. No stale frame fallback.
 */
import {advanceSnakeGroundHandoffV07s}
 from './snake-wall-to-ground-handoff-v07s.mjs';

export const SNAKE_GROUND_TEMPORAL_VERSION='0.7T';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const range=(n,lo,hi)=>finite(n)&&n>=lo&&n<=hi;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const fail=why=>{throw new RangeError(why)};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const easing=t=>t*t*(3-2*t);
const denied=(reason,extra={})=>F({
 version:SNAKE_GROUND_TEMPORAL_VERSION,
 ok:false,reason,pose:null,head:null,nextState:null,
 physicsVerified:false,groundFrictionVerified:false,
 biologicalTimingVerified:false,realContactMigrationVerified:false,
 playableCaveAuthorized:false,skinApplied:false,
 ...extra
});
export function createSnakeGroundTemporalV07t({
 handoff,rampSeconds=.75,accelerationLimit=.85,
 maxJointSpeed=.35
}={}){
 if(handoff?.version!=='0.7S'||handoff.ok!==true||
    handoff.gameTravelRouteAuthorized!==false||
    handoff.nextState?.version!=='0.7S'||
    handoff.nextState.frames!==0||
    handoff.nextState.seconds!==0||
    handoff.sourceJointCount!==13||
    handoff.resampledJointCount!==24||
    !range(handoff.totalLength,2.28-1e-9,2.28+1e-9)||
    !range(rampSeconds,.35,1.5)||
    !range(accelerationLimit,.1,2)||
    !range(maxJointSpeed,.1,.5))
  fail('v07t_requires_certified_same_length_resting_handoff');
 const source=handoff.nextState;
 const joints=source.pose.points;
 if(!Array.isArray(joints)||joints.length!==24||
    !Array.isArray(source.contactIndices)||
    source.contactIndices.length<20)
  fail('v07t_missing_grounded_24_joint_source');
 return F({
  version:SNAKE_GROUND_TEMPORAL_VERSION,
  sourceVersion:'0.7S',
  sourceSceneId:source.sceneId,
  initialPose:source.pose,
  v07sState:source,
  rampSeconds,accelerationLimit,maxJointSpeed,
  elapsedSeconds:0,frames:0,
  previousSpeeds:F(Array.from({length:24},()=>0)),
  lastGroundSupportCount:source.contactIndices.length,
  initialContactIndices:F([...source.contactIndices]),
  firstStepObserved:false,
  status:'optional_private_head_led_first_step_ramp_not_biomechanics'
 });
}
/**
 * The animation elapsedSeconds is the real step clock; V0.7S receives
 * reduced motionSeconds and still owns ALL fixed-3D-bone physics gates.
 * Numeric time and speed checks are independent of 24-joint rendering.
 */
export function advanceSnakeGroundTemporalV07t(state,{
 scene,terrain,seconds=1/30
}={}){
 if(state?.version!==SNAKE_GROUND_TEMPORAL_VERSION||
    state.sourceVersion!=='0.7S'||
    state.v07sState?.version!=='0.7S'||
    state.initialPose?.points?.length!==24||
    state.v07sState?.pose?.points?.length!==24||
    state.previousSpeeds?.length!==24||
    !range(state.elapsedSeconds,0,60)||
    !Number.isInteger(state.frames)||state.frames<0||
    !range(seconds,0,.1))
  fail('v07t_invalid_timed_step');
 const nextTime=state.elapsedSeconds+seconds;
 const phase=clamp(nextTime/state.rampSeconds,0,1);
 // Keep a tiny nonzero lead speed to prevent a frozen head on first step.
 const pace=.025+.975*easing(phase);
 const motionSeconds=seconds*pace;
 const result=advanceSnakeGroundHandoffV07s(state.v07sState,{
  scene,terrain,seconds:motionSeconds,
  maxJointSpeed:state.maxJointSpeed
 });
 if(!result.ok)return denied(result.reason,{
  underlyingReason:result.reason,
  v07sReject:true,elapsedSeconds:state.elapsedSeconds
 });
 const src=state.v07sState.pose.points;
 const now=result.pose.points;
 const speeds=F(now.map((p,i)=>seconds>0?dist(p,src[i])/seconds:0));
 const accelerations=F(speeds.map((s,i)=>
  seconds>0?Math.abs(s-state.previousSpeeds[i])/seconds:0
 ));
 const maxAccel=Math.max(...accelerations);
 if(maxAccel>state.accelerationLimit+1e-8)
  return denied('v07t_unbounded_joint_acceleration',{
   attemptedMaxAcceleration:maxAccel
  });
 const frontTravel=dist(now[0],state.initialPose.points[0]);
 const tailTravel=dist(now.at(-1),state.initialPose.points.at(-1));
 // This is only a visible "settling" indicator, NOT a force or
 // real ground friction solver. Still verify that the back third does not
 // outpace the head in the initial .7 seconds.
 const rearMovement=Math.max(...now.slice(16).map((p,k)=>
  dist(p,state.initialPose.points[k+16])));
 const early=nextTime<=Math.min(.7,state.rampSeconds);
 if(early&&(tailTravel>frontTravel+.002||
    rearMovement>frontTravel+.006))
  return denied('v07t_rear_slides_before_head',{
   frontTravel,tailTravel,rearMovement
  });
 const supportCount=result.contactIndices.length;
 if(supportCount<20)
  return denied('v07t_unexpected_ground_support_loss',{
   supportCount
  });
 // Report the number of visibly almost-stationary rear joints. Do not
 // pretend this detects friction/contact impulse or true foot anchors.
 const rearSettled=now.slice(16).filter((p,k)=>
  dist(p,state.initialPose.points[k+16])<.008).length;
 const nextState=F({
  ...state,v07sState:result.nextState,
  elapsedSeconds:nextTime,frames:state.frames+1,
  previousSpeeds:speeds,lastGroundSupportCount:supportCount,
  firstStepObserved:true
 });
 return F({
  version:SNAKE_GROUND_TEMPORAL_VERSION,
  ok:true,reason:null,pose:result.pose,head:result.head,
  nextState,seconds:nextTime,phase:'head_led_ground_departure',
  rampProgress:phase,motionPace:pace,
  headTravel:frontTravel,tailTravel,rearMovement,
  rearSettledJointCount:rearSettled,
  sourceContactCount:supportCount,
  maxJointAcceleration:maxAccel,
  maxJointSpeed:Math.max(...speeds),
  underlyingV07sCheckPassed:true,
  sourceBoneLengthMaintained:true,
  sourceHeadCollisionChecked:true,
  sceneAuthorityPreserved:true,
  oldV07aRouteAuthorized:false,
  physicsVerified:false,groundFrictionVerified:false,
  biologicalTimingVerified:false,realContactMigrationVerified:false,
  playableCaveAuthorized:false,skinApplied:false,
  status:'smooth_head_first_glide_private_lab_no_force_solver'
 });
}
