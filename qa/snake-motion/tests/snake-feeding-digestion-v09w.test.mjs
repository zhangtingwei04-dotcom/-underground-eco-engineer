import assert from 'node:assert/strict';
import {
 createSnakeFeedingLabV09w,
 offerSnakeFoodV09w,
 advanceSnakeDigestionV09w,
 queueAbsorbedGrowthForSafeRestV09w
} from '../src/ohm-core/snake-feeding-digestion-v09w.mjs';
import {startSnakeVariableSizeMotionV09t}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeRestGrowthSessionV09v,enterSnakeGrowthRestV09v,
 applySnakeSafeRestGrowthV09v,resumeSnakeAfterGrowthRestV09v,
 advanceSnakeGrowthMotionV09v
} from '../src/ohm-core/snake-rest-growth-lifecycle-v09v.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v09w_neutral_safe_nutrition',objects:[]
});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
const source=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene,terrain,stageProgress:0
});
assert.equal(source.phase,'moving_sized');
const originalSource=JSON.stringify(source);
const originalCanonical=JSON.stringify(canonicalPose);
const originalScene=JSON.stringify({scene,terrain});
const initial=createSnakeFeedingLabV09w({
 individualId:'neutral_snake_01',randomSeed:971,
 stage:'juvenile',energyReserve:10
});
const initialJSON=JSON.stringify(initial);
assert.equal(initial.stomachEnergy,0);
assert.equal(initial.pendingNutritionGrowth,0);
assert.equal(initial.energyReserve,10);

// All explicit hard refusals are safe: no prey removed, no stomach
// contents, no nutrient absorption or instant growth.
const hardCases=[
 [{thermalStatus:'unsafe'},'environment_not_suitable'],
 [{preyStatus:'incompatible'},'prey_not_appropriate'],
 [{preyStatus:'too_large'},'prey_size_not_safe']
];
for(const [context,reason] of hardCases){
 const out=offerSnakeFoodV09w({
  state:initial,offerId:'reject_'+reason,context
 });
 assert.equal(out.ok,true);
 assert.equal(out.accepted,false);
 assert.equal(out.refused,true);
 assert.equal(out.decision.possibleDriver,reason);
 assert.equal(out.decision.certainty,
  'behavior_observed_cause_not_diagnosed');
 assert.equal(out.actualFoodEnergyAccepted,0);
 assert.equal(out.actualNutrientsAbsorbedNow,0);
 assert.equal(out.growthAddedNow,0);
 assert.equal(out.preyInventoryConsumed,false);
 assert.equal(out.relationPenaltyFromRefusal,0);
 assert.equal(out.state.stomachEnergy,0);
 assert.equal(out.state.pendingNutritionGrowth,0);
 assert.equal(out.state.consecutiveRefusals,1);
 assert.equal(out.state.energyReserve,initial.energyReserve);
}

// Pre-shed, elevated disturbance, low activity season and unusual
// breeding circumstances increase refusal likelihood (NOT a fixed
// rule every snake always refuses; same seed+event is repeatable).
const contexts=[
 {},{preShed:true},{disturbance:'severe'},
 {seasonalQuiet:true},{breedingContext:true}
];
const observed=[];
for(const context of contexts){
 let refused=0;
 for(let seed=0;seed<100;seed++){
  const state=createSnakeFeedingLabV09w({
   individualId:'sampled_neutral',randomSeed:seed,
   energyReserve:10
  });
  const result=offerSnakeFoodV09w({
   state,offerId:'feed_event',context
  });
  refused+=Number(result.refused);
  const repeated=offerSnakeFoodV09w({
   state,offerId:'feed_event',context
  });
  assert.equal(repeated.accepted,result.accepted);
  assert.equal(repeated.decision.possibleDriver,
   result.decision.possibleDriver);
 }
 observed.push(refused);
}
assert.ok(observed[0]>=1&&observed[0]<=30,
 'normal appetite still has natural variation');
assert.ok(observed[1]>observed[0]+50);
assert.ok(observed[2]>observed[0]+40);
assert.ok(observed[3]>observed[0]+15);
assert.ok(observed[4]>observed[0]+15);

// The same offer ID cannot be replayed to earn energy twice or
// deduct prey twice; unknown keys such as "autoGrowNow" are blocked.
const accepted=Array.from({length:80},(_,i)=>
 offerSnakeFoodV09w({
  state:initial,offerId:'normal_offer_'+i,
  context:{mealEnergy:16}
 })).find(x=>x.ok&&x.accepted);
