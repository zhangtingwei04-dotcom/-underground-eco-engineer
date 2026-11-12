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

const sourceHash=JSON.stringify(state);
const sceneHash=JSON.stringify({scene,terrain,wall});
const options={source:state,scene,terrain,
 replanIntervalFrames:160,previewHorizonFrames:160,
 maxReturnFrames:1200,maxReplans:8,
 maximumStallWindows:4,
 minimumHomeProgressPx:5,maximumHeadDistanceToHomePx:260
};
const initial=startSnakeReturnAutopilotV09j(options);
assert.equal(initial.version,'0.9J');
assert.equal(initial.phase,'active_return');
assert.equal(initial.source.verifiedFrames,160);
assert.equal(initial.source.pose.points.length,24);
assert.equal(initial.framesCommitted,0);
assert.equal(initial.replansPerformed,0);
assert.equal(initial.detourHistory.length,0);
assert.equal(initial.headOnlyArrivalVerified,false);
assert.equal(initial.fullBodyReturnVerified,false);
assert.equal(initial.skinApplied,false);
assert.equal(initial.saveModified,false);
assert.equal(initial.sourceJointsRewritten,false);
assert.throws(()=>startSnakeReturnAutopilotV09j({
 ...options,replanIntervalFrames:200}),RangeError);
assert.throws(()=>startSnakeReturnAutopilotV09j({
 ...options,previewHorizonFrames:80}),RangeError);
assert.throws(()=>startSnakeReturnAutopilotV09j({
 ...options,source:{...state,phase:'moving_outbound'}}),RangeError);

const alteredScene=F({...scene,revision:scene.revision+1});
const changed=advanceSnakeReturnAutopilotV09j({
 state:initial,scene:alteredScene,terrain
});
assert.equal(changed.phase,'resting_scene_changed');
assert.equal(changed.source.pose,initial.source.pose);
assert.equal(changed.framesCommitted,0);
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:changed,scene,terrain
}),changed,'resting controller must be inert, not autonomously wake or teleport');

// Prove the finite controller cannot replan or advance forever, and every
// accepted tick is one true, unchanged-source V0.9C/V0.9D/G frame.
let ctrl=initial;
const trace=[],sourceFrameVisits=new Set([ctrl.source.verifiedFrames]);
for(let tick=0;tick<1300&&ctrl.phase==='active_return';tick++){
 const before=ctrl;
 const next=advanceSnakeReturnAutopilotV09j({
  state:ctrl,scene,terrain
 });
 assert.equal(next.version,'0.9J');
 assert.equal(next.fullBodyReturnVerified,false);
 assert.equal(next.skinApplied,false);
 assert.equal(next.saveModified,false);
 assert.equal(next.allowedGameplayMotion,false);
 assert.ok(next.replansPerformed<=options.maxReplans);
 assert.ok(next.framesCommitted<=options.maxReturnFrames);
 assert.ok(next.detourHistory.length<=options.maxReplans);
 assert.equal(next.source.pose.points.length,24);
 assert.ok(next.bestDistanceToHomePx<=
  next.initialDistanceToHomePx+1e-8);
 if(next.phase==='active_return'){
  assert.equal(next.source.verifiedFrames,
   before.source.verifiedFrames+1,
   'only a real guarded source frame may advance');
  assert.equal(next.framesCommitted,before.framesCommitted+1);
  assert.equal(next.changedSourcePose,true);
  assert.ok(!sourceFrameVisits.has(next.source.verifiedFrames));
  sourceFrameVisits.add(next.source.verifiedFrames);
  assert.ok(next.body.headToHomePx>=0);
  assert.ok(next.body.headTailSeparationPx>=0);
 }else{
  assert.equal(next.framesCommitted,before.framesCommitted,
   'safe rest is not a real source step');
  assert.equal(next.changedSourcePose,false);
  assert.ok(next.phase.startsWith('resting_')||
   next.phase==='head_only_arrived');
  trace.push({terminal:next.phase,reason:next.reason,
   frame:next.source.verifiedFrames});
 }
 if(next.replansPerformed>before.replansPerformed){
  const chosen=next.detourHistory.at(-1);
  assert.equal(chosen.routeSelected,true);
  assert.equal(chosen.sourceFrame,before.source.verifiedFrames);
  assert.equal(next.source.pose.points.length,24);
  trace.push({frame:before.source.verifiedFrames,
   replan:chosen.selectedId,approved:chosen.approved,
   home:chosen.headDistancePx,tail:chosen.tailDistancePx,
   stall:chosen.stalledWindows});
 }
 ctrl=next;
}
assert.notEqual(ctrl.phase,'active_return',
 'bounded controller MUST terminate under frame/replan/stall limits');
assert.ok(ctrl.framesCommitted<=1200);
assert.ok(ctrl.replansPerformed<=8);
assert.equal(ctrl.source.verifiedFrames-state.verifiedFrames,
 ctrl.framesCommitted,
 'all advanced source frames must be real one-at-a-time steps');
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:ctrl,scene,terrain
}),ctrl);
assert.equal(JSON.stringify(state),sourceHash);
assert.equal(JSON.stringify({scene,terrain,wall}),sceneHash);
assert.ok(ctrl.replansPerformed>=1);
assert.equal(ctrl.detourHistory[0].selectedId,'arc_left',
 'source-first staging must match verified V0.9I trace');

// A separate bounded budget must stop without moving extra frames.
let short=startSnakeReturnAutopilotV09j({
 ...options,maxReplans:1,maxReturnFrames:300
});
for(let t=0;t<300&&short.phase==='active_return';t++)
 short=advanceSnakeReturnAutopilotV09j({
  state:short,scene,terrain
 });
assert.notEqual(short.phase,'active_return');
assert.equal(short.replansPerformed,1);
assert.ok(short.framesCommitted<=160);
assert.equal(short.phase,'resting_budget_exhausted');
assert.strictEqual(advanceSnakeReturnAutopilotV09j({
 state:short,scene,terrain
}),short);
console.log('PASS V0.9J bounded autonomous source return: real 24-joint continuous replan or rest '+JSON.stringify({
 startingSourceFrame:state.verifiedFrames,
 lastSourceFrame:ctrl.source.verifiedFrames,
 totalCommittedSourceFrames:ctrl.framesCommitted,
 replanCount:ctrl.replansPerformed,
 terminal:ctrl.phase,reason:ctrl.reason,
 bestDistanceToHomePx:ctrl.bestDistanceToHomePx,
 endDistanceToHomePx:ctrl.body.headToHomePx,
 tailDistanceToHomePx:ctrl.body.tailToHomePx,
 headOnlyArrivalVerified:ctrl.headOnlyArrivalVerified,
 fullBodyReturnVerified:ctrl.fullBodyReturnVerified,
 decisionTrace:trace,
 limited:short.phase
}));
