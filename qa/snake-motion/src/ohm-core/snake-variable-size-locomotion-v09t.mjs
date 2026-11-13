/**
 * Project OHM public synthetic V0.9T — FIRST independent, stage-sized
 * 24-joint moving skeleton source. NOT projected V0.9C adult source.
 *
 * At INIT, V0.9N/P derives a size-specific 24-point, 23-bone posture
 * and per-joint radius profile from a canonical source reference.
 * Subsequently every accepted frame is advanced FROM THAT SAME sized
 * state by a new head leader + length-constrained body follower:
 * - all 23 real stage-specific 3D bone lengths remain invariant;
 * - stage-specific radii control head, neck, body, taper, scene/glass
 *   clearance, nonlocal 3D capsules and heightfield ground contact;
 * - every 3D body link is sampled; all 24 joints move in the NEW
 *   variable-size state; swept rock, glass, heightfield & nonlocal
 *   capsule samples are checked before any frame is committed;
 * - oversteer, stale scene, self overlap, unsupported slope, too-large
 *   step, length drift, or impossible terrain => explicit safe REST.
 *
 * Synthetic engineering locomotor only: no actual muscle/friction/
 * traction, species-derived speed/rates, 3D triangle mesh swept proof,
 * real-time age growth, legitimate game persistence or full return.
 * V0.9C/D/G authority is UNTOUCHED; never feed changed pose to it.
 */
