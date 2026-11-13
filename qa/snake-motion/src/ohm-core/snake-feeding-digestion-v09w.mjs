/**
 * Project OHM V0.9W PUBLIC SYNTHETIC FEEDING/NUTRITION LAB.
 *
 * Design is informed by public veterinary discussions of snake appetite
 * and digestion, but ALL numerical parameters below are deliberately
 * synthetic and must NOT be used for husbandry, real species feeding,
 * disease diagnosis, temperatures, meal frequency, or growth rates.
 *
 * Feeding offer -> ACCEPT/REFUSE (independent, deterministic event);
 * accepted meal -> undigested stomach contents (NO instant growth);
 * elapsed simulated hours and suitable microclimate -> absorption;
 * energy first supports maintenance, then reserve and possible growth;
 * growth accumulates as pending potential for V0.9V REST ONLY.
 *
 * No skin/art, no live animal data, no external AI, no player save.
 * Source facts are not derived from a user's diagnosis or medical advice.
 */
import {accumulateSnakeGrowthPotentialV09v}
 from './snake-rest-growth-lifecycle-v09v.mjs';

export const SNAKE_FEEDING_NUTRITION_V09W_VERSION='0.9W';
const F=Object.freeze;
const isFiniteNumber=x=>typeof x==='number'&&Number.isFinite(x);
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const validID=x=>typeof x==='string'&&ID.test(x);
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const round=x=>Math.round(x*1e10)/1e10;
const error=(reason,extra={})=>F({
 version:SNAKE_FEEDING_NUTRITION_V09W_VERSION,
 ok:false,reason,...extra,playerSaveModified:false,
 actualBodySizeChanged:false,skinApplied:false
});
function pseudoRandom(seed,text){
 // Stable (but NOT cryptographically secure) event pseudo-randomness.
 let x=(seed>>>0)^2166136261;
 for(let i=0;i<text.length;i++){
  x=Math.imul(x^text.charCodeAt(i),16777619)>>>0;
 }
 x^=x>>>16;x=Math.imul(x,2246822507)>>>0;
 x^=x>>>13;x=Math.imul(x,3266489909)>>>0;
 x^=x>>>16;
 return (x>>>0)/4294967296;
}
function readable(state){
 return state?.version==='0.9W'&&
  validID(state.individualId)&&
  Number.isInteger(state.randomSeed)&&
  state.randomSeed>=0&&state.randomSeed<=4294967295&&
  isFiniteNumber(state.worldHour)&&state.worldHour>=0&&
  Number.isInteger(state.offerSequence)&&state.offerSequence>=0&&
  isFiniteNumber(state.energyReserve)&&state.energyReserve>=0&&
  state.energyReserve<=80&&
  isFiniteNumber(state.stomachEnergy)&&state.stomachEnergy>=0&&
  state.stomachEnergy<=30&&
  isFiniteNumber(state.digestionHoursRemaining)&&
  state.digestionHoursRemaining>=0&&
  isFiniteNumber(state.pendingNutritionGrowth)&&
  state.pendingNutritionGrowth>=0&&
  state.pendingNutritionGrowth<=.3+1e-9&&
  ['juvenile','growing','adult','large_adult'].includes(state.stage)&&
  Number.isInteger(state.consecutiveRefusals)&&
  state.consecutiveRefusals>=0&&
  Array.isArray(state.offers)&&state.offers.length<=64&&
  state.offers.every(o=>o&&validID(o.offerId))&&
  new Set(state.offers.map(o=>o.offerId)).size===state.offers.length;
}
function offerInputs(input){
 return input&&typeof input==='object'&&
  ['optimal','suboptimal','unsafe'].includes(input.thermalStatus)&&
  ['normal','elevated','severe'].includes(input.disturbance)&&
  ['normal','decreasing','unknown'].includes(input.bodyConditionTrend)&&
  ['normal','low'].includes(input.hydrationStatus)&&
  ['appropriate','incompatible','too_large'].includes(input.preyStatus)&&
  typeof input.preShed==='boolean'&&
  typeof input.shedding==='boolean'&&
  typeof input.seasonalQuiet==='boolean'&&
  typeof input.breedingContext==='boolean'&&
  typeof input.additionalConcerningSigns==='boolean'&&
  isFiniteNumber(input.mealEnergy)&&input.mealEnergy>=.5&&
  input.mealEnergy<=25;
}
const defaultOffer=F({
 thermalStatus:'optimal',disturbance:'normal',
 bodyConditionTrend:'normal',hydrationStatus:'normal',
 preyStatus:'appropriate',preShed:false,shedding:false,
 seasonalQuiet:false,breedingContext:false,
 additionalConcerningSigns:false,mealEnergy:14
});
function evaluateRefusal(state,context,offerId){
 if(state.stomachEnergy>1e-8)return F({
  refused:true,code:'already_digesting',probability:1,roll:null});
 if(context.preyStatus==='incompatible')return F({
  refused:true,code:'prey_not_appropriate',probability:1,roll:null});
 if(context.preyStatus==='too_large')return F({
  refused:true,code:'prey_size_not_safe',probability:1,roll:null});
 if(context.thermalStatus==='unsafe')return F({
  refused:true,code:'environment_not_suitable',probability:1,roll:null});
 const risks=[];
 let chance=.10;
 if(state.energyReserve>22){chance+=.35;risks.push('low_immediate_appetite');}
 if(context.preShed||context.shedding){
  chance+=.73;risks.push('pre_shed_or_shedding');
 }
 if(context.disturbance==='elevated'){
  chance+=.27;risks.push('disturbance');
 }
 if(context.disturbance==='severe'){
  chance+=.65;risks.push('disturbance');
 }
 if(context.thermalStatus==='suboptimal'){
  chance+=.40;risks.push('temperature_condition');
 }
 if(context.hydrationStatus==='low'){
  chance+=.17;risks.push('hydration_condition');
 }
 if(context.seasonalQuiet){
  chance+=.34;risks.push('seasonal_state');
 }
 if(context.breedingContext){
  chance+=.30;risks.push('breeding_context');
 }
 if(context.additionalConcerningSigns){
  chance+=.24;risks.push('other_health_signs_need_review');
 }
 const probability=clamp(chance,.035,.98);
 const roll=pseudoRandom(state.randomSeed,
  state.individualId+'|'+offerId+'|'+state.offerSequence);
 return F({refused:roll<probability,
  code:roll<probability?(risks[0]??'normal_appetite_variation'):null,
  possibleDrivers:F(risks),probability,roll});
}
function observationLevel(state,context,refused){
 // Not a diagnosis or species-specific medical threshold.
 // Repeated refusals alone must NOT cause an automatic illness label.
 if(context.additionalConcerningSigns||
  (refused&&context.bodyConditionTrend==='decreasing'&&
   state.consecutiveRefusals>=2))
  return 'review_conditions_and_seek_expert_if_persistent';
 return refused?'observe_without_punishment':'routine_observation';
}
/** Construct neutral animal state; not a saved-player-world schema. */
export function createSnakeFeedingLabV09w({
 individualId='synthetic_snake',randomSeed=971,
 stage='juvenile',energyReserve=10
}={}){
 if(!validID(individualId)||
  !Number.isInteger(randomSeed)||randomSeed<0||
  randomSeed>4294967295||
  !['juvenile','growing','adult','large_adult'].includes(stage)||
  !isFiniteNumber(energyReserve)||energyReserve<0||
  energyReserve>80)
  throw new RangeError('v09w_invalid_neutral_fixture');
 return F({version:'0.9W',individualId,randomSeed,stage,
  worldHour:0,offerSequence:0,energyReserve,
  stomachEnergy:0,digestionHoursRemaining:0,
  pendingNutritionGrowth:0,consecutiveRefusals:0,
  lastAcceptedAtHour:null,offers:F([]),
  formalAnimalModelIntegrated:false,
  fixedSizeDuringMoving:true,
  usesSyntheticNutritionUnits:true,
  saveModified:false,skinApplied:false});
}
/**
 * A food OFFER is not an accepted meal. Refusal cannot start
 * digestion, add nutrients, spend player inventory, alter relations,
 * or force a health diagnosis. A repeated offerId is idempotent.
 */
