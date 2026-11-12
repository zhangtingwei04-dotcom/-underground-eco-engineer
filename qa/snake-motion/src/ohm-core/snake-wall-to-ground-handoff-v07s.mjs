/**
 * Project OHM SNAKE V0.7S — source-guarded ground handoff from V0.7P.
 *
 * One animal cannot teleport from 13 x .19 to the old UNRELATED
 * 24-joint/2.5-length trail. Re-segment an ALREADY FULLY LOWERED 13-joint
 * 3D animal into 24 fixed-length representation nodes with the SAME total
 * centerline length (2.28 in the authored lab). This is a display/kinematic
 * representation transfer, not new animal growth, 3D soft-body physics or
 * automatic player path navigation.
 *
 * A narrow, explicitly authored ground-glide probe can advance AFTER this
 * handoff. Each frame must pass the unmodified V0.3d source footprint XY
 * blockers, V0.6A ground, and the canonical full head collider V0.1.
 * Any failure returns pose:null and nextState:null, not a ghost frame.
 */
import {inspectSnakeTerrariumPoseV07c,terrariumFloorToSnakeV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance,sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from './snake-head-attachment.mjs';

export const SNAKE_GROUND_HANDOFF_VERSION='0.7S';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const inRange=(x,a,b)=>finite(x)&&x>=a&&x<=b;
const fail=x=>{throw new RangeError(x)};
const V=(x,y,z)=>F({x,y,z});
const d=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
const sub=(p,q)=>V(p.x-q.x,p.y-q.y,p.z-q.z);
const add=(p,q)=>V(p.x+q.x,p.y+q.y,p.z+q.z);
const mul=(p,s)=>V(p.x*s,p.y*s,p.z*s);
const between=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const result=(ok,reason,values={})=>F({
 version:SNAKE_GROUND_HANDOFF_VERSION,ok,reason,
 pose:null,head:null,nextState:null,
 sourceBodyModified:false,sourceHeadModified:false,
 physicsVerified:false,glassFrictionVerified:false,
 bodySurfaceCollisionVerified:false,realSubstrateBurrowingVerified:false,
 playableCaveAuthorized:false,skinApplied:false,
 ...values
});
const maxAbs=(pts,a)=>Math.max(...pts.map(p=>p[a]));
const closestToSegment=(p,a,b)=>{
 const delta=sub(b,a),ab2=d(a,b)**2;
 const t=Math.max(0,Math.min(1,(
  (p.x-a.x)*delta.x+(p.y-a.y)*delta.y+(p.z-a.z)*delta.z
 )/ab2));
 return d(p,between(a,b,t));
};
function shapeDistance(source,next){
 const shortest=(p,curve)=>Math.min(...curve.slice(1).map(
  (q,i)=>closestToSegment(p,curve[i],q)
 ));
 const s=Math.max(...source.map(p=>shortest(p,next)));
 const t=Math.max(...next.map(p=>shortest(p,source)));
 return Math.max(s,t);
}
function evaluateAtArc(source,arc,ds){
 if(arc<=0)return add(source[0],mul(sub(source[1],source[0]),arc/ds));
 const n=source.length;
 if(arc>=(n-1)*ds)
  return add(source[n-1],mul(sub(source[n-1],source[n-2]),
   (arc-(n-1)*ds)/ds));
 const i=Math.min(n-2,Math.floor(arc/ds));
 return between(source[i],source[i+1],(arc-i*ds)/ds);
}
function resample(source,ds,targetCount){
 const length=(source.length-1)*ds;
 const newDs=length/(targetCount-1);
 const selected=[V(source[0].x,source[0].y,source[0].z)];
 const arcs=[0];
 for(let i=1;i<targetCount;i++){
  const prev=selected.at(-1);
  let lo=arcs.at(-1),hi=lo,found=false;
  const increment=newDs/12;
  // Some additional arc distance is required at every corner because
  // Euclidean chord length <= polyline arc length. Never hide a large
  // extension beyond the original snake tail.
  for(let k=0;k<72;k++){
   hi=lo+increment;
   if(d(evaluateAtArc(source,hi,ds),prev)>=newDs){
    found=true;break;
   }
   lo=hi;
  }
  if(!found)fail('v07s_arc_resampling_nonconvergent');
  for(let j=0;j<46;j++){
   const mid=(lo+hi)/2;
   if(d(evaluateAtArc(source,mid,ds),prev)>=newDs)hi=mid;
   else lo=mid;
  }
  const arc=(lo+hi)/2;
  arcs.push(arc);
  const p=evaluateAtArc(source,arc,ds);
  selected.push(V(p.x,p.y,p.z));
 }
 const tailError=d(selected.at(-1),source.at(-1));
 const centerlineError=shapeDistance(source,selected);
 if(tailError>.015||centerlineError>.025||
    arcs.at(-1)>length+.015)
  fail('v07s_resampling_cannot_preserve_tail_and_curve');
 for(let i=1;i<selected.length;i++)
  if(Math.abs(d(selected[i],selected[i-1])-newDs)>1e-7)
   fail('v07s_bones_lost_fixed_length');
 return F({
  points:F(selected),segmentLength:newDs,sourceTotalLength:length,
  tailError,centerlineError,arcs:F(arcs)
 });
}
const sameScene=(state,scene,terrain)=>
 scene?.sceneId===state.sceneId&&
 scene.revision===state.sceneRevision&&
 scene.minute===state.sourceMinute&&
 JSON.stringify(scene.objects)===state.sourceObjectsJSON&&
 JSON.stringify(terrain)===state.sourceTerrainJSON;
function checkPose(pose,scene,terrain,speciesId){
 const xy=inspectSnakeTerrariumPoseV07c(pose,scene);
 if(!xy.ok)return {ok:false,why:'source_xy_footprint_blocked'};
 const surface=inspectSnakeTerrainClearance(pose,{
  terrain,samplesPerBone:24
 });
 if(!surface.ok)return {ok:false,why:'source_ground_clearance_blocked'};
 const contactIndices=[];
 for(let i=0;i<pose.points.length;i++){
  const p=pose.points[i],ground=sampleSnakeTerrain(
   p.x,p.y,terrain).z;
  if(p.z-pose.bodyRadius-ground<-.00001)
   return {ok:false,why:'source_ground_penetration'};
  if(p.z-pose.bodyRadius-ground<=.012)contactIndices.push(i);
 }
 if(contactIndices.length<Math.floor(pose.points.length*.8))
  return {ok:false,why:'ground_contact_not_restored'};
 let head;
 try{
  head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
   speciesId,length:pose.segmentLength*(pose.points.length-1)
  }),pose.points);
 }catch(error){
  if(!(error instanceof RangeError))throw error;
  return {ok:false,why:'source_head_collider_unresolved'};
 }
 const obstacles=scene.objects.map(o=>{
  const a=terrariumFloorToSnakeV07c({x:o.x,y:o.y});
  const b=terrariumFloorToSnakeV07c({
   x:o.x+o.width,y:o.y+o.depth
  });
  return F({x0:a.x-.005,x1:b.x+.005,y0:a.y-.005,y1:b.y+.005});
 });
 for(const p of head.meshPositions){
  if(p.x<=-4||p.x>=4||p.y<=-1.6||p.y>=1.6||
     p.z<-.25||p.z>3)
   return {ok:false,why:'head_collides_with_glass_or_ceiling'};
  if(p.z<sampleSnakeTerrain(p.x,p.y,terrain).z-.00001)
   return {ok:false,why:'head_collides_with_ground'};
  if(obstacles.some(o=>p.x>=o.x0&&p.x<=o.x1&&
      p.y>=o.y0&&p.y<=o.y1))
   return {ok:false,why:'head_collides_with_source_rock'};
 }
 return {ok:true,head,contactIndices:F(contactIndices)};
}
export function prepareSnakeGroundHandoffV07s({
 wallState,scene,terrain,targetJointCount=24,
 departure={x:.1,y:.025},speciesId='generic_snake'
}={}){
 if(wallState?.version!=='0.7P'||
    wallState.phase!=='rest'||wallState.seconds<3.1-1e-8||
    Math.abs(wallState.pitch)>1e-8||
    !Array.isArray(wallState.pose?.points)||
    wallState.pose.points.length!==13||
    !Number.isInteger(targetJointCount)||targetJointCount!==24||
    !['generic_snake','corn_snake','hognose_snake'].includes(speciesId)||
    !inRange(departure?.x,-.5,.5)||
    !inRange(departure?.y,-.5,.5)||
    Math.hypot(departure.x,departure.y)<.01||
    Math.hypot(departure.x,departure.y)>.5)
  fail('v07s_requires_fully_resting_v07p_source_and_authored_departure');
 if(!sameScene(wallState,scene,terrain))
  return result(false,'source_scene_or_terrain_changed');
 const source=wallState.pose;
 const base=wallState.basePose;
 if(source.points.some((p,i)=>d(p,base.points[i])>1e-8))
  return result(false,'source_probe_not_exactly_restored');
 const old=checkPose(source,scene,terrain,speciesId);
 if(!old.ok)return result(false,old.why);
 let shape;
 try{shape=resample(source.points,source.segmentLength,targetJointCount)}
 catch(error){
  if(!(error instanceof RangeError))throw error;
  return result(false,error.message);
 }
 const pose=F({
  version:SNAKE_GROUND_HANDOFF_VERSION,
  bodyRadius:source.bodyRadius,length:shape.sourceTotalLength,
  boneCount:targetJointCount,segmentLength:shape.segmentLength,
  points:shape.points,mode:'resampled_ground_same_animal'
 });
 const safety=checkPose(pose,scene,terrain,speciesId);
 if(!safety.ok)return result(false,safety.why);
 const state=F({
  version:SNAKE_GROUND_HANDOFF_VERSION,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  sourceMinute:scene.minute,
  sourceObjectsJSON:JSON.stringify(scene.objects),
  sourceTerrainJSON:JSON.stringify(terrain),
  targetJointCount,sourceJointCount:source.points.length,
  initialPose:pose,pose,head:safety.head,speciesId,
  departure:F({x:departure.x,y:departure.y}),
  seconds:0,frames:0,
  sourceTotalLength:shape.sourceTotalLength,
  tailError:shape.tailError,
  centerlineError:shape.centerlineError,
  sourceHead:F({...source.points[0]}),
  sourceTail:F({...source.points.at(-1)}),
  contactIndices:safety.contactIndices,
  status:'rested_wall_probe_resampled_to_same_length_ground_rig'
 });
 return result(true,null,{
  pose,head:safety.head,nextState:state,
  resampledJointCount:targetJointCount,
  sourceJointCount:source.points.length,
  totalLength:shape.sourceTotalLength,
  resampleCurveError:shape.centerlineError,
  tailOffset:shape.tailError,
  headOffset:d(pose.points[0],source.points[0]),
  groundContactIndices:safety.contactIndices,
  sourceCollisionChecked:true,headVerticesChecked:true,
  handoffPermittedForExplicitLab:true,
  gameTravelRouteAuthorized:false,
  status:'same_animal_3d_resegmentation_at_rest_not_original_2_5_route'
 });
}
export function advanceSnakeGroundHandoffV07s(state,{
 scene,terrain,seconds=1/30,maxJointSpeed=.35
}={}){
 if(state?.version!==SNAKE_GROUND_HANDOFF_VERSION||
    !inRange(seconds,0,.1)||!inRange(maxJointSpeed,.05,1)||
    !Array.isArray(state.pose?.points)||state.pose.points.length!==24)
  fail('v07s_invalid_ground_handoff_state_or_step');
 if(!sameScene(state,scene,terrain))
  return result(false,'source_scene_or_terrain_changed');
 const prior=state.pose;
 // Art-only "edge glide": authored slight inwards direction from the
 // near-glass corner. Not wall friction or animal navigation.
 const direction=state.departure;
 const head=add(prior.points[0],V(
  direction.x*seconds,direction.y*seconds,0
 ));
 const next=[head];
 for(let i=1;i<prior.points.length;i++){
  const old=prior.points[i];
  const delta=sub(old,next[i-1]);
  const len=d(old,next[i-1]);
  if(len<1e-7)
   return result(false,'v07s_follower_normalization_failed');
  next.push(add(next[i-1],mul(delta,prior.segmentLength/len)));
 }
 const candidate=F({...prior,points:F(next)});
 const maxDelta=maxAbs(candidate.points.map((p,i)=>F({
  movement:d(p,prior.points[i])
 })),'movement');
 if(maxDelta>maxJointSpeed*seconds+1e-8)
  return result(false,'v07s_unbounded_joint_speed',{
   attemptedMaxDelta:maxDelta
  });
 const validation=checkPose(candidate,scene,terrain,state.speciesId);
 if(!validation.ok)return result(false,validation.why);
 for(let i=1;i<candidate.points.length;i++)
  if(Math.abs(d(candidate.points[i],candidate.points[i-1])-
    candidate.segmentLength)>1e-7)
   return result(false,'v07s_fixed_bone_length_broken');
 const after=F({
  ...state,pose:candidate,head:validation.head,
  seconds:state.seconds+seconds,frames:state.frames+1,
  contactIndices:validation.contactIndices
 });
 return result(true,null,{
  pose:candidate,head:validation.head,nextState:after,
  frame:after.frames,seconds:after.seconds,
  maxJointDelta:maxDelta,
  sourceCollisionChecked:true,headVerticesChecked:true,
  contactIndices:validation.contactIndices,
  handoffPermittedForExplicitLab:true,
  gameTravelRouteAuthorized:false,
  status:'fixed_length_near_glass_ground_glide_art_probe_not_3d_physics'
 });
}
