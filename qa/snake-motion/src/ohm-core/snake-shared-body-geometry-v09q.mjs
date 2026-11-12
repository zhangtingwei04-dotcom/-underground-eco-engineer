/**
 * Project OHM public neutral V0.9Q — one SIZE-DERIVED body definition
 * for a transparent mesh candidate AND its conservative collision shell.
 *
 * Single geometric authority for this CANDIDATE is the complete immutable
 * V0.9P solved 24-joint pose with its 24 local radii. Ring positions,
 * cross-section radii, collision section records and UV all derive from it.
 * Never substitute the incompatible V0.1 species-art width for collision.
 *
 * The V0.1 GrowthMotionBridge can reuse the size, 24-bone contract and UV
 * but not yet share the actual animated collision authority. Thus this is
 * not a V0.9C/D/G variable-size controller, approved head/neck seam, skin,
 * anatomical model, 3D swept triangle collision, ground force or gameplay.
 */
import {sampleSnakeSpine}
 from './snake-rig-3d.mjs';
import {createSnakeGrowthMotionBridge}
 from './snake-growth-motion-adapter.mjs';
import {solveSnakeSizeTerrainContactV09p}
 from './snake-size-terrain-contact-v09p.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';

export const SNAKE_SHARED_BODY_GEOMETRY_V09Q_VERSION='0.9Q';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const v=(x,y,z)=>F({x,y,z});
const add=(a,b)=>v(a.x+b.x,a.y+b.y,a.z+b.z);
const mul=(a,k)=>v(a.x*k,a.y*k,a.z*k);
const norm=a=>Math.hypot(a.x,a.y,a.z);
const sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z);
const dist=(a,b)=>norm(sub(a,b));
function reject(reason,stageProgress){
 return F({version:SNAKE_SHARED_BODY_GEOMETRY_V09Q_VERSION,
  ok:false,reason,stageProgress,mesh:null,collisionShell:null,
  sourceSizeMotionAuthorized:false,
  meshSweep3DCertified:false,
  headSocketCertified:false,
  groundForceCertified:false,skinApplied:false,saveModified:false});
}
/** Linear surface-radius interpolation between V0.9N joint radii
 * weighted by ACTUAL V0.9P per-link 3D length, not joint index.
 */
function radiusAt(distance,segments,radii){
 let i=0;
 while(i<23&&segments[i+1]<distance-1e-12)i++;
 const denom=segments[i+1]-segments[i];
 const t=Math.min(1,Math.max(0,(distance-segments[i])/denom));
 return radii[i]+(radii[i+1]-radii[i])*t;
}
function ringsFromSolved(solved,radialSegments,subdivisions,terrain){
 const pts=solved.points,radii=solved.radiiWorldUnits;
 const ringCount=23*subdivisions+1;
 const sections=sampleSnakeSpine(pts,{samples:ringCount});
 const links=solved.boneLengths;
 const cum=[0];
 for(const length of links)cum.push(cum.at(-1)+length);
 const total=cum.at(-1);
 const positions=[],uv=[],triangles=[],collision=[],radiiAtRings=[];
 let maxRadiusMismatch=0,maxCenterMismatch=0,
  minimumVisualGround=Infinity,maximumVisualGround=-Infinity;
 for(let i=0;i<ringCount;i++){
  const ring=sections[i],arc=total*i/(ringCount-1);
  const r=radiusAt(arc,cum,radii);
  radiiAtRings.push(r);
  collision.push(F({center:ring.position,radius:r,
   sourceArcLengthWorld:arc,sourceJointEquivalent:i/subdivisions}));
  let avg={x:0,y:0,z:0};
  for(let j=0;j<radialSegments;j++){
   const theta=Math.PI*2*j/radialSegments;
   const offset=add(mul(ring.normal,r*Math.cos(theta)),
    mul(ring.binormal,r*Math.sin(theta)));
   const vertex=add(ring.position,offset);
   positions.push(vertex);
   uv.push(F({u:i/(ringCount-1),v:j/radialSegments}));
   avg.x+=vertex.x;avg.y+=vertex.y;avg.z+=vertex.z;
   maxRadiusMismatch=Math.max(maxRadiusMismatch,
    Math.abs(dist(vertex,ring.position)-r));
   const gap=vertex.z-
    sampleSnakeTerrain(vertex.x,vertex.y,terrain).z;
   minimumVisualGround=Math.min(minimumVisualGround,gap);
   maximumVisualGround=Math.max(maximumVisualGround,gap);
   if(i<ringCount-1){
    const a=i*radialSegments+j;
    const b=i*radialSegments+(j+1)%radialSegments;
    triangles.push(a,a+radialSegments,b,
     b,a+radialSegments,b+radialSegments);
   }
  }
  const avgPoint=v(avg.x/radialSegments,
   avg.y/radialSegments,avg.z/radialSegments);
  maxCenterMismatch=Math.max(maxCenterMismatch,
   dist(avgPoint,ring.position));
 }
 return F({
  mesh:F({positions:F(positions),uv:F(uv),
   triangles:F(triangles),
   ringCount,radialSegments,source:'v09p_pose_and_v09n_radii_only',
   vertexCount:positions.length,triangleCount:triangles.length/3}),
  collisionShell:F({sections:F(collision),sectionCount:ringCount,
   jointCount:24,linkCount:23,
   radiiWorldUnits:radii,points:pts,
   source:'same_v09p_pose_and_v09n_radii_as_mesh'}),
  checks:F({maximumVertexRadialErrorWorld:maxRadiusMismatch,
   maximumRingCenterErrorWorld:maxCenterMismatch,
   minimumMeshVertexHeightfieldGapWorld:minimumVisualGround,
   maximumMeshVertexHeightfieldGapWorld:maximumVisualGround,
   radiusProfileSamples:F(radiiAtRings),
   vertexCount:positions.length,ringCount,
   sourceBodyLengthWorld:total})
 });
}
/**
 * Every render vertex and broad-phase shell section derives from the
 * exact same V0.9P immutable pose and radii. Separate species head mesh
 * is deliberately NOT silently attached until a verified seam adapter.
 */
