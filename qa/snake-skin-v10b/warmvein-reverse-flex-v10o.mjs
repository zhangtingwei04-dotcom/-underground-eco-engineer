/**
 * PRIVATE OHM V1.0O — minimal source-controlled reverse flex probe.
 *
 * This module ONLY proposes a very small varying heading request
 * to the actual independent V0.9Y backward locomotion controller.
 * It does NOT add cosmetic vertex displacement, fabricate motion
 * frames, adjust the 24-joint rig, change collision radii, or grant
 * gameplay authority. Real changes arise only if V0.9Y generates
 * AND V0.9Y/V0.9S full-mesh replay approves a real next frame.
 *
 * The exploratory oscillation is NOT a biologically validated
 * muscular backward undulation, ventral-scale friction or a coil.
 */
export const WARMVEIN_REVERSE_FLEX_V10O='1.0O';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const phaseLen=64;
// Calibrated against the ACTUAL isolated V0.9T follower computation,
// not a biological speed or motion amplitude measurement. Juveniles
// bend much more for the same turn request, so their yaw must be lower.
export const V10O_STAGE_REVERSE_FLEX_YAW_AMPLITUDE=F([
 .00020,.00080,.00150,.00200
]);
const reject=(reason)=>F({
 version:'1.0O',ok:false,reason,turnRadians:0,
 actualSourceStepCertified:false,gameSaveWritten:false
});
export function planWarmveinReverseFlexV10o({
 state,mode='micro-flex'
}={}){
 if(state?.version!=='0.9T'||state.phase!=='moving_sized'||
  state.lastFrameAuthorized!==true||
  !Number.isInteger(state.verifiedFrames)||state.verifiedFrames<0||
  !Number.isInteger(state.stageProgress)||state.stageProgress<0||
  state.stageProgress>3||
  state.pose?.points?.length!==24||
  state.pose?.boneLengths?.length!==23||
  !state.pose.boneLengths.every(x=>finite(x)&&x>0)||
  !finite(state.heading)||
  !finite(state.speedWorldPerSecond)||
  !['micro-flex','straight'].includes(mode))
  return reject('invalid_source_state_or_mode');
 const totalLength=state.pose.boneLengths.reduce((a,b)=>a+b,0);
 // This bound is stricter than V0.9Y's size-dependent limit,
 // and does NOT overrule any terrain/self-collision hold.
 const ceiling=Math.min(
  V10O_STAGE_REVERSE_FLEX_YAW_AMPLITUDE[state.stageProgress],
  .012/totalLength*.42
 );
 const phase=(state.verifiedFrames%phaseLen)*Math.PI*2/phaseLen;
 const turnRadians=mode==='straight'?0:
  // Smooth sinusoidal angular-velocity steering. Neither forced
  // lateral joint displacement nor a pasted "wavy skin" animation.
  ceiling*Math.sin(phase);
 return F({
  version:'1.0O',ok:true,reason:null,
  mode,stageProgress:state.stageProgress,
  sourceStartFrame:state.verifiedFrames,
  sourceHeadingRadians:state.heading,
  bodyLengthWorld:totalLength,turnRadians,
  steeringAmplitudeCeiling:ceiling,
  steeringPeriodSourceFrames:phaseLen,
  sourceOnlySteeringRequest:true,
  requiresV09yReverseReplayAndV09sTemporalClearance:true,
  requiresOriginalV09tRadiiAnd23BoneLengths:true,
  sourceStateCommittedByPlanner:false,
  cosmeticVertexOffsetAdded:false,
  backwardMuscleUndulationCertified:false,
  frictionAndVentralScaleForcesCertified:false,
  genuineUncoilingCertified:false,
  physicalSelfStackingCertified:false,
  gameSaveWritten:false
 });
}
/**
 * Read-only observation of a fully authenticated and committed V0.9Y
 * reverse frame pair. Measures whether the body actually flexes or
 * remains nearly rigid; a small flex result is NOT a failure of safety,
 * but a quality gap to solve before calling the animation "natural".
 */
