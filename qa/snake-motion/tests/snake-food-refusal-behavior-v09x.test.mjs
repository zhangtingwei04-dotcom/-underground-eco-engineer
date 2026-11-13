import assert from 'node:assert/strict';
import {createSnakeFeedingLabV09w}
 from '../src/ohm-core/snake-feeding-digestion-v09w.mjs';
import {createSnakeFoodBehaviorLabV09x,
 offerSnakeFoodWithBehaviorV09x,
 advanceSnakeQuietWindowV09x,
 previewSnakeRefusalMotionV09x}
 from '../src/ohm-core/snake-food-refusal-behavior-v09x.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {startSnakeVariableSizeMotionV09t}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v09x_neutral_refusal_behavior_straight_ground',
 objects:[]
});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
const snapshot=JSON.stringify({canonicalPose,terrain,scene});
const babyNutrition=createSnakeFeedingLabV09w({
 individualId:'neutral_snake_01',randomSeed:375,
 stage:'juvenile',energyReserve:10
});
const initial=createSnakeFoodBehaviorLabV09x({
 feedingState:babyNutrition,
 refusalQuietHours:6,
 acceptedQuietHours:12
});
const starting=JSON.stringify(initial);
assert.equal(initial.quietUntilHour,0);
assert.equal(initial.foodPreference.prey_a,'preferred');
assert.equal(initial.foodPreference.prey_c,'disliked');
assert.equal(initial.foodPreference.prey_b,'neutral');

const refuse=offerSnakeFoodWithBehaviorV09x({
 session:initial,offerId:'first_refused',preyId:'prey_a',
 context:{preyStatus:'incompatible'}
});
assert.equal(refuse.ok,true);
assert.equal(refuse.offered,true);
assert.equal(refuse.refused,true);
assert.equal(refuse.accepted,false);
assert.equal(refuse.preyInventoryConsumed,false);
assert.equal(refuse.newNutritionAbsorbed,0);
assert.equal(refuse.bodySizeChanged,false);
assert.equal(refuse.relationshipPenalty,0);
assert.equal(refuse.session.feedingState.stomachEnergy,0);
assert.equal(refuse.session.feedingState.pendingNutritionGrowth,0);
assert.equal(refuse.quietUntilHour,6);
assert.equal(refuse.receipt.certainty,'observable_behavior_not_diagnosis');
assert.equal(refuse.receipt.privateAppetiteProfileNotPlayerDiagnostic,true);
assert.ok(['sniff_then_turn','pause_then_turn',
 'sniff_then_seek_cover'].includes(refuse.receipt.behavior));
const same=offerSnakeFoodWithBehaviorV09x({
 session:refuse.session,offerId:'first_refused',preyId:'prey_a',
 context:{preyStatus:'incompatible'}
});
assert.equal(same.ok,true);
assert.equal(same.duplicate,true);
assert.equal(same.offered,true);
assert.strictEqual(same.session,refuse.session);
assert.equal(same.newFeedingDecision,false);
assert.equal(same.preyInventoryConsumed,false);
const conflict=offerSnakeFoodWithBehaviorV09x({
 session:refuse.session,offerId:'first_refused',preyId:'prey_b',
 context:{preyStatus:'incompatible'}
});
assert.equal(conflict.ok,false);
assert.equal(conflict.reason,'conflicting_offer_id');
const bodyLen=refuse.session.feedingState.offerSequence;
const spam=offerSnakeFoodWithBehaviorV09x({
 session:refuse.session,offerId:'spam_attempt_1',preyId:'prey_c'
});
assert.equal(spam.ok,true);
assert.equal(spam.offered,false);
assert.equal(spam.refused,false);
assert.equal(spam.reason,'quiet_window');
assert.equal(spam.newFeedingDecision,false);
assert.equal(spam.noRepeatedAppetiteReroll,true);
assert.equal(spam.preyInventoryConsumed,false);
assert.strictEqual(spam.session,refuse.session);
assert.equal(spam.session.feedingState.offerSequence,bodyLen);
assert.equal(spam.session.receipts.length,1);
const spam2=offerSnakeFoodWithBehaviorV09x({
 session:refuse.session,offerId:'spam_attempt_2',preyId:'prey_a'
});
assert.equal(spam2.offered,false);
assert.strictEqual(spam2.session,refuse.session);
assert.equal(JSON.stringify(initial),starting);

