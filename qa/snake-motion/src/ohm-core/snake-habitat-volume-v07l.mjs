/**
 * Project OHM SNAKE V0.7L — fail-closed volumetric cave/overhang feasibility.
 *
 * The ONLY physical XY footprint authority is V0.3d. The scene object's
 * "height" is a light-occlusion ART UNIT, never an inferred tunnel roof.
 * Explicit lab hypotheses can propose separate underside/floor clearances,
 * but no passage is opened until real mesh and full-body collision exist.
 *
 * Pure/read-only. NOT 3D physics, a playable cave, path finding, a terrain
 * mesh, a measured animal dimension, habitat welfare, or a save migration.
 */
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';
import {terrariumFloorToSnakeV07c}
 from './snake-terrarium-corridor-v07c.mjs';

export const SNAKE_HABITAT_VOLUME_VERSION='0.7L';
const F=Object.freeze;
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const inside=(n,min,max)=>valid(n)&&n>=min&&n<=max;
const fail=s=>{throw new RangeError(s)};
const ID=/^[a-z0-9][a-z0-9_-]{0,63}$/i;
const snapshotFor=(scene,passages)=>{
 const objects=scene.objects.map(o=>{
  const start=terrariumFloorToSnakeV07c({x:o.x,y:o.y});
  const end=terrariumFloorToSnakeV07c({
   x:o.x+o.width,y:o.y+o.depth
  });
  return F({
   id:o.id,kind:o.kind,
   minX:start.x,maxX:end.x,minY:start.y,maxY:end.y,
   // This height is intentionally NOT translated to a roof height.
   inferredRoofZ:null
  });
 });
 const authored=passages.map(p=>{
  if(!p||typeof p.id!=='string'||!ID.test(p.id)||
     typeof p.objectId!=='string'||!ID.test(p.objectId)||
     !inside(p.floorZ,-.2,1)||!inside(p.undersideZ,0,2)||
     p.undersideZ-p.floorZ<.05||
     p.source!=='explicit_lab_hypothesis_unmeasured')
   fail('invalid_unverified_passage_hypothesis');
  const original=scene.objects.find(o=>o.id===p.objectId);
  if(!original||original.kind!=='rock_overhang')
   fail('missing_source_overhang_for_hypothesis');
  return F({
   id:p.id,objectId:p.objectId,
   floorZ:p.floorZ,undersideZ:p.undersideZ,
   source:p.source,
   approved:false
  });
 });
 if(new Set(authored.map(p=>p.id)).size!==authored.length||
    new Set(authored.map(p=>p.objectId)).size!==authored.length)
  fail('duplicate_hypothetical_passage');
 return F({
  version:SNAKE_HABITAT_VOLUME_VERSION,
  sourceSceneId:scene.sceneId,
  sourceRevision:scene.revision,
  sourceMinute:scene.minute,
  sourceObjectsJSON:JSON.stringify(scene.objects),
  obstacles:F(objects),passages:F(authored),
  openingAuthorized:false,
  source:'V0.3d_XY_footprints_plus_explicit_unmeasured_lab_hypotheses',
  status:'volume_prefilter_only_all_overhangs_still_solid_to_game'
 });
};
export function createSnakeHabitatVolumeV07l(scene,{passages=[]}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
    !Array.isArray(passages)||passages.length>12)
  fail('invalid_v07l_source_scene_or_passages');
 return snapshotFor(scene,passages);
}
function checked(scene,snapshot){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
  snapshot?.version!==SNAKE_HABITAT_VOLUME_VERSION||
  snapshot.sourceSceneId!==scene.sceneId||
  snapshot.sourceRevision!==scene.revision||
  snapshot.sourceMinute!==scene.minute||
  snapshot.sourceObjectsJSON!==JSON.stringify(scene.objects)||
  snapshot.openingAuthorized!==false||
  !Array.isArray(snapshot.passages))
  fail('stale_or_untrusted_habitat_volume');
 const expected=createSnakeHabitatVolumeV07l(scene,{passages:snapshot.passages});
 if(JSON.stringify(snapshot)!==JSON.stringify(expected))
  fail('forged_habitat_volume_snapshot');
 return expected;
}
// Liang–Barsky continuous bone-vs-expanded rectangular footprint.
// Expanding by the full body radius is conservative (square envelope):
// corner false-positives are acceptable; missed penetrations are not.
function overlap(a,b,rect,r){
 let t0=0,t1=1;
 for(const [axis,min,max] of [
  ['x',rect.minX-r,rect.maxX+r],
  ['y',rect.minY-r,rect.maxY+r]
 ]){
  const d=b[axis]-a[axis];
  if(Math.abs(d)<1e-12){
   if(a[axis]<min||a[axis]>max)return null;
   continue;
  }
  let enter=(min-a[axis])/d,leave=(max-a[axis])/d;
  if(enter>leave)[enter,leave]=[leave,enter];
  t0=Math.max(t0,enter);t1=Math.min(t1,leave);
  if(t0>t1)return null;
 }
 return F({entry:t0,exit:t1});
}
function checkPose(pose,margin){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<8||pose.points.length>64||
    !inside(pose.bodyRadius,.001,.5)||
    !inside(pose.segmentLength,.001,1)||
    !inside(margin,0,.05))
  fail('invalid_v07l_pose');
 for(const p of pose.points){
  if(!p||!inside(p.x,-4,4)||!inside(p.y,-1.6,1.6)||
      !inside(p.z,-.25,3))
   fail('invalid_v07l_pose_point');
 }
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  if(Math.abs(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-
      pose.segmentLength)>1e-5)
   fail('invalid_v07l_stretched_skeleton');
 }
}
const result=(ok,reason,details={})=>F({
 version:SNAKE_HABITAT_VOLUME_VERSION,ok,reason,
 playableCaveAuthorized:false,meshCollisionVerified:false,
 biomechanicalValidation:false,...details
});
/**
 * NEVER use this to override V0.7C's solid XY blockers.
 * "hypothetical_tunnel_unverified" is a BLOCKED outcome, even if numerical
 * centerline envelope clearance seems positive.
 */
