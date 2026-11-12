import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SNAKE_CORRIDOR_SAFETY_VERSION,
 createSnakeSafetyCorridorV07b,inspectSnakePoseCorridorV07b,
 inspectSnakeTravelCorridorV07b,chooseSafeSnakeRouteV07b,
 advanceSnakeSafelyV07b
} from '../src/ohm-core/snake-corridor-safety-v07b.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 sampleSnakeTravelPoseV07,advanceSnakeTravelStateV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {
 createSnakeGrowthMotionBridge,sampleSnakeGrowthMotionFrame
} from '../src/ohm-core/snake-growth-motion-adapter.mjs';

const body={length:1.2,boneCount:20,bodyRadius:.05};
const bounds={minX:-1.7,maxX:4,minY:-1.5,maxY:1.5};
const rock={id:'stone_01',kind:'circle',x:1,y:0,radius:.19};
const water={id:'water_01',kind:'rectangle',minX:1.8,maxX:2.1,
 minY:-.15,maxY:.25};
const area=createSnakeSafetyCorridorV07b({bounds,obstacles:[rock]});
assert.equal(SNAKE_CORRIDOR_SAFETY_VERSION,'0.7B');
assert.ok(Object.isFrozen(area));
assert.ok(Object.isFrozen(area.obstacles));
assert.ok(Object.isFrozen(area.obstacles[0]));
const straight=createSnakeTravelRouteV07([
 {x:0,y:0},{x:.8,y:0},{x:1.7,y:0},{x:3,y:0}
]);
const walking=createSnakeTravelStateV07(straight,{speed:.8});
const startPose=sampleSnakeTravelPoseV07(walking,body);
assert.equal(inspectSnakePoseCorridorV07b(startPose,area).ok,true,
 'whole tail must initially be clear');
const dstate=createSnakeTravelStateV07(straight,{distance:1,speed:.2});
const collisionPose=sampleSnakeTravelPoseV07(dstate,body);
const collision=inspectSnakePoseCorridorV07b(collisionPose,area);
assert.equal(collision.ok,false);
assert.equal(collision.reason,'obstacle_intersection');
assert.equal(collision.obstacleId,'stone_01');
assert.ok(Number.isInteger(collision.boneIndex));
const full=inspectSnakeTravelCorridorV07b(walking,area,{body});
assert.equal(full.ok,false);
assert.equal(full.reason,'obstacle_intersection');
assert.equal(full.obstacleId,'stone_01');
assert.ok(full.firstBlockedAt>0&&full.firstBlockedAt<1);
assert.equal(full.geometricOnly,true);
const safe=advanceSnakeSafelyV07b(walking,area,{
 body,seconds:3,moving:true
});
assert.equal(safe.ok,false);
assert.equal(safe.mode,'blocked');
assert.equal(safe.reason,'obstacle_intersection');
assert.equal(safe.obstacleId,'stone_01');
assert.ok(safe.state.distance>0&&safe.state.distance<1,
 'must make bounded progress but stop BEFORE rock');
assert.equal(safe.state.elapsedSeconds,3);
assert.equal(inspectSnakePoseCorridorV07b(
 sampleSnakeTravelPoseV07(safe.state,body),area).ok,true,
 'blocked snake must leave ALL bones outside rock');
assert.equal(walking.distance,0,'safe step never changes original');
const again=advanceSnakeSafelyV07b(safe.state,area,{
 body,seconds:.5,moving:true
});
assert.equal(again.mode,'blocked');
assert.equal(again.state.distance>=safe.state.distance-1e-9,true);
assert.equal(inspectSnakePoseCorridorV07b(
 sampleSnakeTravelPoseV07(again.state,body),area).ok,true);
const idle=advanceSnakeSafelyV07b(walking,area,{
 body,seconds:7,moving:false
});
assert.equal(idle.ok,true);
assert.equal(idle.mode,'resting');
assert.equal(idle.state.distance,walking.distance);
assert.deepEqual(sampleSnakeTravelPoseV07(idle.state,body).points,
 sampleSnakeTravelPoseV07(walking,body).points,
 'rest must preserve full body shape, not add a wave');
