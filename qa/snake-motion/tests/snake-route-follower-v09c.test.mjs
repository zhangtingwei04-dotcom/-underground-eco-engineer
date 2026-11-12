import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 startSnakeRouteFollowerV09c,advanceSnakeRouteFollowerV09c,
 probeSnakeRouteChangedSceneV09c,resumeSnakeRouteAfterSceneChangeV09c
} from '../src/ohm-core/snake-route-follower-v09c.mjs';
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_long_route',
 objects:[
  {id:'left_stone',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z:.135
 }));
}
const pose=Object.freeze({version:'0.7P_source_pose',
 points:Object.freeze(points),segmentLength:ds,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:pose,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const v=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(v.renderable,true);
 wall=v.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const sites={
 hide_a:{x:Math.min(head.x+70,760),y:head.y},
 open_a:{x:Math.min(head.x+85,760),y:head.y}
};
const ecologySnapshot={revision:scene.revision,sites:[
 {id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}},
 {id:'open_a',kind:'open_area',safe:true,reachable:true,
  distanceCost:.1,conditions:{}}
]};
const opts={
 actorId:'anonymous_test_01',scene,terrain,wallState:wall,
 ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:sites,autoReturn:false
};
const sourceStr=JSON.stringify({scene,terrain,wall});
const initial=startSnakeRouteFollowerV09c(opts);
assert.equal(initial.version,'0.9C');
assert.equal(initial.phase,'moving_outbound',
 'actual 24 joint first 60 frames should be accepted');
assert.equal(initial.pose.points.length,24);
assert.equal(initial.verifiedFrames,60);
assert.equal(initial.saveModified,false);
assert.equal(initial.selfContactVerified,false);
assert.equal(initial.fullBodyReturnVerified,false);
let current=initial,steps=0,mostFar=0;
for(;steps<320&&current.phase==='moving_outbound';steps++){
 const before=current.pose.points[0];
 const next=advanceSnakeRouteFollowerV09c({
  state:current,scene,terrain
 });
 if(next.phase==='stopped'){
  console.log('V0.9C route stop '+JSON.stringify({
   step:steps,reason:next.reason,head:current.lastHeadFloor
  }));
  current=next;break;
 }
 assert.equal(next.pose.points.length,24);
 assert.equal(next.skinApplied,false);
 assert.equal(next.playerObservationRecorded,false);
 assert.equal(next.fullBodyReturnVerified,false);
 assert.equal(next.verifiedFrames,current.verifiedFrames+
  (next.phase==='moving_outbound'?1:0));
 const after=next.pose.points[0];
 assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<.012,
  'one frame cannot teleport source head');
 mostFar=Math.max(mostFar,
  Math.hypot(after.x-initial.pose.points[0].x,
    after.y-initial.pose.points[0].y));
 current=next;
}
console.log('V0.9C outbound trace '+JSON.stringify({
 phase:current.phase,stepCount:steps,verifiedFrames:current.verifiedFrames,
 mostFar,goalFloor:sites.hide_a,head:current.lastHeadFloor,
 reason:current.reason??null
}));
assert.ok(steps>=55,
 'must demonstrate continuous source movement beyond the initial 60 frame preview');
assert.ok(mostFar>.1,'must actually move forward along source route');

// Changes to scene must fail closed instead of reusing old route.
const farChanged=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{id:'new_far_rock',kind:'rock_overhang',
  x:920,y:330,width:8,depth:8,height:80,transmissionPermille:0}
});
const changedStep=advanceSnakeRouteFollowerV09c({
 state:initial,scene:farChanged,terrain
});
assert.equal(changedStep.phase,'stopped');
assert.equal(changedStep.reason,'changed_scene_requires_source_replan');
assert.equal(changedStep.renderablePose,null);
const paused=probeSnakeRouteChangedSceneV09c({
 state:initial,updatedScene:farChanged,terrain
});
assert.equal(paused.phase,'paused_scene_probe');
assert.equal(paused.bodyMoved,false);
assert.equal(paused.safeResumeForOldDestinationAuthorized,false);
assert.equal(paused.routeRecalculated,false);
assert.equal(paused.paused.gameplayNavigationAuthorized,false);
console.log('V0.9C changed far scene source probe '+JSON.stringify({
 ok:paused.ok,reason:paused.reason,sourcePoseVerified:paused.sourcePoseVerified
}));
assert.equal(paused.ok,true,
 'a far-away scene edit should allow V0.8F stationary verification');
