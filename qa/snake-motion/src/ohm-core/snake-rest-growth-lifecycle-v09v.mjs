/**
 * Project OHM public neutral V0.9V — growth only while RESTING.
 * ------------------------------------------------------------
 * THIS is an engineering life-cycle wrapper around actual moving V0.9T
 * and head/body V0.9U mesh. It does NOT modify V0.9C fixed controller,
 * existing V0.9T moving functions, live game animal/save, or skin.
 *
 * Growth potential may accumulate during moving, but bone lengths,
 * radii and visible mesh size are frozen until entering explicit rest.
 * Shedding itself also locks geometry; ONLY safe resting/asleep/
 * post-shed-rest may apply a SMALL morphology step. Every step:
 *  - derives 23 new bone lengths and 24 distinct radii from the same
 *    V0.9N morphology ratios, maintaining the original stage identity;
 *  - holds head XY, re-solves each 3D bone along current LOCAL body
 *    heading and terrain, never replays the fixed adult pose;
 *  - refuses unsafe rock/glass/heightfield/3D self penetration,
 *    too-large body motion, head seam, full 3216-triangle render mesh
 *    or sampled time/face contact violation before committing.
 *
 * This is NOT biological growth timing, muscle force, real-time
 * molting, exact continuous 3D collision or player save persistence.
 */
import {sampleSnakeSizeMorphProfileV09v}
 from './snake-growth-envelope-v09n.mjs';
import {inspectSnakeRestSizeChangeSafetyV09v,
 advanceSnakeVariableSizeMotionV09t}
 from './snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u}
 from './snake-sized-mesh-motion-v09u.mjs';
import {inspectSnakeMeshTemporalV09s}
 from './snake-swept-mesh-contact-v09s.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_REST_GROWTH_LIFECYCLE_V09V_VERSION='0.9V';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const norm=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const RESTS=F(['resting','asleep','post_shed_rest']);
const TOL=1e-9,MAX_STEP=.012,MAX_QUEUE=.3,MIN_PROGRESS=.0001;
function failure(session,reason,detail={}){
 return F({version:SNAKE_REST_GROWTH_LIFECYCLE_V09V_VERSION,
  ok:false,reason,session,detail,stageStepCommitted:0,
  movementFramesCommitted:0,gameplayAuthorized:false,
  noPlayerSaveWritten:true,skinApplied:false});
}
function auditSession(s){
 return s?.version==='0.9V'&&s.motionState?.version==='0.9T'&&
  ['moving','resting','asleep','post_shed_rest',
   'shedding_in_progress','safety_hold'].includes(s.phase)&&
  Number.isInteger(s.completedRestSteps)&&s.completedRestSteps>=0&&
  finite(s.pendingGrowth)&&s.pendingGrowth>=0&&
  s.pendingGrowth<=MAX_QUEUE+TOL&&
  finite(s.appliedStageProgress)&&s.appliedStageProgress>=0&&
  s.appliedStageProgress<=3&&
  Math.abs(s.motionState.stageProgress-
   s.appliedStageProgress)<1e-8&&
  (s.phase==='moving'?
   s.motionState.phase==='moving_sized':
   s.phase==='safety_hold'?
   s.motionState.phase==='resting_safety_hold':
   s.motionState.phase==='resting_growth');
}
function restSourceValid(session,scene,terrain){
 const unchanged=inspectSnakeRestSizeChangeSafetyV09v({
  state:session.motionState,candidatePose:session.motionState.pose,
  scene,terrain
 });
 return unchanged.ok;
}
function reshapePose({oldPose,oldProgress,newProgress,
 groundMarginWorld,terrain}){
 const from=sampleSnakeSizeMorphProfileV09v(oldProgress),
  to=sampleSnakeSizeMorphProfileV09v(newProgress);
 const pts=oldPose.points;
 const lengths=oldPose.boneLengths.map((length,i)=>
  length*to.bodyLengthScale/from.bodyLengthScale*
  to.relativeBoneWeights[i]/from.relativeBoneWeights[i]);
 const radii=oldPose.radiiWorldUnits.map((r,i)=>
  r*to.localRadiusScale[i]/from.localRadiusScale[i]);
 const result=[];
 for(let i=0;i<24;i++){
  const current=pts[i];
  if(i===0){
   result.push(F({x:current.x,y:current.y,
    z:sampleSnakeTerrain(current.x,current.y,terrain).z+
     radii[0]+groundMarginWorld}));
   continue;
  }
  const oldPrev=pts[i-1],prev=result[i-1],L=lengths[i-1];
  const dx=current.x-oldPrev.x,dy=current.y-oldPrev.y;
  const xy=Math.hypot(dx,dy);
  if(xy<.001)return null;
  let x=prev.x+dx, y=prev.y+dy,iteration=0;
  for(;iteration<7;iteration++){
   const z=sampleSnakeTerrain(x,y,terrain).z+
    radii[i]+groundMarginWorld;
   const dz=z-prev.z;
   if(Math.abs(dz)>=L*.85)return null;
   const horizontal=Math.sqrt(Math.max(0,L*L-dz*dz));
   const newX=prev.x+horizontal*dx/xy,
    newY=prev.y+horizontal*dy/xy;
   const movement=Math.hypot(newX-x,newY-y);
   x=newX;y=newY;
   if(movement<1e-9)break;
  }
  const z=sampleSnakeTerrain(x,y,terrain).z+
   radii[i]+groundMarginWorld;
  const q=F({x,y,z});
  if(Math.abs(norm(q,prev)-L)>1e-7)return null;
  result.push(q);
 }
 return F({points:F(result),boneLengths:F(lengths),
  radiiWorldUnits:F(radii)});
}
function sourcePhase(state,phase){
 return F({...state,phase});
}
/** This wrapper only starts if the current V0.9T pose is safe enough
 * to generate the V0.9U body/head surface. No background service.
 */
