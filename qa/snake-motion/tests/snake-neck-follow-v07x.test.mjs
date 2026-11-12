import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {buildTransparentHeadNeckBridgeV07r}
 from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';
import {buildSnakeGhostContinuityV07v}
 from '../src/ohm-core/snake-ghost-continuity-v07v.mjs';
import {buildSnakeHeadNeckSculptV07w}
 from '../src/ohm-core/snake-head-neck-sculpt-v07w.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {buildSnakeNeckFollowV07x,SNAKE_NECK_FOLLOW_VERSION}
 from '../src/ohm-core/snake-neck-follow-v07x.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07x_authored_source_bone_turns_and_rig',
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
 const t=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(t)*ds,y:p.y+Math.sin(t)*ds,z:.135
 }));
}
const pose13=Object.freeze({
 bodyRadius:.13,segmentLength:ds,points:Object.freeze(points)
});
const step24=2.28/23;
const pose24=Object.freeze({
 bodyRadius:.13,segmentLength:step24,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:1.15-i*step24,y:0,z:.135
 })))
});
const makePose=(base,angle)=>{
 const pts=base.points.map(p=>({...p}));
 // Bend the actual second source joint relative to the first, while
 // preserving the canonical bone lengths to <1e-12.
 const a=pts[1];
 pts[2]={x:a.x-Math.cos(angle)*base.segmentLength,
  y:a.y+Math.sin(angle)*base.segmentLength,z:a.z};
 for(let i=3;i<pts.length;i++){
  const prev=pts[i-1];
  pts[i]={x:prev.x-base.segmentLength,y:prev.y,z:prev.z};
 }
 return Object.freeze({...base,
  points:Object.freeze(pts.map(p=>Object.freeze(p)))});
};
function sources(pose,sceneValue=scene,terrainValue=terrain){
 const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
  speciesId:'generic_snake',
  length:pose.segmentLength*(pose.points.length-1)
 }),pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 const ghost=buildSnakeGhostContinuityV07v({
  pose,head,volume,bridge
 });
 const sculpt=buildSnakeHeadNeckSculptV07w({
  pose,head,volume,ghost,scene:sceneValue,terrain:terrainValue
 });
 assert.equal(sculpt.ok,true,'V0.7W must certify source before X');
 return {pose,head,volume,ghost,sculpt,
  scene:sceneValue,terrain:terrainValue};
}
let baseline=null;
for(const [name,pose] of [['near_glass_13',pose13],
 ['resting_24',pose24]]){
 const input=sources(pose),before=JSON.stringify(input);
 const x=buildSnakeNeckFollowV07x(input);
 if(name==='near_glass_13')baseline=input;
 assert.equal(x.version,SNAKE_NECK_FOLLOW_VERSION);
 assert.equal(x.ok,true,x.reason);
 assert.equal(x.sourceJointCount,pose.points.length);
 assert.equal(x.headRings,10);
 assert.equal(x.collarRings,11);
 assert.equal(x.candidate.vertices.length,320);
 assert.equal(x.candidate.triangles.length,636);
 assert.equal(x.candidateSamplesChecked,2864);
 assert.equal(x.halfFrameSamplesChecked,0);
 assert.equal(x.headTangentMatchesFirstBone,true);
 assert.equal(x.neckTangentGuidedBySecondBone,true);
 assert.equal(x.originalColliderStillAuthoritative,true);
 assert.equal(x.originalSocketPreserved,true);
 assert.equal(x.sourceHeadModified,false);
 assert.equal(x.sourceBoneModified,false);
 assert.equal(x.displayCandidateMeshIdentical,true);
 assert.equal(x.modelCertifiedForPlayers,false);
 assert.equal(x.continuousSweptCollisionVerified,false);
 assert.equal(x.trueContactForcesVerified,false);
 assert.equal(x.skinApplied,false);
 assert.equal(x.playableCaveAuthorized,false);
 assert.ok(x.maximumRingShift<=.055+1e-8);
 assert.ok(x.maximumRingShift>.0001,
  'X must actually update the W straight neck, not just metadata');
 assert.ok(Object.isFrozen(x)&&
  Object.isFrozen(x.candidate.vertices));
 assert.equal(x.headProjection.projectedRings.length,10);
 assert.equal(x.collarProjection.projectedRings.length,11);
 assert.ok(x.collarProjection.minimumWidth>.035);
 assert.equal(x.candidate.ringCount,20);
 assert.equal(x.candidate.radialSegments,16);
 for(let i=0;i<160;i++){
  assert.deepEqual(x.candidate.vertices[i],
   input.sculpt.candidate.vertices[i],
   'no movement of ANY redesigned V0.7W head mesh vertex');
  const headIndex=9-Math.floor(i/16),k=i%16;
  assert.deepEqual(
   x.headProjection.projectedRings[headIndex][k],
   projectSnakeFrontGlassPointV07g(x.candidate.vertices[i]),
   'render + candidate collision must derive from same 3D head mesh'
  );
 }
 for(let i=304;i<320;i++)
  assert.deepEqual(x.candidate.vertices[i],
   input.sculpt.candidate.vertices[i],
   'world body joint socket must match original source exactly');
 // Each V0.7X collar rendered ring corresponds to 3D candidate mesh.
 for(let i=0;i<11;i++)
  for(let j=0;j<16;j++)
   assert.deepEqual(x.collarProjection.projectedRings[i][j],
    projectSnakeFrontGlassPointV07g(
     x.candidate.vertices[(9+i)*16+j]));
 assert.deepEqual(x,buildSnakeNeckFollowV07x(input),
  'no randomness or state mutation in reproducible 3D collar');
 assert.equal(JSON.stringify(input),before,
  'source pose/head/volume/scene/terrain may never be mutated');
}
const curved=makePose(pose24,.20);
const curvedInput=sources(curved);
const cx=buildSnakeNeckFollowV07x(curvedInput);
assert.equal(cx.ok,true,cx.reason);
assert.ok(cx.sourceNeckAngle>.08&&cx.sourceNeckAngle<.15,
 'second source bone must produce genuine relative bend angle');
