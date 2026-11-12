import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {
 prepareSnakeGroundHandoffV07s,advanceSnakeGroundHandoffV07s
} from '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs';
import {
 SNAKE_GROUND_TEMPORAL_VERSION,createSnakeGroundTemporalV07t,
 advanceSnakeGroundTemporalV07t
} from '../src/ohm-core/snake-ground-temporal-v07t.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07t_temporal_rest_to_ground_qa',
 objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,z=.135,points=[];
for(let i=0;i<=6;i++)
 points.push(Object.freeze({x:.65,y:-1.32+i*ds,z}));
for(const deg of [90,120,150,180,210,240]){
 const p=points.at(-1),a=deg*Math.PI/180;
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z
 }));
}
const source=Object.freeze({
 version:'0.7P_source_pose',points:Object.freeze(points),
 segmentLength:ds,bodyRadius:.13
});
const originalProbe=createSnakeWallProbeV07p({
 scene,terrain,basePose:source,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
let wallState=originalProbe;
for(let i=0;i<95;i++){
 const step=advanceSnakeWallProbeV07p(wallState,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true,'V0.7P source frame '+i);
 wallState=step.nextState;
}
const sourceJSON=JSON.stringify({wallState,scene,terrain});
const handoff=prepareSnakeGroundHandoffV07s({
 wallState,scene,terrain,
 targetJointCount:24,departure:{x:.1,y:.025},
 speciesId:'generic_snake'
});
assert.equal(handoff.ok,true,handoff.reason);
assert.equal(SNAKE_GROUND_TEMPORAL_VERSION,'0.7T');
const start=createSnakeGroundTemporalV07t({
 handoff,rampSeconds:.75,accelerationLimit:.85,maxJointSpeed:.35
});
assert.equal(start.version,'0.7T');
assert.equal(start.sourceVersion,'0.7S');
assert.equal(start.frames,0);
assert.equal(start.elapsedSeconds,0);
assert.equal(start.lastGroundSupportCount,24);
assert.equal(start.previousSpeeds.length,24);
assert.ok(Object.isFrozen(start)&&Object.isFrozen(start.v07sState));
assert.deepEqual(start,createSnakeGroundTemporalV07t({handoff}),
 'same source must produce deterministic temporal state');

const direct=advanceSnakeGroundHandoffV07s(handoff.nextState,{
 scene,terrain,seconds:1/30,maxJointSpeed:.35
});
assert.equal(direct.ok,true);
let current=start,first=null,early=null,latest=null;
const timeSeries=[],frontSpeeds=[],tailSeries=[];
for(let i=0;i<90;i++){
 const step=advanceSnakeGroundTemporalV07t(current,{
  scene,terrain,seconds:1/30
 });
 assert.equal(step.ok,true,'V0.7T frame '+i+' '+step.reason);
 assert.ok(step.pose&&step.head&&step.nextState);
 assert.equal(step.sourceBoneLengthMaintained,true);
 assert.equal(step.sourceHeadCollisionChecked,true);
 assert.equal(step.sceneAuthorityPreserved,true);
 assert.equal(step.underlyingV07sCheckPassed,true);
 assert.equal(step.physicsVerified,false);
 assert.equal(step.groundFrictionVerified,false);
 assert.equal(step.biologicalTimingVerified,false);
 assert.equal(step.realContactMigrationVerified,false);
 assert.equal(step.oldV07aRouteAuthorized,false);
 assert.equal(step.skinApplied,false);
 assert.equal(step.playableCaveAuthorized,false);
 assert.equal(step.pose.points.length,24);
 assert.ok(step.sourceContactCount>=20);
 assert.ok(step.maxJointAcceleration<=.85+1e-8);
 assert.ok(step.maxJointSpeed<=.35+1e-8);
 assert.ok(step.motionPace>=.025&&step.motionPace<=1);
 assert.ok(step.rampProgress<=1);
 assert.equal(inspectSnakeTerrariumPoseV07c(step.pose,scene).ok,true);
 assert.equal(inspectSnakeTerrainClearance(step.pose,{
  terrain,samplesPerBone:24
 }).ok,true);
 for(let j=1;j<step.pose.points.length;j++){
  const a=step.pose.points[j-1],b=step.pose.points[j];
  assert.ok(Math.abs(Math.hypot(
   a.x-b.x,a.y-b.y,a.z-b.z
  )-2.28/23)<1e-7,'no 3D bone stretch at frame '+i);
 }
 if(i===0)first=step;
 if(i===14)early=step;
 timeSeries.push(step.motionPace);
 frontSpeeds.push(step.maxJointSpeed);
 tailSeries.push(step.tailTravel);
 current=step.nextState;
 latest=step;
}
assert.ok(first.motionPace<.04,
 'the first frame must not jump to normal gliding speed');
assert.ok(first.maxJointSpeed<direct.maxJointDelta*30*.1,
 'first V0.7T motion must be much smaller than immediate V0.7S motion');
assert.ok(timeSeries[3]<timeSeries[10]&&timeSeries[10]<timeSeries[22],
 'head speed should ramp smoothly without a hard first-step jerk');
assert.equal(timeSeries[25],1,'speed ramp eventually reaches source speed');
assert.ok(latest.headTravel>.20,
 'head still meaningfully advances after easing, not just a cosmetic pause');
assert.ok(latest.headTravel<.31,
 'ramped departure should be shorter than un-eased baseline');
assert.ok(early.rearMovement<=early.headTravel+.006,
 'rear must not overtake head before departure settles');
assert.ok(latest.rearSettledJointCount>=0);
assert.ok(latest.tailTravel<latest.headTravel,
 'the rear should lag the leading head at the end of probe');
assert.equal(current.frames,90);
assert.ok(current.elapsedSeconds>2.9);
assert.equal(JSON.stringify({wallState,scene,terrain}),sourceJSON,
 'neither original snake source nor scene may be mutated');
assert.deepEqual(start,createSnakeGroundTemporalV07t({handoff}));

// A tighter acceleration policy is allowed as an experiment, but must
// stop rather than silently exceed the user's requested limit.
const restricted=createSnakeGroundTemporalV07t({
 handoff,rampSeconds:.75,accelerationLimit:.1
});
let limited=restricted,blocked=null;
for(let i=0;i<30;i++){
 const r=advanceSnakeGroundTemporalV07t(limited,{
  scene,terrain,seconds:1/30
 });
 if(!r.ok){blocked=r;break;}
 limited=r.nextState;
}
assert.ok(blocked,'very low acceleration limit must fail closed');
assert.equal(blocked.reason,'v07t_unbounded_joint_acceleration');
assert.equal(blocked.pose,null);
assert.equal(blocked.nextState,null);

// Source changes must still delegate to V0.7S's existing authority.
const changed=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'rear_stone_02',kind:'rock_overhang',x:410,y:10,
  width:108,depth:70,height:190,transmissionPermille:0
 }
});
const invalidScene=advanceSnakeGroundTemporalV07t(start,{
 scene:changed,terrain,seconds:1/30
});
assert.equal(invalidScene.ok,false);
assert.equal(invalidScene.reason,'source_scene_or_terrain_changed');
assert.equal(invalidScene.pose,null);
assert.equal(invalidScene.nextState,null);
const invalidTerrain=advanceSnakeGroundTemporalV07t(start,{
 scene,terrain:{...terrain,groundZ:.09},seconds:1/30
});
assert.equal(invalidTerrain.ok,false);
assert.equal(invalidTerrain.pose,null);
assert.equal(invalidTerrain.nextState,null);

