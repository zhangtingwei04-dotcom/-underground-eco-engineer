/**
 * Project OHM SNAKE V0.7M — lab-authored triangular ground / cave shell mesh.
 *
 * Every vertex is explicitly provided in snake-world XY/Z; V0.3d still
 * owns physical object footprints and V0.7C/V0.7L remain fail-closed.
 * Rock "height" for lighting is NEVER reused as cave ceiling. Triangle
 * mesh and sampling are geometry checks, NOT game passage certification,
 * slope physics, species measurements or a new player-save schema.
 */
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';
import {terrariumFloorToSnakeV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {
 createSnakeHabitatVolumeV07l,inspectSnakeHabitatVolumeV07l
} from './snake-habitat-volume-v07l.mjs';

export const SNAKE_TERRAIN_MESH_VERSION='0.7M';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const inRange=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const bad=s=>{throw new RangeError(s)};
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(x);
const exact=(x,names)=>x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).every(k=>names.includes(k))&&
 names.every(k=>Object.hasOwn(x,k));
const P=(x,y,z)=>F({x,y,z});
const triangle=(a,b,c)=>F({vertices:F([a,b,c])});
function authoredGround(g){
 if(!exact(g,['xStops','yStops','zRows','authority'])||
    g.authority!=='explicit_lab_heightfield_unmeasured'||
    !Array.isArray(g.xStops)||!Array.isArray(g.yStops)||
    g.xStops.length<3||g.xStops.length>9||
    g.yStops.length<3||g.yStops.length>9||
    !Array.isArray(g.zRows)||g.zRows.length!==g.yStops.length)
  bad('invalid_explicit_terrain_grid');
 const xs=g.xStops,ys=g.yStops,z=g.zRows;
 if(xs[0]!==-4||xs.at(-1)!==4||
    ys[0]!==-1.6||ys.at(-1)!==1.6||
    xs.some((v,i)=>!inRange(v,-4,4)||(i>0&&v-xs[i-1]<.1))||
    ys.some((v,i)=>!inRange(v,-1.6,1.6)||(i>0&&v-ys[i-1]<.1))||
    z.some(row=>!Array.isArray(row)||row.length!==xs.length||
      row.some(v=>!inRange(v,0,.8))))
  bad('out_of_bounds_or_nonmonotonic_terrain');
 const heights=F(z.map(row=>F([...row])));
 const triangles=[];
 for(let j=0;j<ys.length-1;j++)for(let i=0;i<xs.length-1;i++){
  const tl=P(xs[i],ys[j],heights[j][i]);
  const tr=P(xs[i+1],ys[j],heights[j][i+1]);
  const bl=P(xs[i],ys[j+1],heights[j+1][i]);
  const br=P(xs[i+1],ys[j+1],heights[j+1][i+1]);
  triangles.push(triangle(tl,tr,bl),triangle(tr,br,bl));
 }
 return F({
  authority:g.authority,xStops:F([...xs]),yStops:F([...ys]),
  zRows:heights,triangles:F(triangles)
 });
}
const quad=(bounds,heights)=>F([
 triangle(P(bounds.minX,bounds.minY,heights[0]),
  P(bounds.maxX,bounds.minY,heights[1]),
  P(bounds.minX,bounds.maxY,heights[2])),
 triangle(P(bounds.maxX,bounds.minY,heights[1]),
  P(bounds.maxX,bounds.maxY,heights[3]),
  P(bounds.minX,bounds.maxY,heights[2]))
]);
function buildCaves(scene,caves){
 if(!Array.isArray(caves)||caves.length>8)
  bad('invalid_cave_shell_collection');
 const ids=new Set(),objects=new Set();
 return F(caves.map(c=>{
  if(!exact(c,['id','objectId','floorCorners','roofCorners','authority'])||
     !id(c.id)||!id(c.objectId)||ids.has(c.id)||
     objects.has(c.objectId)||
     c.authority!=='explicit_lab_shell_unmeasured'||
     !Array.isArray(c.floorCorners)||c.floorCorners.length!==4||
     !Array.isArray(c.roofCorners)||c.roofCorners.length!==4||
     c.floorCorners.some(v=>!inRange(v,-.1,1))||
     c.roofCorners.some(v=>!inRange(v,0,2))||
     c.floorCorners.some((v,i)=>c.roofCorners[i]-v<.12))
   bad('invalid_cave_floor_or_roof_shell');
  const source=scene.objects.find(o=>o.id===c.objectId);
  if(!source||source.kind!=='rock_overhang')
   bad('shell_not_attached_to_real_scene_rock');
  ids.add(c.id);objects.add(c.objectId);
  const min=terrariumFloorToSnakeV07c({x:source.x,y:source.y});
  const max=terrariumFloorToSnakeV07c({
   x:source.x+source.width,y:source.y+source.depth
  });
  const bounds=F({minX:min.x,minY:min.y,maxX:max.x,maxY:max.y});
  const floor=F([...c.floorCorners]),roof=F([...c.roofCorners]);
  return F({
   id:c.id,objectId:c.objectId,authority:c.authority,
   bounds,floorCorners:floor,roofCorners:roof,
   floorTriangles:quad(bounds,floor),
   roofTriangles:quad(bounds,roof),
   entranceMeshVerified:false,exitRouteVerified:false,
   playablePassageAuthorized:false
  });
 }));
}
export function createSnakeTerrainMeshV07m(scene,{
 ground,caves=[]
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene))
  bad('invalid_v07m_terrarium_scene');
 const floor=authoredGround(ground);
 const shells=buildCaves(scene,caves);
 return F({
  version:SNAKE_TERRAIN_MESH_VERSION,
  sourceSceneId:scene.sceneId,sourceRevision:scene.revision,
  sourceMinute:scene.minute,
  sourceObjectsJSON:JSON.stringify(scene.objects),
  ground:floor,caves:shells,
  source:'lab_authored_surface_triangles_plus_v03d_rock_footprints',
  skinApplied:false,meshCollisionVerified:false,
  playablePassageAuthorized:false,
  status:'explicit_3d_triangle_shell_geometry_not_terrain_physics'
 });
}
function trusted(scene,mesh){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
    mesh?.version!==SNAKE_TERRAIN_MESH_VERSION||
    mesh.sourceSceneId!==scene.sceneId||
    mesh.sourceRevision!==scene.revision||
    mesh.sourceMinute!==scene.minute||
    mesh.sourceObjectsJSON!==JSON.stringify(scene.objects)||
    mesh.playablePassageAuthorized!==false||
    mesh.skinApplied!==false||!Array.isArray(mesh.caves)||
    !mesh.ground)
  bad('stale_or_untrusted_v07m_mesh');
 const model=createSnakeTerrainMeshV07m(scene,{
  ground:{
   xStops:mesh.ground.xStops,yStops:mesh.ground.yStops,
   zRows:mesh.ground.zRows,authority:mesh.ground.authority
  },
  caves:mesh.caves.map(c=>({
   id:c.id,objectId:c.objectId,
   floorCorners:c.floorCorners,roofCorners:c.roofCorners,
   authority:c.authority
  }))
 });
 if(JSON.stringify(model)!==JSON.stringify(mesh))
  bad('forged_v07m_triangle_mesh');
 return model;
}
function sampleTriangles(tris,x,y){
 // Barycentric interpolation over actual three-vertex planar triangles.
 for(let i=0;i<tris.length;i++){
  const [a,b,c]=tris[i].vertices;
  const den=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);
  if(Math.abs(den)<1e-12)bad('degenerate_authored_triangle');
  const u=((b.y-c.y)*(x-c.x)+(c.x-b.x)*(y-c.y))/den;
  const v=((c.y-a.y)*(x-c.x)+(a.x-c.x)*(y-c.y))/den;
  const w=1-u-v;
  if(u>=-1e-9&&v>=-1e-9&&w>=-1e-9){
   return F({z:u*a.z+v*b.z+w*c.z,triangleIndex:i});
  }
 }
 return null;
}
export function sampleSnakeTerrainMeshV07m({
 scene,mesh,x,y,surface='ground',caveId=null
}={}){
 const m=trusted(scene,mesh);
 if(!inRange(x,-4,4)||!inRange(y,-1.6,1.6))
  bad('invalid_v07m_sample_point');
 let triangles=m.ground.triangles;
 if(surface==='cave_floor'||surface==='cave_roof'){
  const shell=m.caves.find(c=>c.id===caveId);
  if(!shell)bad('unowned_cave_mesh_surface');
  triangles=surface==='cave_floor'?
    shell.floorTriangles:shell.roofTriangles;
 }else if(surface!=='ground'||caveId!==null)
  bad('invalid_v07m_surface_selector');
 const hit=sampleTriangles(triangles,x,y);
 if(!hit)return F({
  ok:false,reason:'outside_authored_surface',z:null,
  triangleIndex:null,collisionVerified:false
 });
 return F({
  ok:true,reason:'planar_triangle_interpolation',
  z:hit.z,triangleIndex:hit.triangleIndex,
  collisionVerified:false
 });
}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function overlap(a,b,rect,r){
 let t0=0,t1=1;
 for(const [k,min,max] of [
  ['x',rect.minX-r,rect.maxX+r],
  ['y',rect.minY-r,rect.maxY+r]
 ]){
  const d=b[k]-a[k];
  if(Math.abs(d)<1e-12){
   if(a[k]<min||a[k]>max)return null;
  }else{
   let t=(min-a[k])/d,u=(max-a[k])/d;
   if(t>u)[t,u]=[u,t];
   t0=Math.max(t0,t);t1=Math.min(t1,u);
   if(t0>t1)return null;
  }
 }
 return {start:t0,end:t1};
}
function poseOrFail(pose,samplesPerBone,margin){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<8||pose.points.length>64||
    !inRange(pose.bodyRadius,.001,.5)||
    !inRange(pose.segmentLength,.001,1)||
    !Number.isInteger(samplesPerBone)||
    samplesPerBone<8||samplesPerBone>48||
    !inRange(margin,0,.05))
  bad('invalid_v07m_pose');
 for(const p of pose.points)
  if(!p||!inRange(p.x,-4,4)||!inRange(p.y,-1.6,1.6)||
     !inRange(p.z,-.25,3))bad('invalid_v07m_pose_point');
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  if(Math.abs(Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z)-
      pose.segmentLength)>1e-5)bad('stretched_v07m_bone');
 }
}
const assessment=(clear,reason,extra)=>F({
 version:SNAKE_TERRAIN_MESH_VERSION,
 clearForGeometryOnly:clear,reason,playablePassageAuthorized:false,
 fullMeshCollisionVerified:false,headMeshChecked:false,
 frictionOrLocomotionVerified:false,sampledSegmentsOnly:true,
 ...extra
});
/**
 * Fixed-bone engineering preflight: examine ground mesh at each bone's
 * sampled segments. Check each cave floor/roof where the expanded bone
 * overlaps its source footprint. No passage or full mesh collision pass.
 * Samples cannot certify collisions between all points or an organic mesh.
 */