export function inspectSnakeHabitatVolumeV07l({
 scene,pose,snapshot=null,margin=.005
}={}){
 const s=snapshot===null?createSnakeHabitatVolumeV07l(scene):
  checked(scene,snapshot);
 checkPose(pose,margin);
 const r=pose.bodyRadius+margin;
 for(let i=0;i<pose.points.length;i++){
  const p=pose.points[i];
  if(p.x< -4+r||p.x>4-r||p.y< -1.6+r||p.y>1.6-r)
   return result(false,'wall_boundary',{boneIndex:i,objectId:null});
 }
 const proposals=new Map(s.passages.map(p=>[p.objectId,p]));
 let candidates=0;
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  for(const obstacle of s.obstacles){
   const hit=overlap(a,b,obstacle,r);
   if(!hit)continue;
   const passage=proposals.get(obstacle.id);
   if(!passage)
    return result(false,'solid_xy_source_blocker',{
     boneIndex:i-1,objectId:obstacle.id,
     source:'authoritative_v03d_solid_footprint'
    });
   const z0=a.z+(b.z-a.z)*hit.entry;
   const z1=a.z+(b.z-a.z)*hit.exit;
   const bottom=Math.min(z0,z1)-r;
   const top=Math.max(z0,z1)+r;
   if(bottom<passage.floorZ||top>passage.undersideZ)
    return result(false,'hypothetical_tunnel_too_low_or_high_floor',{
     boneIndex:i-1,objectId:obstacle.id,passageId:passage.id,
     bottom,top,
     reasonDetail:'explicit_lab_hypothesis_failed_conservative_capsule'
    });
   candidates++;
  }
 }
 if(candidates>0)return result(false,'hypothetical_tunnel_unverified',{
  boneIndex:null,objectId:null,candidateBoneOverlaps:candidates,
  reasonDetail:'clearance_feasible_but_no_mesh_or_entrance_approval'
 });
 return result(true,'clear_2d_corridor_only',{
  boneIndex:null,objectId:null,candidateBoneOverlaps:0,
  reasonDetail:'no_source_obstacle_overlap_no_3d_mesh_certification'
 });
}
