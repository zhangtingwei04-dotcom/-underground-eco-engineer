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
 sceneId:'v08b_public_candidate_bend_sweep',
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
const handoff=prepareSnakeGroundHandoffV07s({
 wallState:wall,scene,terrain,
 targetJointCount:24,departure:{x:.1,y:.025},
 speciesId:'generic_snake'
});
assert.equal(handoff.ok,true,handoff.reason);
const temporal=createSnakeGroundTemporalV07t({handoff});
const sourceJSON=JSON.stringify({wall,scene,terrain,temporal});

/**
 * OHM V0.8B exploratory quality probe: measure the maximum ACTUAL
 * adjacent 3D source-bone bend while changing an allowed authored turn.
 * This is a synthetic comparison, not a release gate or proof of naturalism.
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
const samples=[];
for(const turn of [0,.04,.08,.12,.16,.20,.24]){
 let state=createSnakeCurvatureRelayV07u({
  temporalState:temporal,turnRadians:turn
 });
 let worst={radians:0,index:-1,frame:-1};
 const initialBend=poseMaximumBend(state.temporalState.v07sState.pose.points);
 const milestones=[];
 let ending=null,failed=null;
 for(let i=0;i<90;i++){
  const step=advanceSnakeCurvatureRelayV07u(state,{
   scene,terrain,seconds:1/30
  });
  if(!step.ok){failed={frame:i,reason:step.reason};break;}
  const current=poseMaximumBend(step.pose.points);
  if([1,10,25,50,75,90].includes(i+1))milestones.push({frame:i+1,angle:+current.radians.toFixed(6),joint:current.index});
  if(current.radians>worst.radians){
   worst={...current,frame:i+1};
  }
  state=step.nextState;
  ending=step;
 }
 const row={turn,initialBendRadians:+initialBend.radians.toFixed(8),initialBendIndex:initialBend.index,milestones,maximumBendRadians:+worst.radians.toFixed(8),
  maximumBendDegrees:+(worst.radians*180/Math.PI).toFixed(4),
  joint:worst.index,frame:worst.frame,
  accepted:!failed,failed,
  headTravel:ending?+ending.headTravel.toFixed(6):null,
  moving:ending?.movingFramesObserved??null};
 samples.push(row);
 console.log('OHM V0.8B bend envelope '+JSON.stringify(row));
}
assert.equal(samples.length,7);
assert.ok(samples.some(x=>x.accepted));
assert.deepEqual(JSON.stringify({wall,scene,terrain,temporal}),sourceJSON);
console.log('V0.8B DIAGNOSTIC ONLY — no threshold relaxation, no player certification.');
