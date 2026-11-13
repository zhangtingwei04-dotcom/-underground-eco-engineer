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

const bodyHash=JSON.stringify(canonicalPose);
const freshScene=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_v09t_four_independent_size_sources',
 objects:[]
});
const sceneHash=JSON.stringify({freshScene,terrain});
const initialStates=[],finalStates=[],measurements=[];
for(const stage of [0,1,2,3]){
 const start=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene:freshScene,
  terrain,stageProgress:stage
 });
 assert.equal(start.version,'0.9T');
 assert.equal(start.phase,'moving_sized');
 assert.equal(start.verifiedFrames,0);
 assert.equal(start.currentSizeDynamicsOwnedByV09t,true);
 assert.equal(start.originalV09cDgNeverAdvanced,true);
 assert.equal(start.pose.points.length,24);
 assert.equal(start.pose.boneLengths.length,23);
 assert.equal(start.pose.radiiWorldUnits.length,24);
 assert.equal(start.gameplayMotionAuthorized,false);
 assert.equal(start.skinApplied,false);
 assert.equal(start.originalGameSaveModified,false);
 assert.equal(start.meshSweep3DCertified,false);
 assert.equal(start.groundForceCertified,false);
 initialStates.push(start);
 let state=start,lastProbe=null;
 for(let i=0;i<100;i++){
  const turn=i<15?0:i<51?.007:i<72?-.003:0;
  const probe=inspectSnakeVariableSizeStepV09t({
   state,scene:freshScene,terrain,turnRadians:turn
  });
  assert.equal(probe.ok,true,
   'stage '+stage+' frame '+i+' '+probe.reason+
   ' '+JSON.stringify(probe.frameAudit));
  assert.equal(probe.currentSizeCollisionRadiusApplied,true);
  assert.equal(probe.movementComputedFromActualStageSizedState,true);
  assert.equal(probe.canonicalV09cSourceNotReplayed,true);
  assert.equal(probe.originalFixedSizeControllerNeverCalled,true);
  assert.equal(probe.sourceFramesCommitted,0);
  assert.equal(probe.sweptAudit.interframeCapsuleTemporalSlices,5);
  assert.equal(probe.sweptAudit.interframeGroundSamples,1035);
  assert.equal(probe.frameAudit.terrainSamples,207);
  assert.equal(probe.frameAudit.lengthClear,true);
  assert.equal(probe.frameAudit.sceneClear,true);
  assert.equal(probe.frameAudit.groundClear,true);
  assert.equal(probe.frameAudit.nonlocalClear,true);
  assert.equal(probe.sweptAudit.sceneClear,true);
  assert.equal(probe.sweptAudit.selfClear,true);
  assert.equal(probe.sweptAudit.groundClear,true);
  assert.ok(probe.maximumJointStepWorld<=.018);
  const next=advanceSnakeVariableSizeMotionV09t({
   state,scene:freshScene,terrain,turnRadians:turn
  });
  assert.equal(next.phase,'moving_sized');
  assert.equal(next.verifiedFrames,state.verifiedFrames+1);
  assert.equal(next.actualIndependentSizedSourceStep,true);
  assert.equal(next.actualGameplayMotion,false);
  assert.equal(next.gameSaveModified,false);
  assert.equal(next.skinApplied,false);
  assert.deepEqual(next.pose.boneLengths,state.pose.boneLengths,
   'size-specific bone lengths unchanged every true V0.9T step');
  assert.deepEqual(next.pose.radiiWorldUnits,
   state.pose.radiiWorldUnits);
  assert.notDeepEqual(next.pose.points,state.pose.points);
  lastProbe=probe;state=next;
 }
 assert.equal(state.verifiedFrames,100);
 assert.notDeepEqual(state.pose.points,start.pose.points);
 assert.ok(Math.hypot(
  state.pose.points[23].x-start.pose.points[23].x,
  state.pose.points[23].y-start.pose.points[23].y
 )>.05,'TAIL must physically follow, no stationary/proxy tail');
 assert.equal(state.pose.points.length,24);
 finalStates.push(state);
 measurements.push({stage,sourceFrames:state.verifiedFrames,
  totalLength:state.pose.boneLengths.reduce((a,b)=>a+b,0),
  maxRadius:Math.max(...state.pose.radiiWorldUnits),
  head:state.pose.points[0],
  tail:state.pose.points[23],
  finalMaxLinkError:lastProbe.frameAudit.maxBoneLengthErrorWorld,
  finalMinGroundGap:lastProbe.frameAudit.minGroundGapWorld,
  finalNonlocal3DGap:lastProbe.frameAudit.min3DNonlocalCapsuleGapWorld});
}
assert.equal(JSON.stringify(canonicalPose),bodyHash);
assert.equal(JSON.stringify({freshScene,terrain}),sceneHash);
assert.deepEqual(measurements.map(x=>x.sourceFrames),[100,100,100,100]);
for(let i=1;i<4;i++){
 assert.ok(measurements[i].totalLength>
  measurements[i-1].totalLength);
 assert.ok(measurements[i].maxRadius>
  measurements[i-1].maxRadius);
 assert.notDeepEqual(finalStates[i].pose.points,
  finalStates[i-1].pose.points,
  'independent size states, not same canonical adult poses');
}
// Four sizes may share a head command, but their tail orientation,
// actual 23 bone displacements and collision footprint are different.
assert.ok(measurements[3].tail.x<measurements[0].tail.x-.5);
assert.ok(measurements[3].totalLength>2.9);
assert.ok(measurements[0].totalLength<1.2);

