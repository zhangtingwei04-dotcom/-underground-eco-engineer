/**
 * OHM public synthetic V0.9L — current-configuration turn staging QA.
 *
 * Candidate positions depend on the SAME real source head heading, 24-joint
 * neck tangent and source-owned terrarium. Each is a bounded-radius XY
 * centerline arc proposal (not an edited snake pose or spline teleport).
 * A custom V0.9I preflight still checks both AABB scene and nonlocal tail
 * occupancy; every accepted motion frame is V0.9C + V0.9D/G source owned.
 *
 * The radius is a conservative game-motion design gate, NOT a claim about
 * species anatomy, muscle, traction, 3D swept mesh or tail clearance.
 * Ranking with V0.9K requires successful full source shadow simulation.
 * A selected arc permits at most ONE original-source guarded step.
 */
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {planSnakeBodyDetourV09i}
 from './snake-body-detour-v09i.mjs';
import {chooseSnakeGoalReturnV09k}
 from './snake-goal-return-selection-v09k.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';
export const SNAKE_HEADING_TURN_V09L_VERSION='0.9L';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const xy=(x,y)=>F({x,y});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));

function sourceHeading(source){
 const departure=source?.relayState?.temporalState?.v07sState?.departure;
 if(!departure||![departure.x,departure.y].every(finite))
  throw new RangeError('v09l_requires_real_source_heading');
 const speed=Math.hypot(departure.x,departure.y);
 if(speed<.01||speed>.5)throw new RangeError(
  'v09l_untrusted_real_heading_speed');
 const p=source.pose.points;
 const neck={x:p[0].x-p[3].x,y:p[0].y-p[3].y};
 if(Math.hypot(neck.x,neck.y)<.001)
  throw new RangeError('v09l_degenerate_neck_direction');
 const theta=Math.atan2(departure.y,departure.x);
 const neckTheta=Math.atan2(neck.y,neck.x);
 return F({headingRadians:theta,neckHeadingRadians:neckTheta,
  headingToNeckMismatchRadians:Math.abs(wrap(theta-neckTheta)),
  speedWorldPerSecond:speed,
  sourceHead:snakeFloorToTerrariumV07c(p[0]),
  sourceTail:snakeFloorToTerrariumV07c(p.at(-1))});
}
const arcPoint=(h,f,left,sgn,r,a)=>
 xy(h.x+r*Math.sin(a)*f.x+sgn*r*(1-Math.cos(a))*left.x,
    h.y+r*Math.sin(a)*f.y+sgn*r*(1-Math.cos(a))*left.y);

