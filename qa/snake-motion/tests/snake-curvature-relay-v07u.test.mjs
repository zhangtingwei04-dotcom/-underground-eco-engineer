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
import {prepareSnakeGroundHandoffV07s}
 from '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs';
import {createSnakeGroundTemporalV07t,advanceSnakeGroundTemporalV07t}
 from '../src/ohm-core/snake-ground-temporal-v07t.mjs';
import {
 createSnakeCurvatureRelayV07u,advanceSnakeCurvatureRelayV07u,
 SNAKE_CURVATURE_RELAY_VERSION
} from '../src/ohm-core/snake-curvature-relay-v07u.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07u_private_near_glass_curvature_qa',
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
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z
 }));
}
const pose=Object.freeze({
 version:'0.7P_source_pose',points:Object.freeze(points),
 segmentLength:ds,bodyRadius:.13
});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:pose,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const result=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(result.renderable,true,'V0.7P frame '+i);
 wall=result.nextState;
}
const handoff=prepareSnakeGroundHandoffV07s({
 wallState:wall,scene,terrain,
 targetJointCount:24,departure:{x:.1,y:.025},
 speciesId:'generic_snake'
});
assert.equal(handoff.ok,true,handoff.reason);
const temporal=createSnakeGroundTemporalV07t({handoff});
const sourceJSON=JSON.stringify({wall,scene,terrain,temporal});
const start=createSnakeCurvatureRelayV07u({temporalState:temporal});
assert.equal(start.version,SNAKE_CURVATURE_RELAY_VERSION);
assert.equal(start.frames,0);
assert.equal(start.initialBends.length,22);
assert.equal(start.firstBendFrames.length,22);
assert.ok(Object.isFrozen(start)&&Object.isFrozen(start.initialBends));
assert.deepEqual(start,createSnakeCurvatureRelayV07u({
 temporalState:temporal
}), 'V0.7U must have deterministic default parameters');
const baseDeparture=temporal.v07sState.departure;
assert.deepEqual(start.sourceDeparture,baseDeparture);
let state=start,first=null,last=null;
const turns=[],front=[],rear=[],quiet=[],moving=[],scores=[];
for(let i=0;i<90;i++){
 const step=advanceSnakeCurvatureRelayV07u(state,{
  scene,terrain,seconds:1/30
 });
 assert.equal(step.ok,true,'V0.7U frame '+i+' '+step.reason);
 assert.ok(step.pose&&step.head&&step.nextState);
 assert.equal(step.frames,i+1);
 assert.equal(step.sourceBoneLengthMaintained,true);
 assert.equal(step.sourceHeadCollisionChecked,true);
 assert.equal(step.sceneAuthorityPreserved,true);
 assert.equal(step.groundAccelerationGatePassed,true);
 assert.equal(step.gameTravelRouteAuthorized,false);
 assert.equal(step.realContactMigrationVerified,false);
 assert.equal(step.muscleWaveVerified,false);
 assert.equal(step.physicsVerified,false);
 assert.equal(step.skinApplied,false);
 assert.equal(step.playableCaveAuthorized,false);
 assert.equal(step.allGroundedCount,24);
 assert.equal(step.sourceTotalLength,temporal.v07sState.sourceTotalLength);
 assert.equal(step.pose.points.length,24);
 assert.ok(step.visualQuietGroundCount>=0);
 assert.equal(step.visualMovingGroundCount+step.visualQuietGroundCount,24);
 assert.ok(step.angularChangeMax<=.035+1e-8);
 assert.equal(inspectSnakeTerrariumPoseV07c(step.pose,scene).ok,true);
 assert.equal(inspectSnakeTerrainClearance(step.pose,{
  terrain,samplesPerBone:24
 }).ok,true);
 for(let j=1;j<step.pose.points.length;j++){
  const a=step.pose.points[j-1],b=step.pose.points[j];
  assert.ok(Math.abs(Math.hypot(
   a.x-b.x,a.y-b.y,a.z-b.z
  )-2.28/23)<1e-7,'fixed 3D source link '+j+' at frame '+i);
 }
 assert.ok(Math.abs(Math.hypot(step.currentDeparture.x,
  step.currentDeparture.y)-Math.hypot(baseDeparture.x,
  baseDeparture.y))<1e-12,'authored turn must preserve head drive magnitude');
 if(step.firstFrontBendFrame!==null&&step.firstRearBendFrame!==null)
  assert.ok(step.firstRearBendFrame>=step.firstFrontBendFrame,
   'no rear curvature before first near-head curvature');
 turns.push(step.steerRadians);
 front.push(step.frontCurvatureChange);
 rear.push(step.rearCurvatureChange);
 quiet.push(step.visualQuietGroundCount);
 moving.push(step.visualMovingGroundCount);
 scores.push(step.headTravel);
 if(!first)first=step;
 last=step;
 state=step.nextState;
}
assert.equal(state.frames,90);
assert.ok(state.seconds>2.9);
assert.ok(turns[0]<.001,'turn must start near neutral');
assert.ok(turns[15]<turns[34]);
assert.ok(turns[34]<turns[65]);
assert.ok(Math.abs(turns[89]-.24)<1e-10,
 'final authored steering stays shallow and bounded');
