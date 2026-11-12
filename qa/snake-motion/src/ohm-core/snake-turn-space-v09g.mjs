/**
 * PUBLIC Project OHM V0.9G — conservative BODY-AWARE return turn QA.
 *
 * A 2D bend over multiple source links can form an unnaturally tight coil
 * even while every single V0.9D joint angle is within its local limit.
 * Diagnose the arc-scale curvature of the ACTUAL 24-joint source pose.
 *
 * Opt-in guard NEVER changes, teleports, lifts or replaces source joints.
 * Rejection means "hold/replan", NOT proof of an alternate safe route.
 * The authoritative V0.9D 3D capsule check is still required on each step.
 * This is not a real 3D mesh sweep, muscle/support physics or biology claim.
 */
import {inspectSnakeSelfClearanceV09d,advanceSnakeRouteWithSelfGuardV09d}
 from './snake-self-clearance-v09d.mjs';

export const SNAKE_TURN_SPACE_V09G_VERSION='0.9G';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const wrapAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));

/**
 * Measure whole-body planar turns over several links, not merely one joint.
 * A reversal packed into a short run has small equivalent arc radius.
 * World units are exactly those of the unchanged 2.28-unit source.
 */
export function inspectSnakeTurnSpaceV09g({
 pose,windowLinks=8,minimumRadiusWorld=.42,
 significantSweepRadians=1.3
}={}){
 // Calls the original unchanged-source validator, link-length check and
 // 3D nonlocal overlap diagnostic. Neither this nor its output approves
 // moving through another body segment.
 const source=inspectSnakeSelfClearanceV09d({pose});
 if(!Number.isInteger(windowLinks)||windowLinks<6||windowLinks>12||
   !finite(minimumRadiusWorld)||minimumRadiusWorld<.25||
   minimumRadiusWorld>.9||
   !finite(significantSweepRadians)||significantSweepRadians<.8||
   significantSweepRadians>2.4)
  throw new RangeError('v09g_invalid_turn_space_options');
 const p=pose.points,headings=[];
 for(let i=0;i<p.length-1;i++){
  const dx=p[i+1].x-p[i].x,dy=p[i+1].y-p[i].y;
  if(Math.hypot(dx,dy)<pose.segmentLength*.45)
   throw new RangeError('v09g_turn_requires_ground_plane_footprint');
  headings.push(Math.atan2(dy,dx));
 }
 let smallest=Infinity,worst=null,checked=0;
 const windows=[];
 for(let i=0;i+windowLinks<=headings.length;i++){
  let totalSigned=0,totalAbsolute=0,planarTravel=0;
  for(let j=i;j<i+windowLinks;j++)
   planarTravel+=Math.hypot(p[j+1].x-p[j].x,p[j+1].y-p[j].y);
  for(let j=i+1;j<i+windowLinks;j++){
   const d=wrapAngle(headings[j]-headings[j-1]);
   totalSigned+=d;totalAbsolute+=Math.abs(d);
  }
  const sweep=Math.abs(totalSigned);
  const radius=sweep<1e-8?Infinity:planarTravel/sweep;
  const significant=sweep>=significantSweepRadians;
  // Do not confuse oscillating S-bends with a compact sustained U-turn.
  const mostlyOneDirection=totalAbsolute<1e-8||
    sweep/totalAbsolute>=.72;
  const risky=significant&&mostlyOneDirection&&
    radius<minimumRadiusWorld;
  const result=F({startLink:i,endLink:i+windowLinks-1,
   planarArcLength:planarTravel,signedSweepRadians:totalSigned,
   absoluteSweepRadians:totalAbsolute,equivalentRadiusWorld:radius,
   mostlyOneDirection,tooTight:risky});
  windows.push(result);
  checked++;
  if(significant&&mostlyOneDirection&&radius<smallest){
   smallest=radius;worst=result;
  }
 }
 const tight=windows.filter(w=>w.tooTight);
 return F({
  version:SNAKE_TURN_SPACE_V09G_VERSION,ok:true,
  sourceJointCount:24,checkedWindows:checked,windowLinks,
  minimumRadiusWorld,significantSweepRadians,
  tightWindowCount:tight.length,tightWindows:F(tight),
  tightReturnTurnDetected:tight.length>0,
  smallestSignificantTurnRadiusWorld:smallest,
  worstWindow:worst,
  previousV09dCandidateClearanceAccepted:
   source.candidateClearanceAccepted,
  sourceV09dMinimumCapsuleGap:source.minimumCapsuleGap,
  sourceV09dMaximumBendRadians:source.maximumBendRadians,
  original24SourceJointsModified:false,
  sourceHeadCollisionUnchanged:true,
  safeNewReturnRouteFound:false,
  fullBodyReturnVerified:false,
  dynamicMeshSweepCertified:false,
  realBodySupportVerified:false,skinApplied:false,saveModified:false
 });
}
// Return steering originates at the head. A historical curl near the tail
// is diagnostic only: it must not independently freeze the head's route.
const headTurnAtRisk=report=>report.tightWindows.some(w=>w.startLink<=2);
function hold(state,reason,diagnostic){
 return F({
  version:SNAKE_TURN_SPACE_V09G_VERSION,ok:false,
  phase:'turn_space_hold',reason,actorId:state.actorId,
  previousState:state,diagnostic,renderablePose:null,
  sourceJointsRewritten:false,alternateRouteAuthorized:false,
  fullBodyReturnVerified:false,
  gameplayNavigationAuthorized:false,skinApplied:false,
  saveModified:false,playerObservationRecorded:false
 });
}
/**
 * Opt in at the motion-test caller. Never replace V0.9D: run its 3D guard
 * for every candidate source frame. In a risky return turn, hold the last
 * verified state instead of displaying a progressively tighter coil.
 */
export function advanceSnakeRouteWithTurnSpaceGuardV09g({
 state,scene,terrain,seconds=1/30,
 minimumRadiusWorld=.42,significantSweepRadians=1.3
}={}){
 if(state?.version!=='0.9C'||!state.pose||
  !['moving_outbound','moving_return'].includes(state.phase))
  throw new RangeError('v09g_invalid_source_follower');
 const options={minimumRadiusWorld,significantSweepRadians};
 const before=inspectSnakeTurnSpaceV09g({pose:state.pose,...options});
 if(state.phase==='moving_return'&&headTurnAtRisk(before))
  return hold(state,'previous_source_return_turn_too_compact',before);
 const next=advanceSnakeRouteWithSelfGuardV09d({
  state,scene,terrain,seconds
 });
 if(!['moving_outbound','moving_return'].includes(next.phase))
  return F({...next,turnSpaceV09g:
   next.phase==='self_clearance_stop'?'source_self_clearance_stop_unchanged':
    'source_ended_not_full_body_proof',
   safeNewReturnRouteFound:false});
 const after=inspectSnakeTurnSpaceV09g({pose:next.pose,...options});
 if(next.phase==='moving_return'&&headTurnAtRisk(after))
  return hold(state,'next_source_return_turn_too_compact',after);
 return F({...next,
  turnSpaceV09g:'source_step_checked_turn_radius_only',
  turnSpaceDiagnosticV09g:after,
  safeNewReturnRouteFound:false,fullBodyReturnVerified:false,
  gameplayNavigationAuthorized:false});
}
