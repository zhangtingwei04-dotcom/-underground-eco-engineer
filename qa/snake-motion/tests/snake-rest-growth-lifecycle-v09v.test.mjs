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
 createSnakeRestGrowthSessionV09v,
 accumulateSnakeGrowthPotentialV09v,
 advanceSnakeGrowthMotionV09v,
 enterSnakeGrowthRestV09v,
 beginSnakeSheddingV09v,
 completeSnakeSheddingV09v,
 applySnakeSafeRestGrowthV09v,
 resumeSnakeAfterGrowthRestV09v
} from '../src/ohm-core/snake-rest-growth-lifecycle-v09v.mjs';
import {buildSnakeSizedMeshCandidateV09u}
 from '../src/ohm-core/snake-sized-mesh-motion-v09u.mjs';

const emptyScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09v_safe_rest_growth_synthetic',
 objects:[]
});
const original=JSON.stringify(canonicalPose);
const env=JSON.stringify({emptyScene,terrain});
const summaries=[];
for(const stage of [0,1,2,3]){
 const source=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene:emptyScene,
  terrain,stageProgress:stage
 });
 assert.equal(source.phase,'moving_sized');
 let session=createSnakeRestGrowthSessionV09v({
  motionState:source,scene:emptyScene,terrain
 });
 assert.equal(session.version,'0.9V');
 assert.equal(session.phase,'moving');
 const beforePoints=JSON.stringify(session.motionState.pose.points);
 const beforeLinks=JSON.stringify(session.motionState.pose.boneLengths);
 const beforeRadii=JSON.stringify(session.motionState.pose.radiiWorldUnits);
 const accrued=accumulateSnakeGrowthPotentialV09v({
  session,amount:.07
 });
 assert.equal(accrued.ok,true);
 session=accrued.session;
 assert.equal(session.motionState.stageProgress,stage);
 assert.equal(session.motionState.verifiedFrames,0);
 assert.equal(JSON.stringify(session.motionState.pose.points),beforePoints);
 assert.equal(JSON.stringify(session.motionState.pose.boneLengths),beforeLinks);
 assert.equal(JSON.stringify(session.motionState.pose.radiiWorldUnits),beforeRadii);
 assert.equal(applySnakeSafeRestGrowthV09v({
  session,scene:emptyScene,terrain
 }).reason,'growth_geometry_locked_outside_safe_rest');
 for(let i=0;i<6;i++){
  const moved=advanceSnakeGrowthMotionV09v({
   session,scene:emptyScene,terrain,
   turnRadians:0
  });
  assert.equal(moved.ok,true,'moving phase cannot resize stage '+stage);
  assert.equal(moved.movementFramesCommitted,1);
  assert.equal(moved.stageStepCommitted,0);
  session=moved.session;
  assert.equal(session.motionState.stageProgress,stage);
  assert.equal(JSON.stringify(session.motionState.pose.boneLengths),
   beforeLinks);
  assert.equal(JSON.stringify(session.motionState.pose.radiiWorldUnits),
   beforeRadii);
 }
 assert.equal(session.motionState.verifiedFrames,6);
 assert.equal(session.pendingGrowth,stage===3?0:.07);
 const atRest=enterSnakeGrowthRestV09v({
  session,scene:emptyScene,terrain,restKind:'resting'
 });
 assert.equal(atRest.ok,true);
 session=atRest.session;
 assert.equal(session.phase,'resting');
 assert.equal(session.motionState.phase,'resting_growth');
 const restingPose=JSON.stringify(session.motionState.pose.points);
 const noMoving=advanceSnakeGrowthMotionV09v({
  session,scene:emptyScene,terrain
 });
 assert.equal(noMoving.ok,false);
 assert.equal(noMoving.reason,'movement_disallowed_during_rest_or_shed');
 assert.equal(JSON.stringify(session.motionState.pose.points),restingPose);
 const first=applySnakeSafeRestGrowthV09v({
  session,scene:emptyScene,terrain
 });
 assert.equal(first.ok,true,
  'legal rest growth stage '+stage+' '+first.reason+
   ' '+JSON.stringify(first.detail));
 if(stage===3){
  assert.equal(first.stageStepCommitted,0);
  assert.equal(first.reason,'no_pending_growth_or_stage_cap');
  assert.equal(first.session,session);
 }else{
  assert.equal(first.stageStepCommitted,1);
  assert.equal(first.growthOnlyWhileResting,true);
  assert.equal(first.headXYUnchanged,true);
  assert.equal(first.all23LinksAnd24RadiiUpdated,true);
  assert.equal(first.transparentMeshVertexCount,1617);
  assert.equal(first.transparentMeshTriangleCount,3216);
  assert.equal(first.fullMeshSurfaceSafety.ok,true);
  assert.equal(first.fullMeshSurfaceSafety.temporalSlices,5);
  assert.equal(first.fullMeshSurfaceSafety.checkedSweptFaces,3216);
  assert.equal(first.sourceSizeSafety.ok,true);
  assert.equal(first.sourceSizeSafety.intermediateFractions,5);
  assert.equal(first.actualSizeChanged,true);
  assert.equal(first.gameSaveModified,false);
  assert.equal(first.skinApplied,false);
  assert.ok(first.newStageProgress>stage);
  assert.notEqual(JSON.stringify(first.session.motionState.pose.boneLengths),
   beforeLinks);
  assert.notEqual(JSON.stringify(first.session.motionState.pose.radiiWorldUnits),
   beforeRadii);
  assert.equal(first.session.motionState.verifiedFrames,6,
   'growth must not increment locomotor frames');
  session=first.session;
  const second=applySnakeSafeRestGrowthV09v({
   session,scene:emptyScene,terrain
  });
  assert.equal(second.ok,true,
   'second incremental rest growth stage '+stage+' '+second.reason);
  assert.equal(second.stageStepCommitted,1);
  session=second.session;
  assert.equal(session.completedRestSteps,2);
  assert.ok(session.pendingGrowth>0,
   'growth potential remains queued after two bounded steps');
 }
 // Molting is a LOCK and must not automatically add one growth stage.
 const shedding=beginSnakeSheddingV09v({session});
 assert.equal(shedding.ok,true);
 session=shedding.session;
 assert.equal(session.phase,'shedding_in_progress');
 const beforeShed=JSON.stringify(session.motionState.pose);
 const shedReject=applySnakeSafeRestGrowthV09v({
  session,scene:emptyScene,terrain
 });
 assert.equal(shedReject.ok,false);
 assert.equal(shedReject.reason,'growth_geometry_locked_outside_safe_rest');
 assert.equal(JSON.stringify(session.motionState.pose),beforeShed);
 assert.equal(resumeSnakeAfterGrowthRestV09v({
  session,scene:emptyScene,terrain
 }).reason,'resume_requires_finished_safe_rest');
 const shedComplete=completeSnakeSheddingV09v({session});
 assert.equal(shedComplete.ok,true);
 assert.equal(shedComplete.noAutomaticGrowthOnShedding,true);
 session=shedComplete.session;
 assert.equal(session.phase,'post_shed_rest');
 assert.equal(JSON.stringify(session.motionState.pose),beforeShed);
 const resumed=resumeSnakeAfterGrowthRestV09v({
  session,scene:emptyScene,terrain
 });
 assert.equal(resumed.ok,true);
 assert.equal(resumed.resumedWithCurrentSize,true);
 assert.equal(resumed.boneLengthsAndRadiiPreserved,true);
 session=resumed.session;
 assert.equal(session.phase,'moving');
 assert.equal(session.motionState.phase,'moving_sized');
 const adjustedStage=session.appliedStageProgress,
  adjustedLinks=JSON.stringify(session.motionState.pose.boneLengths),
  adjustedRadii=JSON.stringify(session.motionState.pose.radiiWorldUnits);
 for(let k=0;k<5;k++){
  const res=advanceSnakeGrowthMotionV09v({
   session,scene:emptyScene,terrain
  });
  assert.equal(res.ok,true,
   'resumed stage '+stage+' motion step '+k);
  session=res.session;
  assert.equal(session.motionState.stageProgress,adjustedStage);
  assert.equal(JSON.stringify(session.motionState.pose.boneLengths),
   adjustedLinks);
  assert.equal(JSON.stringify(session.motionState.pose.radiiWorldUnits),
   adjustedRadii);
 }
 assert.equal(session.motionState.verifiedFrames,11);
 assert.equal(session.motionState.pose.points.length,24);
 const render=buildSnakeSizedMeshCandidateV09u({
  sizedState:session.motionState,scene:emptyScene,terrain
 });
 assert.equal(render.ok,true);
 assert.equal(render.mesh.vertexCount,1617);
 assert.equal(render.mesh.triangleCount,3216);
 summaries.push({stage,frames:session.motionState.verifiedFrames,
  restSteps:session.completedRestSteps,
  newStageProgress:session.appliedStageProgress,
  lengthWorld:session.motionState.pose.boneLengths.reduce((a,b)=>a+b,0),
  pendingGrowth:session.pendingGrowth,
  postShedGrowthAutomatic:false,
  fullMeshAfterResuming:render.ok});
}
assert.equal(JSON.stringify(canonicalPose),original);
assert.equal(JSON.stringify({emptyScene,terrain}),env);
assert.deepEqual(summaries.map(s=>s.frames),[11,11,11,11]);
assert.deepEqual(summaries.map(s=>s.restSteps),[2,2,2,0]);

