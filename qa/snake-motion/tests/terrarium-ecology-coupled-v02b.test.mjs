import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createTerrariumMicroclimate,advanceTerrariumMicroclimate,
  projectTerrariumMicroclimateSoilMoisture
} from '../src/ohm-core/terrarium-microclimate-v01.mjs';
import {
  createTerrariumSubstrateWater,advanceTerrariumSubstrateWater,
  isValidTerrariumSubstrateWater
} from '../src/ohm-core/terrarium-substrate-water-v02.mjs';
import {
  TERRARIUM_ECOLOGY_COUPLED_VERSION,
  createCoupledTerrariumEcology,isValidCoupledTerrariumEcology,
  advanceCoupledTerrariumEcology,applyCoupledTerrariumEcologyEvent,
  inspectCoupledTerrariumEcology,buildCoupledTerrariumEcologyActionSnapshot
} from '../src/ohm-core/terrarium-ecology-coupled-v02b.mjs';
import {buildSnakeActionInputFromEcology}
  from '../src/ohm-core/snake-ecology-action-adapter.mjs';
import {chooseSnakeActivityPoint}
  from '../src/ohm-core/snake-activity-points.mjs';

const microOptions={
  columns:5,rows:1,
  ambient:{temperatureC:24,relativeHumidity:.5},
  cellOverrides:[
    {x:0,y:0,heater:1,substrateMoisture:0.99},
    {x:1,y:0,cooler:.6,shade:.8},
    {x:2,y:0,waterLevel:.95},
    {x:3,y:0,shade:.7},
    {x:4,y:0,substrateMoisture:0}
  ],
  sites:[
    {id:'warm',cellIndex:0,kind:'warm_area',safe:true,
      reachable:true,distanceCost:.3,flags:{thermalService:true}},
    {id:'bowl',cellIndex:2,kind:'water',safe:true,
      reachable:true,distanceCost:.2,flags:{waterReachable:true}},
    {id:'soil',cellIndex:4,kind:'loose_substrate',safe:true,
      reachable:true,distanceCost:.4,flags:{diggable:true}}
  ]
};
const substrateOptions={zones:[
 {rootWaterUnits:250,surfaceWaterUnits:100},
 {rootWaterUnits:620,surfaceWaterUnits:200},
 {rootWaterUnits:1000,surfaceWaterUnits:330},
 {rootWaterUnits:1550,surfaceWaterUnits:400},
 {rootWaterUnits:2500,surfaceWaterUnits:800}
]};
const options={microclimateOptions:microOptions,substrateOptions};
const expected=s=>s.substrate.zones.map(z=>
 Number((z.root.waterUnits/z.root.capacityUnits).toFixed(7)));
const actual=s=>s.microclimate.cells.map(c=>c.substrateMoisture);
const total=s=>s.substrate.zones.reduce((sum,z)=>sum+
 z.surface.waterUnits+z.root.waterUnits+z.drainage.waterUnits,0);
const verify=s=>{
 assert.equal(isValidCoupledTerrariumEcology(s),true);
 assert.equal(isValidTerrariumSubstrateWater(s.substrate),true);
 assert.equal(s.minute,s.microclimate.minute);
 assert.equal(s.minute,s.substrate.minute);
 assert.deepEqual(actual(s),expected(s));
 const l=s.substrate.ledger;
 assert.equal(l.initialUnits+l.addedUnits,
   total(s)+l.evaporatedUnits+l.drainedUnits+l.overflowUnits);
};
assert.equal(TERRARIUM_ECOLOGY_COUPLED_VERSION,'0.2b');
let initial=createCoupledTerrariumEcology(options);
verify(initial);
assert.equal(Object.isFrozen(initial),true);
assert.equal(initial.minute,0);
assert.equal(initial.revision,0);
assert.equal(initial.microclimate.cells[0].substrateMoisture,
  .078125,'initial incorrect V0.1 soil guess must be replaced');
assert.equal(initial.microclimate.cells[4].substrateMoisture,
  .78125,'wet root is the soil authority');
assert.equal(initial.microclimate.cells[2].waterLevel,.95,
 'separate water bowl should not be overwritten');
const before=JSON.stringify(initial);
const result=advanceCoupledTerrariumEcology(initial,{minutes:60});
verify(result);
assert.equal(JSON.stringify(initial),before,'immutable time update');
assert.equal(result.minute,60);
assert.equal(result.revision,60);
assert.equal(result.substrate.ledger.addedUnits,0);
assert.ok(result.substrate.ledger.evaporatedUnits>0);
assert.deepEqual(result,advanceCoupledTerrariumEcology(initial,{minutes:60}));
const split=advanceCoupledTerrariumEcology(
 advanceCoupledTerrariumEcology(initial,{minutes:27}),
 {minutes:33}
);
verify(split);
assert.deepEqual(split,result,
 '60 minutes equals 27 then 33; display FPS does not affect ecology');
