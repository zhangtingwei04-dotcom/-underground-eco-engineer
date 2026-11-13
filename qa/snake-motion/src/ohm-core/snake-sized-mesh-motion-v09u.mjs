/**
 * Project OHM neutral V0.9U: actual V0.9T-sized moving 24-joint skeleton
 * -> V0.9Q common-radius transparent body mesh + collision sections
 * -> V0.9R welded head/neck -> V0.9S FULL 3D triangle face tests.
 *
 * No use of old fixed V0.9C motion OR V0.9P reprojection per frame.
 * V0.9T authenticates every source step by DETERMINISTIC replay before
 * these geometry checks. Failed V0.9T or mesh checks = NO NEW source
 * pose committed and no gameplay authorization.
 *
 * Geometry-only builders are not proof of source authenticity. Only
 * inspectSnakeSizedMeshStepV09u checks both replay and V0.9S. False
 * claims are explicitly forbidden: still no exact continuous-time
 * swept mesh/terrain self collision, real muscles, actual in-life
 * growth, independent head collider or committed player game save.
 */
import {
 advanceSnakeVariableSizeMotionV09t,
 inspectSnakeVariableSizeStepV09t
} from './snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSharedBodyFromActualSizedPoseV09u}
 from './snake-shared-body-geometry-v09q.mjs';
import {buildSnakeHeadNeckFromSizedSharedV09u}
 from './snake-head-neck-seam-v09r.mjs';
import {inspectSnakeMeshSurfaceV09s,
 inspectSnakeMeshTemporalV09s}
 from './snake-swept-mesh-contact-v09s.mjs';

export const SNAKE_SIZED_MESH_MOTION_V09U_VERSION='0.9U';
const F=Object.freeze;
const validNum=n=>typeof n==='number'&&Number.isFinite(n);
const fail=(reason,extra={})=>F({
 version:SNAKE_SIZED_MESH_MOTION_V09U_VERSION,
 ok:false,reason,...extra,
 actualV09tSourceStepCommitted:0,gameplayMotionAuthorized:false,
 noChangesToOriginalV09tState:true,
 exactContinuous3DMeshSweepCertified:false,
 trueGrowthDuringMotionImplemented:false,
 skinApplied:false,saveModified:false
});
const stateIdentity=(a,b)=>
 JSON.stringify(a?.pose)===JSON.stringify(b?.pose)&&
 a?.version===b?.version&&
 a?.sceneStamp===b?.sceneStamp&&
 a?.sceneRevision===b?.sceneRevision&&
 a?.sceneId===b?.sceneId&&
 a?.stageProgress===b?.stageProgress&&
 a?.verifiedFrames===b?.verifiedFrames&&
 a?.heading===b?.heading&&
 a?.speedWorldPerSecond===b?.speedWorldPerSecond&&
 a?.groundMarginWorld===b?.groundMarginWorld&&
 a?.phase===b?.phase;

/**
 * Build *only* a candidate appearance/shell from the CURRENT V0.9T
 * pose. Unlike earlier V0.9Q/R, it never recreates V0.9P from adult.
 * This does NOT authenticate a caller-supplied V0.9T state.
 */
