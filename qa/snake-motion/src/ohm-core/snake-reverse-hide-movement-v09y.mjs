/**
 * Project OHM V0.9Y — neutral reverse locomotion and WHOLE MESH
 * safe-shelter occupancy test following refusal/seek-cover intent.
 *
 * V0.9T reverse is a NEW independent backward 24-joint source step,
 * not forward motion replayed backward or a teleported head.
 * V0.9U/R/S validate 1617 vertices/3216 triangles for each step.
 *
 * The shelter is an ABSTRACT, navigable 3D rectangular COVER REGION
 * with an overhead clearance constraint, not a solid cave mesh,
 * physical hide object or complete pathfinding. Source-owned scene
 * objects still block reverse movement; a source rock anywhere in the
 * cover region means the region is not a legitimate open shelter.
 *
 * Refusal->seek-cover must be an actual V0.9X event receipt, not just
 * a generic unsolicited "npc wants to hide" string. Source event
 * provenance and real player accounts still need authoritative host.
 *
 * Static and finite temporal checks are conservative/sampled, not
 * exact continuous mesh/force or animal welfare certification.
 */
import {inspectSnakeReverseStepV09y,
 advanceSnakeReverseStepV09y}
 from './snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u}
 from './snake-sized-mesh-motion-v09u.mjs';
import {inspectSnakeMeshTemporalV09s}
 from './snake-swept-mesh-contact-v09s.mjs';

export const SNAKE_REVERSE_HIDE_MOVEMENT_V09Y_VERSION='0.9Y';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const validID=s=>typeof s==='string'&&ID.test(s);
const POS_EPS=1e-9;
const fail=(reason,extra={})=>F({
 version:'0.9Y',ok:false,reason,...extra,
 sourceFramesCommitted:0,playerSaveModified:false,
 actualGameplayHideAuthorized:false,
 exactContinuous3DPhysicsCertified:false,skinApplied:false
});
function validShelter(sh,scene){
 if(!sh||!scene||!validID(sh.id)||
  sh.sceneId!==scene.sceneId||
  sh.sceneRevision!==scene.revision||
  ![sh.xMin,sh.xMax,sh.yMin,sh.yMax,
   sh.floorZ,sh.roofZ].every(finite)||
  sh.xMin<-4||sh.xMax>4||sh.xMax<=sh.xMin||
  sh.yMin<-1.6||sh.yMax>1.6||
  sh.yMax<=sh.yMin||sh.floorZ<-.2||
  sh.roofZ>2||sh.roofZ-sh.floorZ<.12)
  return {ok:false,reason:'invalid_or_stale_shelter_region'};
 // A proposed shelter containing a source-owned solid rock is NOT
 // a real hiding place. This conservative test may reject large
 // complex caves; never pretend the obstructed region is empty.
 const sx0=500+sh.xMin*125,sx1=500+sh.xMax*125,
  sy0=200+sh.yMin*125,sy1=200+sh.yMax*125;
 for(const object of scene.objects??[])
  if(sx0<=object.x+object.width+2&&
   sx1>=object.x-2&&sy0<=object.y+object.depth+2&&
   sy1>=object.y-2)
   return {ok:false,reason:'shelter_volume_contains_source_rock',
    blocker:object.id};
 return {ok:true};
}
function present(shelter,p){
 return p.x>=shelter.xMin-POS_EPS&&
  p.x<=shelter.xMax+POS_EPS&&
  p.y>=shelter.yMin-POS_EPS&&
  p.y<=shelter.yMax+POS_EPS&&
  p.z>=shelter.floorZ-POS_EPS&&
  p.z<=shelter.roofZ+POS_EPS;
}
function stateIdentity(a,b){
 return JSON.stringify(a)===JSON.stringify(b);
}
/** Read-only candidate assessment, NEVER proof of source authenticity.
 * "Whole body" means ALL 1617 neutral mesh VERTICES in the cover
 * volume, not simply head/tail or 24 centerline joints.
 */
