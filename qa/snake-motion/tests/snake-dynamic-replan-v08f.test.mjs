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
const choices=[
 {id:'corrected',departure:{x:.1,y:-.025},turnRadians:.24},
 {id:'cautious',departure:{x:.1,y:-.05},turnRadians:.24},
 {id:'narrow',departure:{x:.08,y:-.05},turnRadians:.24}
];
const initial=prepareSnakeGroundHandoffV07s({
 wallState:wall,scene,terrain,targetJointCount:24,
 departure:choices[0].departure,speciesId:'generic_snake'
});
assert.equal(initial.ok,true);
let relay=createSnakeCurvatureRelayV07u({
 temporalState:createSnakeGroundTemporalV07t({handoff:initial}),
 turnRadians:.24
});
for(let i=0;i<30;i++){
 const out=advanceSnakeCurvatureRelayV07u(relay,{
  scene,terrain,seconds:1/30
 });
 assert.equal(out.ok,true,'safe pre-obstacle frame '+i);
 relay=out.nextState;
}
const originalJSON=JSON.stringify(relay);
// Insert a new solid source rock via real V0.3d revision event.
const changed=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'new_obstacle',kind:'rock_overhang',
  x:620,y:45,width:6,depth:6,height:120,transmissionPermille:0
 }
});
const paused=pauseAndReplanSnakeV08f({
 relayState:relay,scene:changed,terrain,candidates:choices
});
console.log('OHM V0.8F in-flight new rock '+JSON.stringify({
 ok:paused.ok,reason:paused.reason,phase:paused.phase,
 trials:paused.trials,chosen:paused.selected
}));
assert.equal(paused.bodyMoved,false);
assert.equal(paused.gameplayNavigationAuthorized,false);
assert.equal(paused.skinApplied,false);
assert.equal(JSON.stringify(relay),originalJSON);
if(paused.ok){
 assert.equal(paused.phase,'paused');
 assert.equal(paused.pose.points.length,24);
 assert.equal(JSON.stringify(paused.pose),JSON.stringify(
  relay.temporalState.v07sState.pose));
 assert.equal(paused.selected.id,'cautious');
 const resumed=resumeReplannedSnakeV08f({
  paused,scene:changed,terrain
 });
 assert.equal(resumed.ok,true,resumed.reason);
 assert.equal(resumed.previousBoneCount,24);
 assert.equal(resumed.nextBoneCount,24);
 assert.equal(resumed.previousFrame,30);
 assert.equal(resumed.nextFrame,31);
 assert.ok(resumed.maxJointStep<.012);
 assert.ok(resumed.maximumBendRadians<.65);
 assert.equal(resumed.skinApplied,false);
 // Verify that an actual run after the explicit resume follows the
 // full preflight horizon without reusing stale scene geometry or
 // violating max bend, speed, acceleration, floor or head safety.
 let after=resumed.resumeState;
 let previous=resumed.pose;
 let laterPeakBend=resumed.maximumBendRadians;
 for(let frame=2;frame<=60;frame++){
  const step=advanceSnakeCurvatureRelayV07u(after,{
   scene:changed,terrain,seconds:1/30
  });
  assert.equal(step.ok,true,'replanned physical step '+frame);
  const check=inspectSnakeTemporalContinuityV08d({
   previousPose:previous,pose:step.pose
  });
  assert.ok(check.visualBendAccepted,'replanned step '+frame+' bend');
  assert.ok(check.maxJointStep<.012,'replanned step '+frame+' jump');
  laterPeakBend=Math.max(laterPeakBend,check.maximumBendRadians);
  previous=step.pose;after=step.nextState;
 }
 assert.equal(after.frames,90,
  '30 prior steps + 60 new-scene steps must stay the same animal');
 assert.equal(JSON.stringify(previous),JSON.stringify(
  after.temporalState.v07sState.pose));
 assert.ok(Math.abs(laterPeakBend-
  paused.trials[paused.chosenIndex].maximumBendRadians)<1e-8,
  'actual resumed run must agree with 60-frame candidate preview');
 console.log('PASS V0.8F actual resumed 60-frame trace: full preflight path verified');
 const second=resumeReplannedSnakeV08f({
  paused,scene:changed,terrain
 });
 assert.equal(JSON.stringify(resumed),JSON.stringify(second),
  'explicit resume deterministic for same frozen paused source');
}else{
 assert.ok(/source_pose_now_blocked|no_source_safe_candidate/.test(paused.reason));
 assert.equal(paused.resumeState,null);
}
// Even when the current 24-joint pose is safe to remain stationary,
// there may be ZERO candidate movements safe for the 60-frame horizon.
const noAlternative=pauseAndReplanSnakeV08f({
 relayState:relay,scene:changed,terrain,candidates:[choices[0]]
});
assert.equal(noAlternative.ok,false);
assert.equal(noAlternative.reason,'no_source_safe_candidate');
assert.equal(noAlternative.phase,'paused_no_route');
assert.equal(noAlternative.selected,null);
assert.equal(noAlternative.resumeState,null);
assert.ok(noAlternative.pose?.points?.length===24,
 'safe stationary pose stays intact when all departure options fail');
