/**
 * Project OHM SNAKE V0.7R — pure 3D HEAD/NECK GHOST TRANSITION.
 *
 * A read-only collar that joins the canonical V0.1 head's EXISTING back
 * ring to the V0.7Q 3D body's EXISTING first-bone end ring. This removes
 * the bulb-on-tube DISPLAY seam; it DOES NOT skin/morph the true head,
 * alter any vertebra, solve neck IK, contact forces or collision.
 *
 * Resampling/visual head-size normalization NEVER moves any owned source
 * ring: original head mesh is still authoritative for safety collision.
 * A separate display-only head shell is explicitly labeled and frozen.
 * The 16 vs 12 vertex loops are aligned by minimizing actual XYZ distance,
 * then blended in 3D before projecting with the SAME V0.7G glass camera.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_HEAD_NECK_BRIDGE_VERSION='0.7R';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const valid3=p=>p&&[p.x,p.y,p.z].every(finite);
const err=reason=>{throw new RangeError(reason)};
const dist=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
const P=(x,y,z)=>F({x,y,z});
const Q=p=>F({x:p.x,y:p.y});
const midpoint=points=>P(
 points.reduce((s,p)=>s+p.x,0)/points.length,
 points.reduce((s,p)=>s+p.y,0)/points.length,
 points.reduce((s,p)=>s+p.z,0)/points.length
);
const ease=u=>u*u*(3-2*u);
const mix=(p,q,t)=>P(p.x+(q.x-p.x)*t,p.y+(q.y-p.y)*t,p.z+(q.z-p.z)*t);
function sampleLoop(ring,count){
 const n=ring.length;
 return F(Array.from({length:count},(_,i)=>{
  const u=i*n/count,j=Math.floor(u)%n;
  return mix(ring[j],ring[(j+1)%n],u-Math.floor(u));
 }));
}
function alignToHead(head,body){
 const n=head.length;
 let best=null,bestScore=Infinity,bestOrder=0;
 for(const reverse of [false,true])
  for(let shift=0;shift<n;shift++){
   const loop=Array.from({length:n},(_,i)=>
    body[((reverse?(-i+n)%n:i)+shift)%n]);
   const score=loop.reduce((s,p,i)=>{
    const d=dist(p,head[i]);
    return s+d*d;
   },0);
   if(score<bestScore){
    bestScore=score;best=loop;
    bestOrder=shift+(reverse?n:0);
   }
  }
 return F({points:F(best),alignmentOrder:bestOrder,matchSse:bestScore});
}
function profile(rings){
 const centerWorld=F(rings.map(midpoint));
 const centers=F(centerWorld.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const projected=F(rings.map(r=>
  F(r.map(p=>projectSnakeFrontGlassPointV07g(p)))));
 const a=[],b=[],widths=[];
 for(let i=0;i<rings.length;i++){
  const before=centers[Math.max(0,i-1)];
  const after=centers[Math.min(centers.length-1,i+1)];
  let dx=after.x-before.x,dy=after.y-before.y;
  if(Math.hypot(dx,dy)<1e-6){
   dx=centers.at(-1).x-centers[0].x;
   dy=centers.at(-1).y-centers[0].y;
  }
  if(Math.hypot(dx,dy)<1e-6)err('flat_projected_head_neck');
  const norm=Math.hypot(dx,dy),nx=-dy/norm,ny=dx/norm;
  let min=Infinity,max=-Infinity,lo=null,hi=null;
  for(const p of projected[i]){
   const v=(p.x-centers[i].x)*nx+(p.y-centers[i].y)*ny;
   if(v<min){min=v;lo=p;}
   if(v>max){max=v;hi=p;}
  }
  if(max-min<.05)err('projected_head_neck_volume_too_thin');
  a.push(lo);b.push(hi);widths.push(max-min);
 }
 const outerA=F(a),outerB=F(b);
 return F({
  centers,worldCenters:centerWorld,projectedRings:projected,
  outerA,outerB,outline:F([...outerA,...outerB.slice().reverse()]),
  minimumThickness:Math.min(...widths)
 });
}
function validate(pose,head,volume,sections){
 if(!pose||!Array.isArray(pose.points)||pose.points.length<10||
    ![pose.bodyRadius,pose.segmentLength].every(finite)||
    head?.version!=='0.1'||!Array.isArray(head.meshPositions)||
    head.meshPositions.length<64||
    head.meshPositions.length>512||
    head.meshPositions.length%16!==0||
    !head.meshPositions.every(valid3)||
    !head.neck||!valid3(head.origin)||
    !valid3(head.neck.first)||!valid3(head.neck.second)||
    !valid3(head.neck.third)||
    volume?.version!=='0.7Q'||
    volume.skinApplied!==false||volume.bonesChanged!==false||
    !Array.isArray(volume.worldCenters)||
    !Array.isArray(volume.worldRings)||
    volume.sourceJointCount!==pose.points.length||
    volume.sectionsPerBone<2||
    volume.radialSegments<8||
    !Number.isInteger(sections)||sections<4||sections>12)
  err('invalid_v07r_source_geometry');
 if(dist(head.origin,pose.points[0])>1e-6||
    dist(head.neck.first,pose.points[0])>1e-6||
    dist(head.neck.second,pose.points[1])>1e-6||
    dist(head.neck.third,pose.points[2])>1e-6||
    dist(volume.worldCenters[0],pose.points[0])>2e-5||
    dist(volume.worldCenters[volume.sectionsPerBone],
      pose.points[1])>2e-5)
  err('head_body_source_joint_mismatch');
 for(let i=1;i<pose.points.length;i++)
  if(Math.abs(dist(pose.points[i-1],pose.points[i])-
       pose.segmentLength)>1e-5)
   err('v07r_source_bone_length_changed');
 const join=volume.worldRings[volume.sectionsPerBone];
 if(!Array.isArray(join)||join.length!==volume.radialSegments||
    !join.every(valid3))
  err('v07r_invalid_body_join_ring');
}
export function buildTransparentHeadNeckBridgeV07r({
 pose,head,volume,sections=8
}={}){
 validate(pose,head,volume,sections);
 const sourceHead=F(Array.from({
  length:head.meshPositions.length/16
 },(_,i)=>F(head.meshPositions.slice(i*16,(i+1)*16))));
 const center=midpoint(sourceHead[0]);
 const headRadius=sourceHead[0].reduce((sum,p)=>sum+dist(p,center),0)/16;
 const displayScale=Math.min(1,pose.bodyRadius*1.12/headRadius);
 if(!Number.isFinite(displayScale)||displayScale<.22)
  err('head_art_proportions_outside_safe_lab_scale');
 // VISUAL ONLY: original head.meshPositions remain untouched and continue
 // to drive the existing head collision checks. An explicit, local debug
 // shrink counteracts oversized legacy head dimensions without silently
 // changing the source animal's collision geometry or saved anatomy.
 const displayHead=F(sourceHead.map(ring=>F(ring.map(p=>
  mix(head.origin,p,displayScale)))));
 const rear=displayHead[0];
 const joinIndex=volume.sectionsPerBone;
 const body=sampleLoop(volume.worldRings[joinIndex],16);
 const alignment=alignToHead(rear,body);
 const rings=F(Array.from({length:sections+1},(_,i)=>{
  const u=i/sections,w=ease(u);
  return F(rear.map((p,j)=>mix(p,alignment.points[j],w)));
 }));
 const bridge=profile(rings);
 const headShape=profile(displayHead);
 return F({
  version:SNAKE_HEAD_NECK_BRIDGE_VERSION,
  status:'source_head_to_volume_3d_translucent_collaring_not_neck_ik_or_skin',
  sourceHeadVersion:head.version,sourceVolumeVersion:volume.version,
  camera:'V0.7G_front_glass',
  sourceJointCount:pose.points.length,
  bodyJoinRingIndex:joinIndex,
  headRingCount:displayHead.length,collarRingCount:rings.length,
  radialSegments:16,alignmentOrder:alignment.alignmentOrder,
  headDisplayScale:displayScale,headDisplayOnlyRescale:true,
  sourceHeadWorldRings:sourceHead,headWorldRings:displayHead,
  alignmentSse:alignment.matchSse,
  collarWorldRings:rings,
  headProjection:headShape,collarProjection:bridge,
  sourceHeadRearRing:sourceHead[0],displayHeadRearRing:rear,
  sourceBodyJoinRing:body,
  sourceBodyEndpointPreserved:true,skinApplied:false,
  bonesChanged:false,headMeshChanged:false,
  neckIKVerified:false,collisionMeshVerified:false,
  playableCaveAuthorized:false,affectsEcology:false,affectsSave:false
 });
}
