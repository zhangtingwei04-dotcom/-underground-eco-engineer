import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeGrowthMotionBridge,
 sampleSnakeGrowthMotionFrame}
 from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {inspectSnakeSelfClearanceV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from '../src/ohm-core/snake-turn-space-v09g.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {SNAKE_SYNTHETIC_GROWTH_STAGES_V09N,
 projectSnakeGrowthCandidateV09n,
 inspectSnakeGrowthEnvelopeV09n,
 inspectSnakeGrowthTransitionV09n,
 inspectSnakeSyntheticHideFitV09n}
 from '../src/ohm-core/snake-growth-envelope-v09n.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const stone=(id,x,y,width,depth,height)=>F({
 id,kind:'rock_overhang',x,y,width,depth,height,
 transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_growth_v09n_synthetic_terrarium',
 objects:[
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)
 ]
});
// Fixed-length canonical V0.9D source. Growth output MUST NEVER be
// submitted back to this fixed-size source locomotion controller.
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
assert.equal(inspectSnakeSelfClearanceV09d({
 pose:canonicalPose
}).candidateClearanceAccepted,true);

import {inspectSnakeSizeMotionFrameV09o,
 inspectSnakeSizeMotionTransitionV09o,
 previewSnakeSizeAwareRouteV09o}
 from '../src/ohm-core/snake-size-motion-preflight-v09o.mjs';
import {planSnakeHeadingReturnV09l}
 from '../src/ohm-core/snake-heading-turn-v09l.mjs';

import {inspectSnakeSizeMotionFrameV09o}
 from '../src/ohm-core/snake-size-motion-preflight-v09o.mjs';
import {planSnakeHeadingReturnV09l}
 from '../src/ohm-core/snake-heading-turn-v09l.mjs';

import {solveSnakeSizeTerrainContactV09p,
 inspectSnakeSizeTerrainTransitionV09p,
 previewSnakeSizeTerrainRouteV09p}
 from '../src/ohm-core/snake-size-terrain-contact-v09p.mjs';

const canonicalHash=JSON.stringify(canonicalPose);
const worldHash=JSON.stringify({scene,terrain});
const stageResults=[];
for(const stage of [0,1,2,3]){
 const result=solveSnakeSizeTerrainContactV09p({
  sourcePose:canonicalPose,scene,terrain,stageProgress:stage
 });
 assert.equal(result.version,'0.9P');
 assert.equal(result.ok,true,'flat-floor size solver '+stage+
  ' reason='+result.reason);
 assert.equal(result.sourceJointCount,24);
 assert.equal(result.sourceLinkCount,23);
 assert.equal(result.originalSourceUnmodified,true);
 assert.equal(result.candidateOnly,true);
 assert.equal(result.originalSizeMotionControllerStillFixed,true);
 assert.equal(result.gameIntegrationAuthorized,false);
 assert.equal(result.genuine3DSweptMeshCertified,false);
 assert.equal(result.biomechanicalGroundSupportCertified,false);
 assert.equal(result.saveModified,false);
 assert.equal(result.skinApplied,false);
 assert.equal(result.candidate.points.length,24);
 assert.equal(result.candidate.boneLengths.length,23);
 assert.equal(result.candidate.radiiWorldUnits.length,24);
 assert.equal(result.diagnostics.sourceSceneClear,true);
 assert.equal(result.diagnostics.groundClear,true);
 assert.equal(result.diagnostics.selfClear,true);
 assert.equal(result.diagnostics.lengthClear,true);
 assert.ok(result.diagnostics.maximumLinkLengthErrorWorld<1e-8);
 assert.ok(result.diagnostics.minimumGroundGapWorld>=-.00001);
 assert.ok(result.diagnostics.minimumGroundGapWorld<.012,
  'must not leave juvenile hovering at adult-height offset');
 assert.ok(result.diagnostics.maximumGroundGapWorld<.016);
 assert.ok(Math.abs(result.candidate.points[0].x-
  canonicalPose.points[0].x)<1e-12);
 assert.ok(Math.abs(result.candidate.points[0].y-
  canonicalPose.points[0].y)<1e-12);
 assert.equal(result.candidate.jointCount,24);
 stageResults.push({stage,length:result.sourceLengthWorld,
  minGroundGap:result.diagnostics.minimumGroundGapWorld,
  maxGroundGap:result.diagnostics.maximumGroundGapWorld,
  maxLengthError:result.diagnostics.maximumLinkLengthErrorWorld,
  passes:result.passes});
}
assert.equal(JSON.stringify(canonicalPose),canonicalHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);
assert.ok(stageResults[3].length>stageResults[0].length);

