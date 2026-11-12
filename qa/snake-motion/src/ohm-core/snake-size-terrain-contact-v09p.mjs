/**
 * Public neutral Project OHM V0.9P — variable-radius heightfield
 * contact SOLVER CANDIDATE, not a new authorized snake locomotor source.
 *
 * Consumes ONLY the original fixed 24-joint V0.9C/D/G authority and
 * the V0.9N growth profile. Rebuilds 23 links at their OWN true lengths
 * after setting variable-radius per-link ground heights. Never scales a
 * rendered sprite, never passes these changed lengths into V0.9C/D/G.
 *
 * Footprint scene objects are blocked over their entire source-owned XY
 * area (even high rock overhangs). Heightfield ground is sampled along
 * each entire bone. Nonlocal 3D capsules use stage-dependent radii.
 * Unsolvable slope, excess XY drift, rock, glass or self intersection:
 * FAIL CLOSED. A passing candidate is NOT full 3D mesh swept collision,
 * force/traction/support, biological growth, gameplay motion or a save.
 */
import {projectSnakeGrowthCandidateV09n}
 from './snake-growth-envelope-v09n.mjs';
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';
import {planSnakeHeadingReturnV09l}
 from './snake-heading-turn-v09l.mjs';
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION='0.9P';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const xyDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const vec=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>F({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const floor=q=>({x:q.x*125+500,y:q.y*125+200});
function overlapsRect(a,b,rect,pad){
 let lo=0,hi=1;
 for(const [s,d,min,max] of [
  [a.x,b.x-a.x,rect.x-pad,rect.x+rect.width+pad],
  [a.y,b.y-a.y,rect.y-pad,rect.y+rect.depth+pad]
 ]){
  if(Math.abs(d)<1e-12){
   if(s<min||s>max)return false;
  }else{
   let t0=(min-s)/d,t1=(max-s)/d;
   if(t0>t1)[t0,t1]=[t1,t0];
   lo=Math.max(lo,t0);hi=Math.min(hi,t1);
   if(lo>hi)return false;
  }
 }
 return lo<=1&&hi>=0;
}
function segmentDistance(a,b,c,d){
 const u=vec(b,a),v=vec(d,c),w=vec(a,c),
  A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),
  E=dot(v,w),det=A*C-B*B;
 if(A<1e-13||C<1e-13)
  throw new RangeError('v09p_zero_length_bone');
 let sN=0,sD=det,tN=0,tD=det;
 if(det<1e-12){sN=0;sD=1;tN=E;tD=C}
 else{
  sN=B*E-C*D;tN=A*E-B*D;
  if(sN<0){sN=0;tN=E;tD=C}
  else if(sN>sD){sN=sD;tN=E+B;tD=C}
 }
 if(tN<0){
  tN=0;
  if(-D<0)sN=0;
  else if(-D>A)sN=sD;
  else{sN=-D;sD=A}
 }else if(tN>tD){
  tN=tD;
  if(-D+B<0)sN=0;
  else if(-D+B>A)sN=sD;
  else{sN=-D+B;sD=A}
 }
 const s=Math.abs(sN)<1e-12?0:sN/sD,
  t=Math.abs(tN)<1e-12?0:tN/tD;
 return Math.hypot(w.x+s*u.x-t*v.x,
  w.y+s*u.y-t*v.y,w.z+s*u.z-t*v.z);
}
function checkCandidate(candidate,scene,terrain,pad,samplesPerLink){
 const pts=candidate.points,radii=candidate.radiiWorldUnits;
 let minGround=Infinity,maxGround=-Infinity,
  minSelf=Infinity,minGlass=Infinity,
  worstGround=null,blocked=null,sceneSamples=0;
 const floored=pts.map(floor);
 for(let i=0;i<23;i++){
  const a=pts[i],b=pts[i+1],fa=floored[i],fb=floored[i+1];
  const radius=Math.max(radii[i],radii[i+1]);
  const paddedPx=radius*125+pad*125;
  for(const q of [fa,fb])
   minGlass=Math.min(minGlass,q.x-paddedPx,
    1000-paddedPx-q.x,q.y-paddedPx,400-paddedPx-q.y);
  if(minGlass<-.00001)blocked??='outside_source_glass';
  for(const o of scene.objects)
   if(overlapsRect(fa,fb,o,paddedPx))
    blocked??='source_object_'+o.id;
  for(let k=0;k<=samplesPerLink;k++){
   const t=k/samplesPerLink,q=mix(a,b,t);
   const ground=sampleSnakeTerrain(q.x,q.y,terrain).z;
   // V0.9N exposes variable-radius joints. For the provisional
   // centerline envelope, interpolate radius on each link instead of
   // forcing a thick neighbor's full radius onto the thin tail.
   const atRadius=radii[i]*(1-t)+radii[i+1]*t;
   const gap=q.z-atRadius-ground;
   sceneSamples++;
   if(gap<minGround){minGround=gap;
    worstGround=F({link:i,fraction:t});}
   maxGround=Math.max(maxGround,gap);
  }
 }
 for(let i=0;i<23;i++)for(let j=i+4;j<23;j++){
  const gap=segmentDistance(pts[i],pts[i+1],
   pts[j],pts[j+1])-
   Math.max(radii[i],radii[i+1])-
   Math.max(radii[j],radii[j+1]);
  minSelf=Math.min(minSelf,gap);
 }
 const links=pts.slice(1).map((q,i)=>dist(pts[i],q));
 const maxLengthError=Math.max(...links.map(
  (len,i)=>Math.abs(len-candidate.boneLengths[i])));
 const sourceSceneClear=blocked===null;
 const groundClear=minGround>=-.00001;
 const selfClear=minSelf>=-.008;
 const lengthClear=maxLengthError<=1e-7;
 return F({
  ok:sourceSceneClear&&groundClear&&selfClear&&lengthClear,
  sourceSceneClear,groundClear,selfClear,lengthClear,
  firstBlocked:blocked,minimumGroundGapWorld:minGround,
  maximumGroundGapWorld:maxGround,
  minimumNonlocal3DCapsuleGapWorld:minSelf,
  minimumGlassMarginPx:minGlass,
  maximumLinkLengthErrorWorld:maxLengthError,
  samples:sceneSamples,worstGround
 });
}
/**
 * New z follows each link's maximum local radius and source-owned
 * terrain height; horizontal projection contracts by sqrt(L^2-dz^2)
 * so the original stage-specific 3D link lengths remain exact.
 *
 * Head XY stays anchored, and the entire candidate is recalculated
 * against its updated XY after every pass. No unvalidated correction
 * may be committed. Nonconvergence is an explicit hold.
 */
export function solveSnakeSizeTerrainContactV09p({
 sourcePose,scene,terrain,stageProgress=2,
 marginWorld=.0035,maxPasses=8,samplesPerLink=8,
 maximumJointXYDriftWorld=.045
}={}){
 if(!scene||!terrain||!finite(marginWorld)||
  marginWorld<.001||marginWorld>.02||
  !Number.isInteger(maxPasses)||maxPasses<2||maxPasses>12||
  !Number.isInteger(samplesPerLink)||
  samplesPerLink<6||samplesPerLink>24||
  !finite(maximumJointXYDriftWorld)||
  maximumJointXYDriftWorld<.01||
  maximumJointXYDriftWorld>.12)
  throw new RangeError('v09p_invalid_contact_options');
 const source=inspectSnakeSelfClearanceV09d({pose:sourcePose});
 if(!source.candidateClearanceAccepted)
  throw new RangeError('v09p_untrusted_original_source');
 createSnakeTerrariumCorridorV07c(scene);
 // Validate the ORIGINAL canonical identity, then only derive a candidate.
 const growth=projectSnakeGrowthCandidateV09n({
  sourcePose,stageProgress
 });
 const original=growth.points,links=growth.boneLengths,
  radii=growth.radiiWorldUnits;
 let points=original,passes=0,reason=null,maximumXYDrift=0;
 for(let pass=0;pass<maxPasses;pass++){
  passes++;
  const required=points.map((q,i)=>
   sampleSnakeTerrain(q.x,q.y,terrain).z+
   radii[i]+marginWorld);
  // Preserve authored lifts ONLY if clearly intentional (> .025);
  // don't inherit old adult centerline height for a smaller juvenile.
  for(let i=0;i<24;i++){
   const src=sourcePose.points[i],
    canonicalTerrain=sampleSnakeTerrain(src.x,src.y,terrain).z;
   const authoredLift=src.z-.13-canonicalTerrain;
   if(authoredLift>.025)required[i]+=authoredLift;
  }
  // Sample the whole link, not only nodes. If a rounded hill rises
  // above the linearly interpolated radius envelope, conservatively
  // raise both ends just enough to clear that section. This avoids
  // the old blanket max-radius floor forcing a thin tail to hover.
  const additionalLift=new Array(24).fill(0);
  for(let i=0;i<23;i++){
   const a=points[i],b=points[i+1];
   let need=0;
   for(let k=0;k<=samplesPerLink;k++){
    const t=k/samplesPerLink,q=mix(a,b,t);
    const ground=sampleSnakeTerrain(q.x,q.y,terrain).z;
    const r=(1-t)*radii[i]+t*radii[i+1];
    const wanted=ground+r+marginWorld;
    const current=(1-t)*required[i]+t*required[i+1];
    need=Math.max(need,wanted-current);
   }
   additionalLift[i]=Math.max(additionalLift[i],need);
   additionalLift[i+1]=Math.max(additionalLift[i+1],need);
  }
  for(let i=0;i<24;i++)required[i]+=additionalLift[i];
  const candidate=[F({x:original[0].x,y:original[0].y,
   z:required[0]})];
  for(let i=0;i<23;i++){
   const dz=required[i+1]-required[i],len=links[i];
   if(Math.abs(dz)>len-.000001){
    reason='slope_exceeds_local_bone_length';break;
   }
   const a=original[i],b=original[i+1],
    dx=b.x-a.x,dy=b.y-a.y,h=Math.hypot(dx,dy);
   if(h<len*.25){
    reason='ground_footprint_direction_unreliable';break;
   }
   const xyLength=Math.sqrt(len*len-dz*dz);
   const prior=candidate[i];
   candidate.push(F({x:prior.x+dx/h*xyLength,
    y:prior.y+dy/h*xyLength,z:required[i+1]}));
  }
  if(reason)break;
  maximumXYDrift=Math.max(...candidate.map((q,i)=>
   xyDist(q,original[i])));
  if(maximumXYDrift>maximumJointXYDriftWorld){
   reason='regrrounding_exceeds_same_pose_xy_drift';break;
  }
  const maxZChange=Math.max(...candidate.map((q,i)=>
   Math.abs(q.z-points[i].z)));
  const maxXYChange=Math.max(...candidate.map((q,i)=>
   xyDist(q,points[i])));
  points=F(candidate);
  if(maxZChange<.0000003&&maxXYChange<.0000003)break;
 }
 const solved=F({...growth,points,
  floorPoints:F(points.map(q=>F(floor(q))))});
 const checked=checkCandidate(solved,scene,terrain,
  marginWorld,samplesPerLink);
 const good=reason===null&&checked.ok;
 return F({
  version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
  ok:good,
  reason:reason??(checked.firstBlocked??
   (!checked.groundClear?'terrain_penetration_after_solver':
   !checked.selfClear?'nonlocal_3d_capsule_overlap':
   !checked.lengthClear?'bone_length_changed':null)),
  stageProgress,lifeStage:growth.lifeStage,
  candidate:solved,sourceLengthWorld:growth.lengthWorldUnits,
  sourceJointCount:24,sourceLinkCount:23,
  passes,maximumXYDriftWorld:maximumXYDrift,
  unchangedSourceHeadXY:true,
  diagnostics:checked,
  candidateOnly:true,originalSourceUnmodified:true,
  originalSizeMotionControllerStillFixed:true,
  genuine3DSweptMeshCertified:false,
  biomechanicalGroundSupportCertified:false,
  gameIntegrationAuthorized:false,
  fullBodyReturnVerified:false,skinApplied:false,
  saveModified:false
 });
}
/**
 * An authenticated single V0.9C/D/G source step is a prerequisite for
 * a size-contact candidate transition. Its original source MUST be the
 * same scene/revision and relay state. Both re-grounded endpoints and
 * all interframe link/ground/scene samples must be valid.
 */
export function inspectSnakeSizeTerrainTransitionV09p({
 previousSource,nextSource,scene,terrain,stageProgress=2,
 seconds=1/30
}={}){
 if(previousSource?.version!=='0.9C'||
  nextSource?.version!=='0.9C'||
  previousSource.phase!=='moving_return'||
  nextSource.phase!=='moving_return'||
  previousSource.verifiedFrames+1!==nextSource.verifiedFrames||
  previousSource.sceneStamp!==nextSource.sceneStamp||
  previousSource.sceneRevision!==scene?.revision||
  nextSource.sceneRevision!==scene?.revision||
  previousSource.sceneId!==scene?.sceneId||
  nextSource.sceneId!==scene?.sceneId||
  !finite(seconds)||seconds<=0||seconds>.05)
  throw new RangeError('v09p_nonadjacent_or_stale_source');
 const authenticated=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:previousSource,scene,terrain,seconds
 });
 if(authenticated.phase!=='moving_return'||
  authenticated.verifiedFrames!==nextSource.verifiedFrames||
  JSON.stringify(authenticated.pose?.points)!==
   JSON.stringify(nextSource.pose?.points)||
  JSON.stringify(authenticated.relayState)!==
   JSON.stringify(nextSource.relayState))
  return F({version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
   ok:false,reason:'forged_or_rejected_real_source_step',
   checkedSourceStep:false,sourceFramesCommitted:0,
   gameIntegrationAuthorized:false,saveModified:false});
 const a=solveSnakeSizeTerrainContactV09p({
  sourcePose:previousSource.pose,scene,terrain,stageProgress
 });
 const b=solveSnakeSizeTerrainContactV09p({
  sourcePose:nextSource.pose,scene,terrain,stageProgress
 });
 if(!a.ok||!b.ok)
  return F({version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
   ok:false,reason:'regrounded_endpoint_rejected',
   from:a,to:b,checkedSourceStep:true,
   sweptStepChecked:false,sourceFramesCommitted:0,
   gameIntegrationAuthorized:false,saveModified:false});
 let sceneClear=true,groundClear=true,
  maxStep=0,minimumGap=Infinity,
  risk=null,samples=0;
 for(let i=0;i<24;i++)maxStep=Math.max(maxStep,
  dist(a.candidate.points[i],b.candidate.points[i]));
 for(let i=0;i<23;i++){
  const parts=[a.candidate.points[i],a.candidate.points[i+1],
   b.candidate.points[i],b.candidate.points[i+1]];
  const radius=Math.max(
   a.candidate.radiiWorldUnits[i],
   a.candidate.radiiWorldUnits[i+1],
   b.candidate.radiiWorldUnits[i],
   b.candidate.radiiWorldUnits[i+1]
  );
  const padding=radius*125+.0035*125;
  const xs=parts.map(q=>q.x*125+500),
   ys=parts.map(q=>q.y*125+200);
  const minX=Math.min(...xs)-padding,
   maxX=Math.max(...xs)+padding,
   minY=Math.min(...ys)-padding,
   maxY=Math.max(...ys)+padding;
  if(minX<0||maxX>1000||minY<0||maxY>400){
   sceneClear=false;risk??='interframe_glass';
  }
  for(const o of scene.objects)
   if(minX<=o.x+o.width&&maxX>=o.x&&
      minY<=o.y+o.depth&&maxY>=o.y){
    sceneClear=false;risk??='interframe_scene_'+o.id;
   }
  for(const t of [0,.25,.5,.75,1]){
   const l=mix(a.candidate.points[i],
    b.candidate.points[i],t);
   const r=mix(a.candidate.points[i+1],
    b.candidate.points[i+1],t);
   for(let k=0;k<=8;k++){
    const q=mix(l,r,k/8);
    // The provisional body envelope linearly tapers between adjacent
    // radii; a constant maximum along the whole segment would falsely
    // report ground penetration at a narrow tail section.
    const fraction=k/8;
    const localRadius=(1-fraction)*
     Math.max(a.candidate.radiiWorldUnits[i],
      b.candidate.radiiWorldUnits[i])+
     fraction*Math.max(a.candidate.radiiWorldUnits[i+1],
      b.candidate.radiiWorldUnits[i+1]);
    const gap=q.z-localRadius-
     sampleSnakeTerrain(q.x,q.y,terrain).z;
    minimumGap=Math.min(minimumGap,gap);
    samples++;
    if(gap<-.00001){
     groundClear=false;risk??='interframe_ground';
    }
   }
  }
 }
 const stepBound=maxStep<=.06;
 const ok=stepBound&&sceneClear&&groundClear;
 return F({
  version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
  ok,reason:ok?null:risk??'resized_step_too_large',
  from:a,to:b,
  sourceStartFrame:previousSource.verifiedFrames,
  sourceEndFrame:nextSource.verifiedFrames,
  checkedSourceStep:true,
  maxCandidateJointStepWorld:maxStep,
  resizedStepBoundClear:stepBound,
  interframeSceneXYClear:sceneClear,
  interframeHeightfieldClear:groundClear,
  interframeMinimumGapWorld:minimumGap,
  interframeSampleCount:samples,
  sourceFramesCommitted:0,notAuthorizedToChangeSource:true,
  dynamicMeshSweepCertified:false,
  groundSupportCertified:false,
  gameIntegrationAuthorized:false,saveModified:false,
  skinApplied:false
 });
}
/**
 * Evaluate an actual source-plan shadow; NO original game motion
 * or growth stage update is committed.
 */
