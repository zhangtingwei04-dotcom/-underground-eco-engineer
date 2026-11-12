/**
 * Project OHM SNAKE V0.7W — one 3D engineering head/neck mesh for BOTH
 * the experimental visible silhouette AND candidate vertex collision.
 *
 * This is an opt-in generic-snake design study, not species anatomy.
 * Original V0.1 head collision STILL runs upstream and remains a second,
 * conservative blocker; no new terrain route, muscle/force physics, skin.
 *
 * The new head has a narrower nose, broader posterior cranium and a tapered
 * neck from the first body joint. World XYZ vertices are shared BY IDENTITY
 * between render rings and the candidate collision mesh. We test all vertices
 * and triangle centroids against the authorized V0.3d obstacle footprints,
 * V0.6A floor and front glass boundaries. No collision proof for the full
 * curved skin surfaces or moving head sweeps is implied.
 */
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_HEAD_NECK_SCULPT_VERSION='0.7W';
const F=Object.freeze;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const valid3=p=>p&&[p.x,p.y,p.z].every(finite);
const V=(x,y,z)=>F({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,k)=>V(a.x*k,a.y*k,a.z*k);
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const fail=s=>{throw new RangeError(s)};
const avg=r=>V(
 r.reduce((v,p)=>v+p.x,0)/r.length,
 r.reduce((v,p)=>v+p.y,0)/r.length,
 r.reduce((v,p)=>v+p.z,0)/r.length
);
const smooth=t=>{const v=Math.min(1,Math.max(0,t));return v*v*(3-2*v)};
const denial=(reason,details={})=>F({
 version:SNAKE_HEAD_NECK_SCULPT_VERSION,
 ok:false,reason,
 candidate:null,headProjection:null,collarProjection:null,
 visibleCollisionMeshIdentical:false,
 sourceBoneModified:false,sourceHeadModified:false,
 modelCertifiedForPlayers:false,fullSweptCollisionVerified:false,
 skinApplied:false,playableCaveAuthorized:false,...details
});
function project(rings){
 const centers=F(rings.map(avg));
 const screenCenters=F(centers.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const screenRings=F(rings.map(r=>
  F(r.map(p=>projectSnakeFrontGlassPointV07g(p)))));
 const a=[],b=[],widths=[];
 for(let i=0;i<screenRings.length;i++){
  const before=screenCenters[Math.max(0,i-1)];
  const after=screenCenters[Math.min(screenCenters.length-1,i+1)];
  let dx=after.x-before.x,dy=after.y-before.y;
  if(Math.hypot(dx,dy)<1e-7){dx=1;dy=0;}
  const magnitude=Math.hypot(dx,dy),nx=-dy/magnitude,ny=dx/magnitude;
  let lo=Infinity,hi=-Infinity,low=null,high=null;
  for(const p of screenRings[i]){
   const u=(p.x-screenCenters[i].x)*nx+
    (p.y-screenCenters[i].y)*ny;
   if(u<lo){lo=u;low=p;}
   if(u>hi){hi=u;high=p;}
  }
  if(!low||!high||hi-lo<.035)
   fail('v07w_head_projection_degenerate');
  a.push(low);b.push(high);widths.push(hi-lo);
 }
 const outerA=F(a),outerB=F(b);
 return F({
  centers,screenCenters,projectedRings:screenRings,
  outerA,outerB,
  outline:F([...outerA,...outerB.slice().reverse()]),
  minimumWidth:Math.min(...widths)
 });
}
function assertSource(pose,head,volume,ghost,scene,terrain){
 if(head?.version!=='0.1'||head.speciesId!=='generic_snake'||
    !valid3(head.origin)||!head.frame||
    !['forward','side','up'].every(k=>valid3(head.frame[k]))||
    !Array.isArray(head.meshPositions)||
    !Array.isArray(pose?.points)||pose.points.length<10||
    pose.points.length>32||
    !finite(pose.segmentLength)||pose.segmentLength<=.01||
    !finite(pose.bodyRadius)||pose.bodyRadius<.05||
    pose.bodyRadius>.2||
    volume?.version!=='0.7Q'||volume.skinApplied!==false||
    volume.bonesChanged!==false||
    volume.sectionsPerBone!==4||volume.radialSegments!==12||
    volume.sourceJointCount!==pose.points.length||
    ghost?.version!=='0.7V'||ghost.skinApplied!==false||
    ghost.unscaledCanonicalHead!==true||
    ghost.headColliderMeshIdentical!==true||
    ghost.sourceJointCount!==pose.points.length||
    ghost.originalHeadColliderUnchanged!==true||
    ghost.sourceRockCollisionAuthorityUnchanged!==true||
    !Array.isArray(ghost.headWorldRings)||
    !Array.isArray(volume.worldRings)||
    !Array.isArray(scene?.objects)||!terrain||
    !finite(terrain.groundZ))
  fail('v07w_invalid_source_or_forbidden_species');
 const length=(pose.points.length-1)*pose.segmentLength;
 if(Math.abs(length-2.28)>1e-5)
  fail('v07w_not_certified_for_different_length');
 for(let i=0;i<pose.points.length;i++){
  if(!valid3(pose.points[i]))fail('v07w_invalid_bone');
  if(i&&Math.abs(dist(pose.points[i],pose.points[i-1])-
    pose.segmentLength)>1e-5)fail('v07w_bone_not_fixed_length');
 }
 if(dist(head.origin,pose.points[0])>1e-7||
    !head.neck||dist(head.neck.second,pose.points[1])>1e-7||
    dist(head.neck.third,pose.points[2])>1e-7||
    dist(volume.worldCenters[4],pose.points[1])>2e-5)
  fail('v07w_head_neck_source_inconsistent');
 if(ghost.headWorldRings.length*16!==head.meshPositions.length)
  fail('v07w_head_collider_source_ring_mismatch');
 for(let i=0;i<head.meshPositions.length;i++)
  if(dist(ghost.headWorldRings[Math.floor(i/16)][i%16],
    head.meshPositions[i])>1e-12)
   fail('v07w_untrusted_head_geometry');
 for(const frame of ['forward','side','up'])
  if(Math.abs(dot(head.frame[frame],head.frame[frame])-1)>1e-6)
   fail('v07w_invalid_orientation_basis');
 if(Math.abs(dot(head.frame.forward,head.frame.side))>1e-6||
    Math.abs(dot(head.frame.forward,head.frame.up))>1e-6||
    Math.abs(dot(head.frame.side,head.frame.up))>1e-6)
  fail('v07w_nonorthogonal_basis');
 return createSnakeTerrariumCorridorV07c(scene);
}
/** Deliberately qualitative proportions, NOT a validated species morph. */
const HEAD_PROFILE=F([
 F({a:-.090,w:.066,h:.056,z:0}),
 F({a:-.075,w:.075,h:.060,z:0}),
 F({a:-.057,w:.092,h:.069,z:0}),
 F({a:-.037,w:.106,h:.073,z:0}),
 F({a:-.013,w:.111,h:.072,z:0}),
 F({a:.012,w:.100,h:.066,z:0}),
 F({a:.037,w:.077,h:.052,z:0}),
 F({a:.058,w:.053,h:.037,z:.001}),
 F({a:.078,w:.023,h:.020,z:.003}),
 F({a:.085,w:.008,h:.011,z:.003})
]);
function makeHeadRings(head){
 const frame=head.frame,o=head.origin;
 return F(HEAD_PROFILE.map(s=>F(
  Array.from({length:16},(_,i)=>{
   const t=i*2*Math.PI/16;
   const x=add(o,mul(frame.forward,s.a));
   return add(x,add(
    mul(frame.side,s.w*Math.cos(t)),
    mul(frame.up,s.h*Math.sin(t)+s.z)
   ));
  })
 )));
}
function socketToBody(headRings,volume,neckRings){
 const rear=headRings[0],target=volume.worldRings[4];
 const targetCenter=avg(target),side=headRings[0].length;
 const sampled=F(Array.from({length:side},(_,i)=>{
  const t=i*target.length/side,j=Math.floor(t);
  return mix(target[j%target.length],target[(j+1)%target.length],t-j);
 }));
 // Select nearest cyclic alignment (including reverse) in world XYZ.
 let aligned=null,score=Infinity;
 for(const reversed of [false,true])
  for(let offset=0;offset<side;offset++){
   const ring=F(Array.from({length:side},(_,i)=>
    sampled[(offset+(reversed?(side-i)%side:i))%side]));
   const e=ring.reduce((a,p,i)=>a+dist(p,rear[i])**2,0);
   if(e<score){score=e;aligned=ring;}
  }
 const collar=F(Array.from({length:neckRings+1},(_,i)=>{
  const u=smooth(i/neckRings);
  return F(rear.map((p,j)=>mix(p,aligned[j],u)));
 }));
 if(dist(avg(collar.at(-1)),targetCenter)>3e-6)
  fail('v07w_collar_does_not_join_source_body');
 return collar;
}
function triangleIndex(rings){
 const list=[];
 for(let r=0;r<rings-1;r++){
  for(let i=0;i<16;i++){
   const a=r*16+i,b=r*16+(i+1)%16;
   const c=(r+1)*16+i,d=(r+1)*16+(i+1)%16;
   list.push(F([a,c,b]),F([b,c,d]));
  }
 }
 // Close nose/back rings, but treat socket/collar as a combined surface
 // for display: cap triangles are for candidate vertex/face safety QA.
 for(let i=1;i<15;i++){
  list.push(F([0,i+1,i]));
  const o=(rings-1)*16;
  list.push(F([o,o+i,o+i+1]));
 }
 return F(list);
}
function checkCandidate(mesh,scene,terrain,corridor){
 const obs=corridor.corridor.obstacles;
 const inside=(p)=>{
  if(p.x<=-4||p.x>=4||p.y<=-1.6||p.y>=1.6||
     p.z<=-.25||p.z>=3)
   return 'v07w_candidate_outside_glass_boundary';
  if(p.z<sampleSnakeTerrain(p.x,p.y,terrain).z-.00001)
   return 'v07w_candidate_below_authoritative_ground';
  if(obs.some(o=>p.x>=o.minX-.005&&p.x<=o.maxX+.005&&
     p.y>=o.minY-.005&&p.y<=o.maxY+.005))
   return 'v07w_candidate_intersects_authoritative_rock_xy';
  return null;
 };
 let tests=0;
 for(const p of mesh.vertices){
  const issue=inside(p);if(issue)return {ok:false,reason:issue};
  tests++;
 }
 for(const face of mesh.triangles){
  const p=avg(face.map(i=>mesh.vertices[i]));
  const issue=inside(p);if(issue)return {ok:false,reason:issue};
  tests++;
 }
 return {ok:true,tests};
}
export function buildSnakeHeadNeckSculptV07w({
 pose,head,volume,ghost,scene,terrain,neckRings=10
}={}){
 if(!Number.isInteger(neckRings)||neckRings<6||neckRings>14)
  fail('v07w_invalid_neck_ring_count');
 const corridor=assertSource(pose,head,volume,ghost,scene,terrain);
 const headRings=makeHeadRings(head);
 const collarRings=socketToBody(headRings,volume,neckRings);
 // Nose -> posterior cranium -> first true bone socket, one contiguous
 // triangle strip. Do NOT loop from the nose directly back to rear ring.
 const combined=F([...headRings.slice().reverse(),...collarRings.slice(1)]);
 const vertices=F(combined.flat());
 const triangles=triangleIndex(combined.length);
 const mesh=F({
  vertices,triangles,
  ringCount:combined.length,radialSegments:16,
  headRingCount:headRings.length,neckRingCount:collarRings.length,
  candidateOnly:true
 });
 const candidateCheck=checkCandidate(mesh,scene,terrain,corridor);
 if(!candidateCheck.ok)return denial(candidateCheck.reason);
 const headProjection=project(headRings);
 const collarProjection=project(collarRings);
 const headConnected=dist(avg(collarRings[0]),avg(headRings[0]))<1e-12;
 const socketConnected=dist(avg(collarRings.at(-1)),
  avg(volume.worldRings[4]))<3e-6;
 if(!headConnected||!socketConnected)
  fail('v07w_source_socket_connection_failed');
 return F({
  version:SNAKE_HEAD_NECK_SCULPT_VERSION,
  ok:true,reason:null,
  candidate:mesh,headProjection,collarProjection,
  sourceHeadVersion:'0.1',sourceVolumeVersion:'0.7Q',
  sourceGhostVersion:'0.7V',camera:'V0.7G_front_glass',
  sourceJointCount:pose.points.length,
  candidateCollisionChecks:candidateCheck.tests,
  candidateHeadRenderVertexCount:headRings.length*16,
  visibleCollisionMeshIdentical:true,
  headAndSocketContinuous:true,
  candidateSculptNotBiologicalAnatomy:true,
  originalHeadColliderStillRunsUpstream:true,
  sourceHeadModified:false,sourceBoneModified:false,
  sourceRockAuthorityUnchanged:true,
  fullSweptCollisionVerified:false,
  modelCertifiedForPlayers:false,
  realContactPhysicsVerified:false,
  skinApplied:false,playableCaveAuthorized:false,
  affectsEcology:false,affectsSave:false
 });
}
