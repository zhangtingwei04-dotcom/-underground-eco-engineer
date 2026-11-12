import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 advanceSnakeTravelStateV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {sampleSnakeGroundNeckV07d}
 from '../src/ohm-core/snake-terrain-neck-v07d.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 SNAKE_NECK_TEMPORAL_VERSION,advanceSnakeNeckTemporalV07f
} from '../src/ohm-core/snake-neck-temporal-v07f.mjs';

const scene=createTerrariumSceneGeometryV03d({sceneId:'v07f_neck_gate'});
const source=JSON.stringify(scene);
const terrain={groundZ:0,rock:null,perch:null};
const path=createSnakeTravelRouteV07([
 {x:-.3,y:-.4},{x:.22,y:-.34},{x:.6,y:.1},
 {x:1.15,y:.22},{x:1.7,y:.22},{x:2.3,y:.0}
]);
const body={length:1.4,boneCount:24,bodyRadius:.084};
assert.equal(SNAKE_NECK_TEMPORAL_VERSION,'0.7F');
const zeroF=(state,speciesId='generic_snake')=>
 sampleSnakeGroundNeckV07d({state,scene,terrain,body,speciesId});
let travelling=createSnakeTravelStateV07(path,{distance:.65,speed:.15});
let prev=null,previousBase=null;
let accepted=0,bent=0,failed=0,maxRelative=0;
for(let i=0;i<30;i++){
 travelling=advanceSnakeTravelStateV07(travelling,{
  seconds:.1,moving:true
 });
 const ground=zeroF(travelling);
 assert.equal(ground.ok,true,'V0.7D baseline must be clear');
 const frame=advanceSnakeNeckTemporalV07f({
  groundFrame:ground,scene,terrain,
  previousState:prev,seconds:.1
 });
 if(!frame.renderable){
  assert.equal(frame.pose,null,'unsafe transition must not be drawable');
  assert.equal(frame.head,null);
  assert.equal(frame.nextState,null,
   'unsafe transition must not overwrite previous ephemeral state');
  assert.equal(frame.reason,'neck_transition_would_jump_or_unresolved');
  failed++;
  continue;
 }
 accepted++;
 if(frame.bent)bent++;
 assert.equal(frame.version,'0.7F');
 assert.equal(frame.appliedYaw,frame.nextState.appliedYaw);
 assert.ok(Math.abs(frame.appliedYaw)<=.12);
 assert.ok(frame.maxRelativeJointDelta<=frame.maximumPermittedJointDelta+1e-9);
 if(prev)assert.ok(Math.abs(frame.appliedYaw-prev.appliedYaw)<=.0400000001,
  'yaw must be bounded by 0.4 radians/second');
 assert.equal(frame.nextState.sceneId,scene.sceneId);
 assert.ok(Object.isFrozen(frame));
 assert.ok(Object.isFrozen(frame.nextState));
 assert.ok(Object.isFrozen(frame.nextState.localOffsets));
 assert.ok(Object.isFrozen(frame.nextState.localOffsets[1]));
 assert.equal(inspectSnakeTerrainClearance(frame.pose,{
  terrain,samplesPerBone:16
 }).ok,true);
 assert.equal(inspectSnakeTerrariumPoseV07c(frame.pose,scene).ok,true);
 for(let k=1;k<frame.pose.points.length;k++){
  const a=frame.pose.points[k],b=frame.pose.points[k-1];
  assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-
   body.length/(body.boneCount-1))<1e-6,
   'never interpolate/resize fixed-length bone segments');
 }
 for(const p of frame.head.meshPositions)
  assert.ok(p.z>=-.00001,'head can never cut into flat ground');
 maxRelative=Math.max(maxRelative,frame.maxRelativeJointDelta);
 prev=frame.nextState;
 previousBase=ground.pose;
}
assert.equal(accepted+failed,30);
assert.ok(accepted>=20,
 'on a known, clear curved test route many frames must be usable');
assert.ok(bent>=12,'temporal gate must actually retain some multi-bone movement');
assert.equal(JSON.stringify(scene),source);

// Force a rapid target reversal. Frame-to-frame YAW and per-bone relative
// positions must still respect explicit rate limits (no unsafe animation lerp).
const steady=zeroF(createSnakeTravelStateV07(path,{
 distance:1.2,speed:.15
}));
let temporal=null,from=0,active=0;
for(let i=0;i<24;i++){
 const direction=i<8?.11:i<16?-.11:.11;
 const frame=advanceSnakeNeckTemporalV07f({
  groundFrame:steady,scene,terrain,
  desiredYaw:direction,
  previousState:temporal,seconds:.1,
  maxYawRate:.32,maxJointSpeed:.12
 });
 assert.equal(frame.renderable,true,
  'safe, static source pose must allow bounded reversal');
 assert.ok(Math.abs(frame.appliedYaw-from)<=.0320000001);
 assert.ok(frame.maxRelativeJointDelta<=.0120000001);
 assert.ok(frame.headMinimumClearance>=-.00001);
 temporal=frame.nextState;
 from=frame.appliedYaw;
 if(frame.bent)active++;
}
assert.ok(active>8);
const reverseFrame=advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene,terrain,
 desiredYaw:-.11,previousState:temporal,seconds:.01,
 maxYawRate:.2,maxJointSpeed:.002
});
if(!reverseFrame.renderable){
 assert.equal(reverseFrame.pose,null,
  'a rejected continuity frame must never snap into visible fallback');
 assert.equal(reverseFrame.nextState,null);
} else {
 assert.ok(reverseFrame.maxRelativeJointDelta<=.0000200001);
}

