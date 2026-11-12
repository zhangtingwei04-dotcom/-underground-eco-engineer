import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {snakeFloorToTerrariumV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {createSnakeWallProbeV07p,advanceSnakeWallProbeV07p}
 from '../src/ohm-core/snake-wall-probe-v07p.mjs';
import {verifySnakeAutonomousSegmentV09a}
 from '../src/ohm-core/snake-autonomous-intent-v09a.mjs';
import {findSnakeSceneRouteV09b,planSnakeSceneAutonomyV09b}
 from '../src/ohm-core/snake-scene-route-v09b.mjs';

const box=(id,x,y,width,depth)=>({
 id,kind:'rock_overhang',x,y,width,depth,height:130,
 transmissionPermille:0
});
// Full 2D source corridor detours around an inflated source rock.
// This is NOT a full-body 3D route or proof of safe return.
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_route_grid_reversible',
 objects:[box('central_rock',450,100,100,200)]
});
const graph=findSnakeSceneRouteV09b({
 scene,startFloor:{x:80,y:200},goalFloor:{x:920,y:200}
});
assert.equal(graph.status,'SAFE_GRID_BIDIRECTIONAL');
assert.equal(graph.graphTwoWayOnly,true);
assert.equal(graph.fullBodyReturnVerified,false);
assert.ok(graph.path.length>5);
assert.ok(graph.returnPath.length>5);
assert.ok(graph.path.some(p=>p.y<75||p.y>325));
assert.deepEqual(graph,findSnakeSceneRouteV09b({
 scene,startFloor:{x:80,y:200},goalFloor:{x:920,y:200}
}));
assert.deepEqual(graph.path[0],{x:80,y:200});
assert.deepEqual(graph.path.at(-1),{x:920,y:200});
assert.deepEqual(graph.returnPath[0],{x:920,y:200});
assert.deepEqual(graph.returnPath.at(-1),{x:80,y:200});

const covered=findSnakeSceneRouteV09b({
 scene,startFloor:{x:80,y:200},goalFloor:{x:500,y:200}
});
assert.equal(covered.status,'APPROACH_ONLY');
assert.equal(covered.blockedGoal,true);
assert.ok(covered.distanceToGoalPixels>0);
assert.equal(covered.destinationArrived,false);
assert.equal(findSnakeSceneRouteV09b({
 scene,startFloor:{x:480,y:200},goalFloor:{x:920,y:200}
}).status,'BLOCKED_START');
const split=createTerrariumSceneGeometryV03d({
 sceneId:'public_route_partition',
 objects:[box('across',470,0,60,400)]
});
const unreachable=findSnakeSceneRouteV09b({
 scene:split,startFloor:{x:100,y:180},goalFloor:{x:900,y:180}
});
assert.equal(unreachable.status,'APPROACH_ONLY');
assert.ok(unreachable.fallbackFloor.x<470);
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:box('central_rock',470,100,100,200)
});
assert.equal(findSnakeSceneRouteV09b({
 scene:moved,startFloor:{x:80,y:200},goalFloor:{x:920,y:200},
 expectedRevision:scene.revision
}).status,'STALE_SCENE');
assert.throws(()=>findSnakeSceneRouteV09b({
 scene,startFloor:{x:Infinity,y:200},goalFloor:{x:920,y:200}
}),RangeError);
assert.throws(()=>findSnakeSceneRouteV09b({
 scene,startFloor:{x:80,y:200},goalFloor:{x:920,y:200},
 bodyClearancePixels:5
}),RangeError);

const liveScene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v09b_neutral_snake',
 objects:[
  box('left_stone',42,32,134,76),
  box('rear_stone',390,10,108,70),
  box('right_stone',836,30,105,80)
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,sourcePoints=[];
for(let i=0;i<=6;i++)sourcePoints.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const theta=degree*Math.PI/180,p=sourcePoints.at(-1);
 sourcePoints.push(Object.freeze({
  x:p.x+Math.cos(theta)*ds,y:p.y+Math.sin(theta)*ds,z:.135
 }));
}
const pose=Object.freeze({version:'0.7P_source_pose',
 points:Object.freeze(sourcePoints),segmentLength:ds,bodyRadius:.13});