export function inspectSnakeWholeMeshHideV09y({
 sizedState,scene,terrain,shelter
}={}){
 const valid=validShelter(shelter,scene);
 if(!valid.ok)return fail(valid.reason,{
  blocker:valid.blocker??null});
 if(sizedState?.version!=='0.9T'||
  sizedState.pose?.points?.length!==24)
  return fail('invalid_current_stage_sized_source');
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState,scene,terrain});
 if(!mesh.ok)return fail('unsafe_visible_body_for_shelter',
  {sourceReason:mesh.reason});
 const vertices=mesh.mesh.positions,
  radial=mesh.mesh.radialSegments,
  firstNeck=mesh.mesh.neckSocketRingStartIndex,
  tailStart=firstNeck+(mesh.mesh.bodyRingCount-1)*radial,
  noseIndex=mesh.mesh.noseVertexIndex;
 const inside=vertices.filter(p=>present(shelter,p)).length;
 const jointInside=sizedState.pose.points.filter(p=>
  present(shelter,p)).length;
 const headVertices=[...vertices.slice(0,firstNeck+radial),
  vertices[noseIndex]];
 const headInside=headVertices.every(p=>present(shelter,p));
 const tailInside=vertices.slice(tailStart,
  tailStart+radial).every(p=>present(shelter,p));
 const allMeshVerticesInside=inside===vertices.length;
 const sampledRoofClearance=Math.min(...vertices.map(p=>
  shelter.roofZ-p.z));
 const sampledFloorClearance=Math.min(...vertices.map(p=>
  p.z-shelter.floorZ));
 const heightAdequate=
  sampledRoofClearance>=-1e-9&&
  sampledFloorClearance>=-1e-9;
 return F({version:'0.9Y',ok:true,shelterId:shelter.id,
  stageProgress:sizedState.stageProgress,
  sourceFrame:sizedState.verifiedFrames,
  headInside,tailInside,jointInsideCount:jointInside,
  meshVertexCount:vertices.length,
  meshVertexInsideCount:inside,
  entireTransparentHeadNeckBodyTailInside:allMeshVerticesInside,
  fullBodyShelteredCandidate:
   allMeshVerticesInside&&heightAdequate,
  headOnlyArrivalRejected:headInside&&!allMeshVerticesInside,
  minimumSampledRoofClearanceWorld:sampledRoofClearance,
  minimumSampledFloorClearanceWorld:sampledFloorClearance,
  sourceSceneObjectsAllClearOfCover:true,
  abstractShelterVolumeOnly:true,
  actualRenderedHideRoofBuilt:false,
  all24SourceJointCentersNotSufficient:true,
  exactContinuous3DPhysicsCertified:false,
  playerSaveModified:false,skinApplied:false
 });
}
/**
 * Deterministic REPLAY of a true reverse V0.9T step, then both 1617
 * vertex surface candidates and V0.9S whole-triangle temporal check.
 * This is separate from V0.9U's FORWARD replay and cannot treat
 * reverse movement as an authorized forward step.
 */
export function inspectSnakeReverseMeshStepV09y({
 previousState,nextState,scene,terrain,
 turnRadians=0,seconds=1/30,temporalSlices=3
}={}){
 if(previousState?.version!=='0.9T'||
  nextState?.version!=='0.9T'||
  previousState.phase!=='moving_sized'||
  nextState.phase!=='moving_sized'||
  !scene||!terrain||
  !Number.isInteger(temporalSlices)||
  temporalSlices<3||temporalSlices>5)
  return fail('invalid_reverse_mesh_source_or_time');
 const step=inspectSnakeReverseStepV09y({
  state:previousState,scene,terrain,turnRadians,seconds
 });
 if(!step.ok)return fail('source_reverse_safety_gate_rejected',
  {sourceReason:step.reason,sourceReplayMatched:false});
 const replay=advanceSnakeReverseStepV09y({
  state:previousState,scene,terrain,turnRadians,seconds
 });
 if(!stateIdentity(replay,nextState)||
  nextState.verifiedFrames!==previousState.verifiedFrames+1||
  !nextState.lastFrameAuthorized||
  JSON.stringify(nextState.pose.boneLengths)!==
   JSON.stringify(previousState.pose.boneLengths)||
  JSON.stringify(nextState.pose.radiiWorldUnits)!==
   JSON.stringify(previousState.pose.radiiWorldUnits))
  return fail('forged_reverse_source_or_size_change',
   {sourceReplayMatched:false});
 const a=buildSnakeSizedMeshCandidateV09u({
  sizedState:previousState,scene,terrain});
 const b=buildSnakeSizedMeshCandidateV09u({
  sizedState:nextState,scene,terrain});
 if(!a.ok||!b.ok)return fail('reverse_head_body_mesh_unsafe',
  {sourceReplayMatched:true,
   fromReason:a.reason??null,toReason:b.reason??null});
 const temporal=inspectSnakeMeshTemporalV09s({
  from:a.sharedHeadCandidate,to:b.sharedHeadCandidate,
  scene,terrain,temporalSlices
 });
 if(!temporal.ok)return fail('reverse_mesh_temporal_contact',
  {sourceReplayMatched:true,sourceReason:temporal.reason});
 return F({version:'0.9Y',ok:true,
  sourceReplayMatched:true,
  sourceFrameStart:previousState.verifiedFrames,
  sourceFrameEnd:nextState.verifiedFrames,
  trueBackwardHeadMotion:
   step.headBackwardDisplacementDotWorld<0,
  headBackwardDisplacementDotWorld:
   step.headBackwardDisplacementDotWorld,
  maximumJointStepWorld:step.maximumJointStepWorld,
  unchanged23BoneLengths:true,unchanged24Radii:true,
  wholeHeadBodyMeshVertexCount:b.mesh.vertexCount,
  wholeHeadBodyMeshTriangleCount:b.mesh.triangleCount,
  sourceSwept3DCapsuleClear:step.sweptAudit.ok,
  full3DTriangleSampledTemporalClear:temporal.ok,
  temporal,initialMesh:a,finalMesh:b,
  reverseNotPretendedForward:true,
  originalCallerSourceUnmodified:true,
  sourceFramesCommitted:0,gameplayHideAuthorized:false,
  exactContinuous3DPhysicsCertified:false,
  saveModified:false,skinApplied:false});
}
/**
 * Back away along the CURRENT head-facing axis toward an explicit
 * trusted source-scene shelter region (cover only, no pathfinding).
 *
 * Will claim full-body shelter ONLY after every vertex in the
 * CURRENT verified 1617-vertex head+tail mesh is within its volume.
 * Never jump to a desired position, shrink the snake or hide tail.
 */
