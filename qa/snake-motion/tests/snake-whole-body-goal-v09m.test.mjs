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


import {inspectSnakeWholeBodyGoalV09m,
 chooseSnakeWholeBodyReturnV09m,
 planSnakeWholeBodyReturnV09m}
 from '../src/ohm-core/snake-whole-body-goal-v09m.mjs';

const initialSource=JSON.stringify(state);
const initialWorld=JSON.stringify({scene,terrain,wall});

// Strict full-body 24-joint arrival diagnostic in open, source-owned scene.
// 2D centerline occupancy is only a CANDIDATE, never 3D swept completion.
const segmentLength=2.28/23;
const straightPose=F({
 version:'0.7U_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.14-i*segmentLength,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength
});
const whole=inspectSnakeWholeBodyGoalV09m({
 pose:straightPose,scene,goalFloor:{x:500,y:200},
 goalRadiusPixels:170,bodyPaddingPixels:18
});
assert.equal(whole.sourceJointCount,24);
assert.equal(whole.sourceLinkCount,23);
assert.equal(whole.jointInsideCount,24);
assert.equal(whole.headInside,true);
assert.equal(whole.tailInside,true);
assert.equal(whole.bodyCenterlineInDisk,true);
assert.equal(whole.source3DCapsuleProxyClear,true);
assert.equal(whole.staticSourceSceneXYClear,true);
assert.equal(whole.eligible2DCenterline,true);
assert.equal(whole.fullBodyReturnVerified,false);
assert.equal(whole.swept3DSurfaceCertified,false);
assert.equal(whole.groundSupportCertified,false);
assert.equal(whole.saveModified,false);
const deceptive=inspectSnakeWholeBodyGoalV09m({
 pose:straightPose,scene,goalFloor:{x:620,y:200},
 goalRadiusPixels:170,bodyPaddingPixels:18
});
assert.equal(deceptive.headInside,true);
assert.equal(deceptive.tailInside,false);
assert.equal(deceptive.jointInsideCount<24,true);
assert.equal(deceptive.eligible2DCenterline,false);
assert.equal(deceptive.fullBodyReturnVerified,false);
assert.throws(()=>inspectSnakeWholeBodyGoalV09m({
 pose:straightPose,scene,goalFloor:{x:500,y:200},
 goalRadiusPixels:20
}),RangeError);
assert.throws(()=>inspectSnakeWholeBodyGoalV09m({
 pose:{...straightPose,points:straightPose.points.slice(0,23)},
 scene,goalFloor:{x:500,y:200}
}),RangeError);

const base=planSnakeHeadingReturnV09l({
 source:state,scene,terrain,horizonFrames:120
});
assert.equal(base.version,'0.9L');
const m=planSnakeWholeBodyReturnV09m({
 source:state,scene,terrain,horizonFrames:120
});
assert.equal(m.version,'0.9M');
assert.equal(m.candidateScores.length,8);
assert.equal(m.basePlanV09l.version,'0.9L');
assert.equal(m.sourceFrame,state.verifiedFrames);
assert.equal(m.sourceAudit.fullBodyReturnVerified,false);
assert.equal(m.noActualSourceFramesMoved,true);
assert.equal(m.noNewSourcePoseCreated,true);
assert.equal(m.fullBodyReturnVerified,false);
assert.equal(m.saveModified,false);
assert.equal(m.skinApplied,false);
assert.equal(m.ok,m.selectedId!==null);
assert.equal(JSON.stringify(state),initialSource);
assert.equal(JSON.stringify({scene,terrain,wall}),initialWorld);
for(const c of m.candidateScores){
 if(c.eligible){
  const original=m.basePlanV09l.candidates.find(x=>x.id===c.id);
  assert.equal(original.accepted,true);
  assert.equal(original.previewTerminalPose.points.length,24);
  assert.equal(c.source3DCapsulesChecked,true);
  assert.equal(c.graphAndRevisitVerified,true);
  assert.equal(c.predictedJointsInside>=0,true);
  assert.equal(c.predictedJointsInside<=24,true);
  assert.equal(c.fullBodyReturnVerified,false);
  assert.ok(Number.isFinite(c.predictedMeanBodyPx));
  assert.ok(Number.isFinite(c.predictedWorstJointPx));
 }
}
if(m.ok){
 const selection=m.candidateScores.find(c=>c.id===m.selectedId);
 assert.equal(selection.eligible,true);
 assert.deepEqual(
  m.selectedRoute,
  m.basePlanV09l.candidates.find(c=>c.id===m.selectedId)
   .proposedRoute
 );
}
assert.deepEqual(m,planSnakeWholeBodyReturnV09m({
 source:state,scene,terrain,horizonFrames:120
}), 'whole-body source shadow rank is repeatable');

