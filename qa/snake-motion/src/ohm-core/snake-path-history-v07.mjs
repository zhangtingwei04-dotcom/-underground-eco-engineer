/**
 * Project OHM Snake V0.7A — bounded, deterministic head-trail locomotion.
 *
 * A head moves along an authored (smoothly interpolated) route. Each following
 * centerline node searches BACKWARD along the SAME TRAIL for its exact
 * Euclidean segment distance. There is no independent traveling sinusoid:
 * when distance stops, the entire body stops and keeps its curved history.
 *
 * Coordinate/time units and pace are ART PROTOTYPES only, not real locomotor
 * speed, lateral force, muscle, friction, self-collision, terrain, or welfare.
 * No animation clock, DOM, Phaser, random generator, or persistent save writes.
 */
export const SNAKE_PATH_HISTORY_VERSION='0.7A';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const bounded=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
const point=(x,y)=>F({x,y});
const p3=(x,y,z)=>F({x,y,z});
const distance=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y);
const err=k=>{throw new RangeError(k)};
const bend=(a,b,c,d,t)=>{
 const t2=t*t,t3=t2*t;
 return .5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+
   (-a+3*b-3*c+d)*t3);
};
/** Create immutable route from authored waypoints (never calculated from saves). */
export function createSnakeTravelRouteV07(waypoints,{subdivisions=16}={}){
 if(!Array.isArray(waypoints)||waypoints.length<2||waypoints.length>32||
   !Number.isInteger(subdivisions)||subdivisions<6||subdivisions>40)
  err('invalid_travel_route');
 const controls=waypoints.map(p=>{
  if(!p||!bounded(p.x,-50,50)||!bounded(p.y,-50,50))
   err('invalid_travel_waypoint');
  return point(p.x,p.y);
 });
 for(let i=1;i<controls.length;i++){
  if(distance(controls[i],controls[i-1])<.05)
   err('duplicate_or_near_waypoint');
 }
 let length=0;
 const samples=[F({x:controls[0].x,y:controls[0].y,s:0})];
 for(let i=0;i<controls.length-1;i++){
  const a=controls[Math.max(0,i-1)],b=controls[i],
    c=controls[i+1],d=controls[Math.min(controls.length-1,i+2)];
  for(let j=1;j<=subdivisions;j++){
   const t=j/subdivisions;
   // Keep authored waypoint identity exact at each curve endpoint;
   // Catmull polynomial rounding may otherwise produce 3.19999999 vs 3.2.
   const next=j===subdivisions?c:point(
     bend(a.x,b.x,c.x,d.x,t),
     bend(a.y,b.y,c.y,d.y,t)
   );
   const last=samples.at(-1);
   const step=distance(last,next);
   if(!finite(step))err('invalid_route_geometry');
   if(step<1e-9)continue;
   length+=step;
   samples.push(F({x:next.x,y:next.y,s:length}));
  }
 }
 if(!bounded(length,.05,180)||samples.length<3)err('invalid_route_length');
 const start=samples[0],other=samples.find(p=>p.s>.0001);
 const dx=(other.x-start.x)/other.s,dy=(other.y-start.y)/other.s;
 const tangent=point(dx,dy);
 return F({
  version:SNAKE_PATH_HISTORY_VERSION,
  waypoints:F(controls),samples:F(samples),
  length,entryTangent:tangent,
  status:'authored_xy_trail_not_navigation_or_physics'
 });
}
function validRoute(route){
 return route?.version===SNAKE_PATH_HISTORY_VERSION&&
  Array.isArray(route.samples)&&route.samples.length>=3&&
  bounded(route.length,.05,180)&&
  route.entryTangent&&bounded(route.entryTangent.x,-1.01,1.01)&&
  bounded(route.entryTangent.y,-1.01,1.01)&&
  route.samples[0]?.s===0&&
  route.samples.at(-1)?.s===route.length;
}
/** Evaluate route arclength, including straight extension BEFORE first point. */
export function sampleSnakeTravelRouteV07(route,s){
 if(!validRoute(route)||!bounded(s,-200,180))err('invalid_trail_sample');
 if(s<=0){
  const p=route.samples[0];
  return point(p.x+s*route.entryTangent.x,p.y+s*route.entryTangent.y);
 }
 const end=route.samples.at(-1);
 if(s>=route.length)return point(end.x,end.y);
 let lo=0,hi=route.samples.length-1;
 while(hi-lo>1){
  const mid=(lo+hi)>>1;
  if(route.samples[mid].s<=s)lo=mid;else hi=mid;
 }
 const a=route.samples[lo],b=route.samples[hi];
 const t=(s-a.s)/(b.s-a.s);
 return point(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t);
}
/** Motion budget in art units. Preserves the exact distance when resting. */
export function createSnakeTravelStateV07(route,{distance:travel=0,speed=.12}={}){
 if(!validRoute(route)||!bounded(travel,0,route.length)||
   !bounded(speed,0,2))err('invalid_travel_state');
 return F({
  version:SNAKE_PATH_HISTORY_VERSION,route,
  distance:travel,speed,elapsedSeconds:0,
  movedLastStep:false,lastStepDistance:0,
  status:'art_speed_not_measured_species_velocity'
 });
}
export function advanceSnakeTravelStateV07(state,{
 seconds=0,moving=true,pace=1
}={}){
 if(!state||state.version!==SNAKE_PATH_HISTORY_VERSION||
   !validRoute(state.route)||
   !bounded(state.distance,0,state.route.length)||
   !bounded(state.speed,0,2)||!bounded(state.elapsedSeconds,0,1e7)||
   !bounded(seconds,0,60)||typeof moving!=='boolean'||!bounded(pace,0,1))
  err('invalid_travel_step');
 const delta=moving?Math.min(state.route.length-state.distance,
   seconds*state.speed*pace):0;
 return F({
  ...state,distance:Math.min(state.route.length,state.distance+delta),
  elapsedSeconds:state.elapsedSeconds+seconds,
  lastStepDistance:delta,movedLastStep:delta>0
 });
}
/**
 * Search the head's travelled path for each following node. Intersect the
 * route with a circle of radius ds centered at the preceding node; bisection
 * places every node at fixed Euclidean distance, even through turns.
 *
 * This is a centerline trail, not friction/contact or body self-collision.
 */