import {solveSnakeSizeTerrainContactV09p}
 from './snake-size-terrain-contact-v09p.mjs';
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_VARIABLE_SIZE_LOCOMOTION_V09T_VERSION='0.9T';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vec=(x,y,z)=>F({x,y,z});
const plus=(a,b)=>vec(a.x+b.x,a.y+b.y,a.z+b.z);
const minus=(a,b)=>vec(a.x-b.x,a.y-b.y,a.z-b.z);
const times=(a,k)=>vec(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=p=>Math.hypot(p.x,p.y,p.z);
const length=(a,b)=>norm(minus(a,b));
const interp=(a,b,t)=>plus(times(a,1-t),times(b,t));
const stageTolerances=F({minimumGroundGapWorld:-.00001,
 maximumPerFrameJointStepWorld:.018,
 maxBoneLengthErrorWorld:1e-7,
 maxGroundToBodyGapWorld:.035,
 nonlocalCapsuleToleranceWorld:-.008,
 minimumAbsoluteScenePaddingWorld:.0035});
function pointSegmentDistance(a,b,c,d){
 const u=minus(b,a),v=minus(d,c),w=minus(a,c);
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),
  E=dot(v,w),det=A*C-B*B;
 if(A<1e-14||C<1e-14)return 0;
 let sN=0,sD=det,tN=0,tD=det;
 if(det<1e-12){sN=0;sD=1;tN=E;tD=C;}
 else{
  sN=B*E-C*D;tN=A*E-B*D;
  if(sN<0){sN=0;tN=E;tD=C;}
  else if(sN>sD){sN=sD;tN=E+B;tD=C;}
 }
 if(tN<0){
  tN=0;
  if(-D<0)sN=0;
  else if(-D>A)sN=sD;
  else{sN=-D;sD=A;}
 }else if(tN>tD){
  tN=tD;
  if(-D+B<0)sN=0;
  else if(-D+B>A)sN=sD;
  else{sN=-D+B;sD=A;}
 }
 const s=Math.abs(sN)<1e-12?0:sN/sD;
 const t=Math.abs(tN)<1e-12?0:tN/tD;
 const delta=plus(w,minus(times(u,s),times(v,t)));
 return norm(delta);
}
function xySegmentRect(a,b,object,paddingPixels){
 let lo=0,hi=1;
 for(const [start,delta,min,max] of [
  [500+a.x*125,(b.x-a.x)*125,
   object.x-paddingPixels,object.x+object.width+paddingPixels],
  [200+a.y*125,(b.y-a.y)*125,
   object.y-paddingPixels,object.y+object.depth+paddingPixels]
 ]){
  if(Math.abs(delta)<1e-12){
   if(start<min||start>max)return false;
  }else{
   let enter=(min-start)/delta,exit=(max-start)/delta;
   if(enter>exit)[enter,exit]=[exit,enter];
   lo=Math.max(lo,enter);hi=Math.min(hi,exit);
   if(lo>hi)return false;
  }
 }
 return lo<=1&&hi>=0;
}
function sceneStamp(scene,terrain){
 // Diagnostic scene signature. NOT a tamper-proof cryptographic token.
 return JSON.stringify({id:scene.sceneId,
  revision:scene.revision,objects:scene.objects,
  terrain});
}
function fail(reason,detail={}){
 return F({version:SNAKE_VARIABLE_SIZE_LOCOMOTION_V09T_VERSION,
  ok:false,reason,...detail,
  sourceFramesCommitted:0,sourceSizeAnimationVerified:false,
  gameplayMotionAuthorized:false,meshSweep3DCertified:false,
  biomechanicalForcesCertified:false,
  skinApplied:false,saveModified:false});
}
function validateState(state,scene,terrain){
 if(state?.version!=='0.9T'||!scene||!terrain||
  !Number.isInteger(state.verifiedFrames)||
  state.pose?.points?.length!==24||
  state.pose?.radiiWorldUnits?.length!==24||
  state.pose?.boneLengths?.length!==23||
  !state.pose.points.every(p=>p&&
   [p.x,p.y,p.z].every(finite))||
  !state.pose.boneLengths.every(n=>finite(n)&&n>.001)||
  !state.pose.radiiWorldUnits.every(n=>finite(n)&&n>0)||
  state.sceneStamp!==sceneStamp(scene,terrain))
  return false;
 return true;
}
function frameAudit({points,radii,boneLengths,scene,terrain,
  checkSupports=true}){
 let lowestTerrainGap=Infinity,highestTerrainGap=-Infinity,
  worstLengthError=0,glassClear=true,sceneClear=true,
  blocker=null,nonlocalClear=true,minSelf=Infinity,
  terrainSamples=0;
 for(let i=0;i<23;i++){
  const a=points[i],b=points[i+1];
  worstLengthError=Math.max(worstLengthError,
   Math.abs(length(a,b)-boneLengths[i]));
  const padding=125*Math.max(radii[i],radii[i+1],
   stageTolerances.minimumAbsoluteScenePaddingWorld);
  for(const q of [a,b]){
   const x=500+q.x*125,y=200+q.y*125;
   if(x-padding<0||x+padding>1000||
    y-padding<0||y+padding>400)
    glassClear=false;
  }
  for(const object of scene.objects)
   if(xySegmentRect(a,b,object,padding)){
    sceneClear=false;blocker??=object.id;
   }
  for(let k=0;k<=8;k++){
   const t=k/8,q=interp(a,b,t);
   const radius=radii[i]*(1-t)+radii[i+1]*t;
   const gap=q.z-radius-
    sampleSnakeTerrain(q.x,q.y,terrain).z;
   lowestTerrainGap=Math.min(lowestTerrainGap,gap);
   highestTerrainGap=Math.max(highestTerrainGap,gap);
   terrainSamples++;
  }
 }
 for(let i=0;i<23;i++)for(let j=i+4;j<23;j++){
  const gap=pointSegmentDistance(points[i],points[i+1],
   points[j],points[j+1])-
   Math.max(radii[i],radii[i+1])-
   Math.max(radii[j],radii[j+1]);
  minSelf=Math.min(minSelf,gap);
  if(gap<stageTolerances.nonlocalCapsuleToleranceWorld)
   nonlocalClear=false;
 }
 const groundClear=lowestTerrainGap>=
  stageTolerances.minimumGroundGapWorld;
 const lengthClear=worstLengthError<=
  stageTolerances.maxBoneLengthErrorWorld;
 // An elevated pose may be intentional in a future vertical snake
 // controller, but this simple surface-following motion has no forces:
 // refuse apparent floating rather than claim supported climbing.
 const supportCandidate=highestTerrainGap<=
  stageTolerances.maxGroundToBodyGapWorld;
 const ok=glassClear&&sceneClear&&groundClear&&lengthClear&&
  nonlocalClear&&(!checkSupports||supportCandidate);
 return F({ok,glassClear,sceneClear,groundClear,lengthClear,
  nonlocalClear,supportCandidate,
  sceneBlocker: blocker,
  min3DNonlocalCapsuleGapWorld:minSelf,
  maxBoneLengthErrorWorld:worstLengthError,
  minGroundGapWorld:lowestTerrainGap,
  maxGroundGapWorld:highestTerrainGap,
  terrainSamples,nonlocalBodyLinkPairs:190,
  static3DCapsuleProxyOnly:true,realForcesCertified:false});
}
function advanceSizedFollower(state,terrain,angle,seconds,direction=1){
 const old=state.pose.points,r=state.pose.radiiWorldUnits,
  lengths=state.pose.boneLengths;
 // Source head speed is a *synthetic engineering knob*. Different
 // stages have independently sized skeletons, NEVER a biological
 // speed claim. Same input speed isolates size effect for tests.
 const speed=state.speedWorldPerSecond;
 const start=old[0];
 const nx=start.x+direction*speed*seconds*Math.cos(angle),
  ny=start.y+direction*speed*seconds*Math.sin(angle);
 const head=vec(nx,ny,sampleSnakeTerrain(nx,ny,terrain).z+
  r[0]+state.groundMarginWorld);
 const points=[head];
 for(let i=1;i<24;i++){
  const previous=points[i-1],oldJoint=old[i],L=lengths[i-1];
  let proposed=oldJoint,valid=true;
  // Three heightfield fixed-point refinements. Any residual terrain
  // penetration after final audit is a hard HOLD, never a projection.
  for(let pass=0;pass<4;pass++){
   const z=sampleSnakeTerrain(proposed.x,proposed.y,terrain).z+
    r[i]+state.groundMarginWorld;
   const dz=z-previous.z;
   if(Math.abs(dz)>L*.85){valid=false;break;}
   const horizontal=Math.sqrt(Math.max(0,L*L-dz*dz));
   const dx=oldJoint.x-previous.x,dy=oldJoint.y-previous.y;
   const mag=Math.hypot(dx,dy);
   if(mag<L*.07){valid=false;break;}
   proposed=vec(previous.x+horizontal*dx/mag,
    previous.y+horizontal*dy/mag,z);
  }
  if(!valid)return {ok:false,reason:'size_specific_3d_link_cannot_follow'};
  // Final z is computed at the candidate's own XY, never at the adult
  // skeleton's old XY; length and ground are both checked on output.
  points.push(proposed);
 }
 return {ok:true,points:F(points)};
}
function checkSweptBody({before,after,radii,scene,terrain}){
 let glassClear=true,sceneClear=true,groundClear=true,
  selfClear=true,minGap=Infinity,minSelf=Infinity,
  tested=0,blocker=null;
 const interpFrames=[0,.25,.5,.75,1];
 for(let i=0;i<23;i++){
  const a=before[i],b=before[i+1],
   c=after[i],d=after[i+1];
  const pad=125*Math.max(radii[i],radii[i+1])+
   stageTolerances.minimumAbsoluteScenePaddingWorld*125;
  const xs=[a,b,c,d].map(p=>500+p.x*125),
   ys=[a,b,c,d].map(p=>200+p.y*125);
  const box={minX:Math.min(...xs)-pad,
   maxX:Math.max(...xs)+pad,
   minY:Math.min(...ys)-pad,
   maxY:Math.max(...ys)+pad};
  if(box.minX<0||box.maxX>1000||
   box.minY<0||box.maxY>400)glassClear=false;
  for(const object of scene.objects)
   if(box.minX<=object.x+object.width&&
    box.maxX>=object.x&&
    box.minY<=object.y+object.depth&&
    box.maxY>=object.y){
    sceneClear=false;blocker??=object.id;
   }
  for(const time of interpFrames){
   const m=interp(a,c,time),n=interp(b,d,time);
   for(let k=0;k<=8;k++){
    const t=k/8,p=interp(m,n,t);
    const r=radii[i]*(1-t)+radii[i+1]*t;
    const gap=p.z-r-
     sampleSnakeTerrain(p.x,p.y,terrain).z;
    minGap=Math.min(minGap,gap);
    if(gap<stageTolerances.minimumGroundGapWorld)
     groundClear=false;
    tested++;
   }
  }
 }
 // Nonlocal 3D self collision at all 5 temporal slices — a distinct
 // safety gate from per-frame, fixed-size V0.9D.
 for(const time of interpFrames){
  const interpolated=before.map((p,i)=>interp(p,after[i],time));
  for(let i=0;i<23;i++)for(let j=i+4;j<23;j++){
   const gap=pointSegmentDistance(interpolated[i],
    interpolated[i+1],interpolated[j],
    interpolated[j+1])-
    Math.max(radii[i],radii[i+1])-
    Math.max(radii[j],radii[j+1]);
   minSelf=Math.min(minSelf,gap);
   if(gap<stageTolerances.nonlocalCapsuleToleranceWorld)
    selfClear=false;
  }
 }
 return F({ok:glassClear&&sceneClear&&groundClear&&selfClear,
  glassClear,sceneClear,groundClear,selfClear,sceneBlocker:blocker,
  minInterframeTerrainGapWorld:minGap,
  minInterframe3DCapsuleGapWorld:minSelf,
  interframeGroundSamples:tested,
  interframeCapsuleTemporalSlices:5,
  exactSwept3DMeshCertified:false});
}
/** Start a separate, truly stage-sized source. The canonical source
 * is used exactly once for an INITIAL reference, and not advanced in
 * any subsequent movement step. Invalid starts are rejected.
 */