// Turn bound must scale with physical body length: the juvenile may
// try a .02 rad command, but a large adult cannot instantly turn so
// tightly. No relaxation of bone or self-clearance is allowed.
const juvenileTurn=inspectSnakeVariableSizeStepV09t({
 state:initialStates[0],scene:freshScene,terrain,
 turnRadians:.02
});
const largeTurn=inspectSnakeVariableSizeStepV09t({
 state:initialStates[3],scene:freshScene,terrain,
 turnRadians:.02
});
assert.equal(largeTurn.ok,false);
assert.equal(largeTurn.reason,
 'current_body_too_long_for_requested_turn');
assert.equal(juvenileTurn.reason!==
 'current_body_too_long_for_requested_turn',true);
const held=advanceSnakeVariableSizeMotionV09t({
 state:initialStates[3],scene:freshScene,terrain,
 turnRadians:.02
});
assert.equal(held.phase,'resting_safety_hold');
assert.equal(held.status,'current_body_too_long_for_requested_turn');
assert.equal(held.verifiedFrames,0);
assert.equal(held.actualSourceStepsCommittedOnRejectedFrame,0);
assert.deepEqual(held.pose.points,initialStates[3].pose.points);
assert.strictEqual(advanceSnakeVariableSizeMotionV09t({
 state:held,scene:freshScene,terrain
}),held);
const stale=advanceSnakeVariableSizeMotionV09t({
 state:initialStates[1],
 scene:Object.freeze({...freshScene,revision:freshScene.revision+1}),
 terrain
});
assert.equal(stale.phase,'resting_safety_hold');
assert.equal(stale.status,'source_or_scene_changed_requires_replan');
assert.equal(stale.verifiedFrames,0);
assert.deepEqual(stale.pose.points,initialStates[1].pose.points);
const forgedScene=advanceSnakeVariableSizeMotionV09t({
 state:initialStates[1],
 scene:Object.freeze({...freshScene,
  objects:[{id:'injected_rock',x:690,y:180,width:20,depth:20}]}),
 terrain
});
assert.equal(forgedScene.phase,'resting_safety_hold');
assert.equal(forgedScene.status,'source_or_scene_changed_requires_replan');
assert.throws(()=>startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:freshScene,
 terrain,stageProgress:4
}),RangeError);

// A stage-sized animal that fits an initial corridor can STOP later:
// original rock is not moved; original scene and tail do not teleport.
const sideRockScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09t_same_obstacle_juvenile_vs_large',
 objects:[stone('narrow_path_rock',710,177,35,9,190)]
});
const independentObstacleRuns=[];
for(const stage of [0,2,3]){
 let s=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene:sideRockScene,
  terrain,stageProgress:stage
 });
 assert.equal(s.phase,'moving_sized',
  'all stage animals must initially fit in same corridor');
 let moves=0;
 for(let i=0;i<210&&s.phase==='moving_sized';i++){
  const last=s;
  const next=advanceSnakeVariableSizeMotionV09t({
   state:s,scene:sideRockScene,terrain,turnRadians:0
  });
  if(next.phase==='moving_sized'){
   assert.equal(next.verifiedFrames,last.verifiedFrames+1);
   moves++;
  }else{
   assert.equal(next.verifiedFrames,last.verifiedFrames);
   assert.deepEqual(next.pose.points,last.pose.points);
  }
  s=next;
 }
 independentObstacleRuns.push({stage,moves,
  phase:s.phase,status:s.status??null,
  headX:s.pose.points[0].x});
}
assert.equal(independentObstacleRuns[0].phase,'moving_sized',
 'juvenile clears the high-side rock on this route');
assert.equal(independentObstacleRuns[2].phase,'resting_safety_hold',
 'large body hits the same source-owned rock');
assert.ok(independentObstacleRuns[0].moves>
 independentObstacleRuns[2].moves);
assert.equal(JSON.stringify(canonicalPose),bodyHash);
assert.equal(JSON.stringify({freshScene,terrain}),sceneHash);

console.log('PASS V0.9T genuinely independent, size-owned 24-joint leader/follower movement; 4x100 real sized steps and body-specific rock/turn holds '+JSON.stringify({
 fourStageTrajectory:measurements,
 independentOriginalSourceNeverAdvanced:true,
 tailMovementNotJustHeadOnly:true,
 originalBoneLengthsPreserved:true,
 all24StageRadiiGovernCollision:true,
 juvenileVersusLargeTurn:{juvenile:juvenileTurn.ok,
  largeRejected:largeTurn.reason},
 staleRevisionHeld:stale.status,
 maliciousSceneMutationHeld:forgedScene.status,
 obstacleContrast:independentObstacleRuns,
 newGameMotionAuthorized:false,
 exact3DSweptTriangleMeshNotCertified:true
}));