/** Builds a limited set of mechanically distinct head-heading arcs. */
export function inspectSnakeTurnConfigurationsV09l({
 source,minimumRadiusPixels=62
}={}){
 if(source?.version!=='0.9C'||source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  !finite(minimumRadiusPixels)||minimumRadiusPixels<50||
  minimumRadiusPixels>150)
  throw new RangeError('v09l_invalid_source_or_radius');
 const h=sourceHeading(source);
 const f={x:Math.cos(h.headingRadians),y:Math.sin(h.headingRadians)};
 const left={x:-f.y,y:f.x};
 // Curvature: radius R and arc heading changes <1.23rad. No instant
 // reversal or point turn; exact source trajectory may still fail.
 const radii=[65,90,120,155];
 const configs=[];
 for(const sign of [1,-1]){
  for(const radius of radii){
   const firstAngle=.39,secondAngle=1.12;
   const first=arcPoint(h.sourceHead,f,left,sign,radius,firstAngle);
   const second=arcPoint(h.sourceHead,f,left,sign,radius,secondAngle);
   const convex=radius>=minimumRadiusPixels;
   const id=(sign===1?'left':'right')+'_r'+radius;
   const candidate=F({
    id,staging:F([first,second]),
    radiusPixels:radius,minimumRadiusPixels,
    firstTurnRadians:sign*firstAngle,
    secondTurnRadians:sign*secondAngle,
    firstLegPixels:dist(h.sourceHead,first),
    secondLegPixels:dist(first,second),
    radiusDesignGatePassed:convex,
    // A source pose is NEVER changed by proposing this geometry.
    arcCenterlineOnly:true,realSourceCollisionCertified:false
   });
   configs.push(candidate);
  }
 }
 return F({
  version:SNAKE_HEADING_TURN_V09L_VERSION,
  sourceFrame:source.verifiedFrames,
  headingRadians:h.headingRadians,
  neckHeadingRadians:h.neckHeadingRadians,
  headingToNeckMismatchRadians:h.headingToNeckMismatchRadians,
  sourceHead:h.sourceHead,sourceTail:h.sourceTail,
  minRadiusPixels:minimumRadiusPixels,
  sourceJointsChanged:false,
  // Reject proposals which cannot even fit floor bounds; the original
  // V0.9I body+scene+source simulation remains authoritative.
  candidates:F(configs)
 });
}
export function planSnakeHeadingReturnV09l({
 source,scene,terrain,visitedHeadFloors=[],
 horizonFrames=160,minimumRadiusPixels=62,seconds=1/30
}={}){
 const configs=inspectSnakeTurnConfigurationsV09l({
  source,minimumRadiusPixels
 });
 // V0.9I will validate scene revision, 24-joint source, 2D inflated
 // terrain AABB and nonlocal current body before simulation.
 const eligible=configs.candidates.filter(c=>c.radiusDesignGatePassed);
 const planned=planSnakeBodyDetourV09i({
  state:source,scene,terrain,horizonFrames,seconds,
  stagingCandidates:eligible.map(c=>F({
   id:c.id,staging:c.staging
  }))
 });
 const ranks=planned.status==='stale_scene_or_terrain'||
  planned.status==='original_body_not_clear'?null:
  chooseSnakeGoalReturnV09k({
   source,scene,planned,visitedHeadFloors
  });
 const ok=ranks?.ok===true;
 return F({
  version:SNAKE_HEADING_TURN_V09L_VERSION,
  ok,status:ok?'heading_arc_source_checked_and_goal_ranked':
   ranks?.status??planned.status,
  sourceFrame:source.verifiedFrames,
  configuredRadii:F(eligible.map(c=>c.radiusPixels)),
  headHeadingRadians:configs.headingRadians,
  neckMismatchRadians:configs.headingToNeckMismatchRadians,
  originalHead:configs.sourceHead,originalTail:configs.sourceTail,
  candidates:F(planned.candidates.map(c=>F({
   ...c,designRadiusPixels:configs.candidates.find(x=>
    x.id===c.id)?.radiusPixels??null
  }))),
  selectedId:ok?ranks.selectedId:null,
  selectedRoute:ok?ranks.selectedRoute:null,
  rankings:ranks?.candidateScores??F([]),
  plannedV09i:planned,rankedV09k:ranks,
  selectedPreviewFrameCount:ok?
   planned.candidates.find(c=>c.id===ranks.selectedId)
    ?.checkedSourceFrames??0:0,
  sourceJointsChanged:false,
  previewMovedSource:false,
  arc2DNotPhysicsProof:true,
  futureFramesNotAuthorized:true,
  allBodyReturnVerified:false,fullBodyReturnVerified:false,
  meshSweepCertified:false,skinApplied:false,saveModified:false
 });
}
export function advanceSnakeHeadingReturnV09l({
 source,scene,terrain,visitedHeadFloors=[],
 horizonFrames=160,minimumRadiusPixels=62,seconds=1/30
}={}){
 const preview=planSnakeHeadingReturnV09l({
  source,scene,terrain,visitedHeadFloors,
  horizonFrames,minimumRadiusPixels,seconds
 });
 if(!preview.ok)
  return F({version:SNAKE_HEADING_TURN_V09L_VERSION,
   phase:'return_wait_for_space',reason:preview.status,
   previousSource:source,preview,renderablePose:null,
   acceptedRealSourceStep:false,
   fullBodyReturnVerified:false,skinApplied:false,saveModified:false
  });
 const real=F({...source,route:preview.selectedRoute,
  returnTurnCommitted:false});
 const next=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:real,scene,terrain,seconds
 });
 if(next.phase!=='moving_return'||
  next.verifiedFrames!==source.verifiedFrames+1)
  return F({version:SNAKE_HEADING_TURN_V09L_VERSION,
   phase:'return_wait_for_space',reason:'source_step_replay_failed',
   previousSource:source,preview,renderablePose:null,
   acceptedRealSourceStep:false,
   fullBodyReturnVerified:false,skinApplied:false,saveModified:false
  });
 return F({...next,selectedConfigurationV09l:preview.selectedId,
  acceptedRealSourceStep:true,fullBodyReturnVerified:false,
  skinApplied:false,saveModified:false});
}