export function startSnakeVariableSizeMotionV09t({
 canonicalSourcePose,scene,terrain,stageProgress=2,
 speedWorldPerSecond=.09,groundMarginWorld=.0035
}={}){
 if(!Number.isFinite(stageProgress)||stageProgress<0||
  stageProgress>3||!finite(speedWorldPerSecond)||
  speedWorldPerSecond<.015||speedWorldPerSecond>.17||
  !finite(groundMarginWorld)||groundMarginWorld<.003||
  groundMarginWorld>.009||!scene||!terrain)
  throw new RangeError('v09t_invalid_stage_or_source_params');
 const sceneInfo=createSnakeTerrariumCorridorV07c(scene);
 const grounded=solveSnakeSizeTerrainContactV09p({
  sourcePose:canonicalSourcePose,scene,terrain,
  stageProgress,marginWorld:groundMarginWorld
 });
 if(!grounded.ok)return fail('invalid_sized_source_initial_pose',{
  groundingReason:grounded.reason,stageProgress});
 const pose=F({points:grounded.candidate.points,
  boneLengths:grounded.candidate.boneLengths,
  radiiWorldUnits:grounded.candidate.radiiWorldUnits});
 const audit=frameAudit({points:pose.points,
  radii:pose.radiiWorldUnits,boneLengths:pose.boneLengths,
  scene,terrain});
 if(!audit.ok)return fail('invalid_sized_source_initial_envelope',{
  audit,stageProgress});
 const heading=Math.atan2(pose.points[0].y-pose.points[1].y,
  pose.points[0].x-pose.points[1].x);
 return F({version:SNAKE_VARIABLE_SIZE_LOCOMOTION_V09T_VERSION,
  phase:'moving_sized',
  stageProgress,lifeStage:grounded.lifeStage,
  sceneId:sceneInfo.sceneId,sceneRevision:scene.revision,
  sceneStamp:sceneStamp(scene,terrain),
  speedWorldPerSecond,groundMarginWorld,
  verifiedFrames:0,heading,
  pose,initialPose:pose,sourceCanonicalBoneCount:24,
  stageSourceBoneLengthsDifferFromCanonical:
   Math.abs(stageProgress-2)>1e-9,
  currentSizeDynamicsOwnedByV09t:true,
  originalV09cDgNeverAdvanced:true,
  previousStepDiagnostic:null,
  lastFrameAuthorized:true,
  fullBodyReturnVerified:false,
  originalGameSaveModified:false,skinApplied:false,
  groundForceCertified:false,meshSweep3DCertified:false,
  speciesBiomechanicsCertified:false,gameplayMotionAuthorized:false,
  stageDurationIsNotBiologicalAge:true});
}
/** Read-only source-integrity and safety check. */
export function inspectSnakeVariableSizeStepV09t({
 state,scene,terrain,turnRadians=0,seconds=1/30
}={}){
 if(!validateState(state,scene,terrain))
  return fail('source_or_scene_changed_requires_replan');
 if(state.phase!=='moving_sized')
  return fail('sized_controller_not_active');
 if(!finite(turnRadians)||Math.abs(turnRadians)>.028||
  !finite(seconds)||seconds<=0||seconds>.05)
  return fail('unbounded_turn_or_time_step');
 // Larger body lengths require proportionally more spacious turns.
 const bodyTotal=state.pose.boneLengths.reduce((a,b)=>a+b,0);
 const maxTurn=Math.min(.028,.035/bodyTotal);
 if(Math.abs(turnRadians)>maxTurn+1e-12)
  return fail('current_body_too_long_for_requested_turn',{
   maximumTurnRadians:maxTurn,bodyLengthWorld:bodyTotal});
 const angle=state.heading+turnRadians;
 const candidate=advanceSizedFollower(state,terrain,angle,seconds);
 if(!candidate.ok)return fail(candidate.reason);
 const points=candidate.points,old=state.pose.points;
 const radii=state.pose.radiiWorldUnits,
  boneLengths=state.pose.boneLengths;
 const frame=frameAudit({points,radii,boneLengths,scene,terrain});
 const maxStep=Math.max(...points.map((p,i)=>length(p,old[i])));
 const sweep=checkSweptBody({before:old,after:points,
  radii,scene,terrain});
 const ok=frame.ok&&sweep.ok&&
  maxStep<=stageTolerances.maximumPerFrameJointStepWorld;
 const reason=!frame.ok?'sized_body_3d_contact_or_length_rejected':
  !sweep.ok?'sized_body_swept_3d_contact_rejected':
  maxStep>stageTolerances.maximumPerFrameJointStepWorld?
   'sized_body_joint_step_too_large':null;
 return F({version:SNAKE_VARIABLE_SIZE_LOCOMOTION_V09T_VERSION,
  ok,reason,stageProgress:state.stageProgress,
  frameCandidate:ok?F({points,
   boneLengths,radiiWorldUnits:radii}):null,
  frameAudit:frame,sweptAudit:sweep,
  sourceEndFrameCandidate:state.verifiedFrames+1,
  headingCandidate:angle,
  maximumJointStepWorld:maxStep,
  sourceBoneLengthWorld:bodyTotal,
  movementComputedFromActualStageSizedState:true,
  canonicalV09cSourceNotReplayed:true,
  originalFixedSizeControllerNeverCalled:true,
  currentSizeCollisionRadiusApplied:true,
  realMuscleFrictionNotCertified:true,
  exactSweptTriangleMeshNotCertified:true,
  sourceFramesCommitted:0,gameplayMotionAuthorized:false,
  skinApplied:false,saveModified:false});
}
/** Commit ONE independently stage-sized step, or rest at the last
 * valid 24-joint body without moving/teleporting any part of it. */
