/**
 * PRIVATE OHM V1.0F — read-only appearance diagnostics for the TRUE
 * V0.9T/U/R head-and-body mesh, not an alternative motion solver.
 * Does NOT authorize any movement; V0.9U must approve transitions first.
 * A numerical pass is NOT an aesthetic/Safari/physics certification.
 */
import {fitWarmveinStaticEyesV10e}
 from './warmvein-static-eye-fit-v10e.mjs';

export const WARMVEIN_APPEARANCE_AUDIT_V10F='1.0F';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const subtract=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=a=>Math.hypot(a.x,a.y,a.z);
const angleDegrees=(a,b)=>{
 const n=norm(a)*norm(b);
 if(n<=1e-12)throw new RangeError('v10f_zero_length_tangent');
 return Math.acos(clamp(dot(a,b)/n,-1,1))*180/Math.PI;
};
const fail=reason=>F({
 version:'1.0F',ok:false,reason,
 movementAuthorized:false,visualQualityCertified:false,
 physicalCollisionAuthorityChanged:false,
 playerSaveChanged:false
});

function centerRing(mesh,ring){
 const first=ring*16,c={x:0,y:0,z:0};
 for(let i=0;i<16;i++){
  const p=mesh.positions[first+i];
  c.x+=p.x/16;c.y+=p.y/16;c.z+=p.z/16;
 }
 return c;
}
function maxBodyTurn(points){
 let max=0;
 for(let i=1;i<points.length-1;i++)
  max=Math.max(max,angleDegrees(
   subtract(points[i-1],points[i]),
   subtract(points[i],points[i+1])
  ));
 return max;
}
function maxRelativeEdgeChange(from,to){
 let peak=0,samples=0;
 // Triangle edges are render diagnostics ONLY, not collision contacts.
 for(let i=0;i<to.triangles.length;i+=3){
  const a=to.triangles[i],b=to.triangles[i+1],c=to.triangles[i+2];
  for(const [u,v] of [[a,b],[b,c],[c,a]]){
   const prior=distance(from.positions[u],from.positions[v]);
   const next=distance(to.positions[u],to.positions[v]);
   if(prior<=1e-5||next<=1e-5)continue;
   peak=Math.max(peak,Math.abs(next/prior-1));
   samples++;
  }
 }
 return {peak,samples};
}
/**
 * Inputs: a completed V0.9U geometry candidate, optionally preceding
 * V0.9U candidate. This routine never mutates either candidate.
 * groundZ is meaningful for the private EMPTY, FLAT-ground lab only;
 * other terrain MUST NOT be described as checked by this result.
 */
