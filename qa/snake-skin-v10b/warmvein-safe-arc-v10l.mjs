/**
 * PRIVATE OHM V1.0L: bounded arc intent + observation of a REAL
 * V0.9T/U-authorized 24-joint step toward a loose curl.
 *
 * No forged coiled poses, no overriding an upstream safety hold, no
 * extra collision authority, physical forces, skin changes or saves.
 *
 * A visually curved, source-approved path is NOT a certified coil:
 * support, pressure, friction and complete 3D continuous collisions
 * remain research tasks. This module accepts real proof objects; it
 * NEVER creates the next snake state itself.
 */
export const WARMVEIN_SAFE_ARC_V10L='1.0L';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const approx=(x,y,e=1e-8)=>Math.abs(x-y)<=e;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ACTUAL_MAX_ARC_STEP=.006;
const MAX_BODY_TURN_RATE=.035;

const invalid=(reason)=>F({
 version:'1.0L',ok:false,reason,turnRadians:0,
 safeSourceStateCommitted:false,newMotionControllerGranted:false,
 physicalCoilingCertified:false,gameSaveWritten:false
});

/**
 * Plan a bounded *request* for an existing V0.9T source. The original
 * V0.9T remains free to reject this request for any reason.
 * Modes are values from the UI/CI, not new fictional animation frames.
 */
export function planWarmveinSafeArcV10l({
 state,requestedTurnRadians=0
}={}){
 const p=state?.pose;
 if(state?.version!=='0.9T'||
  state.phase!=='moving_sized'||
  !Number.isInteger(state.verifiedFrames)||
  !finite(state.heading)||
  p?.points?.length!==24||
  p?.boneLengths?.length!==23||
  !p.boneLengths.every(n=>finite(n)&&n>0)||
  !finite(requestedTurnRadians)||
  Math.abs(requestedTurnRadians)>ACTUAL_MAX_ARC_STEP+1e-12)
  return invalid('invalid_source_or_excessive_arc_request');
 const length=p.boneLengths.reduce((sum,n)=>sum+n,0);
 const originalLimit=Math.min(.028,MAX_BODY_TURN_RATE/length);
 const allowedForProbe=Math.min(ACTUAL_MAX_ARC_STEP,originalLimit*.75);
 if(Math.abs(requestedTurnRadians)>allowedForProbe+1e-12)
  return invalid('source_size_turn_limit_exceeded');
 return F({
  version:'1.0L',ok:true,reason:null,
  requestedTurnRadians,turnRadians:requestedTurnRadians,
  arcIntent:Math.abs(requestedTurnRadians)>.003?
   requestedTurnRadians>0?'gentle_source_right_curl':'gentle_source_left_curl':
   requestedTurnRadians===0?'straight_source_motion':'slow_source_turn',
  originalSizedBodyLengthWorld:length,
  originalMaxTurnRadians:originalLimit,
  conservativeArcCeiling:allowedForProbe,
  sourceStartFrame:state.verifiedFrames,
  stageProgress:state.stageProgress,
  requiresOriginalV09tReplay:true,
  requiresOriginalV09uFullMeshContact:true,
  upstreamMustApproveEveryFrame:true,
  safeSourceStateCommitted:false,
  originalCollisionRadiusModified:false,
  physicalCoilingCertified:false,
  realMuscleFrictionCertified:false,
  gameSaveWritten:false
 });
}
/**
 * Called ONLY after the V0.9T state was advanced and approved by
 * inspectSnakeSizedMeshStepV09u, and K observed the ORIGINAL full mesh.
 * Arc count is actual verified source heading, not a decorative curve.
 */