export function advanceSnakeVariableSizeMotionV09t(args={}){
 const state=args.state;
 if(state?.version!=='0.9T')
  throw new RangeError('v09t_invalid_state');
 if(state.phase!=='moving_sized')return state;
 const tested=inspectSnakeVariableSizeStepV09t(args);
 if(!tested.ok)return F({...state,
  phase:'resting_safety_hold',
  status:tested.reason,
  lastFrameAuthorized:false,
  previousStepDiagnostic:tested,
  actualSourceStepsCommittedOnRejectedFrame:0,
  sourceFramesCommittedSinceStart:state.verifiedFrames,
  gameSaveModified:false});
 return F({...state,pose:tested.frameCandidate,
  heading:tested.headingCandidate,
  verifiedFrames:state.verifiedFrames+1,
  lastFrameAuthorized:true,
  previousStepDiagnostic:tested,
  sourceFramesCommittedSinceStart:state.verifiedFrames+1,
  actualIndependentSizedSourceStep:true,
  actualGameplayMotion:false,
  gameSaveModified:false});
}


/**
 * V0.9V rest-only size-change SAFETY. It cannot update V0.9T.
 * Both old and candidate poses, 3D nonlocal capsules and 5 sampled
 * intermediate size/position combinations are independently audited.
 * Interpolation includes actual changing radii — unlike fixed-radius
 * locomotor sweeps. Conservative swept XY AABB blocks glass/rocks.
 */
