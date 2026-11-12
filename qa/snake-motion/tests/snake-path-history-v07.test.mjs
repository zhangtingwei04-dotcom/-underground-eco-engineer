import assert from 'node:assert/strict';
import {
 SNAKE_PATH_HISTORY_VERSION,createSnakeTravelRouteV07,
 sampleSnakeTravelRouteV07,createSnakeTravelStateV07,
 advanceSnakeTravelStateV07,sampleSnakeTravelPoseV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {
 createSnakeGrowthMotionBridge,sampleSnakeGrowthMotionFrame
} from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {sampleCornSnakeActivityV06}
 from '../src/ohm-core/corn-snake-activity-v06.mjs';
import {inspectUniversalSnakePose}
 from '../src/ohm-core/snake-skeleton-motion.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';

const close=(a,b,eps=1e-7)=>Math.abs(a-b)<=eps;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const source=[
 {x:0,y:0},{x:.8,y:0},{x:1.35,y:.05},
 {x:1.85,y:.48},{x:2.45,y:.77},{x:3.2,y:.75}
];
const original=JSON.stringify(source);
const route=createSnakeTravelRouteV07(source);
assert.equal(SNAKE_PATH_HISTORY_VERSION,'0.7A');
assert.equal(route.version,'0.7A');
assert.ok(route.length>3&&route.length<5);
assert.ok(Object.isFrozen(route));
assert.ok(Object.isFrozen(route.samples));
assert.ok(Object.isFrozen(route.samples[0]));
assert.ok(Object.isFrozen(route.waypoints[0]));
assert.equal(JSON.stringify(source),original);
assert.deepEqual(route,createSnakeTravelRouteV07(source),'deterministic spline');
assert.deepEqual(sampleSnakeTravelRouteV07(route,0),route.waypoints[0]);
assert.deepEqual(sampleSnakeTravelRouteV07(route,route.length),route.waypoints.at(-1));
assert.deepEqual(sampleSnakeTravelRouteV07(route,route.length+1),
 route.waypoints.at(-1),'no motion beyond destination');
const behind=sampleSnakeTravelRouteV07(route,-.5);
assert.ok(close(behind.x,-.5*route.entryTangent.x,1e-7)&&
 close(behind.y,-.5*route.entryTangent.y,1e-7),
 'before route start the tail follows the actual entry tangent, not a hardcoded horizontal axis');
const initial=createSnakeTravelStateV07(route,{speed:.22});
assert.equal(initial.distance,0);
let state=initial;
const checkpoints=[];
for(let i=0;i<40;i++){
 state=advanceSnakeTravelStateV07(state,{seconds:.25,moving:true});
 if(i%6===0)checkpoints.push(state);
}
assert.ok(state.distance>1&&state.distance<route.length);
assert.equal(state.speed,.22);
assert.equal(initial.distance,0,'pure advance must not change old state');
const stop=advanceSnakeTravelStateV07(state,{seconds:4,moving:false,pace:0});
assert.equal(stop.distance,state.distance);
assert.equal(stop.movedLastStep,false);
assert.equal(stop.elapsedSeconds,state.elapsedSeconds+4);
const held=sampleSnakeTravelPoseV07(stop,{length:1.4});
const movingPose=sampleSnakeTravelPoseV07(state,{length:1.4});
assert.deepEqual(held.points,movingPose.points,
 'at rest all body nodes stay where they were; no oscillating fake wave');
assert.ok(Object.isFrozen(held.points));
assert.ok(Object.isFrozen(held.points[0]));
assert.ok(Object.isFrozen(held.arcDistances));
assert.equal(held.isMoving,false);
const zeroPace=advanceSnakeTravelStateV07(state,{seconds:2,moving:true,pace:0});
assert.equal(zeroPace.distance,state.distance);
const finish=advanceSnakeTravelStateV07(initial,{
 seconds:60,moving:true,pace:1
});
assert.ok(finish.distance<=route.length);
let atEnd=finish;
for(let i=0;i<8;i++)atEnd=advanceSnakeTravelStateV07(atEnd,{seconds:60});
assert.equal(atEnd.distance,route.length);
assert.equal(atEnd.movedLastStep,false);
assert.equal(sampleSnakeTravelPoseV07(atEnd).points[0].x,
 sampleSnakeTravelRouteV07(route,route.length).x);

let frames=0;
for(const bodyLength of [.5,1.4,3]){
 for(const boneCount of [12,24,40]){
  for(const distanceTravel of [0,.2,.6,1.4,2.25,route.length]){
   const s=createSnakeTravelStateV07(route,{
     distance:distanceTravel,speed:.12
   });
   const p=sampleSnakeTravelPoseV07(s,{
     length:bodyLength,boneCount,bodyRadius:bodyLength*.05
   });
   const inspection=inspectUniversalSnakePose(p);
   assert.equal(inspection.ok,true);
   assert.ok(inspection.maxLengthError<1e-7);
   assert.equal(inspection.minGroundClearance,0);
   assert.equal(inspection.terrainCollisionChecked,false);
   assert.equal(p.contactIndices.length,boneCount);
   assert.ok(p.points.every(point=>Object.values(point).every(Number.isFinite)));
   for(let i=1;i<boneCount;i++){
    assert.ok(close(dist(p.points[i],p.points[i-1]),p.segmentLength,1e-7),
     'fixed 3D bone '+bodyLength+' '+boneCount+' '+distanceTravel+' '+i);
    assert.ok(p.arcDistances[i]<p.arcDistances[i-1],
     'body positions march backward in traveled route history');
   }
   assert.deepEqual(p,sampleSnakeTravelPoseV07(s,{
     length:bodyLength,boneCount,bodyRadius:bodyLength*.05
   }));
   frames++;
  }
 }
}
assert.ok(frames>=50);
const beforeCorner=createSnakeTravelStateV07(route,{distance:.65,speed:.1});
const afterCorner=createSnakeTravelStateV07(route,{distance:2.4,speed:.1});
const rear=sampleSnakeTravelPoseV07(afterCorner,{length:1.4});
assert.ok(rear.points.some((p,i)=>i>=8&&p.y<rear.points[0].y-.1),
 'the rear body must retain the route it traveled, not instantly turn with the head');
const entry=sampleSnakeTravelPoseV07(beforeCorner,{length:1.4});
assert.ok(entry.points.at(-1).x<0,'newly entering snake has tail outside the authored path');
assert.notDeepEqual(entry.points,rear.points);
for(const speciesId of ['generic_snake','corn_snake','hognose_snake']){
 for(const size of [.55,1.4,2.2]){
  const bridge=createSnakeGrowthMotionBridge({speciesId,bodyLength:size});
  const frame=sampleSnakeGrowthMotionFrame(bridge,{
   mode:'ground',motionSource:'path-history-v07',pathState:state
  });
  assert.equal(frame.poseSource,'authored_head_trail_v07');
  assert.equal(frame.motionSource,'path-history-v07');
  assert.equal(frame.travelDistance,state.distance);
  assert.equal(frame.pose.points.length,bridge.boneCount);
  assert.equal(frame.head.speciesId,speciesId);
  assert.equal(frame.mesh.uv,bridge.rig.uv,'fixed UV pattern remains attached');
  assert.equal(frame.mesh.positions.length,bridge.rig.vertices.length);
  assert.deepEqual(frame.head.origin,frame.pose.points[0]);
  const flat=sampleSnakeGrowthMotionFrame(bridge,{
   mode:'ground',motionSource:'path-history-v07',pathState:state,
   terrain:{groundZ:0,rock:null,perch:null}
  });
  assert.equal(flat.poseSource,'authored_head_trail_heightfield_v07');
  assert.equal(inspectSnakeTerrainClearance(flat.pose,{samplesPerBone:12}).ok,true,
   'route conformed to flat terrain still retains length and nonpenetration');
  assert.equal(flat.mesh.uv,bridge.rig.uv);
  const legacy=sampleSnakeGrowthMotionFrame(bridge,{
   mode:'ground',time:1.2
  });
  assert.equal(legacy.poseSource,'kinematic');
  assert.ok(!('motionSource' in legacy),'no public contract change for old behavior');
  assert.notDeepEqual(legacy.pose.points,frame.pose.points,
   'an authored moving head path is a real behavioral change');
 }
}
// Activity timetable can drive distance from its paused motionTime.
// The V0.7 spine stays frozen when v0.6 activity classifies a rest period.
let foundPause=false;
for(let s=0;s<120;s+=.2){
 const a=sampleCornSnakeActivityV06(s,{seed:1049});
 if(a.moving)continue;
 const next=sampleCornSnakeActivityV06(s+.02,{seed:1049});
 if(next.moving)continue;
 const d=Math.min(route.length,a.motionTime*.08);
 const e=Math.min(route.length,next.motionTime*.08);
 assert.ok(close(d,e,1e-9),'non-moving activity freezes route travel');
 const p=sampleSnakeTravelPoseV07(createSnakeTravelStateV07(route,{distance:d}));
 const q=sampleSnakeTravelPoseV07(createSnakeTravelStateV07(route,{distance:e}));
 assert.deepEqual(p.points,q.points);
 foundPause=true;break;
}
assert.equal(foundPause,true,'corn snake has at least one rest in the 120 s artistic choreography');

const invalid=[
 ()=>createSnakeTravelRouteV07([]),
 ()=>createSnakeTravelRouteV07([{x:0,y:0}]),
 ()=>createSnakeTravelRouteV07([{x:0,y:0},{x:0,y:0}]),
 ()=>createSnakeTravelRouteV07([{x:0,y:NaN},{x:1,y:1}]),
 ()=>createSnakeTravelRouteV07([{x:0,y:0},{x:Infinity,y:1}]),
 ()=>createSnakeTravelRouteV07([{x:0,y:0},{x:1,y:0}],{subdivisions:1}),
 ()=>createSnakeTravelStateV07({},{}),
 ()=>createSnakeTravelStateV07(route,{speed:Infinity}),
 ()=>createSnakeTravelStateV07(route,{distance:-1}),
 ()=>advanceSnakeTravelStateV07(initial,{seconds:-1}),
 ()=>advanceSnakeTravelStateV07(initial,{seconds:Infinity}),
 ()=>advanceSnakeTravelStateV07(initial,{pace:1.1}),
 ()=>advanceSnakeTravelStateV07(initial,{moving:'yes'}),
 ()=>sampleSnakeTravelPoseV07(null),
 ()=>sampleSnakeTravelPoseV07(initial,{boneCount:7}),
 ()=>sampleSnakeTravelPoseV07(initial,{length:0}),
 ()=>sampleSnakeTravelPoseV07(initial,{bodyRadius:1}),
 ()=>sampleSnakeTravelRouteV07(route,Infinity),
 ()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{
  motionSource:'route-v07'
 }),
 ()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{
  motionSource:'path-history-v07'
 }),
 ()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{
  motionSource:'path-history-v07',mode:'explore',pathState:state
 }),
 ()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{
  motionSource:'legacy',pathState:state
 })
];
for(const action of invalid)assert.throws(action,RangeError);
assert.equal(JSON.stringify(source),original,'input authored waypoints unchanged');
console.log('PASS V0.7A head-driven trail: '+frames+
 ' fixed-length poses, deterministic turns/rest, 3 species skin+head UV, legacy behavior unchanged, no saves.');
