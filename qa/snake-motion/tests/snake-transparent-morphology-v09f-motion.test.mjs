/**
 * V0.9F dynamic MORPHOLOGY continuity AFTER the static Chrome silhouette
 * acceptance. Does not supersede source collision or claim natural anatomy.
 */
import assert from 'node:assert/strict';
import {buildNeutralSnakeTransparentMorphologyV09f}
 from '../src/ohm-core/snake-transparent-morphology-v09f.mjs';
import {advanceSnakeRouteWithSelfGuardV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
const F=Object.freeze;
const flatTerrain=F({groundZ:0,rock:null,perch:null});
const box=(id,x,y,width,depth,height)=>({
 id,kind:'rock_overhang',x,y,width,depth,height,transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09e_same_source_route',
 objects:[
  box('left_stone',42,32,134,76,230),
  box('rear_stone',390,10,108,70,190),
  box('right_stone',836,30,105,80,245)
 ]
});
const src=[];
for(let i=0;i<=6;i++)src.push(F({x:.65,y:-1.32+i*.19,z:.135}));
for(const degree of [90,120,150,180,210,240]){
 const t=degree*Math.PI/180,v=src.at(-1);
 src.push(F({x:v.x+Math.cos(t)*.19,
  y:v.y+Math.sin(t)*.19,z:.135}));
}
const base=F({version:'0.7P_source_pose',
 points:F(src),segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain:flatTerrain,basePose:base,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const step=advanceSnakeWallProbeV07p(wall,{
  scene,terrain:flatTerrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true);
 wall=step.nextState;
}
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:scene.revision,sites:[{
 id:'hide_a',kind:'hide',safe:true,reachable:true,
 distanceCost:.1,conditions:{hasCover:true}
}]};
const state0=startSnakeRouteFollowerV09c({
 actorId:'synthetic_v09e',scene,terrain:flatTerrain,
 wallState:wall,ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:head.x+70,y:head.y}},autoReturn:true
});

assert.equal(state0.phase,'moving_outbound');
const sourceBefore=JSON.stringify({scene,flatTerrain,wall});
const samples=[],keyframes=new Set([60,61,120,160,240,410,500,530]),captured=new Set();
let state=state0,previousMorph=null,frames=0;
function captureIfKey(s){
 if(!keyframes.has(s.verifiedFrames)||captured.has(s.verifiedFrames))return;
 const prior=JSON.stringify(s.pose);
 const mesh=buildNeutralSnakeTransparentMorphologyV09f({pose:s.pose});
 assert.equal(mesh.sourceJointCount,24);
 assert.equal(mesh.maximumSourceAnchorDrift,0);
 assert.equal(mesh.skinApplied,false);
 assert.equal(mesh.sourceSceneCollisionForNewMeshCertified,false,
  'display rings are not a new proven 3D collision collider');
 assert.equal(mesh.newHeadIsDisplayCandidateOnly,true);
 assert.ok(mesh.tailTipRadius<mesh.midBodyRadius*.2);
 assert.ok(mesh.headWidestRadius>mesh.neckRadius);
 assert.ok(mesh.bodyProjection.minimumWidthPx>1);
 assert.ok(mesh.headProjection.minimumWidthPx>1);
 assert.equal(mesh.sourceBonePositionsUnchanged,true);
 assert.equal(JSON.stringify(s.pose),prior);
 const leading=mesh.bodyProjection.centers2d[0],
  nose=mesh.headProjection.centers2d.at(-1);
 assert.ok(Math.hypot(nose.x-leading.x,nose.y-leading.y)>1,
  'snout must remain distinct from a flat tube');
 if(previousMorph&&s.verifiedFrames===61){
  const old=previousMorph.bodyProjection.centers2d;
  const now=mesh.bodyProjection.centers2d;
  let maxDisplacement=0;
  for(let i=0;i<old.length;i++)
   maxDisplacement=Math.max(maxDisplacement,
    Math.hypot(now[i].x-old[i].x,now[i].y-old[i].y));
  assert.ok(maxDisplacement<15,
   'new transparent silhouette must not jump in the first real source step');
 }
 captured.add(s.verifiedFrames);
 samples.push({frame:s.verifiedFrames,phase:s.phase,
  tailRatio:mesh.tailTipRadius/mesh.midBodyRadius,
  headNeckRatio:mesh.headWidestRadius/mesh.neckRadius,
  headWorldRings:mesh.headRingCount,bodyWorldRings:mesh.bodyRingCount});
 previousMorph=mesh;
}
captureIfKey(state);
while(state.verifiedFrames<530){
 const next=advanceSnakeRouteWithSelfGuardV09d({
  state,scene,terrain:flatTerrain,seconds:1/30
 });
 if(!['moving_outbound','moving_return'].includes(next.phase))
  throw Error('V0.9F source unexpectedly stopped at '+state.verifiedFrames+
   ': '+next.reason+' '+next.phase);
 assert.equal(next.pose.points.length,24);
 if(next.verifiedFrames===state.verifiedFrames){
  assert.equal(state.phase,'moving_outbound',
   'only a source-authored arrival->return transition can be zero-step');
  assert.equal(next.phase,'moving_return');
  assert.equal(next.completedOutbound,true);
 }else{
  assert.equal(next.verifiedFrames,state.verifiedFrames+1,
   'an actual source movement must produce exactly one new frame');
 }
 state=next;frames++;
 captureIfKey(state);
}
assert.equal(state.verifiedFrames,530);
assert.equal(state.phase,'moving_return');
assert.equal(samples.length,keyframes.size);
const blocked=advanceSnakeRouteWithSelfGuardV09d({
 state,scene,terrain:flatTerrain
});
assert.equal(blocked.phase,'self_clearance_stop',
 'the new head/body appearance must not bypass the original V0.9D gate');
assert.equal(blocked.renderablePose,null);
assert.equal(blocked.reason,'next_source_self_clearance_rejected');
assert.equal(JSON.stringify({scene,flatTerrain,wall}),sourceBefore);
console.log('PASS V0.9F dynamic transparent silhouette across real 24-joint source frames 60-530; 8 morphology samples no cut or skin; V0.9D self-contact safety still stops at 531 '+JSON.stringify(samples));
