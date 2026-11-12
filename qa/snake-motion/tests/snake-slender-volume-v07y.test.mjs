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
import {buildSnakeNeckFollowV07x}
 from '../src/ohm-core/snake-neck-follow-v07x.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 SNAKE_SLENDER_VOLUME_VERSION,buildSnakeSlenderVolumeV07y,snakeSlimFactorV07y
} from '../src/ohm-core/snake-slender-volume-v07y.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07y_private_slender_3d_source_qa',
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
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z:.135
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
function sources(pose){
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
 assert.equal(sculpt.ok,true,'source W '+sculpt.reason);
 const neckFollow=buildSnakeNeckFollowV07x({
  pose,head,volume,sculpt,scene,terrain
 });
 assert.equal(neckFollow.ok,true,'source X '+neckFollow.reason);
 return {pose,head,volume,sculpt,neckFollow,scene,terrain};
}
assert.ok(snakeSlimFactorV07y(0)<.85);
assert.ok(snakeSlimFactorV07y(.45)<.78);
assert.ok(snakeSlimFactorV07y(.75)<.72);
assert.equal(snakeSlimFactorV07y(1),.88);
for(const u of [-.1,1.01,NaN])
 assert.throws(()=>snakeSlimFactorV07y(u),RangeError);
for(let i=0;i<=100;i++){
 const value=snakeSlimFactorV07y(i/100);
 assert.ok(value>=.65&&value<=.89,
  'neck/trunk/tail ratios are bounded smooth art parameters');
 if(i)assert.ok(Math.abs(value-snakeSlimFactorV07y((i-1)/100))<.025,
  'continuous ring profile must not have hard local waist changes');
}
let firstSource=null,firstResult=null;
for(const [name,pose] of [['rearing_13',pose13],['ground_24',pose24]]){
 const src=sources(pose),snapshot=JSON.stringify(src);
 const y=buildSnakeSlenderVolumeV07y(src);
 if(name==='rearing_13'){firstSource=src;firstResult=y;}
 assert.equal(y.ok,true,'V0.7Y failed '+name+' '+y.reason);
 assert.equal(y.version,SNAKE_SLENDER_VOLUME_VERSION);
 assert.equal(y.sourceJointCount,pose.points.length);
 assert.equal(y.sourceBoneCount,pose.points.length-1);
 assert.equal(y.sourceTotalLength,2.28);
 assert.equal(y.headNeckCandidate.vertices.length,320);
 assert.equal(y.headNeckCandidate.triangles.length,636);
 assert.equal(y.headSamplesChecked,2864);
 assert.equal(y.bodyWorldRings.length,(pose.points.length-1)*4+1);
 assert.equal(y.bodyCandidate.vertices.length,
  ((pose.points.length-1)*4+1)*12);
 assert.equal(y.bodyCandidate.triangles.length,
  (pose.points.length-1)*4*24);
 assert.equal(y.bodySamplesChecked,y.bodyCandidate.vertices.length+
  4*y.bodyCandidate.triangles.length);
 assert.equal(y.halfTimeSamplesChecked,0);
 assert.equal(y.originalHeadColliderStillAuthoritative,true);
 assert.equal(y.sourceHeadModified,false);
 assert.equal(y.sourceBonesModified,false);
 assert.equal(y.sameVerticesRenderedAndSampled,true);
 assert.equal(y.sourceRockAuthorityUnchanged,true);
 assert.equal(y.skinApplied,false);
 assert.equal(y.certifiedForGameplay,false);
 assert.equal(y.continuousWholeBodyCollisionVerified,false);
 assert.equal(y.realTractionVerified,false);
 assert.equal(y.affectsSave,false);
 assert.equal(y.affectsEcology,false);
 assert.equal(y.playableCaveAuthorized,false);
 assert.ok(y.neckSocketScale<.83&&y.neckSocketScale>.70);
 assert.ok(y.midBodyScale<.80&&y.midBodyScale>.68,
  'mid-body radius should genuinely be about one-quarter slimmer');
 assert.ok(Math.abs(y.tipScale-.88)<1e-7);
 assert.ok(y.headBodySocketGap<1e-4);
 assert.ok(y.maxBendRelief>=0&&y.maxBendRelief<=.045+1e-8);
 assert.ok(Object.isFrozen(y)&&Object.isFrozen(y.bodyCandidate.vertices));
 assert.equal(y.bodyProjection.projectedRings.length,
  y.bodyCandidate.ringCount);
 assert.equal(y.collarProjection.projectedRings.length,11);
 assert.equal(y.headProjection.projectedRings.length,10);
 const originalHead=src.neckFollow.candidate.vertices;
 for(let i=0;i<160;i++)
  assert.deepEqual(y.headNeckCandidate.vertices[i],originalHead[i],
   'new slender waist must not alter a single head source collision vertex');
 for(let i=0;i<y.bodyWorldRings.length;i++){
  const bodyRing=y.bodyWorldRings[i];
  assert.ok(y.profileScales[i]<=.88&&y.profileScales[i]>=.6);
  assert.equal(bodyRing.length,12);
  for(let j=0;j<12;j++){
   assert.deepEqual(bodyRing[j],
    y.bodyCandidate.vertices[i*12+j],
    'visible body sample must be exact candidate collision mesh XYZ');
   assert.deepEqual(
    y.bodyProjection.projectedRings[i][j],
    projectSnakeFrontGlassPointV07g(y.bodyCandidate.vertices[i*12+j])
   );
   const a=src.volume.worldRings[i][j],o=src.volume.worldCenters[i];
   const v=y.bodyCandidate.vertices[i*12+j];
   const rOld=Math.hypot(a.x-o.x,a.y-o.y,a.z-o.z);
   const rNew=Math.hypot(v.x-o.x,v.y-o.y,v.z-o.z);
   assert.ok(Math.abs(rNew/rOld-y.profileScales[i])<1e-8);
  }
 }
 for(let k=0;k<11;k++)
  for(let j=0;j<16;j++)
   assert.deepEqual(y.collarProjection.projectedRings[k][j],
    projectSnakeFrontGlassPointV07g(
     y.headNeckCandidate.vertices[(9+k)*16+j]
    ));
 assert.deepEqual(y,buildSnakeSlenderVolumeV07y(src),
  'identical source should always produce identical slender geometry');
 assert.equal(JSON.stringify(src),snapshot,
  'V0.7Y cannot mutate original safe head, rock, skeleton, original volume');
}
assert.ok(firstResult.maxBendRelief>.03,
 'U-shaped 13-joint source must receive bounded, gradual bend relief');