const restart=resumeSnakeRouteAfterSceneChangeV09c({
 state:initial,paused,updatedScene:farChanged,terrain
});
console.log('V0.9C changed source safe restart '+JSON.stringify({
 phase:restart.phase,reason:restart.reason??null,
 frameCount:restart.verifiedFrames??null,
 sceneRevision:restart.sceneRevision??null
}));
assert.equal(restart.phase,'moving_outbound');
assert.equal(restart.pose.points.length,24);
assert.equal(restart.sceneRevision,farChanged.revision);
assert.equal(restart.verifiedFrames,initial.verifiedFrames+1);
assert.equal(restart.fullBodyReturnVerified,false);
assert.equal(restart.playerObservationRecorded,false);
const afterChanged=advanceSnakeRouteFollowerV09c({
 state:restart,scene:farChanged,terrain
});
assert.equal(afterChanged.phase,'moving_outbound',
 'new revision route may continue only after current source safety');
assert.equal(afterChanged.verifiedFrames,restart.verifiedFrames+1);
const obsolete=resumeSnakeRouteAfterSceneChangeV09c({
 state:initial,paused,updatedScene:scene,terrain
});
assert.equal(obsolete.phase,'stopped');
assert.equal(obsolete.reason,'not_matching_approved_source_pause');

const sameProbe=probeSnakeRouteChangedSceneV09c({
 state:initial,updatedScene:scene,terrain
});
assert.equal(sameProbe.phase,'no_scene_change');
assert.equal(sameProbe.ok,false);
const headFloor=snakeFloorToTerrariumV07c(initial.pose.points[0]);
const intersect=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{id:'obstacle_on_head',kind:'rock_overhang',
  x:Math.floor(headFloor.x),y:Math.floor(headFloor.y),
  width:12,depth:12,height:150,transmissionPermille:0}
});
const unsafe=probeSnakeRouteChangedSceneV09c({
 state:initial,updatedScene:intersect,terrain
});
assert.equal(unsafe.ok,false);
assert.equal(unsafe.pose,null,
 'if changed rock overlaps true source body cannot render a fake safe pose');
assert.equal(unsafe.sourcePoseVerified,false);
assert.equal(JSON.stringify({scene,terrain,wall}),sourceStr);
assert.throws(()=>advanceSnakeRouteFollowerV09c({
 state:{...initial,pose:null},scene,terrain
}),RangeError);

// Explicit voluntary rest is still a legal terminal state.
const noSites=startSnakeRouteFollowerV09c({
 ...opts,ecologySnapshot:{revision:scene.revision,sites:[]},
 siteFloors:{},autoReturn:true
});
assert.equal(noSites.phase,'stopped');
assert.equal(noSites.reason,'no_authorized_initial_segment');
assert.equal(noSites.renderablePose,null);

// The return attempt is REAL continuous source frames, never a 2D graph
// masquerading as proof that a 24-joint snake can U-turn or self-clear.
let roundtrip=startSnakeRouteFollowerV09c({...opts,autoReturn:true});
let sawReturn=false,returnSteps=0;
for(;returnSteps<650;returnSteps++){
 if(roundtrip.phase==='return_head_arrived'||roundtrip.phase==='stopped')break;
 const next=advanceSnakeRouteFollowerV09c({
  state:roundtrip,scene,terrain
 });
 if(next.phase==='moving_return')sawReturn=true;
 if(next.phase==='stopped'){
  roundtrip=next;
  break;
 }
 assert.equal(next.pose.points.length,24);
 assert.equal(next.fullBodyReturnVerified,false);
 assert.equal(next.playerObservationRecorded,false);
 assert.equal(next.skinApplied,false);
 roundtrip=next;
}
console.log('V0.9C physical return diagnostic '+JSON.stringify({
 phase:roundtrip.phase,returnSteps,sawReturn,
 verifiedFrames:roundtrip.verifiedFrames??null,
 reason:roundtrip.reason??null,
 head:roundtrip.lastHeadFloor??null
}));
assert.ok(sawReturn,'attempted actual reverse route, not only XY graph');
assert.equal(roundtrip.phase,'return_head_arrived',
 'the long running source proof must actually bring the head back near origin');
assert.ok(roundtrip.verifiedFrames>=600,
 'return requires real 24-joint continuous simulation, no teleport');
assert.ok(Math.hypot(
  snakeFloorToTerrariumV07c(roundtrip.pose.points[0]).x-head.x,
  snakeFloorToTerrariumV07c(roundtrip.pose.points[0]).y-head.y
 )<=9,'head actual source geometry must be near initial floor position');
assert.equal(roundtrip.pose.points.length,24);
assert.equal(roundtrip.fullBodyReturnVerified,false,
 'a source-checked route does not imply verified self-contact/full mechanics');
if(roundtrip.phase==='return_head_arrived'){
 assert.equal(roundtrip.completedReturn,true);
 assert.equal(roundtrip.verifiedArrivalHeadOnly,true);
 assert.equal(roundtrip.fullBodyReturnVerified,false,
  'no self-contact ground-truth physics, even if head gets back');
}else{
 assert.notEqual(roundtrip.completedReturn,true,
  'unsafe or incomplete real return cannot be marked completed');
}

console.log('PASS V0.9C 24-joint continuation with safe frame checks, fail-closed source change V0.8F probe, no fake site observation or physical return claim');
