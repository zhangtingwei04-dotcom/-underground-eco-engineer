/**
 * Project OHM — public-only neutral snake autonomous choice V0.9A.
 *
 * Chooses whether to rest or attempt a short movement from an ecology
 * snapshot using existing habitat ranking. Every candidate movement is
 * dry-run against the REAL V0.7S full-body/collision source through V0.8E.
 * This is NOT destination pathfinding, reverse-path validation, an animal
 * physiology model, a saving system or a player observation subsystem.
 *
 * Site departure vectors are authored/synthetic hints. The planner selects
 * among them autonomously; it does not infer vectors from the whole map.
 */
import {buildSnakeActionInputFromEcology}
 from './snake-ecology-action-adapter.mjs';
import {rankSnakeActivityPoints}
 from './snake-activity-points.mjs';
import {previewSnakeObstacleDeparturesV08e}
 from './snake-obstacle-lookahead-v08e.mjs';
import {prepareSnakeGroundHandoffV07s}
 from './snake-wall-to-ground-handoff-v07s.mjs';
import {createSnakeGroundTemporalV07t}
 from './snake-ground-temporal-v07t.mjs';
import {createSnakeCurvatureRelayV07u,advanceSnakeCurvatureRelayV07u}
 from './snake-curvature-relay-v07u.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from './snake-temporal-continuity-v08d.mjs';

export const SNAKE_AUTONOMY_VERSION='0.9A';
const F=Object.freeze;
const validId=s=>typeof s==='string'&&/^[a-z][a-z0-9_-]{0,63}$/.test(s);
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const QUALITY=F({visualBendLimit:.65,maxJointStep:.012,maxTangentRotationRadians:.045});
function checkActor({actorId,speciesId,siteDepartures,wallState,scene,terrain,horizonFrames}){
 if(!validId(actorId)||speciesId!=='generic_snake'||
    !siteDepartures||typeof siteDepartures!=='object'||
    Array.isArray(siteDepartures)||!scene||!terrain||
    typeof scene.sceneId!=='string'||
    !Number.isSafeInteger(scene.revision)||scene.revision<0||
    wallState?.version!=='0.7P'||wallState?.phase!=='rest'||
    !Number.isInteger(horizonFrames)||horizonFrames<30||horizonFrames>120)
  throw new RangeError('v09a_invalid_source_or_actor');
 // Fail closed rather than permit arbitrary keys and hidden movement sites.
 for(const [id,options] of Object.entries(siteDepartures)){
  if(!validId(id)||id==='__proto__'||!Array.isArray(options)||
     options.length<1||options.length>8)
   throw new RangeError('v09a_invalid_site_departures');
 }
}
const base=(actorId,scene)=>({
 version:SNAKE_AUTONOMY_VERSION,actorId,
 sceneId:scene.sceneId,sceneRevision:scene.revision,
 skinApplied:false,saveModified:false,playerObservationRecorded:false,
 physicsAuthority:'V0.7S_source_owned',fullDestinationReached:false,
 safeReturnToOriginVerified:false,gameplayNavigationAuthorized:false
});
function stationary(actorId,scene,reason,rejected,needs=[]){
 return F({...base(actorId,scene),ok:false,phase:'remain_still',
  targetId:null,chosenActivity:'rest',reason,
  selected:null,preview:null,
  rejected:F(rejected),unmetNeeds:F([...needs]),
  movementStarted:false,movementCompleted:false});
}
export function planSnakeAutonomousSegmentV09a({
 actorId='test_snake',speciesId='generic_snake',
 ecologySnapshot,needs={},thermalSignal='neutral',
 dayPhase='day',currentTargetId=null,cooldownIds=[],
 wallState,scene,terrain,siteDepartures={},horizonFrames=60
}={}){
 checkActor({actorId,speciesId,siteDepartures,wallState,scene,terrain,horizonFrames});
 if(ecologySnapshot?.revision!==scene.revision)
  return stationary(actorId,scene,'ecology_scene_revision_mismatch',[]);
 const input=buildSnakeActionInputFromEcology({
  snapshot:ecologySnapshot,speciesId,needs,thermalSignal,
  currentTargetId,cooldownIds
 });
 const rank=rankSnakeActivityPoints({
  speciesId,points:input.points,needs:input.needs,
  dayPhase,currentTargetId,cooldownIds
 });
 const rejected=[];
 for(const choice of rank.scored){
  if(choice.id===null){
   return stationary(actorId,scene,
    rejected.length?'rest_or_no_source_safe_movement':'chose_rest',
    rejected,rank.unmetNeeds);
  }
  const candidates=Object.hasOwn(siteDepartures,choice.id)?
    siteDepartures[choice.id]:null;
  if(!candidates){
   rejected.push(F({siteId:choice.id,reason:'no_authored_departure_for_site'}));
   continue;
  }
  // The actual 24-joint body, head, terrain and scene provenance are
  // source-checked for each frame; we cannot set safe=true ourselves.
  const trial=previewSnakeObstacleDeparturesV08e({
   wallState,scene,terrain,candidates,horizonFrames,
   speciesId,...QUALITY
  });
  if(!trial.ok){
   rejected.push(F({siteId:choice.id,
    reason:trial.reason??'source_preview_rejected',
    trials:F(trial.trials.map(t=>F({id:t.candidateId,
      accepted:t.accepted,reason:t.reason}))) }));
   continue;
  }
  return F({...base(actorId,scene),ok:true,
   phase:'approved_short_segment',targetId:choice.id,
   chosenActivity:choice.kind,reason:choice.reason,
   selected:trial.selected,preview:trial,
   horizonFrames,unmetNeeds:rank.unmetNeeds,
   rejected:F(rejected),movementStarted:false,
   movementCompleted:false,
   // Ephemeral source signatures. Never persist to player saves.
   sourceSignature:JSON.stringify({scene,terrain,wallState}),
   resultScope:'short_segment_only_not_arrival'});
 }
 return stationary(actorId,scene,'no_action_point_available',rejected,rank.unmetNeeds);
}
const abort=(plan,reason)=>F({
 version:SNAKE_AUTONOMY_VERSION,ok:false,
 phase:'aborted',reason,actorId:plan?.actorId??null,
 movementStarted:false,movementCompleted:false,
 skinApplied:false,playerObservationRecorded:false,
 bodyMoved:false,completedEvent:null,pose:null,
 fullDestinationReached:false,gameplayNavigationAuthorized:false
});
/**
 * Headless synthetic verification of ONE approved short physical segment.
 * A game runtime should integrate small steps with real frame scheduling;
 * this function is NOT a visual scene controller or an AI pathfinder.
 * No "reached shelter" or "drank water" event is ever generated.
 */
