import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeGrowthMotionBridge,
 sampleSnakeGrowthMotionFrame}
 from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {inspectSnakeSelfClearanceV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';
import {startSnakeRouteFollowerV09c}
 from '../src/ohm-core/snake-route-follower-v09c.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from '../src/ohm-core/snake-turn-space-v09g.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {SNAKE_SYNTHETIC_GROWTH_STAGES_V09N,
 projectSnakeGrowthCandidateV09n,
 inspectSnakeGrowthEnvelopeV09n,
 inspectSnakeGrowthTransitionV09n,
 inspectSnakeSyntheticHideFitV09n}
 from '../src/ohm-core/snake-growth-envelope-v09n.mjs';

const F=Object.freeze;
const terrain=F({groundZ:0,rock:null,perch:null});
const stone=(id,x,y,width,depth,height)=>F({
 id,kind:'rock_overhang',x,y,width,depth,height,
 transmissionPermille:0
});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_growth_v09n_synthetic_terrarium',
 objects:[
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)
 ]
});
// Fixed-length canonical V0.9D source. Growth output MUST NEVER be
// submitted back to this fixed-size source locomotion controller.
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
assert.equal(inspectSnakeSelfClearanceV09d({
 pose:canonicalPose
}).candidateClearanceAccepted,true);
const sourceBefore=JSON.stringify(canonicalPose);
const sceneBefore=JSON.stringify({scene,terrain});
assert.deepEqual(SNAKE_SYNTHETIC_GROWTH_STAGES_V09N.map(x=>x.stage),
 ['juvenile','growing','adult','large_adult']);
const samples=SNAKE_SYNTHETIC_GROWTH_STAGES_V09N.map(
 life=>inspectSnakeGrowthEnvelopeV09n({
  sourcePose:canonicalPose,scene,stageProgress:life.progress,
  goalFloor:{x:600,y:200},goalRadiusPixels:160
 })
);
for(const [i,v] of samples.entries()){
 assert.equal(v.version,'0.9N');
 assert.equal(v.lifeStage,SNAKE_SYNTHETIC_GROWTH_STAGES_V09N[i].stage);
 assert.equal(v.candidate.jointCount,24);
 assert.equal(v.candidate.linkCount,23);
 assert.equal(v.candidate.points.length,24);
 assert.equal(v.candidate.radiiWorldUnits.length,24);
 assert.equal(v.candidate.boneLengths.length,23);
 assert.equal(v.candidate.canonicalSourceUnmodified,true);
 assert.equal(v.candidate.sourceMotionAuthorized,false);
 assert.equal(v.candidate.sourceV09dAcceptsGrowthPose,false);
 assert.equal(v.originalControllerMustPauseOnResize,true);
 assert.equal(v.noNewAuthorizedSourcePose,true);
 assert.equal(v.fullBodyReturnVerified,false);
 assert.equal(v.physicallyCertified,false);
 assert.equal(v.skinApplied,false);
 assert.equal(v.saveModified,false);
 assert.equal(v.environment.clear,true);
 assert.equal(v.self.clear,true);
 assert.equal(v.static2DCandidateClear,true);
 assert.ok(v.goal.jointsInside>=0&&v.goal.jointsInside<=24);
 assert.equal(v.candidate.floorPoints[0].x,680,
  'same real source head anchor, no teleport');
 const length=2.28*SNAKE_SYNTHETIC_GROWTH_STAGES_V09N[i].lengthScale;
 assert.ok(Math.abs(v.candidate.lengthWorldUnits-length)<1e-10);
 assert.ok(Math.abs(v.candidate.boneLengths.reduce((a,b)=>a+b,0)-
  v.candidate.lengthWorldUnits)<1e-10);
 if(i>0){
  assert.ok(v.candidate.lengthWorldUnits>
   samples[i-1].candidate.lengthWorldUnits);
  assert.ok(v.candidate.maxRadiusWorldUnits>
   samples[i-1].candidate.maxRadiusWorldUnits);
 }
}
assert.equal(samples[0].goal.all24Inside,true);
assert.equal(samples[1].goal.all24Inside,true);
assert.equal(samples[2].goal.all24Inside,false);
assert.equal(samples[3].goal.all24Inside,false);

// Existing V0.1 universal growth motion renderer is an INDEPENDENT
// 24-bone visual system. Preserve its UV topology and matching total
// length across sizes. Crucially, it is NOT the same 3D validated source
// pose/collider as V0.9N or V0.9D, so this is interface compatibility,
// NOT permission to swap the collision source or modify player saves.
const visualBridges=samples.map((s,i)=>createSnakeGrowthMotionBridge({
 speciesId:'generic_snake',
 bodyLength:s.candidate.lengthWorldUnits,
 growthStage:i<2?'juvenile':'adult'
}));
for(let i=0;i<visualBridges.length;i++){
 const bridge=visualBridges[i];
 assert.equal(bridge.boneCount,24);
 assert.equal(bridge.rig.boneCount,24);
 assert.ok(Math.abs(bridge.rig.length-
  samples[i].candidate.lengthWorldUnits)<1e-9);
 assert.ok(bridge.bodyRadius>0);
 const frame=sampleSnakeGrowthMotionFrame(bridge,{
  mode:'ground',time:.2
 });
 assert.equal(frame.pose.points.length,24);
 assert.equal(frame.mesh.uv,bridge.rig.uv);
 assert.equal(frame.head.speciesId,'generic_snake');
 assert.ok(frame.mesh.positions.length>1000);
 if(i>0)assert.deepEqual(bridge.rig.uv,
  visualBridges[i-1].rig.uv);
}
const visualSourceStillIndependent=true;

