/**
 * Project OHM SNAKE V0.7P — OPTIONAL upright near-glass probing lab pose.
 *
 * Authored research-motion hypothesis drawn from observed wall-side rearing.
 * Starting from a fixed support pivot, the FRONT bones are rebuilt using
 * bounded graded 3D per-link rotations; the REAR chain stays anchored.
 * Isometric rotation of each SOURCE link preserves EVERY bone length.
 * No invented glass adhesion/friction or playable vertical climbing.
 *
 * All steps check current source-owned V0.3d XY obstacles, V0.6A authored
 * ground, head-mesh vertices and temporal per-joint velocity. Fail closed:
 * unsafe or stale steps return pose:null, never the previous render pose.
 */
import {
 inspectSnakeTerrariumPoseV07c,terrariumFloorToSnakeV07c
} from './snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance,sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from './snake-head-attachment.mjs';

export const SNAKE_WALL_PROBE_VERSION='0.7P';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const range=(x,a,b)=>finite(x)&&x>=a&&x<=b;
const fail=x=>{throw new RangeError(x)};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const freezePose=p=>F({
 version:p.version??'0.7P_source_pose',
 bodyRadius:p.bodyRadius,segmentLength:p.segmentLength,
 points:F(p.points.map(q=>F({x:q.x,y:q.y,z:q.z})))
});
const ease=x=>x*x*(3-2*x);
const phases=F({rise:.9,hold:.65,lower:1.1,rest:.45});
const total=phases.rise+phases.hold+phases.lower+phases.rest;
const seal=(renderable,reason,extra)=>F({
 version:SNAKE_WALL_PROBE_VERSION,renderable,reason,
 skinApplied:false,actualWallClimbingVerified:false,
 wallFrictionVerified:false,playableCaveAuthorized:false,
 ...extra
});
const species=['generic_snake','corn_snake','hognose_snake'];
function staticChecks(pose,scene,terrain,pivotIndex,wall,maxPitch,speciesId){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<12||pose.points.length>48||
    !range(pose.bodyRadius,.02,.22)||
    !range(pose.segmentLength,.08,.35)||
    !Number.isInteger(pivotIndex)||pivotIndex<4||
    pivotIndex>Math.min(10,pose.points.length-5)||
    !['rear','front'].includes(wall)||
    !range(maxPitch,.05,.45)||
    !species.includes(speciesId)||
    !terrain||!range(terrain.groundZ,-.2,1))
  fail('invalid_wall_probe_lab_input');
 for(let i=0;i<pose.points.length;i++){
  const p=pose.points[i];
  if(!p||![p.x,p.y,p.z].every(finite))
   fail('invalid_wall_probe_bone');
  if(i>0&&Math.abs(dist(pose.points[i-1],p)-
     pose.segmentLength)>1e-5)
   fail('non_fixed_original_wall_probe_bone');
 }
 const first=pose.points[0],pivot=pose.points[pivotIndex];
 const near=wall==='rear'?-1.6:1.6;
 const gap=Math.abs(first.y-near);
 if(gap<pose.bodyRadius+.02||gap>.65||
    (wall==='rear'&&first.y>=pivot.y-.25)||
    (wall==='front'&&first.y<=pivot.y+.25))
  fail('probe_must_face_real_glass_from_interior');
 const plane=Math.hypot(first.x-pivot.x,first.y-pivot.y);
 if(plane<pose.segmentLength*2)
  fail('insufficient_front_chain_to_lift');
 const direction=F({x:(first.x-pivot.x)/plane,
  y:(first.y-pivot.y)/plane});
 if(!range(Math.abs(direction.y),.6,1))
  fail('front_chain_not_oriented_towards_glass');
 // The pivot and REAR joints stay on the authored ground. This is an
 // observed support SHAPE, not proof of reaction forces or friction.
 let support=0;
 for(let i=pivotIndex;i<pose.points.length;i++){
  const p=pose.points[i],z=sampleSnakeTerrain(p.x,p.y,terrain).z;
  if(p.z-pose.bodyRadius-z>=-.00001&&
     p.z-pose.bodyRadius-z<=.012)support++;
 }
 if(support<3)fail('insufficient_rear_ground_support');
 const base=inspectSnakeTerrariumPoseV07c(pose,scene);
 const terrainResult=inspectSnakeTerrainClearance(pose,{
  terrain,samplesPerBone:24
 });
 if(!base.ok||!terrainResult.ok)
  fail('base_probe_pose_not_source_safe');
 return direction;
}
function makePose(base,pivotIndex,forward,pitch){
 // Solve from immobile support pivot toward the head. Each SOURCE 3D
 // link rotates individually by a graded pitch, producing an anatomical
 // J-like transition rather than hinging the whole forebody as one rod.
 // Every independent vector rotation is isometric; adjacent joints
 // remain exactly one original bone length apart.
 const points=new Array(base.points.length);
 for(let i=pivotIndex;i<base.points.length;i++)
  points[i]=F({...base.points[i]});
 for(let i=pivotIndex-1;i>=0;i--){
  const a=base.points[i],b=base.points[i+1],newB=points[i+1];
  const dx=a.x-b.x,dy=a.y-b.y,dz=a.z-b.z;
  const horizontal=dx*forward.x+dy*forward.y;
  const sideX=dx-horizontal*forward.x;
  const sideY=dy-horizontal*forward.y;
  const position=(pivotIndex-i)/pivotIndex;
  const theta=pitch*Math.sqrt(position);
  const ca=Math.cos(theta),sa=Math.sin(theta);
  const rotatedH=horizontal*ca-dz*sa;
  const rotatedZ=horizontal*sa+dz*ca;
  points[i]=F({
   x:newB.x+sideX+forward.x*rotatedH,
   y:newB.y+sideY+forward.y*rotatedH,
   z:newB.z+rotatedZ
  });
 }
 return F({...base,points:F(points)});
}
function poseSafety(pose,scene,terrain,speciesId,yaw){
 const xy=inspectSnakeTerrariumPoseV07c(pose,scene);
 if(!xy.ok)return {ok:false,reason:'source_xy_blocked'};
 const terrainResult=inspectSnakeTerrainClearance(pose,{
  terrain,samplesPerBone:24
 });
 if(!terrainResult.ok)
  return {ok:false,reason:'ground_heightfield_blocked'};
 for(let i=1;i<pose.points.length;i++)
  if(Math.abs(dist(pose.points[i-1],pose.points[i])-
   pose.segmentLength)>1e-5)
   return {ok:false,reason:'bone_length_changed'};
 let head;
 try{
  const proxy=makeSnakeHeadAttachment({
   speciesId,length:pose.segmentLength*(pose.points.length-1)
  });
  head=poseSnakeHeadAttachment(proxy,pose.points,{yaw});
 }catch(e){
  if(!(e instanceof RangeError))throw e;
  return {ok:false,reason:'head_mesh_attachment_unresolved'};
 }
 // Finite head VERTEX broad-phase only: not continuous whole-head mesh
 // physics. Any vertex in an expanded V0.3d object footprint is rejected.
 const footprint=scene.objects.map(o=>{
  const a=terrariumFloorToSnakeV07c({x:o.x,y:o.y});
  const b=terrariumFloorToSnakeV07c({
   x:o.x+o.width,y:o.y+o.depth
  });
  return {minX:a.x-.005,maxX:b.x+.005,
   minY:a.y-.005,maxY:b.y+.005};
 });
 let minimum=Infinity;
 for(const p of head.meshPositions){
  // No "ghosting" the forehead through glass, soil or other source
  // rocks. Source XY obstacles remain fail-closed even above a rock.
  if(p.x<=-4||p.x>=4||p.y<=-1.6||
     p.y>=1.6||p.z>3||p.z<-.25)
   return {ok:false,reason:'head_mesh_outside_terrarium'};
  const z=sampleSnakeTerrain(p.x,p.y,terrain).z;
  minimum=Math.min(minimum,p.z-z);
  if(p.z<z-.00001)
   return {ok:false,reason:'head_mesh_ground_penetration'};
  // Head vertices must not enter ANY source-owned XY footprint.
  if(footprint.some(r=>p.x>=r.minX&&p.x<=r.maxX&&
        p.y>=r.minY&&p.y<=r.maxY))
   return {ok:false,reason:'head_mesh_source_xy_blocked'};
 }
 return {ok:true,head,minimum,contactCount:terrainResult.contactCount??null};
}
function amount(seconds){
 if(seconds<=phases.rise)
  return {phase:'rise',pitch:ease(seconds/phases.rise)};
 if(seconds<=phases.rise+phases.hold)
  return {phase:'hold',pitch:1};
 if(seconds<=phases.rise+phases.hold+phases.lower)
  return {phase:'lower',pitch:1-ease(
   (seconds-phases.rise-phases.hold)/phases.lower)};
 return {phase:'rest',pitch:0};
}
export function createSnakeWallProbeV07p({
 basePose,scene,terrain,wall='rear',
 pivotIndex=6,maxPitch=.36,
 speciesId='generic_snake'
}={}){
 const forward=staticChecks(basePose,scene,terrain,
  pivotIndex,wall,maxPitch,speciesId);
 const base=freezePose(basePose);
 const safe=poseSafety(base,scene,terrain,speciesId,0);
 if(!safe.ok)fail('wall_probe_source_head_unsafe_'+safe.reason);
 return F({
  version:SNAKE_WALL_PROBE_VERSION,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  sourceMinute:scene.minute,
  sourceObjectsJSON:JSON.stringify(scene.objects),
  wall,pivotIndex,maxPitch,speciesId,forward,
  basePose:base,pose:base,head:safe.head,
  seconds:0,phase:'rest_to_rise',pitch:0,
  sourceTerrainJSON:JSON.stringify(terrain),
  status:'optional_lab_authored_near_glass_rearing_not_physics_or_welfare'
 });
}
/**
 * Requires an existing immutable session and a source scene with unchanged
 * contents. Return NO pose after any violation; UI must not recycle old pose.
 */
