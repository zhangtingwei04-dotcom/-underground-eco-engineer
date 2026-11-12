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
 sceneId:'v08f_mid_motion_rock_interrupt',
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

import {pauseAndReplanSnakeV08f,resumeReplannedSnakeV08f}
 from '../src/ohm-core/snake-dynamic-replan-v08f.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from '../src/ohm-core/snake-temporal-continuity-v08d.mjs';

const candidateSet=Object.freeze([
 {id:'corrected',departure:{x:.1,y:-.025},turnRadians:.24},
 {id:'cautious',departure:{x:.1,y:-.05},turnRadians:.24},
 {id:'narrow',departure:{x:.08,y:-.05},turnRadians:.24}
]);
const ready=prepareSnakeGroundHandoffV07s({
 wallState:wall,scene,terrain,targetJointCount:24,
 departure:candidateSet[0].departure,speciesId:'generic_snake'
});
assert.equal(ready.ok,true);
let relay=createSnakeCurvatureRelayV07u({
 temporalState:createSnakeGroundTemporalV07t({handoff:ready}),
 turnRadians:.24
});
const milestones=[10,20,30,40,50,60];
const records=[];
for(let i=1;i<=60;i++){
 const step=advanceSnakeCurvatureRelayV07u(relay,{
  scene,terrain,seconds:1/30
 });
 assert.equal(step.ok,true,'time sweep safe pre-interruption '+i);
 relay=step.nextState;
 if(!milestones.includes(i))continue;
 const changed=applyTerrariumSceneGeometryV03dEvent(scene,{
  channel:'object',type:'upsert',object:{
   id:'moving_rock',kind:'rock_overhang',
   x:620,y:45,width:6,depth:6,height:120,transmissionPermille:0
  }
 });
 const preview=pauseAndReplanSnakeV08f({
  relayState:relay,scene:changed,terrain,
  candidates:candidateSet,horizonFrames:60
 });
 const row={atFrame:i,ok:preview.ok,reason:preview.reason,
  selected:preview.selected?.id??null,
  trials:preview.trials?.map(t=>({
   id:t.id,accepted:t.accepted,reason:t.reason,
   checkedFrames:t.checkedFrames
  }))??null};
 records.push(row);
 console.log('OHM V0.8F interruption sweep '+JSON.stringify(row));
 if(preview.ok){
  assert.equal(preview.phase,'paused');
  assert.equal(JSON.stringify(preview.pose),JSON.stringify(
   relay.temporalState.v07sState.pose),
   'pause is exact zero-displacement, not a reset');
  const after=resumeReplannedSnakeV08f({
   paused:preview,scene:changed,terrain
  });
  assert.equal(after.ok,true,'selected continuation should pass first step');
  assert.equal(after.previousFrame,i);
  assert.equal(after.nextFrame,i+1);
  assert.ok(after.maximumBendRadians<.65);
  assert.equal(after.skinApplied,false);
 }else{
  assert.equal(preview.phase==='stop'||preview.phase==='paused_no_route',true);
  assert.equal(preview.resumeState,null);
 }
}
assert.equal(records.length,6);
assert.ok(records.some(x=>x.ok),
 'some genuinely mid-motion obstacle timings must permit alternate paths');
assert.ok(records.every(x=>x.ok||x.reason),
 'any failure must have explicit fail-closed reason');
console.log('PASS V0.8F six midflight obstacle timings retain source pose, prove safe resume or explicit stop');
