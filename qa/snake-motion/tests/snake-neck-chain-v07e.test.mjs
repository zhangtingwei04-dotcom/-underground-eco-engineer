import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 advanceSnakeTravelStateV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {sampleSnakeGroundNeckV07d}
 from '../src/ohm-core/snake-terrain-neck-v07d.mjs';
import {
 inspectSnakeTerrainClearance
} from '../src/ohm-core/snake-terrain-contact.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 makeSnakeHeadAttachment,poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {
 SNAKE_NECK_CHAIN_VERSION,bendSnakeNeckChainV07e
} from '../src/ohm-core/snake-neck-chain-v07e.mjs';
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'neck_v07e_isolated'
});
const empty=JSON.stringify(scene);
const terrain={groundZ:0,rock:null,perch:null};
const length=1.4,boneCount=24,ds=length/(boneCount-1);
const bodyRadius=.084;
const theta=.15,curveR=ds/(2*Math.sin(theta/2));
const points=Array.from({length:boneCount},(_,i)=>Object.freeze({
 x:-curveR*Math.sin(theta*i),
 y:curveR*(1-Math.cos(theta*i)),
 z:bodyRadius+.006
}));
const basePose=Object.freeze({
 length,boneCount,segmentLength:ds,bodyRadius,
 points:Object.freeze(points),mode:'ground'
});
const baseJson=JSON.stringify(basePose);
assert.equal(SNAKE_NECK_CHAIN_VERSION,'0.7E');
assert.equal(inspectSnakeTerrainClearance(basePose,{
 terrain,samplesPerBone:16
}).ok,true);
assert.equal(inspectSnakeTerrariumPoseV07c(basePose,scene).ok,true);
for(const desiredYaw of [.09,-.09]){
 for(const speciesId of [
  'generic_snake','corn_snake','hognose_snake'
 ]){
  const bent=bendSnakeNeckChainV07e({
   basePose,scene,terrain,desiredYaw,speciesId
  });
  assert.equal(bent.applied,true,
   'curved six-link spine has slack for gentle bounded neck turn '+speciesId);
  assert.equal(bent.reason,null);
  assert.equal(bent.version,'0.7E');
  assert.equal(bent.pose.points.length,basePose.points.length);
  assert.equal(bent.neckAngles.length,5);
  assert.ok(bent.pose.points.slice(1,6)
   .filter((p,i)=>Math.hypot(
    p.x-basePose.points[i+1].x,
    p.y-basePose.points[i+1].y,
    p.z-basePose.points[i+1].z
   )>1e-6).length>=3,
   'bend must genuinely distribute across multiple neck joints, not only turn head');
  assert.equal(bent.head.speciesId,speciesId);
  assert.equal(bent.pose.points[0].x,basePose.points[0].x);
  assert.equal(bent.pose.points[0].y,basePose.points[0].y);
  assert.deepEqual(bent.pose.points[6],basePose.points[6],
   'neck rear attachment remains at original coordinate');
  assert.deepEqual(bent.pose.points.slice(7),basePose.points.slice(7),
   'all control points past neck must remain exactly unchanged');
  for(let j=1;j<bent.pose.points.length;j++){
   const a=bent.pose.points[j-1],b=bent.pose.points[j];
   const segment=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
   assert.ok(Math.abs(segment-ds)<1e-6,
    'all segments including new neck share the original fixed length');
  }
  assert.ok(bent.maxControlPointShift>1e-6);
  assert.ok(bent.maxControlPointShift<ds*.38);
  assert.equal(inspectSnakeTerrainClearance(bent.pose,{
   terrain,samplesPerBone:16
  }).ok,true);
  assert.equal(inspectSnakeTerrariumPoseV07c(bent.pose,scene).ok,true);
  assert.ok(bent.headMinimumClearance>=-.00001);
  assert.ok(bent.neckAngles.every(j=>Number.isFinite(j.radians)));
  const oldHead=makeSnakeHeadAttachment({speciesId,length});
  const original=poseSnakeHeadAttachment(oldHead,basePose.points);
  assert.ok(bent.measuredHeadDirectionChangeRadians>1e-6);
  assert.ok(bent.measuredHeadDirectionChangeRadians<.15);
  assert.deepEqual(bent.head.uv,oldHead.uv);
  assert.deepEqual(bent.head.triangles,oldHead.triangles);
  assert.ok(Object.isFrozen(bent));
  assert.ok(Object.isFrozen(bent.pose.points));
  assert.deepEqual(bent,bendSnakeNeckChainV07e({
   basePose,scene,terrain,desiredYaw,speciesId
  }),'same bend must not change between draws or sign-in states');
  assert.equal(original.meshPositions.length,bent.head.meshPositions.length);
 }
}
assert.equal(JSON.stringify(basePose),baseJson,
 'deforming a neck must not rewrite the base pose or original chain');