assert.ok(scores[89]>.18,'head must move during the three-second probe');
assert.ok(front.some(v=>v>.0006),
 'near-head curvature must REALLY change, not just HUD counters');
assert.ok(moving.some(n=>n>0),
 'grounded segments must eventually move, not remain painted still');
assert.equal(state.movingFramesObserved,moving.filter(n=>n>0).length,
 'V0.7U should count the actual frames observing moving grounded joints');
assert.equal(state.quietFramesObserved,quiet.filter(n=>n>0).length,
 'V0.7U should count the actual frames observing low-motion grounded joints');
assert.ok(state.movingFramesObserved>0&&state.quietFramesObserved>0,
 'movement and low-motion support must be observed over time, not necessarily the same frame');
assert.ok(state.coexistFramesObserved<=Math.min(
 state.movingFramesObserved,state.quietFramesObserved));
assert.ok(quiet.some(n=>n>0),
 'a low-motion grounded part must be observable in this authored scene');
assert.equal(JSON.stringify({wall,scene,terrain,temporal}),sourceJSON,
 'original V0.7P/S/T source must remain unchanged throughout V0.7U');
const baseline=(()=>{
 let t=temporal;
 for(let i=0;i<90;i++){
  const s=advanceSnakeGroundTemporalV07t(t,{
   scene,terrain,seconds:1/30
  });
  assert.equal(s.ok,true);
  t=s.nextState;
 }
 return t;
})();
const ahead=state.temporalState.v07sState.pose.points[0];
const bhead=baseline.v07sState.pose.points[0];
assert.ok(Math.hypot(ahead.x-bhead.x,ahead.y-bhead.y)>.008,
 'actual 3D head path should curve relative to unsteered V0.7T');
assert.ok(Math.abs(ahead.y-bhead.y)>.006,
 'shallow direction change must be a REAL front-glass movement');

// Explicit low angular limit and source scene change must fail closed.
const veryTight=createSnakeCurvatureRelayV07u({
 temporalState:temporal,angularStepLimit:.002
});
let tight=veryTight,blocked=null;
for(let i=0;i<90;i++){
 const step=advanceSnakeCurvatureRelayV07u(tight,{
  scene,terrain,seconds:1/30
 });
 if(!step.ok){blocked=step;break;}
 tight=step.nextState;
}
assert.ok(blocked,'a very low steering angular limit must reject real curve');
assert.equal(blocked.reason,'v07u_unbounded_curvature_rotation');
assert.equal(blocked.pose,null);
assert.equal(blocked.nextState,null);
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'rear_stone_02',kind:'rock_overhang',x:410,y:10,
  width:108,depth:70,height:190,transmissionPermille:0
 }
});
const stale=advanceSnakeCurvatureRelayV07u(start,{
 scene:moved,terrain,seconds:1/30
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'source_scene_or_terrain_changed');
assert.equal(stale.pose,null);
assert.equal(stale.nextState,null);
const changedGround=advanceSnakeCurvatureRelayV07u(start,{
 scene,terrain:{...terrain,groundZ:.09},seconds:1/30
});
assert.equal(changedGround.ok,false);
assert.equal(changedGround.pose,null);
for(const options of [
 {turnRadians:1},{turnRadians:NaN},{turnStartSeconds:0},
 {turnDurationSeconds:.1},{angularStepLimit:0},
 {quietSpeedCutoff:-1}
])assert.throws(()=>createSnakeCurvatureRelayV07u({
 temporalState:temporal,...options
}),RangeError);
assert.throws(()=>createSnakeCurvatureRelayV07u({
 temporalState:{...temporal,frames:1}
}),RangeError);
for(const seconds of [-.01,.2,NaN])
 assert.throws(()=>advanceSnakeCurvatureRelayV07u(start,{
  scene,terrain,seconds
 }),RangeError);
const source=readFileSync(new URL(
 '../src/ohm-core/snake-curvature-relay-v07u.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/createSnakeCurvatureRelayV07u/);
assert.match(html,/advanceSnakeCurvatureRelayV07u/);
assert.match(html,/qaV07uRelay/);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7U: 95-step wall recovery, same 2.28/24-joint source, 90 safe shallow head-turn frames, real front bend change, quiet-vs-moving ground proxy, 23 fixed 3D links, source collision/head/terrain protected, no friction/skin/old route claims.');
