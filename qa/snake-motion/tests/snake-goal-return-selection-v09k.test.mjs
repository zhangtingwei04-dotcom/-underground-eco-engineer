import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from '../src/ohm-core/snake-turn-space-v09g.mjs';
import {startSnakeReturnAutopilotV09j,
 advanceSnakeReturnAutopilotV09j}
 from '../src/ohm-core/snake-return-autopilot-v09j.mjs';
import {planSnakeBodyDetourV09i}
 from '../src/ohm-core/snake-body-detour-v09i.mjs';
import {chooseSnakeGoalReturnV09k}
 from '../src/ohm-core/snake-goal-return-selection-v09k.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const stone=(id,x,y,width,depth,height)=>F({
 id,kind:'rock_overhang',x,y,width,depth,height,
 transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09i_live_body_detour',
 objects:[
  stone('left_stone',42,32,134,76,230),
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)
 ]
});
const points=[];
for(let i=0;i<=6;i++)points.push(F({x:.65,y:-1.32+i*.19,z:.135}));
for(const degree of [90,120,150,180,210,240]){
 const a=degree*Math.PI/180,v=points.at(-1);
 points.push(F({x:v.x+.19*Math.cos(a),y:v.y+.19*Math.sin(a),z:.135}));
}
const base=F({version:'0.7P_source_pose',points:F(points),
 segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const moved=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(moved.renderable,true);
 wall=moved.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:scene.revision,sites:[{
 id:'hide_a',kind:'hide',safe:true,reachable:true,
 distanceCost:.1,conditions:{hasCover:true}
}]};
let state=startSnakeRouteFollowerV09c({
 actorId:'anonymous_v09i',scene,terrain,wallState:wall,
 ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},
 autoReturn:true
});
assert.equal(state.phase,'moving_outbound');
for(let i=0;i<440&&state.phase==='moving_outbound';i++){
 state=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state,scene,terrain
 });
}
assert.equal(state.phase,'moving_return',
 'must use true V0.9C transition to actual return');


const hash=JSON.stringify(state);
const world=JSON.stringify({scene,terrain,wall});
const trial=planSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames:160
});
assert.equal(trial.version,'0.9I');
assert.equal(trial.candidates.length,5);
assert.ok(trial.candidates.some(c=>c.accepted));
for(const c of trial.candidates){
 if(c.accepted){
  assert.equal(c.previewHeadSamples.length,4);
  assert.equal(c.lastTailFloor!==null,true);
  assert.ok(Number.isFinite(c.lastTailFloor.x));
  assert.equal(c.fullRouteProven,false);
 }
}
const head=snakeFloorToTerrariumV07c(state.pose.points[0]);
const one=chooseSnakeGoalReturnV09k({
 source:state,scene,planned:trial,visitedHeadFloors:[head]
});
assert.equal(one.version,'0.9K');
assert.equal(one.candidateScores.length,5);
assert.ok(one.candidateScores.every(c=>
 c.fullBodyReturnVerified===false));
assert.equal(one.originalSourceJointsChanged,false);
assert.equal(one.previewOnlyNoSourceMovement,true);
assert.equal(one.graph2DOnlyNotBodyClearance,true);
assert.equal(one.fullBodyReturnVerified,false);
assert.equal(one.saveModified,false);
assert.equal(one.skinApplied,false);
assert.equal(one.ok,
 one.candidateScores.some(c=>c.eligible));
if(one.ok){
 const chosen=one.candidateScores.find(c=>c.id===one.selectedId);
 assert.equal(chosen.eligible,true);
 assert.equal(chosen.graphStatus,'SAFE_GRID_BIDIRECTIONAL');
 assert.ok(Number.isFinite(chosen.score));
 assert.equal(chosen.sourcePreviewAccepted,true);
 const fromV09i=trial.candidates.find(c=>c.id===one.selectedId);
 assert.deepEqual(one.selectedRoute,fromV09i.proposedRoute);
 // A historical REVISIT can make a once safe, source-accepted staging
 // unattractive without changing either the real body or scene.
 const history=[...fromV09i.previewHeadSamples,head];
 const avoided=chooseSnakeGoalReturnV09k({
  source:state,scene,planned:trial,visitedHeadFloors:history
 });
 const old=avoided.candidateScores.find(c=>c.id===one.selectedId);
 assert.equal(old.revisits,4);
 assert.equal(old.eligible,false);
 assert.equal(old.reason,'repeated_path_without_new_space');
 assert.notEqual(avoided.selectedId,one.selectedId);
}
assert.deepEqual(one,chooseSnakeGoalReturnV09k({
 source:state,scene,planned:trial,visitedHeadFloors:[head]
}), 'goal ranking must be deterministic');
assert.throws(()=>chooseSnakeGoalReturnV09k({
 source:state,scene,planned:{...trial,sourceStartFrame:999}
}),RangeError);
assert.throws(()=>chooseSnakeGoalReturnV09k({
 source:{...state,phase:'moving_outbound'},scene,planned:trial
}),RangeError);
assert.equal(JSON.stringify(state),hash);
assert.equal(JSON.stringify({scene,terrain,wall}),world);