export function createSnakeRestGrowthSessionV09v({
 motionState,scene,terrain
}={}){
 if(motionState?.version!=='0.9T'||
  motionState.phase!=='moving_sized'||
  !finite(motionState.stageProgress)||
  motionState.stageProgress<0||motionState.stageProgress>3)
  throw new RangeError('v09v_requires_active_sized_source');
 const temporary=sourcePhase(motionState,'resting_growth');
 if(!restSourceValid({motionState:temporary},scene,terrain))
  return F({ok:false,reason:'starting_sized_source_not_safe'});
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState:motionState,scene,terrain
 });
 if(!mesh.ok)return F({ok:false,
  reason:'starting_sized_mesh_not_safe',meshReason:mesh.reason});
 return F({version:SNAKE_REST_GROWTH_LIFECYCLE_V09V_VERSION,
  phase:'moving',motionState,
  appliedStageProgress:motionState.stageProgress,
  pendingGrowth:0,completedRestSteps:0,
  lastSafetyHold:null,
  worldGeometryFrozenWhileMoving:true,
  sourceMorphologyIsSynthetic:true,
  gameSaveModified:false,skinApplied:false});
}
/** No live mutation, including while moving or actively shedding.
 * Adds engineering POTENTIAL, not new body length.
 */
export function accumulateSnakeGrowthPotentialV09v({
 session,amount
}={}){
 if(!auditSession(session)||!finite(amount)||amount<=0||
  amount>.1)return failure(session,'invalid_growth_potential');
 if(session.phase==='safety_hold')
  return failure(session,'unsafe_sized_source_needs_replan');
 const queued=Math.min(MAX_QUEUE,
  Math.max(0,3-session.appliedStageProgress),
  session.pendingGrowth+amount);
 return F({ok:true,version:'0.9V',
  session:F({...session,pendingGrowth:queued}),
  onlyProgressChanged:true,
  poseBoneLengthsUnchanged:true,radiiUnchanged:true,
  movementFramesCommitted:0,stageStepCommitted:0,
  skinApplied:false,noPlayerSaveWritten:true});
}
/** Movement uses V0.9T ONLY. Neither amount of pending growth nor
 * this wrapper's presence may scale or resize moving bones/mesh.
 */
