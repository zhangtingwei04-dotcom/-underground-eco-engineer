/**
 * PROJECT OHM V0.8F — public experimental safe-stop + mid-motion replan.
 *
 * A V0.7U 24-joint, 2.28-unit snake may be interrupted when the source
 * V0.3d scene changes. NO 13-joint restart, teleportation, player route,
 * physics authority replacement or unverified continuation is permitted.
 *
 * Phase one: hold the last VALID 24-joint source pose completely still,
 * revalidate its actual body/head/ground against the updated source scene
 * with V0.7S's OWN zero-step validator, and dry-run finite authored
 * directions using the ORIGINAL temporal/relay state (frames and speeds).
 * If the updated rock already touches the snake, do not display a
 * fictitiously safe pose or choose a route.
 *
 * Phase two: resume one step only on an unchanged source revision,
 * revalidate actual collision and bend, then commit the new 24-joint state.
 * This does not generate directions autonomously and is not full pathfinding.
 */
import {advanceSnakeGroundHandoffV07s}
 from './snake-wall-to-ground-handoff-v07s.mjs';
import {advanceSnakeCurvatureRelayV07u}
 from './snake-curvature-relay-v07u.mjs';
import {inspectSnakeTemporalContinuityV08d}
 from './snake-temporal-continuity-v08d.mjs';

export const SNAKE_DYNAMIC_REPLAN_VERSION='0.8F';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const denied=(reason,other={})=>F({
 version:SNAKE_DYNAMIC_REPLAN_VERSION,ok:false,reason,
 phase:'stop',pose:null,head:null,resumeState:null,selected:null,
 authoritativeCollisionPreserved:true,bodyMoved:false,
 skinApplied:false,gameplayNavigationAuthorized:false,
 privateSaveModified:false,...other
});
const freezeXY=p=>F({x:p.x,y:p.y});
const safeList=items=>{
 if(!Array.isArray(items)||items.length<1||items.length>8)
  throw new RangeError('v08f_candidate_count');
 const seen=new Set();
 for(const c of items){
  if(!c||typeof c.id!=='string'||
   !/^[a-z][a-z0-9_-]{0,31}$/.test(c.id)||seen.has(c.id)||
   !finite(c.departure?.x)||!finite(c.departure?.y)||
   Math.abs(c.departure.x)>.5||Math.abs(c.departure.y)>.5||
   Math.hypot(c.departure.x,c.departure.y)<.01||
   Math.hypot(c.departure.x,c.departure.y)>.5||
   !finite(c.turnRadians)||Math.abs(c.turnRadians)>.32)
   throw new RangeError('v08f_invalid_authored_candidate');
  seen.add(c.id);
 }
};
const snapshot=(scene,terrain)=>F({
 sceneId:scene.sceneId,sceneRevision:scene.revision,
 sourceMinute:scene.minute,
 sourceObjectsJSON:JSON.stringify(scene.objects),
 sourceTerrainJSON:JSON.stringify(terrain)
});
const sourceMatches=(snap,scene,terrain)=>
 snap.sceneId===scene.sceneId&&
 snap.sceneRevision===scene.revision&&
 snap.sourceMinute===scene.minute&&
 snap.sourceObjectsJSON===JSON.stringify(scene.objects)&&
 snap.sourceTerrainJSON===JSON.stringify(terrain);