const obstacleMoved=createSnakeSafetyCorridorV07b({
 bounds,obstacles:[{...rock,x:-.65}]
});
const trapped=advanceSnakeSafelyV07b(walking,obstacleMoved,{
 body,seconds:1,moving:true
});
assert.equal(trapped.mode,'unsafe_start');
assert.equal(trapped.state,walking,'unsafe start must never shove the snake out');

const bypass=[
 {id:'through_stone',waypoints:[
  {x:0,y:0},{x:.8,y:0},{x:1.7,y:0},{x:3,y:0}
 ]},
 {id:'around_stone',waypoints:[
  {x:0,y:0},{x:.25,y:.6},{x:1.15,y:.82},
  {x:2.2,y:.75},{x:3,y:0}
 ]}
];
const original=JSON.stringify(bypass);
const choice=chooseSafeSnakeRouteV07b(bypass,area,{body});
assert.equal(choice.ok,true);
assert.equal(choice.id,'around_stone');
assert.equal(choice.rejected.length,1);
assert.equal(choice.rejected[0].id,'through_stone');
assert.equal(choice.rejected[0].reason,'obstacle_intersection');
assert.deepEqual(choice.testedCandidates,['through_stone','around_stone']);
assert.equal(choice.status,
 'authored_candidate_passes_2d_proxy_checks_not_pathfinding');
assert.equal(JSON.stringify(bypass),original,'route candidate inputs remain unchanged');
assert.ok(Object.isFrozen(choice));
assert.ok(Object.isFrozen(choice.route));
const valid=inspectSnakeTravelCorridorV07b(
 createSnakeTravelStateV07(choice.route),area,{body});
assert.equal(valid.ok,true,'every sampled body section clears rock');
assert.ok(valid.checked>=90,
 'not just head and final end frame; check travel across the whole route');
const clearStep=advanceSnakeSafelyV07b(
 createSnakeTravelStateV07(choice.route,{speed:.5}),area,{
  body,seconds:2,moving:true
 });
assert.equal(clearStep.mode,'moving');
assert.equal(clearStep.ok,true);
assert.ok(clearStep.state.distance>.1);
assert.equal(inspectSnakePoseCorridorV07b(
 sampleSnakeTravelPoseV07(clearStep.state,body),area).ok,true);
const stay=advanceSnakeSafelyV07b(clearStep.state,area,{
 body,seconds:1,moving:false
});
assert.deepEqual(
 sampleSnakeTravelPoseV07(clearStep.state,body).points,
 sampleSnakeTravelPoseV07(stay.state,body).points);
const none=chooseSafeSnakeRouteV07b([bypass[0]],area,{body});
assert.equal(none.ok,false);
assert.equal(none.route,null);
assert.equal(none.reason,'no_verified_route');

const rectArea=createSnakeSafetyCorridorV07b({bounds,
 obstacles:[water]});
const mid=sampleSnakeTravelPoseV07(
 createSnakeTravelStateV07(straight,{distance:1.9}),body);
assert.equal(inspectSnakePoseCorridorV07b(mid,rectArea).ok,false,
 'rectangle obstacle blocks centerline');
const clearRectangle=inspectSnakePoseCorridorV07b(
 startPose,rectArea);
assert.equal(clearRectangle.ok,true);
const wallArea=createSnakeSafetyCorridorV07b({
 bounds:{minX:-.1,maxX:4,minY:-1.5,maxY:1.5},obstacles:[]
});
const boundary=inspectSnakePoseCorridorV07b(startPose,wallArea);
assert.equal(boundary.ok,false);
assert.equal(boundary.reason,'wall_boundary');
const tooManyChecks=inspectSnakeTravelCorridorV07b(walking,area,{
 body,maximumChecks:10
});
assert.equal(tooManyChecks.ok,false);
assert.equal(tooManyChecks.reason,'too_many_unchecked_steps');
const emptyArea=createSnakeSafetyCorridorV07b({
 bounds,obstacles:[]
});
const noRock=advanceSnakeSafelyV07b(walking,emptyArea,{
 body,seconds:4,moving:true
});
assert.equal(noRock.ok,true);
assert.equal(noRock.mode,'moving');
const reached=advanceSnakeTravelStateV07(walking,{
 seconds:4,moving:true
});
assert.deepEqual(noRock.state,reached,
 'when clear, the safe wrapper gives the same motion as V0.7A');