export function advanceSnakeGrowthMotionV09v({
 session,scene,terrain,turnRadians=0,seconds=1/30
}={}){
 if(!auditSession(session))return failure(session,'invalid_session');
 if(session.phase!=='moving')
  return failure(session,'movement_disallowed_during_rest_or_shed');
 const prior=session.motionState;
 const next=advanceSnakeVariableSizeMotionV09t({
  state:prior,scene,terrain,turnRadians,seconds});
 if(next.phase!=='moving_sized'||
  next.verifiedFrames!==prior.verifiedFrames+1)
  return F({ok:false,reason:'sized_motion_safety_hold',
   version:'0.9V',session:F({...session,
    phase:'safety_hold',motionState:next,
    lastSafetyHold:next.status??'unknown'}),
   movementFramesCommitted:0,stageStepCommitted:0,
   noPlayerSaveWritten:true,skinApplied:false});
 return F({ok:true,version:'0.9V',
  session:F({...session,motionState:next}),
  movementFramesCommitted:1,stageStepCommitted:0,
  stageProgressUnchanged:true,
  boneLengthsSame:JSON.stringify(prior.pose.boneLengths)===
   JSON.stringify(next.pose.boneLengths),
  radiiSame:JSON.stringify(prior.pose.radiiWorldUnits)===
   JSON.stringify(next.pose.radiiWorldUnits),
  noPlayerSaveWritten:true,skinApplied:false});
}
/** Host must validate the animal is actually resting/sleeping.
 * This is an explicit transition; it is never auto-triggered while
 * moving by an accumulated growth counter.
 */
export function enterSnakeGrowthRestV09v({
 session,scene,terrain,restKind='resting'
}={}){
 if(!auditSession(session)||session.phase!=='moving'||
  !RESTS.includes(restKind))
  return failure(session,'rest_entry_not_authorized');
 const resting=sourcePhase(session.motionState,'resting_growth');
 const probe=inspectSnakeRestSizeChangeSafetyV09v({
  state:resting,candidatePose:resting.pose,scene,terrain});
 if(!probe.ok)return failure(session,'rest_entry_pose_unsafe',{
  risk:probe.reason});
 return F({ok:true,session:F({...session,
  phase:restKind,motionState:resting,lastSafetyHold:null}),
  enteredRestWithoutChangingSize:true,
  sourceFramesCommitted:0,stageStepCommitted:0,
  noPlayerSaveWritten:true,skinApplied:false});
}
/** Molting (ecdysis) itself is NOT a permission to stretch bones.
 * Finish shedding -> post_shed_rest, where usual safe rest growth
 * MAY be attempted if accumulated growth actually exists.
 */
export function beginSnakeSheddingV09v({session}={}){
 if(!auditSession(session)||
  !RESTS.includes(session.phase))
  return failure(session,'shedding_requires_rest');
 return F({ok:true,session:F({...session,
  phase:'shedding_in_progress'}),
  sizeFrozenDuringShedding:true,
  stageStepCommitted:0,noPlayerSaveWritten:true});
}
export function completeSnakeSheddingV09v({session}={}){
 if(!auditSession(session)||
  session.phase!=='shedding_in_progress')
  return failure(session,'no_active_shed_to_complete');
 return F({ok:true,session:F({...session,
  phase:'post_shed_rest'}),
  noAutomaticGrowthOnShedding:true,
  stageStepCommitted:0,noPlayerSaveWritten:true});
}
/** Proposed growth is explicitly rest-only, one tiny transition at
 * a time. Failed proposal is a HOLD: no new stage, unchanged body
 * and pending progress remains available for a later safe rest.
 */
