/**
 * PRIVATE OHM V1.0N — strict bridge to the PUBLIC neutral V0.9Y
 * genuine reverse source and whole-mesh temporal sweep.
 *
 * IMPORTANT: NEVER inspect a reverse frame with V0.9U's FORWARD
 * source-replay checker. Reverse frames are certified ONLY by the
 * separate V0.9Y inspectSnakeReverseMeshStepV09y, using V0.9S.
 * K is an additional static ground/projection OBSERVATION, not a
 * substitute for the reverse certified temporal surface collision.
 *
 * This module does not synthesize, approve or mutate snake poses.
 * Physical coil opening/stacking/support remain unimplemented.
 */
export const WARMVEIN_REAL_REVERSE_V10N='1.0N';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const fail=reason=>F({
 version:'1.0N',ok:false,reason,
 reverseSourceAuthenticated:false,
 noGameplayMovementAuthority:true,
 noPlayerSaveChanges:true
});
export function inspectWarmveinRealReverseV10n({
 previousState,nextState,reverseProof,contactObservation,
 requestedTurnRadians=0
}={}){
 if(previousState?.version!=='0.9T'||nextState?.version!=='0.9T'||
  previousState.phase!=='moving_sized'||nextState.phase!=='moving_sized'||
  !Number.isInteger(previousState.verifiedFrames)||
  nextState.verifiedFrames!==previousState.verifiedFrames+1||
  !nextState.lastFrameAuthorized||
  nextState.reverseTranslationFromCurrentStage!==true||
  previousState.stageProgress!==nextState.stageProgress||
  previousState.pose?.points?.length!==24||
  nextState.pose?.points?.length!==24||
  previousState.pose?.boneLengths?.length!==23||
  nextState.pose?.boneLengths?.length!==23||
  !finite(previousState.heading)||!finite(nextState.heading)||
  !finite(requestedTurnRadians)||
  Math.abs(requestedTurnRadians)>.0025+1e-12||
  Math.abs(nextState.heading-previousState.heading-
   requestedTurnRadians)>1e-8)
  return fail('source_state_not_approved_for_bounded_reverse');
 const sizedBodyLength=previousState.pose.boneLengths.reduce((a,b)=>a+b,0);
 if(Math.abs(requestedTurnRadians)>
    Math.min(.0025,.012/sizedBodyLength*.42)+1e-12)
  return fail('source_reverse_stage_steering_exceeds_bound');
 if(reverseProof?.version!=='0.9Y'||reverseProof.ok!==true||
  reverseProof.sourceReplayMatched!==true||
  reverseProof.sourceFrameStart!==previousState.verifiedFrames||
  reverseProof.sourceFrameEnd!==nextState.verifiedFrames||
  reverseProof.trueBackwardHeadMotion!==true||
  !finite(reverseProof.headBackwardDisplacementDotWorld)||
  reverseProof.headBackwardDisplacementDotWorld>=-1e-6||
  reverseProof.unchanged23BoneLengths!==true||
  reverseProof.unchanged24Radii!==true||
  reverseProof.wholeHeadBodyMeshVertexCount!==1617||
  reverseProof.wholeHeadBodyMeshTriangleCount!==3216||
  reverseProof.sourceSwept3DCapsuleClear!==true||
  reverseProof.full3DTriangleSampledTemporalClear!==true||
  reverseProof.reverseNotPretendedForward!==true||
  reverseProof.temporal?.ok!==true||
  reverseProof.temporal.firstNonlocalTriangleCollision!=null||
  reverseProof.temporal.firstUncertainContact!=null||
  !finite(reverseProof.temporal.minimumSampledSurfaceGroundGapWorld)||
  reverseProof.temporal.minimumSampledSurfaceGroundGapWorld<-.00001||
  reverseProof.initialMesh?.version!=='0.9U'||
  reverseProof.finalMesh?.version!=='0.9U'||
  reverseProof.finalMesh?.ok!==true||
  reverseProof.finalMesh.mesh?.vertexCount!==1617||
  reverseProof.finalMesh.mesh?.triangleCount!==3216||
  reverseProof.finalMesh.stageProgress!==nextState.stageProgress||
  reverseProof.finalMesh.sourceFrame!==nextState.verifiedFrames)
  return fail('independent_v09y_whole_mesh_proof_not_verified');
 if(contactObservation?.version!=='1.0K'||
  contactObservation.ok!==true||
  contactObservation.vertexCount!==1617||
  contactObservation.triangleCount!==3216||
  contactObservation.ringCount!==101||
  contactObservation.originalSourceAndColliderUntouched!==true||
  contactObservation.originalSkinAndEyesUntouched!==true||
  contactObservation.upstreamV09uSourceEvidenceMatched!==false||
  contactObservation.flatGroundZ!==0)
  return fail('original_mesh_observation_not_verified');
 if(JSON.stringify(previousState.pose.boneLengths)!==
   JSON.stringify(nextState.pose.boneLengths)||
  JSON.stringify(previousState.pose.radiiWorldUnits)!==
   JSON.stringify(nextState.pose.radiiWorldUnits))
  return fail('source_link_lengths_or_radii_changed');
 return F({
  version:'1.0N',ok:true,reason:null,
  sourceFrameStart:previousState.verifiedFrames,
  sourceFrameEnd:nextState.verifiedFrames,
  stageProgress:nextState.stageProgress,
  approvedReverseTurnRadians:requestedTurnRadians,
  reverseProofVersion:reverseProof.version,
  genuineReverseHeadTranslationWorld:
   -reverseProof.headBackwardDisplacementDotWorld,
  minimumSampledOriginalSurfaceGroundGapWorld:
   reverseProof.temporal.minimumSampledSurfaceGroundGapWorld,
  fullMeshSourceVertices:reverseProof.wholeHeadBodyMeshVertexCount,
  fullMeshTriangles:reverseProof.wholeHeadBodyMeshTriangleCount,
  sourceMeshCandidate:reverseProof.finalMesh,
  originalSourceColliderRadiiUnchanged:true,
  reverseSourceAuthenticated:true,
  reverseNeverPretendedForward:true,
  v09sFiniteTemporalSamplesOnly:true,
  exactContinuous3DCollisionNotCertified:true,
  naturalUncoilingOrMuscleForcesNotCertified:true,
  physicalOverUnderAndCoilSupportNotCertified:true,
  newMotionControllerGranted:false,
  noGameplayMovementAuthority:true,
  noPlayerSaveChanges:true,
  blinkEnabled:false
 });
}