export function inspectSnakeRestSizeChangeSafetyV09v({
 state,candidatePose,scene,terrain
}={}){
 if(!validateState(state,scene,terrain))
  return F({ok:false,reason:'rest_growth_source_scene_stale'});
 if(state.phase!=='resting_growth'||
  candidatePose?.points?.length!==24||
  candidatePose?.radiiWorldUnits?.length!==24||
  candidatePose?.boneLengths?.length!==23||
  candidatePose.points.some(p=>!p||
   ![p.x,p.y,p.z].every(finite))||
  candidatePose.radiiWorldUnits.some(n=>!finite(n)||n<=0||n>.3)||
  candidatePose.boneLengths.some(n=>!finite(n)||n<=0||n>.5))
  return F({ok:false,reason:'rest_growth_not_authorized_or_invalid_pose'});
 const old=state.pose,now=candidatePose;
 const original=frameAudit({points:old.points,
  radii:old.radiiWorldUnits,
  boneLengths:old.boneLengths,scene,terrain});
 const next=frameAudit({points:now.points,
  radii:now.radiiWorldUnits,
  boneLengths:now.boneLengths,scene,terrain});
 let maxJointDisplacement=0,maxLinkChange=0;
 for(let i=0;i<24;i++)
  maxJointDisplacement=Math.max(maxJointDisplacement,
   length(old.points[i],now.points[i]));
 for(let i=0;i<23;i++)
  maxLinkChange=Math.max(maxLinkChange,
   Math.abs(now.boneLengths[i]-old.boneLengths[i]));
 let glass=true,rocks=true,ground=true,self=true;
 let firstRock=null,minGap=Infinity,minSelf=Infinity,samples=0;
 const fractions=[0,.25,.5,.75,1];
 for(let i=0;i<23;i++){
  const a=old.points[i],b=old.points[i+1],
   c=now.points[i],d=now.points[i+1];
  const px=[a,b,c,d].map(p=>500+p.x*125);
  const py=[a,b,c,d].map(p=>200+p.y*125);
  const maxRadius=Math.max(old.radiiWorldUnits[i],
   old.radiiWorldUnits[i+1],now.radiiWorldUnits[i],
   now.radiiWorldUnits[i+1]);
  const padding=125*(maxRadius+
   stageTolerances.minimumAbsoluteScenePaddingWorld);
  const bounds={x0:Math.min(...px)-padding,
   x1:Math.max(...px)+padding,
   y0:Math.min(...py)-padding,
   y1:Math.max(...py)+padding};
  if(bounds.x0<0||bounds.x1>1000||
   bounds.y0<0||bounds.y1>400)glass=false;
  for(const o of scene.objects)
   if(bounds.x0<=o.x+o.width&&bounds.x1>=o.x&&
    bounds.y0<=o.y+o.depth&&bounds.y1>=o.y){
    rocks=false;firstRock??=o.id;
   }
  for(const f of fractions){
   const start=interp(a,c,f),end=interp(b,d,f);
   const ra=old.radiiWorldUnits[i]*(1-f)+
    now.radiiWorldUnits[i]*f;
   const rb=old.radiiWorldUnits[i+1]*(1-f)+
    now.radiiWorldUnits[i+1]*f;
   for(let k=0;k<=8;k++){
    const t=k/8,p=interp(start,end,t);
    const gap=p.z-(ra*(1-t)+rb*t)-
     sampleSnakeTerrain(p.x,p.y,terrain).z;
    minGap=Math.min(minGap,gap);samples++;
    if(gap<stageTolerances.minimumGroundGapWorld)
     ground=false;
   }
  }
 }
 for(const f of fractions){
  const points=old.points.map((p,i)=>
   interp(p,now.points[i],f));
  const radii=old.radiiWorldUnits.map((r,i)=>
   r*(1-f)+now.radiiWorldUnits[i]*f);
  for(let i=0;i<23;i++)for(let j=i+4;j<23;j++){
   const gap=pointSegmentDistance(points[i],points[i+1],
    points[j],points[j+1])-
    Math.max(radii[i],radii[i+1])-
    Math.max(radii[j],radii[j+1]);
   minSelf=Math.min(minSelf,gap);
   if(gap<stageTolerances.nonlocalCapsuleToleranceWorld)
    self=false;
  }
 }
 const incrementsSmall=maxJointDisplacement<=.018&&
  maxLinkChange<=.006;
 const ok=original.ok&&next.ok&&glass&&rocks&&ground&&
  self&&incrementsSmall;
 return F({version:'0.9V',ok,
  reason:!original.ok?'previous_pose_invalid':
   !next.ok?'new_rest_pose_invalid':
   !glass?'rest_growth_crosses_glass':
   !rocks?'rest_growth_crosses_source_rock':
   !ground?'rest_growth_intermediate_terrain_penetration':
   !self?'rest_growth_intermediate_nonlocal_self_collision':
   !incrementsSmall?'rest_growth_size_step_exceeds_bound':null,
  originalFrameSafety:original,nextFrameSafety:next,
  intermediateGlassClear:glass,intermediateRockClear:rocks,
  intermediateGroundClear:ground,intermediateSelfClear:self,
  firstSceneRockBlockerId:firstRock,
  maxJointDisplacementWorld:maxJointDisplacement,
  maxLinkLengthIncrementWorld:maxLinkChange,
  minimumIntermediateGroundGapWorld:minGap,
  minimumIntermediate3DSelfGapWorld:minSelf,
  intermediateGroundSamples:samples,
  intermediateFractions:fractions.length,
  sourceV09tFramesCommitted:0,
  exactContinuousMeshCollisionCertified:false,
  gameSaveModified:false});
}