export function previewSnakeRefusalRetreatToShelterV09y({
 receipt,sizedState,scene,terrain,shelter,
 maxFrames=95,seconds=.05
}={}){
 if(receipt?.accepted!==false||
  receipt?.behavior!=='sniff_then_seek_cover'||
  !validID(receipt.offerId)||
  sizedState?.version!=='0.9T'||
  sizedState.phase!=='moving_sized'||
  !Number.isInteger(maxFrames)||maxFrames<1||
  maxFrames>120||!finite(seconds)||seconds<=0||
  seconds>.05)
  return fail('refusal_hide_intent_or_source_invalid');
 const initialPoseJSON=JSON.stringify(sizedState);
 let probe=inspectSnakeWholeMeshHideV09y({
  sizedState,scene,terrain,shelter
 });
 if(!probe.ok)return fail(probe.reason,{
  initialShelterRejected:true});
 let state=sizedState,committed=0;
 let firstFailure=null,peakStep=0;
 const initialHead=state.pose.points[0],
  initialTail=state.pose.points[23];
 const progress=[];
 for(let i=0;i<maxFrames&&!probe.fullBodyShelteredCandidate;i++){
  const next=advanceSnakeReverseStepV09y({
   state,scene,terrain,turnRadians:0,seconds
  });
  if(next.phase!=='moving_sized'||
   next.verifiedFrames!==state.verifiedFrames+1){
   firstFailure=F({frame:i,reason:'reverse_source_safety_hold',
    detail:next.status??'unknown'});break;
  }
  const verified=inspectSnakeReverseMeshStepV09y({
   previousState:state,nextState:next,scene,terrain,
   turnRadians:0,seconds
  });
  if(!verified.ok){
   firstFailure=F({frame:i,reason:verified.reason,
    detail:verified.sourceReason??null});break;
  }
  const candidate=inspectSnakeWholeMeshHideV09y({
   sizedState:next,scene,terrain,shelter
  });
  if(!candidate.ok){
   firstFailure=F({frame:i,reason:candidate.reason});break;
  }
  peakStep=Math.max(peakStep,verified.maximumJointStepWorld);
  progress.push(F({sourceFrame:next.verifiedFrames,
   headInside:candidate.headInside,
   tailInside:candidate.tailInside,
   meshVerticesInside:candidate.meshVertexInsideCount,
   wholeBodyInside:candidate.fullBodyShelteredCandidate}));
  probe=candidate;
  committed++;state=next;
 }
 const arrived=probe.fullBodyShelteredCandidate;
 return F({version:'0.9Y',ok:arrived,
  status:arrived?'whole_mesh_inside_abstract_shelter':
   firstFailure?'safe_hold_at_last_verified_body':
    'budget_exhausted_without_whole_body_entry',
  requestedFrameBudget:maxFrames,
  verifiedReverseFrames:committed,
  lastShadowSourceFrame:state.verifiedFrames,
  initialSourceFrame:sizedState.verifiedFrames,
  initialHead,initialTail,
  finalHead:state.pose.points[0],finalTail:state.pose.points[23],
  maximumWholeBodyJointStepWorld:peakStep,
  firstFailure,
  progression:F(progress),
  finalShelterAssessment:probe,
  everyNeutralMeshVertexInside:arrived,
  headOnlyInsufficient:true,
  bodyLengthAndRadiiUnchanged:
   JSON.stringify(sizedState.pose.boneLengths)===
    JSON.stringify(state.pose.boneLengths)&&
   JSON.stringify(sizedState.pose.radiiWorldUnits)===
    JSON.stringify(state.pose.radiiWorldUnits),
  sourceStateUnmodified:
   JSON.stringify(sizedState)===initialPoseJSON,
  sourceHeadTraveledBackwards:
   state.pose.points[0].x<initialHead.x-.001,
  originalCanonicalAdultMotionNotUsed:true,
  actualCoverRegionGeometryOnly:true,
  completedRealCaveNavigation:false,
  reverseRetreatModelSynthetic:true,
  playerGameMotionFramesCommitted:0,
  exactContinuous3DPhysicsCertified:false,
  playerSaveModified:false,skinApplied:false});
}
