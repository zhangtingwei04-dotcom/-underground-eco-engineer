/**
 * PROJECT OHM V0.7X — source-tangent-guided neck, still transparent.
 *
 * V0.7W owns a real, SHARED visual/candidate head mesh. W's neck is a
 * straight interpolation regardless of the first TWO canonical bone
 * tangents. X reshapes ONLY the 9 interior collar rings, with 3D cubic
 * Hermite center guidance and bounded rotation of each cross-section.
 *
 * The ORIGINAL V0.1 collider and V0.7P/S/T/U path safety still run.
 * V0.7W source head rings, first body socket ring, canonical bones,
 * original scene, and published data are NEVER changed. New candidate
 * collision uses the SAME mesh vertices as the rendered collar; sample
 * vertices, triangle centroids and edge midpoints against source terrain.
 * Optional previous candidate checks HALF-TIME samples, NOT continuous
 * swept-mesh collision or verified animal musculature/skin.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_NECK_FOLLOW_VERSION='0.7X';
const F=Object.freeze;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const valid3=p=>p&&[p.x,p.y,p.z].every(finite);
const V=(x,y,z)=>F({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,k)=>V(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const length=a=>Math.hypot(a.x,a.y,a.z);
const dist=(a,b)=>length(sub(a,b));
const norm=a=>{const n=length(a);if(n<1e-8)throw new RangeError('v07x_invalid_neck_tangent');return mul(a,1/n)};
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const avg=points=>V(
 points.reduce((s,p)=>s+p.x,0)/points.length,
 points.reduce((s,p)=>s+p.y,0)/points.length,
 points.reduce((s,p)=>s+p.z,0)/points.length
);
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const fail=x=>{throw new RangeError(x)};
const deny=(reason,extra={})=>F({
 version:SNAKE_NECK_FOLLOW_VERSION,ok:false,reason,
 candidate:null,headProjection:null,collarProjection:null,
 displayCandidateMeshIdentical:false,
 originalColliderStillAuthoritative:true,
 modelCertifiedForPlayers:false,
 continuousSweptCollisionVerified:false,
 skinApplied:false,playableCaveAuthorized:false,...extra
});
function profile(rings){
 const centers=F(rings.map(avg));
 const screenCenters=F(centers.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const screenRings=F(rings.map(r=>F(r.map(p=>projectSnakeFrontGlassPointV07g(p)))));
 const aa=[],bb=[],widths=[];
 for(let i=0;i<rings.length;i++){
  const a=screenCenters[Math.max(0,i-1)];
  const b=screenCenters[Math.min(rings.length-1,i+1)];
  let dx=b.x-a.x,dy=b.y-a.y;
  if(Math.hypot(dx,dy)<1e-8){dx=1;dy=0;}
  const l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l;
  let min=Infinity,max=-Infinity,lo=null,hi=null;
  for(const p of screenRings[i]){
   const q=(p.x-screenCenters[i].x)*nx+
    (p.y-screenCenters[i].y)*ny;
   if(q<min){min=q;lo=p;}
   if(q>max){max=q;hi=p;}
  }
  if(!lo||!hi||max-min<.035)fail('v07x_projection_collapsed');
  aa.push(lo);bb.push(hi);widths.push(max-min);
 }
 return F({
  worldCenters:centers,screenCenters,projectedRings:screenRings,
  outerA:F(aa),outerB:F(bb),
  outline:F([...aa,...bb.slice().reverse()]),
  minimumWidth:Math.min(...widths)
 });
}
function hermite(a,b,t0,t1,u){
 const u2=u*u,u3=u2*u,scale=dist(a,b);
 return add(add(
  mul(a,2*u3-3*u2+1),mul(t0,(u3-2*u2+u)*scale)
 ),add(mul(b,-2*u3+3*u2),mul(t1,(u3-u2)*scale)));
}
function derivative(a,b,t0,t1,u){
 const u2=u*u,scale=dist(a,b);
 return add(add(
  mul(a,6*u2-6*u),mul(t0,(3*u2-4*u+1)*scale)
 ),add(mul(b,-6*u2+6*u),mul(t1,(3*u2-2*u)*scale)));
}
function rotateTo(v,from,to){
 const ax=cross(from,to),s=length(ax),c=clamp(dot(from,to),-1,1);
 if(s<1e-9)return v;
 const axis=mul(ax,1/s),theta=Math.atan2(s,c);
 return add(add(mul(v,Math.cos(theta)),
  mul(cross(axis,v),Math.sin(theta))),
  mul(axis,dot(axis,v)*(1-Math.cos(theta))));
}
function assertSources(pose,head,volume,sculpt,scene,terrain){
 if(pose?.points?.length!==13&&pose?.points?.length!==24)
  fail('v07x_unapproved_joint_count');
 if(!Array.isArray(pose.points)||!finite(pose.segmentLength)||
    !finite(pose.bodyRadius)||pose.bodyRadius<=0||
    !pose.points.every(valid3)||
    head?.version!=='0.1'||head.speciesId!=='generic_snake'||
    !valid3(head.origin)||!valid3(head.frame?.forward)||
    volume?.version!=='0.7Q'||volume.bonesChanged!==false||
    volume.skinApplied!==false||volume.sectionsPerBone!==4||
    sculpt?.version!=='0.7W'||sculpt.ok!==true||
    sculpt.visibleCollisionMeshIdentical!==true||
    sculpt.originalHeadColliderStillRunsUpstream!==true||
    sculpt.sourceBoneModified!==false||
    sculpt.modelCertifiedForPlayers!==false||
    sculpt.candidate?.vertices?.length!==320||
    sculpt.candidate?.triangles?.length!==636||
    sculpt.candidate.ringCount!==20||
    sculpt.candidate.headRingCount!==10||
    sculpt.candidate.neckRingCount!==11||
    !Array.isArray(volume.worldRings)||
    !scene?.objects||!Array.isArray(scene.objects)||!terrain)
  fail('v07x_missing_canonical_source');
 if(Math.abs((pose.points.length-1)*pose.segmentLength-2.28)>1e-5)
  fail('v07x_illegal_total_length');
 for(let i=1;i<pose.points.length;i++)
  if(Math.abs(dist(pose.points[i-1],pose.points[i])-
    pose.segmentLength)>1e-5)
   fail('v07x_source_bone_stretched');
 if(dist(head.origin,pose.points[0])>1e-7||
    dist(avg(sculpt.candidate.vertices.slice(304,320)),
      avg(volume.worldRings[4]))>3e-6)
  fail('v07x_source_head_or_body_socket_changed');
 for(const p of sculpt.candidate.vertices)
  if(!valid3(p))fail('v07x_nonfinite_source_mesh');
 return createSnakeTerrariumCorridorV07c(scene);
}
function checkCandidate(mesh,scene,terrain,corridor){
 const obs=corridor.corridor.obstacles;
 const valid=p=>{
  if(!valid3(p)||p.x<=-4||p.x>=4||
     p.y<=-1.6||p.y>=1.6||p.z<=-.25||p.z>=3)
   return 'v07x_candidate_outside_front_glass_bounds';
  if(p.z<sampleSnakeTerrain(p.x,p.y,terrain).z-1e-5)
   return 'v07x_candidate_inside_ground';
  if(obs.some(o=>p.x>=o.minX-.005&&p.x<=o.maxX+.005&&
     p.y>=o.minY-.005&&p.y<=o.maxY+.005))
   return 'v07x_candidate_inside_authoritative_rock_footprint';
  return null;
 };
 let samples=0;
 const check=p=>{const why=valid(p);samples++;return why};
 for(const p of mesh.vertices){const e=check(p);if(e)return {ok:false,why:e,samples};}
 for(const f of mesh.triangles){
  const a=mesh.vertices[f[0]],b=mesh.vertices[f[1]],c=mesh.vertices[f[2]];
  for(const p of [avg([a,b,c]),mix(a,b,.5),
      mix(b,c,.5),mix(c,a,.5)]){
   const e=check(p);if(e)return {ok:false,why:e,samples};
  }
 }
 return {ok:true,samples};
}
export function buildSnakeNeckFollowV07x({
 pose,head,volume,sculpt,scene,terrain,
 maxRingShift=.055,maxNeckAngle=.65,previous=null,seconds=1/30
}={}){
 if(!finite(maxRingShift)||maxRingShift<.012||maxRingShift>.08||
    !finite(maxNeckAngle)||maxNeckAngle<.25||maxNeckAngle>1.1||
    !finite(seconds)||seconds<0||seconds>.1)
  fail('v07x_invalid_bounded_neck_parameters');
 const corridor=assertSources(pose,head,volume,sculpt,scene,terrain);
 const prior=sculpt.candidate.vertices,faces=sculpt.candidate.triangles;
 const W=16,headRings=10,neckRings=10;
 const rings=F(Array.from({length:20},(_,i)=>
  F(prior.slice(i*W,(i+1)*W))));
 const a=avg(rings[9]),b=avg(rings[19]);
 // Each tangent is owned by real adjacent source bones, rather than a
 // fabricated 2D "wriggle" or a constant tube direction.
 const t0=norm(sub(pose.points[1],pose.points[0]));
 const t1=norm(sub(pose.points[2],pose.points[0]));
 const neckAngle=Math.acos(clamp(dot(t0,t1),-1,1));
 if(neckAngle>maxNeckAngle)
  return deny('v07x_neck_bend_exceeds_source_limit',{neckAngle});
 const shaped=[],sourceCenters=rings.map(avg),worldCenterOffsets=[];
 let maximumShift=0;
 for(let i=0;i<20;i++){
  if(i<=9||i===19){shaped.push(rings[i]);continue;}
  const u=(i-9)/neckRings;
  const target=hermite(a,b,t0,t1,u);
  const current=sourceCenters[i];
  const sourceT=norm(sub(sourceCenters[i+1],sourceCenters[i-1]));
  const newT=norm(derivative(a,b,t0,t1,u));
  const offset=dist(target,current);
  const ring=F(rings[i].map(p=>{
   const delta=rotateTo(sub(p,current),sourceT,newT);
   const projected=add(target,delta);
   maximumShift=Math.max(maximumShift,dist(projected,p));
   return projected;
  }));
  worldCenterOffsets.push(offset);
  shaped.push(ring);
 }
 if(maximumShift>maxRingShift+1e-8)
  return deny('v07x_neck_ring_movement_exceeds_limit',{
   maximumRingShift:maximumShift,allowedMaxRingShift:maxRingShift
  });
 // Identical source head mesh, identical first-body socket, same source
 // triangles. Render uses these exact 320 XYZ vertices as collision does.
 const vertices=F(shaped.flat());
 const mesh=F({
  vertices,triangles:faces,radialSegments:16,
  headRingCount:10,neckRingCount:11,ringCount:20,
  candidateOnly:true
 });
 for(let i=0;i<160;i++)
  if(dist(vertices[i],prior[i])>1e-12)
   fail('v07x_source_head_mesh_moved');
 for(let i=304;i<320;i++)
  if(dist(vertices[i],prior[i])>1e-12)
   fail('v07x_source_first_bone_socket_moved');
 const checked=checkCandidate(mesh,scene,terrain,corridor);
 if(!checked.ok)return deny(checked.why,{
  candidateSamplesChecked:checked.samples
 });
 let midpointChecks=0;
 if(previous!==null){
  if(previous.version!==SNAKE_NECK_FOLLOW_VERSION||
     previous.ok!==true||
     previous.candidate?.vertices?.length!==vertices.length||
     previous.sourceSceneSignature!==JSON.stringify({
      id:scene.sceneId,revision:scene.revision,
      minute:scene.minute,objects:scene.objects,terrain
     })||seconds<=0)
   return deny('v07x_stale_previous_candidate');
  const between=F(vertices.map((p,i)=>mix(
   previous.candidate.vertices[i],p,.5
  )));
  const transitional=F({vertices:between,triangles:faces});
  const sweep=checkCandidate(transitional,scene,terrain,corridor);
  if(!sweep.ok)return deny('v07x_swept_half_frame_'+sweep.why);
  midpointChecks=sweep.samples;
 }
 const headProjection=profile(shaped.slice(0,10).reverse());
 const collarProjection=profile(shaped.slice(9));
 const sourceSceneSignature=JSON.stringify({
  id:scene.sceneId,revision:scene.revision,
  minute:scene.minute,objects:scene.objects,terrain
 });
 return F({
  version:SNAKE_NECK_FOLLOW_VERSION,ok:true,reason:null,
  sourceSceneSignature,candidate:mesh,
  headProjection,collarProjection,
  sourceJointCount:pose.points.length,
  headRings:10,collarRings:11,
  candidateSamplesChecked:checked.samples,
  halfFrameSamplesChecked:midpointChecks,
  sourceNeckAngle:neckAngle,
  maximumRingShift:maximumShift,
  allowedMaxRingShift:maxRingShift,
  localCenterOffsets:F(worldCenterOffsets),
  headTangentMatchesFirstBone:true,
  neckTangentGuidedBySecondBone:true,
  displayCandidateMeshIdentical:true,
  originalColliderStillAuthoritative:true,
  sourceHeadModified:false,sourceBoneModified:false,
  originalSocketPreserved:true,
  trueContactForcesVerified:false,
  continuousSweptCollisionVerified:false,
  modelCertifiedForPlayers:false,
  skinApplied:false,playableCaveAuthorized:false,
  affectsEcology:false,affectsSave:false
 });
}
