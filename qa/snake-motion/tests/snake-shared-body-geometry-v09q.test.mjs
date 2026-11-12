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

const canonicalHash=JSON.stringify(canonicalPose);
const worldHash=JSON.stringify({scene,terrain});
const stages=[];
for(const stage of [0,1,2,3]){
 const body=buildSnakeSharedBodyGeometryV09q({
  sourcePose:canonicalPose,scene,terrain,stageProgress:stage,
  radialSegments:16,subdivisions:4
 });
 assert.equal(body.version,'0.9Q');
 assert.equal(body.ok,true,'same-source size geometry '+stage);
 assert.equal(body.sourceSolverConverged,true);
 assert.equal(body.topology.boneCount,24);
 assert.equal(body.topology.linkCount,23);
 assert.equal(body.topology.ringCount,93);
 assert.equal(body.topology.radialSegments,16);
 assert.equal(body.mesh.vertexCount,1488);
 assert.equal(body.mesh.triangleCount,2944);
 assert.equal(body.collisionShell.sectionCount,93);
 assert.equal(body.collisionShell.points,body.posePoints);
 assert.equal(body.collisionShell.radiiWorldUnits,body.radiiWorldUnits);
 assert.equal(body.sourceContactDiagnostics.groundClear,true);
 assert.equal(body.sourceContactDiagnostics.selfClear,true);
 assert.equal(body.sourceContactDiagnostics.sourceSceneClear,true);
 assert.equal(body.topology.candidateShellMatchesMesh,true);
 assert.equal(body.checks.maximumVertexRadialErrorWorld<1e-10,true);
 assert.equal(body.checks.maximumRingCenterErrorWorld<1e-10,true);
 assert.ok(body.checks.minimumMeshVertexHeightfieldGapWorld>=-.00001);
 assert.equal(body.mesh.positions.length,body.mesh.uv.length);
 assert.equal(body.mesh.triangles.length,body.mesh.triangleCount*3);
 assert.ok(body.mesh.triangles.every(j=>
  Number.isInteger(j)&&j>=0&&j<body.mesh.positions.length));
 assert.equal(body.sourceSizeMotionAuthorized,false);
 assert.equal(body.renderCandidateOnly,true);
 assert.equal(body.meshSweep3DCertified,false);
 assert.equal(body.headSocketCertified,false);
 assert.equal(body.groundForceCertified,false);
 assert.equal(body.fullBodyReturnVerified,false);
 assert.equal(body.skinApplied,false);
 assert.equal(body.saveModified,false);
 const compatibility=inspectSnakeGrowthRendererCompatibilityV09q({
  shared:body,speciesId:'generic_snake'
 });
 assert.equal(compatibility.interfaceCompatible,true);
 assert.equal(compatibility.uvIdentical,true);
 assert.equal(compatibility.growthBodyLengthIdentical,true);
 assert.equal(compatibility.sharedMeshVertices,1488);
 assert.equal(compatibility.oldArtCollisionRadiusNotShared,true);
 assert.equal(compatibility.originalRendererNotCertifiedForCollision,true);
 assert.equal(compatibility.noGameplayMotionAuthorized,true);
 stages.push({stage,bodyLength:body.sourceBodyLengthWorld,
  maxRadius:Math.max(...body.radiiWorldUnits),
  vertexCount:body.mesh.vertexCount,
  minimumMeshGap:body.checks.minimumMeshVertexHeightfieldGapWorld,
  sourceCollisionRadiusShared:!compatibility.oldArtCollisionRadiusNotShared});
}
assert.equal(JSON.stringify(canonicalPose),canonicalHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);
for(let i=1;i<stages.length;i++){
 assert.ok(stages[i].bodyLength>stages[i-1].bodyLength);
 assert.ok(stages[i].maxRadius>stages[i-1].maxRadius);
}

// Canonical, stable UV topology is independent of animal size and time.
// It preserves future texture mapping even when skin is not yet allowed.
const young=buildSnakeSharedBodyGeometryV09q({
 sourcePose:canonicalPose,scene,terrain,stageProgress:0
});
const large=buildSnakeSharedBodyGeometryV09q({
 sourcePose:canonicalPose,scene,terrain,stageProgress:3
});
assert.deepEqual(young.mesh.uv,large.mesh.uv);
assert.deepEqual(young.mesh.triangles,large.mesh.triangles);
assert.notDeepEqual(young.radiiWorldUnits,large.radiiWorldUnits);
assert.notDeepEqual(young.mesh.positions,large.mesh.positions);

