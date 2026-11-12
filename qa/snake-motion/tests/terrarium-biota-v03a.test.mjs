import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createTerrariumBiotaV03,advanceTerrariumBiotaV03,
  isValidTerrariumBiotaV03,applyTerrariumBiotaV03Event,
  inspectTerrariumBiotaV03,buildTerrariumBiotaV03ActionSnapshot,
  TERRARIUM_BIOTA_V03_VERSION
} from '../src/ohm-core/terrarium-biota-v03a.mjs';
import {createCoupledTerrariumEcology}
  from '../src/ohm-core/terrarium-ecology-coupled-v02b.mjs';

const makeOptions=()=>({
 environmentOptions:{
  microclimateOptions:{
   columns:5,rows:1,ambient:{temperatureC:24,relativeHumidity:.48},
   cellOverrides:[
    {x:0,y:0,heater:1,waterLevel:0},
    {x:1,y:0,cooler:.5,shade:.55},
    {x:2,y:0,waterLevel:.85},
    {x:3,y:0,shade:.7},
    {x:4,y:0,shade:.8}
   ],
   sites:[{id:'water',cellIndex:2,kind:'water',safe:true,
    reachable:true,distanceCost:.2,flags:{waterReachable:true}}]
  },
  substrateOptions:{zones:[
   {surfaceWaterUnits:40,rootWaterUnits:150,drainageWaterUnits:0},
   {surfaceWaterUnits:190,rootWaterUnits:1200,drainageWaterUnits:0},
   {surfaceWaterUnits:470,rootWaterUnits:1850,drainageWaterUnits:0},
   {surfaceWaterUnits:610,rootWaterUnits:2300,drainageWaterUnits:0,
    percolationPermille:0,lateralPermille:0},
   {surfaceWaterUnits:820,rootWaterUnits:1800,drainageWaterUnits:0,
    percolationPermille:0,lateralPermille:0}
  ]}
 },
 zoneConfigs:[
  {plantKind:'moss',plantCoverUnits:200,lightUnits:700,
   litterUnits:2500,fragmentedUnits:250, fungiIndex:740},
  {plantKind:'fern',plantCoverUnits:100,lightUnits:500,
   litterUnits:700,fragmentedUnits:200, fungiIndex:350},
  {plantKind:'none',plantCoverUnits:0,lightUnits:300,
   litterUnits:1000,fragmentedUnits:300},
  {plantKind:'moss',plantCoverUnits:250,lightUnits:600,
   litterUnits:2500,fragmentedUnits:500, fungiIndex:900},
  {plantKind:'fern',plantCoverUnits:350,lightUnits:850,
   litterUnits:1800,fragmentedUnits:450, fungiIndex:850}
 ]
});
const options=makeOptions();
const initial=createTerrariumBiotaV03(options);
const organic=s=>s.zones.reduce((n,z)=>n+
 z.litterUnits+z.fragmentedUnits+z.mineralUnits,0);
const verify=s=>{
 assert.equal(isValidTerrariumBiotaV03(s),true);
 assert.equal(s.environment.minute,s.minute);
 assert.equal(s.environment.microclimate.minute,s.minute);
 assert.equal(s.environment.substrate.minute,s.minute);
 assert.equal(s.ledger.initialUnits+s.ledger.addedUnits,organic(s));
 const water=s.environment.substrate;
 const l=water.ledger;
 const stored=water.zones.reduce((n,z)=>n+z.surface.waterUnits+
  z.root.waterUnits+z.drainage.waterUnits,0);
 assert.equal(l.initialUnits+l.addedUnits,
  stored+l.evaporatedUnits+l.drainedUnits+l.overflowUnits);
};
assert.equal(TERRARIUM_BIOTA_V03_VERSION,'0.3a');
verify(initial);
assert.equal(initial.minute,0);
assert.equal(initial.revision,0);
assert.equal(Object.isFrozen(initial.zones[0].plant),true);
assert.equal(initial.zones[0].decomposers.fungiIndex,740);
assert.equal(initial.zones[2].plant.kind,'none');
const before=JSON.stringify(initial);
const hourly=advanceTerrariumBiotaV03(initial,{minutes:60});
verify(hourly);
assert.equal(JSON.stringify(initial),before,'pure update must not mutate source');
assert.equal(hourly.minute,60);
assert.equal(hourly.revision,60);
assert.equal(hourly.zones[2].plant.coverUnits,0,
 'no plant must not magically grow from bare soil');
