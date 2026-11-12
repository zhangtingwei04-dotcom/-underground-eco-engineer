import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 advanceSnakeTravelStateV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {createSnakeGrowthMotionBridge}
 from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';
import {
 SNAKE_TERRAIN_NECK_VERSION,
 inspectSnakeNeckContinuityV07d,sampleSnakeGroundNeckV07d
} from '../src/ohm-core/snake-terrain-neck-v07d.mjs';
const f=(a,b,eps=1e-7)=>Math.abs(a-b)<eps;
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'snake_v07d_check'
});
const flat={groundZ:0,rock:null,perch:null};
const hill={groundZ:0,
 rock:{x:.65,y:.20,radius:.60,height:.012},
 perch:null
};
const path=createSnakeTravelRouteV07([
 {x:-.3,y:-.4},{x:.22,y:-.34},{x:.6,y:.1},
 {x:1.15,y:.22},{x:1.7,y:.22},{x:2.3,y:.0}
]);
const before=JSON.stringify(scene);
const routeState=createSnakeTravelStateV07(path,{distance:1.2,speed:.18});
assert.equal(SNAKE_TERRAIN_NECK_VERSION,'0.7D');
let successful=0;
for(const speciesId of ['generic_snake','corn_snake','hognose_snake']){
 const bridge=createSnakeGrowthMotionBridge({
  speciesId,bodyLength:1.4
 });
 const body=bridge.motionParameters;
 const ground=sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:flat,speciesId
 });
 assert.equal(ground.version,'0.7D');
 assert.equal(ground.ok,true,
  'species body/head meshes remain above flat ground: '+speciesId);
 assert.equal(ground.status,'clear_artistic_preflight');
 assert.equal(ground.head.speciesId,speciesId);
 assert.equal(ground.head.origin.x,ground.pose.points[0].x);
 assert.equal(ground.headMinimumClearance>=-.00001,true);
 assert.equal(ground.physicsVerified,false);
 assert.equal(ground.meshCollisionVerified,false);
 assert.equal(ground.geometryAuthority,
  'V0.3d_XY_and_explicit_V0.6A_heightfield');
 assert.ok(ground.pose.points.length>=8);
 assert.equal(inspectSnakeTerrainClearance(ground.pose,{
  terrain:flat,samplesPerBone:16
 }).ok,true);
 assert.equal(ground.neck.yaw<=.12&&ground.neck.yaw>=-.12,true);
 assert.ok(Object.isFrozen(ground));
 assert.ok(Object.isFrozen(ground.neck));
 const same=sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:flat,speciesId
 });
 assert.deepEqual(ground,same,'same frame is deterministic');
 // Small, explicit low rounded hill; heightfield conformer may reject an
 // overly steep surface but must never return an unchecked 'ok' frame.
 const elevated=sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:hill,speciesId
 });
 assert.equal(elevated.ok,true,
  'a shallow explicit test hill should remain traversable and cleared for '
   +speciesId);
 assert.equal(inspectSnakeTerrainClearance(elevated.pose,{
  terrain:hill,samplesPerBone:16
 }).ok,true,
 'passing on a hill requires real fixed-bone clearance inspection');
 successful++;
}
assert.equal(successful,3);
const params={length:1.4,boneCount:24,bodyRadius:.069};
const body=createSnakeGrowthMotionBridge({
 speciesId:'generic_snake',bodyLength:1.4
}).motionParameters;
const pose=sampleSnakeGroundNeckV07d({
 state:routeState,scene,body,terrain:flat
});
assert.equal(pose.ok,true);
const neck=inspectSnakeNeckContinuityV07d(pose.pose);
assert.ok(Math.abs(neck.targetYaw)<.12);
const fixed=inspectSnakeNeckContinuityV07d(pose.pose,{
 previousYaw:0,seconds:.02,maxYawRate:.4
});
assert.ok(Math.abs(fixed.yaw)<=.0080000001);
assert.ok(f(Math.abs(fixed.yawDelta),Math.abs(fixed.yaw)));
const held=inspectSnakeNeckContinuityV07d(pose.pose,{
 previousYaw:0,seconds:0
});
assert.equal(held.yaw,0,'no elapsed time means no new head turn');
const stop=advanceSnakeTravelStateV07(routeState,{seconds:2,moving:false});
const atRest=sampleSnakeGroundNeckV07d({
 state:stop,scene,body,terrain:flat,
 previousYaw:neck.yaw,seconds:2
});
assert.equal(atRest.ok,true);
assert.deepEqual(atRest.pose.points,pose.pose.points,
 'rest does not create a travelling S wave or move the whole skeleton');
assert.ok(f(atRest.neck.yaw,neck.yaw,1e-8));
const advanced=advanceSnakeTravelStateV07(routeState,{
 seconds:.06,moving:true
});
const next=sampleSnakeGroundNeckV07d({
 state:advanced,scene,body,terrain:flat,
 previousYaw:neck.yaw,seconds:.06
});
assert.equal(next.ok,true);
assert.ok(Math.abs(next.neck.yaw-neck.yaw)<=.0360000001,
 'head yaw angular speed is bounded between frames');
