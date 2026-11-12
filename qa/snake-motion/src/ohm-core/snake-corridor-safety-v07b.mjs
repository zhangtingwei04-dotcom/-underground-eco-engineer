/**
 * Project OHM SNAKE V0.7B — conservative WHOLE-BODY route safety.
 *
 * This is a pure XY floor-plane broad-phase guard for the existing V0.7A
 * head-trail chain. It checks every centerline BONE as a fixed-radius capsule
 * against authored circle/axis-aligned-rectangle obstacles and a corridor.
 * It intentionally STOPS instead of inventing an unverified path around rocks.
 *
 * Not snake muscle propulsion, true mesh collision, glass reflection,
 * vertical tunnel geometry, self collision, UV/skin, or species welfare.
 * All values are bounded artistic coordinates, not cm or observed behavior.
 */
import {
 createSnakeTravelRouteV07, sampleSnakeTravelPoseV07,
 advanceSnakeTravelStateV07
} from './snake-path-history-v07.mjs';

export const SNAKE_CORRIDOR_SAFETY_VERSION='0.7B';
const F=Object.freeze,finite=x=>typeof x==='number'&&Number.isFinite(x);
const between=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const fail=s=>{throw new RangeError(s)};
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
// Keep IDs compatible with the authoritative V0.3d scene contract
// (which permits digits first and uppercase), instead of rejecting safe
// geometry merely because object IDs use a legal naming style.
const validId=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(x);
const d2=(a,b)=>(a.x-b.x)**2+(a.y-b.y)**2;
const delta=(a,b)=>({x:b.x-a.x,y:b.y-a.y});
const dot=(a,b)=>a.x*b.x+a.y*b.y;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const pointToSegmentSquared=(p,a,b)=>{
 const v=delta(a,b),w=delta(a,p),v2=dot(v,v);
 const t=v2===0?0:clip(dot(w,v)/v2,0,1);
 return (p.x-a.x-t*v.x)**2+(p.y-a.y-t*v.y)**2;
};
const pointToRectangleSquared=(p,r)=>{
 const dx=Math.max(r.minX-p.x,0,p.x-r.maxX);
 const dy=Math.max(r.minY-p.y,0,p.y-r.maxY);
 return dx*dx+dy*dy;
};
const ccw=(a,b,c)=>cross(delta(a,b),delta(a,c));
const onSegment=(a,b,p)=>
 p.x>=Math.min(a.x,b.x)-1e-11&&
 p.x<=Math.max(a.x,b.x)+1e-11&&
 p.y>=Math.min(a.y,b.y)-1e-11&&
 p.y<=Math.max(a.y,b.y)+1e-11;
const intersects=(a,b,c,d)=>{
 const c1=ccw(a,b,c),c2=ccw(a,b,d),
   c3=ccw(c,d,a),c4=ccw(c,d,b);
 if(((c1>0&&c2<0)||(c1<0&&c2>0))&&
    ((c3>0&&c4<0)||(c3<0&&c4>0)))return true;
 return (Math.abs(c1)<1e-11&&onSegment(a,b,c))||
  (Math.abs(c2)<1e-11&&onSegment(a,b,d))||
  (Math.abs(c3)<1e-11&&onSegment(c,d,a))||
  (Math.abs(c4)<1e-11&&onSegment(c,d,b));
};
function segmentToRectangleSquared(a,b,r){
 if(pointToRectangleSquared(a,r)===0||
    pointToRectangleSquared(b,r)===0)return 0;
 const corners=[
  {x:r.minX,y:r.minY},{x:r.maxX,y:r.minY},
  {x:r.maxX,y:r.maxY},{x:r.minX,y:r.maxY}
 ];
 let shortest=Math.min(pointToRectangleSquared(a,r),pointToRectangleSquared(b,r));
 for(let i=0;i<4;i++){
  const p=corners[i],q=corners[(i+1)%4];
  if(intersects(a,b,p,q))return 0;
  shortest=Math.min(shortest,pointToSegmentSquared(p,a,b));
 }
 return shortest;
}
/** Authoring-only collision boundary, NOT a conversion of V0.3d units. */
export function createSnakeSafetyCorridorV07b({
 bounds,obstacles=[],margin=.005
}={}){
 if(!bounds||
   !between(bounds.minX,-50,50)||!between(bounds.minY,-50,50)||
   !between(bounds.maxX,-50,50)||!between(bounds.maxY,-50,50)||
   bounds.maxX-bounds.minX<.5||bounds.maxY-bounds.minY<.5||
   !between(margin,0,.2)||!Array.isArray(obstacles)||obstacles.length>32)
  fail('invalid_snake_corridor');
 const ids=new Set();
 const shapes=obstacles.map(o=>{
  if(!o||!validId(o.id)||ids.has(o.id)||!['circle','rectangle'].includes(o.kind))
   fail('invalid_snake_obstacle');
  ids.add(o.id);
  if(o.kind==='circle'){
   if(!between(o.x,-50,50)||!between(o.y,-50,50)||
      !between(o.radius,.01,10))fail('invalid_circle');
   return F({id:o.id,kind:o.kind,x:o.x,y:o.y,radius:o.radius});
  }
  if(!between(o.minX,-50,50)||!between(o.minY,-50,50)||
     !between(o.maxX,-50,50)||!between(o.maxY,-50,50)||
     o.maxX<=o.minX||o.maxY<=o.minY)fail('invalid_rectangle');
  return F({
   id:o.id,kind:o.kind,minX:o.minX,minY:o.minY,
   maxX:o.maxX,maxY:o.maxY
  });
 });
 return F({
  version:SNAKE_CORRIDOR_SAFETY_VERSION,
  bounds:F({
   minX:bounds.minX,maxX:bounds.maxX,
   minY:bounds.minY,maxY:bounds.maxY
  }),
  obstacles:F(shapes),margin,
  authority:'authored_collision_proxies_not_terrarium_3d_objects'
 });
}
const checkCorridor=area=>{
 if(area?.version!==SNAKE_CORRIDOR_SAFETY_VERSION||
    !area.bounds||!Array.isArray(area.obstacles))
  fail('invalid_corridor');
 // Never trust an external object that merely claims a valid version.
 // Revalidating prevents NaN margins/walls or malformed obstacles from
 // silently turning the entire broad-phase safety check into a false PASS.
 return createSnakeSafetyCorridorV07b({
  bounds:area.bounds,obstacles:area.obstacles,margin:area.margin
 });
};
const checkPose=pose=>{
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<8||pose.points.length>64||
    !between(pose.bodyRadius,.001,1)||
    !between(pose.segmentLength,.001,1)||
    pose.points.some(p=>!p||!finite(p.x)||!finite(p.y)||!finite(p.z)))
  fail('invalid_corridor_pose');
};
/**
 * All neighboring control points are tested as swept-radius segments.
 * A "clear" result certifies ONLY authored 2D capsule broad-phase checks.
 */
