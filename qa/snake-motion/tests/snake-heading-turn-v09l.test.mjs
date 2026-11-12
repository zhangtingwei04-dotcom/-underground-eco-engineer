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


import {inspectSnakeTurnConfigurationsV09l,
 planSnakeHeadingReturnV09l,advanceSnakeHeadingReturnV09l}
 from '../src/ohm-core/snake-heading-turn-v09l.mjs';

const stateBefore=JSON.stringify(state);
const sceneBefore=JSON.stringify({scene,terrain,wall});
const configs=inspectSnakeTurnConfigurationsV09l({
 source:state,minimumRadiusPixels:62
});
assert.equal(configs.version,'0.9L');
assert.equal(configs.candidates.length,8);
assert.equal(new Set(configs.candidates.map(x=>x.id)).size,8);
assert.ok(configs.candidates.every(x=>x.radiusDesignGatePassed));
assert.ok(configs.candidates.every(x=>
 x.radiusPixels>=62&&
 x.staging.length===2&&
 x.firstLegPixels>0&&x.secondLegPixels>0));
assert.equal(configs.sourceJointsChanged,false);
assert.equal(configs.sourceFrame,state.verifiedFrames);
assert.equal(configs.sourceHead.x,
 snakeFloorToTerrariumV07c(state.pose.points[0]).x);
assert.equal(configs.sourceTail.y,
 snakeFloorToTerrariumV07c(state.pose.points.at(-1)).y);
assert.ok(Number.isFinite(configs.headingToNeckMismatchRadians));
assert.throws(()=>inspectSnakeTurnConfigurationsV09l({
 source:state,minimumRadiusPixels:48
}),RangeError);
assert.throws(()=>inspectSnakeTurnConfigurationsV09l({
 source:{...state,phase:'moving_outbound'}
}),RangeError);
assert.equal(JSON.stringify(state),stateBefore);

const plan=planSnakeHeadingReturnV09l({
 source:state,scene,terrain,horizonFrames:120
});
assert.equal(plan.version,'0.9L');
assert.equal(plan.candidates.length,8);
assert.equal(plan.configuredRadii.length,8);
assert.equal(plan.plannedV09i.version,'0.9I');
assert.equal(plan.plannedV09i.sourceStartFrame,state.verifiedFrames);
assert.equal(plan.sourceJointsChanged,false);
assert.equal(plan.previewMovedSource,false);
assert.equal(plan.arc2DNotPhysicsProof,true);
assert.equal(plan.futureFramesNotAuthorized,true);
assert.equal(plan.fullBodyReturnVerified,false);
assert.equal(plan.skinApplied,false);
assert.equal(plan.saveModified,false);
assert.equal(plan.meshSweepCertified,false);
assert.equal(plan.ok,plan.selectedId!==null);
for(const candidate of plan.candidates){
 assert.ok(candidate.designRadiusPixels>=62);
 assert.equal(candidate.proposedRoute.length,4);
 assert.deepEqual(candidate.proposedRoute.at(-1),state.startFloor);
 assert.equal(candidate.fullRouteProven,false);
 assert.ok(candidate.checkedSourceFrames<=120);
 assert.ok(candidate.sourceLastFrame<=state.verifiedFrames+120);
 if(candidate.accepted){
  assert.equal(candidate.stagingGeometryClear,true);
  assert.equal(candidate.checkedSourceFrames,120);
  assert.ok(candidate.lastHeadFloor);
  assert.ok(candidate.lastTailFloor);
 }
}
if(plan.ok){
 assert.equal(plan.selectedPreviewFrameCount,120);
 const chosen=plan.candidates.find(c=>c.id===plan.selectedId);
 assert.equal(chosen.accepted,true);
 assert.equal(plan.rankedV09k.selectedId,plan.selectedId);
 assert.deepEqual(plan.selectedRoute,chosen.proposedRoute);
}
const first=advanceSnakeHeadingReturnV09l({
 source:state,scene,terrain,horizonFrames:120
});
if(plan.ok){
 assert.equal(first.phase,'moving_return');
 assert.equal(first.acceptedRealSourceStep,true);
 assert.equal(first.verifiedFrames,state.verifiedFrames+1);
 assert.equal(first.pose.points.length,24);
 assert.equal(first.selectedConfigurationV09l,plan.selectedId);
 const chosen=plan.candidates.find(c=>c.id===plan.selectedId);
 let frame=first;
 for(let i=1;i<120;i++){
  const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
   state:frame,scene,terrain
  });
  assert.equal(next.phase,'moving_return',
   'source-backed arc must replay through approved horizon');
  assert.equal(next.verifiedFrames,frame.verifiedFrames+1);
  frame=next;
 }
 assert.equal(frame.verifiedFrames,state.verifiedFrames+120);
 const realHead=snakeFloorToTerrariumV07c(frame.pose.points[0]);
 const predicted=chosen.lastHeadFloor;
 assert.ok(Math.hypot(realHead.x-predicted.x,
  realHead.y-predicted.y)<1e-7);
 assert.equal(frame.fullBodyReturnVerified,false);
 assert.equal(frame.skinApplied,false);
}else{
 assert.equal(first.phase,'return_wait_for_space');
 assert.equal(first.acceptedRealSourceStep,false);
 assert.equal(first.renderablePose,null);
}
assert.equal(first.saveModified,false);
assert.equal(JSON.stringify(state),stateBefore);
assert.equal(JSON.stringify({scene,terrain,wall}),sceneBefore);


