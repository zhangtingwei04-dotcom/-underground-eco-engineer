/**
 * PRIVATE Project Ohm V1.0M — non-mutating rest hold and conservative
 * opposite-turn release REQUEST for an existing V0.9T source state.
 *
 * A rest here means the preview holds the SAME approved 24-joint pose.
 * No source clock advances, no aging or satiety/energy changes, and no
 * fake body relaxation. A release is only an opposite-heading turn,
 * NOT an actual coil unwrapping or 3D supported unstacking.
 *
 * Only V0.9T/U, followed by F/J/K/L validators, may authorize
 * a NEW next frame; this module grants no physical movement.
 */
export const WARMVEIN_REST_RELEASE_V10M='1.0M';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function invalid(reason){return F({
 version:'1.0M',ok:false,reason,
 sourceStepAuthorized:false,gameSaveWritten:false,
 physicalRestOrCoilReleaseCertified:false
});}
function validSource(state){
 return state?.version==='0.9T'&&
 state.phase==='moving_sized'&&
 Number.isInteger(state.verifiedFrames)&&state.verifiedFrames>=0&&
 Number.isInteger(state.stageProgress)&&
 state.stageProgress>=0&&state.stageProgress<=3&&
 finite(state.heading)&&state.lastFrameAuthorized===true&&
 state.pose?.points?.length===24&&
 state.pose?.boneLengths?.length===23&&
 state.pose.boneLengths.every(n=>finite(n)&&n>0);
}
/**
 * Called after preview STOP. Returns session that refers to exactly
 * the current authentic source snapshot, with no pose mutation.
 */
export function beginWarmveinRestHoldV10m({
 state,approvedArc=null
}={}){
 if(!validSource(state))return invalid('invalid_original_source_pose');
 if(approvedArc!==null&&(
  approvedArc.version!=='1.0L'||approvedArc.ok!==true||
  approvedArc.lastSourceEndFrame!==state.verifiedFrames||
  approvedArc.stageProgress!==state.stageProgress||
  approvedArc.sourceMotionVerifiedByOriginalV09tU!==true||
  !finite(approvedArc.lastAuthorizedTurnRadians)||
  !finite(approvedArc.directionalSourceTurnRadians)))
  return invalid('stale_or_unapproved_last_arc');
 return F({
  version:'1.0M',ok:true,reason:null,
  mode:'preview_rest_hold',
  originalStateReference:state,
  sourceFrame:state.verifiedFrames,
  stageProgress:state.stageProgress,
  originalHeading:state.heading,
  lastAuthorizedTurnRadians:
   approvedArc?.lastAuthorizedTurnRadians??0,
  directionalSourceTurnRadians:
   approvedArc?.directionalSourceTurnRadians??0,
  pausedAtOriginalSourceFrame:true,
  pausedBodyPoseIsExactOriginalReference:true,
  sourceFrameCountAdvancedByHold:0,
  playerTimeAdvancedByHold:false,
  bodyPoseRelaxationSynthesized:false,
  originalCollisionAndRadiiUnmodified:true,
  actualCoilingPhysicsCertified:false,
  actualRestBiomechanicsCertified:false,
  gameSaveWritten:false
 });
}
/**
 * Return only a turn REQUEST, never a new 24-joint pose. The UI must
 * call original advanceSnakeVariableSizeMotionV09t() and re-check
 * V0.9U/F/J/K/L before displaying the next frame.
 */
export function planWarmveinReleaseStepV10m({
 state,hold,mode='counterturn'
}={}){
 if(!validSource(state)||hold?.version!=='1.0M'||
  hold.ok!==true||hold.mode!=='preview_rest_hold'||
  hold.originalStateReference!==state||
  hold.sourceFrame!==state.verifiedFrames||
  hold.stageProgress!==state.stageProgress||
  Math.abs(hold.originalHeading-state.heading)>1e-10)
  return invalid('stale_or_modified_held_source');
 if(mode!=='counterturn'&&mode!=='straight')
  return invalid('unsupported_release_mode');
 const bodyLength=state.pose.boneLengths.reduce((sum,n)=>sum+n,0);
 const conservativeCeiling=Math.min(.004,.035/bodyLength*.60);
 if(!finite(conservativeCeiling)||conservativeCeiling<.001)
  return invalid('body_too_long_for_conservative_release');
 const signedPrevious=Math.sign(hold.directionalSourceTurnRadians||
  hold.lastAuthorizedTurnRadians);
 if(mode==='counterturn'&&signedPrevious===0)
  return invalid('counterturn_requires_verified_prior_arc');
 const turnRadians=mode==='straight'?0:
  -signedPrevious*conservativeCeiling;
 return F({
  version:'1.0M',ok:true,reason:null,
  mode:'release_request_'+mode,turnRadians,
  conservativeCeiling,sourceFrame:state.verifiedFrames,
  originalStateReference:state,
  originalStageProgress:state.stageProgress,
  requiresRealV09tStateAdvance:true,
  requiresV09uTemporalMeshApproval:true,
  requiresOriginalCollisionAndGroundAudit:true,
  sourceStepAuthorized:false,
  newSourcePoseGenerated:false,
  truePhysicalCoilReleaseCertified:false,
  trueMuscleRelaxationCertified:false,
  sourceTimePassedDuringRest:false,
  originalPoseRadiiAndCollidersUnmodified:true,
  gameSaveWritten:false
 });
}