assert.equal(JSON.stringify(scene),empty,'scene is read-only');
const neutral=bendSnakeNeckChainV07e({
 basePose,scene,terrain,desiredYaw:0
});
assert.equal(neutral.applied,false);
assert.equal(neutral.reason,'zero_turn');
assert.equal(neutral.pose,basePose,'no bend preserves exact old pose reference');

const obstacle=createTerrariumSceneGeometryV03d({
 sceneId:'neck_obstacle_v07e',objects:[{
  id:'rock_1',kind:'rock_overhang',
  x:440,y:180,width:100,depth:90,height:160,
  transmissionPermille:0
 }]
});
const blocked=bendSnakeNeckChainV07e({
 basePose,scene:obstacle,terrain,desiredYaw:.08
});
assert.equal(blocked.applied,false);
assert.equal(blocked.reason,'source_pose_collides');
assert.equal(blocked.pose,basePose);

const lowPose={...basePose,bodyRadius:.002,
 points:basePose.points.map(p=>({...p,z:.008}))};
const low=bendSnakeNeckChainV07e({
 basePose:lowPose,scene,terrain,desiredYaw:.08,
 speciesId:'hognose_snake'
});
assert.equal(low.applied,false,
 'head below heightfield must never be accepted as an artistic success');
const grown=makeSnakeHeadAttachment({speciesId:'hognose_snake',length});
assert.ok(grown.localVertices.length>100);

// Drive a realistic curved V0.7D motion through the optional new neck
// constraint wrapper. It can choose an unchanged safe fallback and may NOT
// claim bending was applied if hard constraints fail.
const route=createSnakeTravelRouteV07([
 {x:-.3,y:-.4},{x:.22,y:-.34},{x:.6,y:.1},
 {x:1.15,y:.22},{x:1.7,y:.22},{x:2.3,y:.0}
]);
const body={length:1.4,boneCount:24,bodyRadius:.084};
let state=createSnakeTravelStateV07(route,{distance:.65,speed:.15});
let previousYaw=null;
let sampled=0,changed=0;
for(let i=0;i<30;i++){
 state=advanceSnakeTravelStateV07(state,{seconds:.1,moving:true});
 const ground=sampleSnakeGroundNeckV07d({
  state,scene,terrain,body,speciesId:'generic_snake',
  previousYaw,seconds:.1
 });
 assert.equal(ground.ok,true,'V0.7D baseline must remain safe');
 previousYaw=ground.neck.yaw;
 const extra=bendSnakeNeckChainV07e({
  basePose:ground.pose,scene,terrain,
  desiredYaw:ground.neck.yaw,speciesId:'generic_snake'
 });
 if(extra.applied){
  changed++;
  assert.equal(inspectSnakeTerrainClearance(extra.pose,{
   terrain,samplesPerBone:16
  }).ok,true);
 }else{
  assert.equal(extra.pose,ground.pose);
  assert.ok(['zero_turn','neck_constraints_unresolved'].includes(extra.reason));
 }
 sampled++;
}
assert.equal(sampled,30);
assert.ok(changed>=15,'normal curved travel should actually allow safe multi-joint neck bending in at least half of frames; otherwise do not claim a usable V0.7E chain');
for(const fn of [
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,desiredYaw:NaN}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,desiredYaw:.13}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,links:3,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,links:9,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,iterations:20,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain:null,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,margin:NaN,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose,scene,terrain,desiredYaw:.05,
   speciesId:'pretend_species'}),
 ()=>bendSnakeNeckChainV07e({basePose:{
   ...basePose,points:basePose.points.slice(0,9)
  },scene,terrain,desiredYaw:.05}),
 ()=>bendSnakeNeckChainV07e({basePose:{
   ...basePose,points:basePose.points.map((p,i)=>i===2?
    {...p,x:p.x+1}:p)
  },scene,terrain,desiredYaw:.05})
])assert.throws(fn,RangeError);
const code=readFileSync(
 new URL('../src/ohm-core/snake-neck-chain-v07e.mjs',import.meta.url),'utf8'
);
assert.doesNotMatch(code,
 /\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|Math\.random\s*\(|saveGame\s*\(/);
console.log('PASS SNAKE V0.7E: 3 species / signed multi-link neck geometry, fixed ends, fixed bones, continuous 30-frame fail-safe preflight, V0.3d XY + V0.6A ground protection, no player save writes; optional moving bend accepted '+changed+'/30.');
