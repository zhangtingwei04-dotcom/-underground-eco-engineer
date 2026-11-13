import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {startSnakeVariableSizeMotionV09t,
 advanceSnakeReverseStepV09y,inspectSnakeReverseStepV09y}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';
import {inspectSnakeSizedMeshStepV09u}
 from '../src/ohm-core/snake-sized-mesh-motion-v09u.mjs';
import {createSnakeFeedingLabV09w}
 from '../src/ohm-core/snake-feeding-digestion-v09w.mjs';
import {createSnakeFoodBehaviorLabV09x,
 offerSnakeFoodWithBehaviorV09x}
 from '../src/ohm-core/snake-food-refusal-behavior-v09x.mjs';
import {
 inspectSnakeWholeMeshHideV09y,
 inspectSnakeReverseMeshStepV09y,
 previewSnakeRefusalRetreatToShelterV09y
} from '../src/ohm-core/snake-reverse-hide-movement-v09y.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const stone=(id,x,y,width,depth,height)=>F({
 id,kind:'rock_overhang',x,y,width,depth,height,
 transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v09y_reverse_safe_abstract_shelter',objects:[]
});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
const sourceJSON=JSON.stringify(canonicalPose);
const sceneJSON=JSON.stringify({scene,terrain});
const shelter=F({id:'neutral_cover_large',
 sceneId:scene.sceneId,sceneRevision:scene.revision,
 xMin:-2.4,xMax:1.16,yMin:-.44,yMax:.44,
 floorZ:0,roofZ:.45});
let receipt=null;
for(let seed=0;seed<80;seed++){
 const feedingState=createSnakeFeedingLabV09w({
  individualId:'neutral_refusal_01',randomSeed:seed});
 const session=createSnakeFoodBehaviorLabV09x({feedingState});
 const offer=offerSnakeFoodWithBehaviorV09x({
  session,offerId:'rejected_cover_offer',
  preyId:'prey_a',
  context:{preyStatus:'incompatible'}
 });
 if(offer.refused&&offer.receipt.behavior===
  'sniff_then_seek_cover'){receipt=offer.receipt;break;}
}
assert.ok(receipt,'must source a real V0.9X seek-cover refusal');
assert.equal(receipt.accepted,false);
assert.equal(receipt.certainty,'observable_behavior_not_diagnosis');

// The roof/width tests MUST check mesh, not merely centerline.
// A head can be fully inside while large portions of the tail
// remain outside; never proclaim an arrived animal on head-only.
const source0=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene,terrain,
 stageProgress:0,speedWorldPerSecond:.17
});
assert.equal(source0.phase,'moving_sized');
const initial=inspectSnakeWholeMeshHideV09y({
 sizedState:source0,scene,terrain,shelter
});
assert.equal(initial.ok,true);
assert.equal(initial.fullBodyShelteredCandidate,false);
assert.equal(initial.entireTransparentHeadNeckBodyTailInside,false);
assert.equal(initial.meshVertexCount,1617);
assert.ok(initial.meshVertexInsideCount<1617);
const headOnly=F({...shelter,
 id:'head_only_not_enough',xMin:1.1,xMax:1.85});
const partial=inspectSnakeWholeMeshHideV09y({
 sizedState:source0,scene,terrain,shelter:headOnly
});
assert.equal(partial.ok,true);
assert.equal(partial.headInside,true);
assert.equal(partial.tailInside,false);
assert.equal(partial.fullBodyShelteredCandidate,false);
assert.equal(partial.headOnlyArrivalRejected,true);
const lowRoof=inspectSnakeWholeMeshHideV09y({
 sizedState:source0,scene,terrain,shelter:F({...shelter,
  id:'false_too_low',roofZ:.15})
});
assert.equal(lowRoof.ok,true);
assert.equal(lowRoof.fullBodyShelteredCandidate,false);
assert.ok(lowRoof.minimumSampledRoofClearanceWorld<0);
const narrowCover=inspectSnakeWholeMeshHideV09y({
 sizedState:source0,scene,terrain,
 shelter:F({...shelter,id:'narrow_for_any_stage',
  xMin:.3,xMax:1.16})
});
assert.equal(narrowCover.fullBodyShelteredCandidate,false);
const staleCover=inspectSnakeWholeMeshHideV09y({
 sizedState:source0,scene,terrain,
 shelter:F({...shelter,sceneRevision:scene.revision+1})
});
assert.equal(staleCover.ok,false);
assert.equal(staleCover.reason,'invalid_or_stale_shelter_region');