for(const opt of [
 {rampSeconds:0},{rampSeconds:2},{accelerationLimit:0},
 {maxJointSpeed:.01},{maxJointSpeed:NaN}
])assert.throws(()=>createSnakeGroundTemporalV07t({
 handoff,...opt
}),RangeError);
assert.throws(()=>createSnakeGroundTemporalV07t({
 handoff:{...handoff,resampledJointCount:13}
}),RangeError);
assert.throws(()=>createSnakeGroundTemporalV07t({
 handoff:{...handoff,gameTravelRouteAuthorized:true}
}),RangeError);
for(const seconds of [-.01,.11,NaN])
 assert.throws(()=>advanceSnakeGroundTemporalV07t(start,{
  scene,terrain,seconds
 }),RangeError);
const sourceCode=readFileSync(new URL(
 '../src/ohm-core/snake-ground-temporal-v07t.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/createSnakeGroundTemporalV07t/);
assert.match(html,/advanceSnakeGroundTemporalV07t/);
assert.match(html,/qaV07tHeadLed/);
assert.doesNotMatch(sourceCode,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7T: V0.7P rest→V0.7S same length→90 smoothly ramped source-safe head-led frames, 23 exact 3D bones, rear settling, acceleration guard, failed scene/terrain and no skin, physics or old-route claim.');
