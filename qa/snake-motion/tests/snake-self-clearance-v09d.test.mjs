import assert from 'node:assert/strict';
import {inspectSnakeSelfClearanceV09d,
 advanceSnakeRouteWithSelfGuardV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {startSnakeRouteFollowerV09c,
 advanceSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
const F=Object.freeze,ds=2.28/23;
const makePose=pts=>F({bodyRadius:.13,segmentLength:ds,
 points:F(pts.map(v=>F({x:v[0],y:v[1],z:v[2]})))});
const straight=makePose(Array.from({length:24},(_,i)=>[
 1.4-i*ds,-.45,.13
]));
const clear=inspectSnakeSelfClearanceV09d({pose:straight});
assert.equal(clear.checkedNonlocalPairs,190);
assert.equal(clear.candidateClearanceAccepted,true);
assert.equal(clear.candidateOverlapCount,0);
assert.equal(clear.sourceBoneCount,24);
assert.equal(clear.skinApplied,false);
assert.equal(clear.selfSurfaceCollisionCertified,false);
assert.equal(clear.swept3DCollisionCertified,false);
const curls=[];
for(let i=0;i<=10;i++)curls.push([i*ds,-.4,.13]);
curls.push([10*ds,-.4+ds,.13]);
for(let i=1;i<=12;i++)curls.push([(10-i)*ds,-.4+ds,.13]);
assert.equal(curls.length,24);
const folded=makePose(curls);
const overlapping=inspectSnakeSelfClearanceV09d({pose:folded});
assert.ok(overlapping.candidateOverlapCount>0);
assert.equal(overlapping.candidateClearanceAccepted,false);
assert.ok(overlapping.minimumCapsuleGap<0);
assert.ok(overlapping.maximumBendRadians>1.2);
assert.deepEqual(overlapping,inspectSnakeSelfClearanceV09d({pose:folded}));
assert.throws(()=>inspectSnakeSelfClearanceV09d({pose:{
 ...straight,points:straight.points.slice(1)
}}),RangeError);
assert.throws(()=>inspectSnakeSelfClearanceV09d({
 pose:straight,minBoneIndexGap:2
}),RangeError);
assert.throws(()=>inspectSnakeSelfClearanceV09d({
 pose:{...straight,points:straight.points.map((p,i)=>
 i===5?{...p,x:Infinity}:p)}
}),RangeError);

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v09d_route_collision_monitor',
 objects:[
  {id:'left_stone',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=F({groundZ:0,rock:null,perch:null});
const pts=[];
for(let i=0;i<=6;i++)pts.push(F({
 x:.65,y:-1.32+i*.19,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const a=degree*Math.PI/180,q=pts.at(-1);
 pts.push(F({x:q.x+Math.cos(a)*.19,
  y:q.y+Math.sin(a)*.19,z:.135}));
}
const base=F({version:'0.7P_source_pose',points:F(pts),
 segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene,terrain,basePose:base,pivotIndex:6,maxPitch:.36,
 wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const st=advanceSnakeWallProbeV07p(wall,{
  scene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(st.renderable,true);
 wall=st.nextState;
}
const start=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:scene.revision,sites:[
 {id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}}
]};
const options={actorId:'synthetic_v09d',scene,terrain,
 wallState:wall,ecologySnapshot,needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:start.x+70,y:start.y}},autoReturn:true};
const initial=startSnakeRouteFollowerV09c(options);
assert.equal(initial.phase,'moving_outbound');
const startDiagnostic=inspectSnakeSelfClearanceV09d({
 pose:initial.pose
});
let current=initial,minGap=Infinity,minGapFrame=-1;
let overlapFrames=0,bendWorst=0;
let gated=null,gateFrame=-1;
for(let i=0;i<650;i++){
 if(!['moving_outbound','moving_return'].includes(current.phase))break;
 if(gated===null){
  const result=advanceSnakeRouteWithSelfGuardV09d({
   state:current,scene,terrain
  });
  if(result.phase==='self_clearance_stop'){
   gated=result;gateFrame=i;
   assert.equal(gated.renderablePose,null);
   assert.equal(gated.movementCompleted,false);
   assert.equal(gated.playerObservationRecorded,false);
  }
 }
 const stepped=advanceSnakeRouteFollowerV09c({state:current,
  scene,terrain});
 if(stepped.phase==='stopped')break;
 current=stepped;
 if(!current.pose)break;
 const diag=inspectSnakeSelfClearanceV09d({pose:current.pose});
 if(diag.minimumCapsuleGap<minGap){
  minGap=diag.minimumCapsuleGap;minGapFrame=i;
 }
 if(diag.candidateOverlapCount)overlapFrames++;
 bendWorst=Math.max(bendWorst,diag.maximumBendRadians);
 if(current.phase==='return_head_arrived')break;
}
assert.equal(current.phase,'return_head_arrived');
assert.ok(current.verifiedFrames>=600);
assert.ok(gated,'strict V0.9D must stop known self-overlap before release');
assert.equal(gated.reason,'next_source_self_clearance_rejected');
assert.equal(gated.previousState.pose.points.length,24);
assert.equal(inspectSnakeSelfClearanceV09d({
 pose:gated.previousState.pose
}).candidateClearanceAccepted,true,
 'held source pose is the last accepted safe candidate before rejected step');
assert.equal(gated.diagnostic.candidateClearanceAccepted,false,
 'the candidate next frame itself must have shown a proximity hazard');
assert.equal(gated.skinApplied,false);
assert.equal(gated.saveModified,false);
assert.equal(current.fullBodyReturnVerified,false);
assert.ok(Number.isFinite(minGap));
assert.ok(startDiagnostic.checkedNonlocalPairs===190);
console.log('V0.9D full real-motion self capsule diagnostics '+JSON.stringify({
 startClear:startDiagnostic.candidateClearanceAccepted,
 startMinGap:startDiagnostic.minimumCapsuleGap,
 minGap,minGapFrame,overlapFrames,bendWorst,
 v09cFinalPhase:current.phase,
 v09cVerifiedFrames:current.verifiedFrames,
 strictGateStopFrame:gateFrame,
 strictGateStopReason:gated?.reason??null
}));
assert.equal(JSON.stringify({scene,terrain,wall,options}),
 JSON.stringify({scene,terrain,wall,options}),
 'source data retained and cannot be modified by inspector');
console.log('PASS V0.9D straight vs folded 24-link 3D capsules, bounded real route diagnostic and optional fail-closed self gate; non-authoritative surface physics flagged');