export function verifySnakeAutonomousSegmentV09a({
 plan,wallState,scene,terrain
}={}){
 if(plan?.version!==SNAKE_AUTONOMY_VERSION||
    plan.phase!=='approved_short_segment'||!plan.ok||
    !plan.selected||!finite(plan.horizonFrames))
  return abort(plan,'no_approved_short_segment');
 if(scene?.sceneId!==plan.sceneId||
    scene?.revision!==plan.sceneRevision||
    plan.sourceSignature!==JSON.stringify({scene,terrain,wallState}))
  return abort(plan,'source_changed_since_plan');
 const candidate=plan.selected;
 let ready=prepareSnakeGroundHandoffV07s({
  wallState,scene,terrain,targetJointCount:24,
  departure:candidate.departure,speciesId:'generic_snake'
 });
 if(!ready.ok)return abort(plan,'source_handoff_'+ready.reason);
 let control=createSnakeCurvatureRelayV07u({
  temporalState:createSnakeGroundTemporalV07t({handoff:ready}),
  turnRadians:candidate.turnRadians
 });
 let previous=control.temporalState.v07sState.pose;
 let maxBend=0,maxStep=0,maxRotation=0;
 for(let frame=0;frame<plan.horizonFrames;frame++){
  const step=advanceSnakeCurvatureRelayV07u(control,{
   scene,terrain,seconds:1/30
  });
  if(!step.ok)return abort(plan,'source_movement_'+step.reason);
  const quality=inspectSnakeTemporalContinuityV08d({
   previousPose:previous,pose:step.pose,seconds:1/30,
   visualBendLimit:QUALITY.visualBendLimit
  });
  maxBend=Math.max(maxBend,quality.maximumBendRadians);
  maxStep=Math.max(maxStep,quality.maxJointStep);
  maxRotation=Math.max(maxRotation,quality.maxStepTangentRotationRadians);
  if(!quality.visualBendAccepted||
     quality.maxJointStep>QUALITY.maxJointStep+1e-9||
     quality.maxStepTangentRotationRadians>
      QUALITY.maxTangentRotationRadians+1e-9)
   return abort(plan,'motion_quality_gate_rejected');
  previous=step.pose;
  control=step.nextState;
 }
 // A segment's completion is NOT reaching the ecological action site.
 const completedEvent=F({
  eventType:'short_movement_segment_completed',
  actorId:plan.actorId,targetSiteId:plan.targetId,
  activityIntent:plan.chosenActivity,
  reason:'physical_source_frames_verified',
  sceneRevision:scene.revision,verifiedFrames:plan.horizonFrames,
  observedByPlayer:false,destinationReached:false,
  eventScope:'synthetic_headless_qa_only'
 });
 return F({
  version:SNAKE_AUTONOMY_VERSION,ok:true,
  phase:'short_segment_completed',reason:null,
  actorId:plan.actorId,selected:plan.selected,
  targetId:plan.targetId,
  movementStarted:true,movementCompleted:true,bodyMoved:true,
  pose:previous,nextRelayState:control,
  boneCount:previous.points.length,
  maxBend,maxStep,maxRotation,completedEvent,
  skinApplied:false,playerObservationRecorded:false,
  fullDestinationReached:false,
  safeReturnToOriginVerified:false,
  gameplayNavigationAuthorized:false
 });
}
