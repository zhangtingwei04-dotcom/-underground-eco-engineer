import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {startSnakeVariableSizeMotionV09t,
 advanceSnakeVariableSizeMotionV09t}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';
import {createSnakeFeedingLabV09w}
 from '../src/ohm-core/snake-feeding-digestion-v09w.mjs';
import {createSnakeFoodBehaviorLabV09x,
 offerSnakeFoodWithBehaviorV09x}
 from '../src/ohm-core/snake-food-refusal-behavior-v09x.mjs';
import {buildSnakeSizedMeshCandidateV09u}
 from '../src/ohm-core/snake-sized-mesh-motion-v09u.mjs';
import {
 createSnakeSolidCaveV09z,
 inspectSnakeCaveMeshOccupancyV09z,
 inspectSnakeCaveSolidSweepV09z,
 inspectSnakeHeadFirstCaveStepV09z,
 previewSnakeHeadFirstCaveEntryV09z
} from '../src/ohm-core/snake-real-cave-entry-v09z.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const stone=(id,x,y,width,depth,height)=>F({
 id,kind:'rock_overhang',x,y,width,depth,height,
 transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v09z_neutral_physical_cave_tunnel',
 objects:[]
});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:-.35+i*2.28/23,y:0,z:.135
 }))),bodyRadius:.13,segmentLength:2.28/23
});
const original=JSON.stringify({canonicalPose,scene,terrain});
const cave=createSnakeSolidCaveV09z({
 scene,id:'neutral_physical_cave'
});
assert.equal(cave.version,'0.9Z');
assert.equal(cave.entrance.open,true);
assert.equal(cave.entrance.forwardDirection,'negative_x_head_first');
assert.equal(cave.solids.length,5);
assert.equal(cave.solidMeshes.length,5);
assert.equal(cave.roofWallFloorSolidTriangleCount,60);
assert.equal(cave.solidMeshes.reduce((a,m)=>a+m.triangleCount,0),60);
assert.ok(cave.solidMeshes.every(m=>m.positions.length===8));
assert.equal(cave.sourceRockBlocker,null);
assert.equal(cave.realWallsAndRoofModeled,true);
assert.equal(cave.gameSceneIntegrated,false);

// Route authorization requires a real event in the V0.9X behavior
// prototype, not a head-arrival or unrelated accepted-feeding event.
let receipt=null;
for(let seed=0;seed<100;seed++){
 const feedingState=createSnakeFeedingLabV09w({
  individualId:'cave_intent_snake',randomSeed:seed
 });
 const state=createSnakeFoodBehaviorLabV09x({feedingState});
 const r=offerSnakeFoodWithBehaviorV09x({
  session:state,offerId:'refused_seek_cave',
  preyId:'prey_a',context:{preyStatus:'incompatible'}
 });
 if(r.refused&&r.receipt.behavior==='sniff_then_seek_cover'){
  receipt=r.receipt;break;
 }
}
assert.ok(receipt);
assert.equal(receipt.accepted,false);
assert.equal(receipt.certainty,'observable_behavior_not_diagnosis');

// All FOUR distinct stage-sized transparent meshes start outside
// the tunnel mouth, with their own actual 23 bone lengths / radii.
const starts=[];
for(const stage of [0,1,2,3]){
 const start=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene,terrain,
  stageProgress:stage,speedWorldPerSecond:.17
 });
 assert.equal(start.phase,'moving_sized',
  'stage '+stage+' '+start.reason+' '+start.groundingReason);
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState:start,scene,terrain
 });
 assert.equal(mesh.ok,true,'stage '+stage);
 assert.equal(mesh.mesh.vertexCount,1617);
 const first=inspectSnakeCaveMeshOccupancyV09z({
  sizedState:start,scene,terrain,cave,meshCandidate:mesh
 });
 assert.equal(first.ok,true,
  'initial stage '+stage+' '+first.reason);
 assert.equal(first.entireTransparentMeshInside,false);
 assert.equal(first.interiorVertices,0);
 starts.push(start);
}

