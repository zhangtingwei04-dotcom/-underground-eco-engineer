import assert from 'node:assert/strict';
import {inspectSnakeTurnSpaceV09g,
 advanceSnakeRouteWithTurnSpaceGuardV09g}
 from '../src/ohm-core/snake-turn-space-v09g.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';

const F=Object.freeze;
const ds=2.28/23;
function poseWithTurns(turn){
 const points=[F({x:1,y:0,z:.135})];
 let a=Math.PI;
 for(let i=1;i<24;i++){
  // Body is built from head toward tail, and EVERY link stays ds long.
  if(i<=8)a+=turn(i);
  const prior=points.at(-1);
  points.push(F({x:prior.x+ds*Math.cos(a),
   y:prior.y+ds*Math.sin(a),z:.135}));
 }
 return F({bodyRadius:.13,segmentLength:ds,points:F(points)});
}
const straight=poseWithTurns(()=>0);
const s=inspectSnakeTurnSpaceV09g({pose:straight});
assert.equal(s.version,'0.9G');
assert.equal(s.checkedWindows,16);
assert.equal(s.tightReturnTurnDetected,false);
assert.equal(s.smallestSignificantTurnRadiusWorld,Infinity);
assert.equal(s.previousV09dCandidateClearanceAccepted,true);
assert.equal(s.fullBodyReturnVerified,false);
assert.equal(s.safeNewReturnRouteFound,false);
assert.equal(s.skinApplied,false);
const gentle=poseWithTurns(i=>i%2?-.12:.12);
assert.equal(inspectSnakeTurnSpaceV09g({pose:gentle}).
 tightReturnTurnDetected,false,
 'low net sweep must not be misdiagnosed as a coiled U-turn');
const compact=poseWithTurns(()=>.37);
const snapshot=JSON.stringify(compact);
const report=inspectSnakeTurnSpaceV09g({pose:compact});
assert.equal(report.tightReturnTurnDetected,true,
 'eight consecutive source links must expose the small turn radius');
assert.ok(report.smallestSignificantTurnRadiusWorld<.42);
assert.ok(report.tightWindowCount>0);
assert.ok(report.worstWindow.absoluteSweepRadians>1.3);
assert.equal(JSON.stringify(compact),snapshot);
assert.deepEqual(inspectSnakeTurnSpaceV09g({pose:compact}),report);
assert.throws(()=>inspectSnakeTurnSpaceV09g({
 pose:straight,windowLinks:3}),RangeError);
assert.throws(()=>inspectSnakeTurnSpaceV09g({
 pose:straight,minimumRadiusWorld:NaN}),RangeError);
assert.throws(()=>inspectSnakeTurnSpaceV09g({
 pose:{...straight,points:straight.points.slice(0,23)}}),RangeError);

// Trace the unchanged, REAL V0.9C 24-joint source against V0.9D AND the
// opt-in turn-radius hold. This test does NOT require a successful return;
// the goal is to stop BEFORE V0.9D's known 531-frame unsafe source coil.
const terrain=F({groundZ:0,rock:null,perch:null});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09g_return_turn_radius',
 objects:[
  {id:'left_stone',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const start=[];
for(let i=0;i<=6;i++)start.push(F({x:.65,y:-1.32+i*.19,z:.135}));
for(const deg of [90,120,150,180,210,240]){
 const t=deg*Math.PI/180,v=start.at(-1);
 start.push(F({x:v.x+.19*Math.cos(t),y:v.y+.19*Math.sin(t),z:.135}));
}
const base=F({version:'0.7P_source_pose',
 points:F(start),segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const step=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true);
 wall=step.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:scene.revision,sites:[{
 id:'hide_a',kind:'hide',safe:true,reachable:true,
 distanceCost:.1,conditions:{hasCover:true}
}]};
const initial=startSnakeRouteFollowerV09c({
 actorId:'public_v09g_anonymous',scene,terrain,
 wallState:wall,ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},autoReturn:true
});
assert.equal(initial.phase,'moving_outbound');
const initialHash=JSON.stringify({scene,terrain,wall});
let state=initial,hold=null,loop=0,returnSeen=false;
let firstRiskFrame=null;
for(;loop<580;loop++){
 const analysis=inspectSnakeTurnSpaceV09g({pose:state.pose});
 if(state.phase==='moving_return')returnSeen=true;
 if(analysis.tightReturnTurnDetected&&firstRiskFrame===null)
  firstRiskFrame=state.verifiedFrames;
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state,scene,terrain,seconds:1/30
 });
 if(next.phase==='turn_space_hold'||next.phase==='self_clearance_stop'||
    next.phase==='stopped'){
  hold=next;break;
 }
 if(next.phase==='return_head_arrived')break;
 assert.equal(next.pose.points.length,24);
 assert.equal(next.skinApplied,false);
 assert.equal(next.saveModified,false);
 assert.equal(next.fullBodyReturnVerified,false);
 if(next.verifiedFrames!==state.verifiedFrames)
  assert.equal(next.verifiedFrames,state.verifiedFrames+1);
 state=next;
}
assert.equal(returnSeen,true,'the test must actually reach return steering');
assert.ok(hold,'must hold instead of displaying the known unsafe final coil');
assert.equal(hold.renderablePose,null);
assert.equal(hold.fullBodyReturnVerified,false);
assert.ok(state.verifiedFrames<=530,
 'guard should not admit the previously known 531-frame failure');
assert.equal(JSON.stringify({scene,terrain,wall}),initialHash);
console.log('PASS V0.9G: 16-window straight/S/U static, immutable source, guarded live return '+JSON.stringify({
 lastAcceptedSourceFrame:state.verifiedFrames,
 initialRiskWindows:inspectSnakeTurnSpaceV09g({pose:initial.pose}).tightWindows.map(w=>w.startLink),
 heldRiskWindows:hold.diagnostic?.tightWindows?.map(w=>w.startLink),
 holdPhase:hold.phase,reason:hold.reason,
 firstRiskFrame,returnSeen
}));