export function previewSnakeSizeTerrainRouteV09p({
 source,scene,terrain,stageProgress=2,
 horizonFrames=60,seconds=1/30
}={}){
 if(source?.version!=='0.9C'||source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  !Number.isInteger(horizonFrames)||horizonFrames<30||
  horizonFrames>140||!finite(seconds)||seconds<=0||
  seconds>.05)
  throw new RangeError('v09p_invalid_preview_source');
 const planning=planSnakeHeadingReturnV09l({
  source,scene,terrain,horizonFrames,seconds
 });
 if(!planning.ok)return F({
  version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
  ok:false,reason:'no_source_safe_heading_route',
  sourceFramesCommitted:0,sourceStartFrame:source.verifiedFrames,
  testedSizeFrames:0,skinApplied:false,saveModified:false
 });
 let current=F({...source,route:planning.selectedRoute,
  returnTurnCommitted:false});
 let accepted=0,problem=null,lowest=Infinity,
  highStep=0,firstFailure=null;
 for(let i=0;i<horizonFrames;i++){
  const advanced=advanceSnakeRouteWithTurnSpaceGuardV09g({
   state:current,scene,terrain,seconds
  });
  if(advanced.phase!=='moving_return'||
   advanced.verifiedFrames!==current.verifiedFrames+1){
   problem='original_source_motion_held';break;
  }
  const test=inspectSnakeSizeTerrainTransitionV09p({
   previousSource:current,nextSource:advanced,
   scene,terrain,stageProgress,seconds
  });
  if(!test.ok){
   problem=test.reason;
   firstFailure=F({frame:advanced.verifiedFrames,
    reason:test.reason});break;
  }
  accepted++;
  lowest=Math.min(lowest,test.interframeMinimumGapWorld);
  highStep=Math.max(highStep,test.maxCandidateJointStepWorld);
  current=advanced;
 }
 return F({
  version:SNAKE_SIZE_TERRAIN_CONTACT_V09P_VERSION,
  ok:problem===null,
  reason:problem,
  stageProgress,
  selectedId:planning.selectedId,
  sourceStartFrame:source.verifiedFrames,
  sourceEndFrameCurrentShadow:current.verifiedFrames,
  testedSizeFrames:accepted,plannedHorizonFrames:horizonFrames,
  minimumInterframeGapWorld:lowest,
  maxResizedJointStepWorld:highStep,
  firstFailure,originalSourceUnmodified:true,
  sourceFramesCommitted:0,originalMovementNotReplaced:true,
  originalSizeMotionControllerStillFixed:true,
  meshSweep3DCertified:false,groundSupportCertified:false,
  fullBodyReturnVerified:false,skinApplied:false,
  saveModified:false
 });
}
