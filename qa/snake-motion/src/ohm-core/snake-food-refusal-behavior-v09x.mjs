/**
 * Project OHM V0.9X — PUBLIC SYNTHETIC refusal quiet-window,
 * individual food preferences and whole-body transparent-motion QA.
 *
 * Decisions are NOT veterinary diagnoses, husbandry timing, real
 * snake refusal rates, species preference profiles or valid feeding
 * schedules. All numbers are replaceable synthetic engineering tests.
 *
 * The quiet window is a simulation rule to stop button-spam from
 * rerolling appetite. It does NOT penalize the animal or player.
 * The host must authorize the animal, food and clock. No player
 * inventory, real NPC, saved world or reptile skin is ever mutated.
 *
 * Refusal behavior shows a conservative sniff/head-look sequence
 * (body remains absolutely still), then optional real V0.9T small
 * turns guarded by V0.9U/S 3216-triangle full-body mesh tests.
 * "Seek cover" is an INTENTION, NOT actual hide arrival or a route.
 */
import {createSnakeFeedingLabV09w,offerSnakeFoodV09w,
 advanceSnakeDigestionV09w}
 from './snake-feeding-digestion-v09w.mjs';
import {advanceSnakeVariableSizeMotionV09t}
 from './snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u,
 inspectSnakeSizedMeshStepV09u}
 from './snake-sized-mesh-motion-v09u.mjs';
import {inspectSnakeMeshTemporalV09s}
 from './snake-swept-mesh-contact-v09s.mjs';

export const SNAKE_FOOD_REFUSAL_BEHAVIOR_V09X_VERSION='0.9X';
const F=Object.freeze;
const isFiniteNumber=x=>typeof x==='number'&&Number.isFinite(x);
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const validId=s=>typeof s==='string'&&ID.test(s);
const PREF=F(['preferred','neutral','disliked']);
const CONTEXT_KEYS=F([
 'mealEnergy','thermalStatus','disturbance',
 'bodyConditionTrend','hydrationStatus','preyStatus',
 'preShed','shedding','seasonalQuiet',
 'breedingContext','additionalConcerningSigns'
]);
const MAX_EVENT_HISTORY=64;
const fail=(reason,extra={})=>F({
 version:'0.9X',ok:false,reason,...extra,
 refusalNotMedicalDiagnosis:true,
 sourceFramesCommitted:0,actualGameplayAuthorized:false,
 formalAnimalSaveModified:false,skinApplied:false
});
function validSession(s){
 return s?.version==='0.9X'&&s.feedingState?.version==='0.9W'&&
  validId(s.feedingState.individualId)&&
  isFiniteNumber(s.feedingState.worldHour)&&
  isFiniteNumber(s.quietUntilHour)&&s.quietUntilHour>=0&&
  s.quietUntilHour<=1000000000&&
  isFiniteNumber(s.refusalQuietHours)&&
  s.refusalQuietHours>=.1&&s.refusalQuietHours<=36&&
  isFiniteNumber(s.acceptedQuietHours)&&
  s.acceptedQuietHours>=.1&&s.acceptedQuietHours<=72&&
  s.foodPreference&&
  typeof s.foodPreference==='object'&&!Array.isArray(s.foodPreference)&&
  Object.entries(s.foodPreference).every(([id,p])=>
   validId(id)&&PREF.includes(p))&&
  Array.isArray(s.receipts)&&s.receipts.length<=MAX_EVENT_HISTORY&&
  s.receipts.every(x=>x&&validId(x.offerId)&&
   typeof x.fingerprint==='string'&&
   typeof x.accepted==='boolean')&&
  new Set(s.receipts.map(x=>x.offerId)).size===s.receipts.length;
}
function actionForOffer(s,offerId,preyId){
 // Synthetic neutral behavioral choice not bound to a diagnosis.
 const text=s.feedingState.individualId+'|'+offerId+'|'+preyId;
 let hash=(s.feedingState.randomSeed>>>0)^2166136261;
 for(let i=0;i<text.length;i++)
  hash=Math.imul(hash^text.charCodeAt(i),16777619)>>>0;
 const n=hash%3;
 return ['sniff_then_turn','pause_then_turn','sniff_then_seek_cover'][n];
}
/** Neutral individual preference profile — NEVER assign real species
 * feeding advice from a lab's category labels. */