assert.ok(hourly.zones[4].plant.coverUnits>
 initial.zones[4].plant.coverUnits,
 'favourable fern engineering conditions allow visual growth: '+JSON.stringify({
  before:initial.zones[4].plant,after:hourly.zones[4].plant,
  climate:hourly.environment.microclimate.cells[4],
  substrate:hourly.environment.substrate.zones[4]
 }));
assert.ok(hourly.zones[0].plant.coverUnits<=
 initial.zones[0].plant.coverUnits+2,
 'dry/hot zone cannot suddenly explode with plant coverage');
assert.ok(hourly.zones[3].litterUnits<initial.zones[3].litterUnits,
 'wet decomposer group moves input litter into next pool');
assert.ok(hourly.zones[3].fragmentedUnits+
 hourly.zones[3].mineralUnits>
 initial.zones[3].fragmentedUnits+initial.zones[3].mineralUnits,
 'organic material must not disappear');
assert.deepEqual(hourly,advanceTerrariumBiotaV03(initial,{minutes:60}),
 'same input/time must be deterministic');
assert.deepEqual(hourly,advanceTerrariumBiotaV03(
 advanceTerrariumBiotaV03(initial,{minutes:27}),{minutes:33}),
 '27+33 must equal full 60 minutes including biota update');
const fourHours=advanceTerrariumBiotaV03(initial,{minutes:240});
verify(fourHours);
assert.deepEqual(fourHours,advanceTerrariumBiotaV03(
 advanceTerrariumBiotaV03(initial,{minutes:120}),{minutes:120}));
assert.ok(fourHours.zones[3].mineralUnits>=hourly.zones[3].mineralUnits);
const restored=JSON.parse(JSON.stringify(hourly));
verify(restored);
assert.deepEqual(advanceTerrariumBiotaV03(restored,{minutes:10}),
 advanceTerrariumBiotaV03(hourly,{minutes:10}),
 'engine snapshot must survive JSON clone');
const summary=inspectTerrariumBiotaV03(hourly);
assert.equal(summary.minute,60);
assert.equal(summary.organicLedger.currentUnits,organic(hourly));
assert.equal(summary.zones.length,5);
assert.equal(summary.zones[2].plantActivity,'no_patch');
assert.equal(summary.organicUnits,
 'abstract_conserved_pool_units_not_real_carbon_or_nutrients');
assert.equal(Object.isFrozen(summary.zones[0].signals),true);
assert.equal(Object.isFrozen(summary.environment),true);
const snapshot=buildTerrariumBiotaV03ActionSnapshot(hourly);
assert.equal(snapshot.sites[0].id,'water');
assert.equal(snapshot.sites[0].conditions.hasWater,true);
// Explicit organic input is the ONLY way the organic matter grows.
const leaves=applyTerrariumBiotaV03Event(hourly,{
 channel:'biota',type:'leaf_litter',zoneId:'zone_3',amountUnits:500
});
verify(leaves);
assert.equal(leaves.minute,60);
assert.equal(leaves.zones[3].litterUnits,hourly.zones[3].litterUnits+500);
assert.equal(leaves.ledger.addedUnits,500);
assert.deepEqual(leaves.environment,hourly.environment,
 'adding leaves cannot invent or remove water');