export function inspectWarmveinApprovedArcStepV10l({
 previousState,nextState,sourceEvidence,contactAudit,
 arcIntent,previousArcTrace=null
}={}){
 if(arcIntent?.version!=='1.0L'||arcIntent.ok!==true||
  previousState?.version!=='0.9T'||
  nextState?.version!=='0.9T'||
  previousState.phase!=='moving_sized'||
  nextState.phase!=='moving_sized'||
  !Number.isInteger(nextState.verifiedFrames)||
  nextState.verifiedFrames!==previousState.verifiedFrames+1||
  arcIntent.sourceStartFrame!==previousState.verifiedFrames||
  previousState.stageProgress!==nextState.stageProgress||
  previousState.stageProgress!==arcIntent.stageProgress||
  nextState.lastFrameAuthorized!==true||
  !finite(previousState.heading)||!finite(nextState.heading)||
  sourceEvidence?.version!=='0.9U'||
  sourceEvidence.ok!==true||
  sourceEvidence.sourceReplayMatched!==true||
  sourceEvidence.trueSizedSourceStartFrame!==previousState.verifiedFrames||
  sourceEvidence.trueSizedSourceEndFrame!==nextState.verifiedFrames||
  sourceEvidence.sourceStageProgress!==nextState.stageProgress||
  contactAudit?.version!=='1.0K'||contactAudit.ok!==true||
  contactAudit.upstreamV09uSourceEvidenceMatched!==true||
  contactAudit.originalSourceAndColliderUntouched!==true||
  contactAudit.gameSaveWritten!==false||
  !Number.isInteger(contactAudit.projectedProximityPairs)||
  !Number.isInteger(contactAudit.unresolvedNearBodyPairs)||
  !Number.isInteger(contactAudit.possibleVerticalOverUnderPairs)||
  !approx(nextState.heading-previousState.heading,
   arcIntent.turnRadians,1e-8))
  return invalid('unapproved_or_mismatched_real_source_arc_step');
 let signedAngle=arcIntent.turnRadians,
  verifiedArcFrames=arcIntent.turnRadians===0?0:1;
 const sign=Math.sign(arcIntent.turnRadians);
 const priorSign=Math.sign(previousArcTrace?.lastAuthorizedTurnRadians??0);
 if(previousArcTrace!==null&&
  previousArcTrace.version==='1.0L'&&previousArcTrace.ok===true&&
  previousArcTrace.lastSourceEndFrame===previousState.verifiedFrames&&
  previousArcTrace.stageProgress===nextState.stageProgress&&
  sign!==0&&priorSign===sign){
  signedAngle+=previousArcTrace.directionalSourceTurnRadians;
  verifiedArcFrames+=previousArcTrace.verifiedDirectionalFrames;
 }
 // A source-verified gradual turn is not a self-contact/stacking proof.
 const absAngle=Math.abs(signedAngle);
 const phase=sign===0?'source_straight':
  absAngle<.15?'source_arc_start':
  absAngle<.65?'source_arc_building':
  absAngle<1.57?'source_curvature_developing':
  'source_u_turn_candidate_only';
 return F({
  version:'1.0L',ok:true,reason:null,
  arcIntent:arcIntent.arcIntent,
  phase,stageProgress:nextState.stageProgress,
  lastSourceStartFrame:previousState.verifiedFrames,
  lastSourceEndFrame:nextState.verifiedFrames,
  lastAuthorizedTurnRadians:arcIntent.turnRadians,
  directionalSourceTurnRadians:signedAngle,
  verifiedDirectionalFrames:verifiedArcFrames,
  directionalArcDegrees:Math.abs(signedAngle)*180/Math.PI,
  projectedBodyProximityPairs:contactAudit.projectedProximityPairs,
  unresolvedNearBodyPairs:contactAudit.unresolvedNearBodyPairs,
  possibleOverUnderPairs:contactAudit.possibleVerticalOverUnderPairs,
  sourceMotionVerifiedByOriginalV09tU:true,
  originalV09sSampledContactOnly:true,
  conservativeUnresolvedContactWarning:
   contactAudit.unresolvedNearBodyPairs>0,
  completeLooseCoilAchieved:false,
  genuineFullCoilingMotionCertified:false,
  physicalStackingAndSupportCertified:false,
  exactContinuous3DSweepCertified:false,
  newMovementControllerAuthorized:false,
  originalBonesAndColliderUnchanged:true,
  sourceStateMutatedByThisModule:false,
  blinkEnabled:false,gameSaveWritten:false
 });
}
