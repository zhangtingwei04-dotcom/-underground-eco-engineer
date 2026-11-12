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

const sourceHash=JSON.stringify(canonicalPose);
const worldHash=JSON.stringify({scene,terrain});
const staticStages=[];
for(const stage of [0,1,2,3]){
 const head=buildSnakeHeadNeckCandidateV09r({
  sourcePose:canonicalPose,scene,terrain,
  stageProgress:stage,headYawRad:.07,headPitchRad:.01
 });
 assert.equal(head.ok,true);
 const contact=inspectSnakeMeshSurfaceV09s({
  candidate:head,scene,terrain
 });
 assert.equal(contact.version,'0.9S');
 assert.equal(contact.ok,true,'static full mesh stage '+stage+
  ' '+contact.reason+' '+JSON.stringify(contact.firstUncertainPair));
 assert.equal(contact.sourceTriangleCount,3216);
 assert.equal(contact.sourceVertexCount,1617);
 assert.equal(contact.triangleHeightfieldSamples,3216*7);
 assert.equal(contact.checkedAllBodyAndHeadTriangleFaces,true);
 assert.equal(contact.exactStatic3DTriangleIntersectionNarrowphase,true);
 assert.equal(contact.firstIntersection,null);
 assert.equal(contact.firstUncertainPair,null);
 assert.ok(contact.minTriangleSurfaceHeightfieldGapWorld>=-.00001);
 assert.equal(contact.exactContinuous3DSweepCertified,false);
 assert.equal(contact.sourceSizeMotionAuthorized,false);
 staticStages.push({
  stage,minFaceGroundGap:contact.minTriangleSurfaceHeightfieldGapWorld,
  narrowphaseTrianglePairs:contact.exactTrianglePairsExamined,
  ringBroadphasePairs:contact.nonlocalRingBroadphasePairs
 });
}
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);

// A mesh can have all its vertices above the heightfield yet a
// triangle INTERIOR can cross a tiny mound. This is why V0.9Q
// vertex-only QA cannot independently certify the visible surface.
const neutral=buildSnakeHeadNeckCandidateV09r({
 sourcePose:canonicalPose,scene,terrain,stageProgress:1
});
assert.equal(neutral.ok,true);
let testTriangle=null;
for(let k=0;k<neutral.mesh.triangles.length;k+=3){
 const ids=neutral.mesh.triangles.slice(k,k+3);
 const pts=ids.map(i=>neutral.mesh.positions[i]);
 const midpoint={x:pts.reduce((s,p)=>s+p.x,0)/3,
  y:pts.reduce((s,p)=>s+p.y,0)/3,
  z:pts.reduce((s,p)=>s+p.z,0)/3};
 const spread=Math.min(...pts.map(p=>
  Math.hypot(p.x-midpoint.x,p.y-midpoint.y)));
 if(midpoint.z>.005&&midpoint.z<.04&&spread>.004&&
  midpoint.x>-.5&&midpoint.x<1.7&&
  Math.abs(midpoint.y)<.35){
  testTriangle={midpoint,spread};
  break;
 }
}
assert.ok(testTriangle,'triangle with interior planar area found');
const faceBump={groundZ:0,rock:{
 x:testTriangle.midpoint.x,y:testTriangle.midpoint.y,
 radius:testTriangle.spread*.45,
 height:testTriangle.midpoint.z+.05
},perch:null};
const eachVertexClear=neutral.mesh.positions.every(p=>
 p.z-sampleSnakeTerrain(p.x,p.y,faceBump).z>=-.00001);
assert.equal(eachVertexClear,true,
 'the synthetic bump must be invisible to V0.9Q vertex checks');
const faceGround=inspectSnakeMeshSurfaceV09s({
 candidate:neutral,scene,terrain:faceBump
});
assert.equal(faceGround.ok,false);
assert.equal(faceGround.reason,'triangle_interior_hits_heightfield');
assert.ok(faceGround.minTriangleSurfaceHeightfieldGapWorld<-.001);

// The full-surface AABB test must hold if a true source object
// overlaps a moving triangular surface between two valid endpoints.
const alteredUV=Object.freeze({...neutral,
 mesh:Object.freeze({...neutral.mesh,
  uv:Object.freeze(neutral.mesh.uv.map((q,i)=>i===10?
   Object.freeze({...q,u:q.u+.1}):q))})
});
const topologyFailure=inspectSnakeMeshTemporalV09s({
 from:neutral,to:alteredUV,scene,terrain
});
assert.equal(topologyFailure.ok,false);
assert.equal(topologyFailure.reason,'mesh_topology_or_uv_changed');
assert.equal(topologyFailure.actualSourceFramesCommitted,0);
assert.throws(()=>inspectSnakeMeshSurfaceV09s({
 candidate:{...neutral,mesh:{...neutral.mesh,positions:[]}},
 scene,terrain
}),RangeError);

// The authoritative V0.9C/D/G source return fixture.
// REAL V0.7P->V0.9C source fixture, no fabricated moving states.
// TRUE V0.7P->V0.9C source (no fabricated moving state).
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



