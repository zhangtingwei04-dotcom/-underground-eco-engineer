/**
 * OHM public neutral V0.9M — WHOLE 24-joint goal-region occupancy QA.
 *
 * A source pose must satisfy ALL links/joints, not only head or tail.
 * Checks the 2D centerline against a conservative padded goal disk and
 * source-owned V0.3d static AABBs and validates 3D source nonlocal
 * capsules via the unchanged V0.9D gate.
 *
 * This is a diagnostic for a POTENTIAL 2D body-arrival pose. It NEVER
 * certifies 3D swept surface, ground reaction, traction, stability,
 * biological locomotion, or full-body gameplay arrival.
 *
 * Scoring accepts ONLY the V0.9L/V0.9I source-shadow-validated
 * candidates, with V0.9K source-graph connectivity and real visits.
 * Selecting a route does not move the source animal.
 */
import {createSnakeTerrariumCorridorV07c,
 snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {planSnakeHeadingReturnV09l}
 from './snake-heading-turn-v09l.mjs';

export const SNAKE_WHOLE_BODY_GOAL_V09M_VERSION='0.9M';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const isPoint=q=>q&&finite(q.x)&&finite(q.y)&&
 q.x>=0&&q.x<=1000&&q.y>=0&&q.y<=400;
const validRadius=r=>finite(r)&&r>=35&&r<=240;
const validMargin=m=>finite(m)&&m>=3&&m<=30;

function segmentIntersectsRectangle(a,b,x0,y0,x1,y1){
 // Continuous XY slab intersection, including endpoints/boundaries.
 let enter=0,exit=1;
 for(const [p,delta,min,max] of [
  [a.x,b.x-a.x,x0,x1],[a.y,b.y-a.y,y0,y1]
 ]){
  if(Math.abs(delta)<1e-12){
   if(p<min||p>max)return false;
   continue;
  }
  let t0=(min-p)/delta,t1=(max-p)/delta;
  if(t0>t1)[t0,t1]=[t1,t0];
  enter=Math.max(enter,t0);exit=Math.min(exit,t1);
  if(enter>exit)return false;
 }
 return enter<=1&&exit>=0;
}
function sceneFootprintClear(joints,scene,padding){
 for(const p of joints){
  if(p.x<padding||p.x>1000-padding||
   p.y<padding||p.y>400-padding)return false;
 }
 for(let i=0;i<joints.length-1;i++){
  const a=joints[i],b=joints[i+1];
  for(const o of scene.objects){
   if(segmentIntersectsRectangle(a,b,
    o.x-padding,o.y-padding,
    o.x+o.width+padding,o.y+o.depth+padding))
    return false;
  }
 }
 return true;
}
/**
 * The goal is an explicit 2D region, NOT a point destination that the
 * head may touch while the last ~2.28 world units of body remain outside.
 * Even all 24 joints inside is only centerline occupancy, not completion.
 */
export function inspectSnakeWholeBodyGoalV09m({
 pose,scene,goalFloor,goalRadiusPixels=160,
 bodyPaddingPixels=12
}={}){
 if(!isPoint(goalFloor)||!validRadius(goalRadiusPixels)||
  !validMargin(bodyPaddingPixels)||
  goalRadiusPixels<=bodyPaddingPixels)
  throw new RangeError('v09m_invalid_goal_region');
 // The existing source validator requires 24 authentic links, exact
 // segment lengths/taper radius and checks nonlocal 3D capsule separation.
 const self=inspectSnakeSelfClearanceV09d({pose});
 createSnakeTerrariumCorridorV07c(scene);
 const xy=F(pose.points.map(snakeFloorToTerrariumV07c));
 const distances=F(xy.map(p=>d(p,goalFloor)));
 const maxDistance=Math.max(...distances);
 const minDistance=Math.min(...distances);
 const meanDistance=distances.reduce((a,b)=>a+b,0)/24;
 const rmsDistance=Math.sqrt(
  distances.reduce((a,b)=>a+b*b,0)/24);
 const effectiveRadius=goalRadiusPixels-bodyPaddingPixels;
 const inside=distances.filter(x=>x<=effectiveRadius).length;
 // Convex disk: endpoints within a disk imply the straight links between
 // them are inside, but the 3D rendered snake's volume is NOT proved.
 const bodyCenterlineInDisk=inside===24;
 const staticSceneClear=sceneFootprintClear(
  xy,scene,bodyPaddingPixels
 );
 const capsuleClear=self.candidateClearanceAccepted;
 const eligible2DCenterline=bodyCenterlineInDisk&&
  staticSceneClear&&capsuleClear;
 return F({
  version:SNAKE_WHOLE_BODY_GOAL_V09M_VERSION,
  sourceJointCount:24,sourceLinkCount:23,
  jointInsideCount:inside,
  headInside:distances[0]<=effectiveRadius,
  tailInside:distances.at(-1)<=effectiveRadius,
  bodyCenterlineInDisk,
  headDistancePx:distances[0],
  tailDistancePx:distances.at(-1),
  maxJointDistancePx:maxDistance,
  minJointDistancePx:minDistance,
  meanJointDistancePx:meanDistance,
  rmsJointDistancePx:rmsDistance,
  effectiveGoalRadiusPx:effectiveRadius,
  staticSourceSceneXYClear:staticSceneClear,
  source3DCapsuleProxyClear:capsuleClear,
  minimumCapsuleGap:self.minimumCapsuleGap,
  // ONLY a scene/centerline candidate, never an arrived animal!
  eligible2DCenterline,
  status:eligible2DCenterline?
   'all_24_centerline_joints_in_goal_2d_candidate':
   'entire_body_not_yet_verified_at_goal',
  allBody2DCenterlineOnly:true,
  fullBodyReturnVerified:false,
  swept3DSurfaceCertified:false,
  groundSupportCertified:false,
  sourcePoseModified:false,
  saveModified:false,skinApplied:false
 });
}
/**
 * Rank only V0.9L source-approved 120/160-frame candidate shadows.
 * V0.9K graph connectivity/revisit are still required, but the
 * candidate's terminal WHOLE BODY matters more than its head alone.
 */
export function chooseSnakeWholeBodyReturnV09m({
 source,scene,basePlanV09l,
 goalRadiusPixels=160,bodyPaddingPixels=12
}={}){
 if(source?.version!=='0.9C'||
  source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  basePlanV09l?.version!=='0.9L'||
  basePlanV09l.sourceFrame!==source.verifiedFrames||
  !Array.isArray(basePlanV09l.candidates)||
  basePlanV09l.candidates.length>8||
  !validRadius(goalRadiusPixels)||!validMargin(bodyPaddingPixels))
  throw new RangeError('v09m_untrusted_source_or_trajectory');
 const sourceAudit=inspectSnakeWholeBodyGoalV09m({
  pose:source.pose,scene,goalFloor:source.startFloor,
  goalRadiusPixels,bodyPaddingPixels
 });
 const k=basePlanV09l.rankedV09k;
 const scores=F(basePlanV09l.candidates.map(c=>{
  const connected=k?.candidateScores?.find(s=>s.id===c.id);
  if(!c.accepted||!connected?.eligible||
    c.sourceLastFrame>source.verifiedFrames+180||
    c.previewTerminalPose?.points?.length!==24)
   return F({id:c.id,eligible:false,
    reason:connected?.reason??c.reason??'source_shadow_unavailable',
    score:Infinity,
    fullBodyReturnVerified:false});
  const audit=inspectSnakeWholeBodyGoalV09m({
   pose:c.previewTerminalPose,scene,goalFloor:source.startFloor,
   goalRadiusPixels,bodyPaddingPixels
  });
  const initial=sourceAudit;
  const jointProgress=initial.meanJointDistancePx-
    audit.meanJointDistancePx;
  const worstJointProgress=initial.maxJointDistancePx-
    audit.maxJointDistancePx;
  const headTailImbalance=Math.abs(
   audit.headDistancePx-audit.tailDistancePx
  );
  const entireBodyScore=
   .38*audit.meanJointDistancePx+
   .36*audit.maxJointDistancePx+
   .24*audit.rmsJointDistancePx+
   .17*headTailImbalance+
   1.8*(24-audit.jointInsideCount);
  // K's graph score provides goal reachability/real revisit
  // discipline. It is only 2D and never authorizes a new pose.
  const score=.50*connected.score+entireBodyScore;
  return F({id:c.id,eligible:true,reason:null,score,
   jointProgressPx:jointProgress,
   worstJointProgressPx:worstJointProgress,
   predictedAll24Inside:audit.bodyCenterlineInDisk,
   predicted2DGoalCandidate:audit.eligible2DCenterline,
   predictedHeadPx:audit.headDistancePx,
   predictedTailPx:audit.tailDistancePx,
   predictedMeanBodyPx:audit.meanJointDistancePx,
   predictedWorstJointPx:audit.maxJointDistancePx,
   predictedJointsInside:audit.jointInsideCount,
   headTailImbalancePx:headTailImbalance,
   source3DCapsulesChecked:audit.source3DCapsuleProxyClear,
   graphAndRevisitVerified:connected.eligible,
   fullBodyReturnVerified:false
  });
 }));
 const admissible=scores.filter(c=>c.eligible).sort(
  (a,b)=>a.score-b.score||a.id.localeCompare(b.id,'en')
 );
 const best=admissible[0]??null;
 const candidate=basePlanV09l.candidates.find(
  c=>c.id===best?.id
 );
 return F({
  version:SNAKE_WHOLE_BODY_GOAL_V09M_VERSION,
  ok:!!best,
  status:best?'all_24_joint_goal_objective_source_ranked':
   'rest_no_source_safe_whole_body_candidate',
  sourceFrame:source.verifiedFrames,
  sourceAudit,
  candidateScores:scores,
  selectedId:best?.id??null,
  selectedRoute:candidate?.proposedRoute??null,
  selectedScore:best?.score??null,
  centerline2DNotArrival:true,
  noNewSourcePoseCreated:true,
  noActualSourceFramesMoved:true,
  fullBodyReturnVerified:false,
  swept3DSurfaceCertified:false,
  skinApplied:false,saveModified:false
 });
}
export function planSnakeWholeBodyReturnV09m({
 source,scene,terrain,visitedHeadFloors=[],
 horizonFrames=120,goalRadiusPixels=160,
 bodyPaddingPixels=12,seconds=1/30
}={}){
 const base=planSnakeHeadingReturnV09l({
  source,scene,terrain,visitedHeadFloors,
  horizonFrames,seconds
 });
 // Fail-closed if source-owned V0.9L rejected stale world.
 if(base.status==='stale_scene_or_terrain'||
  base.status==='original_body_not_clear')
  return F({version:SNAKE_WHOLE_BODY_GOAL_V09M_VERSION,
   ok:false,status:base.status,
   sourceFrame:source.verifiedFrames,basePlanV09l:base,
   candidateScores:F([]),selectedId:null,selectedRoute:null,
   fullBodyReturnVerified:false,skinApplied:false,saveModified:false
  });
 const selected=chooseSnakeWholeBodyReturnV09m({
  source,scene,basePlanV09l:base,
  goalRadiusPixels,bodyPaddingPixels
 });
 return F({...selected,basePlanV09l:base,
  sourceAndSceneUnmodified:true
 });
}
