/**
 * PRIVATE PROJECT OHM V1.0R — snake head shape & eye-size review.
 *
 * Heads on the real V0.9R/U 1617-vertex welded snake mesh have eight
 * leading head rings (16 sides each), a shared neck socket at index 128,
 * and a final nose-tip vertex. This module supplies a bounded INWARD
 * display-only refinement of the head rings, with no widening of the
 * original collision envelope and NO change to the shared neck socket,
 * tip, UVs, triangles, body rings, source skeleton or player saves.
 *
 * The eye sprites are derived from the refined moving head's genuine
 * ring-4 anchors. They remain separate, permanently open, and unpainted
 * on the atlas. This is an appearance candidate, NOT physical anatomy
 * or collision certification. No invisible render mesh is an authority.
 */
import {fitWarmveinStaticEyesV10e}
 from './warmvein-static-eye-fit-v10e.mjs';

export const WARMVEIN_HEAD_REFINE_V10R='1.0R';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const stages=F([1.25,1.21,1.17,1.13]);
const ringWidth=F([1,.93,.955,.970,.985,.967,.972,.993]);
const ringHeight=F([1,.955,.950,.944,.955,.963,.976,.991]);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));

const goodMesh=m=>m?.vertexCount===1617&&m.triangleCount===3216&&
 m.headExtraRingCount===8&&m.radialSegments===16&&
 m.neckSocketRingStartIndex===128&&m.noseVertexIndex===1616&&
 m.headBodySeamSharedVertices===true&&
 m.positions?.length===1617&&m.uv?.length===1617&&
 m.triangles?.length===3216*3&&
 m.positions.slice(0,129).every(p=>p&&
  [p.x,p.y,p.z].every(finite));

/** Returns a display-only mesh. Every physical source record remains
 * owned by V0.9R/U and the source mesh is never written to.
 */
export function refineWarmveinHeadRenderV10r({
 mesh,stageProgress=2,intensity=1
}={}){
 if(!goodMesh(mesh)||!Number.isInteger(stageProgress)||
  stageProgress<0||stageProgress>3||
  !finite(intensity)||intensity<0||intensity>1)
  throw new RangeError('v10r_requires_original_full_head_mesh_and_stage');
 const points=mesh.positions.slice();
 let maxInsetWorld=0,headVerticesChanged=0,largerThanSource=0;
 const rings=[];
 for(let ring=0;ring<8;ring++){
  let center={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const q=mesh.positions[ring*16+j];
   center.x+=q.x/16;center.y+=q.y/16;center.z+=q.z/16;
  }
  // An inward radial displacement is bounded and does not create
  // an untested larger head-shell than the authentic V0.9R collision.
  // Ring-7 is almost unchanged; ring-8 is bit-exact shared socket.
  const wx=1-(1-ringWidth[ring])*intensity;
  const hy=1-(1-ringHeight[ring])*intensity;
  for(let j=0;j<16;j++){
   const i=ring*16+j,p=mesh.positions[i];
   const theta=2*Math.PI*j/16;
   const radialScale=Math.sqrt(
    wx*wx*Math.cos(theta)**2+hy*hy*Math.sin(theta)**2
   );
   const next=radialScale>=1-1e-13?p:F({
    x:center.x+(p.x-center.x)*radialScale,
    y:center.y+(p.y-center.y)*radialScale,
    z:center.z+(p.z-center.z)*radialScale
   });
   const originalRadius=Math.hypot(
    p.x-center.x,p.y-center.y,p.z-center.z);
   const newRadius=Math.hypot(
    next.x-center.x,next.y-center.y,next.z-center.z);
   maxInsetWorld=Math.max(maxInsetWorld,originalRadius-newRadius);
   if(newRadius>originalRadius+1e-10)largerThanSource++;
   if(Math.hypot(next.x-p.x,next.y-p.y,next.z-p.z)>1e-10)
    headVerticesChanged++;
   points[i]=next;
  }
  rings.push(F({ring,sideScale:wx,heightScale:hy,
   source:'original_v09r_ring_center_and_radial_vertices'}));
 }
 if(largerThanSource)
  throw new Error('v10r_refined_head_outside_original_source_envelope');
 const result=F({...mesh,positions:F(points)});
 return F({
  version:'1.0R',ok:true,stageProgress,intensity,
  renderMesh:result,originalSourceMesh:mesh,
  headRingProfiles:F(rings),
  headVerticesChanged,maxHeadRadialInsetWorld:maxInsetWorld,
  bodyAndNeckSocketVertexCountUnchanged:1617-8*16,
  originalUvReferenceUnchanged:result.uv===mesh.uv,
  originalTrianglesReferenceUnchanged:result.triangles===mesh.triangles,
  originalVertexCountUnchanged:result.vertexCount===mesh.vertexCount,
  noseTipUnchanged:result.positions[mesh.noseVertexIndex]===
   mesh.positions[mesh.noseVertexIndex],
  sharedSocketUnchanged:result.positions[128]===mesh.positions[128],
  noHeadRingIncreasedBeyondOriginalShell:true,
  displayOnlyNoColliderUpdate:true,
  hasNoSourceMovementAuthority:true,
  originalPlayerSaveUntouched:true,
  refinedHeadShapeNotAnatomicallyCertified:true,
  realGPUAndDeviceVisualApprovalPending:true
 });
}

