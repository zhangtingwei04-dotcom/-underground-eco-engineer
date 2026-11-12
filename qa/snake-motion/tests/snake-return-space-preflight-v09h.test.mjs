import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from '../src/ohm-core/snake-turn-space-v09g.mjs';
import {preflightSnakeReturnSpaceV09h,
 advanceSnakeReturnWithPreflightV09h}
 from '../src/ohm-core/snake-return-space-preflight-v09h.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09h_body_aware_return_preview',
 objects:[
  {id:'left_stone',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const points=[];
for(let i=0;i<=6;i++)
 points.push(F({x:.65,y:-1.32+i*.19,z:.135}));
for(const deg of [90,120,150,180,210,240]){
 const t=deg*Math.PI/180,p=points.at(-1);
 points.push(F({x:p.x+.19*Math.cos(t),
  y:p.y+.19*Math.sin(t),z:.135}));
}
const base=F({version:'0.7P_source_pose',
 points:F(points),segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const frame=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(frame.renderable,true);
 wall=frame.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:scene.revision,sites:[{
 id:'hide_a',kind:'hide',safe:true,reachable:true,
 distanceCost:.1,conditions:{hasCover:true}
}]};
let state=startSnakeRouteFollowerV09c({
 actorId:'anonymous_v09h',scene,terrain,wallState:wall,
 ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},autoReturn:true
});
assert.equal(state.phase,'moving_outbound');
assert.throws(()=>preflightSnakeReturnSpaceV09h({
 state,scene,terrain
}),RangeError,'must not preflight outward state as return');
let transition=null;
for(let i=0;i<450;i++){
 const before=state;
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state,scene,terrain
 });
 if(next.phase!=='moving_outbound'&&next.phase!=='moving_return')
  throw Error('Unexpected source stop before return '+next.phase+' '+next.reason);
 state=next;
 if(before.phase==='moving_outbound'&&state.phase==='moving_return'){
  transition=state;break;
 }
}
assert.ok(transition,'must start from actual source-verified return transition');
const stateSnapshot=JSON.stringify(transition);
const sourceSnapshot=JSON.stringify({scene,terrain,wall});
const preflight=preflightSnakeReturnSpaceV09h({
 state:transition,scene,terrain,horizonFrames:90
});
assert.equal(preflight.version,'0.9H');
assert.equal(preflight.candidates.length,2);
assert.deepEqual(preflight.candidates.map(x=>x.sign),[1,-1]);
assert.equal(preflight.previewHorizonFrames,90);
assert.equal(preflight.sourceFrameAtStart,transition.verifiedFrames);
assert.equal(preflight.actuallyMovedSource,false);
assert.equal(preflight.alternateRouteFound,false);
assert.equal(preflight.fullBodyReturnCertified,false);
assert.equal(preflight.meshSurfaceSweepCertified,false);
assert.equal(preflight.skinApplied,false);
assert.equal(preflight.saveModified,false);
for(const v of preflight.candidates){
 assert.ok(v.previewFrameCount>=0&&v.previewFrameCount<=90);
 assert.ok(v.sourceFrameAtEnd<=transition.verifiedFrames+90);
 assert.equal(v.sourceHeadAndBonesUnchangedByPreflight,true);
 assert.equal(v.fullBodyReturnCertified,false);
 if(v.safeForOneCandidateStep)
  assert.ok(['horizon_preview_clear',
   'head_only_arrived_in_preview'].includes(v.outcome));
 else assert.ok(v.reason||v.outcome!=='horizon_preview_clear');
}
assert.equal(preflight.ok,preflight.selectedSign!==null);
assert.equal(preflight.ok,
 preflight.candidates.some(x=>x.safeForOneCandidateStep));
if(preflight.selectedSign!==null)
 assert.ok(preflight.candidates.some(x=>x.sign===preflight.selectedSign&&
  x.safeForOneCandidateStep));
assert.deepEqual(preflight,preflightSnakeReturnSpaceV09h({
 state:transition,scene,terrain,horizonFrames:90
}),'preflight must be deterministic and replayable');
assert.equal(JSON.stringify(transition),stateSnapshot);
assert.equal(JSON.stringify({scene,terrain,wall}),sourceSnapshot);

const committed=advanceSnakeReturnWithPreflightV09h({
 state:transition,scene,terrain,horizonFrames:90
});
if(preflight.ok){
 assert.equal(committed.phase,'moving_return');
 assert.equal(committed.preflightSelectedSign,preflight.selectedSign);
 assert.equal(committed.newlyAcceptedSourceStep,true);
 assert.equal(committed.verifiedFrames,transition.verifiedFrames+1);
 assert.equal(committed.pose.points.length,24);
 assert.equal(committed.fullBodyReturnVerified,false);
}else{
 assert.equal(committed.phase,'return_wait_for_space');
 assert.equal(committed.renderablePose,null);
 assert.equal(committed.newlyAcceptedSourceStep,false);
 assert.equal(committed.reason,'no_verified_turn_space');
}
assert.equal(committed.saveModified,false);
assert.equal(committed.skinApplied,false);
assert.equal(JSON.stringify(transition),stateSnapshot);
assert.throws(()=>preflightSnakeReturnSpaceV09h({
 state:transition,scene,terrain,horizonFrames:5
}),RangeError);
assert.throws(()=>preflightSnakeReturnSpaceV09h({
 state:{...transition,returnTurnSign:0},scene,terrain
}),RangeError);

// Revisions and geometry changes never authorize an old shadow preview.
const alteredScene=F({...scene,revision:scene.revision+1});
const stale=preflightSnakeReturnSpaceV09h({
 state:transition,scene:alteredScene,terrain,horizonFrames:18
});
assert.equal(stale.ok,false);
assert.equal(stale.selectedSign,null);
assert.equal(stale.candidates.every(c=>c.outcome==='source_rejected'),true);
assert.equal(JSON.stringify(transition),stateSnapshot);

console.log('PASS V0.9H: real 24-joint return, two shadow steering directions, immutable source, no false route '+JSON.stringify({
 returnSourceFrame:transition.verifiedFrames,
 selectedSign:preflight.selectedSign,
 candidates:preflight.candidates.map(x=>({
  sign:x.sign,frames:x.previewFrameCount,
  endSourceFrame:x.sourceFrameAtEnd,outcome:x.outcome,
  reason:x.reason,minGap:x.minimumSourceCapsuleGap
 })),
 commitPhase:committed.phase,
 staleStatus:stale.status
}));