// V0.9J optional controller must preserve finite source-frame stepping
// and safety rest when driven by the new V0.9L heading configuration mode.
const config={
 source:state,scene,terrain,routeSelectionMode:'configuration_turn_v09l',
 replanIntervalFrames:120,previewHorizonFrames:120,
 maxReturnFrames:480,maxReplans:4,maximumStallWindows:3,
 minimumHomeProgressPx:5,maximumHeadDistanceToHomePx:260
};
let auto=startSnakeReturnAutopilotV09j(config);
assert.equal(auto.routeSelectionMode,'configuration_turn_v09l');
const decisions=[];
for(let i=0;i<510&&auto.phase==='active_return';i++){
 const old=auto;
 const next=advanceSnakeReturnAutopilotV09j({
  state:auto,scene,terrain
 });
 assert.equal(next.source.pose.points.length,24);
 assert.equal(next.fullBodyReturnVerified,false);
 assert.equal(next.saveModified,false);
 assert.equal(next.skinApplied,false);
 assert.ok(next.framesCommitted<=480);
 assert.ok(next.replansPerformed<=4);
 if(next.phase==='active_return'){
  assert.equal(next.source.verifiedFrames,old.source.verifiedFrames+1);
  assert.equal(next.framesCommitted,old.framesCommitted+1);
 }else{
  assert.equal(next.source.verifiedFrames,old.source.verifiedFrames);
  assert.equal(next.framesCommitted,old.framesCommitted);
  assert.equal(next.changedSourcePose,false);
 }
 if(next.replansPerformed>old.replansPerformed){
  const latest=next.detourHistory.at(-1);
  assert.equal(latest.sourceArcCandidates,8);
  assert.ok(latest.headingPlanStatus);
  assert.equal(latest.routeSelected,true);
  assert.ok(Number.isFinite(latest.sourceTurnNeckMismatch));
  decisions.push({frame:old.source.verifiedFrames,
   id:latest.selectedId,approved:latest.approved,
   neckMismatch:latest.sourceTurnNeckMismatch});
 }
 auto=next;
}
assert.notEqual(auto.phase,'active_return');
assert.equal(auto.source.verifiedFrames-state.verifiedFrames,
 auto.framesCommitted);
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:auto,scene,terrain
}),auto);
assert.equal(auto.fullBodyReturnVerified,false);
assert.equal(JSON.stringify(state),stateBefore);
assert.equal(JSON.stringify({scene,terrain,wall}),sceneBefore);
const autoSummary={
 committed:auto.framesCommitted,
 sourceLast:auto.source.verifiedFrames,
 replans:auto.replansPerformed,
 terminal:auto.phase,
 terminalReason:auto.reason,
 headHome:auto.body.headToHomePx,
 tailHome:auto.body.tailToHomePx,
 decisions
};