// The REAL controller chooses a finite sequence of source-preflighted
// staging options. Every committed frame must pass V0.9C/D/G again.
const config={source:state,scene,terrain,routeSelectionMode:'goal_revisit_v09k',
 replanIntervalFrames:160,previewHorizonFrames:160,
 maxReturnFrames:640,maxReplans:4,maximumStallWindows:4,
 minimumHomeProgressPx:5,maximumHeadDistanceToHomePx:260};
let ctrl=startSnakeReturnAutopilotV09j(config);
assert.equal(ctrl.routeSelectionMode,'goal_revisit_v09k');
const trail=[];
for(let i=0;i<660&&ctrl.phase==='active_return';i++){
 const old=ctrl;
 const next=advanceSnakeReturnAutopilotV09j({state:ctrl,scene,terrain});
 assert.equal(next.fullBodyReturnVerified,false);
 assert.equal(next.skinApplied,false);
 assert.equal(next.saveModified,false);
 assert.equal(next.allowedGameplayMotion,false);
 assert.ok(next.framesCommitted<=640);
 assert.ok(next.replansPerformed<=4);
 assert.ok(next.visitedHeadFloors.length<=20);
 assert.equal(next.source.pose.points.length,24);
 if(next.phase==='active_return'){
  assert.equal(next.source.verifiedFrames,old.source.verifiedFrames+1);
  assert.equal(next.framesCommitted,old.framesCommitted+1);
  assert.equal(next.changedSourcePose,true);
 }else{
  assert.equal(next.source.verifiedFrames,old.source.verifiedFrames,
   'rest must never advance a rejected pose');
  assert.equal(next.changedSourcePose,false);
 }
 if(next.replansPerformed>old.replansPerformed){
  const last=next.detourHistory.at(-1);
  assert.ok(last.goalRankStatus);
  assert.ok(last.goalRankedCandidates);
  assert.ok(last.routeSelected);
  assert.ok(last.goalRankedCandidates.some(c=>c.id===last.selectedId&&
   c.eligible));
  trail.push({frame:old.source.verifiedFrames,
   chosen:last.selectedId,headToHome:last.headDistancePx,
   tailToHome:last.tailDistancePx,
   ranks:last.goalRankedCandidates.map(c=>({
    id:c.id,eligible:c.eligible,
    revisits:c.revisits,
    score:Number.isFinite(c.score)?Number(c.score.toFixed(3)):null
   }))});
 }
 ctrl=next;
}
assert.notEqual(ctrl.phase,'active_return',
 'goal selector must keep original bounded-rest discipline');
assert.equal(ctrl.framesCommitted,
 ctrl.source.verifiedFrames-state.verifiedFrames);
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:ctrl,scene,terrain
}),ctrl);
assert.equal(JSON.stringify(state),hash);
assert.equal(JSON.stringify({scene,terrain,wall}),world);
assert.ok(ctrl.replansPerformed>=1);
assert.equal(ctrl.fullBodyReturnVerified,false);
assert.throws(()=>startSnakeReturnAutopilotV09j({
 ...config,routeSelectionMode:'unverified_magic'
}),RangeError);

// Changed scene prevents ANY stale-goal graph use.
const fresh=startSnakeReturnAutopilotV09j(config);
const changedScene=F({...scene,revision:scene.revision+1});
const stopped=advanceSnakeReturnAutopilotV09j({
 state:fresh,scene:changedScene,terrain
});
assert.equal(stopped.phase,'resting_scene_changed');
assert.equal(stopped.source.verifiedFrames,state.verifiedFrames);
console.log('PASS V0.9K source-backed graph-to-home + actual visits + finite 24-joint route selection '+JSON.stringify({
 baselineV09iChoice:trial.selectedCandidateId,
 goalChoice:one.selectedId,
 sourceStart:state.verifiedFrames,
 sourceEnd:ctrl.source.verifiedFrames,
 committed:ctrl.framesCommitted,replans:ctrl.replansPerformed,
 terminal:ctrl.phase,reason:ctrl.reason,
 headHome:ctrl.body.headToHomePx,tailHome:ctrl.body.tailToHomePx,
 fullBodyReturnVerified:ctrl.fullBodyReturnVerified,
 trail
}));