export function inspectSnakePoseCorridorV07b(pose,area){
 area=checkCorridor(area);checkPose(pose);
 const r=pose.bodyRadius+area.margin,b=area.bounds;
 for(let i=0;i<pose.points.length;i++){
  const p=pose.points[i];
  if(p.x<b.minX+r-1e-9||p.x>b.maxX-r+1e-9||
     p.y<b.minY+r-1e-9||p.y>b.maxY-r+1e-9)
   return F({ok:false,reason:'wall_boundary',boneIndex:i,obstacleId:null,
    geometricOnly:true});
 }
 for(let i=1;i<pose.points.length;i++){
  const a=pose.points[i-1],b=pose.points[i];
  for(const shape of area.obstacles){
   const distanceSquared=shape.kind==='circle'
    ?pointToSegmentSquared({x:shape.x,y:shape.y},a,b)
    :segmentToRectangleSquared(a,b,shape);
   const clearance=r+(shape.kind==='circle'?shape.radius:0);
   if(distanceSquared<clearance*clearance-1e-11)
    return F({ok:false,reason:'obstacle_intersection',
     boneIndex:i-1,obstacleId:shape.id,geometricOnly:true});
  }
 }
 return F({ok:true,reason:'clear_2d_capsules_only',
  boneIndex:null,obstacleId:null,geometricOnly:true});
}
function argsOrFail(options){
 if(!options||!between(options.length,.3,5)||
   !Number.isInteger(options.boneCount)||options.boneCount<8||
   options.boneCount>64||
   !between(options.bodyRadius,.001,Math.min(.5,options.length*.129)))
  fail('invalid_snake_body_envelope');
 return F({
  length:options.length,boneCount:options.boneCount,
  bodyRadius:options.bodyRadius
 });
}
const sample=(state,body)=>sampleSnakeTravelPoseV07(state,body);
function guardDistance(state,d,body,area){
 const sampled=F({...state,distance:d,movedLastStep:false,
  lastStepDistance:0});
 return inspectSnakePoseCorridorV07b(sample(sampled,body),area);
}
/** Evaluate EVERY step, not just the head, against the entire body. */
export function inspectSnakeTravelCorridorV07b(state,area,{
 body,maximumChecks=900
}={}){
 checkCorridor(area);
 const v=argsOrFail(body);
 if(!state?.route||!between(state.distance,0,state.route.length)||
    !Number.isInteger(maximumChecks)||maximumChecks<10||maximumChecks>900)
  fail('invalid_corridor_route_state');
 const increment=Math.min(v.bodyRadius*.5,v.length/(v.boneCount-1)*.45,.035);
 const count=Math.ceil(state.route.length/increment);
 if(count>maximumChecks)return F({
  ok:false,reason:'too_many_unchecked_steps',checked:0,
  firstBlockedAt:null,obstacleId:null,geometricOnly:true
 });
 for(let i=0;i<=count;i++){
  const d=i===count?state.route.length:i*state.route.length/count;
  const result=guardDistance(state,d,v,area);
  if(!result.ok)return F({
   ok:false,reason:result.reason,checked:i+1,firstBlockedAt:d,
   obstacleId:result.obstacleId,geometricOnly:true
  });
 }
 return F({ok:true,reason:'validated_proxy_checkpoints',
  checked:count+1,firstBlockedAt:null,obstacleId:null,
  geometricOnly:true});
}
/**
 * Optional candidates are AUTHOR-WRITTEN; no random automatic routing or
 * fabricated navigation decisions. A candidate is accepted only if the
 * ENTIRE chain clears the obstacle proxies through its whole traveled path.
 */
