/**
 * OHM SNAKE V0.7Y — opt-in, visibly slender 3D *candidate* body and collar.
 *
 * V0.7Q's fixed-length 3D source is preserved; V0.7W/X's 160 real
 * candidate head vertices are preserved. A smooth relative taper trims the
 * broad trunk, softens the too-thick U turn and gives the tail a gradual
 * narrower outline. The resized 3D body and collar are the SAME vertices
 * used for candidate obstacle/ground/glass checks and for rendering.
 *
 * This does NOT replace original V0.1 head collision, V0.7C rock authority,
 * or prove whole-surface/swept collision, forces, or species anatomy.
 * It is a private, transparent, zero-skin prototype only.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_SLENDER_VOLUME_VERSION='0.7Y';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const P=(x,y,z)=>F({x,y,z});
const valid=p=>p&&[p.x,p.y,p.z].every(finite);
const add=(a,b)=>P(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>P(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,s)=>P(a.x*s,a.y*s,a.z*s);
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=p=>Math.hypot(p.x,p.y,p.z);
const dist=(a,b)=>len(sub(a,b));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=u=>{const t=clamp(u,0,1);return t*t*(3-2*t)};
const average=a=>P(
 a.reduce((v,p)=>v+p.x,0)/a.length,
 a.reduce((v,p)=>v+p.y,0)/a.length,
 a.reduce((v,p)=>v+p.z,0)/a.length
);
const fail=s=>{throw new RangeError(s)};
const deny=(reason,meta={})=>F({
 version:SNAKE_SLENDER_VOLUME_VERSION,ok:false,reason,
 bodyCandidate:null,headNeckCandidate:null,
 bodyProjection:null,collarProjection:null,
 sourceHeadModified:false,sourceBonesModified:false,
 certifiedForGameplay:false,fullSurfaceCollisionVerified:false,
 realTractionVerified:false,skinApplied:false,...meta
});
// This is a qualitative source-specific art proportion curve,
// NOT measured corn-snake or western-hognose morphology.
const SCALE_STOPS=F([
 F([0,.81]),F([.10,.74]),F([.30,.76]),F([.54,.73]),
 F([.74,.68]),F([.90,.72]),F([1,.88])
]);
export function snakeSlimFactorV07y(progress){
 if(!finite(progress)||progress<0||progress>1)fail('v07y_invalid_profile_progress');
 for(let i=1;i<SCALE_STOPS.length;i++){
  const [endY,endValue]=SCALE_STOPS[i];
  if(progress<=endY){
   const [startY,startValue]=SCALE_STOPS[i-1];
   return startValue+(endValue-startValue)*
    smooth((progress-startY)/(endY-startY));
  }
 }
 return SCALE_STOPS.at(-1)[1];
}
function profile(worldRings){
 const centers=F(worldRings.map(average));
 const screenCenters=F(centers.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const screens=F(worldRings.map(r=>F(r.map(p=>
  projectSnakeFrontGlassPointV07g(p)))));
 const aa=[],bb=[],widths=[];
 for(let i=0;i<screens.length;i++){
  const prev=screenCenters[Math.max(0,i-1)];
  const next=screenCenters[Math.min(i+1,screens.length-1)];
  let dx=next.x-prev.x,dy=next.y-prev.y;
  if(Math.hypot(dx,dy)<1e-8){dx=1;dy=0;}
  const norm=Math.hypot(dx,dy),nx=-dy/norm,ny=dx/norm;
  let lo=Infinity,hi=-Infinity,a=null,b=null;
  for(const pt of screens[i]){
   const w=(pt.x-screenCenters[i].x)*nx+
    (pt.y-screenCenters[i].y)*ny;
   if(w<lo){lo=w;a=pt;}
   if(w>hi){hi=w;b=pt;}
  }
  if(!a||!b||hi-lo<.015)fail('v07y_collapsed_projected_transparency');
  aa.push(a);bb.push(b);widths.push(hi-lo);
 }
 return F({
  worldCenters:centers,projectedCenters:screenCenters,projectedRings:screens,
  outerA:F(aa),outerB:F(bb),
  outline:F([...aa,...bb.slice().reverse()]),
  minimumWidth:Math.min(...widths)
 });
}
function surfaceTriangles(rings,radial){
 const faces=[];
 for(let i=0;i<rings-1;i++)
  for(let j=0;j<radial;j++){
   const a=i*radial+j,b=i*radial+(j+1)%radial;
   const c=(i+1)*radial+j,d=(i+1)*radial+(j+1)%radial;
   faces.push(F([a,c,b]),F([b,c,d]));
  }
 return F(faces);
}
function checkMesh(mesh,corridor,terrain){
 const obstacles=corridor.corridor.obstacles;let samples=0;
 const inspect=p=>{
  samples++;
  if(!valid(p)||p.x<=-4||p.x>=4||p.y<=-1.6||
     p.y>=1.6||p.z<=-.25||p.z>=3)
   return 'v07y_outside_authorized_glass_bounds';
  if(p.z<sampleSnakeTerrain(p.x,p.y,terrain).z-1e-5)
   return 'v07y_below_ground_heightfield';
  if(obstacles.some(o=>p.x>=o.minX-.005&&p.x<=o.maxX+.005&&
     p.y>=o.minY-.005&&p.y<=o.maxY+.005))
   return 'v07y_inside_rock_footprint';
  return null;
 };
 for(const v of mesh.vertices){
  const why=inspect(v);if(why)return {ok:false,reason:why,samples};
 }
 for(const [a,b,c] of mesh.triangles){
  const p=mesh.vertices[a],q=mesh.vertices[b],r=mesh.vertices[c];
  for(const v of [average([p,q,r]),mix(p,q,.5),mix(q,r,.5),mix(r,p,.5)]){
   const why=inspect(v);if(why)return {ok:false,reason:why,samples};
  }
 }
 return {ok:true,samples};
}
function normalized(a){
 const n=len(a);if(n<1e-8)fail('v07y_degenerate_source_link');
 return mul(a,1/n);
}
function jointAngles(points){
 const result=[0];
 for(let i=1;i<points.length-1;i++){
  const u=normalized(sub(points[i],points[i-1]));
  const v=normalized(sub(points[i+1],points[i]));
  result.push(Math.acos(clamp(dot(u,v),-1,1)));
 }
 result.push(0);
 return F(result);
}
function bodyScaleAtRing(i,total,angles,sectionsPerBone){
 const u=i/total,j=Math.min(angles.length-2,Math.floor(i/sectionsPerBone));
 const local=clamp((i/sectionsPerBone)-j,0,1);
 const bend=angles[j]*(1-smooth(local))+angles[j+1]*smooth(local);
 // At most 4.5% local thickness compensation near a sharp turn,
 // gradually transferred along the same source bones (no cusp swelling).
 const bendRelief=clamp(bend*.08,0,.045);
 return F({
  scale:snakeSlimFactorV07y(u)*(1-bendRelief),
  bendRelief
 });
}
function validate(pose,volume,neckFollow,scene,terrain){
 if(!pose||![13,24].includes(pose.points?.length)||
    !pose.points.every(valid)||!finite(pose.segmentLength)||
    !finite(pose.bodyRadius)||
    Math.abs(pose.bodyRadius-.13)>1e-8||
    Math.abs((pose.points.length-1)*pose.segmentLength-2.28)>1e-5||
    volume?.version!=='0.7Q'||volume.bonesChanged!==false||
    volume.skinApplied!==false||
    volume.radialSegments!==12||volume.sectionsPerBone!==4||
    volume.sourceJointCount!==pose.points.length||
    volume.ringCount!==(pose.points.length-1)*4+1||
    !Array.isArray(volume.worldRings)||
    !Array.isArray(volume.worldCenters)||
    neckFollow?.version!=='0.7X'||neckFollow.ok!==true||
    neckFollow.displayCandidateMeshIdentical!==true||
    neckFollow.sourceBoneModified!==false||
    neckFollow.sourceHeadModified!==false||
    neckFollow.originalColliderStillAuthoritative!==true||
    neckFollow.modelCertifiedForPlayers!==false||
    neckFollow.candidate?.vertices?.length!==320||
    neckFollow.candidate?.triangles?.length!==636||
    !Array.isArray(scene?.objects)||!terrain||!finite(terrain.groundZ))
  fail('v07y_untrusted_or_mismatched_source');
 for(let i=0;i<pose.points.length;i++){
  if(dist(volume.worldCenters[i*4],pose.points[i])>2e-5)
   fail('v07y_volume_and_skeleton_disagree');
  if(i&&Math.abs(dist(pose.points[i],pose.points[i-1])-
     pose.segmentLength)>1e-5)
   fail('v07y_source_bone_length_mismatch');
 }
 for(let i=0;i<volume.worldRings.length;i++){
  if(volume.worldRings[i]?.length!==12||
     !volume.worldRings[i].every(valid))
   fail('v07y_invalid_original_ring');
 }
 for(const p of neckFollow.candidate.vertices)
  if(!valid(p))fail('v07y_invalid_original_head_neck');
 return createSnakeTerrariumCorridorV07c(scene);
}
function socketSamples(ring){
 return F(Array.from({length:16},(_,i)=>{
  const s=i*ring.length/16,k=Math.floor(s),fraction=s-k;
  return mix(ring[k%ring.length],ring[(k+1)%ring.length],fraction);
 }));
}
function socketError(collar,bodyRing){
 const samples=socketSamples(bodyRing);
 return Math.max(...collar.map(p=>
  Math.min(...samples.map(q=>dist(p,q)))));
}
export function buildSnakeSlenderVolumeV07y({
 pose,volume,neckFollow,scene,terrain,
 previous=null,seconds=1/30
}={}){
 if(!finite(seconds)||seconds<0||seconds>.1)
  fail('v07y_invalid_time_step');
 const corridor=validate(pose,volume,neckFollow,scene,terrain);
 const angles=jointAngles(pose.points);
 const total=volume.ringCount-1;
 const factors=[],bendReliefs=[];
 const bodyRings=F(volume.worldRings.map((ring,i)=>{
  const info=bodyScaleAtRing(i,total,angles,volume.sectionsPerBone);
  const center=volume.worldCenters[i];
  factors.push(info.scale);bendReliefs.push(info.bendRelief);
  return F(ring.map(p=>add(center,mul(sub(p,center),info.scale))));
 }));
 const socketScale=factors[4];
 const original=neckFollow.candidate.vertices;
 const newHeadNeck=F(Array.from({length:20},(_,i)=>{
  const src=original.slice(i*16,i*16+16);
  if(i<=9)return F(src); // All 160 actual head sculpt vertices stay EXACT.
  const u=(i-9)/10;
  const scale=1-(1-socketScale)*smooth(u);
  const center=i===19?volume.worldCenters[4]:average(src);
  return F(src.map(p=>add(center,mul(sub(p,center),scale))));
 }));
 const gap=socketError(newHeadNeck[19],bodyRings[4]);
 if(gap>1e-4)
  return deny('v07y_head_and_slender_body_socket_not_continuous',{
   socketWorldGap:gap
  });
 const bodyCandidate=F({
  vertices:F(bodyRings.flat()),triangles:surfaceTriangles(bodyRings.length,12),
  ringCount:bodyRings.length,radialSegments:12,candidateOnly:true
 });
 const headNeckCandidate=F({
  vertices:F(newHeadNeck.flat()),triangles:neckFollow.candidate.triangles,
  ringCount:20,radialSegments:16,candidateOnly:true
 });
 const headCheck=checkMesh(headNeckCandidate,corridor,terrain);
 if(!headCheck.ok)return deny(headCheck.reason,{headSamplesChecked:headCheck.samples});
 const bodyCheck=checkMesh(bodyCandidate,corridor,terrain);
 if(!bodyCheck.ok)return deny(bodyCheck.reason,{
  headSamplesChecked:headCheck.samples,
  bodySamplesChecked:bodyCheck.samples
 });
 let halfTimeSamplesChecked=0;
 const signature=JSON.stringify({
  id:scene.sceneId,revision:scene.revision,
  minute:scene.minute,objects:scene.objects,terrain
 });
 if(previous!==null){
  if(previous.version!==SNAKE_SLENDER_VOLUME_VERSION||
     previous.ok!==true||previous.sourceJointCount!==pose.points.length||
     previous.sceneSignature!==signature||seconds<=0)
   return deny('v07y_incompatible_previous_slim_frame');
  for(const [candidate,prior] of [
   [bodyCandidate,previous.bodyCandidate],
   [headNeckCandidate,previous.headNeckCandidate]
  ]){
   if(prior.vertices.length!==candidate.vertices.length)
    return deny('v07y_incompatible_previous_mesh_size');
   const midway=F({
    vertices:F(candidate.vertices.map((p,i)=>
     mix(prior.vertices[i],p,.5))),
    triangles:candidate.triangles
   });
   const check=checkMesh(midway,corridor,terrain);
   if(!check.ok)return deny('v07y_half_frame_'+check.reason);
   halfTimeSamplesChecked+=check.samples;
  }
 }
 // Project only after collision candidates are verified. Screen widths
 // are derived from exactly the candidate's corresponding 3D vertices.
 const bodyProjection=profile(bodyRings);
 const collarProjection=profile(newHeadNeck.slice(9));
 return F({
  version:SNAKE_SLENDER_VOLUME_VERSION,ok:true,reason:null,
  sceneSignature:signature,sourceJointCount:pose.points.length,
  sourceBoneCount:pose.points.length-1,sourceTotalLength:2.28,
  bodyWorldRings:bodyRings,headNeckWorldRings:newHeadNeck,
  bodyCandidate,headNeckCandidate,
  bodyProjection,collarProjection,
  headProjection:neckFollow.headProjection,
  profileScales:F(factors),bendReliefs:F(bendReliefs),
  neckSocketScale:socketScale,
  midBodyScale:factors[Math.round(.45*total)],
  tipScale:factors[total],
  headBodySocketGap:gap,
  maxBendRelief:Math.max(...bendReliefs),
  sourceHeadVertexCount:160,
  headSamplesChecked:headCheck.samples,
  bodySamplesChecked:bodyCheck.samples,
  halfTimeSamplesChecked,
  sourceHeadModified:false,sourceBonesModified:false,
  originalHeadColliderStillAuthoritative:true,
  sourceRockAuthorityUnchanged:true,
  sameVerticesRenderedAndSampled:true,
  continuousWholeBodyCollisionVerified:false,
  realTractionVerified:false,certifiedForGameplay:false,
  skinApplied:false,affectsSave:false,affectsEcology:false,
  playableCaveAuthorized:false
 });
}