export function buildSnakeSharedBodyGeometryV09q({
 sourcePose,scene,terrain,stageProgress=2,
 radialSegments=16,subdivisions=4
}={}){
 if(!Number.isInteger(radialSegments)||
   radialSegments<8||radialSegments>32||
  !Number.isInteger(subdivisions)||subdivisions<2||
  subdivisions>8||!terrain||!scene)
  throw new RangeError('v09q_invalid_mesh_options');
 const grounded=solveSnakeSizeTerrainContactV09p({
  sourcePose,scene,terrain,stageProgress
 });
 if(!grounded.ok)return reject(
  grounded.reason??'v09p_source_grounding_rejected',
  stageProgress
 );
 const solved=grounded.candidate;
 if(solved.points.length!==24||
  solved.radiiWorldUnits.length!==24||
  solved.boneLengths.length!==23||
  solved.points.some(q=>!finite(q.x)||!finite(q.y)||!finite(q.z))||
  solved.radiiWorldUnits.some(r=>!finite(r)||r<=0))
  throw new RangeError('v09q_invalid_grounded_source');
 const derived=ringsFromSolved(solved,radialSegments,
  subdivisions,terrain);
 const sample=derived.checks;
 const radiusSame=sample.maximumVertexRadialErrorWorld<1e-9;
 const centersSame=sample.maximumRingCenterErrorWorld<1e-9;
 // This checks only the mesh VERTICES. A triangulated face might cross
 // an obstacle or heightfield between vertices; swept triangle QA is
 // still required. The V0.9P source conservative AABB must also pass.
 const visuallyAbove=sample.minimumMeshVertexHeightfieldGapWorld>=-.00001;
 const ok=radiusSame&&centersSame&&visuallyAbove;
 if(!ok)return reject('v09q_mesh_shell_geometry_mismatch_or_ground',
  stageProgress);
 return F({
  version:SNAKE_SHARED_BODY_GEOMETRY_V09Q_VERSION,
  ok:true,stageProgress,lifeStage:grounded.lifeStage,
  sourceBodyLengthWorld:grounded.sourceLengthWorld,
  posePoints:solved.points,radiiWorldUnits:solved.radiiWorldUnits,
  mesh:derived.mesh,collisionShell:derived.collisionShell,
  checks:derived.checks,
  sourceContactDiagnostics:grounded.diagnostics,
  sourceSolverConverged:grounded.solverConverged,
  topology:F({boneCount:24,linkCount:23,
   ringCount:derived.mesh.ringCount,radialSegments,
   candidateShellMatchesMesh:true}),
  sourceAndSceneUnmodified:true,
  sourceSizeMotionAuthorized:false,
  renderCandidateOnly:true,
  source3DCapsuleProxyOnly:true,
  headSocketCertified:false,
  meshSweep3DCertified:false,
  groundForceCertified:false,
  fullBodyReturnVerified:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * A strict dimension/topology bridge, not a swap of renderers.
 * The old V0.1 rig uses a DIFFERENT art width profile; no claims that
 * its mesh or species head collision matches the V0.9Q shell.
 */
export function inspectSnakeGrowthRendererCompatibilityV09q({
 shared,speciesId='generic_snake'
}={}){
 if(shared?.version!==SNAKE_SHARED_BODY_GEOMETRY_V09Q_VERSION||
  !shared.ok||shared.topology?.boneCount!==24)
  throw new RangeError('v09q_requires_accepted_shared_geometry');
 // The supported visual bridge can keep its 24-joint, normalized UV,
 // but any use of its legacy width as an authoritative collider is unsafe.
 // Import is lazy? No — this module explicitly uses the preexisting
 // growth adapter as the interface compatibility authority.
 const bridge=createSnakeGrowthMotionBridge({
  speciesId,bodyLength:shared.sourceBodyLengthWorld,
  growthStage:shared.stageProgress<1?'juvenile':'adult',
  boneCount:24,ringCount:shared.mesh.ringCount,
  radialSegments:shared.mesh.radialSegments
 });
 const lengthAgree=Math.abs(bridge.bodyLength-
  shared.sourceBodyLengthWorld)<1e-9;
 const uvAgree=bridge.rig.uv.length===shared.mesh.uv.length&&
  bridge.rig.uv.every((item,i)=>
   Math.abs(item.u-shared.mesh.uv[i].u)<1e-12&&
   Math.abs(item.v-shared.mesh.uv[i].v)<1e-12);
 const colliderDifferent=bridge.bodyRadius!==
  Math.max(...shared.radiiWorldUnits);
 return F({
  version:SNAKE_SHARED_BODY_GEOMETRY_V09Q_VERSION,
  interfaceCompatible:lengthAgree&&uvAgree,
  sourceSkeletonPoints:shared.posePoints.length,
  sharedMeshVertices:shared.mesh.positions.length,
  originalGrowthRigVertices:bridge.rig.vertices.length,
  uvIdentical:uvAgree,
  growthBodyLengthIdentical:lengthAgree,
  oldArtCollisionRadiusNotShared:true,
  oldArtColliderMayDiffer:colliderDifferent,
  originalRendererNotCertifiedForCollision:true,
  originalRendererNotOverwritten:true,
  noGameplayMotionAuthorized:true,
  sourceHeadSeamNotCertified:true
 });
}
