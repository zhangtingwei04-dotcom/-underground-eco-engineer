/**
 * Project OHM SNAKE V0.7F — conservative inter-frame neck continuity GATE.
 *
 * A frame from V0.7D is the safe baseline. V0.7E may produce a safe optional
 * multi-joint deformation, but its accepted/rejected decision can change
 * between frames. This adapter rate-limits desired yaw AND the actual change
 * in local per-bone deformation offsets. Every candidate is independently
 * re-solved by V0.7E with full XY, heightfield, head-mesh and fixed-length
 * guards. NEVER lerp world-space bones: naive linear blends stretch bones.
 *
 * If the current safe baseline and every safe bent candidate jump too much
 * from the previous deformation, emit no renderable pose (frame dropped /
 * blocked). Do not silently snap to a straight neck. The consumer must
 * pause/replan or explicitly reset after showing an intentional transition.
 *
 * Pure opt-in diagnostic prototype. NO animation timer, DOM, images, save
 * writes, animal behavior, 3D physics, biomechanical evidence or official
 * Phaser screen. Body/skin remains transparent in eventual visual QA.
 */
import {bendSnakeNeckChainV07e} from './snake-neck-chain-v07e.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance,sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from './snake-head-attachment.mjs';
export const SNAKE_NECK_TEMPORAL_VERSION='0.7F';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const within=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const error=msg=>{throw new RangeError(msg)};
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const zero=F({x:0,y:0,z:0});
const key=x=>typeof x==='string'&&x.length>0&&x.length<=120;
const species=['generic_snake','corn_snake','hognose_snake'];
function validPrevious(prev,scene,pose,links,speciesId){
 if(prev===null)return;
 if(!prev||prev.version!==SNAKE_NECK_TEMPORAL_VERSION||
  !key(prev.sceneId)||!Number.isSafeInteger(prev.sceneRevision)||
  !within(prev.appliedYaw,-.12,.12)||
  !species.includes(prev.speciesId)||
  !Number.isInteger(prev.boneCount)||prev.boneCount<10||
  !Number.isInteger(prev.links)||prev.links<4||prev.links>8||
  !Array.isArray(prev.localOffsets)||prev.localOffsets.length!==links+1||
  prev.localOffsets.some(p=>!p||![p.x,p.y,p.z].every(finite)||
    dist(p,zero)>pose.segmentLength*.4))
  error('invalid_previous_neck_temporal_state');
 if(prev.sceneId!==scene.sceneId||prev.speciesId!==speciesId||
  prev.boneCount!==pose.points.length||prev.links!==links)
  error('neck_temporal_context_mismatch');
 // Revision is tracked for diagnostics, NOT trusted as evidence of clearance.
 // Any new frame still recomputes the whole source-owned scene collision.
}
function stateFor(scene,pose,links,speciesId,appliedYaw,offsets){
 return F({
  version:SNAKE_NECK_TEMPORAL_VERSION,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  speciesId,boneCount:pose.points.length,links,
  appliedYaw,
  localOffsets:F(offsets.map(p=>F({...p}))),
  status:'transient_visual_debug_not_player_save'
 });
}
function headClearance(head,terrain){
 let min=Infinity;
 for(const p of head.meshPositions)
  min=Math.min(min,p.z-sampleSnakeTerrain(p.x,p.y,terrain).z);
 return min;
}
function deformation(base,out,links){
 const offsets=[];
 for(let i=0;i<=links;i++)offsets.push(F({
  x:out.points[i].x-base.points[i].x,
  y:out.points[i].y-base.points[i].y,
  z:out.points[i].z-base.points[i].z
 }));
 return F(offsets);
}
function maxOffsetChange(previousOffsets,nextOffsets){
 return Math.max(...nextOffsets.map((p,i)=>
  dist(p,previousOffsets[i])));
}
const sealed=(details)=>F({
 version:SNAKE_NECK_TEMPORAL_VERSION,
 ...details
});
/**
 * One frame, one explicit timestep. previousState belongs to a caller-
 * controlled transient render session, not the player's persisted world.
 *
 * rendered pose is null on failure: callers must not draw an unsafe fallback
 * or conceal a failed transition with a skin/texture.
 */
