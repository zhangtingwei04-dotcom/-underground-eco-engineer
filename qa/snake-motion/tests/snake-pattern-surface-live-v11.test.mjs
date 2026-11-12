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
 sceneId:'v11_dynamic_pattern_surface_chain',
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

import {createSnakePatternBlueprintV1,serializeSnakePatternBlueprintV1}
 from '../src/ohm-core/snake-pattern-blueprint-v1.mjs';
import {bindSnakePatternToSurfaceV11}
 from '../src/ohm-core/snake-pattern-surface-bind-v11.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from '../src/ohm-core/snake-temporal-continuity-v08d.mjs';

const blueprint=createSnakePatternBlueprintV1({
 seed:41182026,speciesId:'western_hognose',
 styleId:'neutral_blotches',markCount:22,
 paletteId:'neutral_earth'
});
const serial=serializeSnakePatternBlueprintV1(blueprint);
let prior=null,wallPeak=0,groundPeak=0;
let sampleCount13=0,sampleCount24=0;
let last13=null,first24=null;
function surface(pose,expectedCount,stage){
 const volume=buildTransparentBodyVolumeV07q({pose});
 const mapped=bindSnakePatternToSurfaceV11({blueprint,volume});
 assert.equal(mapped.sourceJointCount,expectedCount);
 assert.equal(mapped.marks.length,blueprint.markCount);
 assert.equal(mapped.skinApplied,false);
 assert.equal(mapped.originalHeadColliderStillAuthoritative,undefined);
 assert.equal(mapped.sourceBonesChanged,false);
 assert.equal(mapped.sourceBodyMeshChanged,false);
 for(let i=0;i<mapped.marks.length;i++){
  const a=mapped.marks[i],ref=blueprint.marks[i];
  assert.equal(a.id,ref.id);
  assert.equal(a.u,ref.u);
  assert.equal(a.v,ref.v);
  assert.ok(a.triangleWeights.every(w=>w>=-1e-9&&w<=1+1e-9));
  assert.ok([a.xyz.x,a.xyz.y,a.xyz.z].every(Number.isFinite));
 }
 if(prior){
  let max=0;
  for(let i=0;i<mapped.marks.length;i++){
   const old=prior.marks[i].xyz,now=mapped.marks[i].xyz;
   max=Math.max(max,Math.hypot(
    now.x-old.x,now.y-old.y,now.z-old.z));
  }
  if(stage==='wall'){
   wallPeak=Math.max(wallPeak,max);
   assert.ok(max<.08,
    'source V0.7P 13-joint dorsal stripe must not jump during rearing');
  }else if(stage==='ground'){
   groundPeak=Math.max(groundPeak,max);
   assert.ok(max<.06,
    'V0.7U 24-joint surface anchors must not jump between actual turn frames');
  }
 }
 prior=mapped;
 assert.equal(serializeSnakePatternBlueprintV1(blueprint),serial);
 return mapped;
}
let w=createSnakeWallProbeV07p({
 scene,terrain,basePose:pose,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
for(let frame=1;frame<=95;frame++){
 const step=advanceSnakeWallProbeV07p(w,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true,'raised wall frame '+frame);
 w=step.nextState;
 last13=surface(step.pose,13,'wall');
 sampleCount13++;
}
assert.equal(JSON.stringify(w),JSON.stringify(wall),
 'fixture wall must match the independent source-backbone replay');
const handoff=prepareSnakeGroundHandoffV07s({
 wallState:w,scene,terrain,targetJointCount:24,
 departure:{x:.1,y:-.025},speciesId:'generic_snake'
});
assert.equal(handoff.ok,true,handoff.reason);
first24=surface(handoff.pose,24,'handoff');
let handoffMax=0;
for(let i=0;i<first24.marks.length;i++){
 const a=last13.marks[i].xyz,b=first24.marks[i].xyz;
 handoffMax=Math.max(handoffMax,
  Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z));
}
assert.ok(handoffMax<.1,
 '13-to-24 bone transfer must not re-roll or teleport pattern anchors');
sampleCount24++;
let relay=createSnakeCurvatureRelayV07u({
 temporalState:createSnakeGroundTemporalV07t({handoff}),
 turnRadians:.24
});
for(let frame=1;frame<=90;frame++){
 const old=relay.temporalState.v07sState.pose;
 const step=advanceSnakeCurvatureRelayV07u(relay,{
  scene,terrain,seconds:1/30
 });
 assert.equal(step.ok,true,'source 24-bone turn '+frame+': '+step.reason);
 const guard=inspectSnakeTemporalContinuityV08d({
  previousPose:old,pose:step.pose
 });
 assert.equal(guard.visualBendAccepted,true);
 surface(step.pose,24,'ground');
 sampleCount24++;
 relay=step.nextState;
}
assert.equal(sampleCount13,95);
assert.equal(sampleCount24,91);
assert.ok(wallPeak>0);
assert.ok(groundPeak>0);
assert.equal(serializeSnakePatternBlueprintV1(blueprint),serial);
console.log('PASS V1.1 real motion UV anchor run '+JSON.stringify({
 wallFrames:sampleCount13,groundFrames:sampleCount24,
 wallPeakUVSurfaceStep:+wallPeak.toFixed(7),
 handoffPeakUVSurfaceDisplacement:+handoffMax.toFixed(7),
 groundedPeakUVSurfaceStep:+groundPeak.toFixed(7),
 patternId:blueprint.patternId,
 bodySkinApplied:false
}));