assert.ok(cx.maximumRingShift>.0002);
assert.ok(cx.localCenterOffsets.some(n=>n>.0005),
 'neck center must depart from straight-line V0.7W geometry');
const halfTime=buildSnakeNeckFollowV07x({
 ...curvedInput,previous:cx,seconds:1/30
});
assert.equal(halfTime.ok,true,halfTime.reason);
assert.equal(halfTime.halfFrameSamplesChecked,2864);
assert.equal(halfTime.displayCandidateMeshIdentical,true);
const noElapsedFrame=buildSnakeNeckFollowV07x({
 ...curvedInput,previous:cx,seconds:0
});
assert.equal(noElapsedFrame.ok,false);
assert.equal(noElapsedFrame.reason,'v07x_stale_previous_candidate');
const differentSource=buildSnakeNeckFollowV07x({
 ...curvedInput,previous:{...cx,
  sourceSceneSignature:'bad_scene_snapshot'}
});
assert.equal(differentSource.ok,false);
assert.equal(differentSource.reason,'v07x_stale_previous_candidate');
assert.equal(differentSource.candidate,null);
const rockShifted=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'near_snout_rock',kind:'rock_overhang',
  x:568,y:18,width:48,depth:50,height:150,
  transmissionPermille:0
 }
});
const blocked=buildSnakeNeckFollowV07x({
 ...baseline,scene:rockShifted
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,
 'v07x_candidate_inside_authoritative_rock_footprint');
assert.equal(blocked.candidate,null);
assert.equal(blocked.modelCertifiedForPlayers,false);
const buried=buildSnakeNeckFollowV07x({
 ...baseline,terrain:{...terrain,groundZ:.14}
});
assert.equal(buried.ok,false);
assert.equal(buried.reason,'v07x_candidate_inside_ground');
assert.equal(buried.candidate,null);
for(const args of [
 {maxRingShift:0},{maxRingShift:.1},{maxNeckAngle:.05},
 {maxNeckAngle:3},{seconds:-1},{seconds:1}
])assert.throws(()=>buildSnakeNeckFollowV07x({...baseline,...args}),
 RangeError);
assert.throws(()=>buildSnakeNeckFollowV07x({
 ...baseline,pose:{...pose13,segmentLength:.20}
}),RangeError);
assert.throws(()=>buildSnakeNeckFollowV07x({
 ...baseline,sculpt:{...baseline.sculpt,
  modelCertifiedForPlayers:true}
}),RangeError);
const source=readFileSync(new URL(
 '../src/ohm-core/snake-neck-follow-v07x.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildSnakeNeckFollowV07x/);
assert.match(html,/qaV07xNeckFollow/);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7X: two canonical source tangents guide 11-neck 3D collar, 13/24-joint source preserved, identical 320 render/candidate mesh vertices, 2864 collision samples and optional half-frame safety, no skin/player/swept-physics claim');
