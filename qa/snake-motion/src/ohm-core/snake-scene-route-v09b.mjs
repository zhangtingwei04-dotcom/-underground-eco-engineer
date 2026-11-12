/**
 * Public, synthetic V0.9B. A bounded SOURCE SCENE grid supplies a reversible
 * XY centerline route and first local heading. Then V0.9A/V0.8E check real
 * 24-bone source motion. The XY graph does NOT certify complete 3D return,
 * narrow tunnel passage, site arrival, feeding, sheltering or observation.
 *
 * Scene.objects and revision always belong to V0.3d. No copy of hidden
 * private physics, no user saves, no material/skin or biological values.
 */
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';
import {snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {planSnakeAutonomousSegmentV09a}
 from './snake-autonomous-intent-v09a.mjs';

export const SNAKE_SCENE_ROUTE_V09B_VERSION='0.9B';
const F=Object.freeze;
const isNum=x=>typeof x==='number'&&Number.isFinite(x);
const isId=x=>typeof x==='string'&&/^[a-z][a-z0-9_-]{0,63}$/.test(x);
const WIDTH=1000,HEIGHT=400;
const LIMIT=8000,EPS=1e-9;
const asXY=p=>F({x:p.x,y:p.y});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const same=(a,b)=>a.x===b.x&&a.y===b.y;
const offsets=F([[1,0],[-1,0],[0,1],[0,-1],
                  [1,1],[-1,1],[1,-1],[-1,-1]]);
function validFloor(p){
 return p&&isNum(p.x)&&isNum(p.y)&&p.x>=0&&p.x<=WIDTH&&
  p.y>=0&&p.y<=HEIGHT;
}
function checkScene(scene,gridPixels,bodyClearancePixels){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
   !Number.isInteger(gridPixels)||gridPixels<10||gridPixels>40||
   !isNum(bodyClearancePixels)||bodyClearancePixels<12||
   bodyClearancePixels>75)
  throw new RangeError('v09b_invalid_scene_or_grid');
}
/** Conservative AABB all-objects-solid proxy, consistent with V0.7C. */
function inside(p,scene,pad){
 if(p.x<pad||p.y<pad||p.x>WIDTH-pad||p.y>HEIGHT-pad)
  return false;
 return !scene.objects.some(o=>
  p.x>=o.x-pad&&p.x<=o.x+o.width+pad&&
  p.y>=o.y-pad&&p.y<=o.y+o.depth+pad);
}
function segmentBlocked(a,b,scene,pad){
 if(!inside(a,scene,pad)||!inside(b,scene,pad))return true;
 for(const o of scene.objects){
  const box={x0:o.x-pad,x1:o.x+o.width+pad,
             y0:o.y-pad,y1:o.y+o.depth+pad};
  let lo=0,hi=1;
  for(const [x,d,min,max] of [
   [a.x,b.x-a.x,box.x0,box.x1],
   [a.y,b.y-a.y,box.y0,box.y1]
  ]){
   if(Math.abs(d)<EPS){if(x>=min&&x<=max){continue}
                        lo=2;break;}
   let t0=(min-x)/d,t1=(max-x)/d;
   if(t0>t1)[t0,t1]=[t1,t0];
   lo=Math.max(lo,t0);hi=Math.min(hi,t1);
  }
  if(lo<=hi&&lo<=1&&hi>=0)return true;
 }
 return false;
}
function grid(scene,step,pad){
 const nx=Math.floor(WIDTH/step),ny=Math.floor(HEIGHT/step);
 const nodes=Array.from({length:nx*ny},(_,id)=>{
  const ix=id%nx,iy=Math.floor(id/nx),
   point={x:(ix+.5)*step,y:(iy+.5)*step};
  return F({id,ix,iy,point:F(point),open:inside(point,scene,pad)});
 });
 if(nodes.length>LIMIT)throw new RangeError('v09b_grid_too_large');
 const index=(x,y)=>x>=0&&y>=0&&x<nx&&y<ny?y*nx+x:-1;
 const neighbors=id=>{
  const n=nodes[id],out=[];
  for(const [dx,dy] of offsets){
   const nextId=index(n.ix+dx,n.iy+dy);
   if(nextId<0||!nodes[nextId].open)continue;
   // No diagonal corner-cutting, and never cross a padded AABB edge.
   if(dx&&dy&&
    (!nodes[index(n.ix+dx,n.iy)].open||
     !nodes[index(n.ix,n.iy+dy)].open))continue;
   if(!segmentBlocked(n.point,nodes[nextId].point,scene,pad))
    out.push(nextId);
  }
  return out;
 };
 return {nodes,index,neighbors};
}
function nearestConnector(pos,g,scene,pad,step){
 const valid=g.nodes.filter(n=>n.open&&
  dist(n.point,pos)<=step*2.3&&
  !segmentBlocked(pos,n.point,scene,pad));
 valid.sort((a,b)=>dist(a.point,pos)-dist(b.point,pos)||a.id-b.id);
 return valid[0]?.id??null;
}
/** Dijkstra for small bounded grid; deterministic id order on ties. */
function search(from,to,g){
 const scores=new Float64Array(g.nodes.length).fill(Infinity);
 const prev=new Int32Array(g.nodes.length).fill(-1);
 const visited=new Uint8Array(g.nodes.length);
 scores[from]=0;
 for(let i=0;i<g.nodes.length;i++){
  let curr=-1,best=Infinity;
  for(let k=0;k<scores.length;k++){
   if(!visited[k]&&(scores[k]<best-EPS||
    Math.abs(scores[k]-best)<EPS&&(curr<0||k<curr))){
    curr=k;best=scores[k];
   }
  }
  if(curr<0||best===Infinity)break;
  visited[curr]=1;
  if(curr===to)break;
  for(const next of g.neighbors(curr)){
   const d=dist(g.nodes[curr].point,g.nodes[next].point);
   if(scores[curr]+d<scores[next]-EPS){
    scores[next]=scores[curr]+d;prev[next]=curr;
   }
  }
 }
 const path=[];
 if(scores[to]<Infinity){
  let pos=to;
  for(let n=0;pos!==-1&&n<g.nodes.length;n++){
   path.push(g.nodes[pos].point);pos=prev[pos];
  }
  path.reverse();
 }
 return {path,cost:scores[to],visited,scores};
}
const result=(scene,status,extra={})=>F({
 version:SNAKE_SCENE_ROUTE_V09B_VERSION,
 sceneId:scene.sceneId,sceneRevision:scene.revision,status,
 graphTwoWayOnly:true,fullBodyReturnVerified:false,
 destinationArrived:false,skinApplied:false,
 path:F([]),returnPath:F([]),...extra
});
/**
 * GOAL is a (real, explicit) V0.3d floor coordinate. All obstacles come from
 * scene-owned source geometry; safe/reachable booleans are not an authority.
 */