// First backward head step is OPPOSITE its forward-facing heading,
// and the tail must actually move; the reverse must not be blessed
// by the V0.9U FORWARD replay gate.
const one=advanceSnakeReverseStepV09y({
 state:source0,scene,terrain,seconds:.05
});
assert.equal(one.phase,'moving_sized');
assert.equal(one.verifiedFrames,1);
assert.ok(one.pose.points[0].x<source0.pose.points[0].x);
assert.ok(one.pose.points[23].x<source0.pose.points[23].x);
assert.deepEqual(one.pose.boneLengths,source0.pose.boneLengths);
assert.deepEqual(one.pose.radiiWorldUnits,source0.pose.radiiWorldUnits);
const firstAudit=inspectSnakeReverseStepV09y({
 state:source0,scene,terrain,seconds:.05
});
assert.equal(firstAudit.ok,true);
assert.equal(firstAudit.realBackwardHeadMotion,true);
assert.equal(firstAudit.fullBody23LinksUpdated,true);
assert.ok(firstAudit.headBackwardDisplacementDotWorld<0);
const mesh=inspectSnakeReverseMeshStepV09y({
 previousState:source0,nextState:one,
 scene,terrain,seconds:.05
});
assert.equal(mesh.ok,true,'first reversed sized head-body mesh');
assert.equal(mesh.sourceReplayMatched,true);
assert.equal(mesh.trueBackwardHeadMotion,true);
assert.equal(mesh.reverseNotPretendedForward,true);
assert.equal(mesh.wholeHeadBodyMeshVertexCount,1617);
assert.equal(mesh.wholeHeadBodyMeshTriangleCount,3216);
assert.equal(mesh.temporal.checkedSweptFaces,3216);
assert.equal(mesh.temporal.temporalSlices,3);
assert.equal(mesh.playerSaveModified??mesh.saveModified,false);
const forwardSpoof=inspectSnakeSizedMeshStepV09u({
 previousState:source0,nextState:one,
 scene,terrain,seconds:.05
});
assert.equal(forwardSpoof.ok,false);
assert.equal(forwardSpoof.reason,
 'forged_or_mismatched_v09t_source_step');
const forged=inspectSnakeReverseMeshStepV09y({
 previousState:source0,
 nextState:F({...one,pose:source0.pose}),
 scene,terrain,seconds:.05
});
assert.equal(forged.ok,false);
assert.equal(forged.reason,'forged_reverse_source_or_size_change');
const changedRadii=inspectSnakeReverseMeshStepV09y({
 previousState:source0,
 nextState:F({...one,pose:F({...one.pose,
  radiiWorldUnits:one.pose.radiiWorldUnits.map(
   (r,i)=>i===3?r*.1:r)})}),
 scene,terrain,seconds:.05
});
assert.equal(changedRadii.ok,false);
assert.equal(changedRadii.reason,
 'forged_reverse_source_or_size_change');
const badAngle=inspectSnakeReverseStepV09y({
 state:source0,scene,terrain,turnRadians:.05
});
assert.equal(badAngle.ok,false);
assert.equal(badAngle.reason,'reverse_turn_or_time_exceeds_bound');

// For all four size stages, backing away must continue until
// **every single transparent mesh vertex** is inside a genuine,
// source-scene-clear volume, not just the head or last centerline.
const arrivals=[];
for(const stage of [0,1,2,3]){
 const sizedState=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene,terrain,
  stageProgress:stage,speedWorldPerSecond:.17
 });
 assert.equal(sizedState.phase,'moving_sized');
 const before=JSON.stringify(sizedState);
 const p=previewSnakeRefusalRetreatToShelterV09y({
  receipt,sizedState,scene,terrain,shelter,
  maxFrames:95,seconds:.05
 });
 assert.equal(p.ok,true,
  'stage '+stage+' '+p.status+' '+JSON.stringify(p.firstFailure)+
  ' '+p.finalShelterAssessment?.meshVertexInsideCount);
 assert.equal(p.status,'whole_mesh_inside_abstract_shelter');
 assert.ok(p.verifiedReverseFrames>0);
 assert.ok(p.verifiedReverseFrames<95);
 assert.equal(p.finalShelterAssessment.meshVertexInsideCount,1617);
 assert.equal(p.finalShelterAssessment.meshVertexCount,1617);
 assert.equal(p.finalShelterAssessment.jointInsideCount,24);
 assert.equal(p.finalShelterAssessment.headInside,true);
 assert.equal(p.finalShelterAssessment.tailInside,true);
 assert.equal(p.finalShelterAssessment.fullBodyShelteredCandidate,true);
 assert.equal(p.everyNeutralMeshVertexInside,true);
 assert.equal(p.headOnlyInsufficient,true);
 assert.equal(p.sourceHeadTraveledBackwards,true);
 assert.equal(p.sourceStateUnmodified,true);
 assert.equal(p.bodyLengthAndRadiiUnchanged,true);
 assert.equal(p.playerGameMotionFramesCommitted,0);
 assert.equal(p.completedRealCaveNavigation,false);
 assert.equal(p.actualCoverRegionGeometryOnly,true);
 assert.equal(p.exactContinuous3DPhysicsCertified,false);
 assert.equal(p.skinApplied,false);
 assert.ok(p.finalHead.x<p.initialHead.x);
 assert.ok(p.finalTail.x<p.initialTail.x);
 assert.equal(p.progression.length,p.verifiedReverseFrames);
 assert.ok(p.maximumWholeBodyJointStepWorld<.018);
 assert.equal(JSON.stringify(sizedState),before);
 arrivals.push({stage,
  realStageLengthWorld:
   sizedState.pose.boneLengths.reduce((a,b)=>a+b,0),
  verifiedReverseFrames:p.verifiedReverseFrames,
  lastTailX:p.finalTail.x,
  lastHeadX:p.finalHead.x,
  coveredVertices:p.finalShelterAssessment.meshVertexInsideCount
 });
}
assert.equal(arrivals.length,4);
assert.ok(arrivals[3].realStageLengthWorld>
 arrivals[0].realStageLengthWorld);