const elapsed3=advanceSnakeQuietWindowV09x({
 session:refuse.session,hours:3
});
assert.equal(elapsed3.ok,true);
assert.equal(elapsed3.session.feedingState.worldHour,3);
assert.equal(elapsed3.quietWindowRemainingHours,3);
const after3=offerSnakeFoodWithBehaviorV09x({
 session:elapsed3.session,offerId:'new_while_quiet',preyId:'prey_b'
});
assert.equal(after3.offered,false);
assert.equal(after3.session.feedingState.offerSequence,1);
const elapsed6=advanceSnakeQuietWindowV09x({
 session:elapsed3.session,hours:3
});
assert.equal(elapsed6.ok,true);
assert.equal(elapsed6.quietWindowRemainingHours,0);
assert.equal(elapsed6.session.feedingState.worldHour,6);
const after6=offerSnakeFoodWithBehaviorV09x({
 session:elapsed6.session,offerId:'new_after_quiet',preyId:'prey_b',
 context:{preyStatus:'incompatible'}
});
assert.equal(after6.offered,true);
assert.equal(after6.session.feedingState.offerSequence,2);
assert.equal(after6.refused,true);
assert.equal(after6.preyInventoryConsumed,false);

// Food preference is per-individual and changes only the chance,
// never overrides unsafe prey. This is a synthetic stochastic
// regression, NOT species palatability or measured appetite rates.
const tallies={preferred:0,neutral:0,disliked:0};
for(const pref of ['preferred','neutral','disliked']){
 for(let seed=0;seed<120;seed++){
  const feedingState=createSnakeFeedingLabV09w({
   individualId:'neutral_preference_test',
   randomSeed:seed,stage:'juvenile',energyReserve:10
  });
  const session=createSnakeFoodBehaviorLabV09x({
   feedingState,foodPreference:{prey_a:pref}
  });
  const out=offerSnakeFoodWithBehaviorV09x({
   session,offerId:'same_neutral_offer',
   preyId:'prey_a'
  });
  assert.equal(out.ok,true);
  assert.equal(out.offered,true);
  tallies[pref]+=Number(out.refused);
 }
}
assert.ok(tallies.preferred<tallies.neutral,
 'preferred prey should be less often refused in synthetic tests');
assert.ok(tallies.neutral<tallies.disliked,
 'disliked prey should be more often refused in synthetic tests');

// Acceptance starts a longer quiet period; W still blocks feeding
// while digesting even after a quiet period ends.
let accepted=null;
for(let seed=0;seed<100;seed++){
 const food=createSnakeFeedingLabV09w({
  individualId:'neutral_acceptance_test',randomSeed:seed,
  stage:'juvenile',energyReserve:10
 });
 const session=createSnakeFoodBehaviorLabV09x({feedingState:food});
 const r=offerSnakeFoodWithBehaviorV09x({
  session,offerId:'fresh_offer',preyId:'prey_a'
 });
 if(r.ok&&r.accepted){accepted=r;break;}
}
assert.ok(accepted);
assert.equal(accepted.receipt.behavior,'accepted_food');
assert.equal(accepted.quietUntilHour,12);
assert.equal(accepted.session.feedingState.stomachEnergy,14);
assert.equal(accepted.preyInventoryConsumed,false);
assert.equal(accepted.preyInventoryConsumptionRequested,true);
assert.equal(accepted.session.feedingState.pendingNutritionGrowth,0);
const quietAfterEating=offerSnakeFoodWithBehaviorV09x({
 session:accepted.session,offerId:'too_many_food_offers'
});
assert.equal(quietAfterEating.offered,false);
assert.strictEqual(quietAfterEating.session,accepted.session);
const twelve=advanceSnakeQuietWindowV09x({
 session:accepted.session,hours:12
});
assert.equal(twelve.ok,true);
assert.equal(twelve.quietWindowRemainingHours,0);
const stillDigesting=offerSnakeFoodWithBehaviorV09x({
 session:twelve.session,offerId:'stomach_not_empty'
});
assert.equal(stillDigesting.offered,true);
assert.equal(stillDigesting.refused,true);
assert.equal(stillDigesting.receipt.behavior!=='accepted_food',true);
assert.equal(stillDigesting.preyInventoryConsumed,false);