const loaded=JSON.parse(JSON.stringify(result));
verify(loaded);
assert.deepEqual(advanceCoupledTerrariumEcology(loaded,{minutes:2}),
 advanceCoupledTerrariumEcology(result,{minutes:2}),
 'JSON roundtrip retains all running states');
const view=inspectCoupledTerrariumEcology(result);
assert.equal(Object.isFrozen(view),true);
assert.equal(view.moistureAuthority,'substrate_root_water_units');
assert.equal(view.minute,60);
assert.equal(view.bowlPolicy,'separate_water_resource_not_in_soil_ledger');
assert.equal(view.soil.totalUnits,total(result));
assert.equal(view.climate.cells[2].waterLevel,result.microclimate.cells[2].waterLevel);
const beforeEventLedger=JSON.stringify(result.substrate.ledger);
const bowlEmpty=applyCoupledTerrariumEcologyEvent(result,{
 channel:'microclimate',cellId:'cell_2_0',changes:{waterLevel:0}
});
verify(bowlEmpty);
assert.equal(bowlEmpty.minute,60);
assert.equal(JSON.stringify(bowlEmpty.substrate.ledger),beforeEventLedger,
 'drinking bowl does not add/subtract from soil reservoir');
assert.deepEqual(bowlEmpty.substrate,result.substrate);
const emptySnap=buildCoupledTerrariumEcologyActionSnapshot(bowlEmpty);
assert.equal(emptySnap.sites.find(x=>x.id==='bowl').conditions.hasWater,false);
const blocked=buildSnakeActionInputFromEcology({
 snapshot:emptySnap,speciesId:'corn_snake',needs:{hydration:1}
});
assert.equal(chooseSnakeActivityPoint(blocked).unmetNeeds[0],
 'no_safe_accessible_water');
const bowlRefilled=applyCoupledTerrariumEcologyEvent(bowlEmpty,{
 channel:'microclimate',cellId:'cell_2_0',changes:{waterLevel:1}
});
verify(bowlRefilled);
assert.equal(buildCoupledTerrariumEcologyActionSnapshot(bowlRefilled)
 .sites.find(x=>x.id==='bowl').conditions.hasWater,true);
const watered=applyCoupledTerrariumEcologyEvent(bowlRefilled,{
 channel:'substrate',event:{type:'water',zoneId:'zone_4',amountUnits:1100}
});
verify(watered);
assert.equal(watered.minute,60);
assert.ok(watered.substrate.ledger.addedUnits>=1100);
assert.equal(watered.microclimate.cells[2].waterLevel,1,
 'soil watering does not magically fill the drinking bowl');
const misted=applyCoupledTerrariumEcologyEvent(watered,{
 channel:'substrate',event:{type:'mist',zoneId:'zone_0',amountUnits:210}
});
verify(misted);
const meshClosed=applyCoupledTerrariumEcologyEvent(misted,{
 channel:'substrate',event:{type:'mesh',zoneId:'zone_4',open:false}
});
verify(meshClosed);
assert.equal(meshClosed.substrate.zones[4].meshOpen,false);
const outletOn=applyCoupledTerrariumEcologyEvent(meshClosed,{
 channel:'substrate',event:{type:'outlet',zoneId:'zone_4',open:true}
});
verify(outletOn);
const later=advanceCoupledTerrariumEcology(outletOn,{minutes:12});
verify(later);
const emptied=applyCoupledTerrariumEcologyEvent(later,{
 channel:'substrate',event:{type:'drain',zoneId:'zone_4',amountUnits:5000}
});
verify(emptied);
assert.equal(emptied.substrate.zones[4].drainage.waterUnits,0);
const changeHeat=applyCoupledTerrariumEcologyEvent(emptied,{
 channel:'microclimate',cellId:'cell_0_0',changes:{heater:0,shade:.6}
});
verify(changeHeat);
assert.equal(changeHeat.microclimate.cells[0].heater,0);
assert.deepEqual(actual(changeHeat),actual(emptied),
 'unrelated environment controls cannot alter layered soil water');
const cooled=advanceCoupledTerrariumEcology(changeHeat,{minutes:70});
verify(cooled);
assert.ok(cooled.microclimate.cells[0].temperatureC<
 changeHeat.microclimate.cells[0].temperatureC);
const source=readFileSync(
 new URL('../src/ohm-core/terrarium-ecology-coupled-v02b.mjs',import.meta.url),'utf8');
