/**
 * Project OHM SNAKE V0.7V — collision-source head + bounded ghost bend softening.
 *
 * PRIVATE-LAB ART ONLY. The head outline is derived from the EXACT canonical
 * V0.1 head collider vertices, never a differently scaled display proxy.
 * Existing body shell remains V0.7Q and its bone endpoints never change.
 * At each bend, a bounded, local 3D edit softens ONLY the translucent
 * display shell (not physics). Source V0.7C/0.7S collision stays authoritative.
 *
 * Fail closed on a mismatch in the head-to-neck radius. This also exposes
 * why the older hognose 24-joint demo's head cannot yet be rendered at
 * the correct scale without redesigning its real head collider.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_GHOST_CONTINUITY_VERSION='0.7V';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const ok3=p=>p&&[p.x,p.y,p.z].every(finite);
const bad=s=>{throw new RangeError(s)};
const P=(x,y,z)=>F({x,y,z});
const norm=p=>Math.hypot(p.x,p.y,p.z);
const add=(a,b)=>P(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>P(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,t)=>P(a.x*t,a.y*t,a.z*t);
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const dist=(a,b)=>norm(sub(a,b));
const mean=points=>P(
 points.reduce((a,p)=>a+p.x,0)/points.length,
 points.reduce((a,p)=>a+p.y,0)/points.length,
 points.reduce((a,p)=>a+p.z,0)/points.length
);
const meanRadius=ring=>{
 const c=mean(ring);
 return ring.reduce((a,p)=>a+dist(p,c),0)/ring.length;
};
const sm=t=>{const v=Math.max(0,Math.min(1,t));return v*v*(3-2*v)};
function sampleRing(source,count){
 const n=source.length;
 return F(Array.from({length:count},(_,i)=>{
  const k=i*n/count,j=Math.floor(k);
  return mix(source[j%n],source[(j+1)%n],k-j);
 }));
}
function matchingRing(head,body){
 const n=head.length;
 let best=null,score=Infinity,alignmentIndex=-1;
 for(const reversed of [false,true]){
  for(let shift=0;shift<n;shift++){
   const ring=F(Array.from({length:n},(_,j)=>
    body[((reversed?(n-j)%n:j)+shift)%n]));
   const fit=ring.reduce((s,p,j)=>s+dist(p,head[j])**2,0);
   if(fit<score){best=ring;score=fit;
    alignmentIndex=shift+(reversed?n:0);}
  }
 }
 return F({ring:best,score,alignmentIndex});
}
function profile(rings){
 const centers=F(rings.map(mean));
 const projectedCenters=F(centers.map(p=>
  projectSnakeFrontGlassPointV07g(p)));
 const projected=F(rings.map(r=>F(r.map(p=>
  projectSnakeFrontGlassPointV07g(p)))));
 const aa=[],bb=[],widths=[];
 for(let i=0;i<rings.length;i++){
  const before=projectedCenters[Math.max(0,i-1)];
  const after=projectedCenters[Math.min(centers.length-1,i+1)];
  let dx=after.x-before.x,dy=after.y-before.y;
  if(Math.hypot(dx,dy)<1e-8){dx=1;dy=0;}
  const len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  let lo=Infinity,hi=-Infinity,a=null,b=null;
  for(const p of projected[i]){
   const t=(p.x-projectedCenters[i].x)*nx+
    (p.y-projectedCenters[i].y)*ny;
   if(t<lo){lo=t;a=p;}
   if(t>hi){hi=t;b=p;}
  }
  if(!a||!b||hi-lo<.03)bad('v07v_flat_projected_section');
  aa.push(a);bb.push(b);widths.push(hi-lo);
 }
 const a=F(aa),b=F(bb);
 return F({
  centers,projectedCenters,projectedRings:projected,
  outerA:a,outerB:b,
  outline:F([...a,...b.slice().reverse()]),
  minimumWidth:Math.min(...widths)
 });
}
function validatedSources(pose,head,volume,bridge,maxWorldShift,
 compatibilityRatio){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<10||pose.points.length>48||
    !Number.isFinite(pose.segmentLength)||
    !Number.isFinite(pose.bodyRadius)||
    !Number.isFinite(maxWorldShift)||maxWorldShift<.003||
    maxWorldShift>.026||
    !Number.isFinite(compatibilityRatio)||
    compatibilityRatio<1.08||compatibilityRatio>1.55||
    head?.version!=='0.1'||
    !Array.isArray(head.meshPositions)||
    head.meshPositions.length<96||
    !head.meshPositions.every(ok3)||
    head.meshPositions.length%16!==0||
    volume?.version!=='0.7Q'||volume.bonesChanged!==false||
    volume.skinApplied!==false||
    volume.sourceJointCount!==pose.points.length||
    volume.radialSegments!==12||
    !Array.isArray(volume.worldRings)||
    !Array.isArray(volume.worldCenters)||
    volume.ringCount!==volume.worldRings.length||
    bridge?.version!=='0.7R'||
    bridge.sourceJointCount!==pose.points.length||
    bridge.headMeshChanged!==false||
    bridge.bonesChanged!==false||
    bridge.skinApplied!==false||
    bridge.headDisplayOnlyRescale!==true||
    !Number.isFinite(bridge.headDisplayScale)||
    bridge.headDisplayScale<.2||
    !Array.isArray(bridge.sourceHeadWorldRings)||
    !Array.isArray(bridge.sourceBodyJoinRing))
  bad('v07v_missing_or_invalid_source');
 for(let i=0;i<pose.points.length;i++){
  if(!ok3(pose.points[i]))bad('v07v_invalid_source_bone');
  if(i>0&&Math.abs(dist(pose.points[i],pose.points[i-1])-
   pose.segmentLength)>1e-5)
   bad('v07v_source_bone_not_fixed');
 }
 const headRings=bridge.sourceHeadWorldRings;
 if(headRings.length*16!==head.meshPositions.length)
  bad('v07v_head_collider_ring_count_mismatch');
 for(let i=0;i<head.meshPositions.length;i++){
  if(dist(headRings[Math.floor(i/16)][i%16],
   head.meshPositions[i])>1e-12)
   bad('v07v_head_3d_display_must_match_collider');
 }
 if(dist(volume.worldCenters[0],pose.points[0])>2e-5||
    dist(volume.worldCenters[volume.sectionsPerBone],
     pose.points[1])>2e-5||
    dist(head.origin,pose.points[0])>1e-7)
  bad('v07v_head_body_origin_or_bone_mismatch');
 for(let i=0;i<volume.worldRings.length;i++){
  const ring=volume.worldRings[i];
  if(ring?.length!==12||!ring.every(ok3))
   bad('v07v_invalid_body_ring_source');
 }
 const join=volume.worldRings[volume.sectionsPerBone];
 const rear=headRings[0],headRadius=meanRadius(rear);
 const bodyRadius=meanRadius(join);
 const ratio=headRadius/bodyRadius;
 if(!Number.isFinite(ratio)||ratio<=0||ratio>compatibilityRatio||
    ratio<.55)
  bad('v07v_head_collider_and_body_neck_ratio_incompatible');
 return F({headRings,join,rear,headRadius,bodyRadius,ratio});
}
export function buildSnakeGhostContinuityV07v({
 pose,head,volume,bridge,maxWorldShift=.018,
 compatibilityRatio=1.38,collarSections=10
}={}){
 if(!Number.isInteger(collarSections)||collarSections<6||
    collarSections>16)
  bad('v07v_invalid_collar_sections');
 const source=validatedSources(pose,head,volume,bridge,
  maxWorldShift,compatibilityRatio);
 const joinIndex=volume.sectionsPerBone;
 const worldRings=F(volume.worldRings.map((r,i)=>{
  // Preserve all original 3D ring positions at body/head junction, tail,
  // and endpoints. Relax ONLY technical translucent rings near U bends.
  if(i<=joinIndex||i>=volume.ringCount-1)return r;
  const prev=volume.worldRings[i-1],next=volume.worldRings[i+1];
  return F(r.map((p,j)=>{
   const average=mul(add(prev[j],next[j]),.5);
   const desired=mul(sub(average,p),.85);
   const magnitude=norm(desired);
   const delta=magnitude>maxWorldShift?
    mul(desired,maxWorldShift/magnitude):desired;
   return add(p,delta);
  }));
 }));
 let maximumShift=0;
 for(let i=0;i<worldRings.length;i++)
  for(let j=0;j<12;j++)
   maximumShift=Math.max(maximumShift,
    dist(worldRings[i][j],volume.worldRings[i][j]));
 const body=profile(worldRings);
 // Do not source the head from V0.7R's reduced DISPLAY proxy. These rings
 // are EXACTLY the full source meshPositions used by V0.7P/S/F collision.
 const headShape=profile(source.headRings);
 const target=sampleRing(source.join,16);
 const aligned=matchingRing(source.rear,target);
 const collar=F(Array.from({length:collarSections+1},(_,i)=>{
  const w=sm(i/collarSections);
  return F(source.rear.map((p,j)=>mix(p,aligned.ring[j],w)));
 }));
 const neck=profile(collar);
 if(source.ratio>1.38&&compatibilityRatio>=source.ratio)
  bad('v07v_oversized_head_requires_explicit_anatomy_review');
 return F({
  version:SNAKE_GHOST_CONTINUITY_VERSION,
  camera:'V0.7G_front_glass',
  status:'collision_source_3d_head_unscaled_bounded_body_shell_softening',
  sourceJointCount:pose.points.length,
  sourceBoneCount:pose.points.length-1,
  originalBodyRingCount:volume.ringCount,
  headRingCount:source.headRings.length,
  collarRingCount:collar.length,
  headWorldRings:source.headRings,
  collarWorldRings:collar,
  bodyWorldRings:worldRings,
  headProjection:headShape,
  collarProjection:neck,
  bodyProjection:body,
  headColliderMeshIdentical:true,
  headDisplayScale:1,
  v07rFormerHeadDisplayScale:bridge.headDisplayScale,
  headToBodySocketRadiusRatio:source.ratio,
  unscaledCanonicalHead:true,
  maxWorldShellShift:maximumShift,
  allowedMaxWorldShellShift:maxWorldShift,
  sourceBoneEndpointsPreserved:true,
  originalHeadColliderUnchanged:true,
  originalBodyShellUnchanged:true,
  bodySurfaceCollisionVerified:false,
  fullHeadCollisionContinuousVerified:false,
  sourceRockCollisionAuthorityUnchanged:true,
  realContactPhysicsVerified:false,
  skinApplied:false,
  playableCaveAuthorized:false,
  affectsEcology:false,affectsSave:false
 });
}