const fromLeaf=advanceTerrariumBiotaV03(leaves,{minutes:120});
verify(fromLeaf);
assert.ok(fromLeaf.zones[3].litterUnits<leaves.zones[3].litterUnits,
 'litter is gradually processed while remaining accounted');
const dryLight=applyTerrariumBiotaV03Event(initial,{
 channel:'biota',type:'light',zoneId:'zone_4',lightUnits:0
});
verify(dryLight);
const dark=advanceTerrariumBiotaV03(dryLight,{minutes:180});
verify(dark);
assert.equal(dark.zones[4].plant.coverUnits,initial.zones[4].plant.coverUnits,
 'ordinary fern cannot gain plant cover when light is absent');
assert.ok(dark.zones[4].plant.conditionUnits<
 initial.zones[4].plant.conditionUnits);
assert.equal(inspectTerrariumBiotaV03(dark).zones[4].plantActivity,
 'light_limited_candidate');
const lightBack=applyTerrariumBiotaV03Event(dark,{
 channel:'biota',type:'light',zoneId:'zone_4',lightUnits:850
});
const recovered=advanceTerrariumBiotaV03(lightBack,{minutes:120});
verify(recovered);
assert.ok(recovered.zones[4].plant.coverUnits>
 lightBack.zones[4].plant.coverUnits,
 'restored light can return a visual growth candidate');
const moss=applyTerrariumBiotaV03Event(initial,{
 channel:'biota',type:'plant_patch',zoneId:'zone_2',
 plantKind:'moss',coverUnits:125
});
verify(moss);
assert.equal(moss.zones[2].plant.kind,'moss');
const cleared=applyTerrariumBiotaV03Event(moss,{
 channel:'biota',type:'plant_patch',zoneId:'zone_2',
 plantKind:'none',coverUnits:0
});
verify(cleared);
assert.equal(cleared.zones[2].plant.coverUnits,0);
assert.deepEqual(cleared.environment,initial.environment);
const inoculated=applyTerrariumBiotaV03Event(initial,{
 channel:'biota',type:'decomposer_index',
 zoneId:'zone_3',group:'springtails',indexUnits:920
});
verify(inoculated);
assert.equal(inoculated.zones[3].decomposers.springtailIndex,920);
assert.equal(inoculated.zones[3].litterUnits,2500);
const lowFungi=applyTerrariumBiotaV03Event(initial,{
 channel:'biota',type:'decomposer_index',
 zoneId:'zone_3',group:'fungi',indexUnits:0
});
verify(lowFungi);
assert.equal(lowFungi.zones[3].decomposers.fungiIndex,0);
// Environment remains solely V0.2b's water clock and ledger.
const refillBowl=applyTerrariumBiotaV03Event(initial,{
 channel:'environment',event:{channel:'microclimate',
  cellId:'cell_2_0',changes:{waterLevel:0}}
});
verify(refillBowl);
assert.equal(buildTerrariumBiotaV03ActionSnapshot(refillBowl)
 .sites[0].conditions.hasWater,false);
assert.deepEqual(refillBowl.zones,initial.zones);
assert.equal(refillBowl.ledger.addedUnits,0);
const mist=applyTerrariumBiotaV03Event(initial,{
 channel:'environment',event:{channel:'substrate',
  event:{type:'mist',zoneId:'zone_3',amountUnits:800}}
});
verify(mist);
assert.ok(mist.environment.substrate.ledger.addedUnits>0);
assert.equal(mist.ledger.addedUnits,0,
 'soil water and organic litter are separate ledgers');
assert.deepEqual(mist.zones,initial.zones);
const flowed=advanceTerrariumBiotaV03(mist,{minutes:60});
verify(flowed);
const noOrganic=createTerrariumBiotaV03({
 environmentOptions:{microclimateOptions:{columns:1,rows:1},
  substrateOptions:{zones:[{}]}},
 zoneConfigs:[{}]
});
verify(noOrganic);
const emptyFuture=advanceTerrariumBiotaV03(noOrganic,{minutes:240});
verify(emptyFuture);
assert.equal(emptyFuture.zones[0].litterUnits,0);
assert.equal(emptyFuture.zones[0].fragmentedUnits,0);
assert.equal(emptyFuture.zones[0].mineralUnits,0,
 'decomposers must not create organic matter without input');