export function offerSnakeFoodV09w({
 state,offerId,context={}
}={}){
 if(!readable(state)||!validID(offerId))return error('invalid_offer_state_or_id');
 if(!context||typeof context!=='object'||Array.isArray(context))
  return error('invalid_food_offer_context');
 const supplied={...defaultOffer,...context};
 if(!offerInputs(supplied)||
  Object.keys(context).some(k=>!Object.hasOwn(defaultOffer,k)))
  return error('invalid_food_offer_context');
 const offerFingerprint=JSON.stringify(supplied);
 const old=state.offers.find(o=>o.offerId===offerId);
 if(old)return old.offerFingerprint!==offerFingerprint?
  error('conflicting_offer_id'):
  F({version:'0.9W',ok:true,duplicate:true,
   state,decision:old,accepted:old.accepted,
   preyInventoryConsumed:false,
   preyInventoryConsumptionRequested:false,
   newFoodConsumed:false,actualBodySizeChanged:false,
   playerSaveModified:false});
 if(state.offers.length>=64)return error('feed_offer_ledger_full');
 const decision=evaluateRefusal(state,supplied,offerId);
 const accepted=!decision.refused;
 const refusals=accepted?0:state.consecutiveRefusals+1;
 const level=observationLevel({...state,
  consecutiveRefusals:refusals},supplied,!accepted);
 const receipt=F({
  offerId,offerFingerprint,worldHour:state.worldHour,
  accepted,refused:!accepted,
  publicBehavior:accepted?'swallowed_prey':'did_not_eat',
  possibleDriver:decision.code,
  // A player should not get a precise diagnosis from hidden stats.
  certainty:'behavior_observed_cause_not_diagnosed',
  suggestedObservation:level,
  deterministicForSameStateAndOffer:true,
  appetiteProbabilityForQA:decision.probability,
  animationNotCreated:true
 });
 const next=F({...state,
  offerSequence:state.offerSequence+1,
  offers:F([...state.offers,receipt]),
  consecutiveRefusals:refusals,
  ...(accepted?{
   stomachEnergy:supplied.mealEnergy,
   // 48 hours is a SYNTHETIC fixture, NOT species advice.
   digestionHoursRemaining:48,
   lastAcceptedAtHour:state.worldHour
  }:{}),
  // Even accepted food produces ZERO immediate growth.
  pendingNutritionGrowth:state.pendingNutritionGrowth
 });
 return F({version:'0.9W',ok:true,duplicate:false,
  accepted,refused:!accepted,decision:receipt,state:next,
  actualFoodEnergyAccepted:accepted?supplied.mealEnergy:0,
  actualNutrientsAbsorbedNow:0,
  growthAddedNow:0,
  preyInventoryConsumed:false,
  preyInventoryConsumptionRequested:accepted,
  shouldDeductPlayerPreyOnlyAfterVerifiedAcceptance:accepted,
  relationPenaltyFromRefusal:0,
  actualBodySizeChanged:false,
  playerSaveModified:false,skinApplied:false});
}
/** Advance physiological bookkeeping by simulated time, not by
 * number of feeding button presses. Growth arises only from
 * absorbed surplus after maintenance; no absorption => no growth.
 *
 * Thermal/hydration coefficients below are deliberately synthetic,
 * not measured snake species/temperature targets.
 */