/**
 * V0.9Y independent TRUE backward translation: the head's world
 * displacement is opposite its unchanged forward-facing heading.
 * Every one of the OTHER 23 joints follows from the actual prior
 * V0.9T pose with its actual per-stage 3D link length and radius.
 *
 * This is backward whole-body locomotion, not a body turn, head
 * teleport, reverse-played old adult animation or a fully modeled
 * serpentine muscular reversal. Collision remains sampled capsule/
 * terrain + conservative swept source scene, with mesh QA in V0.9Y.
 */
export function inspectSnakeReverseStepV09y({
 state,scene,terrain,turnRadians=0,seconds=1/30
}={}){
 if(!validateState(state,scene,terrain))
  return fail('reverse_source_or_scene_stale');
 if(state.phase!=='moving_sized')
  return fail('reverse_not_allowed_in_rest_or_shedding');
 if(!finite(seconds)||seconds<=0||seconds>.05||
  !finite(turnRadians)||Math.abs(turnRadians)>.006)
  return fail('reverse_turn_or_time_exceeds_bound');
 const bodyTotal=state.pose.boneLengths.reduce((a,b)=>a+b,0);
 const maxTurn=Math.min(.006,.012/bodyTotal);
 if(Math.abs(turnRadians)>maxTurn+1e-12)
  return fail('reverse_body_too_long_for_turn');
 const angle=state.heading+turnRadians;
 const candidate=advanceSizedFollower(state,terrain,angle,seconds,-1);
 if(!candidate.ok)return fail(candidate.reason);
 const points=candidate.points,old=state.pose.points,
  radii=state.pose.radiiWorldUnits,
  bones=state.pose.boneLengths;
 const frame=frameAudit({points,radii,
  boneLengths:bones,scene,terrain});
 const sweep=checkSweptBody({before:old,after:points,
  radii,scene,terrain});
 const maximumStep=Math.max(...points.map((p,i)=>
  length(p,old[i])));
 const headDisplacement=minus(points[0],old[0]);
 const backwardDot=dot(headDisplacement,vec(
  Math.cos(angle),Math.sin(angle),0));
 const isReverse=backwardDot<-.000001;
 const ok=frame.ok&&sweep.ok&&isReverse&&
  maximumStep<=stageTolerances.maximumPerFrameJointStepWorld;
 return F({version:'0.9Y',ok,
  reason:!frame.ok?'reverse_current_body_3d_contact_rejected':
   !sweep.ok?'reverse_swept_body_contact_rejected':
   !isReverse?'reverse_heading_not_opposed':
   maximumStep>stageTolerances.maximumPerFrameJointStepWorld?
    'reverse_joint_jump_rejected':null,
  sourceStartFrame:state.verifiedFrames,
  sourceEndFrameCandidate:state.verifiedFrames+1,
  frameCandidate:ok?F({points,
   boneLengths:bones,radiiWorldUnits:radii}):null,
  frameAudit:frame,sweptAudit:sweep,
  headingCandidate:angle,
  headBackwardDisplacementDotWorld:backwardDot,
  maximumJointStepWorld:maximumStep,
  realBackwardHeadMotion:isReverse,
  fullBody23LinksUpdated:true,
  3DSourceCapsuleProxyOnly:true,
  continuousMeshCollisionCertified:false,
  gameSaveModified:false,skinApplied:false});
}
/** Commit to a SHADOW V0.9T source only on validated whole-body
 * reverse step. Keeps the previous sized state on rejection with a
 * safety hold; never edits the caller's source object. */
export function advanceSnakeReverseStepV09y(args={}){
 const state=args.state;
 if(state?.version!=='0.9T')
  throw new RangeError('reverse_requires_V09T_sized_source');
 if(state.phase!=='moving_sized')return state;
 const audit=inspectSnakeReverseStepV09y(args);
 if(!audit.ok)return F({...state,
  phase:'resting_safety_hold',status:audit.reason,
  lastFrameAuthorized:false,previousStepDiagnostic:audit,
  actualSourceStepsCommittedOnRejectedFrame:0,
  sourceFramesCommittedSinceStart:state.verifiedFrames,
  gameSaveModified:false});
 return F({...state,pose:audit.frameCandidate,
  heading:audit.headingCandidate,
  verifiedFrames:state.verifiedFrames+1,
  lastFrameAuthorized:true,
  previousStepDiagnostic:audit,
  sourceFramesCommittedSinceStart:state.verifiedFrames+1,
  actualIndependentSizedSourceStep:true,
  reverseTranslationFromCurrentStage:true,
  actualGameplayMotion:false,
  gameSaveModified:false});
}
