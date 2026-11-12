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
import {
 SNAKE_GROUND_HANDOFF_VERSION,
 prepareSnakeGroundHandoffV07s,advanceSnakeGroundHandoffV07s
} from '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07s_real_source_handoff_lab',
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
for(let i=0;i<=6;i++)
 points.push(Object.freeze({x:.65,y:-1.32+i*ds,z}));
for(const deg of [90,120,150,180,210,240]){
 const t=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(t)*ds,y:p.y+Math.sin(t)*ds,z
 }));
}
const base=Object.freeze({
 version:'0.7P_source_pose',
 points:Object.freeze(points),segmentLength:ds,bodyRadius:.13
});
const start=createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
assert.throws(()=>prepareSnakeGroundHandoffV07s({
 wallState:start,scene,terrain
}),RangeError,'do not switch representation while the animal is lifting');
let wallState=start,holdState=null;
for(let i=0;i<95;i++){
 const r=advanceSnakeWallProbeV07p(wallState,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(r.renderable,true,'source V0.7P must be safe step '+i);
 wallState=r.nextState;
 if(r.phase==='hold'&&!holdState)holdState=wallState;
}
assert.ok(holdState&&holdState.pitch>.34);
assert.throws(()=>prepareSnakeGroundHandoffV07s({
 wallState:holdState,scene,terrain
}),RangeError,'no 13→24 bone-count swap while head is raised');
assert.equal(wallState.phase,'rest');
assert.ok(wallState.seconds>=3.1-1e-9);
assert.equal(SNAKE_GROUND_HANDOFF_VERSION,'0.7S');

const before=JSON.stringify({wallState,scene,terrain});
const create=()=>prepareSnakeGroundHandoffV07s({
 wallState,scene,terrain,
 targetJointCount:24,departure:{x:.1,y:.025},
 speciesId:'generic_snake'
});
const initial=create();
assert.equal(initial.version,'0.7S');
assert.equal(initial.ok,true,initial.reason);
assert.equal(initial.reason,null);
assert.equal(initial.pose.points.length,24);
assert.equal(initial.sourceJointCount,13);
assert.equal(initial.resampledJointCount,24);
assert.ok(Math.abs(initial.totalLength-2.28)<1e-12,'identical total length within floating point epsilon');
assert.ok(Math.abs(initial.pose.segmentLength-2.28/23)<1e-12);
assert.ok(initial.resampleCurveError<=.025);
assert.ok(initial.tailOffset<=.015);
assert.ok(initial.headOffset<1e-12);
assert.equal(initial.gameTravelRouteAuthorized,false,
 'existing V0.7A demo route is longer and elsewhere: do not teleport to it');
assert.equal(initial.handoffPermittedForExplicitLab,true);
assert.equal(initial.physicsVerified,false);
assert.equal(initial.glassFrictionVerified,false);
assert.equal(initial.bodySurfaceCollisionVerified,false);
assert.equal(initial.realSubstrateBurrowingVerified,false);
assert.equal(initial.playableCaveAuthorized,false);
assert.equal(initial.skinApplied,false);
assert.equal(initial.sourceBodyModified,false);
assert.equal(initial.sourceHeadModified,false);
assert.ok(Object.isFrozen(initial.pose)&&
 Object.isFrozen(initial.pose.points));
assert.equal(inspectSnakeTerrariumPoseV07c(initial.pose,scene).ok,true);
assert.equal(inspectSnakeTerrainClearance(initial.pose,{
 terrain,samplesPerBone:24
}).ok,true);
assert.deepEqual(initial.pose.points[0],wallState.pose.points[0]);
assert.ok(initial.groundContactIndices.length>=20,
 'ground support must transfer to 24-node representation');
assert.deepEqual(initial,create(),
 'authored fixed-bone resegmentation must be deterministic');
assert.equal(JSON.stringify({wallState,scene,terrain}),before,
 'preflight must not modify the 13-joint source animal');

let handoff=initial.nextState;
let maxJointDelta=0,contactMin=24;
let firstMovement=null;
for(let i=0;i<90;i++){
 const r=advanceSnakeGroundHandoffV07s(handoff,{
  scene,terrain,seconds:1/30,maxJointSpeed:.35
 });
 assert.equal(r.ok,true,
  'V0.7S near-front-edge ground probe must not teleport: '+i+' '+r.reason);
 assert.ok(r.pose&&r.head&&r.nextState);
 assert.equal(r.pose.points.length,24);
 assert.equal(r.sourceCollisionChecked,true);
 assert.equal(r.headVerticesChecked,true);
 assert.equal(r.physicsVerified,false);
 assert.equal(r.gameTravelRouteAuthorized,false);
 assert.equal(r.skinApplied,false);
 assert.equal(r.playableCaveAuthorized,false);
 assert.equal(inspectSnakeTerrariumPoseV07c(r.pose,scene).ok,true);
 assert.equal(inspectSnakeTerrainClearance(r.pose,{
  terrain,samplesPerBone:24
 }).ok,true);
 assert.ok(r.maxJointDelta<=.35/30+1e-8);
 maxJointDelta=Math.max(maxJointDelta,r.maxJointDelta);
 contactMin=Math.min(contactMin,r.contactIndices.length);
 for(let j=1;j<r.pose.points.length;j++)
  assert.ok(Math.abs(Math.hypot(
   r.pose.points[j].x-r.pose.points[j-1].x,
   r.pose.points[j].y-r.pose.points[j-1].y,
   r.pose.points[j].z-r.pose.points[j-1].z
  )-2.28/23)<1e-7,'all 23 new physical links remain exactly fixed');
 if(!firstMovement)firstMovement=r;
 handoff=r.nextState;
}
assert.equal(handoff.frames,90);
assert.ok(handoff.seconds>2.9);
assert.ok(handoff.pose.points[0].x-initial.pose.points[0].x>.25,
 'head should really start moving along the glass edge');
assert.ok(contactMin>=20,
 'the entire body must remain mostly resting on the ground');
assert.ok(maxJointDelta>0,
 'a valid handoff is a real low-speed 3D pose step, not static CSS');
assert.equal(JSON.stringify({wallState,scene,terrain}),before,
 'the real V0.7P source must remain untouched through 90 frames');
assert.ok(firstMovement.pose.points[0].x-initial.pose.points[0].x<.01,
 'NO giant movement in the first frame after 13→24 switch');

const invalidTime=advanceSnakeGroundHandoffV07s(
 initial.nextState,{scene,terrain,seconds:1/30,maxJointSpeed:.05});
assert.equal(invalidTime.ok,false);
assert.equal(invalidTime.reason,'v07s_unbounded_joint_speed');
assert.equal(invalidTime.pose,null);
assert.equal(invalidTime.nextState,null);

const changedScene=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'rear_stone_02',kind:'rock_overhang',x:410,y:10,
  width:108,depth:70,height:190,transmissionPermille:0
 }
});
const stale=advanceSnakeGroundHandoffV07s(initial.nextState,{
 scene:changedScene,terrain,seconds:1/30
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'source_scene_or_terrain_changed');
assert.equal(stale.pose,null);
const mutatedTerrain=prepareSnakeGroundHandoffV07s({
 wallState,scene,terrain:{...terrain,groundZ:.09}
});
assert.equal(mutatedTerrain.ok,false);
assert.equal(mutatedTerrain.reason,'source_scene_or_terrain_changed');
assert.equal(mutatedTerrain.pose,null);
for(const args of [
 {targetJointCount:13},{targetJointCount:25},
 {departure:{x:0,y:0}},
 {departure:{x:NaN,y:0}},
 {departure:{x:2,y:0}},
 {speciesId:'invented_species'}
])assert.throws(()=>prepareSnakeGroundHandoffV07s({
 wallState,scene,terrain,...args
}),RangeError,'cannot smuggle invalid anatomy or departure into handoff');
const source=readFileSync(new URL(
 '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/prepareSnakeGroundHandoffV07s/);
assert.match(html,/advanceSnakeGroundHandoffV07s/);
assert.match(html,/qaV07sHandoff/);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7S: real 13-joint V0.7P completed rest → same 2.28-length 24-joint ground representation, bounded curve/tail offsets; 90 moving 3D frames with fixed bones, head/terrain/V0.3d obstacle checks, fail-closed stale/fast steps; no 2.5-length old-route teleport, skin, cave or player changes.');