// Engineering continuous-frame gate: sample moving frames instead of
// trusting only an isolated favorable pose or a final screenshot.
let movingFrames=0;
let previousState=createSnakeTravelStateV07(path,{distance:.55,speed:.18});
let previousSample=sampleSnakeGroundNeckV07d({
 state:previousState,scene,body,terrain:flat,speciesId:'generic_snake'
});
assert.equal(previousSample.ok,true);
for(let i=0;i<30;i++){
 const nextState=advanceSnakeTravelStateV07(previousState,{
  seconds:.12,moving:true
 });
 const sample=sampleSnakeGroundNeckV07d({
  state:nextState,scene,body,terrain:flat,speciesId:'generic_snake',
  previousYaw:previousSample.neck.yaw,seconds:.12
 });
 assert.equal(sample.ok,true,'moving frame '+i+' must pass full preflight');
 assert.ok(Math.abs(sample.neck.yaw-previousSample.neck.yaw)<=.0720000001,
  'yaw must not jump across consecutive frames');
 const headTravel=Math.hypot(
  sample.pose.points[0].x-previousSample.pose.points[0].x,
  sample.pose.points[0].y-previousSample.pose.points[0].y
 );
 assert.ok(headTravel>0&&headTravel<.024,
  'head movement must be bounded and not teleport on frame '+i);
 for(let k=1;k<sample.pose.points.length;k++){
  const a=sample.pose.points[k-1],b=sample.pose.points[k];
  const segment=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
  assert.ok(Math.abs(segment-body.length/(body.boneCount-1))<1e-6,
   'fixed-length 3D segments must survive terrain fitting');
 }
 previousState=nextState;
 previousSample=sample;
 movingFrames++;
}
assert.equal(movingFrames,30);
const rock={id:'rock_obstacle',kind:'rock_overhang',
 x:540,y:150,width:100,depth:140,height:70,transmissionPermille:0};
const blockedScene=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:rock
});
const blocked=sampleSnakeGroundNeckV07d({
 state:routeState,scene:blockedScene,body,terrain:flat
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'xy_blocked');
assert.equal(blocked.xy.obstacleId,'rock_obstacle');
assert.equal(blocked.pose,null);
assert.equal(blocked.head,null,
 'never rig the head if the real scene reports full body collision');
const changedRock=applyTerrariumSceneGeometryV03dEvent(blockedScene,{
 channel:'object',type:'upsert',object:{...rock,x:780}
});
const moved=sampleSnakeGroundNeckV07d({
 state:routeState,scene:changedRock,body,terrain:flat
});
assert.equal(moved.ok,true,
 'move source-owned rock away and recompute preflight without stale data');

const tooThin={...body,bodyRadius:.001};
const lowHead=sampleSnakeGroundNeckV07d({
 state:routeState,scene,body:tooThin,terrain:flat,
 speciesId:'hognose_snake'
});
assert.equal(lowHead.ok,false);
assert.equal(lowHead.reason,'head_mesh_penetration',
 'do not let oversized hognose head interpenetrate ground');
assert.ok(lowHead.headMinimumClearance<0);
const bad=[ 
 ()=>sampleSnakeGroundNeckV07d({state:routeState,scene,body}),
 ()=>sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:flat,speciesId:'unknown'
 }),
 ()=>sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:flat,heightMargin:NaN
 }),
 ()=>sampleSnakeGroundNeckV07d({
  state:routeState,scene,body,terrain:flat,seconds:-1
 }),
 ()=>sampleSnakeGroundNeckV07d({
  state:routeState,scene:null,body,terrain:flat
 }),
 ()=>sampleSnakeGroundNeckV07d({
  state:routeState,scene,body:{...body,boneCount:7},terrain:flat
 }),
 ()=>inspectSnakeNeckContinuityV07d(null),
 ()=>inspectSnakeNeckContinuityV07d(pose.pose,{previousYaw:Infinity}),
 ()=>inspectSnakeNeckContinuityV07d(pose.pose,{previousYaw:.13}),
 ()=>inspectSnakeNeckContinuityV07d(pose.pose,{seconds:-1}),
 ()=>inspectSnakeNeckContinuityV07d(pose.pose,{maxYawRate:0})
];
for(const g of bad)assert.throws(g,RangeError);
assert.equal(JSON.stringify(scene),before,
 'no mutation to authoritative ecology, lighting, organic pools or geometry');
const source=readFileSync(
 new URL('../src/ohm-core/snake-terrain-neck-v07d.mjs',import.meta.url),
 'utf8'
);
assert.doesNotMatch(source,
 /\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|Math\.random\s*\(|saveGame\s*\(/);
console.log('PASS SNAKE V0.7D: 3 species slopes and head mesh, 30 continuous fixed-bone moving frames, rate-limited yaw, rest stability, moved V0.3d rock, hognose snout penetration rejected, no saves.');
