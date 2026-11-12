/**
 * Public synthetic OHM V0.9K — goal-directed, revisit-aware return ranking.
 *
 * V0.9I already simulated all five distinct staging routes against the
 * genuine 24-joint V0.9C source plus V0.9D/G safety. Here we score ONLY
 * those source-accepted trials with: a source-scene V0.9B 2D home route,
 * predicted head AND tail distances, trend along the tested head trace,
 * and prior actually visited head locations.
 *
 * A grid path is a PLANNING HEURISTIC, NEVER physical clearance proof.
 * Selected staging can commit ONE step through V0.9D/G, nothing more.
 * Never weaken source guards, relabel arrival, alter original pose,
 * implement player saves or apply an animal skin.
 */
import {findSnakeSceneRouteV09b}
 from './snake-scene-route-v09b.mjs';
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';

export const SNAKE_GOAL_RETURN_SELECTION_V09K_VERSION='0.9K';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const projection=p=>F({x:p.x,y:p.y});

function assertInput(source,scene,planned,visited){
 if(source?.version!=='0.9C'||source.phase!=='moving_return'||
  source.pose?.points?.length!==24||
  !source.startFloor||
  !finite(source.startFloor.x)||!finite(source.startFloor.y)||
  source.sceneId!==scene?.sceneId||
  source.sceneRevision!==scene?.revision||
  planned?.version!=='0.9I'||
  planned.sourceStartFrame!==source.verifiedFrames||
  !Array.isArray(planned.candidates)||
  planned.candidates.length>8||
  !Array.isArray(visited)||visited.length>20||
  visited.some(v=>!v||!finite(v.x)||!finite(v.y)||
   v.x<0||v.x>1000||v.y<0||v.y>400))
  throw new RangeError('v09k_requires_source_verified_plan');
}
function graphCost(scene,head,home){
 const graph=findSnakeSceneRouteV09b({
  scene,startFloor:head,goalFloor:home,
  expectedRevision:scene.revision,
  gridPixels:20,bodyClearancePixels:22
 });
 if(graph.status!=='SAFE_GRID_BIDIRECTIONAL')
  return F({reachable:false,cost:Infinity,status:graph.status});
 const points=graph.path;
 let cost=0;
 for(let i=1;i<points.length;i++)cost+=dist(points[i],points[i-1]);
 return F({reachable:true,cost,status:graph.status});
}
function rankCandidate(source,scene,c,visited){
 const relevant=c.accepted===true&&c.stagingGeometryClear===true&&
  c.lastHeadFloor&&c.lastTailFloor&&
  Array.isArray(c.previewHeadSamples)&&
  c.previewHeadSamples.length>0&&
  [c.lastHeadFloor.x,c.lastHeadFloor.y,
   c.lastTailFloor.x,c.lastTailFloor.y].every(finite);
 if(!relevant)return F({id:c.id,eligible:false,
  reason:c.reason??'source_not_accepted',
  score:Infinity,revisits:0,
  remaining2DGraphCostPx:Infinity,
  fullBodyReturnVerified:false});
 const route=graphCost(scene,c.lastHeadFloor,source.startFloor);
 if(!route.reachable)
  return F({id:c.id,eligible:false,
   reason:'goal_graph_'+route.status,score:Infinity,revisits:0,
   remaining2DGraphCostPx:Infinity,
   fullBodyReturnVerified:false});
 // Only old real observed positions may act as revisit evidence;
 // a shadow sample is never written into real visit history.
 const old=visited.slice(0,-1);
 let revisitCount=0;
 for(const point of c.previewHeadSamples){
  if(old.some(prev=>dist(point,prev)<28))revisitCount++;
 }
 // Do not hard-block a route merely for one crossing: a real U-turn may
 // legally cross a nearby projected XY region at a different time.
 // Repeatedly looping the same corridor is a strong "rest/replan" signal.
 const repeatedLoop=revisitCount>=4&&old.length>=4;
 const prev=c.previewHeadSamples.length>1?
  c.previewHeadSamples.at(-2):
  snakeFloorToTerrariumV07c(source.pose.points[0]);
 const finalStep=d=>dist(d,source.startFloor);
 const outwardTrend=Math.max(0,finalStep(c.lastHeadFloor)-
  finalStep(prev));
 const headDist=dist(c.lastHeadFloor,source.startFloor);
 const tailDist=dist(c.lastTailFloor,source.startFloor);
 const score=route.cost+
  .34*tailDist+
  .18*headDist+
  outwardTrend*.6+
  revisitCount*26;
 return F({
  id:c.id,eligible:!repeatedLoop,
  reason:repeatedLoop?'repeated_path_without_new_space':null,
  score,revisits:revisitCount,
  predictedHeadHomePx:headDist,
  predictedTailHomePx:tailDist,
  terminalOutwardTrendPx:outwardTrend,
  remaining2DGraphCostPx:route.cost,
  graphStatus:route.status,
  graph2DNotCollisionAuthority:true,
  sourcePreviewAccepted:true,
  fullBodyReturnVerified:false
 });
}
/**
 * This selector cannot manufacture candidates. It chooses among V0.9I
 * candidates ALREADY source-validated for the entire preview horizon.
 */
export function chooseSnakeGoalReturnV09k({
 source,scene,planned,visitedHeadFloors=[]
}={}){
 assertInput(source,scene,planned,visitedHeadFloors);
 const scored=F(planned.candidates.map(c=>
  rankCandidate(source,scene,c,visitedHeadFloors)));
 const allowed=scored.filter(c=>c.eligible)
  .sort((a,b)=>a.score-b.score||
   a.revisits-b.revisits||a.id.localeCompare(b.id,'en'));
 const best=allowed[0]??null;
 const selected=planned.candidates.find(c=>c.id===best?.id);
 return F({
  version:SNAKE_GOAL_RETURN_SELECTION_V09K_VERSION,
  ok:!!best,
  status:best?'source_preview_plus_goal_graph_ranked':
   'rest_no_goal_reachable_source_preview',
  sourceFrame:source.verifiedFrames,
  selectedId:best?.id??null,
  selectedRoute:selected?.proposedRoute??null,
  selectedScore:best?.score??null,
  candidateScores:scored,
  actualVisitedFloorCount:visitedHeadFloors.length,
  originalSourceJointsChanged:false,
  previewOnlyNoSourceMovement:true,
  sourceV09dV09gStillMandatory:true,
  graph2DOnlyNotBodyClearance:true,
  fullBodyReturnVerified:false,
  meshSweepCertified:false,
  skinApplied:false,saveModified:false
 });
}