// The previous V0.9O detected adult-relative height as juvenile hover
// and an enlarged large adult below ground. The V0.9P candidate fixes
// BOTH with stage-specific radius but does NOT promote game motion.
const originalJuvenile=inspectSnakeSizeMotionFrameV09o({
 sourcePose:canonicalPose,scene,terrain,stageProgress:0
});
const originalLarge=inspectSnakeSizeMotionFrameV09o({
 sourcePose:canonicalPose,scene,terrain,stageProgress:3
});
assert.equal(originalJuvenile.visiblyFloatingPotential,true);
assert.equal(originalLarge.ok,false);
const newJuvenile=solveSnakeSizeTerrainContactV09p({
 sourcePose:canonicalPose,scene,terrain,stageProgress:0
});
const newLarge=solveSnakeSizeTerrainContactV09p({
 sourcePose:canonicalPose,scene,terrain,stageProgress:3
});
assert.equal(newJuvenile.ok,true);
assert.equal(newLarge.ok,true);
assert.ok(newJuvenile.diagnostics.maximumGroundGapWorld<
 originalJuvenile.maximumTerrainGapWorld);
assert.ok(newLarge.diagnostics.minimumGroundGapWorld>0);

// The old scene authority still controls ALL rock volumes and glass.
// If the original location doesn't allow an adult, resizing/grounding
// must not "fix" it by moving the rock or cheating collision radius.
const nearStone=Object.freeze({...canonicalPose,
 points:Object.freeze(canonicalPose.points.map(q=>
  Object.freeze({...q,y:-1.2})))
});
const nearYoung=solveSnakeSizeTerrainContactV09p({
 sourcePose:nearStone,scene,terrain,stageProgress:0
});
const nearAdult=solveSnakeSizeTerrainContactV09p({
 sourcePose:nearStone,scene,terrain,stageProgress:2
});
assert.equal(nearYoung.ok,true);
assert.equal(nearAdult.ok,false);
assert.equal(nearAdult.diagnostics.sourceSceneClear,false);
assert.ok(nearAdult.reason.startsWith('source_object_'));
assert.equal(JSON.stringify(canonicalPose),canonicalHash);

// A gentle original-source heightfield should be evaluated on the
// updated XY centerline. The solver must maintain ALL 23 3D link lengths.
// An extreme slope may legally HOLD (never stretch the chain).
const clearScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09p_heightfield_neutral',
 objects:[]
});
const mildTerrain={groundZ:0,rock:{
 x:.80,y:0,radius:.52,height:.025
},perch:null};
const hill=solveSnakeSizeTerrainContactV09p({
 sourcePose:canonicalPose,scene:clearScene,
 terrain:mildTerrain,stageProgress:1
});
assert.equal(hill.ok,true,'gentle hill reason='+hill.reason);
assert.ok(hill.diagnostics.maximumLinkLengthErrorWorld<1e-8);
assert.ok(hill.diagnostics.minimumGroundGapWorld>=-.00001);
assert.ok(hill.maximumXYDriftWorld<.045);
const extremeTerrain={groundZ:0,rock:{
 x:.80,y:0,radius:.06,height:.65
},perch:null};
const impossible=solveSnakeSizeTerrainContactV09p({
 sourcePose:canonicalPose,scene:clearScene,
 terrain:extremeTerrain,stageProgress:0
});
assert.equal(impossible.ok,false);
assert.ok(impossible.reason);
assert.equal(impossible.gameIntegrationAuthorized,false);
assert.equal(impossible.originalSourceUnmodified,true);

