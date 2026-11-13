/**
 * PRIVATE Project OHM V1.0H - transparent anatomical silhouette candidate.
 *
 * Operates ONLY on a validated full-size 1,617-vertex / 3,216-face
 * V0.9U head/body geometry. Width reduction is in the original ring's
 * LOCAL LATERAL direction; vertical/top/bottom/ground contact are NOT
 * moved, and V0.9T skeleton, V0.9U geometry, UV or physics capsule
 * collision shell are never modified.
 *
 * IMPORTANT: this is a renderer-only comparison candidate. Because
 * the physical collider remains original width, do NOT integrate into
 * gameplay or claim corrected physics, real biology or true skin/gait.
 */
export const WARMVEIN_TRANSPARENT_BODY_FIT_V10H='1.0H';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const PROFILE=F([
 F({ring:0,sideScale:1}),
 F({ring:2,sideScale:.975}),
 F({ring:4,sideScale:.945}),
 F({ring:7,sideScale:.915}),
 F({ring:8,sideScale:.915}), // original welded neck socket
 F({ring:14,sideScale:.895}),
 F({ring:24,sideScale:.875}),
 F({ring:48,sideScale:.860}),
 F({ring:68,sideScale:.885}),
 F({ring:84,sideScale:.925}),
 F({ring:100,sideScale:.980})
]);
export const WARMVEIN_V10H_LATERAL_PROFILE=PROFILE;
const scaleAt=ring=>{
 for(let i=0;i<PROFILE.length-1;i++){
  const a=PROFILE[i],b=PROFILE[i+1];
  if(ring<=b.ring){
   const t=smooth((ring-a.ring)/(b.ring-a.ring));
   return a.sideScale+(b.sideScale-a.sideScale)*t;
  }
 }
 return PROFILE.at(-1).sideScale;
};
function reject(code){throw new RangeError('v10h_'+code);}
function validate(mesh){
 if(mesh?.vertexCount!==1617||mesh?.triangleCount!==3216||
   mesh?.positions?.length!==1617||mesh?.uv?.length!==1617||
   mesh?.triangles?.length!==9648||
   mesh?.radialSegments!==16||mesh?.headExtraRingCount!==8||
   mesh?.neckSocketRingStartIndex!==128||
   mesh?.headBodySeamSharedVertices!==true)
  reject('unexpected_source_mesh_topology');
 for(const p of mesh.positions)
  if(![p?.x,p?.y,p?.z].every(finite))
   reject('nonfinite_source_vertex');
}
/**
 * Input a real candidate.mesh rather than independently made points
 * when running the actual preview. For local unit tests, a true-sized
 * topology-conformant synthetic ring mesh exercises the math.
 */
