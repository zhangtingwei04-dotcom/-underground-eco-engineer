/**
 * PUBLIC V1.0Y: geometry-driven but RENDERER-ONLY snake-head prototype.
 *
 * The shared ring 8 and every body ring retain the original positions.
 * The real V0.9T / V0.9U source pose, 24 joints, UV, triangle indices,
 * collision shell and save are not changed. The new shape uses the
 * original V0.9R head's local lateral & vertical ring bases, not a
 * flattened 2D overlay or another asset's proprietary mesh.
 *
 * The forward-most muzzle becomes narrow, the cheek/jaw stays broader
 * behind it, and the crown is flatter. Still an unapproved art model.
 */
import {fitWarmveinHeadEyesV10r}
 from './warmvein-head-refine-v10r.mjs';

export const WARMVEIN_HEAD_SHAPE_V10Y='1.0Y';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const SCALES=F([
 F({ring:0,width:.76,height:.71}),
 F({ring:1,width:.76,height:.73}),
 F({ring:2,width:.72,height:.73}),
 F({ring:3,width:.73,height:.72}),
 F({ring:4,width:.74,height:.70}),
 F({ring:5,width:.77,height:.72}),
 F({ring:6,width:.83,height:.82}),
 F({ring:7,width:.94,height:.94})
]);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=a=>Math.hypot(a.x,a.y,a.z);
const diff=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const scale=(a,t)=>({x:a.x*t,y:a.y*t,z:a.z*t});
const sum=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
function requiredMesh(mesh){
 return mesh?.vertexCount===1617&&mesh.triangleCount===3216&&
  mesh.radialSegments===16&&mesh.headExtraRingCount===8&&
  mesh.headBodySeamSharedVertices===true&&
  mesh.neckSocketRingStartIndex===128&&
  mesh.noseVertexIndex===1616&&
  mesh.positions?.length===1617&&mesh.uv?.length===1617&&
  mesh.triangles?.length===9648&&
  mesh.positions.every(p=>p&&[p.x,p.y,p.z].every(finite));
}
export function sculptWarmveinHeadV10y({sourceMesh,stageProgress=2}={}){
 if(!requiredMesh(sourceMesh)||!Number.isInteger(stageProgress)||
  stageProgress<0||stageProgress>3)
  throw new RangeError('v10y_requires_real_welded_head_mesh');
 const positions=sourceMesh.positions.slice();
 const ringMeasurements=[];
 let maxInward=0,maxCenterDrift=0,vertexChanges=0,maxWiden=0;
 for(const {ring,width,height} of SCALES){
  const start=ring*16;
  const center={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const p=sourceMesh.positions[start+j];
   center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
  }
  const va=diff(sourceMesh.positions[start],center);
  const vb=diff(sourceMesh.positions[start+4],center);
  const na=norm(va),nb=norm(vb);
  if(na<1e-8||nb<1e-8)
   throw new RangeError('v10y_invalid_ring_axes');
  const A=scale(va,1/na),B=scale(vb,1/nb);
  if(Math.abs(dot(A,B))>1e-4)
   throw new RangeError('v10y_nonorthogonal_head_ring');
  const newCenter={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const idx=start+j,p=sourceMesh.positions[idx];
   const d=diff(p,center);
   const u=dot(d,A),v=dot(d,B);
   // Orthogonal source ring basis; use inward-only contraction.
   const tangent=sum(scale(A,u*width),scale(B,v*height));
   const residual=diff(d,sum(scale(A,u),scale(B,v)));
   const next=F(sum(center,sum(tangent,residual)));
   const r0=norm(d),r1=norm(diff(next,center));
   maxWiden=Math.max(maxWiden,r1-r0);
   maxInward=Math.max(maxInward,r0-r1);
   if(norm(diff(next,p))>1e-11)vertexChanges++;
   positions[idx]=next;
   newCenter.x+=next.x/16;
   newCenter.y+=next.y/16;
   newCenter.z+=next.z/16;
  }
  maxCenterDrift=Math.max(maxCenterDrift,norm(diff(newCenter,center)));
  ringMeasurements.push(F({
   ring,lateralWidthRelative:width,crownHeightRelative:height,
   maximumSourceRadius:Math.max(na,nb),
   displayOnly:true
  }));
 }
 // Welded neck ring 8, body 9..100, and tip 1616 must be BIT-IDENTICAL.
 const exactlyPreserved=positions.slice(128).every(
  (p,j)=>p===sourceMesh.positions[128+j]);
 if(!exactlyPreserved||maxWiden>1e-10||maxCenterDrift>1e-9||
  vertexChanges<80)
  throw new Error('v10y_non_inward_or_source_weld_violation');
 const renderMesh=F({
  ...sourceMesh,positions:F(positions),
  v10yDisplayOnlyHead:true,v10yOriginalMeshReference:sourceMesh
 });
 return F({
  version:WARMVEIN_HEAD_SHAPE_V10Y,ok:true,
  stageProgress,renderMesh,originalSourceMesh:sourceMesh,
  modifiedHeadVertices:vertexChanges,
  maximumInwardShrinkWorld:maxInward,
  maximumOutwardGrowthWorld:maxWiden,
  maximumOriginalRingCenterDriftWorld:maxCenterDrift,
  originalHeadSocketAndBodyBitIdentical:exactlyPreserved,
  originalNoseTipUnchanged:positions[1616]===sourceMesh.positions[1616],
  originalUVUnchanged:renderMesh.uv===sourceMesh.uv,
  originalTrianglesUnchanged:renderMesh.triangles===sourceMesh.triangles,
  original24JointsAndColliderUnchanged:true,
  originalPlayerSavesUnchanged:true,
  allEyeAnchorsStillOnOriginalHeadRing4:true,
  ringMeasurements:F(ringMeasurements),
  skullAnatomyAndVisualApprovalPending:true
 });
}

/** Smaller independent eyes, built from the same two moving ring-4
 * attachment vertices. V1.0X continues to decide near-side visibility.
 */
export function fitWarmveinNaturalEyesV10y({
 mesh,stageProgress=2,canvasWidth=1100,worldHalfWidth=1.5
}={}){
 const earlier=fitWarmveinHeadEyesV10r({
  mesh,stageProgress,canvasWidth,worldHalfWidth
 });
 const eyes=earlier.eyes.map(e=>F({
  ...e,
  pointSizePx:clamp(e.pointSizePx*.68,4,22),
  oldLargeEyeSizePx:e.pointSizePx,
  sourceSurfaceAnchorUnmoved:true,
  visualEyeOnly:true
 }));
 return F({
  ...earlier,version:'1.0Y',eyes:F(eyes),
  eyeMaterialIndependentlyDrawn:true,
  bothEyeAnchorsStillTracked:true,
  noBlink:true,physicalHeadAndSaveUnchanged:true
 });
}