// TRUE 24-joint original V0.9C/D/G return fixture.
const realScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09p_source_true_return',objects:[
  stone('left_stone',42,32,134,76,230),
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)
 ]
});
const pathPoints=[];
for(let i=0;i<=6;i++)pathPoints.push(Object.freeze({
 x:.65,y:-1.32+i*.19,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const angle=degree*Math.PI/180,p=pathPoints.at(-1);
 pathPoints.push(Object.freeze({
  x:p.x+.19*Math.cos(angle),
  y:p.y+.19*Math.sin(angle),z:.135
 }));
}
const sourceBase=Object.freeze({
 version:'0.7P_source_pose',
 points:Object.freeze(pathPoints),
 segmentLength:.19,bodyRadius:.13
});
let wall=createSnakeWallProbeV07p({
 scene:realScene,terrain,basePose:sourceBase,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const next=advanceSnakeWallProbeV07p(wall,{
  scene:realScene,terrain,
  seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(next.renderable,true);wall=next.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
let moving=startSnakeRouteFollowerV09c({
 actorId:'v09p_real_neutral',scene:realScene,
 terrain,wallState:wall,
 ecologySnapshot:{revision:realScene.revision,sites:[{
  id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}
 }]},
 needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},
 autoReturn:true
});
for(let i=0;i<440&&moving.phase==='moving_outbound';i++){
 moving=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:moving,scene:realScene,terrain
 });
}
assert.equal(moving.phase,'moving_return');
assert.equal(moving.verifiedFrames,160);
const originalSourceHash=JSON.stringify(moving);
const routePlan=planSnakeHeadingReturnV09l({
 source:moving,scene:realScene,terrain,horizonFrames:60
});
assert.equal(routePlan.ok,true);
const before=Object.freeze({...moving,
 route:routePlan.selectedRoute,returnTurnCommitted:false});
const after=advanceSnakeRouteWithTurnSpaceGuardV09g({
 state:before,scene:realScene,terrain
});
assert.equal(after.phase,'moving_return');
assert.equal(after.verifiedFrames,161);
const firstStep=inspectSnakeSizeTerrainTransitionV09p({
 previousSource:before,nextSource:after,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(firstStep.version,'0.9P');
assert.equal(firstStep.checkedSourceStep,true);
assert.equal(firstStep.ok,true,
 'first source step at juvenile size '+firstStep.reason);
assert.ok(firstStep.maxCandidateJointStepWorld<.06);
assert.equal(firstStep.interframeSceneXYClear,true);
assert.equal(firstStep.interframeHeightfieldClear,true);
assert.equal(firstStep.sourceFramesCommitted,0);
assert.equal(firstStep.gameIntegrationAuthorized,false);
assert.equal(firstStep.saveModified,false);
const fake=Object.freeze({...after,
 pose:before.pose,relayState:before.relayState
});
const refused=inspectSnakeSizeTerrainTransitionV09p({
 previousSource:before,nextSource:fake,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(refused.ok,false);
assert.equal(refused.reason,
 'forged_or_rejected_real_source_step');
assert.equal(refused.checkedSourceStep,false);

const stagePreviews=[];
for(const stage of [0,1,2,3]){
 const trace=previewSnakeSizeTerrainRouteV09p({
  source:moving,scene:realScene,
  terrain,stageProgress:stage,horizonFrames:60
 });
 assert.equal(trace.version,'0.9P');
 assert.ok(trace.testedSizeFrames>=0&&
  trace.testedSizeFrames<=60);
 assert.equal(trace.sourceFramesCommitted,0);
 assert.equal(trace.originalSourceUnmodified,true);
 assert.equal(trace.originalSizeMotionControllerStillFixed,true);
 assert.equal(trace.meshSweep3DCertified,false);
 assert.equal(trace.groundSupportCertified,false);
 assert.equal(trace.fullBodyReturnVerified,false);
 assert.equal(trace.skinApplied,false);
 assert.equal(trace.saveModified,false);
 if(trace.ok){
  assert.equal(trace.testedSizeFrames,60);
  assert.ok(trace.minimumInterframeGapWorld>=-.00001);
 }else assert.ok(trace.reason);
 stagePreviews.push({stage,ok:trace.ok,
  frames:trace.testedSizeFrames,
  reason:trace.reason});
}
assert.equal(JSON.stringify(moving),originalSourceHash);
assert.equal(JSON.stringify(canonicalPose),canonicalHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);

console.log('PASS V0.9P stage-specific radius ground contact and fixed-length 24-joint shadow movement '+JSON.stringify({
 flatByStage:stageResults,
 legacyJuvenileFloatingRisk:originalJuvenile.visiblyFloatingPotential,
 legacyLargeBelowGround:!originalLarge.ok,
 adultStoneStillBlocked:!nearAdult.ok,
 gentleHeightfieldSolved:hill.ok,
 extremeHeightfieldFailsClosed:!impossible.ok,
 realSourceFrame:160,
 genuineOneStepPreflight:firstStep.ok,
 forgedStepRefused:!refused.ok,
 genuineSourceRoutePreviews:stagePreviews,
 originalSourceStillUntouched:true,
 gameMotionNotAuthorized:true
}));