export function advanceSnakeNeckTemporalV07f({
 groundFrame,scene,terrain,
 previousState=null,seconds=.1,
 desiredYaw=null,maxYawRate=.4,maxJointSpeed=.1,
 links=6,speciesId='generic_snake'
}={}){
 if(!groundFrame?.ok||!groundFrame.pose||
  !groundFrame.terrainClearance?.ok||
  !groundFrame.head||!groundFrame.neck||
  !Array.isArray(groundFrame.pose.points)||
  !Number.isInteger(links)||links<4||links>8||
  links>=groundFrame.pose.points.length-2||
  !species.includes(speciesId)||
  groundFrame.head.speciesId!==speciesId||
  !within(seconds,0,1)||
  !within(maxYawRate,.05,2)||
  !within(maxJointSpeed,.001,1)||
  (desiredYaw!==null&&!within(desiredYaw,-.12,.12)))
  error('invalid_neck_temporal_frame_or_controls');
 if(!terrain)error('explicit_terrain_required');
 const base=groundFrame.pose;
 // Independently verify safety even if the caller forges groundFrame.ok.
 const xy=inspectSnakeTerrariumPoseV07c(base,scene);
 const clearance=inspectSnakeTerrainClearance(base,{
  terrain,samplesPerBone:16
 });
 if(!xy.ok||!clearance.ok)return sealed({
  renderable:false,reason:!xy.ok?'current_scene_collision':'base_terrain_failure',
  pose:null,head:null,nextState:null,
  status:'unsafe_source_never_render_old_or_new_neck'
 });
 validPrevious(previousState,scene,base,links,speciesId);
 const priorYaw=previousState?.appliedYaw??0;
 const prevOffsets=previousState?.localOffsets??
  F(Array.from({length:links+1},()=>zero));
 const targetYaw=desiredYaw??groundFrame.neck.yaw;
 if(!within(targetYaw,-.12,.12))error('unbounded_neck_target');
 const bound=maxYawRate*seconds;
 const boundedTarget=clamp(targetYaw,priorYaw-bound,priorYaw+bound);
 // In a zero-duration frame, preserving an existing bent state requires
 // exactly the same base geometry. This module deliberately cannot infer
 // such a static-world guarantee; refuse a potentially jumping redraw.
 const candidates=[];
 if(seconds>0){
  for(const fraction of [1,.75,.5,.25,0]){
   const proposed=priorYaw+(boundedTarget-priorYaw)*fraction;
   if(!candidates.some(x=>Math.abs(x-proposed)<1e-10))
    candidates.push(proposed);
  }
 }else candidates.push(priorYaw);
 // Always include the neutral baseline as a candidate, but it MUST pass
 // the SAME per-joint continuity limit, not bypass the gate on rejection.
 if(!candidates.some(x=>Math.abs(x)<1e-10))candidates.push(0);
 const headProxy=makeSnakeHeadAttachment({
  speciesId,length:base.segmentLength*(base.points.length-1)
 });
 let closest=Infinity,accepted=null,attempts=0;
 for(const proposed of candidates){
  attempts++;
  const bend=bendSnakeNeckChainV07e({
   basePose:base,scene,terrain,
   desiredYaw:proposed,links,speciesId
  });
  // The source can be safe while an attempted bend is not. A failed
  // nonzero bend is NOT interpreted as if a zero pose were desired.
  if(!bend.applied&&bend.reason!=='zero_turn')continue;
  const yaw=bend.applied?proposed*bend.acceptedFraction:0;
  const pose=bend.applied?bend.pose:base;
  if(Math.abs(yaw-priorYaw)>bound+1e-9)continue;
  const offsets=deformation(base,pose,links);
  const delta=maxOffsetChange(prevOffsets,offsets);
  closest=Math.min(closest,delta);
  if(delta>maxJointSpeed*seconds+1e-9)continue;
  const head=bend.applied?bend.head:
   poseSnakeHeadAttachment(headProxy,pose.points,{yaw:0});
  const minimum=headClearance(head,terrain);
  if(minimum<-.00001)continue;
  // A 'clear' pose is already verified by V0.7E or baseline checks; this
  // final ground guard also covers the neutral head mesh.
  accepted={pose,head,yaw,offsets,delta,minimum,
   applied:bend.applied};
  break;
 }
 if(!accepted)return sealed({
  renderable:false,reason:'neck_transition_would_jump_or_unresolved',
  pose:null,head:null,
  nextState:null,attempts,
  nearestJointDelta:finite(closest)?closest:null,
  status:'requires_pause_or_replan_no_unverified_frame_fallback'
 });
 const nextState=stateFor(scene,base,links,speciesId,
  accepted.yaw,accepted.offsets);
 return sealed({
  renderable:true,reason:null,pose:accepted.pose,head:accepted.head,
  nextState,
  desiredYaw:targetYaw,appliedYaw:accepted.yaw,
  bent:accepted.applied,
  maxRelativeJointDelta:accepted.delta,
  maximumPermittedJointDelta:maxJointSpeed*seconds,
  headMinimumClearance:accepted.minimum,
  attempts,
  sceneRevision:scene.revision,
  status:'constrained_temporal_debug_pose_not_finished_visual_or_physics'
 });
}
