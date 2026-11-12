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

const sourceHash=JSON.stringify(canonicalPose);
const sceneHash=JSON.stringify({scene,terrain});
const full=[];
for(const stage of [0,1,2,3]){
 const audit=inspectSnakeSizeMotionFrameV09o({
  sourcePose:canonicalPose,scene,terrain,stageProgress:stage
 });
 assert.equal(audit.version,'0.9O');
 assert.equal(audit.sourceLinkCount,23);
 assert.equal(audit.sourceJointCount,24);
 assert.equal(audit.terrainSamples,23*9);
 assert.equal(audit.candidate.points.length,24);
 assert.equal(audit.sizeMotionAuthorityGranted,false);
 assert.equal(audit.motionWasActuallyApplied,false);
 assert.equal(audit.meshSweep3DCertified,false);
 assert.equal(audit.groundSupportCertified,false);
 assert.equal(audit.saveModified,false);
 assert.equal(audit.skinApplied,false);
 assert.equal(audit.canonical3DSourceCapsulesAccepted,true);
 assert.ok(Number.isFinite(audit.minimumTerrainGapWorld));
 full.push({
  stage,ok:audit.ok,reason:audit.reason,
  minGap:audit.minimumTerrainGapWorld,
  maxGap:audit.maximumTerrainGapWorld,
  potentiallyFloating:audit.visiblyFloatingPotential
 });
}
assert.equal(full[0].ok,true);
assert.equal(full[1].ok,true);
assert.equal(full[2].ok,true);
assert.equal(full[3].ok,false);
assert.equal(full[3].reason,'resized_body_below_source_heightfield');
assert.equal(full[0].potentiallyFloating,true,
 'a juvenile using adult source ground height may visually float');

// The unchanged original head/pose at .135 z is NOT appropriate for
// all life stages. Higher stage requires re-grounding, which is explicitly
// NOT authorized by this diagnostic.
const raised=Object.freeze({...canonicalPose,
 points:Object.freeze(canonicalPose.points.map(q=>
  Object.freeze({...q,z:.20})))
});
assert.equal(inspectSnakeSelfClearanceV09d({
 pose:raised
}).candidateClearanceAccepted,true);
const raisedLarge=inspectSnakeSizeMotionFrameV09o({
 sourcePose:raised,scene,terrain,stageProgress:3
});
assert.equal(raisedLarge.ok,true);
assert.ok(raisedLarge.minimumTerrainGapWorld>0);
assert.equal(raisedLarge.groundSupportCertified,false);

// The same source body in proximity to stone changes from fitting to
// blocked as length/girth increase. Do not shrink radius or move rock.
const nearStone=Object.freeze({...canonicalPose,
 points:Object.freeze(canonicalPose.points.map(q=>
  Object.freeze({...q,y:-1.2})))
});
const youngNear=inspectSnakeSizeMotionFrameV09o({
 sourcePose:nearStone,scene,terrain,stageProgress:0
});
const adultNear=inspectSnakeSizeMotionFrameV09o({
 sourcePose:nearStone,scene,terrain,stageProgress:2
});
assert.equal(youngNear.ok,true);
assert.equal(adultNear.ok,false);
assert.equal(adultNear.reason,'growth_touches_source_scene_object');
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),sceneHash);

// Use the real unchanged V0.7P->V0.9C moving-return 24-joint source.
const realScene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09o_growth_true_source',
 objects:[stone('left_stone',42,32,134,76,230),
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)]
});
const points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*.19,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,last=points.at(-1);
 points.push(Object.freeze({x:last.x+.19*Math.cos(a),
  y:last.y+.19*Math.sin(a),z:.135}));
}
const original=Object.freeze({
 version:'0.7P_source_pose',points:Object.freeze(points),
 segmentLength:.19,bodyRadius:.13
});
let wall=createSnakeWallProbeV07p({
 scene:realScene,terrain,basePose:original,
 pivotIndex:6,maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const advanced=advanceSnakeWallProbeV07p(wall,{
  scene:realScene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(advanced.renderable,true);
 wall=advanced.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
let moving=startSnakeRouteFollowerV09c({
 actorId:'v09o_neutral',
 scene:realScene,terrain,wallState:wall,
 ecologySnapshot:{revision:realScene.revision,sites:[{
  id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}
 }]},
 needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},
 autoReturn:true
});
for(let i=0;i<440&&moving.phase==='moving_outbound';i++)
 moving=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:moving,scene:realScene,terrain
 });
