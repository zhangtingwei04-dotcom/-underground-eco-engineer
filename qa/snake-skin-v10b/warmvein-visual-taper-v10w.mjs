/**
 * PUBLIC V1.0W experimental renderer-only slim trunk / long natural tail.
 * Applied AFTER V0.9U source mesh validation, BEFORE head V1.0R sculpt.
 * Do not change any of the 24 source joints, physics/collision envelope,
 * UV/index topology, save state, or source motion steps.
 *
 * Protect the shared head socket ring 8 and retain the per-ring source
 * lowest Z so a smaller painted mesh does not visibly hover over ground.
 * This is NOT a biological anatomy or contact certification.
 */
export const WARMVEIN_VISUAL_TAPER_V10W='1.0W';
const F=Object.freeze;
const stops=F([
 F([8,1]),F([10,.988]),F([18,.89]),F([32,.77]),
 F([52,.75]),F([68,.71]),F([78,.61]),F([88,.43]),
 F([95,.21]),F([100,.042])
]);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const smooth=t=>t*t*(3-2*t);
function factorAt(ring){
 if(ring<=8)return 1;
 for(let i=1;i<stops.length;i++){
  const [right,f1]=stops[i],[left,f0]=stops[i-1];
  if(ring<=right){
   const t=smooth((ring-left)/(right-left));
   return f0+(f1-f0)*t;
  }
 }
 return stops.at(-1)[1];
}
function sourceValid(mesh){
 return mesh?.vertexCount===1617&&
  mesh.triangleCount===3216&&mesh.radialSegments===16&&
  mesh.headExtraRingCount===8&&mesh.bodyRingCount===93&&
  mesh.neckSocketRingStartIndex===128&&
  mesh.headBodySeamSharedVertices===true&&
  mesh.noseVertexIndex===1616&&
  mesh.positions?.length===1617&&mesh.uv?.length===1617&&
  mesh.triangles?.length===9648&&
  mesh.positions.every(p=>p&&[p.x,p.y,p.z].every(finite));
}
export function makeWarmveinDisplayTaperV10w({
 sourceMesh,stageProgress=2
}={}){
 if(!sourceValid(sourceMesh)||!Number.isInteger(stageProgress)||
  stageProgress<0||stageProgress>3)
  throw new RangeError('v10w_requires_actual_v09u_mesh');
 const output=sourceMesh.positions.slice();
 const ringAudit=[];
 let maxDistance=0,maxStep=0,lowestGroundDrift=0;
 for(let ring=8;ring<=100;ring++){
  const offset=ring*16;
  const before=sourceMesh.positions.slice(offset,offset+16);
  const center={x:0,y:0,z:0};
  let minZ=Infinity;
  for(const p of before){
   center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
   minZ=Math.min(minZ,p.z);
  }
  const factor=factorAt(ring);
  const after=[];
  for(let i=0;i<16;i++){
   const p=before[i];
   const next=F({
    x:center.x+(p.x-center.x)*factor,
    y:center.y+(p.y-center.y)*factor,
    z:minZ+(p.z-minZ)*factor
   });
   maxDistance=Math.max(maxDistance,Math.hypot(
    p.x-next.x,p.y-next.y,p.z-next.z));
   output[offset+i]=next;
   after.push(next);
  }
  // Every ring keeps original ground-most point after contraction.
  const minNext=Math.min(...after.map(p=>p.z));
  lowestGroundDrift=Math.max(lowestGroundDrift,Math.abs(minNext-minZ));
  if(ring>8)maxStep=Math.max(maxStep,Math.abs(
   factor-ringAudit.at(-1).factor));
  ringAudit.push(F({ring,factor,
   sourceFloorZ:minZ,renderFloorZ:minNext}));
 }
 // Rings 0..7 and ring 8, plus nose tip, are source-bit-identical.
 const sourceHeadUnchanged=output.slice(0,9*16).every(
  (p,i)=>Math.hypot(
    p.x-sourceMesh.positions[i].x,
    p.y-sourceMesh.positions[i].y,
    p.z-sourceMesh.positions[i].z)<1e-12);
 const tailTipUnchanged=output[1616]===sourceMesh.positions[1616];
 if(!sourceHeadUnchanged||!tailTipUnchanged||
  lowestGroundDrift>1e-9||maxStep>.14)
  throw new Error('v10w_display_only_source_guard_failed');
 const renderMesh=F({...sourceMesh,positions:F(output),
  v10wRendererOnly:true,
  v10wSourceMeshReference:sourceMesh});
 return F({
  version:WARMVEIN_VISUAL_TAPER_V10W,ok:true,
  stageProgress,renderMesh,sourceMesh,
  sourceHeadAndSocketUnchanged:sourceHeadUnchanged,
  sourceNoseUnchanged:tailTipUnchanged,
  originalUVReferenceUnchanged:renderMesh.uv===sourceMesh.uv,
  originalTrianglesReferenceUnchanged:renderMesh.triangles===sourceMesh.triangles,
  headToTailTaperStops:stops,ringAudit:F(ringAudit),
  lastRingRelativeRadius:factorAt(100),
  middleBodyRelativeRadius:factorAt(52),
  maximumSingleRingFactorStep:maxStep,
  maximumVertexInwardShiftWorld:maxDistance,
  maximumOriginalGroundMinimumDriftWorld:lowestGroundDrift,
  noSourcePhysicsModified:true,playerSaveModified:false,
  trueSpeciesAnatomyNotCertified:true,
  visuallyApproved:false
 });
}
