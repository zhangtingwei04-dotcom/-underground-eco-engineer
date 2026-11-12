import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';
import {
 createSnakeWallProbeV07p,advanceSnakeWallProbeV07p,
 SNAKE_WALL_PROBE_VERSION
} from '../src/ohm-core/snake-wall-probe-v07p.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07p_wall_probe_lab',
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
const ds=.19,r=.13,z=.135,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z
}));
for(const degrees of [90,120,150,180,210,240]){
 const a=degrees*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,
  y:p.y+Math.sin(a)*ds,z
 }));
}
const base=Object.freeze({
 version:'0.7P_source_pose',
 points:Object.freeze(points),segmentLength:ds,bodyRadius:r
});
const original=JSON.stringify(base);
const sourceBefore=JSON.stringify(scene);
assert.equal(inspectSnakeTerrariumPoseV07c(base,scene).ok,true);
assert.equal(inspectSnakeTerrainClearance(base,{terrain,samplesPerBone:24}).ok,true);
const create=()=>createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,maxPitch:.36,
 speciesId:'generic_snake',wall:'rear'
});
const start=create();
assert.equal(SNAKE_WALL_PROBE_VERSION,'0.7P');
assert.equal(start.version,'0.7P');
assert.equal(start.pitch,0);
assert.equal(start.sceneRevision,scene.revision);
assert.ok(Object.isFrozen(start)&&Object.isFrozen(start.pose));
assert.ok(Object.isFrozen(start.pose.points));
assert.ok(start.head.meshPositions.length>=128);
let state=start,maxLift=0,highestAngle=0,firstHold=null;
const seen=new Set();
for(let i=0;i<95;i++){
 const a=advanceSnakeWallProbeV07p(state,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(a.renderable,true,
  'authored transparent near-wall pose must remain safe at frame '+i+
  ': '+a.reason);
 assert.ok(a.pose&&a.head&&a.nextState,
  'never invent a placeholder safe pose');
 assert.equal(a.playableCaveAuthorized,false);
 assert.equal(a.actualWallClimbingVerified,false);
 assert.equal(a.wallFrictionVerified,false);
 assert.equal(a.skinApplied,false);
 assert.equal(a.rearGroundSupportPreserved,true);
 assert.equal(a.sourceCollisionChecked,true);
 assert.equal(a.headMeshVerticesChecked,true);
 assert.equal(inspectSnakeTerrariumPoseV07c(a.pose,scene).ok,true);
 assert.equal(inspectSnakeTerrainClearance(a.pose,{
  terrain,samplesPerBone:24
 }).ok,true);
 for(let k=1;k<a.pose.points.length;k++)
  assert.ok(Math.abs(Math.hypot(
   a.pose.points[k].x-a.pose.points[k-1].x,
   a.pose.points[k].y-a.pose.points[k-1].y,
   a.pose.points[k].z-a.pose.points[k-1].z
  )-ds)<1e-7,
  'each 3D bone keeps source length during vertical rearing');
 for(let k=6;k<a.pose.points.length;k++)
  assert.deepEqual(a.pose.points[k],base.points[k],
   'rear grounded U curve must not float or slide');
 assert.ok(a.maxJointDelta<=.75/30+1e-8);
 assert.ok(a.pose.points[0].y>-1.6+.13,
  'the head cannot enter or pierce the rear glass');
 seen.add(a.phase);
 maxLift=Math.max(maxLift,a.pose.points[0].z-base.points[0].z);
 highestAngle=Math.max(highestAngle,a.pitchRadians);
 if(a.phase==='hold'&&!firstHold)firstHold=a;
 state=a.nextState;
}
assert.ok(seen.has('rise')&&seen.has('hold')&&
 seen.has('lower')&&seen.has('rest'));
assert.ok(maxLift>.25,'upper third must actually rise over the support pivot');
assert.ok(highestAngle>.34&&highestAngle<=.36+1e-7);
assert.ok(firstHold.headYawRadians>=0,
 'small head yaw occurs during the pause; no uncontrolled twist');
// The front should arc gradually upward from a lower supporting bend,
// NOT behave like a single straight pole hinged abruptly at its pivot.
const forebodyAngles=Array.from({length:6},(_,i)=>{
 const a=firstHold.pose.points[i],b=firstHold.pose.points[i+1];
 return Math.atan2(a.z-b.z,Math.hypot(a.x-b.x,a.y-b.y));
});
assert.ok(forebodyAngles[0]>forebodyAngles.at(-1)+.12,
 'headward segments rise more steeply than the near-ground base');
assert.ok(forebodyAngles.every((v,i)=>
 i===0||v<=forebodyAngles[i-1]+1e-8),
 'forebody curvature increases smoothly toward the head');
assert.ok(Math.max(...forebodyAngles.slice(1).map((v,i)=>
 Math.abs(v-forebodyAngles[i])))<.13,
 'no single sharp rigid hinge creates a right angle at the support pivot');
assert.ok(Math.abs(state.pose.points[0].z-base.points[0].z)<1e-8,
 'full cycle must lower head back to exact original resting pose');
assert.deepEqual(state.pose.points,base.points,
 'after scripted return, the original safe 3D pose is restored');
assert.equal(JSON.stringify(base),original);
assert.equal(JSON.stringify(scene),sourceBefore);
assert.deepEqual(start,create(),'same source always gives same probe state');

const tooFast=advanceSnakeWallProbeV07p(start,{
 scene,terrain,seconds:.1,maxJointSpeed:.1
});
assert.equal(tooFast.renderable,false);
assert.equal(tooFast.reason,'unsafe_temporal_joint_jump');
assert.equal(tooFast.pose,null);
assert.equal(tooFast.nextState,null,
 'never permit caller to draw previous unsafe frame as a fallback');
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'rear_stone_02',kind:'rock_overhang',x:410,y:10,
  width:108,depth:70,height:190,transmissionPermille:0
 }
});
const stale=advanceSnakeWallProbeV07p(start,{
 scene:moved,terrain,seconds:1/30
});
assert.equal(stale.renderable,false);
assert.equal(stale.reason,'source_scene_or_terrain_changed');
assert.equal(stale.pose,null);
const changedTerrain=advanceSnakeWallProbeV07p(start,{
 scene,terrain:{...terrain,groundZ:.09},seconds:1/30
});
assert.equal(changedTerrain.renderable,false);
assert.equal(changedTerrain.pose,null);
for(const invalid of [
 {...base,points:points.map((p,i)=>i===3?{...p,z:p.z+.01}:p)},
 {...base,bodyRadius:NaN},
 {...base,points:points.map((p,i)=>i===0?{...p,y:-1.59}:p)},
 {...base,points:points.map((p,i)=>i===1?{...p,x:NaN}:p)}
])assert.throws(()=>createSnakeWallProbeV07p({
 scene,terrain,basePose:invalid
}),RangeError);
assert.throws(()=>createSnakeWallProbeV07p({
 scene,terrain,basePose:base,wall:'back'
}),RangeError);
assert.throws(()=>createSnakeWallProbeV07p({
 scene,terrain,basePose:base,maxPitch:1
}),RangeError);
assert.throws(()=>advanceSnakeWallProbeV07p(start,{
 scene,terrain,seconds:.2
}),RangeError);
const src=readFileSync(new URL(
 '../src/ohm-core/snake-wall-probe-v07p.mjs',import.meta.url),'utf8');
assert.doesNotMatch(src,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7P: 95 fixed-step frames near the source-owned rear glass, rise/hold/lower/rest, every 3D bone fixed, 7 grounded rear nodes, head mesh/rock checks, safe temporal stop and stale source rejection; no glass adhesion, skin, or player changes.');
