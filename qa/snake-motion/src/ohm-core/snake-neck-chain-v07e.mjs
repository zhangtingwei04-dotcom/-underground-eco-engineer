/**
 * Project OHM SNAKE V0.7E — constrained multi-joint neck engineering prototype.
 *
 * Deliberately opt-in. V0.7D creates the base fixed-length ground pose and
 * verifies scene XY / heightfield. This module tries to spread a SMALL extra
 * bend over the first 5-8 spine links, pinning head and rear-neck boundaries.
 *
 * Every changed XYZ bone must retain original Euclidean length and be clear
 * of the authoritative V0.3d object footprints plus the explicitly supplied
 * V0.6A smooth heightfield. If constraints fail, use the exact original pose,
 * never a stretched, floating or penetrating approximation.
 *
 * Not anatomical vertebrae, real IK, friction, muscle, terrain navigation,
 * final render, skin/UV, self collision or species-validated head anatomy.
 * The 2D obstacle proxy is still conservative (V0.7C).
 */
import {sampleSnakeTerrain,inspectSnakeTerrainClearance}
 from './snake-terrain-contact.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from './snake-head-attachment.mjs';

export const SNAKE_NECK_CHAIN_VERSION='0.7E';
const F=Object.freeze;
const fin=x=>typeof x==='number'&&Number.isFinite(x);
const between=(x,a,b)=>fin(x)&&x>=a&&x<=b;
const fail=s=>{throw new RangeError(s)};
const v=(p)=>({x:p.x,y:p.y,z:p.z});
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const fixed=p=>F({x:p.x,y:p.y,z:p.z});
function validBase(pose){
 if(!pose||!Array.isArray(pose.points)||pose.points.length<10||
  pose.points.length>64||
  !between(pose.bodyRadius,.001,.5)||
  !between(pose.segmentLength,.001,1)||
  pose.points.some(p=>!p||![p.x,p.y,p.z].every(fin)))
  fail('invalid_neck_chain_pose');
 for(let i=1;i<pose.points.length;i++){
  if(Math.abs(distance(pose.points[i],pose.points[i-1])-
    pose.segmentLength)>1e-5)
   fail('neck_chain_input_not_fixed_length');
 }
}
const signature=(pose,reason,rest={})=>F({
 version:SNAKE_NECK_CHAIN_VERSION,applied:false,reason,
 pose,head:null,neckAngles:F([]),
 ...rest,
 status:'original_pose_preserved_no_unverified_deformation'
});
/**
 * Two-sided anchored position projection. First and last joints are fixed.
 * The intermediate targets receive a small lateral bias tapering smoothly
 * from the head to the rear-neck anchor. Constraint iterations restore
 * Euclidean lengths and enforce heightfield clearance; no teleport allowed.
 */
function tryDeform(base,terrain,{radians,links,iterations,margin}){
 const ds=base.segmentLength,points=base.points;
 const root=points[0],next=points[1];
 const dx=root.x-next.x,dy=root.y-next.y;
 const horizontal=Math.hypot(dx,dy);
 if(horizontal<1e-7)return null;
 const normal={x:-dy/horizontal,y:dx/horizontal};
 const a=Array.from({length:links+1},(_,i)=>v(points[i]));
 const target=a.map((pt,i)=>{
  if(i===0||i===links)return pt;
  // Larger near the front, zero at both pinning anchors, with bounded
  // per-joint delta. Distinct inner joints receive different weights.
  const u=i/links;
  const displacement=ds*radians*1.5*Math.sin(Math.PI*u)*(1-u);
  const x=pt.x+normal.x*displacement;
  const y=pt.y+normal.y*displacement;
  const surface=sampleSnakeTerrain(x,y,terrain).z+base.bodyRadius+margin;
  return {x,y,z:Math.max(pt.z,surface)};
 });
 const pinned=i=>i===0||i===links;
 // Sequential constraints are solved in alternating sweep directions,
 // rather than hiding a broken segment by rescaling its mesh.
 const solveEdge=i=>{
  const j=i+1,l=distance(a[i],a[j]);
  if(l<1e-10)return false;
  const error=l-ds;
  const dx=(a[j].x-a[i].x)*error/l;
  const dy=(a[j].y-a[i].y)*error/l;
  const dz=(a[j].z-a[i].z)*error/l;
  const wi=pinned(i)?0:1,wj=pinned(j)?0:1;
  const total=wi+wj;
  if(total===0)return true;
  if(wi){
   a[i].x+=dx*wi/total;a[i].y+=dy*wi/total;a[i].z+=dz*wi/total;
  }
  if(wj){
   a[j].x-=dx*wj/total;a[j].y-=dy*wj/total;a[j].z-=dz*wj/total;
  }
  return true;
 };
 for(let k=0;k<iterations;k++){
  // A short shaping phase introduces a gentle bend. The remaining
  // iterations settle ONLY hard length and ground constraints; continuing
  // target springs forever would leave every segment permanently stretched.
  if(k<Math.floor(iterations*.25)){
   for(let i=1;i<links;i++){
    const strength=.08;
    a[i].x+=(target[i].x-a[i].x)*strength;
    a[i].y+=(target[i].y-a[i].y)*strength;
    a[i].z+=(target[i].z-a[i].z)*strength;
   }
  }
  if(k%2===0){
   for(let i=0;i<links;i++)if(!solveEdge(i))return null;
   for(let i=links-1;i>=0;i--)if(!solveEdge(i))return null;
  }else{
   for(let i=links-1;i>=0;i--)if(!solveEdge(i))return null;
   for(let i=0;i<links;i++)if(!solveEdge(i))return null;
  }
  for(let i=1;i<links;i++){
   const surface=sampleSnakeTerrain(a[i].x,a[i].y,terrain).z+
    base.bodyRadius+margin;
   if(a[i].z<surface)a[i].z=surface;
  }
 }
 let worst=0,maxMove=0;
 for(let i=0;i<links;i++){
  worst=Math.max(worst,Math.abs(distance(a[i],a[i+1])-ds));
  maxMove=Math.max(maxMove,distance(a[i],points[i]));
 }
 if(worst>1e-6||maxMove>ds*.38)return null;
 const output=points.map((p,i)=>fixed(i<=links?a[i]:p));
 return F({
  ...base,points:F(output),
  // V0.7D's original contacts refer to the UNMODIFIED centerline.
  // Do not invent new physical support/contact facts.
  contacts:F([]),
  version:SNAKE_NECK_CHAIN_VERSION,
  neckStatus:'constrained_local_kinematic_bend_no_real_ik'
 });
}
function angles(points,links){
 const arr=[];
 for(let i=1;i<links;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const ux=a.x-b.x,uy=a.y-b.y;
  const vx=b.x-c.x,vy=b.y-c.y;
  arr.push(F({
   index:i,
   radians:Math.atan2(ux*vy-uy*vx,ux*vx+uy*vy)
  }));
 }
 return F(arr);
}
/**
 * Required caller inputs come from the existing, independently checked
 * V0.7D pipeline, but we RE-CHECK the result after changing the neck.
 *
 * The head mesh is reattached at the deformed spine's natural tangent
 * (yaw = 0), not given an extra uncorrected relative yaw.
 */