// V0.9X behavior uses V0.9U/S mesh checks on REAL V0.9T
// independently sized 24-joint skeletons. Sniffing checks 3 static
// mesh transitions without moving body; actual turn has 4 safe
// source-replay-verified pose transitions.
const behaviorRuns=[],presentBehaviorTypes=new Set();
for(const stage of [0,1,2,3]){
 const sizedState=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose,scene,terrain,stageProgress:stage
 });
 assert.equal(sizedState.phase,'moving_sized');
 const frozen=JSON.stringify(sizedState);
 for(const seed of [101,102,103,104,105,106,107,108,109]){
  const state=createSnakeFeedingLabV09w({
   individualId:'snake_motion_test',randomSeed:seed,
   stage:'juvenile'
  });
  const b=createSnakeFoodBehaviorLabV09x({feedingState:state});
  const refused=offerSnakeFoodWithBehaviorV09x({
   session:b,offerId:'not_suitable_this_time',
   preyId:'prey_a',context:{preyStatus:'incompatible'}
  });
  assert.equal(refused.refused,true);
  const sign=seed%2===0?-1:1;
  const p=previewSnakeRefusalMotionV09x({
   receipt:refused.receipt,sizedState,scene,terrain,
   turnSign:sign
  });
  assert.equal(p.ok,true,
   'stage '+stage+' seed '+seed+' '+p.reason+' '+
    p.meshReason+' '+p.sourceReason);
  assert.equal(p.stagesChecked,7);
  assert.equal(p.initialSourceFrame,0);
  assert.equal(p.finalSourceFrameShadow,4);
  assert.equal(p.noBodyMotionDuringSniff,true);
  assert.equal(p.validatedTurnFrames,4);
  assert.equal(p.bodyMeshVertices,1617);
  assert.equal(p.bodyMeshTriangles,3216);
  assert.equal(p.stableBoneLengths,true);
  assert.equal(p.stableBodyRadii,true);
  assert.equal(p.actualCoverLocated,false);
  assert.equal(p.actualHideArrival,false);
  assert.equal(p.backwardsRetreatImplemented,false);
  assert.equal(p.allMotionFromSizedV09tSource,true);
  assert.equal(p.headBodyWeldedAnd3DSurfaceChecked,true);
  assert.equal(p.originalV09tStateUntouched,true);
  assert.equal(p.formalGameFramesCommitted,0);
  assert.equal(p.exactContinuous3DPhysicsCertified,false);
  assert.equal(p.formalAnimalSaveModified,false);
  assert.equal(p.skinApplied,false);
  assert.equal(p.stages.filter(x=>!x.bodyMotion).length,3);
  assert.equal(p.stages.filter(x=>x.bodyMotion).length,4);
  assert.ok(p.stages.every(x=>x.meshTrianglesChecked===3216));
  assert.equal(JSON.stringify(sizedState),frozen);
  presentBehaviorTypes.add(p.behavior);
  behaviorRuns.push({stage,seed,behavior:p.behavior,
   frames:p.validatedTurnFrames,stageSourceLength:
    sizedState.pose.boneLengths.reduce((a,b)=>a+b,0)});
 }
}
assert.equal(behaviorRuns.length,4*9);
assert.equal(presentBehaviorTypes.size,3,
 'neutral behavior planner should show all 3 safe labels across seeds');
const rejectedAccepted=previewSnakeRefusalMotionV09x({
 receipt:accepted.receipt,
 sizedState:startSnakeVariableSizeMotionV09t({
  canonicalSourcePose,scene,terrain,stageProgress:0
 }),scene,terrain
});
assert.equal(rejectedAccepted.ok,false);
assert.equal(rejectedAccepted.reason,'invalid_refusal_motion_request');
const rejectedImpossible=previewSnakeRefusalMotionV09x({
 receipt:refuse.receipt,sizedState:null,scene,terrain
});
assert.equal(rejectedImpossible.ok,false);

// Existing neutral scene, food/state fixtures and canonical adult
// reference remain unmodified; no real player animal/feed inventory.
assert.equal(JSON.stringify({canonicalPose,terrain,scene}),snapshot);
assert.equal(JSON.stringify(initial),starting);
console.log('PASS V0.9X refusal quiet-window, individual neutral food preference, witnessed behavior and stage-sized V0.9T/U/S 3D-checked sniff/turn');
console.log(JSON.stringify({
 syntheticPreferenceRefusalsPer120:tallies,
 immediateRetryBlockedWithoutRngReroll:true,
 feedOfferLedgerIdempotent:true,
 mealOnlyRequestsInventoryDeduction:true,
 realDigestingStateCannotRefuelImmediately:true,
 behaviorKinds:[...presentBehaviorTypes],
 distinct4Stage9SeedTrials:behaviorRuns.length,
 validatedV09tSourceTurnFrames:behaviorRuns.length*4,
 checked3216FaceHeadBodyFrames:behaviorRuns.length*7,
 stationarySniffNoBodyTranslation:true,
 seekingCoverIsIntentionOnly:true,
 growthOnlyViaExistingV09vRest:true,
 noRealFeedingIntervalsClaimed:true,
 noLiveGameSaveOrSkinChanged:true
}));
