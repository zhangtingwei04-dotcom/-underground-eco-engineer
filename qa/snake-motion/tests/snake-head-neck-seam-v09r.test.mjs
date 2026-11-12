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

const sourceHash=JSON.stringify(canonicalPose);
const worldHash=JSON.stringify({scene,terrain});
const summary=[];
for(const stage of [0,1,2,3]){
 const h=buildSnakeHeadNeckCandidateV09r({
  sourcePose:canonicalPose,scene,terrain,
  stageProgress:stage,headYawRad:.07
 });
 assert.equal(h.ok,true,'stage '+stage+' '+h.reason);
 assert.equal(h.mesh.vertexCount,1617);
 assert.equal(h.mesh.triangleCount,3216);
 assert.equal(h.mesh.noseVertexIndex,1616);
 assert.equal(h.mesh.neckSocketRingStartIndex,128);
 assert.equal(h.collisionShell.headSections.length,9);
 assert.equal(h.collisionShell.bodySections.length,93);
 assert.equal(h.seam.indexedSocketContinuous,true);
 assert.equal(h.seam.maximumSeamVertexGapWorld,0);
 assert.equal(h.seam.minimumSeamRingEdgeAdjacentFaceCount,2);
 assert.equal(h.seam.maximumSeamRingEdgeAdjacentFaceCount,2);
 assert.equal(h.headBodySeamCertified,true);
 assert.equal(h.maximumHeadRadialMismatch<1e-10,true);
 assert.equal(h.headCheck.ok,true);
 assert.equal(h.headCheck.nonlocal3DHeadCapsulesClear,true);
 assert.equal(h.headCheck.sourceSceneClear,true);
 assert.equal(h.headCheck.renderedHeadVertexGroundClear,true);
 assert.ok(h.headCheck.minimumHeadVertexGroundGapWorld>=-.00001);
 assert.equal(h.sourceSizedMovementAuthorized,false);
 assert.equal(h.mesh3DSweepCertified,false);
 assert.equal(h.anatomicalHeadCertified,false);
 assert.equal(h.gameIntegrationAuthorized,false);
 assert.equal(h.skinApplied,false);
 assert.equal(h.saveModified,false);
 assert.ok(h.mesh.triangles.every(index=>
  Number.isInteger(index)&&index>=0&&index<h.mesh.vertexCount));
 assert.deepEqual(h.mesh.positions.slice(128,128+1488),
  h.sharedBodyV09q.mesh.positions);
 assert.deepEqual(h.collisionShell.bodySections,
  h.sharedBodyV09q.collisionShell.sections);
 summary.push({stage,vertices:h.mesh.vertexCount,
  headBodySeamGap:h.seam.maximumSeamVertexGapWorld,
  minimumHeadTerrainGap:h.headCheck.minimumHeadVertexGroundGapWorld,
  minimumNonlocalHeadGap:h.headCheck.minimumNonlocal3DHeadGapWorld});
}
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);

const looks=[-.17,-.08,0,.08,.17].map(yaw=>
 buildSnakeHeadNeckCandidateV09r({
  sourcePose:canonicalPose,scene,terrain,
  stageProgress:1,headYawRad:yaw
 }));
assert.ok(looks.every(x=>x.ok));
assert.deepEqual(looks[0].mesh.uv,looks.at(-1).mesh.uv);
assert.deepEqual(looks[0].mesh.triangles,looks.at(-1).mesh.triangles);
assert.deepEqual(looks[0].sharedBodyV09q.posePoints,
 looks.at(-1).sharedBodyV09q.posePoints);
assert.notDeepEqual(looks[0].mesh.positions.slice(0,128),
 looks.at(-1).mesh.positions.slice(0,128));
assert.throws(()=>buildSnakeHeadNeckCandidateV09r({
 sourcePose:canonicalPose,scene,terrain,headYawRad:.3
}),RangeError);
assert.throws(()=>buildSnakeHeadNeckCandidateV09r({
 sourcePose:canonicalPose,scene,terrain,headPitchRad:.1
}),RangeError);