// Source replay and the whole transparent mesh must both be checked
// for every physically moving head-first cave step. The old forward
// adult animation cannot pretend to be a 4-stage authentic source.
for(const [stage,start] of starts.entries()){
 const next=advanceSnakeVariableSizeMotionV09t({
  state:start,scene,terrain,seconds:.05
 });
 assert.equal(next.phase,'moving_sized');
 assert.ok(next.pose.points[0].x<start.pose.points[0].x);
 const step=inspectSnakeHeadFirstCaveStepV09z({
  previousState:start,nextState:next,
  scene,terrain,cave,seconds:.05
 });
 assert.equal(step.ok,true,
  'stage '+stage+' '+step.reason+' '+step.sourceReason+
  ' '+JSON.stringify(step.caveSolidRisk));
 assert.equal(step.signedSourceReplayMatched,true);
 assert.equal(step.caveTriangleCollisionTested,true);
 assert.equal(step.caveSolidSweep.checkedSweptMeshTriangles,3216);
 assert.equal(step.caveSolidSweep.physicalCaveSolidsChecked,5);
 assert.equal(step.meshVertexCount,1617);
 assert.equal(step.meshTriangleCount,3216);
 assert.equal(step.everyCurrentBoneLengthUnchanged,true);
 assert.equal(step.currentBodyRadiiNeverScaled,true);
 assert.equal(step.sourceFramesCommitted,0);
 assert.equal(step.skinApplied,false);
 assert.equal(next.verifiedFrames,1);
}

// A partial approach MUST NOT count as hiding. At an early frame,
// even when the head begins to cross the mouth, the tail remains
// outside; the route must return an explicit incomplete status.
const short=previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState:starts[0],scene,terrain,cave,
 maxFrames:50
});
assert.equal(short.ok,false);
assert.equal(short.status,
 'frame_budget_exhausted_before_full_body_cave_entry');
assert.equal(short.acceptedPhysicalCaveSteps,50);
assert.equal(short.finalCaveOccupancy.entireTransparentMeshInside,false);
assert.equal(short.finalCaveOccupancy.tailFullyInside,false);
assert.equal(short.actualGameSourceFramesCommitted,0);

// Juvenile must actually pass the open entrance HEAD FIRST and
// continue until the last tail-ring mesh vertex is safely under
// physical walls+roof; the source never teleports or shrinks.
const juvenile=previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState:starts[0],scene,terrain,cave,
 maxFrames:250
});
assert.equal(juvenile.ok,true,
 'juvenile '+juvenile.status+' '+
  JSON.stringify(juvenile.firstFailure)+' '+
  JSON.stringify(juvenile.finalCaveOccupancy));
assert.equal(juvenile.status,
 'head_body_tail_all_1617_mesh_vertices_in_real_solid_tunnel');
assert.ok(juvenile.firstHeadFullEntryFrame>0);
assert.ok(juvenile.firstTailFullEntryFrame>
 juvenile.firstHeadFullEntryFrame);
assert.equal(juvenile.firstWholeMeshEntryFrame,
 juvenile.firstTailFullEntryFrame);
assert.equal(juvenile.trueHeadFirstEntrance,true);
assert.equal(juvenile.finalCaveOccupancy.interiorVertices,1617);
assert.equal(juvenile.finalCaveOccupancy.headFullyInside,true);
assert.equal(juvenile.finalCaveOccupancy.tailFullyInside,true);
assert.equal(juvenile.finalCaveOccupancy.entireTransparentMeshInside,true);
assert.equal(juvenile.all1617VerticesRequired,true);
assert.equal(juvenile.physical5SolidCaveColliderUsed,true);
assert.equal(juvenile.originalSourceUnmodified,true);
assert.equal(juvenile.noMovementBoneGrowth,true);
assert.equal(juvenile.completeCurvedCaveNavigation,false);
assert.equal(juvenile.exactContinuous3DPhysicsCertified,false);
assert.equal(juvenile.formalWorldSaveModified,false);
assert.equal(juvenile.skinApplied,false);
assert.equal(juvenile.progress.length,juvenile.acceptedPhysicalCaveSteps);
assert.equal(juvenile.progress[0].all1617Inside,false);
assert.equal(juvenile.progress.at(-1).all1617Inside,true);