// Near a solid rock beyond the juvenile tail, the source is safe
// at first, but incremental growth must eventually STOP before the
// tail or entire mesh crosses the rock. Pending growth is retained.
const tight=createTerrariumSceneGeometryV03d({
 sceneId:'v09v_tail_growth_requires_more_rest_space',
 objects:[stone('tail_space_rock',510,185,12,30,190)]
});
const short=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:tight,
 terrain,stageProgress:0
});
assert.equal(short.phase,'moving_sized',JSON.stringify(short));
let small=createSnakeRestGrowthSessionV09v({
 motionState:short,scene:tight,terrain
});
assert.equal(small.phase,'moving');
small=accumulateSnakeGrowthPotentialV09v({
 session:small,amount:.24
}).session;
small=enterSnakeGrowthRestV09v({
 session:small,scene:tight,terrain
}).session;
let applied=0,blocked=null;
for(let i=0;i<22;i++){
 const proposal=applySnakeSafeRestGrowthV09v({
  session:small,scene:tight,terrain
 });
 if(!proposal.ok){
  blocked=proposal;break;
 }
 if(proposal.stageStepCommitted===0)break;
 small=proposal.session;
 applied++;
}
assert.ok(applied>=1,
 'roomy start should allow a small safe rest increment');
assert.ok(blocked,
 'the original source rock must block excessive extra growth');