export function sampleSnakeTravelPoseV07(state,{
 length=1.4,boneCount=24,bodyRadius=.06
}={}){
 if(!state||state.version!==SNAKE_PATH_HISTORY_VERSION||
   !validRoute(state.route)||
   !bounded(state.distance,0,state.route.length)||
   !bounded(length,.3,5)||!Number.isInteger(boneCount)||
   boneCount<8||boneCount>64||
   !bounded(bodyRadius,.001,length*.129))
  err('invalid_route_pose');
 const ds=length/(boneCount-1);
 const spine=new Array(boneCount),arc=new Array(boneCount);
 const route=state.route;
 const head=sampleSnakeTravelRouteV07(route,state.distance);
 spine[0]=p3(head.x,head.y,bodyRadius);
 arc[0]=state.distance;
 for(let i=1;i<boneCount;i++){
  const prev=spine[i-1],previousS=arc[i-1];
  // Sampling backward in steps shorter than a segment guards against
  // accidentally skipping a tight curve's FIRST circle intersection.
  const increment=ds/5;
  let high=previousS,low=high,found=false;
  const furthest=previousS-length*5;
  for(let k=0;k<1350;k++){
   low=Math.max(furthest,high-increment);
   const candidate=sampleSnakeTravelRouteV07(route,low);
   const error=distance(prev,candidate)-ds;
   if(error>=0){found=true;break;}
   if(low===furthest)break;
   high=low;
  }
  if(!found)err('route_too_tightly_curved_for_body');
  // high point lies inside the circle; low point is outside.
  for(let k=0;k<42;k++){
   const mid=(low+high)*.5;
   const test=sampleSnakeTravelRouteV07(route,mid);
   if(distance(prev,test)>=ds)low=mid;else high=mid;
  }
  const s=(low+high)*.5;
  const p=sampleSnakeTravelRouteV07(route,s);
  spine[i]=p3(p.x,p.y,bodyRadius);
  arc[i]=s;
 }
 return F({
  version:SNAKE_PATH_HISTORY_VERSION,
  mode:'ground',length,boneCount,bodyRadius,
  segmentLength:ds,time:state.elapsedSeconds,
  points:F(spine),arcDistances:F(arc),
  contactIndices:F(Array.from({length:boneCount},(_,i)=>i)),
  travelDistance:state.distance,
  isMoving:state.movedLastStep,
  source:'head_travel_history_fixed_length',
  status:'trail_kinematics_no_physics_terrain_or_self_collision'
 });
}