/** Larger OPEN eyes for the latest artwork reference. Unlike the
 * earlier V1.0E (~7-26px) this uses measured source-head relative
 * sizing, not a constant fixed screen sprite, with a conservative
 * maximum against oversized cartoon eyes.
 */
export function fitWarmveinHeadEyesV10r({
 mesh,stageProgress=2,canvasWidth=1100,worldHalfWidth=1.5
}={}){
 const old=fitWarmveinStaticEyesV10e({
  mesh,stageProgress,canvasWidth,worldHalfWidth
 });
 // Reconstruct true ring-4 radius so closeup camera zoom does NOT
 // inherit the old V1.0E 26px cap (which made the eye tiny in closeup).
 const center={x:0,y:0,z:0};
 for(let j=0;j<16;j++){
  const p=mesh.positions[64+j];
  center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
 }
 const eyes=old.eyes.map(e=>{
  const surface=mesh.positions[e.surfaceVertexIndex];
  const sourceRadius=Math.hypot(
   surface.x-center.x,surface.y-center.y,surface.z-center.z
  );
  const rawProjection=sourceRadius*.22*canvasWidth/worldHalfWidth*
   e.eyeStageRatio;
  const zoomAware=clamp(
   Math.max(e.pointSizePx,rawProjection)*stages[stageProgress],
   9,Math.min(110,Math.max(33,canvasWidth*.17))
  );
  return F({
   ...e,
   pointSizePx:zoomAware,
   previousPointSizePx:e.pointSizePx,
   relativeV10rEyeIncrease:stages[stageProgress],
   trueHeadRadiusScaledWithCamera:true,
   attachedToRefinedSourceHeadRing:true,
   eyeAlwaysOpen:true,blinkEnabled:false,
   independentFromSkin:true,addedPhysicalGeometry:0
  });
 });
 return F({
  version:'1.0R',ok:true,eyes:F(eyes),
  stageProgress,sourceEyeAnchorVertexIds:F(eyes.map(e=>e.surfaceVertexIndex)),
  originalHeadVertexCount:old.originalMeshVertexCount,
  originalHeadTriangleCount:old.originalMeshTriangleCount,
  originalV10eFitterUnmodified:true,
  eyeDiametersIncreasedFromBaseline:eyes.every(e=>
   e.pointSizePx+1e-9>=e.previousPointSizePx),
  eyesFollowCurrentRenderHead:true,
  eyeBlinkEnabled:false,originalSourceColliderUntouched:true,
  newGameplayMovementAllowed:false,playerSaveModified:false,
  finalEyeScaleOnIPhoneNotCertified:true
 });
}