export function createSnakeFoodBehaviorLabV09x({
 feedingState=null,individualId='neutral_snake',
 randomSeed=109,foodPreference={
  prey_a:'preferred',prey_b:'neutral',prey_c:'disliked'
 },refusalQuietHours=6,acceptedQuietHours=12
}={}){
 if(!feedingState)
  feedingState=createSnakeFeedingLabV09w({
   individualId,randomSeed,stage:'juvenile'});
 if(!foodPreference||typeof foodPreference!=='object'||
  Array.isArray(foodPreference)||Object.keys(foodPreference).length>16||
  Object.entries(foodPreference).some(([id,p])=>
   !validId(id)||!PREF.includes(p))||
  !isFiniteNumber(refusalQuietHours)||refusalQuietHours<.1||
  refusalQuietHours>36||!isFiniteNumber(acceptedQuietHours)||
  acceptedQuietHours<.1||acceptedQuietHours>72||
  feedingState?.version!=='0.9W'||!validId(feedingState.individualId))
  throw new RangeError('invalid_v09x_neutral_food_profile');
 const result=F({version:'0.9X',feedingState,
  foodPreference:F({...foodPreference}),
  quietUntilHour:feedingState.worldHour,
  refusalQuietHours,acceptedQuietHours,
  receipts:F([]),
  quietWindowIsSimulationNotHusbandryAdvice:true,
  notIntegratedWithFormalSave:true,
  skinApplied:false});
 if(!validSession(result))throw new RangeError('invalid_v09x_session');
 return result;
}
/**
 * Same (ID + context) replay: returns the same receipt without new
 * food or RNG. New IDs during quiet window DO NOT reach V0.9W,
 * therefore button-mashing cannot reroll the answer.
 */
export function offerSnakeFoodWithBehaviorV09x({
 session,offerId,preyId='prey_a',context={}
}={}){
 if(!validSession(session)||!validId(offerId)||
  !validId(preyId)||!context||typeof context!=='object'||
  Array.isArray(context)||Object.keys(context).some(k=>
   !CONTEXT_KEYS.includes(k)))
  return fail('invalid_v09x_offer');
 const preference=session.foodPreference[preyId]??'neutral';
 const fingerprint=JSON.stringify({preyId,context,
  resolvedPreference:preference});
 const previous=session.receipts.find(r=>r.offerId===offerId);
 if(previous)return previous.fingerprint!==fingerprint?
  fail('conflicting_offer_id'):
  F({version:'0.9X',ok:true,duplicate:true,
   offered:true,accepted:previous.accepted,
   refused:!previous.accepted,session,
   receipt:previous,actualFoodAcceptedNow:false,
   newFeedingDecision:false,preyInventoryConsumed:false,
   relationshipPenalty:0,bodySizeChanged:false,
   formalAnimalSaveModified:false,skinApplied:false});
 if(session.feedingState.worldHour+1e-9<session.quietUntilHour)
  return F({version:'0.9X',ok:true,duplicate:false,
   offered:false,accepted:false,refused:false,
   quietWindowActive:true,reason:'quiet_window',
   quietUntilHour:session.quietUntilHour,
   session,preyInventoryConsumed:false,
   newFeedingDecision:false,
   newNutritionAbsorbed:0,bodySizeChanged:false,
   relationshipPenalty:0,noRepeatedAppetiteReroll:true,
   formalAnimalSaveModified:false,skinApplied:false});
 if(session.receipts.length>=MAX_EVENT_HISTORY)
  return fail('food_behavior_event_ledger_full');
 const food=offerSnakeFoodV09w({
  state:session.feedingState,offerId,
  context:{...context,preferenceStatus:preference}
 });
 if(!food.ok)return fail('v09w_did_not_accept_input',
  {sourceReason:food.reason});
 const accepted=food.accepted;
 const observation=accepted?'observed_swallow':
  'observed_refusal';
 const behavior=accepted?'accepted_food':
  actionForOffer(session,offerId,preyId);
 const receipt=F({offerId,fingerprint,preyId,
  accepted,worldHour:session.feedingState.worldHour,
  observation,behavior,
  certainty:'observable_behavior_not_diagnosis',
  privateAppetiteProfileNotPlayerDiagnostic:true,
  preyInventoryConsumptionRequested:accepted,
  sourceOfferId:food.decision.offerId});
 const quietHours=accepted?
  session.acceptedQuietHours:session.refusalQuietHours;
 const next=F({...session,
  feedingState:food.state,
  quietUntilHour:food.state.worldHour+quietHours,
  receipts:F([...session.receipts,receipt])});
 return F({version:'0.9X',ok:true,duplicate:false,
  offered:true,accepted,refused:!accepted,
  session:next,receipt,
  quietUntilHour:next.quietUntilHour,
  newFeedingDecision:true,
  preyInventoryConsumed:false,
  preyInventoryConsumptionRequested:accepted,
  newNutritionAbsorbed:0,
  relationshipPenalty:0,bodySizeChanged:false,
  refusalNotMedicalDiagnosis:true,
  formalAnimalSaveModified:false,skinApplied:false});
}
/** Uses the old V0.9W trusted CLOCK advance; callers must ensure
 * this amount is an actual authorized in-game simulation interval.
 */
