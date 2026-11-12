import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TERRARIUM_SCENE_GEOMETRY_V03D_VERSION,
 createTerrariumSceneGeometryV03d,
 isValidTerrariumSceneGeometryV03d,
 advanceTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent,
 calculateTerrariumGeometryTransmissionV03d,
 inspectTerrariumSceneGeometryV03d,
 buildTerrariumSceneGeometryV03dActionSnapshot
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createTerrariumEcologyLightV03b}
 from '../src/ohm-core/terrarium-ecology-light-v03b.mjs';

const fixture={
 id:'led',type:'artificial_led',zoneIndex:2,strengthUnits:900,
 spreadZones:4,heightUnits:0,startMinute:0,durationMinutes:1440
};
const baseOptions={
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{columns:5,rows:1,
    ambient:{temperatureC:24,relativeHumidity:.5},
    cellOverrides:[{x:0,y:0,heater:1},{x:2,y:0,waterLevel:.9}]},
   substrateOptions:{zones:Array.from({length:5},()=>({
    surfaceWaterUnits:650,rootWaterUnits:1600,
    percolationPermille:0,lateralPermille:0
   }))}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:120,litterUnits:200},
   {plantKind:'fern',plantCoverUnits:120,litterUnits:250},
   {plantKind:'none',plantCoverUnits:0,litterUnits:130},
   {plantKind:'moss',plantCoverUnits:250,litterUnits:900},
   {plantKind:'fern',plantCoverUnits:320,litterUnits:500}
  ]
 },
 fixtures:[fixture]
};
const blocker={
 id:'stone_01',kind:'rock_overhang',
 x:570,y:120,width:60,depth:160,height:500,
 transmissionPermille:0
};
const mounts=[{fixtureId:'led',x:500,y:200,height:800}];
const make=(objects=[],other={})=>createTerrariumSceneGeometryV03d({
 baseOptions,sceneId:'ecology_v03d',mounts,objects,...other
});
function verify(s){
 assert.equal(isValidTerrariumSceneGeometryV03d(s),true);
 assert.equal(s.minute,s.base.minute);
 assert.equal(s.base.biota.environment.minute,s.minute);
 const w=s.base.biota.environment.substrate;
 const wl=w.ledger,stored=w.zones.reduce((a,z)=>a+
  z.surface.waterUnits+z.root.waterUnits+z.drainage.waterUnits,0);
 assert.equal(wl.initialUnits+wl.addedUnits,
  stored+wl.evaporatedUnits+wl.drainedUnits+wl.overflowUnits);
 const o=s.base.biota.ledger;
 assert.equal(o.initialUnits+o.addedUnits,
  s.base.biota.zones.reduce((a,z)=>a+z.litterUnits+
  z.fragmentedUnits+z.mineralUnits,0));
}
assert.equal(TERRARIUM_SCENE_GEOMETRY_V03D_VERSION,'0.3d');
const clear=make();
verify(clear);
assert.deepEqual(clear.base,createTerrariumEcologyLightV03b(baseOptions),
 'unoccluded default 2.5D scene reuses exact original light core');
assert.deepEqual(clear.base.transmissionByZone,[1000,1000,1000,1000,1000]);
assert.equal(clear.zones.length,5);
assert.deepEqual(clear.zones.map(z=>z.x),[0,200,400,600,800]);
const before=JSON.stringify(clear);
const dark=make([blocker]);
verify(dark);
const raw=clear.base.biota.zones.map(z=>z.plant.lightUnits);
const actual=dark.base.biota.zones.map(z=>z.plant.lightUnits);
assert.ok(dark.base.transmissionByZone[3]<1000);
assert.equal(dark.base.transmissionByZone[2],1000);
assert.equal(dark.base.transmissionByZone[4],1000,
 'short projected shadow is not applied to a far zone');
assert.ok(actual[3]<raw[3],'ray shadow reaches zone 3 from offset object');
assert.equal(actual[4],raw[4]);
assert.equal(JSON.stringify(clear),before,'create must not mutate source');
assert.deepEqual(dark.base.biota.ledger,clear.base.biota.ledger);
assert.deepEqual(dark.base.biota.environment.substrate.ledger,
 clear.base.biota.environment.substrate.ledger,
 'moving obstacles cannot invent soil water');
const short=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'object',type:'upsert',object:{...blocker,height:80}
});
verify(short);
assert.equal(short.base.transmissionByZone[3],1000,
 'short box does not intercept light ray passing above it');
assert.equal(short.objects.length,1);
const moved=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'object',type:'upsert',object:{...blocker,x:370}
});
verify(moved);
assert.equal(moved.objects[0].x,370);
assert.equal(moved.base.transmissionByZone[3],1000,
 'moving object across floor changes shadow, not just a label');
