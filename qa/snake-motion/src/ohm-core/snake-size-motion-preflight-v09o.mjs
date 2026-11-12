/**
 * OHM public neutral V0.9O — dynamic, SIZE-AWARE diagnostic replay.
 *
 * The motion/scene authority REMAINS the original fixed-size V0.9C,
 * V0.9D and V0.9G 24-joint source. Each real source frame is shadow-
 * replayed, and V0.9N creates a read-only differently sized candidate.
 *
 * V0.9O checks that each candidate body:
 * - remains inside glass, outside all source V0.3d rock XY footprints;
 * - has no nonlocal 2D body-segment overlap;
 * - never penetrates the sampled ground/heightfield with its radius;
 * - has no unchecked interframe sweep through glass, source AABBs or
 *   the heightfield (swept link AABB is an over-conservative rejection).
 *
 * Crucially this is NOT a sized motion source: we do NOT pass resized
 * joints to V0.9C/D/G, because those are hardcoded for 2.28 world
 * length and .13 bodyRadius. No mesh triangle sweep, normal forces,
 * wall-climbing, biological size trajectory, growth calendar or game
 * save can be certified by this QA. All results fail closed.
 */
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {inspectSnakeTurnSpaceV09g,
 advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';
import {inspectSnakeGrowthEnvelopeV09n}
 from './snake-growth-envelope-v09n.mjs';
import {planSnakeHeadingReturnV09l}
 from './snake-heading-turn-v09l.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION='0.9O';
const F=Object.freeze,finite=n=>typeof n==='number'&&Number.isFinite(n);
const PX=125,d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const mix=(a,b,t)=>F({
 x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,
 z:a.z+(b.z-a.z)*t
});
const intersect=(lx,hx,ly,hy,o)=>lx<=o.x+o.width&&
 hx>=o.x&&ly<=o.y+o.depth&&hy>=o.y;
const invalid=why=>F({
 version:SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION,
 ok:false,reason:why,
 sizeMotionAuthorityGranted:false,meshSweep3DCertified:false,
 groundSupportCertified:false,skinApplied:false,saveModified:false
});
/**
 * An exact 24-node, size-specific body candidate is checked across each
 * link with variable radius. Negative ground gap is a hard failure.
 * A positive gap is measured, not silently "corrected" by moving bones.
 */
export function inspectSnakeSizeMotionFrameV09o({
 sourcePose,scene,terrain,stageProgress=2,
 additionalPaddingPixels=2,samplesPerLink=8
}={}){
 if(!scene||!terrain||!Number.isInteger(samplesPerLink)||
  samplesPerLink<4||samplesPerLink>24)
  throw new RangeError('v09o_untrusted_frame_options');
 const source=inspectSnakeSelfClearanceV09d({pose:sourcePose});
 const turn=inspectSnakeTurnSpaceV09g({pose:sourcePose});
 if(!source.candidateClearanceAccepted||
  turn.tightWindowCount>0)
  return invalid('canonical_24_joint_source_not_clear');
 const growth=inspectSnakeGrowthEnvelopeV09n({
  sourcePose,scene,stageProgress,additionalPaddingPixels
 });
 const pts=growth.candidate.points;
 const radii=growth.candidate.radiiWorldUnits;
 let minimum=Infinity,maxGap=-Infinity,
  samples=0,worst=null;
 for(let i=0;i<23;i++)for(let k=0;k<=samplesPerLink;k++){
  const t=k/samplesPerLink;
  const q=mix(pts[i],pts[i+1],t);
  const r=Math.max(radii[i],radii[i+1]);
  const surface=sampleSnakeTerrain(q.x,q.y,terrain);
  const gap=q.z-r-surface.z;
  samples++;
  if(gap<minimum){minimum=gap;worst=F({link:i,t});}
  maxGap=Math.max(maxGap,gap);
 }
 const penetration=minimum<-.00001;
 const ok=growth.static2DCandidateClear&&!penetration;
 return F({
  version:SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION,
  ok,reason:!growth.environment.clear?
   growth.environment.reason:
   !growth.self.clear?growth.self.reason:
   penetration?'resized_body_below_source_heightfield':null,
  stageProgress,
  sourceLinkCount:23,sourceJointCount:24,
  candidate:growth.candidate,
  environment:growth.environment,
  nonlocal2DSourceBody:growth.self,
  turnSourceV09gWindows:turn.checkedWindows,
  canonical3DSourceCapsulesAccepted:source.candidateClearanceAccepted,
  terrainSamples:samples,
  minimumTerrainGapWorld:minimum,
  maximumTerrainGapWorld:maxGap,
  terrainWorstLink:worst,
  heightfieldPenetrationDetected:penetration,
  visiblyFloatingPotential:maxGap>.045,
  motionWasActuallyApplied:false,
  originalSourceJointsChanged:false,
  sizeMotionAuthorityGranted:false,
  meshSweep3DCertified:false,
  groundSupportCertified:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * Because any actual source advancement can move the entire body, check
 * conservative cross-frame segment bounding boxes, padded by the larger
 * of the two local body radii; sample 5 temporal slices x 9 arc points.
 *
 * This can reject a legal path (not a false-positive certification).
 * Unlike instantaneous centerline tests, this catches static solid
 * traversal between two otherwise clear endpoints.
 */
export function inspectSnakeSizeMotionTransitionV09o({
 previousSource,nextSource,scene,terrain,stageProgress=2,
 additionalPaddingPixels=2
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
  nextSource.sceneId!==scene?.sceneId)
  throw new RangeError('v09o_requires_adjacent_same_scene_real_source_frames');
 const from=inspectSnakeSizeMotionFrameV09o({
  sourcePose:previousSource.pose,scene,terrain,stageProgress,
  additionalPaddingPixels
 });
 const to=inspectSnakeSizeMotionFrameV09o({
  sourcePose:nextSource.pose,scene,terrain,stageProgress,
  additionalPaddingPixels
 });
 if(!from.ok||!to.ok)return F({
  ...invalid('resized_frame_envelope_rejected'),
  sourceStartFrame:previousSource.verifiedFrames,
  sourceEndFrame:nextSource.verifiedFrames,
  fromAudit:from,toAudit:to,
  interframeChecked:false
 });
 const a=from.candidate,b=to.candidate;
 let maxJointStep=0,minGap=Infinity,
  sweptSceneClear=true,sweptGroundClear=true,
  worst=null,blockerId=null,samples=0;
 for(let i=0;i<24;i++)
  maxJointStep=Math.max(maxJointStep,
   d(a.points[i],b.points[i]));
 // The original source step is <= .012 in its historical test, but
 // size rescaling can amplify tail-step motions. .06 is a conservative
 // diagnostic ceiling, NOT animal mechanics/velocity authorisation.
 const stepBoundClear=maxJointStep<=.06;
 for(let i=0;i<23;i++){
  const corners=[a.points[i],a.points[i+1],
   b.points[i],b.points[i+1]];
  const radiusWorld=Math.max(
   a.radiiWorldUnits[i],a.radiiWorldUnits[i+1],
   b.radiiWorldUnits[i],b.radiiWorldUnits[i+1]
  );
  const pad=(radiusWorld*PX+additionalPaddingPixels);
  const minX=Math.min(...corners.map(p=>p.x*PX+500))-pad;
  const maxX=Math.max(...corners.map(p=>p.x*PX+500))+pad;
  const minY=Math.min(...corners.map(p=>p.y*PX+200))-pad;
  const maxY=Math.max(...corners.map(p=>p.y*PX+200))+pad;
  if(minX<0||maxX>1000||minY<0||maxY>400){
   sweptSceneClear=false;worst??=F({link:i,type:'glass'});
  }
  const rock=scene.objects.find(o=>intersect(
   minX,maxX,minY,maxY,o
  ));
  if(rock){
   sweptSceneClear=false;blockerId=rock.id;
   worst??=F({link:i,type:'source_obstacle',id:rock.id});
  }
  for(const t of [0,.25,.5,.75,1]){
   const u=mix(a.points[i],b.points[i],t);
   const v=mix(a.points[i+1],b.points[i+1],t);
   for(let k=0;k<=8;k++){
    const q=mix(u,v,k/8);
    const gap=q.z-radiusWorld-
     sampleSnakeTerrain(q.x,q.y,terrain).z;
    minGap=Math.min(minGap,gap);samples++;
    if(gap<-.00001){
     sweptGroundClear=false;
     worst??=F({link:i,type:'heightfield',time:t});
    }
   }
  }
 }
 const ok=stepBoundClear&&sweptSceneClear&&sweptGroundClear;
 return F({
  version:SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION,
  ok,
  reason:!stepBoundClear?'oversized_interframe_joint_step':
   !sweptSceneClear?'interframe_scene_sweep_risk':
   !sweptGroundClear?'interframe_heightfield_penetration':null,
  sourceStartFrame:previousSource.verifiedFrames,
  sourceEndFrame:nextSource.verifiedFrames,
  stageProgress,
  fromAudit:from,toAudit:to,
  maximumResizedJointStepWorld:maxJointStep,
  resizedStepBoundDiagnostic:.06,
  sweptSourceScene2DAabbClear:sweptSceneClear,
  sweptGroundHeightfieldSamplesClear:sweptGroundClear,
  sweptGroundMinimumGapWorld:minGap,
  sweptSamples:samples,worstRisk:worst,
  sourceBlockerId:blockerId,
  interframeChecked:true,
  originalSourceJointsChanged:false,
  sourceSizeWasAppliedToMotion:false,
  sizeMotionAuthorityGranted:false,
  meshSweep3DCertified:false,
  groundSupportCertified:false,
  skinApplied:false,saveModified:false
 });
}
/** Replay one V0.9L source-approved route, in ORIGINAL geometry only. */
export function previewSnakeSizeAwareRouteV09o({
 source,scene,terrain,stageProgress=2,horizonFrames=90,
 seconds=1/30,additionalPaddingPixels=2
}={}){
 if(source?.version!=='0.9C'||source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  !Number.isInteger(horizonFrames)||horizonFrames<30||
  horizonFrames>160||!finite(seconds)||seconds<=0||
  seconds>.05)
  throw new RangeError('v09o_invalid_shadow_horizon_or_source');
 const plan=planSnakeHeadingReturnV09l({
  source,scene,terrain,horizonFrames,seconds
 });
 if(!plan.ok)return F({
  version:SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION,
  ok:false,status:'rest_no_source_safe_heading_route',
  reason:plan.status,chosenId:null,
  checkedSourceFrames:0,sourceStartFrame:source.verifiedFrames,
  fullBodyReturnVerified:false,
  sourceFramesCommitted:0,skinApplied:false,saveModified:false
 });
 let cursor=F({...source,route:plan.selectedRoute,
  returnTurnCommitted:false});
 let safe=0,lowestGroundGap=Infinity,
  highestBodyMotion=0,last=null,reason=null;
 const initial=inspectSnakeSizeMotionFrameV09o({
  sourcePose:cursor.pose,scene,terrain,stageProgress,
  additionalPaddingPixels
 });
 if(!initial.ok)reason=initial.reason;
 for(let k=0;k<horizonFrames&&!reason;k++){
  const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
   state:cursor,scene,terrain,seconds
  });
  if(next.phase!=='moving_return'||
   next.verifiedFrames!==cursor.verifiedFrames+1){
   reason='original_v09c_v09d_v09g_source_step_rejected';break;
  }
  const frame=inspectSnakeSizeMotionTransitionV09o({
   previousSource:cursor,nextSource:next,
   scene,terrain,stageProgress,additionalPaddingPixels
  });
  last=frame;
  if(!frame.ok){reason=frame.reason;break;}
  safe++;
  lowestGroundGap=Math.min(lowestGroundGap,
   frame.sweptGroundMinimumGapWorld);
  highestBodyMotion=Math.max(highestBodyMotion,
   frame.maximumResizedJointStepWorld);
  cursor=next;
 }
 return F({
  version:SNAKE_SIZE_MOTION_PREFLIGHT_V09O_VERSION,
  ok:reason===null,status:reason===null?
   'all_source_shadow_steps_passed_size_envelope':
   'rest_resize_not_source_authorized',
  reason,
  chosenId:plan.selectedId,
  attemptedSourceFrames:horizonFrames,
  checkedSourceFrames:safe,
  sourceStartFrame:source.verifiedFrames,
  sourcePreviewEndFrame:cursor.verifiedFrames,
  stageProgress,
  minimumGroundGapWorld:lowestGroundGap,
  maximumResizedJointStepWorld:highestBodyMotion,
  firstFailure:last?.ok===false?F({
   sourceFrame:last.sourceEndFrame,
   cause:last.reason,worstRisk:last.worstRisk
  }):null,
  stageWouldFitAtInitialPose:initial.ok,
  sourceFramesCommitted:0,
  currentGameSourcePoseChanged:false,
  trueSizeAwareMovementImplemented:false,
  fullBodyReturnVerified:false,
  swept3DMeshCollisionCertified:false,
  groundSupportCertified:false,
  skinApplied:false,saveModified:false
 });
}