export function buildSnakeSizedMeshCandidateV09u({
 sizedState,scene,terrain,headYawRad=0,headPitchRad=0
}={}){
 if(sizedState?.version!=='0.9T'||
  sizedState.pose?.points?.length!==24||
  !Number.isInteger(sizedState.verifiedFrames)||
  sizedState.verifiedFrames<0||!scene||!terrain||
  !validNum(headYawRad)||Math.abs(headYawRad)>.18||
  !validNum(headPitchRad)||Math.abs(headPitchRad)>.08)
  throw new RangeError('v09u_invalid_sized_mesh_candidate');
 let body;
 try {
  body=buildSnakeSharedBodyFromActualSizedPoseV09u({
   pose:sizedState.pose,scene,terrain,
   stageProgress:sizedState.stageProgress,
   sourceFrame:sizedState.verifiedFrames
  });
 } catch(error) {
  return fail('sized_body_source_invalid',{
   errorCode:error?.message??'unknown'});
 }
 if(!body.ok)return fail('sized_body_mesh_rejected',{
  bodyReason:body.reason});
 let head;
 try {
  head=buildSnakeHeadNeckFromSizedSharedV09u({
   shared:body,scene,terrain,headYawRad,headPitchRad
  });
 } catch(error){
  return fail('sized_head_geometry_invalid',{
   errorCode:error?.message??'unknown'});
 }
 if(!head.ok)return fail('sized_head_mesh_rejected',{
  headReason:head.reason,headCheck:head.headCheck??null});
 // The static V0.9S mesh audit intentionally sees all head + tail
 // triangle surfaces, not just the T capsule envelope.
 const surface=inspectSnakeMeshSurfaceV09s({
  candidate:head,scene,terrain
 });
 if(!surface.ok)return fail('sized_mesh_surface_rejected',{
  surfaceReason:surface.reason,surface});
 return F({version:SNAKE_SIZED_MESH_MOTION_V09U_VERSION,
  ok:true,sourceFrame:sizedState.verifiedFrames,
  stageProgress:sizedState.stageProgress,lifeStage:sizedState.lifeStage,
  sizedBodySource:sizedState.pose,
  mesh:head.mesh,collisionShell:head.collisionShell,
  sharedHeadCandidate:head,
  sharedBodyCandidate:body,
  sourceMeshV09sStatic:surface,
  meshPositionsFromCurrentSizedState:true,
  current24JointSourceHead:sizedState.pose.points[0],
  currentSizedSourceLinkLengths:sizedState.pose.boneLengths,
  currentSizedLocalRadii:sizedState.pose.radiiWorldUnits,
  headNeckSocketWelded:head.seam.indexedSocketContinuous,
  sourceAuthenticationNotCheckedHere:true,
  actualV09tSourceStepCommitted:0,
  gameplayMotionAuthorized:false,
  exactContinuous3DMeshSweepCertified:false,
  trueGrowthDuringMotionImplemented:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * The ONLY V0.9U route to accepting a simulated source transition:
 * 1) Verify V0.9T source progression from its PREVIOUS true state;
 * 2) Recompute that one step and require an exact next-state match;
 * 3) Check both actual stage-sized head/body meshes and the complete
 *    face/heightfield/scene/self temporal risk tests from V0.9S.
 *
 * This checks a model-generated deterministic transition, NOT a
 * cryptographically authenticated client, collision proof or live save.
 */