export function advanceSnakeDigestionV09w({
 state,hours=1,
 thermalStatus='optimal',hydrationStatus='normal',
 bodyConditionTrend='normal'
}={}){
 if(!readable(state)||!isFiniteNumber(hours)||
  hours<=0||hours>48||
  !['optimal','suboptimal','unsafe'].includes(thermalStatus)||
  !['normal','low'].includes(hydrationStatus)||
  !['normal','decreasing','unknown'].includes(bodyConditionTrend))
  return error('invalid_digestion_step');
 const fraction=thermalStatus==='optimal'?1:
  thermalStatus==='suboptimal'?.4:0;
 const supportedFraction=hydrationStatus==='low'?.6:1;
 const effectiveHours=hours*fraction*supportedFraction;
 const broken=state.stomachEnergy===0?0:
  state.stomachEnergy*Math.min(1,effectiveHours/
   Math.max(.000001,state.digestionHoursRemaining));
 const absorbed=broken*.8;
 const unabsorbed=broken-absorbed;
 const rawRemaining=state.stomachEnergy-broken;
 const stomachEnergy=rawRemaining<1e-8?0:round(rawRemaining);
 const digestRemaining=stomachEnergy===0?0:
  round(Math.max(0,state.digestionHoursRemaining-effectiveHours));
 const costPerHour=state.stage==='juvenile'?.045:
  state.stage==='growing'?.04:.035;
 const maintenance=round(hours*costPerHour);
 const energyToMaintenance=Math.min(absorbed,maintenance);
 const reserveUsed=Math.min(state.energyReserve,
  maintenance-energyToMaintenance);
 const surplus=Math.max(0,absorbed-energyToMaintenance);
 const physicalStateSafe=thermalStatus!=='unsafe'&&
  hydrationStatus==='normal'&&
  bodyConditionTrend!=='decreasing';
 const growthEnergy=physicalStateSafe?
  Math.min(surplus*.28,
   Math.max(0,.3-state.pendingNutritionGrowth)/.001):0;
 const growthDelta=round(growthEnergy*.001);
 const unallocated=surplus-growthEnergy;
 const reserve=clamp(round(state.energyReserve-
  reserveUsed+unallocated),0,80);
 const excessCannotStore=Math.max(0,
  round(state.energyReserve-reserveUsed+
   unallocated-reserve));
 const pending=clamp(round(state.pendingNutritionGrowth+
  growthDelta),0,.3);
 const next=F({...state,
  worldHour:round(state.worldHour+hours),
  energyReserve:reserve,
  stomachEnergy,
  digestionHoursRemaining:digestRemaining,
  pendingNutritionGrowth:pending
 });
 return F({version:'0.9W',ok:true,state:next,
  elapsedHours:hours,
  absorbedEnergy:round(absorbed),
  maintenanceEnergy:maintenance,
  reserveEnergyUsed:round(reserveUsed),
  unassimilatedDigestEnergy:round(unabsorbed),
  actualGrowthPotentialAdded:growthDelta,
  excessEnergyNotModeledAsAutomaticLength:round(excessCannotStore),
  digestionPausedByUnsafeTemperature:
   thermalStatus==='unsafe',
  bodyLengthUnchanged:true,
  boneLengthsAndRadiiUnchanged:true,
  noArtificialGrowthDuringMovement:true,
  noBodyChangeBeforeSafeRest:true,
  playerSaveModified:false,skinApplied:false});
}
/**
 * Transfer already ABSORBED nutrition growth progress to V0.9V's
 * existing queue. It does NOT call applySnakeSafeRestGrowthV09v.
 * Growth geometry remains limited to V0.9V safe REST.
 *
 * This prototype has no cryptographic actor/animal authentication.
 * The formal host MUST bind both states to the SAME animal.
 */
