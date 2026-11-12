/**
 * Public, original neutral snake morphology V0.9F. A transparent,
 * display-only 3D volume study that reuses canonical 24-joint geometry.
 *
 * Important: DO NOT treat this mesh as an approved physics collider.
 * The 0.7S source head/terrain/rock and 0.9D/E self-contact gates remain
 * unchanged and authoritative. New visual silhouette MUST undergo
 * source-volume/terrain/sweep safety checks before gameplay promotion.
 *
 * This shape is a configurable GENERIC prototype, NOT certified anatomy
 * for corn snakes, western hognose snakes, or an OHM original species.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_TRANSPARENT_MORPHOLOGY_V09F='0.9F';
const F=Object.freeze;
const P=(x,y,z)=>F({x,y,z});
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const add=(a,b)=>P(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>P(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(p,n)=>P(p.x*n,p.y*n,p.z*n);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>P(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const length=v=>Math.hypot(v.x,v.y,v.z);
const norm=v=>{const l=length(v);if(l<1e-9)throw new RangeError('v09f_degenerate_tangent');return mul(v,1/l);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>{const v=clamp(t,0,1);return v*v*(3-2*v)};
const pos=(a,b,u)=>add(mul(a,1-u),mul(b,u));
const stopTable=F([
 F([0,.080]),F([.025,.077]),F([.09,.092]),
 F([.20,.099]),F([.40,.102]),F([.57,.098]),
 F([.67,.085]),F([.76,.070]),F([.84,.052]),
 F([.92,.032]),F([1,.010])
]);
export const NEUTRAL_SNAKE_MORPHOLOGY_V09F=F({
 id:'neutral_snake_morphology_v09f',
 designOnly:true,bodyRadiusReference:.13,
 // Horizontal body width is subtly elliptical, NOT a flattened ribbon.
 bodyVerticalRadiusFactor:.89,
 bodyWidthStops:stopTable,
 // Long-low nose, defined cranium, slim transition at back of head.
 headRings:F([
  F([-.055,.071,.063]),
  F([-.025,.082,.069]),
  F([0,.104,.076]),
  F([.045,.110,.079]),
  F([.090,.080,.065]),
  F([.140,.047,.044]),
  F([.178,.018,.022])
 ]),
 tailTarget:'smooth_taper_not_sudden_cone',
 skinApplied:false,scientificDimensionsMeasured:false
});
function validate(pose){
 if(!pose||pose.points?.length!==24||
  !finite(pose.segmentLength)||!finite(pose.bodyRadius)||
  Math.abs(pose.segmentLength*23-2.28)>1e-5||
  Math.abs(pose.bodyRadius-.13)>1e-8||
  !pose.points.every(p=>p&&[p.x,p.y,p.z].every(finite)))
  throw new RangeError('v09f_requires_canonical_24_joints');
 for(let i=1;i<24;i++)
  if(Math.abs(length(sub(pose.points[i],pose.points[i-1]))-
    pose.segmentLength)>1e-5)
   throw new RangeError('v09f_source_bone_length_changed');
}
export function neutralSnakeRadiusV09f(progress){
 if(!finite(progress)||progress<0||progress>1)
  throw new RangeError('v09f_invalid_body_progress');
 for(let i=1;i<stopTable.length;i++){
  if(progress<=stopTable[i][0]){
   const a=stopTable[i-1],b=stopTable[i],
    t=smooth((progress-a[0])/(b[0]-a[0]));
   return a[1]+(b[1]-a[1])*t;
  }
 }
 return stopTable.at(-1)[1];
}
function catmull(p0,p1,p2,p3,t){
 // Cubic Hermite with moderated tangents and continuous first derivative.
 // The integer control joints are always preserved; smooth interpolation
 // is RENDER ONLY and is not a bone-length or collision solver.
 const m1=mul(sub(p2,p0),.42),m2=mul(sub(p3,p1),.42);
 const t2=t*t,t3=t2*t;
 return add(add(mul(p1,2*t3-3*t2+1),mul(m1,t3-2*t2+t)),
  add(mul(p2,-2*t3+3*t2),mul(m2,t3-t2)));
}
function poseCenter(points,i,u){
 const p0=points[Math.max(0,i-1)],p1=points[i],
  p2=points[i+1],p3=points[Math.min(23,i+2)];
 return catmull(p0,p1,p2,p3,u);
}
function axes(tangent){
 const t=norm(tangent);
 let lateral=cross(P(0,0,1),t);
 if(length(lateral)<.03)lateral=cross(P(0,1,0),t);
 lateral=norm(lateral);
 const vertical=norm(cross(t,lateral));
 return {lateral,vertical};
}
function ellipticalRing(center,tangent,rx,rz,radial){
 const {lateral,vertical}=axes(tangent);
 return F(Array.from({length:radial},(_,i)=>{
  const angle=2*Math.PI*i/radial;
  return add(center,add(mul(lateral,rx*Math.cos(angle)),
   mul(vertical,rz*Math.sin(angle))));
 }));
}
function outline(rings){
 const center=F(rings.map(r=>P(
  r.reduce((s,p)=>s+p.x,0)/r.length,
  r.reduce((s,p)=>s+p.y,0)/r.length,
  r.reduce((s,p)=>s+p.z,0)/r.length
 )));
 const drawn=F(rings.map(r=>F(r.map(p=>
  projectSnakeFrontGlassPointV07g(p)))));
 const centers2=F(center.map(p=>projectSnakeFrontGlassPointV07g(p)));
 const outerA=[],outerB=[],widths=[];
 for(let i=0;i<rings.length;i++){
  const prev=centers2[Math.max(0,i-1)],next=centers2[
   Math.min(centers2.length-1,i+1)];
  let dx=next.x-prev.x,dy=next.y-prev.y;
  if(Math.hypot(dx,dy)<.000001){dx=1;dy=0;}
  const len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
  let low=null,high=null,min=Infinity,max=-Infinity;
  for(const p of drawn[i]){
   const v=(p.x-centers2[i].x)*nx+(p.y-centers2[i].y)*ny;
   if(v<min){min=v;low=p;}
   if(v>max){max=v;high=p;}
  }
  outerA.push(low);outerB.push(high);widths.push(max-min);
 }
 return F({
  centers3d:center,centers2d:centers2,
  outerA:F(outerA),outerB:F(outerB),
  outline:F([...outerA,...outerB.slice().reverse()]),
  minimumWidthPx:Math.min(...widths),
  maximumWidthPx:Math.max(...widths),
  rasterSource:'same_3d_candidate_rings_front_glass'
 });
}
/** Frozen, deterministic new candidate with unchanged canonical source. */
export function buildNeutralSnakeTransparentMorphologyV09f({
 pose,sectionsPerBone=6,radial=12
}={}){
 validate(pose);
 if(!Number.isInteger(sectionsPerBone)||sectionsPerBone<4||
   sectionsPerBone>10||!Number.isInteger(radial)||
   radial<8||radial>24||radial%2)
  throw new RangeError('v09f_invalid_mesh_resolution');
 const N=23*sectionsPerBone;
 const body=[],centerline=[],radii=[];
 for(let k=0;k<=N;k++){
  const segment=Math.min(22,Math.floor(k/sectionsPerBone));
  const u=k===N?1:k/sectionsPerBone-segment;
  const center=poseCenter(pose.points,segment,u);
  const prev=poseCenter(pose.points,segment,Math.max(0,u-.002));
  const next=poseCenter(pose.points,segment,Math.min(1,u+.002));
  const tangent=length(sub(next,prev))>1e-8?
   sub(next,prev):sub(pose.points[segment+1],pose.points[segment]);
  const radius=neutralSnakeRadiusV09f(k/N);
  centerline.push(center);radii.push(radius);
  body.push(ellipticalRing(center,tangent,radius,
   radius*NEUTRAL_SNAKE_MORPHOLOGY_V09F.bodyVerticalRadiusFactor,radial));
 }
 const f=norm(sub(pose.points[0],pose.points[1]));
 const head=NEUTRAL_SNAKE_MORPHOLOGY_V09F.headRings.map(
  ([forwardOffset,width,height])=>
   ellipticalRing(add(pose.points[0],mul(f,forwardOffset)),
    f,width,height,radial)
 );
 const bodyProjection=outline(body),headProjection=outline(head);
 const sourceJointAnchors=F(Array.from({length:24},(_,i)=>
  centerline[i*sectionsPerBone]));
 let maximumAnchorDrift=0;
 for(let i=0;i<24;i++)
  maximumAnchorDrift=Math.max(maximumAnchorDrift,
   length(sub(sourceJointAnchors[i],pose.points[i])));
 const sum=(r)=>r.flat().every(p=>[p.x,p.y,p.z].every(finite));
 if(maximumAnchorDrift>1e-7||!sum(body)||!sum(head))
  throw new RangeError('v09f_source_centers_or_vertices_invalid');
 return F({
  version:SNAKE_TRANSPARENT_MORPHOLOGY_V09F,ok:true,
  morphologyProfileId:NEUTRAL_SNAKE_MORPHOLOGY_V09F.id,
  sourceJointCount:24,sourceTotalLength:2.28,
  bodyRingCount:body.length,headRingCount:head.length,
  radialSegments:radial,bodyWorldRings:F(body),
  headWorldRings:F(head),bodyProjection,headProjection,
  centerline:F(centerline),radii:F(radii),
  headWidestRadius:.110,neckRadius:neutralSnakeRadiusV09f(0),
  midBodyRadius:neutralSnakeRadiusV09f(.4),
  tailTipRadius:neutralSnakeRadiusV09f(1),
  maximumSourceAnchorDrift:maximumAnchorDrift,
  sourceBonePositionsUnchanged:true,
  sourceHeadColliderUnchanged:true,
  existingV09dCollisionGuardUnchanged:true,
  displayCandidateOnly:true,
  visibleTriangleMeshCollisionCertified:false,
  selfMeshContactCertified:false,
  sourceSceneCollisionForNewMeshCertified:false,
  dynamicMorphologyTested:false,
  newHeadIsDisplayCandidateOnly:true,
  playerVisibleGameArtApproved:false,
  skinApplied:false,saveModified:false,privateSpeciesIntroduced:false
 });
}