export function advanceSnakeQuietWindowV09x({
 session,hours=1,thermalStatus='optimal',
 hydrationStatus='normal',bodyConditionTrend='normal'
}={}){
 if(!validSession(session))return fail('invalid_v09x_session');
 const res=advanceSnakeDigestionV09w({
  state:session.feedingState,hours,thermalStatus,
  hydrationStatus,bodyConditionTrend
 });
 if(!res.ok)return fail('invalid_v09w_time_step',
  {sourceReason:res.reason});
 return F({version:'0.9X',ok:true,
  session:F({...session,feedingState:res.state}),
  quietWindowRemainingHours:Math.max(0,
   session.quietUntilHour-res.state.worldHour),
  absorbedEnergy:res.absorbedEnergy,
  growthPotentialAdded:res.actualGrowthPotentialAdded,
  stageLengthNeverChanged:true,foodAppetiteNotRerolled:true,
  formalAnimalSaveModified:false,skinApplied:false});
}
function renderSized(state,scene,terrain,yaw=0,pitch=0){
 return buildSnakeSizedMeshCandidateV09u({
  sizedState:state,scene,terrain,
  headYawRad:yaw,headPitchRad:pitch
 });
}
/**
 * Synthetic one-refusal action PREVIEW:
 * 3 stationary sniff/head-look states + 4 optional guarded small turns
 * using the actual stage-sized 24-joint source. Stage-sized mesh and
 * nonlocal 3D/heightfield/rock/glass checks are mandatory per step.
 *
 * This does not claim a backward-retreat action, nor an attained hide
 * or valid hiding route. Seeking cover is an *intent* only.
 */
