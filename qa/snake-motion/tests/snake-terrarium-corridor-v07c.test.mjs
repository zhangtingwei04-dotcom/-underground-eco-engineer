import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent,
 isValidTerrariumSceneGeometryV03d
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 SNAKE_TERRARIUM_CORRIDOR_VERSION,
 SNAKE_TERRARIUM_SCALE_V07C,
 terrariumFloorToSnakeV07c,snakeFloorToTerrariumV07c,
 createSnakeTerrariumCorridorV07c,
 inspectSnakeTerrariumPoseV07c,
 chooseSnakeTerrariumRouteV07c,
 advanceSnakeInTerrariumV07c
} from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 inspectSnakePoseCorridorV07b
} from '../src/ohm-core/snake-corridor-safety-v07b.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 sampleSnakeTravelPoseV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {
 createSnakeGrowthMotionBridge,sampleSnakeGrowthMotionFrame
} from '../src/ohm-core/snake-growth-motion-adapter.mjs';

const close=(a,b)=>Math.abs(a-b)<1e-9;
const stone={id:'rock_01',kind:'rock_overhang',
 x:600,y:180,width:100,depth:60,height:400,transmissionPermille:0};
const canopy={id:'canopy_01',kind:'canopy',
 x:890,y:0,width:70,depth:80,height:250,transmissionPermille:800};
const screen={id:'screen_01',kind:'screen',
 x:30,y:300,width:70,depth:70,height:180,transmissionPermille:1000};
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'terrarium_snake_v07c',
 objects:[stone,canopy,screen]
});
assert.equal(isValidTerrariumSceneGeometryV03d(scene),true);
const snapshot=JSON.stringify(scene);
assert.equal(SNAKE_TERRARIUM_CORRIDOR_VERSION,'0.7C');
assert.equal(SNAKE_TERRARIUM_SCALE_V07C,.008);
for(const x of [0,140,320,500,670,1000]){
 for(const y of [0,70,200,400]){
  const p={x,y};
  const ground=terrariumFloorToSnakeV07c(p);
  const recovered=snakeFloorToTerrariumV07c(ground);
  assert.ok(close(p.x,recovered.x)&&close(p.y,recovered.y),
   'one uniform scale must preserve the authoritative ground dimensions');
  assert.equal(Object.isFrozen(ground),true);
 }
}
const bridge=createSnakeTerrariumCorridorV07c(scene);
assert.equal(bridge.sceneId,scene.sceneId);
assert.equal(bridge.sceneRevision,scene.revision);
assert.equal(bridge.minute,scene.minute);
assert.equal(bridge.sceneSchemaVersion,7);
assert.equal(bridge.objectIds.length,3);
assert.deepEqual(bridge.transform,{
 sourceWidth:1000,sourceDepth:400,unitsPerPixel:.008,
 originX:500,originY:200
});
assert.deepEqual(bridge.corridor.bounds,{
 minX:-4,maxX:4,minY:-1.6,maxY:1.6
});
assert.equal(bridge.corridor.obstacles.length,3);
const rockBox=bridge.corridor.obstacles.find(o=>o.id==='rock_01');
assert.equal(rockBox.kind,'rectangle');
assert.ok(close(rockBox.minX,.8));
assert.ok(close(rockBox.maxX,1.6));
assert.ok(close(rockBox.minY,-.16));
assert.ok(close(rockBox.maxY,.32));
assert.equal(Object.isFrozen(bridge),true);
assert.equal(Object.isFrozen(bridge.corridor.obstacles[0]),true);
assert.equal(JSON.stringify(scene),snapshot);
assert.ok(bridge.objectIds.includes('canopy_01'));
assert.ok(bridge.objectIds.includes('screen_01'));
assert.equal(bridge.corridor.obstacles.find(x=>x.id==='screen_01').kind,'rectangle',
 '100% light transmission does not magically grant physical passability');

