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


import {solveSnakeSizeTerrainContactV09p,
 inspectSnakeSizeTerrainTransitionV09p,
 previewSnakeSizeTerrainRouteV09p}
 from '../src/ohm-core/snake-size-terrain-contact-v09p.mjs';


import {buildSnakeSharedBodyGeometryV09q,
 inspectSnakeGrowthRendererCompatibilityV09q}
 from '../src/ohm-core/snake-shared-body-geometry-v09q.mjs';


import {buildSnakeHeadNeckCandidateV09r,
 inspectSnakeHeadNeckTransitionV09r}
 from '../src/ohm-core/snake-head-neck-seam-v09r.mjs';

import {sampleSnakeTerrain}
 from '../src/ohm-core/snake-terrain-contact.mjs';

import {inspectSnakeMeshSurfaceV09s,
 inspectSnakeMeshTemporalV09s,
 inspectSnakeAuthenticatedMeshStepV09s}
 from '../src/ohm-core/snake-swept-mesh-contact-v09s.mjs';


import {startSnakeVariableSizeMotionV09t,
 inspectSnakeVariableSizeStepV09t,
 advanceSnakeVariableSizeMotionV09t}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';


import {
 buildSnakeSizedMeshCandidateV09u,
 inspectSnakeSizedMeshStepV09u,
 previewSnakeSizedMeshMotionV09u
} from '../src/ohm-core/snake-sized-mesh-motion-v09u.mjs';

const clearScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09u_true_sized_mesh_shadow_neutral',objects:[]
});
const originalPoseJSON=JSON.stringify(canonicalPose);
const sceneJSON=JSON.stringify(clearScene);
const terrainJSON=JSON.stringify(terrain);

const stages=[],baseStates=[];
for(const stage of [0,1,2,3]){
 const start=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene:clearScene,terrain,
  stageProgress:stage
 });
 assert.equal(start.version,'0.9T');
 assert.equal(start.phase,'moving_sized');
 const first=buildSnakeSizedMeshCandidateV09u({
  sizedState:start,scene:clearScene,terrain,headYawRad:.02
 });
 assert.equal(first.ok,true,
  'size stage '+stage+' frame0 '+first.reason+' '+
   first.surfaceReason+' '+first.headReason);
 assert.equal(first.sourceFrame,0);
 assert.equal(first.meshPositionsFromCurrentSizedState,true);
 assert.strictEqual(first.sizedBodySource,start.pose);
 assert.equal(first.sharedBodyCandidate.posePoints,start.pose.points);
 assert.equal(first.sharedBodyCandidate.radiiWorldUnits,
  start.pose.radiiWorldUnits);
 assert.equal(first.sharedBodyCandidate.boneLengths,
  start.pose.boneLengths);
 assert.equal(first.headNeckSocketWelded,true);
 assert.equal(first.mesh.vertexCount,1617);
 assert.equal(first.mesh.triangleCount,3216);
 assert.equal(first.sourceMeshV09sStatic.ok,true);
 assert.equal(first.sourceMeshV09sStatic.triangleHeightfieldSamples,
  3216*7);
 assert.equal(first.mesh.positions.length,first.mesh.uv.length);
 assert.equal(first.gameplayMotionAuthorized,false);
 assert.equal(first.exactContinuous3DMeshSweepCertified,false);
 assert.equal(first.trueGrowthDuringMotionImplemented,false);
 assert.equal(first.saveModified,false);
 assert.equal(first.skinApplied,false);
 baseStates.push(start);

 const next=advanceSnakeVariableSizeMotionV09t({
  state:start,scene:clearScene,terrain,turnRadians:0
 });
 assert.equal(next.phase,'moving_sized');
 assert.equal(next.verifiedFrames,1);
 const frame=inspectSnakeSizedMeshStepV09u({
  previousState:start,nextState:next,
  scene:clearScene,terrain,
  previousYawRad:.01,nextYawRad:.012
 });
 assert.equal(frame.ok,true,
  'size stage '+stage+' moving mesh first '+frame.reason+
  ' '+frame.temporalReason+' '+frame.toReason);
 assert.equal(frame.sourceReplayMatched,true);
 assert.equal(frame.sourceStageIsIndependent,true);
 assert.equal(frame.originalFixedAdultV09cNotAdvanced,true);
 assert.equal(frame.trueSizedSourceStartFrame,0);
 assert.equal(frame.trueSizedSourceEndFrame,1);
 assert.equal(frame.unchangedSourceBoneLengths,true);
 assert.equal(frame.sharedHeadBodySeamClear,true);
 assert.equal(frame.entireHeadBodyMeshVertexCount,1617);
 assert.equal(frame.entireHeadBodyMeshTriangleCount,3216);
 assert.equal(frame.collisionShellUsesCurrentSizedState,true);
 assert.equal(frame.temporal.ok,true);
 assert.equal(frame.temporal.checkedSweptFaces,3216);
 assert.equal(frame.temporal.surfaceHeightfieldSamples,
  3216*4*3);
 assert.equal(frame.temporal.firstNonlocalTriangleCollision,null);
 assert.equal(frame.temporal.firstSweptSourceSceneRisk,null);
 assert.equal(frame.actualV09tSourceStepCommitted,0);
 assert.equal(frame.gameplayMotionAuthorized,false);
 assert.equal(frame.exactContinuous3DMeshSweepCertified,false);
 assert.equal(frame.saveModified,false);
 assert.equal(frame.skinApplied,false);
 assert.deepEqual(frame.to.sharedBodyCandidate.posePoints,next.pose.points);
 assert.deepEqual(frame.from.sharedBodyCandidate.posePoints,start.pose.points);
 assert.notDeepEqual(frame.to.sharedBodyCandidate.posePoints,
  frame.from.sharedBodyCandidate.posePoints);
 assert.equal(frame.to.mesh.vertexCount,1617);

 const preview=previewSnakeSizedMeshMotionV09u({
  sourceState:start,scene:clearScene,terrain,
  frames:12,turnRadians:stage===3?.003:.005
 });
 assert.equal(preview.version,'0.9U');
 assert.equal(preview.ok,true,
  'stage '+stage+' preview '+JSON.stringify(preview.firstFailure));
 assert.equal(preview.acceptedSizedMeshFrames,12);
 assert.equal(preview.sourceEndFrameShadow,12);
 assert.equal(preview.motionSourceFromV09tInsteadOfFixedAdult,true);
 assert.equal(preview.unchangedCallerSourceState,true);
 assert.equal(preview.gameplayMotionAuthorized,false);
 assert.equal(preview.saveModified,false);
 assert.ok(preview.minimumSampledGroundGapWorld>=-.00001);
 stages.push({stage,totalBodyLengthWorld:
  start.pose.boneLengths.reduce((a,b)=>a+b,0),
  localMaxRadius:Math.max(...start.pose.radiiWorldUnits),
  firstMeshVertexCount:frame.to.mesh.vertexCount,
  testedTrueSourceFrames:preview.acceptedSizedMeshFrames,
  maxMeshVertexStepWorld:preview.maximumMeshVertexStepWorld,
  minimumHeightfieldSurfaceGapWorld:
   preview.minimumSampledGroundGapWorld});
}
for(let i=1;i<stages.length;i++){
 assert.ok(stages[i].totalBodyLengthWorld>
  stages[i-1].totalBodyLengthWorld);
 assert.ok(stages[i].localMaxRadius>
  stages[i-1].localMaxRadius);
}
assert.deepEqual(baseStates.map(s=>s.verifiedFrames),[0,0,0,0]);
assert.equal(JSON.stringify(canonicalPose),originalPoseJSON);
assert.equal(JSON.stringify(clearScene),sceneJSON);
assert.equal(JSON.stringify(terrain),terrainJSON);