const original=JSON.stringify(moving);
const plan=planSnakeHeadingReturnV09l({
 source:moving,scene:realScene,terrain,horizonFrames:35
});
assert.equal(plan.ok,true);
let state=Object.freeze({...moving,route:plan.selectedRoute,
 returnTurnCommitted:false});
const summaries=[0,1,2,3].map(stage=>({
 stage,passed:0,minGround:Infinity,maxVertexStep:0,
 maxFaceStrain:1,maxNonlocalPairs:0
}));
let firstMesh=null;
for(let i=0;i<10;i++){
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state,scene:realScene,terrain
 });
 assert.equal(next.phase,'moving_return');
 assert.equal(next.verifiedFrames,state.verifiedFrames+1);
 const yawA=.055*Math.sin(i*.13),yawB=.055*Math.sin((i+1)*.13);
 const pitchA=.01*Math.sin(i*.1),pitchB=.01*Math.sin((i+1)*.1);
 for(const stat of summaries){
  const result=inspectSnakeAuthenticatedMeshStepV09s({
   previousSource:state,nextSource:next,
   scene:realScene,terrain,stageProgress:stat.stage,
   previousYawRad:yawA,nextYawRad:yawB,
   previousPitchRad:pitchA,nextPitchRad:pitchB,
   temporalSlices:3
  });
  assert.equal(result.ok,true,
   'size '+stat.stage+' source '+next.verifiedFrames+
   ' '+result.reason+' '+result.temporal?.reason);
  assert.equal(result.sourceReplayMatched,true);
  assert.equal(result.headNeckIndexedSeamStillWelded,true);
  assert.equal(result.temporal.checkedSweptFaces,3216);
  assert.equal(result.temporal.surfaceHeightfieldSamples,
   3216*4*3);
  assert.equal(result.temporal.allOriginalHeadBodyVerticesChecked,true);
  assert.equal(result.temporal.fullMeshVertexContinuityChecked,true);
  assert.equal(result.temporal.fullMeshTriangleSweptAabbBroadphaseChecked,true);
  assert.equal(result.temporal.sampled3DSurfaceSelfIntersectionChecked,true);
  assert.equal(result.temporal.firstNonlocalTriangleCollision,null);
  assert.equal(result.temporal.firstUncertainContact,null);
  assert.equal(result.temporal.firstSweptSourceSceneRisk,null);
  assert.ok(result.temporal.minimumSampledSurfaceGroundGapWorld>=-.00001);
  assert.equal(result.exactContinuous3DSweepCertified,false);
  assert.equal(result.realBiomechanicalContactCertified,false);
  assert.equal(result.newSizeMotionControllerGranted,false);
  assert.equal(result.sourceFramesCommitted,0);
  assert.equal(result.skinApplied,false);
  assert.equal(result.saveModified,false);
  if(!firstMesh)firstMesh=result.originalV09rTransition.from.mesh;
  else assert.deepEqual(result.originalV09rTransition.to.mesh.uv,
   firstMesh.uv);
  stat.passed++;
  stat.minGround=Math.min(stat.minGround,
   result.temporal.minimumSampledSurfaceGroundGapWorld);
  stat.maxVertexStep=Math.max(stat.maxVertexStep,
   result.temporal.maximumSourceVertexStepWorld);
  stat.maxFaceStrain=Math.max(stat.maxFaceStrain,
   result.temporal.maxEdgeLengthRatio);
  stat.maxNonlocalPairs=Math.max(stat.maxNonlocalPairs,
   result.temporal.nonlocalNarrowphaseTrianglePairs);
 }
 state=next;
}
assert.deepEqual(summaries.map(x=>x.passed),[10,10,10,10]);
assert.equal(state.verifiedFrames,moving.verifiedFrames+10);
assert.equal(JSON.stringify(moving),original);
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);

const fake=Object.freeze({...state,
 verifiedFrames:state.verifiedFrames+1,
 pose:state.pose,relayState:state.relayState
});
const forged=inspectSnakeAuthenticatedMeshStepV09s({
 previousSource:state,nextSource:fake,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(forged.ok,false);
assert.equal(forged.sourceReplayMatched,false);
assert.equal(forged.sourceFramesCommitted,0);
const changedWorld=Object.freeze({...realScene,
 revision:realScene.revision+1});
assert.throws(()=>inspectSnakeAuthenticatedMeshStepV09s({
 previousSource:state,nextSource:fake,
 scene:changedWorld,terrain,stageProgress:0
}),RangeError);
console.log('PASS V0.9S whole-head-body 3216 triangle surface and time-coherence QA on 4 sizes x10 genuine V0.9C/D/G frames '+JSON.stringify({
 staticStages,
 faceInteriorPenetrationCaughtWithoutBadVertices:true,
 topologyUVMutationRejected:true,
 sourceFramesCheckedByStage:summaries,
 nonlocalFullMeshSurface3DCollisionDiagnostic:true,
 forgedSourceRejected:true,
 sceneRevisionChangeRejected:true,
 originalSourceUnmodified:true,
 exactContinuous3DSweepCertified:false,
 newVariableSizeLocomotionAuthorized:false
}));