export function findSnakeSceneRouteV09b({
 scene,startFloor,goalFloor,expectedRevision=null,
 gridPixels=20,bodyClearancePixels=22
}={}){
 checkScene(scene,gridPixels,bodyClearancePixels);
 if(!validFloor(startFloor)||!validFloor(goalFloor)||
    expectedRevision!==null&&
    (!Number.isSafeInteger(expectedRevision)||expectedRevision<0))
  throw new RangeError('v09b_invalid_floor_points');
 if(expectedRevision!==null&&expectedRevision!==scene.revision)
  return result(scene,'STALE_SCENE');
 const start=asXY(startFloor),goal=asXY(goalFloor);
 if(!inside(start,scene,bodyClearancePixels))
  return result(scene,'BLOCKED_START');
 const g=grid(scene,gridPixels,bodyClearancePixels);
 const a=nearestConnector(start,g,scene,bodyClearancePixels,gridPixels);
 if(a===null)return result(scene,'BLOCKED_START_CONNECTOR');
 const goalInside=inside(goal,scene,bodyClearancePixels);
 const b=goalInside?nearestConnector(
  goal,g,scene,bodyClearancePixels,gridPixels):null;
 if(b!==null){
  const outward=search(a,b,g);
  if(outward.path.length){
   const inward=search(b,a,g);
   if(!inward.path.length){
    return result(scene,'NO_GRID_RETURN',{
     path:F([start,...outward.path,goal].map(asXY)),
     oneWayCostPixels:outward.cost});
   }
   return result(scene,'SAFE_GRID_BIDIRECTIONAL',{
    path:F([start,...outward.path,goal].map(asXY)),
    returnPath:F([goal,...inward.path,start].map(asXY)),
    outboundGridCostPixels:outward.cost,
    returnGridCostPixels:inward.cost,
    startFloor:start,goalFloor:goal,
    disclaimer:'reversible_2d_centerline_proxy_not_real_3d_return'
   });
  }
 }
 // No full route: report the closest reachable SAFE cell as a tentative
 // approach; never label this as reached and never enter the blocked goal.
 const from=search(a,a,g);
 // BFS connected component: no destination needed.
 const seen=new Uint8Array(g.nodes.length);
 const stack=[a];seen[a]=1;
 let nearest=a;
 while(stack.length){
  const cur=stack.pop();
  if(dist(g.nodes[cur].point,goal)<
     dist(g.nodes[nearest].point,goal)-EPS)nearest=cur;
  for(const next of g.neighbors(cur)){
   if(!seen[next]){seen[next]=1;stack.push(next)}
  }
 }
 const approach=search(a,nearest,g);
 return result(scene,'APPROACH_ONLY',{
  path:F([start,...approach.path].map(asXY)),
  fallbackFloor:asXY(g.nodes[nearest].point),
  blockedGoal:!goalInside,
  distanceToGoalPixels:dist(g.nodes[nearest].point,goal),
  disclaimer:'approach_requires_3d_movement_preview_no_arrival'
 });
}
function generatedHeadings(route,siteId){
 const path=route.path;
 if(!path||path.length<2)return F([]);
 // Skip tiny initial grid connector; use a slightly farther waypoint
 // for a stable heading rather than 1px grid snapping jitter.
 let follow=path.find(p=>dist(p,path[0])>=28);
 if(!follow)follow=path.at(-1);
 const dx=follow.x-path[0].x,dy=follow.y-path[0].y;
 if(Math.hypot(dx,dy)<3)return F([]);
 const base=Math.atan2(dy,dx),offsetAngles=[0,-.18,.18,-.36,.36,-.55,.55];
 return F(offsetAngles.map((delta,i)=>{
  const a=base+delta;
  return F({id:siteId.slice(0,15)+'_route_'+i,
   departure:F({x:Number((.1*Math.cos(a)).toFixed(6)),
                 y:Number((.1*Math.sin(a)).toFixed(6))}),
   turnRadians:.24});
 }));
}
/**
 * End-to-end synthetic intent + geometry + real 24-bone short-horizon QA.
 * A route is considered potentially usable only when its **same-source**
 * XY graph is reversible. V0.9A still chooses rest or target based on needs.
 */