assert.equal(moving.phase,'moving_return');
assert.equal(moving.verifiedFrames,160);
const movingHash=JSON.stringify(moving);
const plan=planSnakeHeadingReturnV09l({
 source:moving,scene:realScene,terrain,horizonFrames:90
});
assert.equal(plan.ok,true);
const begin=Object.freeze({...moving,route:plan.selectedRoute,
 returnTurnCommitted:false});
const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
 state:begin,scene:realScene,terrain
});
assert.equal(next.phase,'moving_return');
assert.equal(next.verifiedFrames,begin.verifiedFrames+1);
const tested=inspectSnakeSizeMotionTransitionV09o({
 previousSource:begin,nextSource:next,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(tested.version,'0.9O');
assert.equal(tested.sourceReplayMatched,true);
assert.equal(tested.sourceEndFrame,161);
assert.equal(tested.sizeMotionAuthorityGranted,false);
assert.equal(tested.meshSweep3DCertified,false);
if(tested.ok){
 assert.equal(tested.interframeChecked,true);
 assert.equal(tested.fromAudit.ok,true);
 assert.equal(tested.toAudit.ok,true);
 assert.equal(tested.sweptGroundHeightfieldSamplesClear,true);
 assert.equal(tested.sweptSourceScene2DAabbClear,true);
 assert.ok(tested.sweptSamples>=23*5*9);
}
// A forged one-frame claim must NOT pass by simply incrementing the
// counter while leaving the pose untouched.
const forged=Object.freeze({...next,
 pose:begin.pose,relayState:begin.relayState
});
const forgedCheck=inspectSnakeSizeMotionTransitionV09o({
 previousSource:begin,nextSource:forged,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(forgedCheck.ok,false);
assert.equal(forgedCheck.reason,'next_frame_does_not_match_true_source');
assert.equal(forgedCheck.sourceReplayMatched,false);
assert.equal(forgedCheck.interframeChecked,false);
assert.throws(()=>inspectSnakeSizeMotionTransitionV09o({
 previousSource:begin,nextSource:next,
 scene:Object.freeze({...realScene,revision:realScene.revision+1}),
 terrain,stageProgress:0
}),RangeError);

const previews=[];
for(const stage of [0,1,2,3]){
 const snapshot=previewSnakeSizeAwareRouteV09o({
  source:moving,scene:realScene,terrain,
  stageProgress:stage,horizonFrames:90
 });
 assert.equal(snapshot.version,'0.9O');
 assert.equal(snapshot.sourceStartFrame,160);
 assert.ok(snapshot.checkedSourceFrames>=0&&
  snapshot.checkedSourceFrames<=90);
 assert.equal(snapshot.sourceFramesCommitted,0);
 assert.equal(snapshot.currentGameSourcePoseChanged,false);
 assert.equal(snapshot.trueSizeAwareMovementImplemented,false);
 assert.equal(snapshot.fullBodyReturnVerified,false);
 assert.equal(snapshot.groundSupportCertified,false);
 assert.equal(snapshot.skinApplied,false);
 assert.equal(snapshot.saveModified,false);
 if(snapshot.ok)assert.equal(snapshot.checkedSourceFrames,90);
 else assert.ok(snapshot.reason);
 previews.push({stage,ok:snapshot.ok,
  checked:snapshot.checkedSourceFrames,reason:snapshot.reason,
  firstFailure:snapshot.firstFailure});
}
assert.equal(JSON.stringify(moving),movingHash);
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),sceneHash);
console.log('PASS V0.9O source-authenticated size-specific terrain, rock/glass and interframe sweep preflight '+JSON.stringify({
 staticByStage:full,
 largeStageRaisedPoseClear:raisedLarge.ok,
 nearRockJuvenile:youngNear.ok,
 nearRockAdult:adultNear.ok,
 oneTrueSourceFrameAccepted:tested.ok,
 oneTrueSourceFrameReason:tested.reason,
 forgedSourceRejected:!forgedCheck.ok,
 previews,
 sourceActorUntouched:true,
 gameplayResizeAuthorized:false
}));