export function inspectSnakeTerrainMeshV07m({
 scene,mesh,pose,margin=.005,samplesPerBone=24
}={}){
 const m=trusted(scene,mesh);
 poseOrFail(pose,samplesPerBone,margin);
 const r=pose.bodyRadius+margin;
 let minimumGround=Infinity,checkedSamples=0;
 const groundZ=(x,y)=>sampleTriangles(m.ground.triangles,x,y)?.z;
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  for(let k=0;k<=samplesPerBone;k++){
   const u=k/samplesPerBone;
   const x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u;
   const z=a.z+(b.z-a.z)*u;
   if(x< -4+r||x>4-r||y< -1.6+r||y>1.6-r)
    return assessment(false,'glass_wall_radius_blocked',{
     boneIndex:i-1,checkedSamples,minimumGroundClearance:null
    });
   const height=groundZ(x,y);
   if(height===undefined)
    return assessment(false,'unmodeled_ground_surface',{
     boneIndex:i-1,checkedSamples,minimumGroundClearance:null
    });
   const clearance=z-r-height;
   minimumGround=Math.min(minimumGround,clearance);
   checkedSamples++;
   if(clearance<-.00001)
    return assessment(false,'ground_triangle_clearance_failed',{
     boneIndex:i-1,checkedSamples,
     minimumGroundClearance:minimumGround
    });
  }
 }
 let shellOverlaps=0,minimumInterior=Infinity;
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  for(const cave of m.caves){
   const hit=overlap(a,b,cave.bounds,r);
   if(!hit)continue;
   shellOverlaps++;
   for(let k=0;k<=samplesPerBone;k++){
    const u=hit.start+(hit.end-hit.start)*k/samplesPerBone;
    const x=clamp(a.x+(b.x-a.x)*u,cave.bounds.minX,cave.bounds.maxX);
    const y=clamp(a.y+(b.y-a.y)*u,cave.bounds.minY,cave.bounds.maxY);
    const z=a.z+(b.z-a.z)*u;
    const floor=sampleTriangles(cave.floorTriangles,x,y);
    const roof=sampleTriangles(cave.roofTriangles,x,y);
    if(!floor||!roof)
     return assessment(false,'cave_mesh_surface_missing',{
      boneIndex:i-1,objectId:cave.objectId,checkedSamples
     });
    const interior=Math.min(z-r-floor.z,roof.z-z-r);
    minimumInterior=Math.min(minimumInterior,interior);
    if(interior<-.00001)
     return assessment(false,'cave_triangle_clearance_failed',{
      boneIndex:i-1,objectId:cave.objectId,checkedSamples,
      minimumGroundClearance:minimumGround,
      minimumCaveClearance:minimumInterior
     });
   }
  }
 }
 // V0.7L is the old safety authority; this NEW mesh never supersedes it.
 const volume=createSnakeHabitatVolumeV07l(scene,{
  passages:m.caves.map(c=>({
   id:c.id,objectId:c.objectId,
   floorZ:Math.min(...c.floorCorners),
   undersideZ:Math.max(...c.roofCorners),
   source:'explicit_lab_hypothesis_unmeasured'
  }))
 });
 const authoritative=inspectSnakeHabitatVolumeV07l({
  scene,pose,snapshot:volume,margin
 });
 return assessment(authoritative.ok,
  authoritative.ok?'clear_sampled_ground_and_old_xy_only':
   authoritative.reason,{
    checkedSamples,minimumGroundClearance:minimumGround,
    minimumCaveClearance:shellOverlaps?minimumInterior:null,
    caveBoneOverlaps:shellOverlaps,
    oldVolumeOk:authoritative.ok,
    oldVolumeReason:authoritative.reason
   });
}