const hiddenByNewPosition=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'object',type:'upsert',object:{...blocker,y:0,depth:60}
});
verify(hiddenByNewPosition);
assert.equal(hiddenByNewPosition.base.transmissionByZone[3],1000);
const removed=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'object',type:'remove',id:'stone_01'
});
verify(removed);
assert.deepEqual(removed.base.transmissionByZone,
 [1000,1000,1000,1000,1000]);
assert.equal(removed.objects.length,0);
const current=inspectTerrariumSceneGeometryV03d(dark);
assert.deepEqual(current.transmissionByZone,dark.base.transmissionByZone);
assert.equal(current.bounds.width,1000);
assert.equal(current.bounds.depth,400);
assert.equal(current.modelStatus,
 'bounded_2_5d_five_sample_aabb_ray_visibility_game_proxy');
assert.ok(Object.isFrozen(current.objects[0]));
assert.ok(current.rawLightUnitsByZone[3]>current.actualLightUnitsByZone[3]);
assert.equal(buildTerrariumSceneGeometryV03dActionSnapshot(dark).sites.length,0);
const shiftedLamp=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'mount',type:'upsert',mount:{fixtureId:'led',x:900,y:200,height:800}
});
verify(shiftedLamp);
assert.notDeepEqual(shiftedLamp.base.transmissionByZone,
 dark.base.transmissionByZone,'moving light mount changes ray direction');
const restoredLamp=applyTerrariumSceneGeometryV03dEvent(shiftedLamp,{
 channel:'mount',type:'upsert',mount:mounts[0]
});
verify(restoredLamp);
assert.deepEqual(restoredLamp.base.transmissionByZone,
 dark.base.transmissionByZone);
const semi=make([{...blocker,transmissionPermille:700}]);
verify(semi);
const partial=applyTerrariumSceneGeometryV03dEvent(semi,{
 channel:'object',type:'upsert',object:{...blocker,id:'leaf_canopy',
  kind:'canopy',height:500,transmissionPermille:500}
});
verify(partial);
assert.ok(partial.base.transmissionByZone[3]<
 semi.base.transmissionByZone[3],
 'two semi-transparent prisms multiply sampled transmission');
const revisedZone=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'zone',type:'update',zone:{
  id:'zone_3',x:600,y:340,width:200,depth:60
 }
});
verify(revisedZone);
assert.notDeepEqual(revisedZone.base.transmissionByZone,
 dark.base.transmissionByZone,
 'plant sampling area must be scene-owned and movable');
const originalWater=dark.base.biota.environment.substrate.ledger;
const leaf=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'base',event:{channel:'organic',
  type:'litter_input',eventId:'leaf_77',minute:0,
  zoneId:'zone_3',amountUnits:500,
  source:{kind:'player_placement',referenceId:'placed_77'}}
});
verify(leaf);
assert.equal(leaf.base.receipts.length,1);
assert.equal(leaf.base.receipts[0].classification,
 'in_game_event_not_observation');
assert.equal(leaf.base.biota.ledger.addedUnits,500);
assert.deepEqual(leaf.base.biota.environment.substrate.ledger,originalWater);
const watered=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'base',event:{channel:'environment',event:{
  channel:'environment',event:{channel:'substrate',
   event:{zoneId:'zone_3',type:'mist',amountUnits:250}}}}
});
verify(watered);
assert.equal(watered.base.biota.ledger.addedUnits,0);
assert.equal(watered.base.biota.environment.substrate.ledger.addedUnits,250);
assert.deepEqual(watered.objects,dark.objects);
const active=advanceTerrariumSceneGeometryV03d(dark,{minutes:60});
const activeSplit=advanceTerrariumSceneGeometryV03d(
 advanceTerrariumSceneGeometryV03d(dark,{minutes:27}),{minutes:33});
verify(active);
assert.deepEqual(active,activeSplit,'27+33 game minutes must equal 60');
assert.deepEqual(active,advanceTerrariumSceneGeometryV03d(dark,{minutes:60}));
const fullyLit=advanceTerrariumSceneGeometryV03d(clear,{minutes:60});
verify(fullyLit);
assert.ok(fullyLit.base.biota.zones[3].plant.coverUnits>=
 active.base.biota.zones[3].plant.coverUnits,
 'more received light cannot yield less nominal growth in this dry-free case');
const chunk240=advanceTerrariumSceneGeometryV03d(dark,{minutes:240});
verify(chunk240);
assert.deepEqual(chunk240,advanceTerrariumSceneGeometryV03d(
 advanceTerrariumSceneGeometryV03d(dark,{minutes:120}),{minutes:120}));