export function previewSnakeRefusalMotionV09x({
 receipt,sizedState,scene,terrain,turnSign=1
}={}){
 if(!receipt||receipt.accepted!==false||
  !['sniff_then_turn','pause_then_turn',
   'sniff_then_seek_cover'].includes(receipt.behavior)||
  sizedState?.version!=='0.9T'||
  sizedState.phase!=='moving_sized'||!scene||!terrain||
  ![-1,1].includes(turnSign))
  return fail('invalid_refusal_motion_request');
 const sourceBefore=JSON.stringify(sizedState);
 const start=renderSized(sizedState,scene,terrain,0,0);
 if(!start.ok)return fail('starting_transparent_body_unsafe',
  {bodyReason:start.reason});
 const sniffAngles=receipt.behavior==='pause_then_turn'?
  [0,0,0]:[.004,.008,.012];
 let prior=start,previousYaw=0;
 const phases=[];
 for(let i=0;i<sniffAngles.length;i++){
  const yaw=sniffAngles[i]*turnSign;
  const next=renderSized(sizedState,scene,terrain,yaw,0);
  if(!next.ok)return fail('refusal_head_look_mesh_rejected',
   {step:i,bodyReason:next.reason});
  const surface=inspectSnakeMeshTemporalV09s({
   from:prior.sharedHeadCandidate,
   to:next.sharedHeadCandidate,
   scene,terrain,temporalSlices:3
  });
  if(!surface.ok)return fail('refusal_head_look_surface_rejected',
   {step:i,meshReason:surface.reason});
  phases.push(F({action:i===0?'notice_food':'sniff_or_hold',
   sourceFrame:sizedState.verifiedFrames,
   skullYawRadians:yaw,bodyMotion:false,
   meshTrianglesChecked:surface.checkedSweptFaces,
   meshGroundSamples:surface.surfaceHeightfieldSamples,
   sceneAndBodySafe:true}));
  prior=next;previousYaw=yaw;
 }
 let source=sizedState;
 for(let i=0;i<4;i++){
  const next=advanceSnakeVariableSizeMotionV09t({
   state:source,scene,terrain,turnRadians:turnSign*.003
  });
  if(next.phase!=='moving_sized'||
   next.verifiedFrames!==source.verifiedFrames+1)
   return fail('refusal_turn_source_safe_hold',
    {step:i,sourceReason:next.status??'sized_controller_held'});
  const yaw=(sniffAngles.at(-1)-.003*(i+1))*turnSign;
  const audit=inspectSnakeSizedMeshStepV09u({
   previousState:source,nextState:next,scene,terrain,
   turnRadians:turnSign*.003,
   previousYawRad:previousYaw,nextYawRad:yaw,
   temporalSlices:3
  });
  if(!audit.ok)return fail('refusal_turn_mesh_safe_hold',
   {step:i,meshReason:audit.reason,
    sourceReplayMatched:audit.sourceReplayMatched??false});
  phases.push(F({action:'turn_away',
   sourceFrame:next.verifiedFrames,
   skullYawRadians:yaw,bodyMotion:true,
   meshTrianglesChecked:audit.temporal.checkedSweptFaces,
   meshGroundSamples:audit.temporal.surfaceHeightfieldSamples,
   sceneAndBodySafe:true}));
  source=next;previousYaw=yaw;
 }
 return F({version:'0.9X',ok:true,
  behavior:receipt.behavior,
  stages:F(phases),stagesChecked:phases.length,
  initialSourceFrame:sizedState.verifiedFrames,
  finalSourceFrameShadow:source.verifiedFrames,
  stableBoneLengths:JSON.stringify(
   source.pose.boneLengths)===JSON.stringify(sizedState.pose.boneLengths),
  stableBodyRadii:JSON.stringify(
   source.pose.radiiWorldUnits)===JSON.stringify(sizedState.pose.radiiWorldUnits),
  bodyMeshVertices:1617,bodyMeshTriangles:3216,
  noBodyMotionDuringSniff:true,
  validatedTurnFrames:4,
  seekCoverIntentOnly:receipt.behavior==='sniff_then_seek_cover',
  actualCoverLocated:false,actualHideArrival:false,
  backwardsRetreatImplemented:false,
  allMotionFromSizedV09tSource:true,
  headBodyWeldedAnd3DSurfaceChecked:true,
  originalV09tStateUntouched:
   JSON.stringify(sizedState)===sourceBefore,
  formalGameFramesCommitted:0,
  exactContinuous3DPhysicsCertified:false,
  formalAnimalSaveModified:false,skinApplied:false});
}