const headOnlyRock=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_head_only_blocker',
 objects:[stone('head_front',704,185,24,30,190)]
});
assert.equal(buildSnakeSharedBodyGeometryV09q({
 sourcePose:canonicalPose,scene:headOnlyRock,terrain,
 stageProgress:2
}).ok,true);
const blocked=buildSnakeHeadNeckCandidateV09r({
 sourcePose:canonicalPose,scene:headOnlyRock,
 terrain,stageProgress:2
});
assert.equal(blocked.ok,false);
assert.equal(blocked.mesh,null);
assert.ok(blocked.reason.includes('head_shell_source_rock_'));
const emptyScene=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_head_glass',objects:[]
});
const nearGlassPose=Object.freeze({...canonicalPose,
 points:Object.freeze(canonicalPose.points.map(p=>
  Object.freeze({...p,x:p.x+2.41})))
});
assert.equal(buildSnakeSharedBodyGeometryV09q({
 sourcePose:nearGlassPose,scene:emptyScene,terrain,
 stageProgress:2
}).ok,true);
const glass=buildSnakeHeadNeckCandidateV09r({
 sourcePose:nearGlassPose,scene:emptyScene,terrain,
 stageProgress:2
});
assert.equal(glass.ok,false);
assert.equal(glass.reason,'head_shell_outside_glass');
assert.equal(glass.mesh,null);
const steepTerrain={groundZ:0,rock:{
 x:.8,y:0,radius:.06,height:.65
},perch:null};
const steep=buildSnakeHeadNeckCandidateV09r({
 sourcePose:canonicalPose,scene:emptyScene,
 terrain:steepTerrain,stageProgress:0
});
assert.equal(steep.ok,false);
assert.equal(steep.mesh,null);

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
const route=planSnakeHeadingReturnV09l({
 source:moving,scene:realScene,terrain,horizonFrames:40
});
assert.equal(route.ok,true);
let current=Object.freeze({...moving,route:route.selectedRoute,
 returnTurnCommitted:false});
const stages=[0,1,2,3];
const counts=[0,0,0,0],mins=[Infinity,Infinity,Infinity,Infinity];
let originalUV=null,originalTriangles=null;
for(let i=0;i<24;i++){
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:current,scene:realScene,terrain
 });
 assert.equal(next.phase,'moving_return');
 assert.equal(next.verifiedFrames,current.verifiedFrames+1);
 const aYaw=.06*Math.sin(i*.11);
 const bYaw=.06*Math.sin((i+1)*.11);
 const aPitch=.012*Math.sin(i*.13);
 const bPitch=.012*Math.sin((i+1)*.13);
 for(const [k,stage] of stages.entries()){
  const step=inspectSnakeHeadNeckTransitionV09r({
   previousSource:current,nextSource:next,
   scene:realScene,terrain,stageProgress:stage,
   previousYawRad:aYaw,nextYawRad:bYaw,
   previousPitchRad:aPitch,nextPitchRad:bPitch
  });
  assert.equal(step.ok,true,
   'stage '+stage+' frame '+next.verifiedFrames+
   ' '+step.reason+' '+step.toReason);
  assert.equal(step.sourceReplayMatched,true);
  assert.equal(step.headBodySeamCertified,true);
  assert.equal(step.sharedNeckSocketStable,true);
  assert.equal(step.headSweptSourceSceneClear,true);
  assert.equal(step.headSweptHeightfieldClear,true);
  assert.equal(step.sourceFramesCommitted,0);
  assert.equal(step.skinApplied,false);
  assert.equal(step.gameIntegrationAuthorized,false);
  assert.equal(step.headNeckMesh3DSweepCertified,false);
  const mesh=step.to.mesh;
  if(originalUV){
   assert.deepEqual(mesh.uv,originalUV);
   assert.deepEqual(mesh.triangles,originalTriangles);
  }else{
   originalUV=mesh.uv;originalTriangles=mesh.triangles;
  }
  counts[k]++;
  mins[k]=Math.min(mins[k],
   step.headSweptMinimumTerrainGapWorld);
 }
 current=next;
}
assert.equal(current.verifiedFrames,moving.verifiedFrames+24);
assert.deepEqual(counts,[24,24,24,24]);
assert.ok(mins.every(x=>x>=-.00001));
assert.equal(JSON.stringify(moving),original);
assert.equal(JSON.stringify(canonicalPose),sourceHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);
const fake=Object.freeze({...current,
 verifiedFrames:current.verifiedFrames+1,
 pose:current.pose,relayState:current.relayState});
const forged=inspectSnakeHeadNeckTransitionV09r({
 previousSource:current,nextSource:fake,
 scene:realScene,terrain,stageProgress:0
});
assert.equal(forged.ok,false);
assert.equal(forged.reason,'unverified_original_source_step');
const realNext=advanceSnakeRouteWithTurnSpaceGuardV09g({
 state:current,scene:realScene,terrain
});
assert.equal(realNext.phase,'moving_return');
const jump=inspectSnakeHeadNeckTransitionV09r({
 previousSource:current,nextSource:realNext,
 scene:realScene,terrain,stageProgress:0,
 previousYawRad:0,nextYawRad:.12
});
assert.equal(jump.ok,false);
assert.equal(jump.reason,'head_look_frame_jump_too_large');

console.log('PASS V0.9R welded shared-radius neutral head/neck, four sizes x 24 true source shadow steps '+JSON.stringify({
 staticByStage:summary,headBodySocketFacesPerEdge:2,
 sourceHeadAndBonesUnchanged:true,
 stoneRejected:blocked.reason,glassRejected:glass.reason,
 steepTerrainRejected:!steep.ok,
 safeMovingFramesBySize:counts,
 minSweptHeadGroundBySize:mins,
 forgedSourceRejected:true,abruptHeadLookRejected:true,
 newMeshHeadNeckJointGeometryOnly:true,
 finalMeshSweptPhysicsCertified:false,
 actualVariableSizeMovementAuthorized:false
}));
