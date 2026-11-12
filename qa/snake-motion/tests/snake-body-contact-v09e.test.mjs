import assert from 'node:assert/strict';
import {
 inspectSnakeBodyContactV09e,advanceSnakeRouteWithContactGuardV09e
} from '../src/ohm-core/snake-body-contact-v09e.mjs';
import {inspectSnakeSelfClearanceV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 startSnakeRouteFollowerV09c,advanceSnakeRouteFollowerV09c
} from '../src/ohm-core/snake-route-follower-v09c.mjs';

const F=Object.freeze,ds=2.28/23,flatTerrain=F({
 groundZ:0,rock:null,perch:null
});
const pointsPose=pts=>F({
 bodyRadius:.13,segmentLength:ds,
 points:F(pts.map(p=>F({x:p[0],y:p[1],z:p[2]})))
});
const loop=pitch=>{
 const theta=2*Math.PI/23;
 const R=Math.sqrt(ds*ds-(pitch/23)**2)/(2*Math.sin(theta/2));
 return pointsPose(Array.from({length:24},(_,i)=>[
  .55+R*Math.cos(i*theta),
  -.5+R*Math.sin(i*theta),
  .13+pitch*i/23
 ]));
};
const straight=pointsPose(Array.from({length:24},(_,i)=>
 [1.4-i*ds,-.45,.13]));
const clean=inspectSnakeBodyContactV09e({
 pose:straight,terrain:flatTerrain
});
assert.equal(clean.sourceBoneCount,24);
assert.equal(clean.checkedNonlocalPairs,190);
assert.equal(clean.releaseAllowedByExistingV09dGate,true);
assert.equal(clean.suspectedPenetrationCount,0);
assert.equal(clean.possibleSupportedContactCount,0);
assert.equal(clean.physicsSupportForceVerified,false);
assert.equal(clean.trueMeshSelfCollisionVerified,false);
assert.equal(clean.sourceBodyModified,false);

const supported=inspectSnakeBodyContactV09e({
 pose:loop(.226),terrain:flatTerrain
});
assert.equal(supported.releaseAllowedByExistingV09dGate,true);
assert.equal(supported.suspectedPenetrationCount,0);
assert.ok(supported.possibleSupportedContactCount>0,
 'real vertical offset near terrain should classify possible stacking');
assert.ok(supported.possibleSupportedContacts.every(x=>
 x.signedCapsuleGap>=-.008&&
 x.classification==='ground_supported_vertical_contact_candidate'&&
 x.terrainEvidence?.centerBottomMinusGround<=.05));
assert.equal(supported.physicsSupportForceVerified,false,
 'proximity to terrain is not a solved support force');
assert.deepEqual(supported,inspectSnakeBodyContactV09e({
 pose:loop(.226),terrain:flatTerrain
}),'same source should produce deterministic contact classifications');
const notGrounded=inspectSnakeBodyContactV09e({
 pose:loop(.226),terrain:{groundZ:-1,rock:null,perch:null}
});
assert.equal(notGrounded.possibleSupportedContactCount,0);
assert.ok(notGrounded.unsupportedVerticalTouchCount>0,
 'no terrain reaction evidence -> no claimed supported contact');
const noTerrain=inspectSnakeBodyContactV09e({pose:loop(.226)});
assert.equal(noTerrain.possibleSupportedContactCount,0);
assert.equal(noTerrain.physicsSupportForceVerified,false);

const separated=inspectSnakeBodyContactV09e({
 pose:loop(.42),terrain:flatTerrain
});
assert.equal(separated.suspectedPenetrationCount,0);
assert.ok(separated.separatedOverpassCount>0,
 'large true vertical gap is NOT self penetration');
assert.equal(separated.possibleSupportedContactCount,0);

const crossing=inspectSnakeBodyContactV09e({
 pose:loop(.08),terrain:flatTerrain
});
assert.ok(crossing.suspectedPenetrationCount>0,
 'same XY with insufficient vertical separation must be rejected');
assert.equal(crossing.releaseAllowedByExistingV09dGate,false);
assert.ok(crossing.suspectedPenetrations.every(p=>
 p.classification==='possible_3d_penetration'&&
 p.signedCapsuleGap<-.008));
for(const pitch of [.08,.226,.42]){
 const shape=loop(pitch);
 const old=inspectSnakeSelfClearanceV09d({pose:shape});
 const e=inspectSnakeBodyContactV09e({
  pose:shape,terrain:flatTerrain
 });
 assert.equal(e.releaseAllowedByExistingV09dGate,
  old.candidateClearanceAccepted,
  'V0.9E may add vocabulary but MUST NOT weaken V0.9D clearance');
}
assert.throws(()=>inspectSnakeBodyContactV09e({
 pose:straight,contactMargin:.9
}),RangeError);
assert.throws(()=>inspectSnakeBodyContactV09e({
 pose:straight,terrain:{groundZ:NaN}
}),RangeError);
assert.throws(()=>inspectSnakeBodyContactV09e({
 pose:{...straight,points:straight.points.slice(1)}
}),RangeError);

// Real V0.9C fixed-size scene, 24-bone source, and SAME unsafe return.
// The contact model must not turn the known 163 suspect frames into a pass.
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
let state=state0,firstRejected=null,rejectFrame=null,riskFrames=0;
for(let i=0;i<650;i++){
 if(state.phase==='return_head_arrived')break;
 if(firstRejected===null&&
    ['moving_outbound','moving_return'].includes(state.phase)){
  const gated=advanceSnakeRouteWithContactGuardV09e({
   state,scene,terrain:flatTerrain
  });
  if(gated.phase==='self_clearance_stop'||
     gated.phase==='body_contact_stop'){
   firstRejected=gated;rejectFrame=i;
  }else if(['moving_outbound','moving_return'].includes(gated.phase)){
   assert.equal(gated.bodyContactDiagnosticV09e?.physicsSupportForceVerified,
    false);
   assert.equal(gated.bodyContactDiagnosticV09e
    .releaseAllowedByExistingV09dGate,true);
  }
 }
 state=advanceSnakeRouteFollowerV09c({
  state,scene,terrain:flatTerrain
 });
 if(state.phase==='stopped')throw Error('unexpected earlier V0.9C source error');
 if(state.pose&&inspectSnakeBodyContactV09e({
  pose:state.pose,terrain:flatTerrain
 }).suspectedPenetrationCount>0)riskFrames++;
}
assert.equal(state.phase,'return_head_arrived');
assert.equal(state.verifiedFrames,692);
assert.ok(riskFrames>=150,'known unsafe raw V0.9C trace retained');
assert.equal(rejectFrame,471,'guard must stop before known unsafe source frame');
assert.equal(firstRejected.phase,'self_clearance_stop');
assert.equal(firstRejected.renderablePose,null);
assert.equal(firstRejected.previousState.pose.points.length,24);
assert.equal(firstRejected.gameSceneIntegrationAuthorized,false);
assert.equal(firstRejected.playerObservationRecorded,false);
console.log('PASS V0.9E: true 3D vertical layering/ground support evidence distinguished from penetration; V0.9D guard unchanged; old 692-frame unsafe route still stops at frame 531; no skin, save or false physics');