assert.doesNotMatch(source,/localStorage|sessionStorage|window\.|document\.|supabase|fetch\(|Date\.|setInterval|XMLHttpRequest/i);
const legacy=createTerrariumMicroclimate(microOptions);
const legacyAdvanced=advanceTerrariumMicroclimate(legacy,{minutes:1});
assert.ok(legacyAdvanced.cells[0].substrateMoisture<
 legacy.cells[0].substrateMoisture,
 'legacy V0.1 callers retain old behaviour without opt-in');
const oneMinute=advanceCoupledTerrariumEcology(initial,{minutes:1});
assert.equal(oneMinute.microclimate.cells[0].substrateMoisture,
 expected(oneMinute)[0],'coupled tick never performs legacy double decay');
assert.throws(()=>advanceTerrariumMicroclimate(legacy,{
 minutes:2,externalMoistureByCell:Array.from({length:5},()=>.1)
}),RangeError,'constant external moisture must not be reused across multiple minutes');
assert.throws(()=>advanceTerrariumMicroclimate(legacy,{
 minutes:1,externalMoistureByCell:[.4]
}),RangeError);
assert.throws(()=>projectTerrariumMicroclimateSoilMoisture(legacy,[1.1,0,0,0,0]),RangeError);
for(const attempt of [
 ()=>createCoupledTerrariumEcology({microclimateOptions:{rows:2,columns:5}}),
 ()=>createCoupledTerrariumEcology({
  microclimateOptions:{columns:3,rows:1},
  substrateOptions:{zones:[{},{}]}
 }),
 ()=>createCoupledTerrariumEcology({
  microclimate:createTerrariumMicroclimate({columns:1,rows:1}),
  substrate:advanceTerrariumSubstrateWater(
   createTerrariumSubstrateWater({zones:[{}]}),{minutes:2})
 }),
 ()=>createCoupledTerrariumEcology({microclimateOptions:{foo:1}}),
 ()=>advanceCoupledTerrariumEcology(initial,{minutes:0}),
 ()=>advanceCoupledTerrariumEcology(initial,{minutes:241}),
 ()=>advanceCoupledTerrariumEcology(initial,{minutes:Infinity}),
 ()=>advanceCoupledTerrariumEcology(initial,{minutes:1.5}),
 ()=>applyCoupledTerrariumEcologyEvent(initial,{
   channel:'microclimate',cellId:'cell_0_0',
   changes:{substrateMoisture:.9}
 }),
 ()=>applyCoupledTerrariumEcologyEvent(initial,{
   channel:'microclimate',cellId:'cell_0_0',
   changes:{substrateRetention:.9}
 }),
 ()=>applyCoupledTerrariumEcologyEvent(initial,{
   channel:'substrate',event:{type:'mist',zoneId:'zone_0',
     amountUnits:200},changes:{heater:1}
 }),
 ()=>applyCoupledTerrariumEcologyEvent(initial,{
   channel:'substrate',event:{type:'water',zoneId:'zone_999',
     amountUnits:200}
 }),
 ()=>applyCoupledTerrariumEcologyEvent(initial,{channel:'what'}),
 ()=>inspectCoupledTerrariumEcology({}),
 ()=>buildCoupledTerrariumEcologyActionSnapshot({}),
])assert.throws(attempt,RangeError);
assert.equal(isValidCoupledTerrariumEcology({...initial,minute:12}),false);
assert.equal(isValidCoupledTerrariumEcology({
 ...initial,microclimate:{...initial.microclimate,
 cells:initial.microclimate.cells.map((c,i)=>i===4?{
  ...c,substrateMoisture:.01
 }:c)}
}),false,'forged soil moisture cannot override ledger water');
assert.equal(isValidCoupledTerrariumEcology({
 ...initial,substrate:{...initial.substrate,
  ledger:{...initial.substrate.ledger,addedUnits:999}}
}),false,'forged water ledger is rejected');
const alignedLegacyClimate=advanceTerrariumMicroclimate(
 createTerrariumMicroclimate({columns:2,rows:1}),{minutes:14});
const alignedSoil=advanceTerrariumSubstrateWater(
 createTerrariumSubstrateWater({zones:[{},{}]}),{minutes:14});
const adopted=createCoupledTerrariumEcology({
 microclimate:alignedLegacyClimate,substrate:alignedSoil
});
verify(adopted);
assert.equal(adopted.minute,14);
assert.equal(adopted.microclimate.cells[0].substrateMoisture,
 Number((alignedSoil.zones[0].root.waterUnits/
 alignedSoil.zones[0].root.capacityUnits).toFixed(7)));
assert.equal(alignedLegacyClimate.cells[0].substrateMoisture!==
 adopted.microclimate.cells[0].substrateMoisture,true);
console.log('PASS V0.2b coupled ecology: single soil-water owner, lockstep 60=27+33, immutable JSON, mass ledger, independent drinking bowl, snake sites, input rejection and legacy V0.1 safety');
