import assert from 'node:assert/strict';
import {
 SNAKE_HABIT_PROFILES,SNAKE_POINT_KINDS,SNAKE_POINT_BEHAVIORS,validateSnakeActionPoints,
 rankSnakeActivityPoints,chooseSnakeActivityPoint
} from '../src/ohm-core/snake-activity-points.mjs';
const points=[
 {id:'hide_a',kind:'hide',safe:true,reachable:true,distanceCost:.1},
 {id:'warm_a',kind:'warm_area',safe:true,reachable:true,distanceCost:.1},
 {id:'cool_a',kind:'cool_area',safe:true,reachable:true,distanceCost:.2},
 {id:'water_a',kind:'water',safe:true,reachable:true,distanceCost:.2,waterAccessible:true,behaviorTags:['drinking']},
 {id:'soil_a',kind:'loose_substrate',safe:true,reachable:true,distanceCost:.1,diggable:true},
 {id:'branch_a',kind:'branch',safe:true,reachable:true,distanceCost:.1,supportStable:true},
 {id:'cover_a',kind:'covered_area',safe:true,reachable:true,distanceCost:.4},
 {id:'open_a',kind:'open_area',safe:true,reachable:true,distanceCost:.1}
];
assert.equal(validateSnakeActionPoints(points).ok,true);
assert.equal(validateSnakeActionPoints([points[0],points[0]]).error,'duplicate_id');
assert.ok(SNAKE_POINT_KINDS.includes('loose_substrate'));
assert.deepEqual(SNAKE_POINT_BEHAVIORS.hide,['sheltering','resting']);
assert.equal(validateSnakeActionPoints([{...points[0],behaviorTags:['drinking']}]).error,'invalid_behavior_tags');
assert.equal(SNAKE_HABIT_PROFILES.generic_snake.taxonomy,'art_test_not_a_real_species');
const decision=o=>chooseSnakeActivityPoint({points,...o});
const thirsty=decision({speciesId:'corn_snake',needs:{hydration:1,activity:.2}});
assert.equal(thirsty.targetId,'water_a');
assert.deepEqual(thirsty.ranking[0].behaviors,['drinking']);
assert.equal(decision({needs:{security:1,activity:.1}}).targetId,'hide_a');
assert.equal(decision({needs:{thermal:'seek_warm',activity:.2}}).targetId,'warm_a');
assert.equal(decision({needs:{thermal:'seek_cool',activity:.2}}).targetId,'cool_a');
const active={security:0,hydration:0,activity:1,burrow:.88,climb:.88};
assert.equal(decision({speciesId:'corn_snake',needs:active}).targetId,'branch_a');
assert.equal(decision({speciesId:'hognose_snake',needs:active}).targetId,'soil_a');
assert.equal(decision({points:[],needs:{activity:0}}).activity,'rest');
assert.equal(decision({points:points.map(p=>({...p,safe:false}))}).shouldMove,false);
assert.deepEqual(decision({points:[],needs:{hydration:1}}).unmetNeeds,['no_safe_accessible_water']);
const blocked=points.map(p=>p.id==='branch_a'?{...p,supportStable:false}:p);
assert.notEqual(decision({speciesId:'corn_snake',needs:active,points:blocked}).targetId,'branch_a');
const soilBlocked=points.map(p=>p.id==='soil_a'?{...p,diggable:false}:p);
assert.notEqual(decision({speciesId:'hognose_snake',needs:active,points:soilBlocked}).targetId,'soil_a');
assert.equal(decision({speciesId:'corn_snake',needs:{hydration:.5},cooldownIds:['water_a']}).targetId!=='water_a',true);
assert.equal(decision({speciesId:'corn_snake',needs:{hydration:1},cooldownIds:['water_a']}).targetId,'water_a');
assert.equal(decision({speciesId:'corn_snake',needs:{hydration:1},currentTargetId:'water_a',cooldownIds:['water_a']}).targetId,'water_a');
const read=decision({points});assert.deepEqual(read,decision({points}));
assert.equal(rankSnakeActivityPoints({points,dayPhase:'dusk'}).dayPhase,'dusk');
for(const k of Object.keys(SNAKE_HABIT_PROFILES)){
 for(const dayPhase of ['dawn','day','dusk','night']){
  for(const a of [0,.1,.5,.9,1]){
   const r=decision({speciesId:k,dayPhase,needs:{activity:a},points});
   assert.equal(r.ranking.length,points.length+1);
   assert.ok(r.ranking.every(x=>Number.isFinite(x.score)));
  }
 }
}
const bad=[
 ()=>decision({speciesId:'__proto__'}),
 ()=>decision({needs:{activity:1.1}}),
 ()=>decision({needs:{hydration:NaN}}),
 ()=>decision({needs:{thermal:'hot'}}),
 ()=>decision({dayPhase:'midnight'}),
 ()=>decision({points:[{...points[0],distanceCost:Infinity}]}),
 ()=>decision({points:[{...points[5],supportStable:undefined}]}),
 ()=>decision({cooldownIds:['bad id']})
];
for(const fail of bad)assert.throws(fail,RangeError);
assert.equal(chooseSnakeActivityPoint({points:[]}).activity,'rest');
assert.equal(thirsty.status,'prototype_design_weights_not_measured_behavior');
console.log('PASS snake activity points: habitat/safety, species affinities, needs, rest, 60 combinations, input guards');
