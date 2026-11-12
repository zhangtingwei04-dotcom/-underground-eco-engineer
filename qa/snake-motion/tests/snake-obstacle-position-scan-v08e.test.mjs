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
 sceneId:'v08e_public_candidate_preview',
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

import {previewSnakeObstacleDeparturesV08e}
 from '../src/ohm-core/snake-obstacle-lookahead-v08e.mjs';

const tried=[];
const candidates=[
 {id:'corrected',departure:{x:.1,y:-.025},turnRadians:.24},
 {id:'cautious',departure:{x:.1,y:-.05},turnRadians:.24},
 {id:'narrow',departure:{x:.08,y:-.05},turnRadians:.24}
];
// This grid is just a lab search for a discriminating *real* rock footprint.
// Coordinates are source V0.3d pixels, not screen-space sprites.
for(const x of [610,620,630,640])for(const y of [35,45,55,65,75,85]){
 const env=createTerrariumSceneGeometryV03d({
   sceneId:'v08e_geometry_scan_'+x+'_'+y,
   objects:[{id:'tiny_rock',kind:'rock_overhang',
    x,y,width:6,depth:6,height:120,transmissionPermille:0}]
 });
 let source=createSnakeWallProbeV07p({
  scene:env,terrain,basePose:pose,pivotIndex:6,maxPitch:.36,
  wall:'rear',speciesId:'generic_snake'
 });
 let initialSafe=true;
 for(let i=0;i<95;i++){
   const step=advanceSnakeWallProbeV07p(source,{
    scene:env,terrain,seconds:1/30,maxJointSpeed:.75
   });
   if(!step.renderable){initialSafe=false;break}
   source=step.nextState;
 }
 if(!initialSafe)continue;
 const scan=previewSnakeObstacleDeparturesV08e({
  wallState:source,scene:env,terrain,candidates
 });
 const accepted=scan.trials.filter(t=>t.accepted).map(t=>t.candidateId);
 const blocked=scan.trials.filter(t=>t.reason?.startsWith('source_')).map(t=>t.candidateId);
 const result={x,y,accepted,blocked,selection:scan.selected?.id??null,
  reasons:scan.trials.map(t=>t.reason)};
 tried.push(result);
 if(accepted.length>0&&blocked.length>0)
  console.log('OHM V0.8E discrimination '+JSON.stringify(result));
}
console.log('OHM V0.8E scan summary '+JSON.stringify({
 inspected:tried.length,
 separating:tried.filter(t=>t.accepted.length>0&&t.blocked.length>0).length,
 safe:tried.filter(t=>t.accepted.length>0).length,
 whollyBlocked:tried.filter(t=>t.accepted.length===0).length
}));
assert.ok(tried.length>=12,'terrain scan must test many independent rock placements');