export function planSnakeSceneAutonomyV09b({
 actorId='synthetic_snake',scene,terrain,wallState,ecologySnapshot,
 needs={},dayPhase='day',siteFloors,
 bodyClearancePixels=22,gridPixels=20,horizonFrames=60
}={}){
 checkScene(scene,gridPixels,bodyClearancePixels);
 if(!siteFloors||typeof siteFloors!=='object'||
    Array.isArray(siteFloors)||
    Object.keys(siteFloors).some(k=>!isId(k)||!validFloor(siteFloors[k])))
  throw new RangeError('v09b_invalid_site_floors');
 if(wallState?.pose?.points?.length!==13||
    ecologySnapshot?.revision!==scene.revision)
  return F({version:SNAKE_SCENE_ROUTE_V09B_VERSION,
   ok:false,reason:'wall_or_ecology_scene_mismatch',motion:null,
   routes:F([]),fullReturnVerified:false});
 const head=snakeFloorToTerrariumV07c(wallState.pose.points[0]);
 const routes=[],departures=Object.create(null);
 const lookup=new Map(ecologySnapshot.sites.map(s=>[s.id,s]));
 for(const [siteId,goalFloor] of Object.entries(siteFloors)){
  if(!lookup.has(siteId))continue;
  const route=findSnakeSceneRouteV09b({
   scene,startFloor:head,goalFloor,
   gridPixels,bodyClearancePixels,expectedRevision:scene.revision
  });
  routes.push(F({siteId,status:route.status,
   generatedCandidateCount:route.status==='SAFE_GRID_BIDIRECTIONAL'?
    generatedHeadings(route,siteId).length:0,
   destinationArrived:false,fullBodyReturnVerified:false}));
  if(route.status==='SAFE_GRID_BIDIRECTIONAL'){
   const heads=generatedHeadings(route,siteId);
   if(heads.length)departures[siteId]=heads;
  }
 }
 // Snapshot can suggest opportunity, but scene graph must authorize
 // whether it is reachable: never trust a lone caller-supplied true.
 const revised=F({...ecologySnapshot,sites:F(
  ecologySnapshot.sites.map(s=>F({...s,
   reachable:s.reachable&&Object.hasOwn(departures,s.id)}))
 )});
 const motion=planSnakeAutonomousSegmentV09a({
  actorId,scene,terrain,wallState,ecologySnapshot:revised,
  needs,dayPhase,siteDepartures:departures,horizonFrames
 });
 return F({version:SNAKE_SCENE_ROUTE_V09B_VERSION,
  ok:motion.ok,reason:motion.reason??null,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  sourceHeadFloor:head,routes:F(routes),
  motion,
  graphTwoWayOnly:true,fullReturnVerified:false,
  realShortSegmentPreviewed:motion.ok,
  noAuthoredVectors:true,skinApplied:false,
  playerObservationRecorded:false,saveModified:false});
}