export function bendSnakeNeckChainV07e({
 basePose,scene,terrain,
 desiredYaw=0,links=6,iterations=320,
 margin=.0035,speciesId='generic_snake'
}={}){
 validBase(basePose);
 if(!between(desiredYaw,-.12,.12)||
  !Number.isInteger(links)||links<4||links>8||
  links>=basePose.points.length-2||
  !Number.isInteger(iterations)||iterations<60||iterations>400||
  !between(margin,0,.05)||
  !['generic_snake','corn_snake','hognose_snake'].includes(speciesId))
  fail('invalid_neck_chain_options');
 if(!terrain)fail('explicit_neck_heightfield_required');
 // Keep all existing ground contacts when no bend is desired.
 const collision=inspectSnakeTerrariumPoseV07c(basePose,scene);
 if(!collision.ok)return signature(basePose,'source_pose_collides');
 const preflight=inspectSnakeTerrainClearance(basePose,{
  terrain,samplesPerBone:16
 });
 if(!preflight.ok)return signature(basePose,'source_ground_clearance_failed');
 if(Math.abs(desiredYaw)<1e-7)return signature(basePose,'zero_turn');
 const attachment=makeSnakeHeadAttachment({
  speciesId,length:basePose.segmentLength*(basePose.points.length-1)
 });
 const orig=poseSnakeHeadAttachment(attachment,basePose.points,{yaw:0});
 // If a full requested bend cannot satisfy the hard constraints, reduce
 // amplitude. No permissive fallback that stretches/collides.
 for(const fraction of [1,.6,.35,.18,.09]){
  const applied=tryDeform(basePose,terrain,{
   radians:desiredYaw*fraction,links,iterations,margin
  });
  if(!applied)continue;
  const displacement=applied.points.reduce((max,p,i)=>
    Math.max(max,distance(p,basePose.points[i])),0);
  if(displacement<1e-6)continue;
  const xy=inspectSnakeTerrariumPoseV07c(applied,scene);
  if(!xy.ok)continue;
  const surface=inspectSnakeTerrainClearance(applied,{
   terrain,samplesPerBone:16
  });
  if(!surface.ok)continue;
  const head=poseSnakeHeadAttachment(attachment,applied.points,{yaw:0});
  let minimum=Infinity;
  for(const p of head.meshPositions){
   const at=sampleSnakeTerrain(p.x,p.y,terrain).z;
   minimum=Math.min(minimum,p.z-at);
  }
  if(minimum<-.00001)continue;
  const change=Math.acos(Math.max(-1,Math.min(1,
    orig.frame.forward.x*head.frame.forward.x+
    orig.frame.forward.y*head.frame.forward.y+
    orig.frame.forward.z*head.frame.forward.z
  )));
  return F({
   version:SNAKE_NECK_CHAIN_VERSION,applied:true,reason:null,
   pose:applied,head,neckAngles:angles(applied.points,links),
   requestedYaw:desiredYaw,
   acceptedFraction:fraction,
   measuredHeadDirectionChangeRadians:change,
   maxControlPointShift:displacement,
   headMinimumClearance:minimum,
   geometryAuthority:'V0.7C_XY_and_explicit_V0.6A_heightfield',
   status:'constrained_multi_joint_neck_debug_no_true_muscle_ik_or_skin'
  });
 }
 return signature(basePose,'neck_constraints_unresolved');
}