const recovered=JSON.parse(JSON.stringify(active));
verify(recovered);
assert.deepEqual(advanceTerrariumSceneGeometryV03d(recovered,{minutes:1}),
 advanceTerrariumSceneGeometryV03d(active,{minutes:1}));
assert.equal(isValidTerrariumSceneGeometryV03d({...dark,minute:99}),false);
assert.equal(isValidTerrariumSceneGeometryV03d({...dark,
  objects:[{...blocker,x:630}]}),false,
  'forged geometry with old light transmission must be rejected');
assert.equal(isValidTerrariumSceneGeometryV03d({...dark,
  base:{...dark.base,transmissionByZone:[1000,1000,1000,1000,1000]}}),false);
const newLamp={...fixture,id:'night',
 startMinute:1200,durationMinutes:600,zoneIndex:1};
const withNight=applyTerrariumSceneGeometryV03dEvent(dark,{
 channel:'base',event:{channel:'fixture',type:'upsert',fixture:newLamp}
});
verify(withNight);
assert.equal(withNight.base.fixtures.length,2);
const night=advanceTerrariumSceneGeometryV03d(withNight,{minutes:240});
verify(night);
assert.equal(night.base.fixtures.length,2);
const noNight=applyTerrariumSceneGeometryV03dEvent(withNight,{
 channel:'base',event:{channel:'fixture',type:'remove',id:'night'}
});
verify(noNight);
assert.equal(noNight.base.fixtures.length,1);
const additionalMount=applyTerrariumSceneGeometryV03dEvent(withNight,{
 channel:'mount',type:'upsert',mount:{fixtureId:'night',x:250,y:200,height:800}
});
verify(additionalMount);
const withoutNight=applyTerrariumSceneGeometryV03dEvent(additionalMount,{
 channel:'base',event:{channel:'fixture',type:'remove',id:'night'}
});
verify(withoutNight);
assert.equal(withoutNight.mounts.length,1,'orphan light mounts must be removed');
assert.equal(withoutNight.mounts[0].fixtureId,'led');
for(const operation of [
 ()=>createTerrariumSceneGeometryV03d({baseOptions,objects:[{...blocker,x:970}]}),
 ()=>createTerrariumSceneGeometryV03d({baseOptions,objects:[{...blocker,height:0}]}),
 ()=>createTerrariumSceneGeometryV03d({baseOptions,objects:[{...blocker,width:0}]}),
 ()=>createTerrariumSceneGeometryV03d({baseOptions,objects:[blocker,blocker]}),
 ()=>createTerrariumSceneGeometryV03d({baseOptions,mounts:[{fixtureId:'ghost',x:20,y:20,height:80}]}),
 ()=>createTerrariumSceneGeometryV03d({baseOptions,zones:[{id:'zone_0',x:0,y:0,width:100,depth:400}]}),
 ()=>calculateTerrariumGeometryTransmissionV03d({base:dark.base,zones:[],objects:[]}),
 ()=>advanceTerrariumSceneGeometryV03d(dark,{minutes:0}),
 ()=>advanceTerrariumSceneGeometryV03d(dark,{minutes:241}),
 ()=>applyTerrariumSceneGeometryV03dEvent(dark,{channel:'object',type:'remove',id:'no'}),
 ()=>applyTerrariumSceneGeometryV03dEvent(dark,{channel:'object',type:'upsert',object:{...blocker,transmissionPermille:1001}}),
 ()=>applyTerrariumSceneGeometryV03dEvent(dark,{channel:'zone',type:'update',zone:{id:'zone_88',x:0,y:0,width:100,depth:100}}),
 ()=>applyTerrariumSceneGeometryV03dEvent(dark,{channel:'base',event:{channel:'biota',event:{channel:'biota',type:'light',zoneId:'zone_0',lightUnits:500}}}),
 ()=>applyTerrariumSceneGeometryV03dEvent(dark,{channel:'bad'}),
 ()=>inspectTerrariumSceneGeometryV03d({}),
 ()=>buildTerrariumSceneGeometryV03dActionSnapshot({})
])assert.throws(operation,RangeError);
const code=readFileSync(new URL(
 '../src/ohm-core/terrarium-scene-geometry-v03d.mjs',import.meta.url),'utf8');
assert.doesNotMatch(code,/window\.|document\.|localStorage|sessionStorage|indexedDB|supabase|fetch\(|setInterval/i);
console.log('PASS V0.3d geometry: 2.5D sampled light visibility, scene object/mount moves, physical-height dependency, species candidate response, split time, source-tagged litter and independently conserved ledgers');