// A structurally valid, but unrelated previous pose deformation must NOT
// produce a sudden snap to either the new neck or the zero-bend pose.
// The renderer gets NO pose to display until it pauses/replans.
const disconnected=Object.freeze({
 ...temporal,
 appliedYaw:0,
 localOffsets:Object.freeze(temporal.localOffsets.map((p,i)=>Object.freeze({
  x:i===2?.015:0,y:0,z:0
 })))
});
const discontinuity=advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene,terrain,
 desiredYaw:0,previousState:disconnected,
 seconds:.001,maxJointSpeed:.001
});
assert.equal(discontinuity.renderable,false,
 'hard discontinuity must not silently reset to straight neck');
assert.equal(discontinuity.reason,'neck_transition_would_jump_or_unresolved');
assert.equal(discontinuity.pose,null);
assert.equal(discontinuity.head,null);
assert.equal(discontinuity.nextState,null);
assert.ok(discontinuity.nearestJointDelta>.000001);

const stationary=advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene,terrain,desiredYaw:0,seconds:0
});
assert.equal(stationary.renderable,true);
assert.equal(stationary.bent,false);
assert.strictEqual(stationary.pose,steady.pose,
 'zero target has no spurious autonomous neck animation');
const stable = advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene,terrain,desiredYaw:0,
 previousState:stationary.nextState,seconds:0
});
assert.equal(stable.renderable,true);
assert.equal(stable.maxRelativeJointDelta,0);

// A valid player-world geometry change MUST always be rechecked.
// A moved rock touching the snake cannot be rendered as a safe stale pose.
const rock={id:'blocking_rock',kind:'rock_overhang',
 x:540,y:150,width:100,depth:140,height:100,
 transmissionPermille:0};
const changedScene=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:rock
});
const denied=advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene:changedScene,terrain,
 previousState:stationary.nextState,seconds:.1
});
assert.equal(denied.renderable,false);
assert.equal(denied.reason,'current_scene_collision');
assert.equal(denied.pose,null);
assert.equal(denied.nextState,null);
assert.equal(denied.head,null);
assert.throws(()=>advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene:{...scene,sceneId:'another_scene'},terrain,
 previousState:stationary.nextState
 }),RangeError);

// Forged or mismatched previous frame state must not be trusted.
for(const previousState of [
 {...stationary.nextState,appliedYaw:NaN},
 {...stationary.nextState,localOffsets:[{x:0,y:0,z:0}]},
 {...stationary.nextState,sceneId:'another_snake_scene'},
 {...stationary.nextState,speciesId:'corn_snake'},
 {...stationary.nextState,boneCount:12},
 {...stationary.nextState,localOffsets:
  stationary.nextState.localOffsets.map((p,i)=>i===2?
   {...p,x:1}:p)
 }
])assert.throws(()=>advanceSnakeNeckTemporalV07f({
 groundFrame:steady,scene,terrain,previousState,seconds:.1
 }),RangeError);
for(const params of [
 {groundFrame:null},
 {groundFrame:{...steady,ok:false}},
 {groundFrame:steady,scene:null},
 {groundFrame:steady,scene,terrain:null},
 {groundFrame:steady,scene,terrain,desiredYaw:NaN},
 {groundFrame:steady,scene,terrain,desiredYaw:.13},
 {groundFrame:steady,scene,terrain,seconds:-.2},
 {groundFrame:steady,scene,terrain,seconds:1.5},
 {groundFrame:steady,scene,terrain,maxJointSpeed:0},
 {groundFrame:steady,scene,terrain,maxYawRate:4},
 {groundFrame:steady,scene,terrain,speciesId:'not_a_snake'},
 {groundFrame:steady,scene,terrain,links:2},
])assert.throws(()=>advanceSnakeNeckTemporalV07f(params),RangeError);
const code=readFileSync(new URL(
 '../src/ohm-core/snake-neck-temporal-v07f.mjs',import.meta.url
),'utf8');
assert.doesNotMatch(code,
 /\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|Math\.random\s*\(|saveGame\s*\(/);
assert.doesNotMatch(code,/Date\s*\(|requestAnimationFrame|setTimeout\s*\(/,
 'real-time clock integration belongs to the renderer, not this pure gate');
console.log('PASS SNAKE V0.7F: 30 moving constrained frames ('+
 accepted+' renderable, '+failed+' withheld, '+bent+
 ' bending), 24 controlled reversals, bounded yaw/relative bone change, fixed-length pose and head clearance, moved-scene fail-closed, no player writes.');