export function advanceSnakeWallProbeV07p(state,{
 scene,terrain,seconds=1/30,maxJointSpeed=.75
}={}){
 if(state?.version!==SNAKE_WALL_PROBE_VERSION||
    !range(state.seconds,0,total)||!range(seconds,0,.1)||
    !range(maxJointSpeed,.1,2)||
    !state.basePose||!state.pose)
  fail('invalid_wall_probe_state');
 if(scene?.sceneId!==state.sceneId||
    scene.revision!==state.sceneRevision||
    scene.minute!==state.sourceMinute||
    JSON.stringify(scene.objects)!==state.sourceObjectsJSON||
    JSON.stringify(terrain)!==state.sourceTerrainJSON)
  return seal(false,'source_scene_or_terrain_changed',{
   pose:null,head:null,nextState:null
  });
 const forward=staticChecks(state.basePose,scene,terrain,
  state.pivotIndex,state.wall,state.maxPitch,state.speciesId);
 const newTime=Math.min(total,state.seconds+seconds);
 const stage=amount(newTime);
 const pitch=stage.pitch*state.maxPitch;
 const candidate=makePose(state.basePose,state.pivotIndex,forward,pitch);
 // Entire rear chain (support) remains exactly where it was sourced.
 for(let i=state.pivotIndex;i<candidate.points.length;i++)
  if(dist(state.basePose.points[i],candidate.points[i])>1e-12)
   return seal(false,'rear_ground_support_moved',{
    pose:null,head:null,nextState:null
   });
 const jointDelta=Math.max(...candidate.points.map((p,i)=>
  dist(p,state.pose.points[i])));
 if(jointDelta>seconds*maxJointSpeed+1e-8)
  return seal(false,'unsafe_temporal_joint_jump',{
   pose:null,head:null,nextState:null,
   attemptedMaxJointDelta:jointDelta
  });
 // Small hold-phase look blend: bounded yaw, head steering only, and no
 // invented 3D head roll / non-measured animal neck behavior.
 const yaw=stage.phase==='hold'?.03* Math.sin(
   (newTime-phases.rise)/phases.hold*Math.PI):0;
 const safety=poseSafety(candidate,scene,terrain,state.speciesId,yaw);
 if(!safety.ok)return seal(false,safety.reason,{
  pose:null,head:null,nextState:null
 });
 const nextState=F({
  ...state,pose:candidate,head:safety.head,
  seconds:newTime,phase:stage.phase,pitch
 });
 return seal(true,null,{
  pose:candidate,head:safety.head,nextState,
  phase:stage.phase,seconds:newTime,
  pitchRadians:pitch,headYawRadians:yaw,
  maxJointDelta:jointDelta,
  rearGroundSupportPreserved:true,
  sourceCollisionChecked:true,headMeshVerticesChecked:true,
  geometryOnly:true,
  status:'near_glass_probing_kinematic_lab_frame_not_validated_wall_contact'
 });
}