export function inspectSnakeSizedMeshStepV09u({
 previousState,nextState,scene,terrain,
 turnRadians=0,seconds=1/30,
 previousYawRad=0,nextYawRad=0,
 previousPitchRad=0,nextPitchRad=0,
 temporalSlices=3
}={}){
 if(previousState?.version!=='0.9T'||
  nextState?.version!=='0.9T'||
  previousState.phase!=='moving_sized'||
  nextState.phase!=='moving_sized'||
  !scene||!terrain||
  !validNum(previousYawRad)||!validNum(nextYawRad)||
  !validNum(previousPitchRad)||!validNum(nextPitchRad)||
  !Number.isInteger(temporalSlices)||temporalSlices<3||
  temporalSlices>5)
  return fail('invalid_or_inactive_sized_source');
 if(Math.abs(nextYawRad-previousYawRad)>.035+1e-10||
  Math.abs(nextPitchRad-previousPitchRad)>.025+1e-10)
  return fail('head_look_frame_jump_too_large');
 const plan=inspectSnakeVariableSizeStepV09t({
  state:previousState,scene,terrain,turnRadians,seconds
 });
 if(!plan.ok)return fail('sized_source_step_not_accepted',{
  sizedSourceReason:plan.reason,sourceReplayMatched:false
 });
 const real=advanceSnakeVariableSizeMotionV09t({
  state:previousState,scene,terrain,turnRadians,seconds
 });
 if(!stateIdentity(real,nextState)||
  nextState.verifiedFrames!==previousState.verifiedFrames+1||
  !nextState.lastFrameAuthorized)
  return fail('forged_or_mismatched_v09t_source_step',{
   sourceReplayMatched:false});
 const from=buildSnakeSizedMeshCandidateV09u({
  sizedState:previousState,scene,terrain,
  headYawRad:previousYawRad,headPitchRad:previousPitchRad
 });
 if(!from.ok)return fail('previous_sized_mesh_invalid',{
  sourceReplayMatched:true,fromReason:from.reason,from
 });
 const to=buildSnakeSizedMeshCandidateV09u({
  sizedState:nextState,scene,terrain,
  headYawRad:nextYawRad,headPitchRad:nextPitchRad
 });
 if(!to.ok)return fail('next_sized_mesh_invalid',{
  sourceReplayMatched:true,toReason:to.reason,to
 });
 const temporal=inspectSnakeMeshTemporalV09s({
  from:from.sharedHeadCandidate,to:to.sharedHeadCandidate,
  scene,terrain,temporalSlices
 });
 if(!temporal.ok)return fail('full_sized_mesh_temporal_rejected',{
  sourceReplayMatched:true,from,to,
  temporalReason:temporal.reason,temporal
 });
 return F({
  version:SNAKE_SIZED_MESH_MOTION_V09U_VERSION,
  ok:true,reason:null,
  sourceReplayMatched:true,
  sourceStageIsIndependent:true,
  originalFixedAdultV09cNotAdvanced:true,
  trueSizedSourceStartFrame:previousState.verifiedFrames,
  trueSizedSourceEndFrame:nextState.verifiedFrames,
  sourceStageProgress:nextState.stageProgress,
  sourceSizeWorld:nextState.pose.boneLengths.reduce((a,b)=>a+b,0),
  unchangedSourceBoneLengths:
   JSON.stringify(nextState.pose.boneLengths)===
   JSON.stringify(previousState.pose.boneLengths),
  sharedHeadBodySeamClear:
   from.headNeckSocketWelded&&to.headNeckSocketWelded,
  entireHeadBodyMeshVertexCount:to.mesh.vertexCount,
  entireHeadBodyMeshTriangleCount:to.mesh.triangleCount,
  collisionShellUsesCurrentSizedState:true,
  latestPose:nextState.pose,
  from,to,temporal,
  actualV09tSourceStepCommitted:0,
  originalCallerSourceUnmodified:true,
  gameplayMotionAuthorized:false,
  exactContinuous3DMeshSweepCertified:false,
  trueGrowthDuringMotionImplemented:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * A V0.9U-certified read-only shadow trace. No scene or player save
 * is mutated even on success. Upstream V0.9T is the actual new
 * independently-sized source. If face-level risk differs from the
 * V0.9T capsule proxy, stop rather than falsely claim mesh safety.
 */
export function previewSnakeSizedMeshMotionV09u({
 sourceState,scene,terrain,frames=12,
 turnRadians=0,seconds=1/30,
 yawAmplitude=.035
}={}){
 if(sourceState?.version!=='0.9T'||
  sourceState.phase!=='moving_sized'||
  !Number.isInteger(frames)||frames<1||frames>30||
  !validNum(yawAmplitude)||yawAmplitude<0||yawAmplitude>.07)
  throw new RangeError('v09u_invalid_sized_shadow_preview');
 let current=sourceState,accepted=0,firstFailure=null;
 let minimumSurfaceGroundGap=Infinity,maxMeshStep=0;
 for(let i=0;i<frames;i++){
  const next=advanceSnakeVariableSizeMotionV09t({
   state:current,scene,terrain,turnRadians,seconds
  });
  if(next.phase!=='moving_sized'||
   next.verifiedFrames!==current.verifiedFrames+1){
   firstFailure=F({frame:i,reason:'original_v09t_sized_source_held',
    sourceReason:next.status??null});break;
  }
  const aYaw=yawAmplitude*Math.sin(i*.11),
   bYaw=yawAmplitude*Math.sin((i+1)*.11);
  const test=inspectSnakeSizedMeshStepV09u({
   previousState:current,nextState:next,
   scene,terrain,turnRadians,seconds,
   previousYawRad:aYaw,nextYawRad:bYaw
  });
  if(!test.ok){
   firstFailure=F({frame:i,
    reason:test.reason,detail:test.temporalReason??test.toReason??null});
   break;
  }
  accepted++;
  minimumSurfaceGroundGap=Math.min(minimumSurfaceGroundGap,
   test.temporal.minimumSampledSurfaceGroundGapWorld);
  maxMeshStep=Math.max(maxMeshStep,
   test.temporal.maximumSourceVertexStepWorld);
  current=next;
 }
 return F({
  version:SNAKE_SIZED_MESH_MOTION_V09U_VERSION,
  ok:accepted===frames,acceptedSizedMeshFrames:accepted,
  requestedFrames:frames,sourceEndFrameShadow:current.verifiedFrames,
  stageProgress:sourceState.stageProgress,firstFailure,
  minimumSampledGroundGapWorld:minimumSurfaceGroundGap,
  maximumMeshVertexStepWorld:maxMeshStep,
  motionSourceFromV09tInsteadOfFixedAdult:true,
  unchangedCallerSourceState:true,
  noUserSaveWrites:true,
  gameplayMotionAuthorized:false,
  exactContinuous3DMeshSweepCertified:false,
  trueGrowthDuringMotionImplemented:false,
  skinApplied:false,saveModified:false
 });
}