for(const speciesId of ['generic_snake','corn_snake','hognose_snake']){
 const bridge=createSnakeGrowthMotionBridge({
  speciesId,bodyLength:body.length,boneCount:body.boneCount
 });
 const approved=chooseSafeSnakeRouteV07b(bypass,area,{
  body:bridge.motionParameters
 });
 assert.equal(approved.ok,true);
 assert.equal(approved.id,'around_stone');
 const motion=createSnakeTravelStateV07(approved.route,{speed:.2});
 const frame=sampleSnakeGrowthMotionFrame(bridge,{
  motionSource:'path-history-v07',pathState:motion,mode:'ground'
 });
 assert.equal(frame.motionSource,'path-history-v07');
 assert.equal(frame.mesh.uv,bridge.rig.uv,'legacy species rig UV unchanged');
 assert.equal(frame.head.speciesId,speciesId);
 assert.equal(inspectSnakePoseCorridorV07b(frame.pose,area).ok,true);
}
for(const f of [
 ()=>createSnakeSafetyCorridorV07b(),
 ()=>createSnakeSafetyCorridorV07b({bounds:{...bounds,minX:4.5}}),
 ()=>createSnakeSafetyCorridorV07b({bounds,margin:NaN}),
 ()=>createSnakeSafetyCorridorV07b({bounds,obstacles:[rock,rock]}),
 ()=>createSnakeSafetyCorridorV07b({bounds,obstacles:[{...rock,radius:0}]}),
 ()=>createSnakeSafetyCorridorV07b({bounds,obstacles:[{...rock,kind:'spiral'}]}),
 ()=>createSnakeSafetyCorridorV07b({bounds,obstacles:[{
  id:'badrect',kind:'rectangle',minX:1,maxX:0,minY:0,maxY:1
 }]}),
 ()=>chooseSafeSnakeRouteV07b([],area,{body}),
 ()=>chooseSafeSnakeRouteV07b(bypass,area,{body:{...body,bodyRadius:NaN}}),
 ()=>chooseSafeSnakeRouteV07b([bypass[0],bypass[0]],area,{body}),
 ()=>inspectSnakeTravelCorridorV07b(walking,area,{
  body,maximumChecks:0
 }),
 ()=>advanceSnakeSafelyV07b(walking,area,{
  body,seconds:-1
 })
])assert.throws(f,RangeError);
// Do not trust user-provided objects that only spoof version '0.7B'.
// Unknown walls, malformed radii or NaN must FAIL CLOSED, never PASS.
for(const corrupted of [
 {...area,margin:NaN},
 {...area,bounds:{...bounds,maxX:NaN}},
 {...area,obstacles:[{id:'fake_rock',kind:'circle',x:1,y:0,radius:NaN}]},
 {...area,obstacles:[{id:'fake_box',kind:'rectangle',
  minX:2,minY:0,maxX:1,maxY:1}]}
]){
 assert.throws(()=>inspectSnakePoseCorridorV07b(startPose,corrupted),
  RangeError,'invalid world proxies must not yield a false clear');
}
const src=readFileSync(
 new URL('../src/ohm-core/snake-corridor-safety-v07b.mjs',import.meta.url),
 'utf8'
);
assert.doesNotMatch(src,/\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|Math\.random\s*\(|\bsaveGame\s*\(/);
assert.doesNotMatch(src,/createTerrariumSceneGeometryV03d|restoreCloudBackup|deformSnakeRig3D/,
 'obstacle broad-phase must not invent a second world or apply skin');
console.log('PASS SNAKE V0.7B: full-body capsules vs circles/rectangles/walls, safe stop before collision, deterministic authored bypass, 3 species V0.7A compat, no writes.');