// Conservative source stone collision prevents generating an apparent
// valid transparent body that a resized animal could never occupy.
const closeToRock=Object.freeze({...canonicalPose,
 points:Object.freeze(canonicalPose.points.map(q=>
  Object.freeze({...q,y:-1.2})))
});
const smallNear=buildSnakeSharedBodyGeometryV09q({
 sourcePose:closeToRock,scene,terrain,stageProgress:0
});
const adultNear=buildSnakeSharedBodyGeometryV09q({
 sourcePose:closeToRock,scene,terrain,stageProgress:2
});
assert.equal(smallNear.ok,true);
assert.equal(adultNear.ok,false);
assert.equal(adultNear.mesh,null);
assert.equal(adultNear.collisionShell,null);
assert.ok(adultNear.reason.startsWith('source_object_'));

// Rejected heightfield and stale source do not produce mesh geometry.
const impossibleTerrain={groundZ:0,rock:{
 x:.80,y:0,radius:.06,height:.65
},perch:null};
const clearScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09q_heightfield_block',objects:[]
});
const impossible=buildSnakeSharedBodyGeometryV09q({
 sourcePose:canonicalPose,scene:clearScene,
 terrain:impossibleTerrain,stageProgress:0
});
assert.equal(impossible.ok,false);
assert.equal(impossible.mesh,null);
assert.equal(impossible.sourceSizeMotionAuthorized,false);
assert.throws(()=>buildSnakeSharedBodyGeometryV09q({
 sourcePose:canonicalPose,scene,terrain,
 radialSegments:3
}),RangeError);
assert.throws(()=>inspectSnakeGrowthRendererCompatibilityV09q({
 shared:{version:'0.9Q',ok:false}
}),RangeError);

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

const sourceBefore=JSON.stringify(moving);
const sameRoute=planSnakeHeadingReturnV09l({
 source:moving,scene:realScene,terrain,horizonFrames:60
});
assert.equal(sameRoute.ok,true);
let cursor=Object.freeze({...moving,route:sameRoute.selectedRoute,
 returnTurnCommitted:false});
const traces=[[],[],[],[]];
const stageKeys=[0,1,2,3];
let previousUv=null;
for(let i=0;i<60;i++){
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:cursor,scene:realScene,terrain
 });
 assert.equal(next.phase,'moving_return');
 assert.equal(next.verifiedFrames,cursor.verifiedFrames+1);
 for(const [k,stage] of stageKeys.entries()){
  const frame=buildSnakeSharedBodyGeometryV09q({
   sourcePose:next.pose,scene:realScene,
   terrain,stageProgress:stage
  });
  assert.equal(frame.ok,true,
   'original true source frame '+next.verifiedFrames+
   ' shared candidate stage '+stage+' '+frame.reason);
  assert.equal(frame.mesh.vertexCount,1488);
  assert.equal(frame.collisionShell.sectionCount,93);
  assert.equal(frame.sourceSizeMotionAuthorized,false);
  assert.equal(frame.checks.maximumVertexRadialErrorWorld<1e-9,true);
  assert.ok(frame.checks.minimumMeshVertexHeightfieldGapWorld>=-.00001);
  if(previousUv)assert.deepEqual(frame.mesh.uv,previousUv);
  previousUv=frame.mesh.uv;
  const check=inspectSnakeGrowthRendererCompatibilityV09q({
   shared:frame,speciesId:'generic_snake'
  });
  assert.equal(check.interfaceCompatible,true);
  assert.equal(check.originalRendererNotCertifiedForCollision,true);
  traces[k].push(frame.checks.minimumMeshVertexHeightfieldGapWorld);
 }
 cursor=next;
}
assert.equal(cursor.verifiedFrames,moving.verifiedFrames+60);
assert.ok(traces.every(a=>a.length===60));
assert.equal(JSON.stringify(moving),sourceBefore);
assert.equal(JSON.stringify(canonicalPose),canonicalHash);
assert.equal(JSON.stringify({scene,terrain}),worldHash);
console.log('PASS V0.9Q immutable same-source render mesh + sized collision-shell geometry; four stages x 60 V0.9C/D/G source shadows '+JSON.stringify({
 stages,
 candidateRingCount:93,radialSegments:16,
 sameUVAndTopologyAcrossStages:true,
 geometricRadialErrorBelow1eMinus9:true,
 legacyGrowthRendererOnlyInterfaceCompatible:true,
 nearStoneJuvenile:smallNear.ok,
 nearStoneAdult:adultNear.ok,
 steepHeightfieldRejected:!impossible.ok,
 trueSourceStart:moving.verifiedFrames,
 trueSourceEnd:cursor.verifiedFrames,
 eachSizeSourceFrames:traces.map(x=>x.length),
 eachSizeMinimumMeshGroundGap:traces.map(a=>Math.min(...a)),
 sourceUnmodified:true,
 sourceSizeMotionAuthorized:false,
 mesh3DPhysicalCertification:false
}));
