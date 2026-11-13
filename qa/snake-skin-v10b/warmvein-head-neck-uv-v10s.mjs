/**
 * PRIVATE OHM V1.0S — source-authenticated neck UV & silhouette preflight.
 *
 * It verifies the real V0.9R/U shared indexed neck socket before any
 * pixels are drawn, and measures how V1.0R inward-only head refinement
 * changes gradients and tangent/normal continuity. Color risks are
 * reported, not "fixed" by shifting or repainting existing UV coordinates.
 *
 * Zero changes to the actual source mesh, indices, UVs, head collider,
 * atlas, animal AI, growth or player saves. Not a rendered GPU screenshot.
 */
import {deriveWarmveinRenderNormalsV10g}
 from './warmvein-body-light-v10g.mjs';

export const WARMVEIN_HEAD_NECK_UV_V10S='1.0S';
const F=Object.freeze;
const RADIAL=16,SOCKET=128,RINGS=101,VERTICES=1617,FACES=3216;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const uvDist=(v,t)=>Math.min(Math.abs(v-t),1-Math.abs(v-t));
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const angle=(a,b)=>{
 const la=Math.hypot(a.x,a.y,a.z),lb=Math.hypot(b.x,b.y,b.z);
 if(la<1e-12||lb<1e-12)return null;
 return Math.acos(clamp(dot(a,b)/(la*lb),-1,1))*180/Math.PI;
};
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const ringCenter=(mesh,ring)=>{
 let x=0,y=0,z=0;
 for(let j=0;j<RADIAL;j++){
  const p=mesh.positions[ring*RADIAL+j];
  x+=p.x/RADIAL;y+=p.y/RADIAL;z+=p.z/RADIAL;
 }
 return {x,y,z};
};
const ringRadius=(mesh,ring)=>{
 const c=ringCenter(mesh,ring);
 let sum=0;
 for(let j=0;j<RADIAL;j++)
  sum+=distance(mesh.positions[ring*RADIAL+j],c)/RADIAL;
 return sum;
};
const nearestPixel=(atlas,uv)=>{
 const x=clamp(Math.floor(clamp(uv.u,0,1)*atlas.width),
  0,atlas.width-1);
 const y=clamp(Math.floor((((uv.v%1)+1)%1)*atlas.height),
  0,atlas.height-1);
 return atlas.sampleRGBA(x,y);
};
const colorGap=(a,b)=>Math.hypot(
 a[0]-b[0],a[1]-b[1],a[2]-b[2]);

function exactSocketEdgeCounts(mesh){
 const counts=Array(RADIAL).fill(0);
 for(let t=0;t<mesh.triangles.length;t+=3){
  const v=mesh.triangles.slice(t,t+3);
  for(let j=0;j<RADIAL;j++){
   const a=SOCKET+j,b=SOCKET+(j+1)%RADIAL;
   if(v.includes(a)&&v.includes(b))counts[j]++;
  }
 }
 return counts;
}
function validMesh(mesh){
 if(mesh?.vertexCount!==VERTICES||mesh?.triangleCount!==FACES||
  mesh?.radialSegments!==RADIAL||mesh?.headExtraRingCount!==8||
  mesh?.neckSocketRingStartIndex!==SOCKET||
  mesh?.noseVertexIndex!==1616||
  mesh?.headBodySeamSharedVertices!==true||
  mesh?.uv?.length!==VERTICES||
  mesh?.positions?.length!==VERTICES||
  mesh?.triangles?.length!==FACES*3)return false;
 for(const ring of [6,7,8,9]){
  for(let j=0;j<RADIAL;j++){
   const i=ring*RADIAL+j,p=mesh.positions[i],uv=mesh.uv[i];
   if(!p||!uv||![p.x,p.y,p.z,uv.u,uv.v].every(finite))
    return false;
  }
 }
 return true;
}

