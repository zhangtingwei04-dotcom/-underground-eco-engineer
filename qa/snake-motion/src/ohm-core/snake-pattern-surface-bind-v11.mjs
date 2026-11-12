/**
 * Project OHM V1.1 — READ-ONLY pattern blueprint -> source-backed
 * V0.7Q / V0.7Y 3D mesh sampling. This produces temporary surface
 * position diagnostics, NEVER textures, UV paint, skin, collisions,
 * phenotype, saved ring coordinates, or gameplay changes.
 *
 * Pattern v0=top/dorsal, v.5=bottom/ventral. The V0.7Q ring geometry
 * is angle=0 at SIDE and angle=PI/2 at UP, hence +1/4 circumference.
 *
 * Sample the SAME two-triangle quad topology as V0.7Y's candidate mesh.
 * Do not bilinearly average a non-coplanar quad: that would put marks
 * slightly OFF the actually sampled triangle surface.
 */
import {
 serializeSnakePatternBlueprintV1, sampleSnakePatternSurfaceV1
} from './snake-pattern-blueprint-v1.mjs';
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';
export const SNAKE_PATTERN_SURFACE_BIND_VERSION='1.1';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const p=(x,y,z)=>F({x,y,z});
const add=(a,b)=>p(a.x+b.x,a.y+b.y,a.z+b.z);
const scale=(a,k)=>p(a.x*k,a.y*k,a.z*k);
const len=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const nearly=(a,b)=>Math.abs(a-b)<1e-8;
const validPoint=x=>x&&finite(x.x)&&finite(x.y)&&finite(x.z);
const refuse=why=>{throw new RangeError('v11_pattern_surface_'+why)};
function validMesh(volume,slender){
 if(volume?.version!=='0.7Q'||volume.skinApplied!==false||
  volume.bonesChanged!==false||
  ![13,24].includes(volume.sourceJointCount)||
  !Number.isInteger(volume.sectionsPerBone)||
  !Number.isInteger(volume.ringCount)||
  !Number.isInteger(volume.radialSegments)||
  volume.ringCount!==(volume.sourceJointCount-1)*
   volume.sectionsPerBone+1||
  volume.ringCount<8||volume.ringCount>1024||
  volume.radialSegments<8||volume.radialSegments>24||
  !Array.isArray(volume.worldRings)||
  volume.worldRings.length!==volume.ringCount||
  !Array.isArray(volume.worldCenters)||
  volume.worldCenters.length!==volume.ringCount)
  refuse('invalid_source_volume');
 let rings=volume.worldRings;
 let geometryUsed='v07q_unskinned_ghost';
 if(slender!==null){
  if(slender?.version!=='0.7Y'||slender.ok!==true||
   slender.skinApplied!==false||
   slender.sourceBonesModified!==false||
   slender.sourceHeadModified!==false||
   slender.sameVerticesRenderedAndSampled!==true||
   slender.originalHeadColliderStillAuthoritative!==true||
   slender.sourceJointCount!==volume.sourceJointCount||
   slender.bodyCandidate?.ringCount!==volume.ringCount||
   slender.bodyCandidate?.radialSegments!==volume.radialSegments||
   !Array.isArray(slender.bodyCandidate?.vertices)||
   !Array.isArray(slender.bodyWorldRings)||
   slender.bodyWorldRings.length!==volume.ringCount)
    refuse('invalid_slim_candidate');
  const flat=slender.bodyCandidate.vertices;
  if(flat.length!==volume.ringCount*volume.radialSegments)
   refuse('mismatched_slim_candidate_mesh');
  for(let i=0;i<volume.ringCount;i++){
   const ring=slender.bodyWorldRings[i];
   if(!Array.isArray(ring)||ring.length!==volume.radialSegments)
    refuse('mismatched_slim_ring');
   for(let j=0;j<ring.length;j++){
    const v=flat[i*volume.radialSegments+j];
    if(!validPoint(ring[j])||!validPoint(v)||
      len(ring[j],v)>1e-8)
     refuse('slim_render_and_collision_vertex_disagree');
   }
  }
  rings=slender.bodyWorldRings;
  geometryUsed='v07y_slim_collision_sampled';
 }
 for(const ring of rings){
  if(!Array.isArray(ring)||ring.length!==volume.radialSegments||
   !ring.every(validPoint))refuse('invalid_ring_vertex');
 }
 return {rings,geometryUsed};
}
function sampleAt(rings,radial,u,v){
 const longitudinal=u*(rings.length-1);
 const low=Math.min(rings.length-2,Math.floor(longitudinal));
 const s=clamp(longitudinal-low,0,1);
 // Our pattern v=0 marks dorsal, whereas ring j=0 points sideways.
 const azimuth=((v+.25)%1+1)%1;
 const around=azimuth*radial;
 const left=Math.floor(around)%radial;
 const right=(left+1)%radial,t=clamp(around-Math.floor(around),0,1);
 const a=rings[low][left],b=rings[low][right],
  c=rings[low+1][left],d=rings[low+1][right];
 let triangle,weights;
 if(s+t<=1){
  triangle=F([low*radial+left,(low+1)*radial+left,
   low*radial+right]);
  weights=F([1-s-t,s,t]);
 }else{
  triangle=F([low*radial+right,(low+1)*radial+left,
   (low+1)*radial+right]);
  weights=F([1-s,1-t,s+t-1]);
 }
 const chosen=s+t<=1?[a,c,b]:[b,c,d];
 const xyz=add(add(scale(chosen[0],weights[0]),
  scale(chosen[1],weights[1])),scale(chosen[2],weights[2]));
 return F({xyz,triangleVertexIndices:triangle,
  triangleWeights:weights,ringIndex:low,ringFraction:s,
  radialIndex:left,radialFraction:t,azimuth,
  barycentricWeightSum:weights.reduce((x,y)=>x+y,0)});
}
/**
 * blueprint is the immutable signed-by-checksum V1 recipe;
 * volume is actual V0.7Q transparent ring geometry;
 * slender optionally replaces it with validated V0.7Y ring vertices.
 * No new geometry is ever generated or returned.
 */