export function applySnakeSafeRestGrowthV09v({
 session,scene,terrain
}={}){
 if(!auditSession(session))
  return failure(session,'invalid_session');
 if(!RESTS.includes(session.phase))
  return failure(session,'growth_geometry_locked_outside_safe_rest');
 if(!restSourceValid(session,scene,terrain))
  return failure(session,'rest_scene_or_old_pose_unsafe');
 if(session.pendingGrowth<MIN_PROGRESS||
  session.appliedStageProgress>=3-TOL)
  return F({ok:true,version:'0.9V',session,
   stageStepCommitted:0,reason:'no_pending_growth_or_stage_cap',
   boneLengthsUnchanged:true,radiiUnchanged:true,
   noPlayerSaveWritten:true,skinApplied:false});
 const progress=Math.min(MAX_STEP,session.pendingGrowth,
  3-session.appliedStageProgress);
 const newProgress=session.appliedStageProgress+progress;
 const nextPose=reshapePose({
  oldPose:session.motionState.pose,
  oldProgress:session.appliedStageProgress,
  newProgress,terrain,
  groundMarginWorld:session.motionState.groundMarginWorld
 });
 if(!nextPose)return failure(session,'rest_bone_geometry_unsolvable');
 const safety=inspectSnakeRestSizeChangeSafetyV09v({
  state:session.motionState,candidatePose:nextPose,
  scene,terrain
 });
 if(!safety.ok)return failure(session,
  'rest_growth_source_contact_rejected',{
  contactReason:safety.reason,firstRock:safety.firstSceneRockBlockerId});
 const nextSource=F({...session.motionState,
  pose:nextPose,stageProgress:newProgress,
  lifeStage:'rest_growth_synthetic',
  phase:'resting_growth',
  lastFrameAuthorized:false,
  latestRestGrowthStage:newProgress,
  restGrowthSourceFramesCommitted:0
 });
 const from=buildSnakeSizedMeshCandidateV09u({
  sizedState:session.motionState,scene,terrain});
 const to=buildSnakeSizedMeshCandidateV09u({
  sizedState:nextSource,scene,terrain});
 if(!from.ok||!to.ok)
  return failure(session,'rest_growth_head_body_mesh_rejected',{
   fromReason:from.reason??null,toReason:to.reason??null});
 const surface=inspectSnakeMeshTemporalV09s({
  from:from.sharedHeadCandidate,
  to:to.sharedHeadCandidate,scene,terrain,temporalSlices:5
 });
 if(!surface.ok)
  return failure(session,'rest_growth_mesh_transition_rejected',{
   meshReason:surface.reason});
 const next=F({...session,
  appliedStageProgress:newProgress,
  pendingGrowth:Math.max(0,
   session.pendingGrowth-progress),
  completedRestSteps:session.completedRestSteps+1,
  motionState:nextSource,
  lastSafetyHold:null});
 return F({ok:true,version:'0.9V',session:next,
  stageStepCommitted:1,sourceMotionFramesCommitted:0,
  newStageProgress:newProgress,
  growthOnlyWhileResting:true,
  headXYUnchanged:
   nextPose.points[0].x===session.motionState.pose.points[0].x&&
   nextPose.points[0].y===session.motionState.pose.points[0].y,
  actualSizeChanged:newProgress>session.appliedStageProgress,
  all23LinksAnd24RadiiUpdated:true,
  sourceSizeSafety:safety,
  fullMeshSurfaceSafety:surface,
  transparentMeshVertexCount:to.mesh.vertexCount,
  transparentMeshTriangleCount:to.mesh.triangleCount,
  finite5SliceMeshSafetyOnly:true,
  exactContinuous3DMeshCollisionCertified:false,
  gameSaveModified:false,skinApplied:false});
}
/** Exit an authorized safe rest; V0.9T resumes with the newly
 * accepted body lengths/radii, not an adult projection or teleport.
 */
export function resumeSnakeAfterGrowthRestV09v({
 session,scene,terrain
}={}){
 if(!auditSession(session)||!RESTS.includes(session.phase))
  return failure(session,'resume_requires_finished_safe_rest');
 if(!restSourceValid(session,scene,terrain))
  return failure(session,'resume_current_scene_unsafe');
 const next=sourcePhase(session.motionState,'moving_sized');
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState:next,scene,terrain
 });
 if(!mesh.ok)return failure(session,'resume_mesh_pose_unsafe',
  {meshReason:mesh.reason});
 return F({ok:true,version:'0.9V',
  session:F({...session,phase:'moving',
   motionState:next}),
  resumedWithCurrentSize:true,
  boneLengthsAndRadiiPreserved:true,
  pendingGrowthNotDiscarded:true,
  stageStepCommitted:0,movementFramesCommitted:0,
  noPlayerSaveWritten:true,skinApplied:false});
}
