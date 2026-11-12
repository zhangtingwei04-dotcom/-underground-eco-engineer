/**
 * OHM V0.7X real 176-frame controller-chain regression.
 * 13-joint wall rise -> completed rest -> same 2.28-length 24 joints
 * -> slowed head-led departure -> authored shallow V0.7U bend.
 * Candidate geometry is never elevated to player collision authority.
 */
import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {prepareSnakeGroundHandoffV07s}
 from '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs';
import {createSnakeGroundTemporalV07t}
 from '../src/ohm-core/snake-ground-temporal-v07t.mjs';
import {createSnakeCurvatureRelayV07u,advanceSnakeCurvatureRelayV07u}
 from '../src/ohm-core/snake-curvature-relay-v07u.mjs';
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

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07x_live_chain_private_176_frames',
 objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,width:134,
   depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,width:108,
   depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,width:105,
   depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,q=points.at(-1);
 points.push(Object.freeze({
  x:q.x+Math.cos(a)*ds,y:q.y+Math.sin(a)*ds,z:.135
 }));
}
const basePose=Object.freeze({
 version:'0.7P_source_pose',bodyRadius:.13,segmentLength:ds,
 points:Object.freeze(points)
});
let wall=createSnakeWallProbeV07p({
 basePose,scene,terrain,wall:'rear',pivotIndex:6,maxPitch:.36,
 speciesId:'generic_snake'
});
let relay=null,previous=null,previousBoneCount=0,first24=null;
let passes=0,first13=null,maxShift=0,maxAngle=0,halfFrames=0;
const sceneBefore=JSON.stringify({scene,terrain,basePose});

for(let frame=0;frame<176;frame++){
 // A new 24-joint animal is forbidden until the original 13-joint
 // wall probe has finished lowering and become fully rested.
 if(frame>0&&!relay&&wall.phase==='rest'&&
    wall.seconds>=3.1-1e-8){
  const ready=prepareSnakeGroundHandoffV07s({
   wallState:wall,scene,terrain,targetJointCount:24,
   departure:{x:.1,y:.025},speciesId:'generic_snake'
  });
  assert.equal(ready.ok,true,'same-animal handoff: '+ready.reason);
  const temporal=createSnakeGroundTemporalV07t({
   handoff:ready,rampSeconds:.75,accelerationLimit:.85
  });
  relay=createSnakeCurvatureRelayV07u({
   temporalState:temporal,turnRadians:.24
  });
 }
 let pose,head;
 if(relay){
  const step=advanceSnakeCurvatureRelayV07u(relay,{
   scene,terrain,seconds:frame>0?1/30:0
  });
  assert.equal(step.ok,true,
   'V0.7U controller rejected frame '+frame+': '+step.reason);
  relay=step.nextState;pose=step.pose;head=step.head;
 }else{
  const step=advanceSnakeWallProbeV07p(wall,{
   scene,terrain,seconds:frame>0?1/30:0,maxJointSpeed:.75
  });
  assert.equal(step.renderable,true,
   'V0.7P source rejected frame '+frame+': '+step.reason);
  wall=step.nextState;pose=step.pose;head=step.head;
 }
 assert.ok([13,24].includes(pose.points.length));
 assert.ok(Math.abs(pose.segmentLength*(pose.points.length-1)-2.28)<1e-9);
 for(let i=1;i<pose.points.length;i++)
  assert.ok(Math.abs(Math.hypot(
   pose.points[i].x-pose.points[i-1].x,
   pose.points[i].y-pose.points[i-1].y,
   pose.points[i].z-pose.points[i-1].z
  )-pose.segmentLength)<1e-5,'original bone '+i+' stretched');
 const sourceHeadBefore=JSON.stringify(head);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({pose,head,volume});
 const ghost=buildSnakeGhostContinuityV07v({
  pose,head,volume,bridge
 });
 const sculpt=buildSnakeHeadNeckSculptV07w({
  pose,head,volume,ghost,scene,terrain
 });
 assert.equal(sculpt.ok,true,
  'V0.7W source candidate denied '+frame+': '+sculpt.reason);
 const x=buildSnakeNeckFollowV07x({
  pose,head,volume,sculpt,scene,terrain,
  previous:previousBoneCount===pose.points.length?previous:null,
  seconds:1/30
 });
 assert.equal(x.ok,true,'V0.7X candidate denied '+frame+': '+x.reason);
 assert.equal(x.candidateSamplesChecked,2864);
 assert.equal(x.candidate.vertices.length,320);
 assert.equal(x.candidate.triangles.length,636);
 assert.equal(x.sourceBoneModified,false);
 assert.equal(x.sourceHeadModified,false);
 assert.equal(x.originalSocketPreserved,true);
 assert.equal(x.displayCandidateMeshIdentical,true);
 assert.equal(x.modelCertifiedForPlayers,false);
 assert.equal(x.continuousSweptCollisionVerified,false);
 assert.equal(x.originalColliderStillAuthoritative,true);
 assert.equal(x.skinApplied,false);
 assert.equal(x.playableCaveAuthorized,false);
 assert.ok(x.maximumRingShift<=.055+1e-8);
 assert.ok(x.sourceNeckAngle<=.65+1e-8);
 for(let i=0;i<160;i++)
  assert.deepEqual(x.candidate.vertices[i],
   sculpt.candidate.vertices[i],
   'authoritative original head candidate must remain untouched');
 for(let i=304;i<320;i++)
  assert.deepEqual(x.candidate.vertices[i],
   sculpt.candidate.vertices[i],
   'same original body socket must survive smoothing');
 assert.equal(JSON.stringify(head),sourceHeadBefore,
  'candidate cannot mutate original head collision source');
 if(x.halfFrameSamplesChecked===2864)halfFrames++;
 else assert.equal(x.halfFrameSamplesChecked,0);
 previous=x;previousBoneCount=pose.points.length;
 maxShift=Math.max(maxShift,x.maximumRingShift);
 maxAngle=Math.max(maxAngle,x.sourceNeckAngle);
 if(first13===null&&pose.points.length===13)first13=frame;
 if(first24===null&&pose.points.length===24)first24=frame;
 passes++;
}
assert.equal(passes,176);
assert.equal(first13,0);
assert.ok(first24>=90&&first24<=97,
 'same animal 13->24 only after completed wall recovery');
assert.ok(halfFrames>=170&&halfFrames<=175);
assert.ok(maxShift>.020&&maxShift<.055);
assert.ok(maxAngle>.38&&maxAngle<.65);
assert.equal(JSON.stringify({scene,terrain,basePose}),sceneBefore,
 'laboratory scene and original 13-joint animal cannot be mutated');
console.log('PASS V0.7X live 176 frames: original wall+handoff+temporal+relay, '+
 '13→24 after rest at frame '+first24+', 2864 current triangle+edge checks '+
 'per frame, '+halfFrames+' extra half-frame candidates, max turn '+
 maxAngle.toFixed(5)+', max ring shift '+maxShift.toFixed(5)+
 ', 0 new skin and 0 released collision permissions');
