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
 sceneId:'v08e_public_candidate_preview',
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

import {previewSnakeObstacleDeparturesV08e}
 from '../src/ohm-core/snake-obstacle-lookahead-v08e.mjs';
const sourceJSON=JSON.stringify({scene,terrain,wall});
const options=Object.freeze([
 {id:'old_unsafe',departure:{x:.1,y:.025},turnRadians:.24},
 {id:'corrected',departure:{x:.1,y:-.025},turnRadians:.24},
 {id:'cautious',departure:{x:.1,y:-.05},turnRadians:.24},
 {id:'narrow',departure:{x:.08,y:-.05},turnRadians:.24}
]);
const clear=previewSnakeObstacleDeparturesV08e({
 wallState:wall,scene,terrain,candidates:options
});
assert.equal(clear.version,'0.8E');
assert.equal(clear.ok,true);
assert.equal(clear.chosenIndex,1,'rejected visual bad route cannot win');
assert.equal(clear.selected.id,'corrected');
assert.equal(clear.trials[0].reason,'visual_bend_too_tight');
assert.equal(clear.trials[0].accepted,false);
assert.equal(clear.trials[1].accepted,true);
assert.equal(clear.trials.length,4);
assert.ok(clear.trials[1].maximumBendRadians<.65);
assert.ok(clear.trials[1].maxJointStep<.012);
assert.equal(clear.selected.checkedFrames,90);
assert.equal(clear.skinApplied,false);
assert.equal(clear.collisionAuthorityPreserved,true);
assert.equal(clear.gameplayNavigationAuthorized,false);
assert.equal(JSON.stringify({scene,terrain,wall}),sourceJSON);

// True, source-owned alternative: x=620, y=45 is an actual 6x6
// pixel solid rock between two otherwise clear candidate paths.
// The corrected option collides, but the cautious option can pass all 90
// frames WITHOUT bending or changing the authoritative obstacle rules.
function restingWallFor(env){
 let session=createSnakeWallProbeV07p({
  scene:env,terrain,basePose:pose,
  pivotIndex:6,maxPitch:.36,wall:'rear',speciesId:'generic_snake'
 });
 for(let i=0;i<95;i++){
  const update=advanceSnakeWallProbeV07p(session,{
   scene:env,terrain,seconds:1/30,maxJointSpeed:.75
  });
  assert.equal(update.renderable,true,'V0.8E safe initial wall pose '+i);
  session=update.nextState;
 }
 return session;
}
for(const [x,y,expected] of [[620,45,'cautious'],[610,45,'narrow']]){
 const env=createTerrariumSceneGeometryV03d({
  sceneId:'v08e_alternate_real_rock_'+x+'_'+y,
  objects:[{id:'detour_rock',kind:'rock_overhang',
   x,y,width:6,depth:6,height:120,transmissionPermille:0}]
 });
 const safeSource=restingWallFor(env);
 const environmentJSON=JSON.stringify({env,safeSource,terrain});
 const trial=previewSnakeObstacleDeparturesV08e({
  wallState:safeSource,scene:env,terrain,candidates:options
 });
 console.log('OHM V0.8E selected detour '+JSON.stringify(trial));
 assert.equal(trial.ok,true);
 assert.equal(trial.selected.id,expected,
  'actual rock position must change the safe choice');
 assert.ok(trial.trials.some(x=>x.candidateId==='corrected'&&
  x.accepted===false&&/footprint_blocked/.test(x.reason)),
  'V0.8C corrected route MUST physically hit the selected rock');
 const selected=trial.trials[trial.chosenIndex];
 assert.equal(selected.accepted,true);
 assert.equal(selected.checkedFrames,90);
 assert.ok(selected.maximumBendRadians<=.65);
 assert.equal(trial.collisionAuthorityPreserved,true);
 assert.equal(trial.gameplayNavigationAuthorized,false);
 assert.deepEqual(trial,previewSnakeObstacleDeparturesV08e({
  wallState:safeSource,scene:env,terrain,candidates:options
 }), 'rock-aware selection must be deterministic');
 assert.equal(JSON.stringify({env,safeSource,terrain}),environmentJSON);
}

// Dynamic real collision source: one solid rock in the path. The preview
// must either choose a FULLY checked safe candidate or report STOP;
// never substitute a 2D projection or skip a later frame.
const blockedEnv=createTerrariumSceneGeometryV03d({
 sceneId:'v08e_public_obstructed_route',
 objects:[
  {id:'obstacle',kind:'rock_overhang',x:600,y:10,
   width:65,depth:70,height:120,transmissionPermille:0}
 ]
});
let blockedWall=createSnakeWallProbeV07p({
 scene:blockedEnv,terrain,basePose:pose,
 pivotIndex:6,maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const step=advanceSnakeWallProbeV07p(blockedWall,{
  scene:blockedEnv,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true,'initial staged pose should remain clear');
 blockedWall=step.nextState;
}
const blocked=previewSnakeObstacleDeparturesV08e({
 wallState:blockedWall,scene:blockedEnv,terrain,candidates:options
});
console.log('OHM V0.8E obstructed candidate results '+JSON.stringify(blocked));
assert.ok(blocked.trials.every(t=>!t.accepted||t.checkedFrames===90));
if(blocked.ok){
 assert.ok(blocked.selected&&blocked.chosenIndex!==null);
 assert.ok(blocked.trials[blocked.chosenIndex].accepted);
}else{
 assert.equal(blocked.reason,'no_source_safe_candidate');
 assert.equal(blocked.selected,null);
 assert.equal(blocked.chosenIndex,null);
}
assert.ok(blocked.trials.some(t=>!t.accepted&&
  /obstacle|blocked|collision/.test(t.reason)),
 'the source obstacle must actually cause at least one route rejection');
assert.deepEqual(clear,previewSnakeObstacleDeparturesV08e({
 wallState:wall,scene,terrain,candidates:options
}), 'same source input must choose the exact same route deterministically');
assert.equal(JSON.stringify({scene,terrain,wall}),sourceJSON);
for(const rejected of [
 [],
 Array.from({length:9},(_,i)=>({id:'x'+i,departure:{x:.1,y:0},turnRadians:0})),
 [{id:'a',departure:{x:.1,y:0},turnRadians:0},
  {id:'a',departure:{x:.1,y:0},turnRadians:0}],
 [{id:'test',departure:{x:NaN,y:0},turnRadians:0}],
 [{id:'test',departure:{x:.1,y:0},turnRadians:1}]
])assert.throws(()=>previewSnakeObstacleDeparturesV08e({
 wallState:wall,scene,terrain,candidates:rejected
}),RangeError);
console.log('PASS V0.8E deterministic source-authorized lookahead: bent route rejected, successful candidates fully simulated, blocked rock cannot be ignored');