export function makeWarmveinTransparentBodyFitV10h({
 sourceMesh,stageProgress=2,intensity=1
}={}){
 validate(sourceMesh);
 if(!Number.isInteger(stageProgress)||
    stageProgress<0||stageProgress>3||
    !finite(intensity)||intensity<0||intensity>1)
  reject('invalid_stage_or_intensity');
 const points=sourceMesh.positions,output=new Array(1617);
 const ringMeasurements=[];
 let mostWidthChange=0,maximumCenterShift=0;
 let largestVerticalVertexMovement=0;
 let edgeProfileJump=0;
 let oldSideMax=0,newSideMax=0;
 for(let ring=0;ring<101;ring++){
  const first=ring*16;
  const center={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const p=points[first+j];
   center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
  }
  const axis={
   x:points[first].x-center.x,
   y:points[first].y-center.y,
   z:points[first].z-center.z
  };
  const axisNorm=Math.hypot(axis.x,axis.y,axis.z);
  if(axisNorm<1e-6)reject('degenerate_lateral_axis');
  const lateral={
   x:axis.x/axisNorm,y:axis.y/axisNorm,z:axis.z/axisNorm
  };
  const factor=1-intensity*(1-scaleAt(ring));
  let minSourceZ=Infinity,maxSourceZ=-Infinity,
   minOutputZ=Infinity,maxOutputZ=-Infinity;
  let sideOriginal=0,sideRefined=0;
  for(let j=0;j<16;j++){
   const p=points[first+j];
   const displacement={
    x:p.x-center.x,y:p.y-center.y,z:p.z-center.z
   };
   const along=dot(displacement,lateral);
   const shrink=along*(1-factor);
   // Reproject only the lateral component of this precise source ring.
   // At rotated 3D rings, tiny vertical shifts are possible because
   // the local lateral axis can tilt. A tilt is reflected in diagnostics.
   const q=F({
    x:p.x-lateral.x*shrink,
    y:p.y-lateral.y*shrink,
    z:p.z-lateral.z*shrink
   });
   output[first+j]=q;
   mostWidthChange=Math.max(mostWidthChange,dist(p,q));
   largestVerticalVertexMovement=Math.max(
    largestVerticalVertexMovement,Math.abs(p.z-q.z));
   sideOriginal=Math.max(sideOriginal,Math.abs(along));
   sideRefined=Math.max(sideRefined,Math.abs(along*factor));
   minSourceZ=Math.min(minSourceZ,p.z);
   maxSourceZ=Math.max(maxSourceZ,p.z);
   minOutputZ=Math.min(minOutputZ,q.z);
   maxOutputZ=Math.max(maxOutputZ,q.z);
  }
  oldSideMax=Math.max(oldSideMax,sideOriginal);
  newSideMax=Math.max(newSideMax,sideRefined);
  const centroid={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const p=output[first+j];
   centroid.x+=p.x/16;centroid.y+=p.y/16;centroid.z+=p.z/16;
  }
  maximumCenterShift=Math.max(maximumCenterShift,dist(center,centroid));
  ringMeasurements.push(F({
   ring,sideScale:factor,originalSideRadius:sideOriginal,
   displaySideRadius:sideRefined,
   originalMinimumZ:minSourceZ,displayMinimumZ:minOutputZ,
   originalMaximumZ:maxSourceZ,displayMaximumZ:maxOutputZ
  }));
  if(ring>0)edgeProfileJump=Math.max(edgeProfileJump,
   Math.abs(factor-ringMeasurements[ring-1].sideScale));
 }
 // Never move the existing nose cap/tip or change UV seam topology.
 output[1616]=points[1616];
 // Immutable stage-specific renderer-only mesh. UV, triangles and
 // physical collision source are the exact ORIGINAL references.
 const renderMesh=F({
  ...sourceMesh,positions:F(output),
  v10hRendererOnly:true,
  v10hSourceMeshReference:sourceMesh
 });
 return F({
  version:'1.0H',ok:true,renderMesh,
  originalSourceMesh:sourceMesh,
  profile:PROFILE,
  stageProgress,intensity,
  sourceHeadToBodySeamShared:true,
  unchangedUVReference:renderMesh.uv===sourceMesh.uv,
  unchangedTriangleReference:
   renderMesh.triangles===sourceMesh.triangles,
  maximumRingCenterShiftWorld:maximumCenterShift,
  maximumVisualPointAdjustmentWorld:mostWidthChange,
  maximumVerticalAdjustmentWorld:largestVerticalVertexMovement,
  maximumProfileStep:edgeProfileJump,
  largestOriginalSideRadiusWorld:oldSideMax,
  largestDisplaySideRadiusWorld:newSideMax,
  measurements:F(ringMeasurements),
  originalV09tSkeletonUnchanged:true,
  originalCollisionShellUnchanged:true,
  contactAndGroundPhysicsUnchanged:true,
  actualAestheticQualityCertified:false,
  actualGameplayPhysicsCertified:false,
  realDeviceRendered:false,
  originalSourceNeverMutated:true,
  blinkEnabled:false,gameSaveModified:false
 });
}
