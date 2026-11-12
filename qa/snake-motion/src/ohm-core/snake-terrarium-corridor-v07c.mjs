/**
 * Project OHM SNAKE V0.7C — source-owned terrarium -> snake collision adapter.
 *
 * V0.3d remains the ONLY authoritative source for habitat object footprints,
 * scene revision and dimensions (1000 x 400 floor coordinates). V0.7B alone
 * owns the conservative 2D capsule collision test. This module is the narrow
 * pure coordinate bridge, NOT an independent terrarium copy or player save.
 *
 * All V0.3d objects are treated as solid *XY footprint* blockers. A canopy or
 * overhang might allow passage in 3D, but no verified undersurface height or
 * snake mesh collision is available: passability must FAIL CLOSED.
 * No real 3D glass/walls, tunnel entrance, climb/dig, friction or behavior AI.
 */
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeSafetyCorridorV07b,inspectSnakePoseCorridorV07b,
 chooseSafeSnakeRouteV07b,advanceSnakeSafelyV07b
} from './snake-corridor-safety-v07b.mjs';

export const SNAKE_TERRARIUM_CORRIDOR_VERSION='0.7C';
export const SNAKE_TERRARIUM_SCALE_V07C=.008;
const F=Object.freeze;
const fail=reason=>{throw new RangeError(reason)};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const range=(x,a,b)=>finite(x)&&x>=a&&x<=b;
const keys=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const safeScene=s=>{
 if(!isValidTerrariumSceneGeometryV03d(s))
  fail('invalid_authoritative_terrarium_scene');
 return s;
};
const p=(x,y)=>F({x,y});
const scale=SNAKE_TERRARIUM_SCALE_V07C;
/**
 * Uniform scale preserves the terrarium's 1000:400 aspect ratio, unlike
 * normalizing each axis into separate [-1,1] ranges, which distorts bodies.
 */
export function terrariumFloorToSnakeV07c({x,y}={}){
 if(!range(x,0,1000)||!range(y,0,400))
  fail('invalid_terrarium_ground_point');
 return p((x-500)*scale,(y-200)*scale);
}
export function snakeFloorToTerrariumV07c({x,y}={}){
 if(!range(x,-4,4)||!range(y,-1.6,1.6))
  fail('invalid_snake_ground_point');
 return p(x/scale+500,y/scale+200);
}
/**
 * Validate the ENTIRE scene before deriving any collision data, including
 * the existing light/transmission invariants and object coordinates.
 *
 * Every scene object has an AABB footprint; rendering-only transparency
 * (transmissionPermille) NEVER confers physical passability. Physical
 * undercuts/perching have no safe representation in this 2D proxy yet.
 */
export function createSnakeTerrariumCorridorV07c(scene,{margin=.005}={}){
 safeScene(scene);
 if(!range(margin,0,.2))fail('invalid_snake_terrarium_margin');
 const obstacles=scene.objects.map(o=>{
  const a=terrariumFloorToSnakeV07c({x:o.x,y:o.y});
  const b=terrariumFloorToSnakeV07c({
   x:o.x+o.width,y:o.y+o.depth
  });
  return F({
   id:o.id,kind:'rectangle',
   minX:a.x,maxX:b.x,minY:a.y,maxY:b.y
  });
 });
 const bounds=F({minX:-4,maxX:4,minY:-1.6,maxY:1.6});
 const corridor=createSnakeSafetyCorridorV07b({
  bounds,obstacles,margin
 });
 return F({
  version:SNAKE_TERRARIUM_CORRIDOR_VERSION,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  minute:scene.minute,sceneSchemaVersion:scene.schemaVersion,
  transform:F({
   sourceWidth:1000,sourceDepth:400,unitsPerPixel:scale,
   originX:500,originY:200
  }),
  corridor,
  objectIds:F(scene.objects.map(o=>o.id)),
  status:'v03d_source_owned_every_object_solid_xy_proxy_no_3d_passability'
 });
}
const assertSnapshot=(scene,derived)=>{
 safeScene(scene);
 if(derived?.version!==SNAKE_TERRARIUM_CORRIDOR_VERSION||
  derived.sceneId!==scene.sceneId||
  derived.sceneRevision!==scene.revision||
  derived.minute!==scene.minute||
  derived.sceneSchemaVersion!==scene.schemaVersion)
  fail('stale_terrarium_collision_snapshot');
 // The revision is required, but not sufficient when a caller presents a
 // mutated, forged scene. Recalculate and compare geometry before acceptance.
 const expected=createSnakeTerrariumCorridorV07c(scene,{
  margin:derived.corridor?.margin
 });
 if(JSON.stringify(derived)!==JSON.stringify(expected))
  fail('untrusted_terrarium_collision_snapshot');
 return derived;
};
export function inspectSnakeTerrariumPoseV07c(pose,scene,{snapshot=null}={}){
 const s=snapshot===null?createSnakeTerrariumCorridorV07c(scene):
  assertSnapshot(scene,snapshot);
 return F({...inspectSnakePoseCorridorV07b(pose,s.corridor),
  sceneId:s.sceneId,sceneRevision:s.sceneRevision});
}
/**
 * Candidate points are explicitly authored in V0.3d floor coordinates.
 * Never interpret a 2D rendering coordinate as a floor point. The call
 * returns geometry-only feasibility, NOT animal behavior or a chosen need.
 */
export function chooseSnakeTerrariumRouteV07c(scene,candidates,{
 body,margin=.005,snapshot=null
}={}){
 const s=snapshot===null?createSnakeTerrariumCorridorV07c(scene,{margin}):
  assertSnapshot(scene,snapshot);
 // An explicit clearance must not be silently replaced by a snapshot
 // created with a smaller margin. Different margins require resampling.
 if(s.corridor.margin!==margin)fail('mismatched_collision_margin');
 if(!Array.isArray(candidates)||candidates.length<1||candidates.length>6)
  fail('invalid_terrarium_route_candidates');
 const converted=candidates.map(item=>{
  if(!keys(item)||!Array.isArray(item.waypoints))
   fail('invalid_terrarium_route_candidate');
  return F({
   id:item.id,
   waypoints:F(item.waypoints.map(terrariumFloorToSnakeV07c))
  });
 });
 const result=chooseSafeSnakeRouteV07b(converted,s.corridor,{body});
 return F({...result,sourceSceneId:s.sceneId,
  sourceSceneRevision:s.sceneRevision,
  status:result.ok
   ?'v03d_provenance_authored_2d_clearance_not_navigation'
   :'v03d_provenance_blocked_no_route'});
}
/**
 * Always derive the obstacle corridor from the *current* V0.3d scene.
 * A moved or newly inserted rock therefore invalidates a previous clearance
 * and the snake STOPS rather than using a stale, cached obstacle map.
 */
export function advanceSnakeInTerrariumV07c(state,scene,{
 body,seconds=0,moving=true,pace=1,margin=.005
}={}){
 const s=createSnakeTerrariumCorridorV07c(scene,{margin});
 const result=advanceSnakeSafelyV07b(state,s.corridor,{
  body,seconds,moving,pace
 });
 return F({...result,sourceSceneId:s.sceneId,
  sourceSceneRevision:s.sceneRevision,
  sourceMinute:s.minute,
  collisionAuthority:'V0.3d_scene_floor_footprints_2d_only'});
}
