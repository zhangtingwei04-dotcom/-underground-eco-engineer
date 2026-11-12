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
import {planSnakeBodyDetourV09i,advanceSnakeBodyDetourV09i}
 from '../src/ohm-core/snake-body-detour-v09i.mjs';

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
assert.throws(()=>planSnakeBodyDetourV09i({
 state,scene,terrain
}),RangeError);
for(let i=0;i<440&&state.phase==='moving_outbound';i++){
 state=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state,scene,terrain
 });
}
assert.equal(state.phase,'moving_return',
 'must use true V0.9C transition to actual return');
const stateBefore=JSON.stringify(state);
const worldBefore=JSON.stringify({scene,terrain,wall});
const preview=planSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames:160
});
assert.equal(preview.version,'0.9I');
assert.equal(preview.candidates.length,5);
assert.equal(preview.evaluatedDistinctStagingRoutes,5);
assert.equal(new Set(preview.candidates.map(c=>c.id)).size,5);
assert.equal(preview.actuallyMovedSource,false);
assert.equal(preview.fullBodyReturnVerified,false);
assert.equal(preview.safeFullRouteFound,false);
assert.equal(preview.skinApplied,false);
assert.equal(preview.playerDataModified,false);
assert.equal(preview.sourceJointsModified,false);
for(const c of preview.candidates){
 assert.equal(c.fullRouteProven,false);
 assert.equal(c.stageWaypoints.length,3);
 assert.equal(c.proposedRoute.length,4);
 assert.deepEqual(c.proposedRoute.at(-1),state.startFloor);
 assert.equal(c.actuallyMovedSource??false,false);
 assert.ok(c.checkedSourceFrames>=0&&c.checkedSourceFrames<=160);
 assert.ok(c.sourceLastFrame<=state.verifiedFrames+160);
 if(c.accepted){
  assert.ok(c.checkedSourceFrames===160||
   c.result==='head_only_arrived_during_preview');
  assert.equal(c.stagingGeometryClear,true);
 }
}
const distinct = new Set(preview.candidates.map(c=>
 JSON.stringify(c.proposedRoute.slice(1,3))));
assert.equal(distinct.size,5,'candidate staging routes must geometrically differ');
assert.equal(preview.ok,preview.candidates.some(c=>c.accepted));
if(preview.ok){
 const picked=preview.candidates.find(c=>c.id===preview.selectedCandidateId);
 assert.equal(picked.accepted,true);
 assert.deepEqual(picked.proposedRoute,preview.selectedRoute);
}else{
 assert.equal(preview.selectedCandidateId,null);
 assert.equal(preview.selectedRoute,null);
}
assert.deepEqual(preview,planSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames:160
}), 'pure deterministic source preview');
assert.equal(JSON.stringify(state),stateBefore);
assert.equal(JSON.stringify({scene,terrain,wall}),worldBefore);
const moved=advanceSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames:160
});
if(preview.ok){
 assert.equal(moved.phase,'moving_return');
 assert.equal(moved.verifiedFrames,state.verifiedFrames+1);
 assert.equal(moved.newlyAcceptedSourceStep,true);
 assert.equal(moved.v09iSourceBackedDetour,preview.selectedCandidateId);
 assert.equal(moved.pose.points.length,24);
 assert.equal(moved.skinApplied,false);
 assert.equal(moved.fullBodyReturnVerified,false);
}else{
 assert.equal(moved.phase,'return_wait_for_space');
 assert.equal(moved.renderablePose,null);
 assert.equal(moved.newlyAcceptedSourceStep,false);
}
assert.equal(moved.saveModified,false);
assert.equal(JSON.stringify(state),stateBefore);
assert.equal(JSON.stringify({scene,terrain,wall}),worldBefore);
const changed=F({...scene,revision:scene.revision+1});
const stale=planSnakeBodyDetourV09i({
 state,scene:changed,terrain
});
assert.equal(stale.ok,false);
assert.equal(stale.status,'stale_scene_or_terrain');
assert.equal(stale.candidates.length,0);
assert.throws(()=>planSnakeBodyDetourV09i({
 state,scene,terrain,horizonFrames:10
}),RangeError);

console.log('PASS V0.9I: 5 distinct full-body staging footprints + real 24-joint V0.9D/G return previews; no fake arrival '+JSON.stringify({
 frame:state.verifiedFrames,
 selected:preview.selectedCandidateId,
 results:preview.candidates.map(x=>({
  id:x.id,stagingClear:x.stagingGeometryClear,
  accepted:x.accepted,frames:x.checkedSourceFrames,
  endFrame:x.sourceLastFrame,reason:x.reason,
  endHead:x.lastHeadFloor
 })),
 committed:moved.phase,staleStatus:stale.status
}));