assert.ok(samples[0].goal.jointsInside>samples[3].goal.jointsInside);
assert.equal(samples[2].sizeChangedFromCanonical,false);
assert.equal(samples[0].sizeChangedFromCanonical,true);
// Growth is not a one-number uniform scale: skull proxy/trunk/tail are
// allowed different proportions, not a scaled-up sprite.
const juvenile=samples[0].candidate,adult=samples[2].candidate;
assert.ok(Math.abs(
 juvenile.headRadiusWorldUnits/adult.headRadiusWorldUnits-
 juvenile.trunkRadiusWorldUnits/adult.trunkRadiusWorldUnits
)>0.01);
assert.ok(Math.abs(juvenile.boneLengths[0]/adult.boneLengths[0]-
 juvenile.boneLengths[22]/adult.boneLengths[22])>0.01);
const youngHide=inspectSnakeSyntheticHideFitV09n({
 growthCandidate:juvenile,openingWidthPixels:27,
 chamberLengthPixels:210
});
const adultHide=inspectSnakeSyntheticHideFitV09n({
 growthCandidate:adult,openingWidthPixels:27,
 chamberLengthPixels:210
});
assert.equal(youngHide.eligible2DProxy,true);
assert.equal(adultHide.eligible2DProxy,false);
assert.equal(adultHide.fitsSyntheticAperture,false);
assert.equal(adultHide.fitsSyntheticChamberLength,false);
assert.equal(youngHide.actualHideInSceneVerified,false);
assert.equal(youngHide.animalWelfareCertified,false);

// Complete *consecutive* growth path in a clear corridor. Each increment
// is <=.2 of a synthetic stage, checked against the same immutable source.
// Transition's swept 2D AABB is conservative, NEVER gameplay permission.
const transitionTrace=[];
for(let i=0;i<15;i++){
 const before=Math.round(i*20)/100;
 const after=Math.round((i+1)*20)/100;
 const transition=inspectSnakeGrowthTransitionV09n({
  sourcePose:canonicalPose,scene,fromProgress:before,
  toProgress:after
 });
 assert.equal(transition.conservativeSwept2DAabbClear,true);
 assert.equal(transition.from.candidate.points.length,24);
 assert.equal(transition.to.candidate.points.length,24);
 assert.equal(transition.growthStepLimited,true);
 assert.equal(transition.actualGrowthApplied,false);
 assert.equal(transition.originalMovementPausedForRevalidation,true);
 assert.equal(transition.true3DSweepCertified,false);
 assert.equal(transition.saveModified,false);
 assert.equal(transition.skinApplied,false);
 transitionTrace.push(F({
  progress:after,
  length:transition.to.candidate.lengthWorldUnits,
  maxRadius:transition.to.candidate.maxRadiusWorldUnits
 }));
}
assert.equal(transitionTrace.length,15);
assert.ok(Math.abs(transitionTrace.at(-1).length-2.964)<1e-9);
assert.throws(()=>inspectSnakeGrowthTransitionV09n({
 sourcePose:canonicalPose,scene,fromProgress:0,toProgress:3
}),RangeError,'instant jump from juvenile to large adult must reject');
assert.throws(()=>projectSnakeGrowthCandidateV09n({
 sourcePose:canonicalPose,stageProgress:4
}),RangeError);
assert.throws(()=>projectSnakeGrowthCandidateV09n({
 sourcePose:{...canonicalPose,bodyRadius:.12},
 stageProgress:0
}),RangeError,'changed source collider never gets silently treated as canonical');
assert.throws(()=>inspectSnakeSyntheticHideFitV09n({
 growthCandidate:juvenile,openingWidthPixels:-1,
 chamberLengthPixels:210
}),RangeError);

// A juvenile pose next to a rock may be legal, but later growth of the
// SAME anchored 24-joint body can no longer fit there. Never pretend
// that the adult can occupy the old juvenile hiding position.
const narrowSource=F({...canonicalPose,
 points:F(canonicalPose.points.map(q=>F({...q,y:-1.2})))
});
assert.equal(inspectSnakeSelfClearanceV09d({
 pose:narrowSource
}).candidateClearanceAccepted,true);
const narrowYoung=inspectSnakeGrowthEnvelopeV09n({
 sourcePose:narrowSource,scene,stageProgress:0
});
const narrowAdult=inspectSnakeGrowthEnvelopeV09n({
 sourcePose:narrowSource,scene,stageProgress:2
});
assert.equal(narrowYoung.environment.clear,true);
assert.equal(narrowAdult.environment.clear,false);
assert.equal(narrowAdult.environment.reason,
 'growth_touches_source_scene_object');