// Fair A/B: V0.9K goal-graph selector on the identical original 24-joint
// return state, scene, 120-frame horizon and 480-frame/4-replan budget.
let oldPolicy=startSnakeReturnAutopilotV09j({
 ...config,routeSelectionMode:'goal_revisit_v09k'
});
for(let i=0;i<510&&oldPolicy.phase==='active_return';i++){
 const before=oldPolicy;
 const after=advanceSnakeReturnAutopilotV09j({
  state:oldPolicy,scene,terrain
 });
 assert.equal(after.fullBodyReturnVerified,false);
 assert.equal(after.skinApplied,false);
 assert.equal(after.saveModified,false);
 if(after.phase==='active_return'){
  assert.equal(after.source.verifiedFrames,
   before.source.verifiedFrames+1);
 }else{
  assert.equal(after.source.verifiedFrames,
   before.source.verifiedFrames);
 }
 oldPolicy=after;
}
assert.notEqual(oldPolicy.phase,'active_return');
assert.equal(oldPolicy.source.verifiedFrames-state.verifiedFrames,
 oldPolicy.framesCommitted);
assert.ok(oldPolicy.framesCommitted<=480);
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:oldPolicy,scene,terrain
}),oldPolicy);
const sameBudgetComparison=Object.freeze({
 sourceFrameStart:state.verifiedFrames,
 budgetFrames:480,
 budgetReplans:4,
 legacy: Object.freeze({
  mode:'goal_revisit_v09k',
  committed:oldPolicy.framesCommitted,
  terminal:oldPolicy.phase,
  headHomePx:oldPolicy.body.headToHomePx,
  tailHomePx:oldPolicy.body.tailToHomePx,
  completeReturn:false
 }),
 headingArcs: Object.freeze({
  mode:'configuration_turn_v09l',
  committed:auto.framesCommitted,
  terminal:auto.phase,
  headHomePx:auto.body.headToHomePx,
  tailHomePx:auto.body.tailToHomePx,
  completeReturn:false
 })
});
assert.equal(JSON.stringify(state),stateBefore);
assert.equal(JSON.stringify({scene,terrain,wall}),sceneBefore);

const revised=Object.freeze({...scene,revision:scene.revision+1});
const stale=planSnakeHeadingReturnV09l({
 source:state,scene:revised,terrain,horizonFrames:120
});
assert.equal(stale.ok,false);
assert.equal(stale.status,'stale_scene_or_terrain');
assert.equal(stale.selectedRoute,null);
assert.equal(JSON.stringify(state),stateBefore);

console.log('PASS V0.9L true 24-joint heading-radius U-turn proposals and V0.9D/G shadow checks '+JSON.stringify({
 sourceStart:state.verifiedFrames,
 headingRad:configs.headingRadians,
 neckMismatchRad:configs.headingToNeckMismatchRadians,
 selected:plan.selectedId,
 outcomes:plan.candidates.map(c=>({
  id:c.id,designRadius:c.designRadiusPixels,
  staticClear:c.stagingGeometryClear,
  accepted:c.accepted,
  sourceFrames:c.checkedSourceFrames,reason:c.reason,
  lastHead:c.lastHeadFloor
 })),
 commitPhase:first.phase,
 staleStatus:stale.status,
 autopilot:autoSummary,
 sameBudgetComparison,
 fullBodyReturnVerified:false
}));