const body={length:1.2,boneCount:20,bodyRadius:.05};
const candidates=[
 {id:'direct_through_rock',waypoints:[
  {x:320,y:200},{x:500,y:200},{x:720,y:200},{x:850,y:200}
 ]},
 {id:'around_rock',waypoints:[
  {x:320,y:200},{x:380,y:70},{x:540,y:52},
  {x:740,y:70},{x:850,y:200}
 ]}
];
const original=JSON.stringify(candidates);
const result=chooseSnakeTerrariumRouteV07c(scene,candidates,{body});
assert.equal(result.ok,true);
assert.equal(result.id,'around_rock');
assert.equal(result.rejected.length,1);
assert.equal(result.rejected[0].id,'direct_through_rock');
assert.equal(result.rejected[0].obstacleId,'rock_01');
assert.equal(result.sourceSceneId,scene.sceneId);
assert.equal(result.sourceSceneRevision,scene.revision);
assert.equal(result.status,'v03d_provenance_authored_2d_clearance_not_navigation');
assert.equal(JSON.stringify(candidates),original);
const direct=chooseSnakeTerrariumRouteV07c(scene,[candidates[0]],{body});
assert.equal(direct.ok,false);
assert.equal(direct.route,null);
const route=createSnakeTravelRouteV07(candidates[0].waypoints.map(
 terrariumFloorToSnakeV07c
));
const moving=createSnakeTravelStateV07(route,{speed:.8});
const stopped=advanceSnakeInTerrariumV07c(moving,scene,{
 body,seconds:5,moving:true
});
assert.equal(stopped.ok,false);
assert.equal(stopped.mode,'blocked');
assert.equal(stopped.reason,'obstacle_intersection');
assert.equal(stopped.obstacleId,'rock_01');
assert.ok(stopped.state.distance>0);
assert.ok(stopped.state.distance<route.length);
assert.equal(stopped.sourceSceneRevision,scene.revision);
assert.equal(inspectSnakeTerrariumPoseV07c(
 sampleSnakeTravelPoseV07(stopped.state,body),scene).ok,true,
 'blocked pose must never penetrate actual V0.3d rock footprint');

const approved=createSnakeTravelStateV07(result.route,{speed:.6});
const first=advanceSnakeInTerrariumV07c(approved,scene,{
 body,seconds:2.5
});
assert.equal(first.ok,true);
assert.equal(first.mode,'moving');
const resting=advanceSnakeInTerrariumV07c(first.state,scene,{
 body,seconds:2,moving:false
});
assert.equal(resting.mode,'resting');
assert.equal(resting.state.distance,first.state.distance);
assert.deepEqual(
 sampleSnakeTravelPoseV07(resting.state,body).points,
 sampleSnakeTravelPoseV07(first.state,body).points,
 'resting snake must not wiggle solely from simulation time');

for(const speciesId of ['generic_snake','corn_snake','hognose_snake']){
 const rig=createSnakeGrowthMotionBridge({
  speciesId,bodyLength:body.length,boneCount:body.boneCount
 });
 const frame=sampleSnakeGrowthMotionFrame(rig,{
  mode:'ground',motionSource:'path-history-v07',pathState:first.state
 });
 const safe=inspectSnakeTerrariumPoseV07c(frame.pose,scene,{snapshot:bridge});
 assert.equal(safe.ok,true);
 assert.equal(safe.sceneId,scene.sceneId);
 assert.equal(frame.head.speciesId,speciesId);
 assert.equal(frame.mesh.uv,rig.rig.uv);
 assert.equal(inspectSnakePoseCorridorV07b(frame.pose,bridge.corridor).ok,true);
}

// The scene itself owns any rock movement. The NEXT motion step MUST pick up
// the new revision and reject stale projection snapshots.
const relocated=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{...stone,x:280}
});
assert.equal(relocated.revision,scene.revision+1);
assert.equal(isValidTerrariumSceneGeometryV03d(relocated),true);
const next=createSnakeTerrariumCorridorV07c(relocated);
assert.equal(next.sceneRevision,relocated.revision);
assert.ok(close(next.corridor.obstacles.find(x=>x.id==='rock_01').minX,-1.76));
assert.throws(()=>inspectSnakeTerrariumPoseV07c(
 sampleSnakeTravelPoseV07(moving,body),relocated,{snapshot:bridge}
),/stale_terrarium_collision_snapshot/);
const unsafe=advanceSnakeInTerrariumV07c(moving,relocated,{
 body,seconds:1,moving:true
});
assert.equal(unsafe.mode,'unsafe_start',
 'moved rock colliding with existing snake must not force teleport');
assert.equal(unsafe.state,moving);
assert.equal(unsafe.sourceSceneRevision,relocated.revision);
assert.equal(unsafe.obstacleId,'rock_01');
// Overhang moved does not infer that a low snake may duck underneath it.
const noRock=createTerrariumSceneGeometryV03d({
 sceneId:'canopy_only',
 objects:[{...stone,id:'canopy_only_01',kind:'canopy',
   transmissionPermille:1000}]
});
const blockedByOverhead=chooseSnakeTerrariumRouteV07c(
 noRock,[candidates[0]],{body});