export function chooseSafeSnakeRouteV07b(candidates,area,{body}={}){
 checkCorridor(area);argsOrFail(body);
 if(!Array.isArray(candidates)||candidates.length<1||candidates.length>6)
  fail('invalid_route_candidates');
 const seen=new Set(),rejections=[];
 for(const c of candidates){
  if(!c||!validId(c.id)||seen.has(c.id)||!Array.isArray(c.waypoints))
   fail('invalid_route_candidate');
  seen.add(c.id);
  try{
   const route=createSnakeTravelRouteV07(c.waypoints);
   const state=F({version:'0.7A',route,distance:0,speed:.12,
    elapsedSeconds:0,lastStepDistance:0,movedLastStep:false});
   const result=inspectSnakeTravelCorridorV07b(state,area,{body});
   if(result.ok)return F({
    ok:true,id:c.id,route,
    testedCandidates:F([...rejections.map(r=>r.id),c.id]),
    rejected:F(rejections),
    status:'authored_candidate_passes_2d_proxy_checks_not_pathfinding'
   });
   rejections.push(F({id:c.id,reason:result.reason,obstacleId:result.obstacleId}));
  }catch(error){
   if(!(error instanceof RangeError))throw error;
   rejections.push(F({id:c.id,reason:'unusable_route_geometry',obstacleId:null}));
  }
 }
 return F({ok:false,reason:'no_verified_route',route:null,
  rejected:F(rejections),
  status:'stopped_no_route_not_autonomous_navigation'});
}
/** Advance with conservative substeps. Stop before first detected collision. */
export function advanceSnakeSafelyV07b(state,area,{
 body,seconds=0,moving=true,pace=1
}={}){
 checkCorridor(area);
 const v=argsOrFail(body);
 const target=advanceSnakeTravelStateV07(state,{seconds,moving,pace});
 const initial=guardDistance(state,state.distance,v,area);
 if(!initial.ok)return F({
  ok:false,mode:'unsafe_start',state,reason:initial.reason,
  obstacleId:initial.obstacleId,geometricOnly:true
 });
 if(target.distance===state.distance)return F({
  ok:true,mode:'resting',state:target,reason:null,
  obstacleId:null,geometricOnly:true
 });
 const step=Math.min(v.bodyRadius*.45,
  v.length/(v.boneCount-1)*.4,.03);
 const count=Math.ceil((target.distance-state.distance)/step);
 if(count>900)return F({
  ok:false,mode:'step_limit',state,reason:'too_many_unchecked_steps',
  obstacleId:null,geometricOnly:true
 });
 let lastSafe=state.distance;
 for(let i=1;i<=count;i++){
  const next=state.distance+
   (target.distance-state.distance)*i/count;
  const result=guardDistance(state,next,v,area);
  if(!result.ok){
   // Explicitly stop SHORT of the first blocked progress value. Binary
   // search is monotonic only over this small, verified substep.
   let lo=lastSafe,hi=next;
   for(let k=0;k<24;k++){
    const mid=(lo+hi)/2;
    if(guardDistance(state,mid,v,area).ok)lo=mid;
    else hi=mid;
   }
   const dist=Math.max(state.distance,lo-1e-7);
   const conservative=guardDistance(state,dist,v,area);
   if(!conservative.ok)return F({
    ok:false,mode:'blocked',state,reason:result.reason,
    obstacleId:result.obstacleId,geometricOnly:true
   });
   const delta=dist-state.distance;
   const stopped=F({
    ...state,distance:dist,elapsedSeconds:target.elapsedSeconds,
    movedLastStep:delta>0,lastStepDistance:delta
   });
   return F({ok:false,mode:'blocked',state:stopped,
    reason:result.reason,obstacleId:result.obstacleId,geometricOnly:true});
  }
  lastSafe=next;
 }
 return F({ok:true,mode:'moving',state:target,
  reason:null,obstacleId:null,geometricOnly:true});
}