const rebound=(src,scene,terrain)=>F({...src,...snapshot(scene,terrain)});
const controllerWith=(relay,src,c)=>F({
 ...relay,sourceDeparture:freezeXY(c.departure),
 turnRadians:c.turnRadians,temporalState:F({
  ...relay.temporalState,v07sState:src
 })
});
function preview(controller,src,c,scene,terrain,steps,{
 visualBendLimit,maxJointStep,maxTangentRotationRadians
}){
 let state=controllerWith(controller,src,c);
 let previous=src.pose,peakBend=0,peakStep=0,peakRotation=0;
 let examined=0,reason=null,firstRejectedFrame=null;
 for(let i=0;i<steps;i++){
  const result=advanceSnakeCurvatureRelayV07u(state,{
   scene,terrain,seconds:1/30
  });
  if(!result.ok){
   reason='source_'+result.reason;firstRejectedFrame=i+1;break;
  }
  const motion=inspectSnakeTemporalContinuityV08d({
   previousPose:previous,pose:result.pose,
   seconds:1/30,visualBendLimit
  });
  examined++;
  peakBend=Math.max(peakBend,motion.maximumBendRadians);
  peakStep=Math.max(peakStep,motion.maxJointStep);
  peakRotation=Math.max(peakRotation,motion.maxStepTangentRotationRadians);
  if(!motion.visualBendAccepted||
    motion.maxJointStep>maxJointStep+1e-9||
    motion.maxStepTangentRotationRadians>
      maxTangentRotationRadians+1e-9){
   reason=!motion.visualBendAccepted?'source_visual_bend_too_tight':
    motion.maxJointStep>maxJointStep+1e-9?
    'source_excessive_frame_displacement':
    'source_excessive_frame_rotation';
   firstRejectedFrame=i+1;break;
  }
  previous=result.pose;state=result.nextState;
 }
 return F({id:c.id,accepted:reason===null,reason,
  checkedFrames:examined,
  firstRejectedFrame,
  maximumBendRadians:peakBend,
  maxJointStep:peakStep,maxRotationRadians:peakRotation,
  predictedHeadX:state.temporalState.v07sState.pose.points[0].x,
  predictedHeadY:state.temporalState.v07sState.pose.points[0].y
 });
}
export function pauseAndReplanSnakeV08f({
 relayState,scene,terrain,candidates,horizonFrames=60,
 visualBendLimit=.65,maxJointStep=.012,
 maxTangentRotationRadians=.045
}={}){
 safeList(candidates);
 if(!Number.isInteger(horizonFrames)||horizonFrames<30||
  horizonFrames>120||
  !finite(visualBendLimit)||visualBendLimit<.5||
  visualBendLimit>1||
  !finite(maxJointStep)||maxJointStep<.001||maxJointStep>.1||
  !finite(maxTangentRotationRadians)||
  maxTangentRotationRadians<.001||maxTangentRotationRadians>.2)
  throw new RangeError('v08f_invalid_quality_gate');
 const s=relayState?.temporalState?.v07sState;
 if(relayState?.version!=='0.7U'||
  relayState.temporalState?.version!=='0.7T'||
  s?.version!=='0.7S'||s?.pose?.points?.length!==24||
  relayState.frames<10||relayState.frames>800||
  relayState.frames!==relayState.temporalState.frames||
  relayState.temporalState?.v07sState?.frames!==relayState.frames)
  throw new RangeError('v08f_requires_moving_same_24_bone_source');
 if(!scene||!terrain||typeof scene.sceneId!=='string'||
    !Number.isInteger(scene.revision))
  throw new RangeError('v08f_invalid_updated_source');
 if(sourceMatches(s,scene,terrain))
  return denied('source_scene_unchanged_continue_existing_controller');
 // The ORIGINAL source snapshot has changed: no more steps on the old
 // state. Only a ZERO-MOTION canonical 3D source check may authorize
 // remaining motion from the SAME exact 24-joint body.
 const src=rebound(s,scene,terrain);
 const sourceValidation=advanceSnakeGroundHandoffV07s(src,{
  scene,terrain,seconds:0,maxJointSpeed:.35
 });
 if(!sourceValidation.ok)return denied(
  'source_pose_now_blocked_'+sourceValidation.reason,{
   lastPoseWasPreviouslyValid:true,
   newPoseVerified:false,sourceSceneRevision:scene.revision
  });
 const sourcePose=sourceValidation.pose;
 // Fail closed on any unexpected geometric drift during the static check.
 const maxZeroChange=Math.max(...sourcePose.points.map((p,i)=>{
  const old=s.pose.points[i];
  return Math.hypot(p.x-old.x,p.y-old.y,p.z-old.z);
 }));
 if(maxZeroChange>1e-8)
  return denied('source_static_pose_changed_during_pause');
 const trials=candidates.map(c=>preview(relayState,src,c,
  scene,terrain,horizonFrames,{
   visualBendLimit,maxJointStep,maxTangentRotationRadians
  }));
 const chosenIndex=trials.findIndex(t=>t.accepted);
 const winner=chosenIndex<0?null:candidates[chosenIndex];
 const selection=winner===null?null:F({
  id:winner.id,departure:freezeXY(winner.departure),
  turnRadians:winner.turnRadians
 });
 const base=F({
  version:SNAKE_DYNAMIC_REPLAN_VERSION,
  phase:'paused',pose:s.pose,head:sourceValidation.head,
  sceneSnapshot:snapshot(scene,terrain),
  baseSourcePose:s.pose,baseRelayState:relayState,
  selected:selection,chosenIndex:chosenIndex<0?null:chosenIndex,
  trials:F(trials),horizonFrames,visualBendLimit,
  maxJointStep,maxTangentRotationRadians,
  sourceChanged:true,bodyMoved:false,
  sourcePoseRevalidated:true,
  gameplayNavigationAuthorized:false,
  privateSaveModified:false,skinApplied:false,
  authoritativeCollisionPreserved:true,
  truePhysicalContactVerified:false
 });
 if(!selection)return F({
  ...base,ok:false,reason:'no_source_safe_candidate',
  phase:'paused_no_route',resumeState:null
 });
 return F({...base,ok:true,reason:null,
  status:'source_validated_paused_waiting_for_explicit_resume',
  resumeState:null
 });
}
export function resumeReplannedSnakeV08f({
 paused,scene,terrain
}={}){
 if(paused?.version!==SNAKE_DYNAMIC_REPLAN_VERSION||
  paused.phase!=='paused'||paused.ok!==true||
  !paused.selected||!paused.sourcePoseRevalidated)
  return denied('v08f_requires_approved_paused_state');
 if(!sourceMatches(paused.sceneSnapshot,scene,terrain))
  return denied('source_scene_changed_again_replan_required');
 const relay=paused.baseRelayState;
 const source=rebound(relay.temporalState.v07sState,scene,terrain);
 // All original movement counters, velocities, 24 body joints, old
 // centers and poses persist. We only change authored heading and
 // rebase the scene provenance after the zero-motion source guard.
 const controller=controllerWith(relay,source,paused.selected);
 const step=advanceSnakeCurvatureRelayV07u(controller,{
  scene,terrain,seconds:1/30
 });
 if(!step.ok)return denied('source_resume_'+step.reason);
 const motion=inspectSnakeTemporalContinuityV08d({
  previousPose:source.pose,pose:step.pose,
  visualBendLimit:paused.visualBendLimit,seconds:1/30
 });
 if(!motion.visualBendAccepted||
  motion.maxJointStep>paused.maxJointStep+1e-9||
  motion.maxStepTangentRotationRadians>
    paused.maxTangentRotationRadians+1e-9)
  return denied('resume_motion_quality_rejected');
 return F({
  version:SNAKE_DYNAMIC_REPLAN_VERSION,ok:true,reason:null,
  phase:'resumed',pose:step.pose,head:step.head,
  selected:paused.selected,
  resumeState:step.nextState,
  sourcePoseRevalidated:true,bodyMoved:true,
  previousBoneCount:source.pose.points.length,
  nextBoneCount:step.pose.points.length,
  previousFrame:relay.frames,nextFrame:step.nextState.frames,
  maximumBendRadians:motion.maximumBendRadians,
  maxJointStep:motion.maxJointStep,
  maxRotationRadians:motion.maxStepTangentRotationRadians,
  headStep:motion.headStep,
  sceneRevision:scene.revision,
  authoritativeCollisionPreserved:true,skinApplied:false,
  privateSaveModified:false,gameplayNavigationAuthorized:false,
  physicsVerified:false
 });
}