let wall=createSnakeWallProbeV07p({
 scene:liveScene,terrain,basePose:pose,pivotIndex:6,
 maxPitch:.36,wall:'rear',speciesId:'generic_snake'
});
for(let f=0;f<95;f++){
 const step=advanceSnakeWallProbeV07p(wall,{
  scene:liveScene,terrain,seconds:1/30,maxJointSpeed:.75
 });
 assert.equal(step.renderable,true,'full-body source wall frame '+f);
 wall=step.nextState;
}
const before=JSON.stringify({liveScene,terrain,wall});
const head=snakeFloorToTerrariumV07c(wall.pose.points[0]);
console.log('V0.9B source head floor '+JSON.stringify(head));
const siteFloors={
 hide_a:{x:Math.min(790,head.x+85),y:head.y},
 open_a:{x:Math.min(810,head.x+160),y:head.y}
};
const ecologySnapshot={revision:liveScene.revision,sites:[
 {id:'hide_a',kind:'hide',safe:true,reachable:true,
  distanceCost:.1,conditions:{hasCover:true}},
 {id:'open_a',kind:'open_area',safe:true,reachable:true,
  distanceCost:.1,conditions:{}}
]};
const plan=needs=>planSnakeSceneAutonomyV09b({
 actorId:'synthetic_01',scene:liveScene,terrain,wallState:wall,
 ecologySnapshot,needs,siteFloors,horizonFrames:60
});
const hide=plan({security:1,activity:0});
console.log('V0.9B shelter autonomous result '+JSON.stringify({
 ok:hide.ok,reason:hide.reason,targetId:hide.motion?.targetId,
 routes:hide.routes,selected:hide.motion?.selected,
 rejected:hide.motion?.rejected
}));
assert.equal(hide.noAuthoredVectors,true);
assert.equal(hide.graphTwoWayOnly,true);
assert.equal(hide.fullReturnVerified,false);
assert.equal(hide.routes.find(x=>x.siteId==='hide_a').status,
 'SAFE_GRID_BIDIRECTIONAL');
assert.equal(hide.ok,true);
assert.equal(hide.motion.chosenActivity,'hide');
assert.ok(hide.motion.selected);
const completed=verifySnakeAutonomousSegmentV09a({
 plan:hide.motion,wallState:wall,scene:liveScene,terrain
});
assert.equal(completed.ok,true);
assert.equal(completed.boneCount,24);
assert.equal(completed.completedEvent.destinationReached,false);
assert.equal(completed.completedEvent.observedByPlayer,false);
assert.equal(completed.safeReturnToOriginVerified,false);
const exploring=plan({security:0,activity:1});
assert.equal(exploring.noAuthoredVectors,true);
assert.equal(exploring.ok,true);
assert.equal(exploring.motion.chosenActivity,'open_area');
assert.deepEqual(exploring,plan({security:0,activity:1}),
 'derived route and need-driven intent must be deterministic');

const noSites=planSnakeSceneAutonomyV09b({
 actorId:'synthetic_01',scene:liveScene,terrain,wallState:wall,
 ecologySnapshot:{revision:liveScene.revision,sites:[]},
 siteFloors:{},needs:{security:0,activity:0}
});
assert.equal(noSites.motion.phase,'remain_still');
assert.equal(noSites.ok,false);
const mismatched=planSnakeSceneAutonomyV09b({
 actorId:'synthetic_01',scene:liveScene,terrain,wallState:wall,
 ecologySnapshot:{...ecologySnapshot,revision:liveScene.revision+1},
 siteFloors
});
assert.equal(mismatched.reason,'wall_or_ecology_scene_mismatch');
assert.equal(mismatched.motion,null);
assert.throws(()=>planSnakeSceneAutonomyV09b({
 actorId:'synthetic_01',scene:liveScene,terrain,wallState:wall,
 ecologySnapshot,siteFloors:{bad:{x:-1,y:30}}
}),RangeError);
assert.equal(JSON.stringify({liveScene,terrain,wall}),before,
 'the autonomous plan cannot change source geometry or body');
console.log('PASS V0.9B source AABB routed heading derived from scene: reversible 2D graph, approach not arrival, true 24-joint short preflight, deterministic shelter/explore/rest, revision gate');