export function queueAbsorbedGrowthForSafeRestV09w({
 nutritionState,restGrowthSession
}={}){
 if(!readable(nutritionState)||
  restGrowthSession?.version!=='0.9V'||
  !isFiniteNumber(restGrowthSession.pendingGrowth)||
  !isFiniteNumber(restGrowthSession.appliedStageProgress))
  return error('invalid_growth_queue_binding');
 const remainingCapacity=Math.max(0,Math.min(
  .3-restGrowthSession.pendingGrowth,
  3-restGrowthSession.appliedStageProgress));
 const amount=round(Math.min(.1,
  remainingCapacity,nutritionState.pendingNutritionGrowth));
 if(amount<.000000001)return F({
  version:'0.9W',ok:true,transferred:0,
  nutritionState,restGrowthSession,
  actualBodySizeChanged:false,
  V09VGeometryNotTouched:true,playerSaveModified:false});
 const result=accumulateSnakeGrowthPotentialV09v({
  session:restGrowthSession,amount});
 if(!result.ok)return error('v09v_growth_queue_refused',
  {cause:result.reason});
 const next=F({...nutritionState,
  pendingNutritionGrowth:round(Math.max(0,
   nutritionState.pendingNutritionGrowth-amount))});
 return F({version:'0.9W',ok:true,transferred:amount,
  nutritionState:next,restGrowthSession:result.session,
  actualBodySizeChanged:false,
  V09VGeometryNotTouched:true,
  originalV09TMoverUntouched:true,
  playerSaveModified:false,skinApplied:false});
}