export function inspectWarmveinAppearanceV10f({
 candidate,previousCandidate=null,atlas,previousAtlas=atlas,
 stageProgress,groundZ=0,canvasWidth=1100,worldHalfWidth=1.5
}={}){
 const mesh=candidate?.mesh,pose=candidate?.sizedBodySource;
 const before=previousCandidate?.mesh;
 if(candidate?.version!=='0.9U'||candidate.ok!==true||
  mesh?.vertexCount!==1617||mesh?.triangleCount!==3216||
  mesh?.radialSegments!==16||mesh?.headExtraRingCount!==8||
  mesh?.neckSocketRingStartIndex!==128||
  mesh?.headBodySeamSharedVertices!==true||
  mesh.positions?.length!==1617||mesh.uv?.length!==1617||
  mesh.triangles?.length!==3216*3||
  pose?.points?.length!==24||
  !Number.isInteger(stageProgress)||stageProgress<0||
  stageProgress>3||!finite(groundZ)||
  atlas?.nearSeamRowEqual!==true||
  atlas?.pixelAnchoring!=='mesh_uv_not_world_space')
  return fail('not_actual_sized_shared_mesh_or_stable_atlas');
 if(mesh.positions.some(p=>![p?.x,p?.y,p?.z].every(finite))||
  mesh.uv.some(q=>![q?.u,q?.v].every(finite)||
   q.u<0||q.u>1||q.v<0||q.v>1)||
  mesh.triangles.some(i=>!Number.isInteger(i)||i<0||i>=1617)||
  pose.points.some(p=>![p?.x,p?.y,p?.z].every(finite)))
  return fail('nonfinite_mesh_or_uv_or_invalid_topology');
 if(previousCandidate!==null&&
  (previousCandidate.version!=='0.9U'||
   previousCandidate.ok!==true||
   before?.vertexCount!==1617||
   before?.triangleCount!==3216||
   before.positions?.length!==1617||
   before.uv?.length!==1617||
   before.triangles?.length!==3216*3||
   before.positions.some(p=>![p?.x,p?.y,p?.z].every(finite))))
  return fail('unverified_previous_mesh');
 const uvStable=before?mesh.uv.every((q,i)=>
  q.u===before.uv[i].u&&q.v===before.uv[i].v):true;
 const atlasSame=!before||previousAtlas===atlas;
 const socketCenter=centerRing(mesh,8);
 const headCenter=centerRing(mesh,7);
 const neckCenter=centerRing(mesh,9);
 const headNeckAngle=angleDegrees(
  subtract(socketCenter,headCenter),
  subtract(neckCenter,socketCenter)
 );
 const minimumFlatGroundGap=Math.min(
  ...mesh.positions.map(p=>p.z-groundZ)
 );
 if(minimumFlatGroundGap<-.00001)
  return fail('current_visual_mesh_below_known_flat_ground');
 const eyes=fitWarmveinStaticEyesV10e({
  mesh,stageProgress,canvasWidth,worldHalfWidth
 });
 let maximumVertexStepWorld=0,maximumEyeStepWorld=0,
  maximumTriangleEdgeRelativeChange=0,edgesChecked=0;
 if(before){
  for(let i=0;i<mesh.positions.length;i++)
   maximumVertexStepWorld=Math.max(maximumVertexStepWorld,
    distance(before.positions[i],mesh.positions[i]));
  const olderEyes=fitWarmveinStaticEyesV10e({
   mesh:before,stageProgress,canvasWidth,worldHalfWidth
  });
  for(let i=0;i<2;i++)
   maximumEyeStepWorld=Math.max(maximumEyeStepWorld,
    distance(olderEyes.eyes[i].position,eyes.eyes[i].position));
  const changed=maxRelativeEdgeChange(before,mesh);
  maximumTriangleEdgeRelativeChange=changed.peak;
  edgesChecked=changed.samples;
 }
 const accepted=uvStable&&atlasSame&&
  candidate.headNeckSocketWelded===true;
 return F({
  version:'1.0F',ok:accepted,
  reason:accepted?null:'atlas_uv_or_head_socket_changed',
  stageProgress,sourceFrame:candidate.sourceFrame,
  vertexCount:mesh.vertexCount,triangleCount:mesh.triangleCount,
  headNeckTurnDegrees:headNeckAngle,
  maximumSourceBodyTurnDegrees:maxBodyTurn(pose.points),
  minimumFlatGroundSurfaceGapWorld:minimumFlatGroundGap,
  maximumWholeMeshVertexStepWorld:maximumVertexStepWorld,
  maximumEyeStepWorld,
  maximumTriangleEdgeRelativeChange,
  triangleEdgesCompared:edgesChecked,
  currentEyeHeadIndices:eyes.eyes.map(e=>e.surfaceVertexIndex),
  independentEyesRemainOpen:eyes.eyes.every(e=>e.eyeAlwaysOpen),
  uvIdenticalAcrossStep:uvStable,
  sameAtlasAcrossStep:atlasSame,
  sharedHeadNeckSocket: candidate.headNeckSocketWelded,
  onlyFlatGroundSampled:true,
  originalMeshAndCollisionUntouched:true,
  movementAuthorized:false,visualQualityCertified:false,
  completeContinuousContactCertified:false,
  SafariRendered:false,playerSaveChanged:false
 });
}
