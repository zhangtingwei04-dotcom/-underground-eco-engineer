/**
 * Project OHM public synthetic V0.9S — all-face, time-sampled 3D
 * triangle surface contact / temporal-coherence QA for V0.9R neutral mesh.
 *
 * The source of AUTHORITY remains V0.9C/D/G with fixed 24 bones.
 * V0.9S checks the transparent HEAD + FULL BODY 3216 triangles, not
 * only head vertices/capsule centers. This includes:
 *   - four explicit barycentric samples of every triangle at 3-5
 *     source-interframe times against the V0.6A heightfield;
 *   - conservative entire swept 2D triangle AABB vs V0.3d solid
 *     footprint/glass (can reject a legal traversal, never ignore a hit);
 *   - nonlocal (>=4 source links apart) 3D triangle pair surface
 *     intersections using two-level ring/face AABB broadphase and a
 *     segment/triangle narrowphase at endpoints + sampled times;
 *   - entire-mesh per-vertex displacement and adjacent face deformation,
 *     with stable UV/topology and 16-vertex indexed socket welding.
 *
 * This is NOT exact continuous-time 3D swept-triangle collision, force
 * and friction/contact support, final mesh appearance, real snake
 * anatomy, new dynamic growth authority or a gameplay/skin write.
 * Any uncertainty/failure => candidate held, no new authorized pose.
 */
import {inspectSnakeHeadNeckTransitionV09r,
 buildSnakeHeadNeckCandidateV09r}
 from './snake-head-neck-seam-v09r.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_SWEPT_MESH_CONTACT_V09S_VERSION='0.9S';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const v=(x,y,z)=>F({x,y,z});