export function inspectWarmveinHeadNeckUVV10s({
 sourceMesh,renderMesh,atlas,stageProgress=2
}={}){
 if(!validMesh(sourceMesh)||!validMesh(renderMesh)||
  !Number.isInteger(stageProgress)||stageProgress<0||stageProgress>3||
  atlas?.width!==256||atlas?.height!==128||
  atlas?.nearSeamRowEqual!==true||
  typeof atlas.sampleRGBA!=='function')
  throw new RangeError('v10s_requires_full_original_head_and_256x128_uv_atlas');
 // Never accept an altered UV field or replacement triangle soup:
 // correct texture mapping comes from real immutable source mesh.
 if(sourceMesh.uv!==renderMesh.uv||
  sourceMesh.triangles!==renderMesh.triangles)
  throw new RangeError('v10s_source_uv_or_welded_triangles_modified');
 for(let i=SOCKET;i<VERTICES;i++)
  if(sourceMesh.positions[i]!==renderMesh.positions[i])
   throw new RangeError('v10s_original_neck_socket_or_body_vertex_modified');

 const edgeCounts=exactSocketEdgeCounts(sourceMesh);
 if(!edgeCounts.every(c=>c===2))
  throw new RangeError('v10s_neck_socket_not_two_face_welded');
 const uvLayoutErrors=[];
 for(let ring=6;ring<=9;ring++)
  for(let j=0;j<RADIAL;j++){
   const q=sourceMesh.uv[ring*RADIAL+j];
   if(Math.abs(q.u-ring/(RINGS-1))>1e-9||
    Math.abs(q.v-j/RADIAL)>1e-9)
    uvLayoutErrors.push(F({ring,j,u:q.u,v:q.v}));
  }
 if(uvLayoutErrors.length)
  throw new RangeError('v10s_original_fixed_cylindrical_uv_layout_unexpected');

 const normalsSource=deriveWarmveinRenderNormalsV10g(sourceMesh).normals;
 const normalsRender=deriveWarmveinRenderNormalsV10g(renderMesh).normals;
 const sectors=[];
 let maxColorJump=0,maxNormalAngleChange=0,
  maxTangentAngleIncrease=0,highContrastSectors=0;
 for(let j=0;j<RADIAL;j++){
  const i7=7*RADIAL+j,i8=8*RADIAL+j,i9=9*RADIAL+j;
  const a=renderMesh.positions[i7],b=renderMesh.positions[i8],
    c=renderMesh.positions[i9];
  const as=sourceMesh.positions[i7],bs=sourceMesh.positions[i8],
    cs=sourceMesh.positions[i9];
  const before=angle(minus(bs,as),minus(cs,bs));
  const after=angle(minus(b,a),minus(c,b));
  const tangentChange=before===null||after===null?null:after-before;
  if(tangentChange!==null)
   maxTangentAngleIncrease=Math.max(maxTangentAngleIncrease,
    Math.max(0,tangentChange));
  const normalBefore=normalsSource[i7],normalAfter=normalsRender[i7];
  const normalDelta=angle(normalBefore,normalAfter)??0;
  maxNormalAngleChange=Math.max(maxNormalAngleChange,normalDelta);
  const color7=nearestPixel(atlas,sourceMesh.uv[i7]);
  const color8=nearestPixel(atlas,sourceMesh.uv[i8]);
  const color9=nearestPixel(atlas,sourceMesh.uv[i9]);
  const jump78=colorGap(color7,color8);
  const jump89=colorGap(color8,color9);
  maxColorJump=Math.max(maxColorJump,jump78,jump89);
  if(jump78>90&&jump89>90)highContrastSectors++;
  sectors.push(F({
   sector:j,
   headToSocketColorJumpRGB:jump78,
   socketToBodyColorJumpRGB:jump89,
   headTangentChangeDeg:after,
   extraTangentAngleFromRefinementDeg:tangentChange,
   headRadialNormalChangedDeg:normalDelta,
   headToSocketWorld:distance(a,b),
   socketToBodyWorld:distance(b,c),
   sourceSocketX:bs.x,sourceSocketY:bs.y,sourceSocketZ:bs.z
  }));
 }
 const socket=sourceMesh.positions.slice(SOCKET,SOCKET+RADIAL);
 const top=socket.reduce((best,p,j)=>p.z>socket[best].z?j:best,0);
 const bottom=socket.reduce((best,p,j)=>p.z<socket[best].z?j:best,0);
 const topV=sourceMesh.uv[SOCKET+top].v;
 const bottomV=sourceMesh.uv[SOCKET+bottom].v;
 const dorsalAtTop=uvDist(topV,.25)<=.0625+1e-9;
 const ventralAtBottom=uvDist(bottomV,.75)<=.0625+1e-9;
 const r7=ringRadius(renderMesh,7),r8=ringRadius(renderMesh,8),
 r9=ringRadius(renderMesh,9);
 const collarRisk=highContrastSectors>=10;
 return F({
  version:'1.0S',ok:true,stageProgress,
  topology:'v09r_true_welded_8_head_rings_and_one_shared_socket',
  originalUVSameReference:true,
  originalIndexedTrianglesSameReference:true,
  socketRadialVertices:RADIAL,socketTwoFaceRingEdgesVerified:true,
  originalSocketAndAllBodyVerticesIdentityPreserved:true,
  fixedUVLayoutVerified:true,
  uvOffsetApplied:false,atlasPixelsModified:false,
  sharedSocketU:sourceMesh.uv[SOCKET].u,
  sharedSocketV:sourceMesh.uv[SOCKET].v,
  sharedSocketImageX:Math.floor(sourceMesh.uv[SOCKET].u*atlas.width),
  topRingUVPhaseV:topV,bottomRingUVPhaseV:bottomV,
  dorsalAtlasAlignedToHighestWorldZ:dorsalAtTop,
  ventralAtlasAlignedToLowestWorldZ:ventralAtBottom,
  topAndBottomAlignmentSourceBasedOnly:true,
  meanLastHeadRadiusWorld:r7,meanSocketRadiusWorld:r8,
  meanFirstBodyRadiusWorld:r9,
  socketVsLastHeadRadiusRatio:r8/r7,
  socketVsFirstBodyRadiusRatio:r8/r9,
  maxNearestColorJumpRGB:maxColorJump,
  consecutiveHeadSocketAndBodyHighContrastSectors:highContrastSectors,
  suspectedVisibleNeckColorCollar:collarRisk,
  colorSeamRiskNotScreenshotProof:true,
  maximumHeadTangentAngleIncreaseDeg:maxTangentAngleIncrease,
  maximumHeadRadialNormalChangeDeg:maxNormalAngleChange,
  sectors:F(sectors),
  sourcePhysicalGeometryMutated:false,
  skinOrRigGeometryReplaced:false,
  newRollingUVOffsetAdded:false,
  originalCollisionOrPlayerSaveChanged:false,
  iPhoneSafariWebGL2Certified:false
 });
}
