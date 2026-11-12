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
 sceneId:'v08d_public_motion_continuity',
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

import {inspectSnakeTemporalContinuityV08d}
 from '../src/ohm-core/snake-temporal-continuity-v08d.mjs';

// Source-backed 90-frame time-series. Both known good and known bad
// departures are retained; bad routes must NOT be silently declared good.
function simulate(vector,steer=.24){
 const ready=prepareSnakeGroundHandoffV07s({
  wallState:wall,scene,terrain,targetJointCount:24,
  departure:vector,speciesId:'generic_snake'
 });
 assert.equal(ready.ok,true,ready.reason);
 let state=createSnakeCurvatureRelayV07u({
  temporalState:createSnakeGroundTemporalV07t({handoff:ready}),
  turnRadians:steer
 });
 let maxBend=0,maxRotation=0,maxStep=0,maxHeadStep=0;
 let worstFrame=-1,failed=null,limitViolations=0;
 let previous=state.temporalState.v07sState.pose;
 const input=JSON.stringify({scene,terrain,wall,ready});
 const series=[];
 for(let frame=1;frame<=90;frame++){
  const step=advanceSnakeCurvatureRelayV07u(state,{
   scene,terrain,seconds:1/30
  });
  if(!step.ok){failed={frame,reason:step.reason};break}
  const m=inspectSnakeTemporalContinuityV08d({
   previousPose:previous,pose:step.pose,seconds:1/30
  });
  assert.equal(m.unchangedLength,true);
  assert.equal(m.sourceModified,false);
  assert.equal(m.skinApplied,false);
  assert.equal(m.affectsSave,false);
  assert.equal(m.affectsEcology,false);
  if(!m.visualBendAccepted)limitViolations++;
  if(m.maximumBendRadians>maxBend){
    maxBend=m.maximumBendRadians;worstFrame=frame;
  }
  maxRotation=Math.max(maxRotation,m.maxStepTangentRotationRadians);
  maxStep=Math.max(maxStep,m.maxJointStep);
  maxHeadStep=Math.max(maxHeadStep,m.headStep);
  if([1,10,25,50,75,90].includes(frame))series.push({
   frame,bend:+m.maximumBendRadians.toFixed(6),
   angular:+m.maxStepTangentRotationRadians.toFixed(6),
   maxStep:+m.maxJointStep.toFixed(6)
  });
  previous=step.pose;state=step.nextState;
 }
 assert.equal(JSON.stringify({scene,terrain,wall,ready}),input,
  'diagnostics must not mutate source');
 const result={vector,steer,accepted:!failed,failed,
  maxBend:+maxBend.toFixed(8),
  maxRotation:+maxRotation.toFixed(8),
  maxJointStep:+maxStep.toFixed(8),
  maxHeadStep:+maxHeadStep.toFixed(8),
  limitViolations,worstFrame,series};
 console.log('OHM V0.8D temporal '+JSON.stringify(result));
 return result;
}
const clean=simulate({x:.1,y:-.025});
const stronger=simulate({x:.1,y:-.05});
const original=simulate({x:.1,y:.025});
const angled=simulate({x:.08,y:-.05});
for(const c of [clean,stronger,original,angled])
 assert.equal(c.accepted,true,'retained source guards pass four known vectors');
assert.equal(clean.limitViolations,0,'V0.8C should remain within .65 rad across every frame');
assert.equal(stronger.limitViolations,0);
assert.equal(angled.limitViolations,0);
assert.ok(original.limitViolations>0&&original.maxBend>.65,
 'the historical visually excessive route remains a valid negative control');
assert.ok(clean.maxJointStep<.03&&clean.maxHeadStep<.02,
 'corrected route must not teleport across frame boundaries');

// A synthetic positional discontinuity must fail closed rather than count as motion.
const newDs=2.28/23;
const straight=Object.freeze({
 segmentLength:newDs,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
   x:i*newDs,y:0,z:.135
 })))
});
const jump=Object.freeze({...straight,points:Object.freeze(
 straight.points.map(p=>Object.freeze({x:p.x+.3,y:p.y,z:p.z})))});
const discontinuity=inspectSnakeTemporalContinuityV08d({
 previousPose:straight,pose:jump
});
assert.ok(discontinuity.maxJointStep>.29);
assert.equal(discontinuity.visualBendAccepted,true,
 'max bend alone must never be mistaken for frame continuity');
assert.throws(()=>inspectSnakeTemporalContinuityV08d({
 previousPose:straight,pose:{...straight,segmentLength:.11}
}),RangeError);
assert.throws(()=>inspectSnakeTemporalContinuityV08d({
 previousPose:straight,pose:straight,seconds:0
}),RangeError);
console.log('PASS V0.8D source-backed motion series: 4 routes + negative visual and translation controls');
