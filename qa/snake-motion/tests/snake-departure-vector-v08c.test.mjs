import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {inspectSnakeTerrainClearance}
 from '../src/ohm-core/snake-terrain-contact.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {prepareSnakeGroundHandoffV07s}
 from '../src/ohm-core/snake-wall-to-ground-handoff-v07s.mjs';
import {createSnakeGroundTemporalV07t,advanceSnakeGroundTemporalV07t}
 from '../src/ohm-core/snake-ground-temporal-v07t.mjs';
import {
 createSnakeCurvatureRelayV07u,advanceSnakeCurvatureRelayV07u,
 SNAKE_CURVATURE_RELAY_VERSION
} from '../src/ohm-core/snake-curvature-relay-v07u.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v08c_public_direction_sweep',
 objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,z=.135,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z
 }));
}
const pose=Object.freeze({
 version:'0.7P_source_pose',points:Object.freeze(points),
 segmentLength:ds,bodyRadius:.13
});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:pose,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const result=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(result.renderable,true,'V0.7P frame '+i);
 wall=result.nextState;
}
/**
 * V0.8C: experimental sweep of ACTUAL 3D motion. This changes only
 * authorized synthetic departure vectors, not the accepted visual gate.
 */
function poseMaximumBend(points){
 let worst={radians:0,index:-1};
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1];
  const u={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
  const v={x:c.x-b.x,y:c.y-b.y,z:c.z-b.z};
  const l=Math.hypot(u.x,u.y,u.z)*Math.hypot(v.x,v.y,v.z);
  assert.ok(l>1e-9,'bone lengths cannot collapse');
  const t=Math.acos(Math.max(-1,Math.min(1,
   (u.x*v.x+u.y*v.y+u.z*v.z)/l)));
  if(t>worst.radians)worst={radians:t,index:i};
 }
 return worst;
}

const vectors=[
 {x:.10,y:.025},{x:.10,y:0},{x:.10,y:-.025},
 {x:.10,y:-.05},{x:.08,y:-.05},{x:.06,y:-.06},
 {x:.04,y:-.09},{x:0,y:-.08},{x:.08,y:.07}
];
const results=[];
for(const vector of vectors)for(const steer of [0,.24]){
 let row={vector,steer,accepted:false,reason:null};
 try{
  const handoff=prepareSnakeGroundHandoffV07s({
   wallState:wall,scene,terrain,targetJointCount:24,
   departure:vector,speciesId:'generic_snake'
  });
  if(!handoff.ok){row.reason=handoff.reason;results.push(row);continue;}
  let state=createSnakeCurvatureRelayV07u({
   temporalState:createSnakeGroundTemporalV07t({handoff}),
   turnRadians:steer
  });
  let worst={radians:0,joint:-1,frame:-1},last=null;
  for(let frame=0;frame<90;frame++){
   const step=advanceSnakeCurvatureRelayV07u(state,{
    scene,terrain,seconds:1/30
   });
   if(!step.ok){row.reason=step.reason;row.rejectedAtFrame=frame+1;break;}
   const b=poseMaximumBend(step.pose.points);
   if(b.radians>worst.radians)
    worst={radians:b.radians,joint:b.index,frame:frame+1};
   last=step;state=step.nextState;
  }
  row.accepted=row.reason===null;
  row.maximumBendRadians=+worst.radians.toFixed(8);
  row.joint=worst.joint;row.frame=worst.frame;
  row.headTravel=last?+last.headTravel.toFixed(6):null;
  row.underStrictVisualLimit=row.accepted&&worst.radians<.65;
 }catch(e){row.reason=String(e.message||e);}
 results.push(row);
 console.log('OHM V0.8C departure '+JSON.stringify(row));
}
assert.equal(results.length,vectors.length*2);
assert.equal(results[0].accepted,true);
assert.ok(results.some(x=>x.maximumBendRadians>.65),
 'preserve the known excessive head-neck bend as a detectable condition');
console.log('V0.8C exploratory vector scan finished: QA threshold was NOT relaxed.');
