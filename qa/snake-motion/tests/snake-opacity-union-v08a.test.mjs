import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
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
import {buildSnakeNeckFollowV07x}
 from '../src/ohm-core/snake-neck-follow-v07x.mjs';
import {buildSnakeSlenderVolumeV07y}
 from '../src/ohm-core/snake-slender-volume-v07y.mjs';
import {inspectSnakeVolumeClearanceV07z,SNAKE_VOLUME_CLEARANCE_VERSION}
 from '../src/ohm-core/snake-volume-clearance-v07z.mjs';

import {buildSnakeOpacityUnionV08a}
 from '../src/ohm-core/snake-opacity-union-v08a.mjs';
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07z_candidate_safety_and_optical_overlap',
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
const ds=.19,start=[];
for(let i=0;i<=6;i++)start.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const a=degree*Math.PI/180,p=start.at(-1);
 start.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z:.135
 }));
}
const pose13=Object.freeze({
 bodyRadius:.13,segmentLength:ds,points:Object.freeze(start)
});
const step=2.28/23;
const pose24=Object.freeze({
 bodyRadius:.13,segmentLength:step,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:1.15-i*step,y:0,z:.135
 })))
});
function realSlender(pose){
 const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
  speciesId:'generic_snake',length:2.28
 }),pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 const ghost=buildSnakeGhostContinuityV07v({
  pose,head,volume,bridge
 });
 const sculpt=buildSnakeHeadNeckSculptV07w({
  pose,head,volume,ghost,scene,terrain
 });
 assert.equal(sculpt.ok,true,sculpt.reason);
 const neckFollow=buildSnakeNeckFollowV07x({
  pose,head,volume,sculpt,scene,terrain
 });
 assert.equal(neckFollow.ok,true,neckFollow.reason);
 const slender=buildSnakeSlenderVolumeV07y({
  pose,volume,neckFollow,scene,terrain
 });
 assert.equal(slender.ok,true,slender.reason);
 return slender;
}

for(const pose of [pose13,pose24]){
 const slender=realSlender(pose);
 const clearance=inspectSnakeVolumeClearanceV07z({pose,slender});
 const input={slender,clearance,headProjection:slender.headProjection,
  bodyJoinRingIndex:4};
 const before=JSON.stringify({pose,slender,clearance});
 const result=buildSnakeOpacityUnionV08a(input);
 assert.equal(result.version,'0.8A');
 assert.equal(result.paths.length,3);
 assert.deepEqual(result.paths.map(p=>p.kind),['body','collar','head']);
 assert.ok(result.paths.every(p=>p.positiveWinding));
 assert.equal(result.paths[0].points.length,2*(slender.bodyWorldRings.length-4));
 assert.equal(result.fillRule,'nonzero');
 assert.equal(result.translucentFillPasses,1);
 assert.equal(result.usesExistingV07yProjection,true);
 assert.equal(result.originalHeadColliderStillAuthoritative,true);
 assert.equal(result.sourceBonesChanged,false);
 assert.equal(result.bodyMeshChanged,false);
 assert.equal(result.headChanged,false);
 assert.equal(result.depthSorted3D,false);
 assert.equal(result.skinApplied,false);
 assert.equal(result.collisionCertifiedForPlayers,false);
 assert.equal(result.affectsSave,false);
 assert.equal(result.affectsEcology,false);
 assert.deepEqual(result,buildSnakeOpacityUnionV08a(input));
 const rev=buildSnakeOpacityUnionV08a({...input,
  headProjection:{...slender.headProjection,
   outline:[...slender.headProjection.outline].reverse()}});
 assert.deepEqual(rev.paths[2],result.paths[2]);
 for(const patch of [
  {slender:{...slender,skinApplied:true}},
  {slender:{...slender,sourceBonesModified:true}},
  {clearance:{...clearance,qualityAccepted:false}},
  {clearance:{...clearance,sourceJointCount:999}},
  {headProjection:{outline:[]}},
  {bodyJoinRingIndex:99}
 ])assert.throws(()=>buildSnakeOpacityUnionV08a({...input,...patch}),RangeError);
 assert.equal(JSON.stringify({pose,slender,clearance}),before);
}
console.log('PASS V0.8A: source-backed 13/24 pose, union winding, single opacity, no mesh change');