const repeated=buildSnakeSlenderVolumeV07y({
 ...firstSource,previous:firstResult,seconds:1/30
});
assert.equal(repeated.ok,true,repeated.reason);
assert.equal(repeated.halfTimeSamplesChecked,
 firstResult.headSamplesChecked+firstResult.bodySamplesChecked);
const wrongScene=buildSnakeSlenderVolumeV07y({
 ...firstSource,previous:{
  ...firstResult,sceneSignature:'untrusted_previous_scene'
 }
});
assert.equal(wrongScene.ok,false);
assert.equal(wrongScene.reason,'v07y_incompatible_previous_slim_frame');
assert.equal(wrongScene.bodyCandidate,null);
const rockShifted=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'near_snout_restricted_rock',kind:'rock_overhang',
  x:568,y:18,width:48,depth:50,height:150,
  transmissionPermille:0
 }
});
const blocked=buildSnakeSlenderVolumeV07y({
 ...firstSource,scene:rockShifted
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'v07y_inside_rock_footprint');
assert.equal(blocked.bodyCandidate,null);
assert.equal(blocked.certifiedForGameplay,false);
const elevated=buildSnakeSlenderVolumeV07y({
 ...firstSource,terrain:{...terrain,groundZ:.18}
});
assert.equal(elevated.ok,false);
assert.equal(elevated.reason,'v07y_below_ground_heightfield');
for(const options of [
 {seconds:-.1},{seconds:.2},
 {pose:{...pose13,bodyRadius:.08}},
 {pose:{...pose13,segmentLength:.2}},
 {neckFollow:{...firstSource.neckFollow,ok:false}},
 {volume:{...firstSource.volume,sourceJointCount:24}},
])assert.throws(()=>buildSnakeSlenderVolumeV07y({
 ...firstSource,...options
}),RangeError);
const code=readFileSync(new URL(
 '../src/ohm-core/snake-slender-volume-v07y.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildSnakeSlenderVolumeV07y/);
assert.match(html,/qaV07ySlender/);
assert.doesNotMatch(code,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7Y: 13/24-source snake neck/trunk/tail taper, 26% thinner middle body, true head-to-body socket, render-collision candidate same XYZ, rock/ground/half-frame failure gates, no skin');