// Stale scene fail closed, no shadow candidate ever accepted.
const stale=planSnakeWholeBodyReturnV09m({
 source:state,scene:F({...scene,revision:scene.revision+1}),
 terrain,horizonFrames:120
});
assert.equal(stale.ok,false);
assert.equal(stale.status,'stale_scene_or_terrain');
assert.equal(stale.selectedRoute,null);
assert.equal(stale.fullBodyReturnVerified,false);
assert.throws(()=>chooseSnakeWholeBodyReturnV09m({
 source:{...state,verifiedFrames:state.verifiedFrames+1},
 scene,basePlanV09l:base
}),RangeError);

// Same scenario and exact same budget V0.9L versus opt-in V0.9M.
// Never modify a source pose or claim arrival from a 2D disk.
const config={source:state,scene,terrain,
 replanIntervalFrames:120,previewHorizonFrames:120,
 maxReturnFrames:480,maxReplans:4,maximumStallWindows:3,
 minimumHomeProgressPx:5,maximumHeadDistanceToHomePx:260};
function replayPolicy(mode){
 let agent=startSnakeReturnAutopilotV09j({
  ...config,routeSelectionMode:mode
 });
 const choices=[];
 for(let n=0;n<510&&agent.phase==='active_return';n++){
  const old=agent;
  const next=advanceSnakeReturnAutopilotV09j({
   state:agent,scene,terrain
  });
  assert.equal(next.fullBodyReturnVerified,false);
  assert.equal(next.skinApplied,false);
  assert.equal(next.saveModified,false);
  assert.equal(next.source.pose.points.length,24);
  assert.ok(next.framesCommitted<=480);
  assert.ok(next.replansPerformed<=4);
  if(next.phase==='active_return'){
   assert.equal(next.source.verifiedFrames,
    old.source.verifiedFrames+1);
   assert.equal(next.framesCommitted,old.framesCommitted+1);
   if(mode==='whole_body_goal_v09m'){
    assert.ok(next.wholeBodyGoalAudit);
    assert.equal(next.wholeBodyGoalAudit.sourceJointCount,24);
    assert.equal(next.wholeBodyGoalAudit.fullBodyReturnVerified,false);
   }
  }else{
   assert.equal(next.framesCommitted,old.framesCommitted);
   assert.equal(next.source.verifiedFrames,
    old.source.verifiedFrames);
  }
  if(next.replansPerformed>old.replansPerformed){
   const event=next.detourHistory.at(-1);
   if(mode==='whole_body_goal_v09m'){
    assert.ok(event.wholeBodyRankStatus);
    assert.ok(event.wholeBodyCandidateRanks);
    assert.equal(event.wholeBodyCandidateRanks.length,8);
    assert.equal(event.routeSelected,true);
    assert.ok(event.wholeBodyCandidateRanks.some(c=>
     c.id===event.selectedId&&c.eligible));
   }
   choices.push(F({frame:old.source.verifiedFrames,
    selected:event.selectedId}));
  }
  agent=next;
 }
 assert.notEqual(agent.phase,'active_return');
 assert.equal(agent.source.verifiedFrames-state.verifiedFrames,
  agent.framesCommitted);
 assert.strictEqual(advanceSnakeReturnAutopilotV09j({
  state:agent,scene,terrain
 }),agent);
 const audit=inspectSnakeWholeBodyGoalV09m({
  pose:agent.source.pose,scene,
  goalFloor:agent.source.startFloor
 });
 return {agent,choices,audit};
}
const a=replayPolicy('configuration_turn_v09l');
const b=replayPolicy('whole_body_goal_v09m');
assert.equal(JSON.stringify(state),initialSource);
assert.equal(JSON.stringify({scene,terrain,wall}),initialWorld);
assert.equal(b.agent.fullBodyReturnVerified,false);
assert.throws(()=>startSnakeReturnAutopilotV09j({
 ...config,routeSelectionMode:'unsafe_fake_body_home'
}),RangeError);
const summary=x=>({
 committed:x.agent.framesCommitted,
 endFrame:x.agent.source.verifiedFrames,
 terminal:x.agent.phase,
 headDistance:x.audit.headDistancePx,
 tailDistance:x.audit.tailDistancePx,
 meanBodyDistance:x.audit.meanJointDistancePx,
 worstJointDistance:x.audit.maxJointDistancePx,
 jointsInside:x.audit.jointInsideCount,
 candidateWhole2D:x.audit.eligible2DCenterline,
 verifiedCompleteReturn:x.audit.fullBodyReturnVerified,
 choices:x.choices
});
console.log('PASS V0.9M all-24-joint goal arrival audit and genuine bounded source return comparison '+
 JSON.stringify({
 headOnlyCounterexample:deceptive.jointInsideCount,
 stationaryAll24Goal2DCandidate:whole.eligible2DCenterline,
 stationaryActualCompletion:whole.fullBodyReturnVerified,
 firstHeadingChoice:base.selectedId,
 firstWholeBodyChoice:m.selectedId,
 safeCandidates:m.candidateScores.filter(c=>c.eligible).length,
 sameBudget:{
  headingOnly:summary(a),
  wholeBody:summary(b)
 },
 staleStatus:stale.status
}));