const add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,k)=>v(a.x*k,a.y*k,a.z*k);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>v(a.y*b.z-a.z*b.y,
 a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const len=a=>Math.hypot(a.x,a.y,a.z);
const dist=(a,b)=>len(sub(a,b));
const at=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const min=(...n)=>Math.min(...n),max=(...n)=>Math.max(...n);
const failure=(reason,detail=null)=>F({
 version:SNAKE_SWEPT_MESH_CONTACT_V09S_VERSION,
 ok:false,reason,detail,
 actualSourceFramesCommitted:0,sourceFramesCommitted:0,
 sourcePoseChanged:false,
 exactContinuous3DSweepCertified:false,
 dynamicSizeAuthorityGranted:false,
 meshContactNotGameplayAuthorized:true,
 headAndBodySkinApplied:false,saveModified:false
});
function aabb3(points){
 return F({lo:v(min(...points.map(p=>p.x)),
  min(...points.map(p=>p.y)),min(...points.map(p=>p.z))),
  hi:v(max(...points.map(p=>p.x)),
   max(...points.map(p=>p.y)),max(...points.map(p=>p.z)))});
}
function overlaps3(a,b,epsilon=1e-8){
 return a.lo.x<=b.hi.x+epsilon&&a.hi.x+epsilon>=b.lo.x&&
  a.lo.y<=b.hi.y+epsilon&&a.hi.y+epsilon>=b.lo.y&&
  a.lo.z<=b.hi.z+epsilon&&a.hi.z+epsilon>=b.lo.z;
}
function faceArea(a,b,c){return .5*len(cross(sub(b,a),sub(c,a)));}
function triangleHitsSegmentFace(a,b,p,q,r){
 // Two-sided Moller-Trumbore with explicit interior test, used only
 // after strict spatial AABB. Coplanar pairs are UNCERTAIN; do not certify.
 const d=sub(b,a),e1=sub(q,p),e2=sub(r,p);
 const h=cross(d,e2),det=dot(e1,h);
 if(Math.abs(det)<1e-11)return null;
 const inv=1/det,s=sub(a,p);
 const u=dot(s,h)*inv;
 if(u< -1e-9||u>1+1e-9)return false;
 const qv=cross(s,e1),vValue=dot(d,qv)*inv;
 if(vValue< -1e-9||u+vValue>1+1e-9)return false;
 const t=dot(e2,qv)*inv;
 return t>=-1e-9&&t<=1+1e-9;
}
function triangleIntersection(t1,t2){
 const a=t1,b=t2;
 // An exact face/face pair is evaluated after AABB overlap.
 // For coplanar triangles, conservative UNCERTAIN instead of false clear.
 let uncertain=false;
 for(let i=0;i<3;i++){
  const hit=triangleHitsSegmentFace(a[i],a[(i+1)%3],
   b[0],b[1],b[2]);
  if(hit===true)return 'hit';
  if(hit===null)uncertain=true;
 }
 for(let i=0;i<3;i++){
  const hit=triangleHitsSegmentFace(b[i],b[(i+1)%3],
   a[0],a[1],a[2]);
  if(hit===true)return 'hit';
  if(hit===null)uncertain=true;
 }
 return uncertain?'uncertain_coplanar_or_parallel':'clear';
}
function validateMesh(mesh){
 if(!mesh||mesh.vertexCount!==1617||
  mesh.triangleCount!==3216||
  mesh.positions?.length!==1617||
  mesh.triangles?.length!==9648||
  mesh.uv?.length!==1617||
  mesh.radialSegments!==16||
  mesh.headExtraRingCount!==8||
  mesh.bodyRingCount!==93||
  mesh.neckSocketRingStartIndex!==128||
  mesh.noseVertexIndex!==1616||
  !mesh.triangles.every(i=>Number.isInteger(i)&&i>=0&&i<1617)||
  mesh.positions.some(p=>!p||![p.x,p.y,p.z].every(finite)))
  throw new RangeError('v09s_requires_canonical_v09r_triangle_mesh');
}
function ringAabbs(positions,faceIndices){
 const rings=100,radial=16;
 const boxes=new Array(rings);
 const tris=new Array(rings);
 for(let i=0;i<rings;i++){
  const first=i*radial,second=(i+1)*radial;
  boxes[i]=aabb3(positions.slice(first,second+radial));
  tris[i]=[];
 }
 const last=positions.length-1;
 for(let k=0;k<faceIndices.length;k+=3){
  const face=[faceIndices[k],faceIndices[k+1],
   faceIndices[k+2]];
  const i=Math.min(...face.map(n=>n===last?0:
   Math.floor(n/radial)));
  if(i<rings)tris[i].push(face);
 }
 return {boxes,tris};
}
/**
 * Static surface checker for one V0.9R candidate.
 * "Mesh vertices clear" is NOT sufficient; checks each face centroid
 * against the heightfield. Self checks use 3D face intersection when
 * rings are separated by >=16 consecutive V0.9Q 4-per-link sections.
 */
export function inspectSnakeMeshSurfaceV09s({
 candidate,scene,terrain,
 minimumRingSeparation=16,
 groundMarginWorld=0
}={}){
 if(!['0.9R','0.9U'].includes(candidate?.version)||!candidate.ok||
  !candidate.headBodySeamCertified||
  !scene||!terrain||
  !Number.isInteger(minimumRingSeparation)||
  minimumRingSeparation<12||minimumRingSeparation>28||
  !finite(groundMarginWorld)||groundMarginWorld<0||
  groundMarginWorld>.01)
  throw new RangeError('v09s_untrusted_surface_inputs');
 const mesh=candidate.mesh;validateMesh(mesh);
 const xyz=mesh.positions,ids=mesh.triangles;
 const zones=ringAabbs(xyz,ids);
 let minimumGap=Infinity,groundSamples=0,
  nonlocalBroadphase=0,facePairs=0,
  uncertainty=null,intersectingPair=null;
 for(let i=0;i<ids.length;i+=3){
  const a=xyz[ids[i]],b=xyz[ids[i+1]],c=xyz[ids[i+2]];
  const barycentric=[a,b,c,
   mul(add(add(a,b),c),1/3),
   mul(add(a,b),.5),mul(add(b,c),.5),mul(add(c,a),.5)];
  for(const p of barycentric){
   const gap=p.z-sampleSnakeTerrain(p.x,p.y,terrain).z-
    groundMarginWorld;
   minimumGap=Math.min(minimumGap,gap);
   groundSamples++;
  }
 }
 // Cap pairs by original body arc distance; never test adjacent
 // topology edges as a "collision" of an animal with itself.
 outer:for(let a=0;a<zones.boxes.length;a++)
  for(let b=a+minimumRingSeparation;b<zones.boxes.length;b++){
   if(!overlaps3(zones.boxes[a],zones.boxes[b]))continue;
   nonlocalBroadphase++;
   for(const fa of zones.tris[a])for(const fb of zones.tris[b]){
    const A=fa.map(n=>xyz[n]),B=fb.map(n=>xyz[n]);
    if(!overlaps3(aabb3(A),aabb3(B)))continue;
    facePairs++;
    const state=triangleIntersection(A,B);
    if(state==='hit'){
     intersectingPair=F({ringA:a,ringB:b,
      triangleA:fa,triangleB:fb});
     break outer;
    }
    if(state!=='clear')uncertainty??=F({
     ringA:a,ringB:b,kind:state});
   }
  }
 const surfaceClear=minimumGap>=-.00001;
 const nonlocalClear=intersectingPair===null&&uncertainty===null;
 const ok=surfaceClear&&nonlocalClear;
 return F({
  version:SNAKE_SWEPT_MESH_CONTACT_V09S_VERSION,
  ok,reason:!surfaceClear?'triangle_interior_hits_heightfield':
   intersectingPair?'nonlocal_triangle_surface_intersection':
   uncertainty?'uncertain_nonlocal_triangle_surface_contact':null,
  sourceTriangleCount:mesh.triangleCount,
  sourceVertexCount:mesh.vertexCount,
  triangleHeightfieldSamples:groundSamples,
  minTriangleSurfaceHeightfieldGapWorld:minimumGap,
  minimumRingSeparation,
  nonlocalRingBroadphasePairs:nonlocalBroadphase,
  exactTrianglePairsExamined:facePairs,
  firstIntersection:intersectingPair,
  firstUncertainPair:uncertainty,
  checkedAllBodyAndHeadTriangleFaces:true,
  exactStatic3DTriangleIntersectionNarrowphase:true,
  surface3DStaticCertified:false,
  exactContinuous3DSweepCertified:false,
  sourceSizeMotionAuthorized:false,
  originalGameSourceUnmodified:true,
  skinApplied:false,saveModified:false
 });
}
/** Temporal contact test on two consecutively source-authenticated
 * V0.9R meshes. Four barycentric samples of all 3216 triangles at
 * intermediate times; strict scene/glass swept AABB for every triangle.
 */
export function inspectSnakeMeshTemporalV09s({
 from,to,scene,terrain,
 temporalSlices=3,minimumRingSeparation=16,
 maxPerVertexStepWorld=.06
}={}){
 if(!['0.9R','0.9U'].includes(from?.version)||
  to?.version!==from.version||
  !from.ok||!to.ok||!scene||!terrain||
  !Number.isInteger(temporalSlices)||temporalSlices<3||
  temporalSlices>5||!Number.isInteger(minimumRingSeparation)||
  minimumRingSeparation<12||minimumRingSeparation>28||
  !finite(maxPerVertexStepWorld)||
  maxPerVertexStepWorld<.02||maxPerVertexStepWorld>.09)
  throw new RangeError('v09s_invalid_temporal_candidate');
 validateMesh(from.mesh);validateMesh(to.mesh);
 if(from.mesh.triangles.some((index,i)=>index!==to.mesh.triangles[i])||
  from.mesh.uv.some((q,i)=>q.u!==to.mesh.uv[i].u||
   q.v!==to.mesh.uv[i].v))
  return failure('mesh_topology_or_uv_changed');
 const A=from.mesh.positions,B=to.mesh.positions,
  tris=from.mesh.triangles;
 let maximumStep=0,minimumGap=Infinity,sceneRisk=null,
  samples=0,maxEdgeStretch=1,checkedSweptFaces=0,
  sampledStaticNear=0,firstCollision=null,
  uncertainContact=null;
 for(let i=0;i<A.length;i++)
  maximumStep=Math.max(maximumStep,dist(A[i],B[i]));
 for(let k=0;k<tris.length;k+=3){
  const ix=[tris[k],tris[k+1],tris[k+2]];
  const pts=[...ix.map(n=>A[n]),...ix.map(n=>B[n])];
  const bounds=aabb3(pts),eps=0.0006;
  const bx0=500+(bounds.lo.x-eps)*125,
   bx1=500+(bounds.hi.x+eps)*125,
   by0=200+(bounds.lo.y-eps)*125,
   by1=200+(bounds.hi.y+eps)*125;
  if(bx0<0||bx1>1000||by0<0||by1>400)
   sceneRisk??=F({kind:'swept_glass',triangle:k/3});
  for(const o of scene.objects)
   if(bx0<=o.x+o.width&&bx1>=o.x&&
    by0<=o.y+o.depth&&by1>=o.y)
    sceneRisk??=F({kind:'swept_source_rock',
     triangle:k/3,objectId:o.id});
  checkedSweptFaces++;
  for(let edge=0;edge<3;edge++){
   const x=ix[edge],y=ix[(edge+1)%3];
   const before=dist(A[x],A[y]),after=dist(B[x],B[y]);
   if(before<1e-10||after<1e-10)
    return failure('degenerated_triangle_edge',
     F({triangle:k/3,edge}));
   maxEdgeStretch=Math.max(maxEdgeStretch,
    before/after,after/before);
  }
  for(let slice=0;slice<temporalSlices;slice++){
   const t=slice/(temporalSlices-1);
   const aa=at(A[ix[0]],B[ix[0]],t),
    bb=at(A[ix[1]],B[ix[1]],t),
    cc=at(A[ix[2]],B[ix[2]],t);
   const points=[aa,bb,cc,mul(add(add(aa,bb),cc),1/3)];
   for(const p of points){
    minimumGap=Math.min(minimumGap,
     p.z-sampleSnakeTerrain(p.x,p.y,terrain).z);
    samples++;
   }
  }
 }
 // Nonlocal 3D triangle intersections at each sampled interpolated
 // mesh. AABB broadphase still runs, not a head-only intersection test.
 for(let slice=0;slice<temporalSlices;slice++){
  const t=slice/(temporalSlices-1);
  const intermediate=F({...to,
   mesh:F({...to.mesh,positions:F(A.map((p,i)=>at(p,B[i],t)))})
  });
  const audit=inspectSnakeMeshSurfaceV09s({
   candidate:intermediate,scene,terrain,minimumRingSeparation
  });
  sampledStaticNear+=audit.exactTrianglePairsExamined;
  if(audit.firstIntersection)firstCollision??=F({
   timeFraction:t,...audit.firstIntersection});
  if(audit.firstUncertainPair)uncertainContact??=F({
   timeFraction:t,...audit.firstUncertainPair});
 }
 const ok=sceneRisk===null&&minimumGap>=-.00001&&
  maxEdgeStretch<=1.20&&maximumStep<=maxPerVertexStepWorld&&
  firstCollision===null&&uncertainContact===null;
 return F({
  version:SNAKE_SWEPT_MESH_CONTACT_V09S_VERSION,ok,
  reason:sceneRisk?'swept_full_mesh_scene_or_glass_risk':
   minimumGap<-.00001?'sampled_swept_triangle_heightfield_penetration':
   maxEdgeStretch>1.20?'interframe_surface_edge_strain':
   maximumStep>maxPerVertexStepWorld?'interframe_surface_vertex_jump':
   firstCollision?'sampled_nonlocal_triangle_intersection':
   uncertainContact?'sampled_nonlocal_triangle_uncertain':null,
  sourceTriangleCount:to.mesh.triangleCount,
  sourceVertexCount:to.mesh.vertexCount,
  temporalSlices,
  checkedSweptFaces,
  surfaceHeightfieldSamples:samples,
  nonlocalNarrowphaseTrianglePairs:sampledStaticNear,
  minimumSampledSurfaceGroundGapWorld:minimumGap,
  maximumSourceVertexStepWorld:maximumStep,
  maxEdgeLengthRatio:maxEdgeStretch,
  firstSweptSourceSceneRisk:sceneRisk,
  firstNonlocalTriangleCollision:firstCollision,
  firstUncertainContact:uncertainContact,
  allOriginalHeadBodyVerticesChecked:true,
  fullMeshVertexContinuityChecked:true,
  fullMeshTriangleSweptAabbBroadphaseChecked:true,
  sampled3DSurfaceSelfIntersectionChecked:true,
  exactContinuous3DSweepCertified:false,
  gameMovementAuthorized:false,
  sourceFramesCommitted:0,
  skinApplied:false,saveModified:false
 });
}
/**
 * Source replay is delegated to unchanged V0.9R (V0.9C/D/G checked).
 * V0.9S then audits the ENTIRE 1617-vertex mesh and 3216 triangle faces.
 */
export function inspectSnakeAuthenticatedMeshStepV09s({
 previousSource,nextSource,scene,terrain,stageProgress=2,
 previousYawRad=0,nextYawRad=0,
 previousPitchRad=0,nextPitchRad=0,
 seconds=1/30,temporalSlices=3
}={}){
 const base=inspectSnakeHeadNeckTransitionV09r({
  previousSource,nextSource,scene,terrain,stageProgress,
  previousYawRad,nextYawRad,previousPitchRad,nextPitchRad,seconds
 });
 if(!base.ok)return F({...failure('original_head_neck_or_source_rejected',
  base.reason),sourceReplayMatched:base.sourceReplayMatched??false});
 const temporal=inspectSnakeMeshTemporalV09s({
  from:base.from,to:base.to,scene,terrain,temporalSlices
 });
 return F({
  version:SNAKE_SWEPT_MESH_CONTACT_V09S_VERSION,
  ok:temporal.ok,
  reason:temporal.reason,
  sourceStartFrame:previousSource.verifiedFrames,
  sourceEndFrame:nextSource.verifiedFrames,
  stageProgress,
  sourceReplayMatched:true,
  headNeckIndexedSeamStillWelded:
   base.from.seam.indexedSocketContinuous&&
   base.to.seam.indexedSocketContinuous,
  temporal,
  originalV09rTransition:base,
  originalSourcePoseModified:false,
  sourceFramesCommitted:0,
  entireBodyAndHeadSampledContactOnly:true,
  exactContinuous3DSweepCertified:false,
  realBiomechanicalContactCertified:false,
  newSizeMotionControllerGranted:false,
  skinApplied:false,saveModified:false
 });
}