// The same physically modeled, fully swept straight cave is now
// run END-TO-END for all other independent V0.9T stage-sized snakes.
// No use of adult-animation rescaling or teleporting to checkpoints.
const fullBodyArrivals=[{
 stage:0,frames:juvenile.acceptedPhysicalCaveSteps,
 firstHead:juvenile.firstHeadFullEntryFrame,
 lastTail:juvenile.firstTailFullEntryFrame
}];
for(const stage of [1,2,3]){
 const p=previewSnakeHeadFirstCaveEntryV09z({
  receipt,sizedState:starts[stage],
  scene,terrain,cave,maxFrames:450,seconds:.05
 });
 assert.equal(p.ok,true,
  'FULL CAVE STAGE '+stage+' '+p.status+' '+
  JSON.stringify(p.firstFailure)+' '+
  JSON.stringify(p.finalCaveOccupancy));
 assert.equal(p.trueHeadFirstEntrance,true);
 assert.ok(p.firstHeadFullEntryFrame<p.firstTailFullEntryFrame);
 assert.equal(p.firstWholeMeshEntryFrame,p.firstTailFullEntryFrame);
 assert.equal(p.finalCaveOccupancy.interiorVertices,1617);
 assert.equal(p.finalCaveOccupancy.headFullyInside,true);
 assert.equal(p.finalCaveOccupancy.tailFullyInside,true);
 assert.equal(p.finalCaveOccupancy.entireTransparentMeshInside,true);
 assert.equal(p.noMovementBoneGrowth,true);
 assert.equal(p.originalSourceUnmodified,true);
 assert.equal(p.physical5SolidCaveColliderUsed,true);
 assert.equal(p.exactContinuous3DPhysicsCertified,false);
 assert.equal(p.formalWorldSaveModified,false);
 assert.equal(p.skinApplied,false);
 fullBodyArrivals.push({stage,
  frames:p.acceptedPhysicalCaveSteps,
  firstHead:p.firstHeadFullEntryFrame,
  lastTail:p.firstTailFullEntryFrame,
  lastHeadX:p.finalHead.x,
  lastTailX:p.finalTail.x
 });
}
assert.equal(fullBodyArrivals.length,4);
assert.ok(fullBodyArrivals[3].frames>fullBodyArrivals[2].frames);
assert.ok(fullBodyArrivals[2].frames>fullBodyArrivals[1].frames);
assert.ok(fullBodyArrivals[1].frames>fullBodyArrivals[0].frames);

// Large adult should not be told to squeeze through a cave with an
// insufficient overhead clearance. This explicitly models a ROOF.
const lowCave=createSnakeSolidCaveV09z({
 scene,id:'too_low_adult_tunnel',roofZ:.20
});
const adultPartial=previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState:starts[3],scene,terrain,
 cave:lowCave,maxFrames:85
});
assert.equal(adultPartial.ok,false);
assert.equal(adultPartial.status,'held_at_last_safe_cave_pose');
assert.ok(adultPartial.firstFailure);
assert.ok(adultPartial.firstFailure.reason.includes('cave_'));
assert.ok(adultPartial.acceptedPhysicalCaveSteps<85);

// A too-narrow tunnel has actual side-wall solid geometry: large
// adult cannot bypass it by discounting the shared mesh radius.
const narrow=createSnakeSolidCaveV09z({
 scene,id:'too_narrow_cave',halfWidth:.10
});
const narrowHold=previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState:starts[3],scene,terrain,
 cave:narrow,maxFrames:100
});
assert.equal(narrowHold.ok,false);
assert.equal(narrowHold.status,'held_at_last_safe_cave_pose');
assert.ok(narrowHold.firstFailure);
assert.equal(narrowHold.physical5SolidCaveColliderUsed,true);

// Scene rocks inside the hollow are never "invisible" to a cave.
const blockedScene=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_source_rock_in_cave_hollow',
 objects:[stone('rock_inside_cave',178,181,25,30,190)]
});
const blockedCave=createSnakeSolidCaveV09z({
 scene:blockedScene,id:'solid_rock_blocks_hide'
});
assert.equal(blockedCave.sourceRockBlocker,'rock_inside_cave');
const blockedBody=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:blockedScene,
 terrain,stageProgress:0,speedWorldPerSecond:.17
});
assert.equal(blockedBody.phase,'moving_sized');
const blocked=inspectSnakeCaveMeshOccupancyV09z({
 sizedState:blockedBody,scene:blockedScene,
 terrain,cave:blockedCave
});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'real_source_rock_inside_cave_hollow');