export function bindSnakePatternToSurfaceV11({
 blueprint,volume,slender=null,
 bodyLength=null
}={}){
 // Strict V1 serialized validator rejects a changed pattern rather than
 // rerolling marks. No mutated blueprints or unknown versions are trusted.
 serializeSnakePatternBlueprintV1(blueprint);
 const {rings,geometryUsed}=validMesh(volume,slender);
 // Source geometry length is not modified. Growth length is metadata
 // for proportional pattern scaling; caller must supply a finite figure.
 if(bodyLength===null)bodyLength=2.28;
 if(!finite(bodyLength)||bodyLength<=0||bodyLength>20)
  refuse('invalid_body_length');
 const anchors=sampleSnakePatternSurfaceV1(blueprint,{
  bodyLength,ringCount:volume.ringCount,
  radialSegments:volume.radialSegments
 });
 const marks=anchors.anchors.map(mark=>{
  const geo=sampleAt(rings,volume.radialSegments,mark.u,mark.v);
  const screen=projectSnakeFrontGlassPointV07g(geo.xyz);
  if(!finite(screen.x)||!finite(screen.y)||
   !nearly(geo.barycentricWeightSum,1))
   refuse('nonfinite_or_invalid_triangle_sample');
  return F({
   id:mark.id,u:mark.u,v:mark.v,
   lengthU:mark.lengthU,widthV:mark.widthV,
   bodyDistance:mark.bodyDistance,
   xyz:geo.xyz,screen:F({x:screen.x,y:screen.y}),
   surfaceTriangleIndices:geo.triangleVertexIndices,
   triangleWeights:geo.triangleWeights,
   ringIndex:geo.ringIndex,ringFraction:geo.ringFraction,
   radialIndex:geo.radialIndex,
   radialFraction:geo.radialFraction,
   azimuth:geo.azimuth
  });
 });
 return F({
  version:SNAKE_PATTERN_SURFACE_BIND_VERSION,
  patternId:blueprint.patternId,
  sourceJointCount:volume.sourceJointCount,
  ringCount:volume.ringCount,
  radialSegments:volume.radialSegments,
  bodyLength,geometryUsed,marks:F(marks),
  allMarksOnExistingTriangles:true,
  uvFixedToBody:true,
  storedBoneIndices:false,
  sourceBonesChanged:false,
  sourceBodyMeshChanged:false,
  sourceHeadModified:false,
  skinApplied:false,
  pixelTextureApplied:false,
  newCollisionAuthority:false,
  geneticsSimulated:false,
  affectsSave:false,affectsEcology:false,
  privateGameIntegrated:false
 });
}