let firstBlocked=null,safe=0;
for(let i=0;i<10;i++){
 const from=i*.2,to=(i+1)*.2;
 const attempt=inspectSnakeGrowthTransitionV09n({
  sourcePose:narrowSource,scene,
  fromProgress:from,toProgress:to
 });
 if(attempt.conservativeSwept2DAabbClear)safe++;
 else {firstBlocked={from,to,reason:attempt.reason};break;}
}
assert.ok(safe>=1,'juvenile should fit at least one candidate increment');
assert.ok(firstBlocked,'growth must be stopped before embedding in stone');
assert.equal(JSON.stringify(canonicalPose),sourceBefore);
assert.equal(JSON.stringify({scene,terrain}),sceneBefore);

// Probe the EXISTING real V0.9C 24-joint source at a moving-return state.
// The existing source controller cannot accept a resized body yet.
const realScene=createTerrariumSceneGeometryV03d({
 sceneId:'v09n_true_source_probe',
 objects:[
  stone('left_stone',42,32,134,76,230),
  stone('rear_stone',390,10,108,70,190),
  stone('right_stone',836,30,105,80,245)
 ]
});
const bendPoints=[];
for(let i=0;i<=6;i++)bendPoints.push(F({
 x:.65,y:-1.32+i*.19,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const a=degree*Math.PI/180,q=bendPoints.at(-1);
 bendPoints.push(F({x:q.x+.19*Math.cos(a),
  y:q.y+.19*Math.sin(a),z:.135}));
}
const originalBase=F({version:'0.7P_source_pose',
 points:F(bendPoints),segmentLength:.19,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene:realScene,terrain,basePose:originalBase,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let i=0;i<95;i++){
 const step=advanceSnakeWallProbeV07p(wall,{
  scene:realScene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true);wall=step.nextState;
}
const realHead=snakeFloorToTerrariumV07c(wall.pose.points[0]);
const ecologySnapshot={revision:realScene.revision,sites:[{
 id:'hide_a',kind:'hide',safe:true,reachable:true,
 distanceCost:.1,conditions:{hasCover:true}
}]};
let moving=startSnakeRouteFollowerV09c({
 actorId:'v09n_neutral_true_source',
 scene:realScene,terrain,wallState:wall,ecologySnapshot,
 needs:{security:1,activity:0},
 siteFloors:{hide_a:{x:realHead.x+70,y:realHead.y}},
 autoReturn:true
});
for(let i=0;i<440&&moving.phase==='moving_outbound';i++)
 moving=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:moving,scene:realScene,terrain
 });
assert.equal(moving.phase,'moving_return');
assert.equal(moving.pose.points.length,24);
const movingHash=JSON.stringify(moving);
const allRealStages=SNAKE_SYNTHETIC_GROWTH_STAGES_V09N.map(s=>
 inspectSnakeGrowthEnvelopeV09n({
  sourcePose:moving.pose,scene:realScene,stageProgress:s.progress,
  goalFloor:moving.startFloor,goalRadiusPixels:160
 })
);
assert.equal(allRealStages.length,4);
assert.ok(allRealStages.every(x=>
 x.candidate.points.length===24&&
 x.sourceMotionAuthorized!==true&&
 x.originalControllerMustPauseOnResize===true));
assert.equal(JSON.stringify(moving),movingHash);
assert.equal(JSON.stringify(canonicalPose),sourceBefore);

console.log('PASS V0.9N four synthetic growth sizes, all-24 body goals, hide-fit, staged swept-size guards and unmodified real return source '+JSON.stringify({
 fixedCanonicalSourceLength:2.28,
 samples:samples.map(s=>({
  lifeStage:s.lifeStage,
  bodyLengthWorld:s.candidate.lengthWorldUnits,
  maxRadiusWorld:s.candidate.maxRadiusWorldUnits,
  goalJointsInside:s.goal.jointsInside,
  environmentClear:s.environment.clear,
  selfClear:s.self.clear
 })),
 legacyVisualGrowthBridges:visualBridges.length,
 legacyGrowthRenderOnlyNotNewCollisionAuthority:visualSourceStillIndependent,
 juvenileHide:youngHide.eligible2DProxy,
 adultHide:adultHide.eligible2DProxy,
 gradualStagesTested:transitionTrace.length,
 narrowYoungClear:narrowYoung.environment.clear,
 narrowAdultClear:narrowAdult.environment.clear,
 narrowGrowthStopsAt:firstBlocked,
 realMovingSourceFrame:moving.verifiedFrames,
 realSourceUnmodified:JSON.stringify(moving)===movingHash,
 resizedSourceGameplayAuthorized:false,
 physicallyCertified:false
}));
