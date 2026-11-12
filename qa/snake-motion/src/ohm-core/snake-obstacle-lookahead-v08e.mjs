/**
 * PROJECT OHM V0.8E — PUBLIC, source-owned finite lookahead.
 *
 * The caller supplies a SMALL ORDERED list of explicit authored ground
 * departure vectors. This module never generates behavior, moves the snake,
 * controls the world or overrides V0.7S authoritative 2D scene/head/terrain
 * collision gates. All candidates are cloned into independent simulations
 * from ONE resting source and checked through EVERY predicted time step.
 *
 * This is deterministic, lookahead-only, fail-closed route selection for a
 * synthetic near-glass laboratory, not reactive avoidance or player AI.
 */
import {prepareSnakeGroundHandoffV07s}
 from './snake-wall-to-ground-handoff-v07s.mjs';
import {createSnakeGroundTemporalV07t}
 from './snake-ground-temporal-v07t.mjs';
import {createSnakeCurvatureRelayV07u,advanceSnakeCurvatureRelayV07u}
 from './snake-curvature-relay-v07u.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from './snake-temporal-continuity-v08d.mjs';

export const SNAKE_OBSTACLE_LOOKAHEAD_VERSION='0.8E';
const F=Object.freeze;
const valid=x=>typeof x==='number'&&Number.isFinite(x);
const report=(ok,reason,extra={})=>F({
 version:SNAKE_OBSTACLE_LOOKAHEAD_VERSION,ok,reason,
 selected:null,chosenIndex:null,sourceModified:false,skinApplied:false,
 collisionAuthorityPreserved:true,gameplayNavigationAuthorized:false,
 savedStateModified:false,physicalContactVerified:false,...extra
});
function candidatesValid(candidates){
 if(!Array.isArray(candidates)||candidates.length<1||candidates.length>8)
  throw new RangeError('v08e_requires_one_to_eight_authored_candidates');
 const ids=new Set();
 for(const c of candidates){
  if(!c||typeof c.id!=='string'||
    !/^[a-z][a-z0-9_-]{0,31}$/.test(c.id)||ids.has(c.id)||
    !valid(c.departure?.x)||!valid(c.departure?.y)||
    Math.hypot(c.departure.x,c.departure.y)<.01||
    Math.hypot(c.departure.x,c.departure.y)>.5||
    Math.abs(c.departure.x)>.5||Math.abs(c.departure.y)>.5||
    !valid(c.turnRadians)||Math.abs(c.turnRadians)>.32)
   throw new RangeError('v08e_invalid_or_duplicate_authored_candidate');
  ids.add(c.id);
 }
}
function dryRun(source,{scene,terrain,candidate,steps,maxJointStep,
 maxTangentRotationRadians,visualBendLimit,speciesId}){
 let ready;
 try{
  ready=prepareSnakeGroundHandoffV07s({
   wallState:source,scene,terrain,targetJointCount:24,
   departure:candidate.departure,speciesId
  });
 }catch(e){
  if(!(e instanceof RangeError))throw e;
  return F({accepted:false,reason:'handoff_validation_'+e.message,
   checkedFrames:0,firstRejectedFrame:0,maximumBendRadians:null,
   maxJointStep:0,maxRotationRadians:0,headTravel:0});
 }
 if(!ready.ok)return F({
  accepted:false,reason:'handoff_'+ready.reason,
  checkedFrames:0,firstRejectedFrame:0,
  maximumBendRadians:null,maxJointStep:0,
  maxRotationRadians:0,headTravel:0
 });
 let controller;
 try{
  controller=createSnakeCurvatureRelayV07u({
   temporalState:createSnakeGroundTemporalV07t({handoff:ready}),
   turnRadians:candidate.turnRadians
  });
 }catch(e){
  if(!(e instanceof RangeError))throw e;
  return F({
   accepted:false,reason:'relay_setup_'+e.message,
   checkedFrames:0,firstRejectedFrame:0,
   maximumBendRadians:null,maxJointStep:0,
   maxRotationRadians:0,headTravel:0
  });
 }
 let previous=controller.temporalState.v07sState.pose;
 let maximumBendRadians=0,peakJointStep=0,peakRotation=0;
 let headTravel=0;
 for(let i=0;i<steps;i++){
  const update=advanceSnakeCurvatureRelayV07u(controller,{
   scene,terrain,seconds:1/30
  });
  if(!update.ok)return F({
   accepted:false,reason:'source_'+update.reason,
   checkedFrames:i,firstRejectedFrame:i+1,
   maximumBendRadians, maxJointStep:peakJointStep,
   maxRotationRadians:peakRotation,headTravel
  });
  const m=inspectSnakeTemporalContinuityV08d({
   previousPose:previous,pose:update.pose,
   seconds:1/30,visualBendLimit
  });
  maximumBendRadians=Math.max(maximumBendRadians,m.maximumBendRadians);
  peakJointStep=Math.max(peakJointStep,m.maxJointStep);
  peakRotation=Math.max(peakRotation,m.maxStepTangentRotationRadians);
  headTravel=update.headTravel;
  if(!m.visualBendAccepted||m.maxJointStep>maxJointStep+1e-9||
    m.maxStepTangentRotationRadians>maxTangentRotationRadians+1e-9)
   return F({
    accepted:false,reason:!m.visualBendAccepted?
     'visual_bend_too_tight':
     m.maxJointStep>maxJointStep+1e-9?
     'excessive_frame_displacement':'excessive_frame_rotation',
    checkedFrames:i+1,firstRejectedFrame:i+1,
    maximumBendRadians,maxJointStep:peakJointStep,
    maxRotationRadians:peakRotation,headTravel
   });
  controller=update.nextState;
  previous=update.pose;
 }
 return F({
  accepted:true,reason:null,checkedFrames:steps,
  firstRejectedFrame:null,maximumBendRadians,
  maxJointStep:peakJointStep,maxRotationRadians:peakRotation,headTravel
 });
}
export function previewSnakeObstacleDeparturesV08e({
 wallState,scene,terrain,candidates,
 horizonFrames=90,speciesId='generic_snake',
 visualBendLimit=.65,maxJointStep=.012,
 maxTangentRotationRadians=.045
}={}){
 candidatesValid(candidates);
 if(!Number.isInteger(horizonFrames)||horizonFrames<30||
  horizonFrames>150||!valid(visualBendLimit)||
  visualBendLimit<.5||visualBendLimit>1||
  !valid(maxJointStep)||maxJointStep<.001||maxJointStep>.1||
  !valid(maxTangentRotationRadians)||
  maxTangentRotationRadians<.001||
  maxTangentRotationRadians>.2||
  !['generic_snake','corn_snake','hognose_snake'].includes(speciesId))
  throw new RangeError('v08e_invalid_preview_limits');
 if(wallState?.version!=='0.7P'||
   wallState?.phase!=='rest'||wallState.seconds<3.1-1e-8)
  throw new RangeError('v08e_requires_resting_wall_probe');
 const trials=[];
 let selected=null,chosenIndex=null;
 for(let i=0;i<candidates.length;i++){
  const candidate=candidates[i];
  const outcome=dryRun(wallState,{
   scene,terrain,candidate,steps:horizonFrames,
   maxJointStep,maxTangentRotationRadians,visualBendLimit,speciesId
  });
  trials.push(F({
   candidateId:candidate.id,departure:F({...candidate.departure}),
   turnRadians:candidate.turnRadians,...outcome
  }));
  if(selected===null&&outcome.accepted){
   selected=F({
    id:candidate.id,departure:F({...candidate.departure}),
    turnRadians:candidate.turnRadians,
    checkedFrames:horizonFrames,
    maximumBendRadians:outcome.maximumBendRadians,
    headTravel:outcome.headTravel
   });
   chosenIndex=i;
  }
 }
 return report(selected!==null,selected!==null?null:'no_source_safe_candidate',{
  selected,chosenIndex,trials:F(trials),checkedCandidates:trials.length,
  acceptedCandidates:trials.filter(x=>x.accepted).length,
  sourceSceneId:scene?.sceneId??null,
  sourceSceneRevision:scene?.revision??null,
  horizonFrames,sourceJointCount:wallState?.pose?.points?.length??null,
  status:selected?'authored_source_checked_lookahead_only':
   'stop_no_safe_authored_departure'
 });
}