export function inspectWarmveinReverseFlexV10o({
 previousState,nextState,approvedReverse,plan
}={}){
 if(plan?.version!=='1.0O'||plan.ok!==true||
  approvedReverse?.version!=='1.0N'||approvedReverse.ok!==true||
  approvedReverse.reverseSourceAuthenticated!==true||
  previousState?.version!=='0.9T'||nextState?.version!=='0.9T'||
  previousState.verifiedFrames!==plan.sourceStartFrame||
  nextState.verifiedFrames!==previousState.verifiedFrames+1||
  plan.stageProgress!==nextState.stageProgress||
  approvedReverse.sourceFrameStart!==previousState.verifiedFrames||
  approvedReverse.sourceFrameEnd!==nextState.verifiedFrames||
  !finite(nextState.heading)||!finite(previousState.heading)||
  Math.abs(nextState.heading-previousState.heading-plan.turnRadians)>1e-8||
  previousState.pose?.points?.length!==24||
  nextState.pose?.points?.length!==24||
  previousState.pose?.boneLengths?.length!==23||
  nextState.pose?.boneLengths?.length!==23)
  return reject('source_frame_or_reverse_evidence_mismatch');
 const p=previousState.pose.points,n=nextState.pose.points;
 if(!p.every(x=>x&&[x.x,x.y,x.z].every(finite))||
  !n.every(x=>x&&[x.x,x.y,x.z].every(finite)))
  return reject('nonfinite_source_joints');
 const displacements=p.map((o,i)=>F({
  joint:i,dx:n[i].x-o.x,dy:n[i].y-o.y,dz:n[i].z-o.z,
  worldDistance:Math.hypot(n[i].x-o.x,n[i].y-o.y,n[i].z-o.z)
 }));
 const head=displacements[0],tail=displacements[23];
 let maxDisplacementDifference=0;
 for(const d of displacements){
  maxDisplacementDifference=Math.max(maxDisplacementDifference,
   Math.hypot(d.dx-head.dx,d.dy-head.dy,d.dz-head.dz));
 }
 function totalInteriorBend(points){
  let bend=0;
  for(let i=1;i<23;i++){
   const a=points[i-1],b=points[i],c=points[i+1];
   const dx0=a.x-b.x,dy0=a.y-b.y;
   const dx1=c.x-b.x,dy1=c.y-b.y;
   const A=Math.hypot(dx0,dy0),B=Math.hypot(dx1,dy1);
   if(A<1e-8||B<1e-8)continue;
   const cos=Math.max(-1,Math.min(1,
    (dx0*dx1+dy0*dy1)/(A*B)));
   bend+=Math.abs(Math.PI-Math.acos(cos));
  }
  return bend;
 }
 const bendingBefore=totalInteriorBend(p);
 const bendingAfter=totalInteriorBend(n);
 const bodyMotionNotRigidTranslation=maxDisplacementDifference>1e-6;
 return F({
  version:'1.0O',ok:true,reason:null,
  stageProgress:plan.stageProgress,
  sourceFrameStart:previousState.verifiedFrames,
  sourceFrameEnd:nextState.verifiedFrames,
  sourceApprovedTurnRadians:plan.turnRadians,
  originalHeadTranslationWorld:head.worldDistance,
  originalTailTranslationWorld:tail.worldDistance,
  headToTailDisplacementDifferenceWorld:Math.hypot(
   head.dx-tail.dx,head.dy-tail.dy,head.dz-tail.dz
  ),
  maximumJointDisplacementDifferenceFromHeadWorld:
   maxDisplacementDifference,
  totalCenterlineInteriorBendBeforeRadians:bendingBefore,
  totalCenterlineInteriorBendAfterRadians:bendingAfter,
  centerlineBendDeltaRadians:bendingAfter-bendingBefore,
  bodyMotionNonRigidAcrossJoints:bodyMotionNotRigidTranslation,
  originalJointMotionSamples:F(displacements),
  actualReverseFrameAuthenticated:true,
  biologicalMuscleWaveCertified:false,
  visualNaturalnessCertified:false,
  rigGeometryOrCollisionRadiusChanged:false,
  originalSaveUnmodified:true,blinkEnabled:false
 });
}
