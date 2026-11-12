/**
 * Project OHM SNAKE V0.7Q — SOURCE-OWNED TRANSPARENT 3D RING VOLUME.
 *
 * A read-only, unskinned technical body projection from FIXED-LENGTH
 * already-accepted 3D bones, not a skin, species sculpt or collision mesh.
 * Interpolates between source bones without changing their endpoints.
 * A transported anatomical up frame keeps 3D cross sections oriented,
 * including during V0.7P glass-side rearing.
 *
 * Render only in the private lab. Source V0.3d rocks / V0.7C collisions
 * remain authoritative; this projected body cannot grant contact physics,
 * false burrow depth, climbability, or cave passability.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_TRANSPARENT_VOLUME_VERSION='0.7Q';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const inRange=(x,a,b)=>finite(x)&&x>=a&&x<=b;
const fail=x=>{throw new RangeError(x)};
const vec=(x,y,z)=>F({x,y,z});
const sub=(a,b)=>vec(a.x-b.x,a.y-b.y,a.z-b.z);
const add=(a,b)=>vec(a.x+b.x,a.y+b.y,a.z+b.z);
const mul=(a,t)=>vec(a.x*t,a.y*t,a.z*t);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>vec(
 a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x
);
const len=a=>Math.hypot(a.x,a.y,a.z);
const norm=a=>{
 const d=len(a);
 if(d<1e-9)fail('degenerate_3d_cross_section');
 return mul(a,1/d);
};
const mix=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const q=x=>Math.round(x*1e6)/1e6;
const P=(x,y,z)=>F({x:q(x),y:q(y),z:q(z)});
function validate(pose,radialSegments,sectionsPerBone,widthScale,heightScale){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<10||pose.points.length>64||
    !inRange(pose.bodyRadius,.001,.5)||
    !inRange(pose.segmentLength,.001,1)||
    !Number.isInteger(radialSegments)||radialSegments<8||
    radialSegments>24||radialSegments%2!==0||
    !Number.isInteger(sectionsPerBone)||sectionsPerBone<2||
    sectionsPerBone>8||
    !inRange(widthScale,.3,1.1)||!inRange(heightScale,.25,1.1))
  fail('invalid_v07q_rig_or_art_factors');
 for(let i=0;i<pose.points.length;i++){
  const p=pose.points[i];
  if(!p||![p.x,p.y,p.z].every(finite)||
     !inRange(p.x,-4,4)||!inRange(p.y,-1.6,1.6)||
     !inRange(p.z,-.25,3))
   fail('invalid_v07q_source_joint');
  if(i>0){
   const delta=len(sub(p,pose.points[i-1]));
   if(Math.abs(delta-pose.segmentLength)>1e-5)
    fail('v07q_source_bone_must_be_fixed_length');
  }
 }
}
const smooth=t=>{
 const x=Math.max(0,Math.min(t,1));
 return x*x*(3-2*x);
};
function radiusFactor(u){
 // Author-directed ghost shape, NOT species anatomy or real growing skin.
 // The head socket is narrow, trunk stays round and tail tapers smoothly.
 const neck=.70+.30*smooth(u/.19);
 const taper=u<=.60?1:Math.max(.12,1-.88*smooth((u-.60)/.4));
 return neck*taper;
}
function axisAt(points,i){
 return norm(sub(
  points[Math.min(i+1,points.length-1)],
  points[Math.max(i-1,0)]
 ));
}
function transport(axes){
 let oldUp=null;
 const result=[];
 for(const tangent of axes){
  let up=sub(vec(0,0,1),mul(tangent,tangent.z));
  if(len(up)<.1&&oldUp)
   up=sub(oldUp,mul(tangent,dot(oldUp,tangent)));
  if(len(up)<.1){
   const ref=Math.abs(tangent.x)<.8?vec(1,0,0):vec(0,1,0);
   up=sub(ref,mul(tangent,dot(ref,tangent)));
  }
  up=norm(up);
  if(oldUp&&dot(up,oldUp)<0)up=mul(up,-1);
  const side=norm(cross(tangent,up));
  oldUp=up;
  result.push(F({up,side}));
 }
 return F(result);
}
function checkProjected(v){
 if(!v||!finite(v.x)||!finite(v.y))fail('invalid_3d_glass_projection');
 return v;
}
const minMaxFor=(rings,centers,i)=>{
 const before=centers[Math.max(0,i-1)];
 const after=centers[Math.min(centers.length-1,i+1)];
 let dx=after.x-before.x,dy=after.y-before.y;
 if(Math.hypot(dx,dy)<1e-6){
  if(i>0){dx=centers[i].x-centers[i-1].x;
   dy=centers[i].y-centers[i-1].y;}
  if(Math.hypot(dx,dy)<1e-6){dx=1;dy=0;}
 }
 const length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
 let low=Infinity,high=-Infinity,lo=null,hi=null;
 for(const p of rings[i]){
  const t=(p.x-centers[i].x)*nx+(p.y-centers[i].y)*ny;
  if(t<low){low=t;lo=p;}
  if(t>high){high=t;hi=p;}
 }
 if(!lo||!hi||high-low<.001)
  fail('v07q_unresolvable_projected_cross_section');
 return F({a:lo,b:hi,width:high-low});
};
export function buildTransparentBodyVolumeV07q({
 pose,radialSegments=12,sectionsPerBone=4,
 widthScale=.94,heightScale=.83
}={}){
 validate(pose,radialSegments,sectionsPerBone,widthScale,heightScale);
 const src=pose.points;
 const centers=[];
 for(let i=0;i<src.length-1;i++){
  for(let k=0;k<sectionsPerBone;k++){
   const t=k/sectionsPerBone;
   const c=mix(src[i],src[i+1],t);
   centers.push(P(c.x,c.y,c.z));
  }
 }
 centers.push(P(src.at(-1).x,src.at(-1).y,src.at(-1).z));
 const tangents=F(centers.map((_,i)=>axisAt(centers,i)));
 const frames=transport(tangents);
 const worldRings=[],projectedRings=[],radii=[];
 const screenCenters=F(centers.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const total=centers.length-1;
 for(let i=0;i<centers.length;i++){
  const r=pose.bodyRadius*radiusFactor(i/total);
  const a=r*widthScale,b=r*heightScale;
  const ring=[];
  for(let j=0;j<radialSegments;j++){
   const angle=j*2*Math.PI/radialSegments;
   const p=add(centers[i],add(
    mul(frames[i].side,Math.cos(angle)*a),
    mul(frames[i].up,Math.sin(angle)*b)
   ));
   const v=P(p.x,p.y,p.z);
   // Projection refuses any out-of-scene body shell instead of silently
   // clipping a ghost body through a glass boundary.
   ring.push(v);
  }
  const visible=F(ring.map(p=>checkProjected(
   projectSnakeFrontGlassPointV07g(p)
  )));
  worldRings.push(F(ring));
  projectedRings.push(visible);
  radii.push(F({sideRadius:q(a),upRadius:q(b)}));
 }
 const bands=F(projectedRings.map((_,i)=>minMaxFor(
  projectedRings,screenCenters,i
 )));
 const outerA=F(bands.map(p=>p.a));
 const outerB=F(bands.map(p=>p.b));
 return F({
  version:SNAKE_TRANSPARENT_VOLUME_VERSION,
  status:'explicit_3d_ghost_sections_in_front_glass_not_species_skin',
  camera:'V0.7G_front_glass',
  sourceJointCount:src.length,
  sourceBoneCount:src.length-1,
  radialSegments,sectionsPerBone,
  ringCount:worldRings.length,
  worldCenters:F(centers),
  projectedCenters:screenCenters,
  worldRings:F(worldRings),
  projectedRings:F(projectedRings),
  radii:F(radii),
  outerA,outerB,
  outline:F([...outerA,...outerB.slice().reverse()]),
  minimumProjectedThickness:Math.min(...bands.map(b=>b.width)),
  skinApplied:false,
  bonesChanged:false,
  physicalBodyCollisionVerified:false,
  substrateOcclusionVerified:false,
  glassContactPhysicsVerified:false,
  playableCaveAuthorized:false,
  affectsEcology:false,affectsSave:false
 });
}