assert.ok(accepted,'healthy neutral animal accepts some suitable offers');
assert.equal(accepted.state.stomachEnergy,16);
assert.equal(accepted.state.digestionHoursRemaining,48);
assert.equal(accepted.state.pendingNutritionGrowth,0);
assert.equal(accepted.state.energyReserve,10);
assert.equal(accepted.actualNutrientsAbsorbedNow,0);
assert.equal(accepted.growthAddedNow,0);
assert.equal(accepted.preyInventoryConsumed,true);
const duplicate=offerSnakeFoodV09w({
 state:accepted.state,offerId:accepted.decision.offerId,
 context:{mealEnergy:16}
});
assert.equal(duplicate.ok,true);
assert.equal(duplicate.duplicate,true);
assert.strictEqual(duplicate.state,accepted.state);
assert.equal(duplicate.newFoodConsumed,false);
assert.equal(duplicate.preyInventoryConsumed,false);
assert.equal(accepted.state.offers.length,1);
const digesting=offerSnakeFoodV09w({
 state:accepted.state,offerId:'too_soon'
});
assert.equal(digesting.refused,true);
assert.equal(digesting.decision.possibleDriver,'already_digesting');
assert.equal(digesting.preyInventoryConsumed,false);
assert.equal(digesting.state.stomachEnergy,16);
assert.equal(digesting.state.pendingNutritionGrowth,0);
assert.equal(offerSnakeFoodV09w({
 state:initial,offerId:'evil_growth',
 context:{growthNow:999}
}).ok,false);
assert.equal(offerSnakeFoodV09w({
 state:initial,offerId:'evil_meal',
 context:{mealEnergy:200}
}).ok,false);

// The snake uses environmental time to digest. Unsuitable
// temperature never magically accelerates digestion/growth.
const badThermal=advanceSnakeDigestionV09w({
 state:accepted.state,hours:12,thermalStatus:'unsafe'
});
assert.equal(badThermal.ok,true);
assert.equal(badThermal.absorbedEnergy,0);
assert.equal(badThermal.actualGrowthPotentialAdded,0);
assert.equal(badThermal.state.stomachEnergy,16);
assert.equal(badThermal.state.pendingNutritionGrowth,0);
assert.ok(badThermal.state.energyReserve<10);
const cool=advanceSnakeDigestionV09w({
 state:accepted.state,hours:12,thermalStatus:'suboptimal'
});
const warm=advanceSnakeDigestionV09w({
 state:accepted.state,hours:12,thermalStatus:'optimal'
});
assert.ok(cool.absorbedEnergy<warm.absorbedEnergy);
assert.ok(cool.state.stomachEnergy>warm.state.stomachEnergy);

const first=advanceSnakeDigestionV09w({
 state:accepted.state,hours:24
});
assert.equal(first.ok,true);
assert.ok(first.absorbedEnergy>0);
assert.ok(first.actualGrowthPotentialAdded>0);
assert.ok(first.state.stomachEnergy>0);
assert.ok(first.state.stomachEnergy<16);
assert.equal(first.bodyLengthUnchanged,true);
assert.equal(first.boneLengthsAndRadiiUnchanged,true);
const next=advanceSnakeDigestionV09w({
 state:first.state,hours:24
});
assert.equal(next.ok,true);
assert.equal(next.state.stomachEnergy,0);
assert.equal(next.state.digestionHoursRemaining,0);
assert.ok(next.state.pendingNutritionGrowth>
 first.state.pendingNutritionGrowth);
assert.ok(next.state.energyReserve>10);
assert.equal(next.state.worldHour,48);
assert.equal(JSON.stringify(source),originalSource);

// No eating -> time and metabolic maintenance alone do NOT
// produce growth; do not punish the player via relationship loss.
const noMeal=advanceSnakeDigestionV09w({
 state:initial,hours:48
});
assert.equal(noMeal.ok,true);
assert.equal(noMeal.state.pendingNutritionGrowth,0);
assert.ok(noMeal.state.energyReserve<initial.energyReserve);
assert.equal(noMeal.bodyLengthUnchanged,true);

// Refusal observation warnings use deteriorating body condition or
// additional concerning signs, NOT arbitrary refusal counts alone.
let refusals=initial;
for(let i=0;i<4;i++){
 const out=offerSnakeFoodV09w({
  state:refusals,offerId:'hard_temperature_'+i,
  context:{thermalStatus:'unsafe',bodyConditionTrend:'normal'}
 });
 assert.equal(out.refused,true);
 assert.equal(out.decision.suggestedObservation,
  'observe_without_punishment');
 refusals=out.state;
}
assert.equal(refusals.consecutiveRefusals,4);
const worsening=offerSnakeFoodV09w({
 state:refusals,offerId:'declining_temperature',
 context:{thermalStatus:'unsafe',bodyConditionTrend:'decreasing'}
});
assert.equal(worsening.decision.suggestedObservation,
 'review_conditions_and_seek_expert_if_persistent');