const noLightAndNoSubstrate=createTerrariumBiotaV03({
 environmentOptions:{microclimateOptions:{columns:1,rows:1,
  ambient:{temperatureC:23,relativeHumidity:0}},
  substrateOptions:{zones:[{surfaceWaterUnits:0,rootWaterUnits:0,
   drainageWaterUnits:0}]}},
 zoneConfigs:[{plantKind:'moss',plantCoverUnits:150,
  lightUnits:0,litterUnits:250}]
});
const stressed=advanceTerrariumBiotaV03(noLightAndNoSubstrate,{
 minutes:240
});
verify(stressed);
assert.equal(stressed.zones[0].plant.coverUnits,150,
 'no immediate artificial death because of dryness');
assert.equal(stressed.zones[0].plant.conditionUnits,742);
const unchangedLitter=stressed.zones[0].litterUnits;
assert.equal(unchangedLitter,250,'dry habitat pauses simplified decay');
for(const invalid of [
 ()=>createTerrariumBiotaV03({zoneConfigs:[]}),
 ()=>createTerrariumBiotaV03({zoneConfigs:[{plantKind:'snake'}]}),
 ()=>createTerrariumBiotaV03({zoneConfigs:Array(5).fill({plantKind:'none',
  plantCoverUnits:2})}),
 ()=>createTerrariumBiotaV03({environmentOptions:{bad:true}}),
 ()=>createTerrariumBiotaV03({environment:{}}),
 ()=>advanceTerrariumBiotaV03(initial,{minutes:0}),
 ()=>advanceTerrariumBiotaV03(initial,{minutes:241}),
 ()=>advanceTerrariumBiotaV03(initial,{minutes:1.5}),
 ()=>advanceTerrariumBiotaV03(initial,{minutes:NaN}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_99',type:'leaf_litter',amountUnits:1}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'leaf_litter',amountUnits:-1}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'leaf_litter',amountUnits:5001}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'light',lightUnits:1100}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'plant_patch',plantKind:'none',coverUnits:2}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'decomposer_index',
  group:'vertebrates',indexUnits:2}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'biota',
  zoneId:'zone_3',type:'decomposer_index',
  group:'fungi',indexUnits:1001}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'environment',
  event:{channel:'microclimate',cellId:'cell_0_0',
   changes:{substrateMoisture:.9}}}),
 ()=>applyTerrariumBiotaV03Event(initial,{channel:'wrong'}),
 ()=>inspectTerrariumBiotaV03({}),
 ()=>buildTerrariumBiotaV03ActionSnapshot({})
])assert.throws(invalid,RangeError);
assert.equal(isValidTerrariumBiotaV03({...initial,minute:3}),false);
assert.equal(isValidTerrariumBiotaV03({...initial,
 ledger:{...initial.ledger,addedUnits:1234}}),false,
 'forged organic ledger is invalid');
assert.equal(isValidTerrariumBiotaV03({...initial,
 zones:initial.zones.map((z,i)=>i===0?{
  ...z,fragmentedUnits:z.fragmentedUnits+1
 }:z)}),false);
const code=readFileSync(new URL(
 '../src/ohm-core/terrarium-biota-v03a.mjs',import.meta.url),'utf8');
assert.doesNotMatch(code,/localStorage|sessionStorage|indexedDB|supabase|fetch\(|Date\.|window\.|document\.|XMLHttpRequest|setInterval/i,
 'biota state may not touch browsers, remote services or player storage');
console.log('PASS V0.3a biota: single clock, moss/fern light and water candidate responses, dry dormancy, conserved organic pools, fungi/fauna group indices, source-bound inputs and JSON/safe events');