assert.equal(JSON.stringify(canonicalPose),sourceJSON);
assert.equal(JSON.stringify({scene,terrain}),sceneJSON);

// Refusal without cover intention must NOT trigger retreat-to-hide.
const fake={...receipt,behavior:'sniff_then_turn'};
const noCover=previewSnakeRefusalRetreatToShelterV09y({
 receipt:fake,sizedState:source0,scene,terrain,shelter,
 maxFrames:95
});
assert.equal(noCover.ok,false);
assert.equal(noCover.reason,'refusal_hide_intent_or_source_invalid');
const accepted={...receipt,accepted:true};
const acceptedNotHide=previewSnakeRefusalRetreatToShelterV09y({
 receipt:accepted,sizedState:source0,scene,terrain,shelter
});
assert.equal(acceptedNotHide.ok,false);

// Fake cave too narrow or has a rock -> fail closed on the region
// regardless of whether the snake could push through the stone.
const blockedScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09y_blocked_cover',
 objects:[stone('source_rock_inside_cover',330,160,32,32,190)]
});
const blockedStart=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene:blockedScene,terrain,
 stageProgress:0,speedWorldPerSecond:.17
});
assert.equal(blockedStart.phase,'moving_sized');
const blockedRegion=F({...shelter,
 sceneId:blockedScene.sceneId,
 sceneRevision:blockedScene.revision});
const rock=inspectSnakeWholeMeshHideV09y({
 sizedState:blockedStart,scene:blockedScene,
 terrain,shelter:blockedRegion
});
assert.equal(rock.ok,false);
assert.equal(rock.reason,'shelter_volume_contains_source_rock');

// No falsely reported full-body hide on a too-short frame budget.
const budget=previewSnakeRefusalRetreatToShelterV09y({
 receipt,sizedState:source0,scene,terrain,
 shelter,maxFrames:1,seconds:.05
});
assert.equal(budget.ok,false);
assert.equal(budget.status,'budget_exhausted_without_whole_body_entry');
assert.equal(budget.verifiedReverseFrames,1);
assert.equal(budget.finalShelterAssessment.fullBodyShelteredCandidate,false);
assert.equal(budget.playerGameMotionFramesCommitted,0);

// Stale scene must reject reverse and never change whole-body pose.
const changedScene=F({...scene,revision:scene.revision+1});
const stale=advanceSnakeReverseStepV09y({
 state:source0,scene:changedScene,terrain,seconds:.05
});
assert.equal(stale.phase,'resting_safety_hold');
assert.equal(stale.verifiedFrames,0);
assert.deepEqual(stale.pose.points,source0.pose.points);
assert.equal(stale.actualSourceStepsCommittedOnRejectedFrame,0);
assert.equal(JSON.stringify(source0.pose),
 JSON.stringify(source0.initialPose));

console.log('PASS V0.9Y true stage-sized backward locomotion, replay-authenticated 3216 triangle reverse mesh safety, and ALL 1617 vertices sheltered for 4 stages');
console.log(JSON.stringify({
 exactFourStageRetreatAndShelter:arrivals,
 backwardHeadAndTailActuallyMoved:true,
 noForwardReplaySpoof:true,
 noForgedPoseOrSize:true,
 headAloneNotSufficient:true,
 all1617MeshVerticesRequired:true,
 tooLowRoofAndBlockedRockRefused:true,
 shelterIsAbstractVolumeNotRenderedCave:true,
 noExactContinuousPhysicsClaim:true,
 noPlayerSaveOrSkinWrites:true
}));