const concerning=offerSnakeFoodV09w({
 state:initial,offerId:'concerning_01',
 context:{thermalStatus:'unsafe',additionalConcerningSigns:true}
});
assert.equal(concerning.decision.suggestedObservation,
 'review_conditions_and_seek_expert_if_persistent');

// V0.9V integration: absorbed surplus moves ONLY to PENDING
// growth; it cannot update any 24-joint pose while moving.
let restSession=createSnakeRestGrowthSessionV09v({
 motionState:source,scene,terrain
});
assert.equal(restSession.phase,'moving');
const queued=queueAbsorbedGrowthForSafeRestV09w({
 nutritionState:next.state,restGrowthSession:restSession
});
assert.equal(queued.ok,true);
assert.ok(queued.transferred>0);
assert.equal(queued.actualBodySizeChanged,false);
assert.equal(queued.V09VGeometryNotTouched,true);
assert.equal(queued.restGrowthSession.phase,'moving');
assert.strictEqual(queued.restGrowthSession.motionState,source);
assert.equal(queued.restGrowthSession.pendingGrowth,
 queued.transferred);
assert.ok(queued.nutritionState.pendingNutritionGrowth<1e-8);
const emptyTransfer=queueAbsorbedGrowthForSafeRestV09w({
 nutritionState:queued.nutritionState,
 restGrowthSession:queued.restGrowthSession
});
assert.equal(emptyTransfer.transferred,0);
assert.equal(emptyTransfer.restGrowthSession,
 queued.restGrowthSession);
const bodyBefore=JSON.stringify(source.pose);
let startRest=enterSnakeGrowthRestV09v({
 session:queued.restGrowthSession,scene,terrain
});
assert.equal(startRest.ok,true);
assert.equal(startRest.session.phase,'resting');
assert.equal(JSON.stringify(startRest.session.motionState.pose),
 bodyBefore);
const growth=applySnakeSafeRestGrowthV09v({
 session:startRest.session,scene,terrain
});
assert.equal(growth.ok,true,
 'absorbed nutrition should support a legal SMALL rest growth');
assert.equal(growth.stageStepCommitted,1);
assert.equal(growth.growthOnlyWhileResting,true);
assert.equal(growth.fullMeshSurfaceSafety.ok,true);
assert.notEqual(JSON.stringify(growth.session.motionState.pose),
 bodyBefore);
assert.equal(growth.session.motionState.verifiedFrames,0);
const resumed=resumeSnakeAfterGrowthRestV09v({
 session:growth.session,scene,terrain
});
assert.equal(resumed.ok,true);
assert.equal(resumed.session.phase,'moving');
const againMoving=advanceSnakeGrowthMotionV09v({
 session:resumed.session,scene,terrain
});
assert.equal(againMoving.ok,true);
assert.equal(againMoving.session.motionState.verifiedFrames,1);
assert.equal(againMoving.stageStepCommitted,0);
assert.equal(againMoving.boneLengthsSame,true);
assert.equal(againMoving.radiiSame,true);
assert.equal(againMoving.noPlayerSaveWritten,true);
assert.equal(againMoving.skinApplied,false);

// Rejected meals, clock time and the lab itself cannot mutate the
// original 24-joint source, scene, or canonical pose.
assert.equal(JSON.stringify(source),originalSource);
assert.equal(JSON.stringify(canonicalPose),originalCanonical);
assert.equal(JSON.stringify({scene,terrain}),originalScene);
assert.equal(JSON.stringify(initial),initialJSON);
console.log('PASS V0.9W refusal > digestion > maintenance/reserve > absorbed-growth queue > V0.9V safe REST ONLY geometry, with no overeating or refused-food growth');
console.log(JSON.stringify({
 deterministicRefusalRatesOver100SyntheticSeeds:{
  ordinary:observed[0],preShed:observed[1],
  severeDisturbance:observed[2],
  seasonalQuiet:observed[3],breedingContext:observed[4]
 },
 unsafePreyAndThermalHardRefusals:hardCases.length,
 acceptedMealImmediateNutrients:accepted.actualNutrientsAbsorbedNow,
 absorbedAfter48SyntheticHours:first.absorbedEnergy+
  next.absorbedEnergy,
 growthPotentialFromAbsorption:next.state.pendingNutritionGrowth,
 queueTransferredToV09V:queued.transferred,
 stageProgressAfterSafeRest:growth.session.appliedStageProgress,
 nativeSkeletonPoseOriginalUnchanged:true,
 refusedMealsDoNotConsumePreyOrGrow:true,
 healthConcernsAreObservationsNotDiagnoses:true,
 refusalOnlyWithoutDeteriorationNoAutomaticIllness:true,
 exactBiologicalRatesCertified:false,
 formalPlayerSaveModified:false
}));
