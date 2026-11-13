/**
 * V1.1C public STATIC rest-coil candidate (head rework) using a true 3D tube.
 * Nothing here advances V0.9U motion or edits source collision/saves.
 * Original cranium lives in static-anatomy-v11b.mjs.
 */
import {buildWarmveinStaticHeadV11c}
 from './warmvein-static-anatomy-v11c.mjs';
export const WARMVEIN_STATIC_COIL_V11C='1.1C-static-rest';
const controls=[
 [-1.08,0],[-1.28,0],[-1.49,-.13],[-1.55,-.40],
 [-1.40,-.65],[-1.05,-.77],[-.67,-.65],[-.43,-.34],
 [-.55,.02],[-.91,.24],[-1.36,.17],[-1.84,-.08],
 [-1.99,-.51],[-1.69,-.96],[-1.20,-1.12],[-.75,-1.17],
 [-.38,-1.02],[-.17,-.81]
];
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const l=Math.hypot(...a);return a.map(x=>x/Math.max(1e-10,l))};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const catmull=(p0,p1,p2,p3,t)=>[0,1].map(j=>.5*(
 (2*p1[j])+(-p0[j]+p2[j])*t+
 (2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t*t+
 (-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t*t*t));
const samples=120,radial=20;
function curve(t){
 const seg=t*(controls.length-1),i=Math.min(controls.length-2,Math.floor(seg));
 const p=catmull(controls[Math.max(0,i-1)],controls[i],
  controls[i+1],controls[Math.min(controls.length-1,i+2)],seg-i);
 // Slightly irregular natural resting curvature, below the measured
 // static projected clearance; never a procedural motion simulation.
 const fall=Math.sin(Math.PI*t);
 return [p[0]+.0035*Math.sin(t*11*Math.PI)*fall,
  p[1]+.004*Math.sin(t*7*Math.PI+.35)*fall];
}
function radius(t){
 const main=.073+.022*Math.sin(Math.PI*Math.pow(t,.84))**1.2+
  .0015*Math.sin(t*19*Math.PI)*Math.sin(Math.PI*t);
 if(t<.73)return main;
 const u=(t-.73)/.27;
 return main*(1-u)**1.6+.002*u;
}
function tubePoint(i,j){
 const t=i/samples,p=curve(t),
  ahead=curve(clamp(t+.001,0,1)),
  behind=curve(clamp(t-.001,0,1)),
  tan=unit(sub(ahead,behind)),
  lateral=[-tan[1],tan[0]],phi=2*Math.PI*j/radial;
 const r=radius(t);
 const elev=clamp(t*7,0,1);
 const centerZ=.113*(1-elev)+(r*.92)*elev;
 return [p[0]+lateral[0]*r*Math.cos(phi),
  p[1]+lateral[1]*r*Math.cos(phi),
  centerZ+r*.88*Math.sin(phi)];
}
function auditClearance(){
 let min=Infinity,overlapPairs=0;
 for(let i=0;i<=samples;i++)for(let j=i+8;j<=samples;j++){
  const a=curve(i/samples),b=curve(j/samples);
  const gap=Math.hypot(...sub(a,b))-
   radius(i/samples)-radius(j/samples);
  if(gap<min)min=gap;
  if(gap<0)overlapPairs++;
 }
 return {minimumProjectedGap:min,overlapPairs,
  sampleSeparationThreshold:8,
  notActualSurfaceCollisionCertification:true};
}
export function buildWarmveinStaticCoilV11c({mouth='closed'}={}){
 const head=buildWarmveinStaticHeadV11c({pose:mouth}),
  vertices=[...head.vertices],colors=[...head.colors],
  normals=[...head.normals],counts={...head.materialTriangleCounts};
 for(let i=0;i<samples;i++)for(let j=0;j<radial;j++){
  const a=tubePoint(i,j),b=tubePoint(i+1,j),
   c=tubePoint(i+1,j+1),d=tubePoint(i,j+1);
  const theta=2*Math.PI*(j+.5)/radial;
  const belly=Math.sin(theta)<-.52;
  const base=belly?[.73,.68,.57]:[.56,.49,.40];
  const grain=(i%17===0&&j%5<2)?-.018:0;
  const color=base.map(x=>x+grain);
  for(const [p,q,r] of [[a,b,c],[a,c,d]]){
   const n=unit(cross(sub(q,p),sub(r,p)));
   for(const xyz of [p,q,r]){
    vertices.push(...xyz);colors.push(...color);normals.push(...n)
   }
   const group=belly?'body_belly':'body_dorsal';
   counts[group]=(counts[group]??0)+1;
  }
 }
 const clearance=auditClearance();
 if(clearance.overlapPairs>0)
  throw Error('v11c_self_overlap_static_control_curve');
 if(vertices.length/3<head.vertexCount+5000)
  throw Error('v11c_missing_static_body_geometry');
 return Object.freeze({
  version:WARMVEIN_STATIC_COIL_V11C,
  pose:'rest',mouth,
  vertexCount:vertices.length/3,
  triangleCount:vertices.length/9,
  vertices:new Float32Array(vertices),
  colors:new Float32Array(colors),
  normals:new Float32Array(normals),
  materialTriangleCounts:Object.freeze(counts),
  headTriangleCount:head.triangleCount,
  gapeDegrees:head.gapeDegrees,
  mouthGapAtMuzzleWorld:head.mouthGapAtMuzzleWorld,
  bodyRingCount:samples+1,bodyRadialSegments:radial,
  tailLastRadius:radius(1),bodyMidRadius:radius(.5),
  planarClearanceAudit:Object.freeze(clearance),
  oneContiguousCenterline:true,
  staticOnly:true,noOriginal24BoneControllerUsed:true,
  originalGameSaveUntouched:true,
  slightlyIrregularStaticRestShape:true,
  jawVideoReferenceUsed:true,artistApproved:false
 });
}