// A forged V0.9T next source may have convincing time labels, even
// match a valid fixed-grown baseline, but it is NOT a deterministic
// accepted step from the actual prior sized pose. Hold it.
const previous=baseStates[2];
const next=advanceSnakeVariableSizeMotionV09t({
 state:previous,scene:clearScene,terrain
});
const spoof={...next,pose:previous.pose};
const refused=inspectSnakeSizedMeshStepV09u({
 previousState:previous,nextState:spoof,
 scene:clearScene,terrain
});
assert.equal(refused.ok,false);
assert.equal(refused.reason,'forged_or_mismatched_v09t_source_step');
assert.equal(refused.sourceReplayMatched,false);
assert.equal(refused.actualV09tSourceStepCommitted,0);
assert.deepEqual(previous.pose.points,baseStates[2].pose.points);

const alteredRadius={...next,pose:{
 ...next.pose,radiiWorldUnits:next.pose.radiiWorldUnits.map(
  (x,i)=>i===5?x*.2:x)}};
const radiusForgery=inspectSnakeSizedMeshStepV09u({
 previousState:previous,nextState:alteredRadius,
 scene:clearScene,terrain
});
assert.equal(radiusForgery.ok,false);
assert.equal(radiusForgery.reason,'forged_or_mismatched_v09t_source_step');

const noBigJump=inspectSnakeSizedMeshStepV09u({
 previousState:previous,nextState:next,
 scene:clearScene,terrain,previousYawRad:0,nextYawRad:.16
});
assert.equal(noBigJump.ok,false);
assert.equal(noBigJump.reason,'head_look_frame_jump_too_large');
const changedScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09u_new_scene_different_from_verified',objects:[]
});
const stale=inspectSnakeSizedMeshStepV09u({
 previousState:previous,nextState:next,
 scene:changedScene,terrain
});
assert.equal(stale.ok,false);
assert.equal(stale.sourceReplayMatched,false);
assert.equal(stale.actualV09tSourceStepCommitted,0);

// V0.9T can allow a capsule/body clearance at a rock yet
// V0.9U full head mesh may extend further: the head must still hold.
const noseRockScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09u_head_rock_neutral',
 objects:[stone('front_rock',704,185,24,30,190)]
});
const startNear=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:noseRockScene,
 terrain,stageProgress:2
});
assert.equal(startNear.phase,'moving_sized');
const blockedHead=buildSnakeSizedMeshCandidateV09u({
 sizedState:startNear,scene:noseRockScene,terrain
});
assert.equal(blockedHead.ok,false);
assert.equal(blockedHead.reason,'sized_head_mesh_rejected');
assert.ok(blockedHead.headReason.includes('head_shell_source_rock_'));

console.log('PASS V0.9U genuine four-size V0.9T source -> common 1617 vertex head/body mesh -> V0.9S full triangle QA '+JSON.stringify({
 stages,
 sourceAdultNotReprojectedPerFrame:true,
 V09qBodyRadiiAndV09tBoneLengthsAreIdentical:true,
 V09rIndexedHeadNeckSeam:true,
 V09sFullTriangleSurfaceAndTemporalChecked:true,
 forgedPoseRejected:true,forgedStageRadiusRejected:true,
 abruptHeadJumpRejected:true,staleSceneRejected:true,
 headMeshRockDetectedBeyondSkeleton:true,
 originalSourceUnmodified:true,
 trueAgeGrowthContinuous:false,
 actualGameplaySourceFramesCommitted:0,
 exactContinuousMeshCollisionCertified:false,
 newSkinApplied:false
}));