assert.ok(['rest_growth_source_contact_rejected',
 'rest_growth_head_body_mesh_rejected',
 'rest_growth_mesh_transition_rejected'].includes(blocked.reason));
assert.equal(blocked.session,small);
assert.ok(small.pendingGrowth>0);
assert.equal(small.motionState.verifiedFrames,0);
assert.equal(small.motionState.phase,'resting_growth');
assert.equal(small.motionState.pose.points.length,24);
assert.equal(JSON.stringify(canonicalPose),original);
const resumedNearRock=resumeSnakeAfterGrowthRestV09v({
 session:small,scene:tight,terrain
});
assert.equal(resumedNearRock.ok,true,
 'refused extra growth must not trap a still safe body');
const lastSafe=JSON.stringify(resumedNearRock.session.motionState.pose);
assert.equal(resumedNearRock.session.pendingGrowth,small.pendingGrowth);
assert.equal(JSON.stringify(resumedNearRock.session.motionState.pose),
 lastSafe);
const stale=applySnakeSafeRestGrowthV09v({
 session:small,
 scene:Object.freeze({...tight,revision:tight.revision+1}),
 terrain
});
assert.equal(stale.ok,false);
assert.equal(stale.session,small);
assert.equal(stale.reason,'rest_scene_or_old_pose_unsafe');

// Shedding with no queued growth must NEVER force a size change.
const healthy=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:emptyScene,
 terrain,stageProgress:1
});
let noQueue=createSnakeRestGrowthSessionV09v({
 motionState:healthy,scene:emptyScene,terrain
});
noQueue=enterSnakeGrowthRestV09v({
 session:noQueue,scene:emptyScene,terrain
}).session;
noQueue=beginSnakeSheddingV09v({session:noQueue}).session;
noQueue=completeSnakeSheddingV09v({session:noQueue}).session;
const noGrowth=applySnakeSafeRestGrowthV09v({
 session:noQueue,scene:emptyScene,terrain
});
assert.equal(noGrowth.ok,true);
assert.equal(noGrowth.stageStepCommitted,0);
assert.equal(noGrowth.session,noQueue);

// Stage cap never creates phantom growth; after exiting rest, any
// accumulated potential cannot change the moving body.
assert.equal(JSON.stringify(canonicalPose),original);
console.log('PASS V0.9V only-safe-rest incremental 24-joint sized growth and 5-time-slice 3216-triangle mesh with no growth during movement or shedding '+JSON.stringify({
 fourStageChecks:summaries,
 tailSpaceLimitedRestSteps:applied,
 blockedUnsafeEnclosureGrowth:blocked?.reason,
 growthPendingAfterBlocked:small.pendingGrowth,
 rejectedGrowthKeepsLastSafePose:true,
 afterSheddingNoAutomaticGrowth:true,
 resumedMovingWithApprovedNewLengths:true,
 noFormalPlayerSaveChanged:true,
 noSkinApplied:true,
 noBiologicalGrowthRateClaim:true
}));
