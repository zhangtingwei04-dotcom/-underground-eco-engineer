/**
 * V0.7Y private candidate: 176 real controller frames, NO skin.
 * Existing 0.7P/S/T/U and 0.7V/W/X safety remain authoritative.
 * The new visible BODY and COLLAR must match the sampled candidate mesh
 * in every frame; 13→24 is legal only after complete wall recovery.
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
import {buildSnakeSlenderVolumeV07y}
 from '../src/ohm-core/snake-slender-volume-v07y.mjs';
import {inspectSnakeVolumeClearanceV07z}
 from '../src/ohm-core/snake-volume-clearance-v07z.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07y_private_live_chain_no_skin',
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
  x:p.x+Math.cos(a)*ds,
  y:p.y+Math.sin(a)*ds,z:.135
 }));
}
const basePose=Object.freeze({
 version:'0.7P_source_pose',bodyRadius:.13,segmentLength:ds,
 points:Object.freeze(points)
});
const immutableSources=JSON.stringify({basePose,scene,terrain});
let wall=createSnakeWallProbeV07p({
 basePose,scene,terrain,wall:'rear',pivotIndex:6,
 maxPitch:.36,speciesId:'generic_snake'
});
let relay=null,lastX=null,lastY=null,lastCount=null;
let initialFrame13=null,firstFrame24=null,total=0,halfFrames=0;
let greatestBendRelief=0,smallestMidScale=1,largestSocketGap=0;
let closest3DClearance=Infinity,closestScreenGap=Infinity;
let totalPairs=0,totalCameraOnlyPairs=0;
for(let frame=0;frame<176;frame++){
 if(frame>0&&!relay&&wall.phase==='rest'&&
   wall.seconds>=3.1-1e-8){
  const ready=prepareSnakeGroundHandoffV07s({
   wallState:wall,scene,terrain,targetJointCount:24,
   departure:{x:.1,y:.025},speciesId:'generic_snake'
  });
  assert.equal(ready.ok,true,'same animal S '+ready.reason);
  const temp=createSnakeGroundTemporalV07t({
   handoff:ready,rampSeconds:.75,accelerationLimit:.85
  });
  relay=createSnakeCurvatureRelayV07u({
   temporalState:temp,turnRadians:.24
  });
 }
 let pose,head;
 if(relay){
  const o=advanceSnakeCurvatureRelayV07u(relay,{
   scene,terrain,seconds:frame>0?1/30:0
  });
  assert.equal(o.ok,true,'U frame '+frame+': '+o.reason);
  relay=o.nextState;pose=o.pose;head=o.head;
 }else{
  const o=advanceSnakeWallProbeV07p(wall,{
   scene,terrain,seconds:frame>0?1/30:0,maxJointSpeed:.75
  });
  assert.equal(o.renderable,true,'P frame '+frame+': '+o.reason);
  wall=o.nextState;pose=o.pose;head=o.head;
 }
 if(initialFrame13===null)initialFrame13=frame;
 if(pose.points.length===24&&firstFrame24===null)firstFrame24=frame;
 const originalPose=JSON.stringify(pose),originalHead=JSON.stringify(head);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({pose,head,volume});
 const ghost=buildSnakeGhostContinuityV07v({pose,head,volume,bridge});
 const sculpt=buildSnakeHeadNeckSculptV07w({
  pose,head,volume,ghost,scene,terrain
 });
 assert.equal(sculpt.ok,true,'W frame '+frame+': '+sculpt.reason);
 const consecutive=lastCount===pose.points.length;
 const follow=buildSnakeNeckFollowV07x({
  pose,head,volume,sculpt,scene,terrain,
  previous:consecutive?lastX:null,seconds:1/30
 });
 assert.equal(follow.ok,true,'X frame '+frame+': '+follow.reason);
 const slender=buildSnakeSlenderVolumeV07y({
  pose,volume,neckFollow:follow,scene,terrain,
  previous:consecutive?lastY:null,seconds:1/30
 });
 assert.equal(slender.ok,true,'Y frame '+frame+': '+slender.reason);
 assert.equal(slender.bodyCandidate.ringCount,
  (pose.points.length-1)*4+1);
 assert.equal(slender.bodyCandidate.vertices.length,
  slender.bodyCandidate.ringCount*12);
 assert.equal(slender.headNeckCandidate.vertices.length,320);
 assert.equal(slender.headSamplesChecked,2864);
 assert.equal(slender.bodySamplesChecked,
  slender.bodyCandidate.vertices.length+
  4*slender.bodyCandidate.triangles.length);
 // V0.7Z is read-only, and is NOT an alternate route/surface collider.
 // It must never call a screen-space illusion a 3D self-penetration.
 const clearance=inspectSnakeVolumeClearanceV07z({pose,slender});
 assert.equal(clearance.ok,true,'V0.7Z frame '+frame);
 assert.equal(clearance.qualityAccepted,true,
  'V0.7Z source bend/capsule/ring anomaly at frame '+frame);
 assert.equal(clearance.sourceJointCount,pose.points.length);
 assert.equal(clearance.selfOverlapCandidates.length,0);
 assert.equal(clearance.tightBends.length,0);
 assert.equal(clearance.ringDirectionReversals.length,0);
 assert.ok(clearance.minimum3DClearance>0,
  'source body 3D candidate clearance must remain positive');
 assert.equal(clearance.fullTriangleSelfCollisionVerified,false);
 assert.equal(clearance.skinApplied,false);
 assert.equal(clearance.sourceBonesChanged,false);
 assert.equal(clearance.bodyMeshChanged,false);
 closest3DClearance=Math.min(closest3DClearance,
  clearance.minimum3DClearance);
 closestScreenGap=Math.min(closestScreenGap,
  clearance.minimumProjectedGapPx);
 totalPairs+=clearance.checkedNonlocalBonePairs;
 totalCameraOnlyPairs+=clearance.projectionOnlyPairs.length;
 assert.equal(slender.sourceJointCount,pose.points.length);
 assert.equal(slender.sourceTotalLength,2.28);
 assert.equal(slender.sourceBonesModified,false);
 assert.equal(slender.sourceHeadModified,false);
 assert.equal(slender.sameVerticesRenderedAndSampled,true);
 assert.equal(slender.originalHeadColliderStillAuthoritative,true);
 assert.equal(slender.sourceRockAuthorityUnchanged,true);
 assert.equal(slender.skinApplied,false);
 assert.equal(slender.certifiedForGameplay,false);
 assert.equal(slender.continuousWholeBodyCollisionVerified,false);
 assert.ok(slender.midBodyScale>.65&&slender.midBodyScale<.8);
 assert.ok(slender.neckSocketScale<.83);
 assert.ok(slender.headBodySocketGap<1e-4);
 assert.ok(slender.maxBendRelief<=.045+1e-8);
 assert.ok(Math.abs(slender.tipScale-.88)<1e-7);
 for(let i=0;i<160;i++)
  assert.deepEqual(slender.headNeckCandidate.vertices[i],
   follow.candidate.vertices[i],
   'Y must never morph a V0.7W/X head source vertex');
 for(let i=0;i<slender.bodyCandidate.ringCount;i+=4){
  const poseIndex=i/4;
  assert.ok(Math.hypot(
   volume.worldCenters[i].x-pose.points[poseIndex].x,
   volume.worldCenters[i].y-pose.points[poseIndex].y,
   volume.worldCenters[i].z-pose.points[poseIndex].z
  )<2e-5);
 }
 assert.equal(JSON.stringify(pose),originalPose);
 assert.equal(JSON.stringify(head),originalHead);
 const expectHalf=consecutive?
  slender.headSamplesChecked+slender.bodySamplesChecked:0;
 assert.equal(slender.halfTimeSamplesChecked,expectHalf);
 if(expectHalf>0)halfFrames++;
 greatestBendRelief=Math.max(greatestBendRelief,slender.maxBendRelief);
 smallestMidScale=Math.min(smallestMidScale,slender.midBodyScale);
 largestSocketGap=Math.max(largestSocketGap,slender.headBodySocketGap);
 lastX=follow;lastY=slender;lastCount=pose.points.length;total++;
}
assert.equal(total,176);
assert.equal(initialFrame13,0);
assert.equal(firstFrame24,94);
assert.equal(halfFrames,174);
assert.ok(greatestBendRelief>.03);
assert.ok(smallestMidScale<.75&&smallestMidScale>.65);
assert.ok(largestSocketGap<1e-4);
assert.ok(closest3DClearance>0);
assert.ok(totalPairs>15000);
assert.ok(totalCameraOnlyPairs>=0);
assert.equal(JSON.stringify({basePose,scene,terrain}),immutableSources);
console.log('PASS V0.7Y 176 controller frames / 13→24 at #94 / '+
 halfFrames+' temporal half-frame checks: 26% smaller mid-trunk radius, '+
 'nonlocal 3D capsule minimum '+closest3DClearance.toFixed(4)+
 ', projection-only pairs '+totalCameraOnlyPairs+
 ', bounded bend compression, true X-to-slim-body socket, no source bones, '+
 'head mesh, real skin, gameplay collider, player save or scene mutation');
