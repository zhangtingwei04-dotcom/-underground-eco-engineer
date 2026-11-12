import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {
 planSnakeAutonomousSegmentV09a,verifySnakeAutonomousSegmentV09a
} from '../src/ohm-core/snake-autonomous-intent-v09a.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_neutral_autonomous_snake',
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
const ds=.19,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({x:p.x+Math.cos(a)*ds,
  y:p.y+Math.sin(a)*ds,z:.135}));
}
const pose=Object.freeze({version:'0.7P_source_pose',
 points:Object.freeze(points),segmentLength:ds,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:pose,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let f=0;f<95;f++){
 const step=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true,'authoritative rest '+f);
 wall=step.nextState;
}
const inputJSON=JSON.stringify({scene,terrain,wall});
const siteDepartures=Object.freeze({
 hide_a:Object.freeze([
  {id:'hide_bad',departure:{x:.1,y:.025},turnRadians:.24},
  {id:'hide_checked',departure:{x:.1,y:-.025},turnRadians:.24}
 ]),
 open_a:Object.freeze([
  {id:'explore_checked',departure:{x:.1,y:-.05},turnRadians:.24}
 ])
});
const baseSites=[
 {id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}},
 {id:'open_a',kind:'open_area',safe:true,reachable:true,
  distanceCost:.1,conditions:{}}
];
const ecologySnapshot=({revision=scene.revision,
 sites=baseSites}={})=>({revision,sites});
const plan=o=>planSnakeAutonomousSegmentV09a({
 actorId:'synthetic_01',
 ecologySnapshot:ecologySnapshot(),wallState:wall,
 scene,terrain,siteDepartures,horizonFrames:60,...o
});
// Real NEED determines behavior, no scripted "pick action" input:
const shelter=plan({needs:{security:1,activity:0}});
assert.equal(shelter.phase,'approved_short_segment');
assert.equal(shelter.chosenActivity,'hide');
assert.equal(shelter.targetId,'hide_a');
assert.equal(shelter.preview.ok,true);
assert.equal(shelter.selected.id,'hide_checked');
assert.equal(shelter.preview.trials[0].accepted,false);
assert.equal(shelter.preview.trials[1].accepted,true);
assert.equal(shelter.preview.trials[1].checkedFrames,60);
assert.equal(shelter.fullDestinationReached,false);
assert.equal(shelter.playerObservationRecorded,false);
assert.deepEqual(shelter,plan({needs:{security:1,activity:0}}),
 'same state gives same intent and physical preflight');

const finish=verifySnakeAutonomousSegmentV09a({
 plan:shelter,wallState:wall,scene,terrain
});
assert.equal(finish.ok,true);
assert.equal(finish.phase,'short_segment_completed');
assert.equal(finish.boneCount,24);
assert.equal(finish.completedEvent.verifiedFrames,60);
assert.equal(finish.completedEvent.destinationReached,false);
assert.equal(finish.completedEvent.observedByPlayer,false);
assert.equal(finish.maxStep<=.012,true);
assert.equal(finish.maxBend<=.65,true);
assert.equal(finish.skinApplied,false);
assert.deepEqual(finish,verifySnakeAutonomousSegmentV09a({
 plan:shelter,wallState:wall,scene,terrain
}),'same real 3D source must complete deterministically');

// Exploration comes from needs, not a player command:
const explore=plan({needs:{security:0,activity:1}});
assert.equal(explore.chosenActivity,'open_area');
assert.equal(explore.targetId,'open_a');
assert.equal(explore.selected.id,'explore_checked');
assert.equal(explore.preview.trials[0].accepted,true);
const exploreFinish=verifySnakeAutonomousSegmentV09a({
 plan:explore,wallState:wall,scene,terrain
});
assert.equal(exploreFinish.ok,true);
assert.equal(exploreFinish.completedEvent.activityIntent,'open_area');

// Rest is a first-class choice, never an error or forced activity.
const rest=plan({
 needs:{security:0,activity:0},
 ecologySnapshot:ecologySnapshot({sites:[]})
});
assert.equal(rest.phase,'remain_still');
assert.equal(rest.reason,'chose_rest');
assert.equal(rest.movementStarted,false);
assert.equal(rest.movementCompleted,false);
assert.equal(rest.targetId,null);
assert.equal(verifySnakeAutonomousSegmentV09a({
 plan:rest,wallState:wall,scene,terrain
}).ok,false);

// A changed source invalidates movement; no fake observation or motion.
const changed=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{id:'new_stone',kind:'rock_overhang',
  x:615,y:45,width:6,depth:6,height:120,transmissionPermille:0}
});
const refused=verifySnakeAutonomousSegmentV09a({
 plan:shelter,wallState:wall,scene:changed,terrain
});
assert.equal(refused.ok,false);
assert.equal(refused.reason,'source_changed_since_plan');
assert.equal(refused.bodyMoved,false);
assert.equal(refused.completedEvent,null);
assert.equal(plan({
 ecologySnapshot:ecologySnapshot({revision:changed.revision}),
 scene, // scene and ecology now disagree
}).phase,'remain_still');
assert.equal(plan({
 ecologySnapshot:ecologySnapshot({revision:changed.revision})
}).reason,'ecology_scene_revision_mismatch');

// Explicitly unsafe source candidates do NOT turn "goal reached" into truth.
const allRejected=plan({
 needs:{security:1,activity:0},
 siteDepartures:{
  hide_a:[siteDepartures.hide_a[0]],
  open_a:[siteDepartures.hide_a[0]]
 }
});
assert.equal(allRejected.phase,'remain_still');
assert.equal(allRejected.movementCompleted,false);
assert.ok(allRejected.rejected.length>=1);
assert.equal(allRejected.playerObservationRecorded,false);

// No valid path offered => stay still, with a traceable refusal.
const noDirections=plan({needs:{security:1,activity:0},
 siteDepartures:{}});
assert.equal(noDirections.phase,'remain_still');
assert.ok(noDirections.rejected.some(x=>x.reason===
 'no_authored_departure_for_site'));

assert.equal(JSON.stringify({scene,terrain,wall}),inputJSON,
 'autonomous planning and actual 3D QA must not mutate source');
assert.throws(()=>plan({speciesId:'corn_snake'}),RangeError);
assert.throws(()=>plan({horizonFrames:1000}),RangeError);
assert.throws(()=>plan({siteDepartures:{'bad id':siteDepartures.hide_a}}),RangeError);
console.log('PASS V0.9A: autonomous shelter/explore/rest choice; true 24-bone 60-frame source preflight and execution; stale/unsafe routes stop; no skin/save/false observation');