// Stale shelter must fail closed even if the snake's own scene
// is unchanged, and it must not alter its pose/scene state.
const staleCave=F({...cave,revision:cave.revision+1});
const stale=inspectSnakeCaveMeshOccupancyV09z({
 sizedState:starts[0],scene,terrain,cave:staleCave
});
assert.equal(stale.ok,false);
assert.equal(stale.reason,'cave_source_scene_stale_or_invalid');
const mismatch=previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState:starts[0],scene,terrain,
 cave:staleCave,maxFrames:20
});
assert.equal(mismatch.ok,false);
assert.equal(mismatch.reason,'invalid_head_first_cave_preview');

// Invalid offer/behavior cannot authorize any shelter route.
// The host still needs to verify the source identity in a real game.
const noRefusal=previewSnakeHeadFirstCaveEntryV09z({
 receipt:F({...receipt,accepted:true}),
 sizedState:starts[0],scene,terrain,cave,maxFrames:20
});
assert.equal(noRefusal.ok,false);
assert.equal(noRefusal.reason,'invalid_head_first_cave_preview');
const noCoverIntent=previewSnakeHeadFirstCaveEntryV09z({
 receipt:F({...receipt,behavior:'sniff_then_turn'}),
 sizedState:starts[0],scene,terrain,cave,maxFrames:20
});
assert.equal(noCoverIntent.ok,false);

// Forged next source pose/radius must be rejected by the V0.9U
// deterministic REPLAY before any solid cave contact approval.
const next=advanceSnakeVariableSizeMotionV09t({
 state:starts[1],scene,terrain,seconds:.05
});
const spoof=inspectSnakeHeadFirstCaveStepV09z({
 previousState:starts[1],
 nextState:F({...next,pose:starts[1].pose}),
 scene,terrain,cave,seconds:.05
});
assert.equal(spoof.ok,false);
assert.equal(spoof.reason,'forward_24_joint_mesh_step_rejected');
assert.equal(spoof.sourceReplayMatched,false);

// No direct edits to canonical source, current stage skeleton, cave
// or original scene. No formal player saving or species skins.
assert.equal(JSON.stringify({canonicalPose,scene,terrain}),original);
assert.equal(starts[0].verifiedFrames,0);
assert.equal(starts[0].pose.points[0].x,-.35);
console.log('PASS V0.9Z real solid 3D cave (60 physical surface triangles), head-first V0.9T/U/S 24-joint mesh entry, juvenile whole 1617 vertices and 4-stage live contact smoke, without gameplay integration');
console.log(JSON.stringify({
 fourStageFullHeadFirstCaveArrivals:fullBodyArrivals,
 juvenileHeadFirstEntry:{
  verifiedFrames:juvenile.acceptedPhysicalCaveSteps,
  firstHeadInsideFrame:juvenile.firstHeadFullEntryFrame,
  firstTailInsideFrame:juvenile.firstTailFullEntryFrame,
  firstWholeMeshInsideFrame:juvenile.firstWholeMeshEntryFrame,
  lastPoseX:juvenile.finalHead.x,
  allMeshVerticesInside:juvenile.finalCaveOccupancy.interiorVertices
 },
 fourStagesCompletedFirstRealCaveStep:true,
 fourStagesEntireVisibleMeshEnters:true,
 physicalCaveSolids:5,
 totalVisibleCaveColliderMeshTriangles:60,
 transparentSnakeVerticesCheckedEachStep:1617,
 eachStepSourceMeshTrianglesChecked:3216,
 adultLowRoofRefused:true,adultNarrowWallsRefused:true,
 noRockCheating:true,headOnlyNotAccepted:true,
 noForgedSourceAccepted:true,
 nonNaturalStraightTunnelOnly:true,
 noExactContinuousPhysicsClaim:true,
 noFormalGameSaveOrSkinWrites:true
}));
