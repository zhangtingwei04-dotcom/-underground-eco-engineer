/**
 * Project OHM SNAKE V0.7N — read-only front-glass terrain wireframe.
 *
 * Input is an already-authored V0.7M triangle shell and its unchanged V0.3d
 * scene. Projection uses EXACT V0.7G camera; debug geometry is visible only
 * through an explicit lab toggle, never through the regular player scene.
 * No terrain collisions are approved; the transparent snake remains on the
 * existing V0.7C/D/F collision / motion path.
 */
import {sampleSnakeTerrainMeshV07m}
 from './snake-terrain-triangle-mesh-v07m.mjs';
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_TERRAIN_DEBUG_VERSION='0.7N';
const F=Object.freeze;
const freezeTriangles=triangles=>F(triangles.map((face,index)=>F({
 index,points:F(face.vertices.map(p=>projectSnakeFrontGlassPointV07g(p)))
})));
const perimeter=(bounds,corners)=>F([
 {x:bounds.minX,y:bounds.minY,z:corners[0]},
 {x:bounds.maxX,y:bounds.minY,z:corners[1]},
 {x:bounds.minX,y:bounds.maxY,z:corners[2]},
 {x:bounds.maxX,y:bounds.maxY,z:corners[3]}
].map(p=>projectSnakeFrontGlassPointV07g(p)));
export function createSnakeTerrainDebugV07n({scene,mesh}={}){
 // A sampled query performs V0.7M's full source revision and mesh-forgery
 // check before ANY triangle is projected onto the glass.
 if(mesh?.version!=='0.7M'||mesh.skinApplied!==false||
    mesh.playablePassageAuthorized!==false)
  throw new RangeError('v07n_requires_unapproved_v07m_geometry');
 const verified=sampleSnakeTerrainMeshV07m({
  scene,mesh,x:0,y:0,surface:'ground'
 });
 if(!verified.ok)throw new RangeError('v07n_ground_origin_unmodeled');
 const groundTriangles=freezeTriangles(mesh.ground.triangles);
 const caves=F(mesh.caves.map(c=>F({
  id:c.id,objectId:c.objectId,
  floorTriangles:freezeTriangles(c.floorTriangles),
  roofTriangles:freezeTriangles(c.roofTriangles),
  floorCorners:perimeter(c.bounds,c.floorCorners),
  roofCorners:perimeter(c.bounds,c.roofCorners),
  authorized:false,renderType:'unmeasured_cave_shell_wire_only'
 })));
 return F({
  version:SNAKE_TERRAIN_DEBUG_VERSION,
  sourceVersion:'0.7M',
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  camera:'V0.7G_front_glass',
  groundTriangles,caves,
  debugOnly:true,skinApplied:false,
  playablePassageAuthorized:false,
  affectsCollision:false,affectsEcology:false,
  status:'only_author_defined_triangle_projections_not_animal_passage_or_skin'
 });
}
