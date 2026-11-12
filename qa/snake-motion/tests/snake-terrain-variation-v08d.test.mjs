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


import {inspectSnakeTemporalContinuityV08d}
 from '../src/ohm-core/snake-temporal-continuity-v08d.mjs';

// Same authored 13-bone creature, independently built in each synthetic
// landscape. Never transplant an existing state into a different scene.
const cases=[
 {name:'rock_baseline',rockDelta:0,groundZ:0},
 {name:'left_and_middle_rocks_shifted',rockDelta:12,groundZ:0},
 {name:'middle_and_right_rocks_shifted',rockDelta:-12,groundZ:0},
 {name:'slightly_raised_floor',rockDelta:0,groundZ:.03},
 {name:'raised_floor_with_shifted_rocks',rockDelta:10,groundZ:.03}
];
const readOnly=Object.freeze({x:.1,y:-.025});
const results=[];
let baselineFinalPose=null;
for(const variant of cases){
 const d=variant.rockDelta;
 const env=createTerrariumSceneGeometryV03d({
  sceneId:'v08d_environment_'+variant.name,
  objects:[
   {id:'left_stone_01',kind:'rock_overhang',x:42+d,y:32,
    width:134,depth:76,height:230,transmissionPermille:0},
   {id:'rear_stone_02',kind:'rock_overhang',x:390+d,y:10,
    width:108,depth:70,height:190,transmissionPermille:0},
   {id:'right_stone_03',kind:'rock_overhang',x:836+d,y:30,
    width:105,depth:80,height:245,transmissionPermille:0}
  ]
 });
 const ground=Object.freeze({groundZ:variant.groundZ,rock:null,perch:null});
 const ds=.19,z=.135+variant.groundZ,points=[];
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
  scene:env,terrain:ground,basePose:pose,pivotIndex:6,maxPitch:.36,
  wall:'rear',speciesId:'generic_snake'
 });
 let result={name:variant.name,rockDelta:d,groundZ:variant.groundZ,
   wallFrames:0,groundFrames:0,reason:null,peakBend:0,peakRotation:0};
 for(let i=0;i<95;i++){
  const step=advanceSnakeWallProbeV07p(wall,{
   scene:env,terrain:ground,seconds:1/30,maxJointSpeed:.75
  });
  if(!step.renderable){
   result.reason='wall_'+(step.reason||'not_renderable');break;
  }
  wall=step.nextState;result.wallFrames++;
 }
 if(!result.reason){
  const ready=prepareSnakeGroundHandoffV07s({
   wallState:wall,scene:env,terrain:ground,
   targetJointCount:24,departure:readOnly,
   speciesId:'generic_snake'
  });
  if(!ready.ok)result.reason='handoff_'+ready.reason;
  else{
   let relay=createSnakeCurvatureRelayV07u({
    temporalState:createSnakeGroundTemporalV07t({handoff:ready}),
    turnRadians:.24
   });
   let previous=relay.temporalState.v07sState.pose;
   for(let i=0;i<90;i++){
    const step=advanceSnakeCurvatureRelayV07u(relay,{
     scene:env,terrain:ground,seconds:1/30
    });
    if(!step.ok){result.reason='relay_'+step.reason;break;}
    const reading=inspectSnakeTemporalContinuityV08d({
     previousPose:previous,pose:step.pose
    });
    if(!reading.visualBendAccepted)
     result.reason='v08d_excessive_bend';
    if(!result.reason&&
      !inspectSnakeTerrariumPoseV07c(step.pose,env).ok)
     result.reason='source_scene_collision';
    if(!result.reason&&
      !inspectSnakeTerrainClearance(step.pose,{
       terrain:ground,samplesPerBone:24
      }).ok)
     result.reason='source_terrain_collision';
    if(result.reason)break;
    result.peakBend=Math.max(result.peakBend,reading.maximumBendRadians);
    result.peakRotation=Math.max(result.peakRotation,
      reading.maxStepTangentRotationRadians);
    if(variant.name==='rock_baseline'&&i===89)baselineFinalPose=step.pose;
    previous=step.pose;relay=step.nextState;
    result.groundFrames++;
   }
  }
 }
 result.peakBend=+result.peakBend.toFixed(8);
 result.peakRotation=+result.peakRotation.toFixed(8);
 results.push(result);
 console.log('OHM V0.8D terrain variation '+JSON.stringify(result));
}
assert.equal(results.length,cases.length);
assert.equal(results[0].wallFrames,95);
assert.equal(results[0].groundFrames,90);
assert.equal(results[0].reason,null,
  'baseline remains a known accepted synthetic fixture');
// The sweep reports actual accept/reject outcomes separately. Unexpected
// obstacle failure MUST NOT be disguised as a successful simulation.
const accepted=results.filter(x=>x.reason===null&&x.groundFrames===90);
console.log('V0.8D landscape sweep accepted '+accepted.length+'/'+results.length+
 ' synthetic rock/floor variants; unaccepted cases are NOT certified');
assert.ok(accepted.every(x=>x.peakBend<=.65));

assert.ok(baselineFinalPose,
 'baseline must supply actual 24-joint ending pose for obstruction control');
const blockedScene=createTerrariumSceneGeometryV03d({
 sceneId:'v08d_obstruction_negative_control',
 objects:[
  {id:'blocking_rock',kind:'rock_overhang',
   x:600,y:10,width:65,depth:70,height:120,transmissionPermille:0}
 ]
});
const obstruction=inspectSnakeTerrariumPoseV07c(
 baselineFinalPose,blockedScene
);
assert.equal(obstruction.ok,false,
 'a newly positioned solid rock in the actual snake path must fail closed');
console.log('PASS V0.8D obstacle negative control: real source-backed final pose rejected by overlapping rock');