const forbiddenResume=resumeReplannedSnakeV08f({
 paused:noAlternative,scene:changed,terrain
});
assert.equal(forbiddenResume.ok,false);
assert.equal(forbiddenResume.pose,null);
assert.equal(forbiddenResume.resumeState,null);
console.log('PASS V0.8F no-safe-alternative causes stationary hold, not a fake resumed path');

const movedAgain=applyTerrariumSceneGeometryV03dEvent(changed,{
 channel:'object',type:'upsert',object:{
  id:'new_obstacle',kind:'rock_overhang',
  x:618,y:45,width:6,depth:6,height:120,transmissionPermille:0
 }
});
if(paused.ok){
 const stale=resumeReplannedSnakeV08f({
  paused,scene:movedAgain,terrain
 });
 assert.equal(stale.ok,false);
 assert.equal(stale.reason,'source_scene_changed_again_replan_required');
 assert.equal(stale.pose,null);
}
// Source rock placed directly on top of the current moving snake:
// it is physically impossible to claim this is a collision-free stop.
// Return no renderable pose and do not teleport the chain away.
const overlapping=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'obstacle_on_body',kind:'rock_overhang',
  x:575,y:30,width:20,depth:18,height:120,transmissionPermille:0
 }
});
const emergency=pauseAndReplanSnakeV08f({
 relayState:relay,scene:overlapping,terrain,candidates:choices
});
console.log('OHM V0.8F in-place collision '+JSON.stringify({
 ok:emergency.ok,reason:emergency.reason,phase:emergency.phase
}));
assert.equal(emergency.ok,false);
assert.ok(emergency.reason.startsWith('source_pose_now_blocked_'));
assert.equal(emergency.pose,null,
 'a snake already overlapping the new rock must not fake a safe visual');
assert.equal(emergency.resumeState,null);
assert.equal(emergency.bodyMoved,false);
// Reusing an approved route against an altered heightfield is equally
// forbidden, even when the room's V0.3d rock revision is unchanged.
if(paused.ok){
 const staleTerrain=resumeReplannedSnakeV08f({
  paused,scene:changed,
  terrain:Object.freeze({groundZ:.03,rock:null,perch:null})
 });
 assert.equal(staleTerrain.ok,false);
 assert.equal(staleTerrain.reason,'source_scene_changed_again_replan_required');
 assert.equal(staleTerrain.pose,null);
}
const unchanged=pauseAndReplanSnakeV08f({
 relayState:relay,scene,terrain,candidates:choices
});
assert.equal(unchanged.ok,false);
assert.equal(unchanged.reason,'source_scene_unchanged_continue_existing_controller');
console.log('PASS V0.8F original relay preserved and changed-rock snapshots never silently resumed');