assert.equal(blockedByOverhead.ok,false);
assert.equal(blockedByOverhead.rejected[0].obstacleId,'canopy_only_01');
// V0.3d permits uppercase or digit-initial scene IDs. All authoritative
// valid identifiers must round-trip through the safety adapter unchanged.
const legalAlternateId=createTerrariumSceneGeometryV03d({
 sceneId:'mixed_ID_scene',
 objects:[{...stone,id:'1Stone_A'}]
});
assert.equal(isValidTerrariumSceneGeometryV03d(legalAlternateId),true);
const altBlocked=chooseSnakeTerrariumRouteV07c(
 legalAlternateId,[candidates[0]],{body});
assert.equal(altBlocked.ok,false);
assert.equal(altBlocked.rejected[0].obstacleId,'1Stone_A');
const wider=createSnakeTerrariumCorridorV07c(scene,{margin:.08});
assert.equal(wider.corridor.margin,.08);
assert.throws(()=>chooseSnakeTerrariumRouteV07c(
 scene,candidates,{body,margin:.12,snapshot:wider}
),/mismatched_collision_margin/,
 'a previously built low-margin corridor cannot undercut a new higher margin');
const wideResult=chooseSnakeTerrariumRouteV07c(
 scene,candidates,{body,margin:.08,snapshot:wider});
assert.equal(wideResult.ok,true);


// Light-sampling validity is NOT provenance authentication. With no lights
// active, swapping an object footprint may still pass V0.3d's structural
// validator. Never reuse an old corridor snapshot when geometry changes,
// even if a caller mistakenly keeps the old scene revision.
const tampered={...scene,objects:[{...stone,x:300},canopy,screen]};
assert.equal(isValidTerrariumSceneGeometryV03d(tampered),true,
 'light-only invariants do not authenticate scene provenance');
assert.throws(()=>inspectSnakeTerrariumPoseV07c(
 sampleSnakeTravelPoseV07(moving,body),tampered,{snapshot:bridge}
),/untrusted_terrarium_collision_snapshot/);
const forgedResult=advanceSnakeInTerrariumV07c(moving,tampered,{
 body,seconds:1
});
assert.equal(forgedResult.mode,'unsafe_start',
 'current externally supplied footprints must be reread, never cached');
// This malformed shape is truly invalid by the original authority.
const malformed={...scene,objects:[{...stone,x:NaN},canopy,screen]};
assert.equal(isValidTerrariumSceneGeometryV03d(malformed),false);
for(const action of [
 ()=>createSnakeTerrariumCorridorV07c(null),
 ()=>createSnakeTerrariumCorridorV07c(malformed),
 ()=>createSnakeTerrariumCorridorV07c(scene,{margin:NaN}),
 ()=>createSnakeTerrariumCorridorV07c(scene,{margin:-1}),
 ()=>terrariumFloorToSnakeV07c({x:-1,y:50}),
 ()=>terrariumFloorToSnakeV07c({x:1,y:Infinity}),
 ()=>snakeFloorToTerrariumV07c({x:4.5,y:0}),
 ()=>chooseSnakeTerrariumRouteV07c(scene,[],{body}),
 ()=>chooseSnakeTerrariumRouteV07c(scene,[{
   ...candidates[0],waypoints:[...candidates[0].waypoints,
     {x:1001,y:120}]
 }],{body}),
 ()=>chooseSnakeTerrariumRouteV07c(scene,[candidates[0]],{
   body,snapshot:{...bridge,sceneRevision:-1}
 }),
 ()=>inspectSnakeTerrariumPoseV07c(
   sampleSnakeTravelPoseV07(moving,body),scene,{
    snapshot:{...bridge,objectIds:['wrong']}
   }),
 ()=>advanceSnakeInTerrariumV07c(moving,malformed,{
   body,seconds:1
 })
])assert.throws(action,RangeError);
assert.equal(JSON.stringify(scene),snapshot,'no mutation of real ecology or light');
const src=readFileSync(new URL(
 '../src/ohm-core/snake-terrarium-corridor-v07c.mjs',import.meta.url
),'utf8');
assert.doesNotMatch(src,/\bfetch\s*\(|Math\.random\s*\(|\blocalStorage\b|\bindexedDB\b|deformSnakeRig3D|saveGame\s*\(/);
console.log('PASS SNAKE V0.7C: real V0.3d 1000x400 geometry maps uniformly to V0.7B full-body collision, moved rock revision invalidates old checks, 3 species 3D UV unchanged, no saves.');
