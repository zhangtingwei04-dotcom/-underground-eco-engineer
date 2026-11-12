/**
 * Project OHM SNAKE V0.7D — terrain + conservative head/neck continuity gate.
 *
 * Composition only: V0.7A owns trail pose; V0.7C owns scene XY obstacles;
 * V0.6A owns smooth heightfield kinematic contact; existing species head
 * attachment owns the mesh. All calculations are pure and read-only.
 *
 * A raised hill here is EXPLICIT ART-ONLY terrain. The V0.3d objects still
 * block the entire XY footprint; this module NEVER assumes they are ramps,
 * caves, or passable overhead cover. It rejects uncertain penetrations and
 * excessive head turns instead of claiming biomechanics, neck IK or friction.
 * No rendering, player save, timestamps, random or cloud operations.
 */
import {sampleSnakeTravelPoseV07}
 from './snake-path-history-v07.mjs';
import {
 conformSnakePoseToTerrain,inspectSnakeTerrainClearance,sampleSnakeTerrain
} from './snake-terrain-contact.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from './snake-head-attachment.mjs';

export const SNAKE_TERRAIN_NECK_VERSION='0.7D';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const range=(x,a,b)=>finite(x)&&x>=a&&x<=b;
const fail=x=>{throw new RangeError(x)};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const vec=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const norm=v=>Math.hypot(v.x,v.y,v.z);
const unit=v=>{
 const d=norm(v);
 if(d<1e-10)fail('degenerate_head_neck_vector');
 return {x:v.x/d,y:v.y/d,z:v.z/d};
};
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross2=(a,b)=>a.x*b.y-a.y*b.x;
// Signed planar curvature uses a 2D dot; the 3D dot would produce NaN
// from a missing z component and could corrupt a head pose silently.
const signedTurn=(a,b)=>Math.atan2(cross2(a,b),a.x*b.x+a.y*b.y);
const args=(opt)=>{
 if(!opt||!range(opt.length,.3,5)||
   !Number.isInteger(opt.boneCount)||opt.boneCount<8||
   opt.boneCount>64||
   !range(opt.bodyRadius,.001,Math.min(.5,opt.length*.129)))
  fail('invalid_v07d_body');
 return F({
  length:opt.length,boneCount:opt.boneCount,
  bodyRadius:opt.bodyRadius
 });
};
const result=(status,kind,details={})=>F({
 version:SNAKE_TERRAIN_NECK_VERSION,
 ok:kind==='clear',status,reason:kind==='clear'?null:kind,
 ...details
});
/** Stable orientation derived from fixed 3D bone segments, not screen pixels. */
export function inspectSnakeNeckContinuityV07d(pose,{
 previousYaw=null,seconds=0,maxYawRate=.6
}={}){
 if(!pose?.points||!Array.isArray(pose.points)||
   pose.points.length<8||pose.points.length>64||
   pose.points.slice(0,4).some(p=>!p||
     !finite(p.x)||!finite(p.y)||!finite(p.z))||
   !range(seconds,0,60)||!range(maxYawRate,.05,2)||
   (previousYaw!==null&&!range(previousYaw,-.12,.12)))
  fail('invalid_neck_continuity_input');
 const [head,neck1,neck2,neck3]=pose.points;
 const front=unit(vec(head,neck1));
 const back=unit(vec(neck1,neck3));
 // Use real centerline curvature, not a separate autonomous head steering AI.
 // With no tangent XY support, hold neutral look rather than invent yaw.
 const h=Math.hypot(front.x,front.y),b=Math.hypot(back.x,back.y);
 const angle=h<1e-7||b<1e-7?0:
   signedTurn({x:back.x/b,y:back.y/b},{x:front.x/h,y:front.y/h});
 const yawTarget=clamp(angle*.24,-.12,.12);
 const yaw=previousYaw===null?yawTarget:
   clamp(yawTarget,previousYaw-seconds*maxYawRate,
    previousYaw+seconds*maxYawRate);
 return F({
  targetYaw:yawTarget,yaw,rawTurnRadians:angle,
  yawDelta:previousYaw===null?0:yaw-previousYaw,
  headTangent:F(front),neckTangent:F(back),
  // No claim of a continuous neck mesh or physically validated angle.
  status:'bounded_look_blend_derived_from_3d_spine_no_neck_ik'
 });
}
/**
 * Strict engineering preflight at ONE travel distance. Do not use this to
 * advance animal behavior or decide ecology needs. A clear result means only
 * V0.3d scene 2D footprints + an explicit V0.6A heightfield were sampled.
 */
export function sampleSnakeGroundNeckV07d({
 state,scene,body,terrain,
 speciesId='generic_snake',previousYaw=null,seconds=0,
 heightMargin=.0035
}={}){
 const shape=args(body);
 if(!state?.route||!range(state.distance,0,state.route.length)||
    !range(heightMargin,0,.05)||!range(seconds,0,60))
  fail('invalid_v07d_state_or_options');
 if(!['generic_snake','corn_snake','hognose_snake'].includes(speciesId))
  fail('unsupported_v07d_species');
 // An explicit terrain must be passed: a V0.3d light-blocking rock does NOT
 // automatically imply a walkable rock-shaped heightfield.
 if(!terrain)fail('v07d_explicit_heightfield_required');
 const base=sampleSnakeTravelPoseV07(state,shape);
 const before=inspectSnakeTerrariumPoseV07c(base,scene);
 if(!before.ok)return result('stopped_before_terrain_fit',
   'xy_blocked',{xy:before,pose:null,head:null});
 let fitted;
 try{
  fitted=conformSnakePoseToTerrain(base,{terrain,margin:heightMargin});
 }catch(error){
  if(!(error instanceof RangeError))throw error;
  return result('unresolved_heightfield_fit','terrain_fit_failed',{
   xy:before,pose:null,head:null
  });
 }
 const after=inspectSnakeTerrariumPoseV07c(fitted,scene);
 if(!after.ok)return result('stopped_after_terrain_fit',
   'xy_blocked_after_fit',{xy:after,pose:null,head:null});
 const contact=inspectSnakeTerrainClearance(fitted,{terrain,samplesPerBone:16});
 if(!contact.ok)return result('unresolved_heightfield_clearance',
   'terrain_clearance_failed',{xy:after,pose:null,head:null});
 const neck=inspectSnakeNeckContinuityV07d(fitted,{
  previousYaw,seconds
 });
 const attachment=makeSnakeHeadAttachment({
  speciesId,length:shape.length
 });
 const head=poseSnakeHeadAttachment(attachment,fitted.points,{
  yaw:neck.yaw
 });
 // The head is not a point. Test EVERY transformed vertex against the
 // supplied ground heightfield; a low snout must not penetrate a slope even
 // when the neck centerline itself has passed all heightfield tests.
 let worst=Infinity;
 for(const p of head.meshPositions){
  const ground=sampleSnakeTerrain(p.x,p.y,terrain).z;
  worst=Math.min(worst,p.z-ground);
 }
 if(worst<-.00001)
  return result('head_intersects_heightfield',
   'head_mesh_penetration',{xy:after,pose:null,head:null,
    headMinimumClearance:worst});
 return result('clear_artistic_preflight','clear',{
  xy:after,pose:fitted,head,neck,terrainClearance:contact,
  headMinimumClearance:worst,
  bodyContactCount:fitted.contacts.length,
  geometryAuthority:'V0.3d_XY_and_explicit_V0.6A_heightfield',
  physicsVerified:false,meshCollisionVerified:false,
  statusDetail:'transparent_debug_kinematics_not_finished_motion'
 });
}
