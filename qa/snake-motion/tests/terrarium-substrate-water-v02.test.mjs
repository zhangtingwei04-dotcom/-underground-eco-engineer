import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 TERRARIUM_SUBSTRATE_WATER_VERSION,SUBSTRATE_TEST_DEFAULT,
 createTerrariumSubstrateWater,isValidTerrariumSubstrateWater,
 advanceTerrariumSubstrateWater,applyTerrariumSubstrateWaterEvent,
 inspectTerrariumSubstrateWater,buildSubstrateToMicroclimateDraft
} from '../src/ohm-core/terrarium-substrate-water-v02.mjs';
import {createTerrariumMicroclimate} from '../src/ohm-core/terrarium-microclimate-v01.mjs';

const seed=createTerrariumSubstrateWater({zones:[
 {surfaceWaterUnits:100,rootWaterUnits:400},
 {surfaceWaterUnits:220,rootWaterUnits:950},
 {surfaceWaterUnits:500,rootWaterUnits:1500,drainageWaterUnits:150},
 {surfaceWaterUnits:300,rootWaterUnits:1750},
 {surfaceWaterUnits:740,rootWaterUnits:2400}
]});
const totals=s=>s.zones.map(z=>z.surface.waterUnits+
 z.root.waterUnits+z.drainage.waterUnits).reduce((a,b)=>a+b,0);
const balanced=s=>{
 assert.equal(isValidTerrariumSubstrateWater(s),true);
 assert.equal(s.ledger.initialUnits+s.ledger.addedUnits,
   totals(s)+s.ledger.evaporatedUnits+
   s.ledger.drainedUnits+s.ledger.overflowUnits);
};
assert.equal(TERRARIUM_SUBSTRATE_WATER_VERSION,'0.2');
assert.equal(SUBSTRATE_TEST_DEFAULT.meshOpen,true);
balanced(seed);
assert.equal(seed.zones[0].id,'zone_0');
assert.equal(Object.isFrozen(seed.zones[0].surface),true);
assert.equal(Object.isFrozen(seed.zones[0].rates),true);
assert.equal(seed.zones[0].surface.capacityUnits,1000);
const old=JSON.stringify(seed);
const hourly=advanceTerrariumSubstrateWater(seed,{minutes:60});
balanced(hourly);
assert.equal(JSON.stringify(seed),old,'new simulation cannot mutate history');
assert.equal(hourly.minute,60);
assert.equal(hourly.revision,60);
assert.ok(hourly.ledger.evaporatedUnits>0,'wet surface evaporates over time');
assert.ok(hourly.zones[4].root.waterUnits>hourly.zones[0].root.waterUnits,
 'wet slope and dry side retain distinct storage');
assert.ok(hourly.zones.some(z=>z.drainage.waterUnits>0),
 'mesh lets moisture reach drainage reservoir');
assert.deepEqual(hourly,advanceTerrariumSubstrateWater(seed,{minutes:60}));
assert.deepEqual(hourly,advanceTerrariumSubstrateWater(
 advanceTerrariumSubstrateWater(seed,{minutes:27}),{minutes:33}),
 'deterministic fixed ticks independent of browser rendering schedule');
const roundTrip=JSON.parse(JSON.stringify(hourly));
balanced(roundTrip);
assert.deepEqual(advanceTerrariumSubstrateWater(roundTrip,{minutes:10}),
 advanceTerrariumSubstrateWater(hourly,{minutes:10}));
const view=inspectTerrariumSubstrateWater(hourly);
assert.equal(view.zones.length,5);
assert.equal(view.totalUnits,totals(hourly));
assert.equal(Object.isFrozen(view.zones[0].layers[0]),true);
assert.equal(view.units,'abstract_integer_water_storage_units_not_ml');
assert.ok(view.zones[4].layers[1].saturation>
 view.zones[0].layers[1].saturation);
const climate=createTerrariumMicroclimate({columns:5,rows:1});
const draft=buildSubstrateToMicroclimateDraft(hourly,climate);
assert.equal(draft.changes.length,5);
assert.equal(draft.changes[4].cellId,'cell_4_0');
assert.equal(draft.changes[0].changes.substrateMoisture,
 Number((hourly.zones[0].root.waterUnits/hourly.zones[0].root.capacityUnits).toFixed(7)));
assert.equal(draft.policy,'read_only_proposal_do_not_double_update_v01_moisture');
assert.equal(climate.cells[0].substrateMoisture,.15,
 'read-only bridge cannot overwrite V0.1 moisture owner');
const add=applyTerrariumSubstrateWaterEvent(hourly,{
 zoneId:'zone_4',type:'mist',amountUnits:400
});
balanced(add);
assert.equal(add.minute,hourly.minute,'events do not advance world time');
assert.equal(add.revision,hourly.revision+1);
assert.equal(add.ledger.addedUnits,hourly.ledger.addedUnits+400);
assert.equal(add.zones[4].surface.waterUnits,
 Math.min(1000,hourly.zones[4].surface.waterUnits+400));
assert.equal(hourly.ledger.addedUnits,0,'event must not alter original');
const soaked=applyTerrariumSubstrateWaterEvent(add,{
 zoneId:'zone_4',type:'water',amountUnits:5000
});
balanced(soaked);
assert.ok(soaked.ledger.overflowUnits>0,'overfill is accounted as runoff');
assert.equal(soaked.zones[4].surface.waterUnits,1000);
const drained=applyTerrariumSubstrateWaterEvent(soaked,{
 zoneId:'zone_4',type:'drain',amountUnits:5000
});
balanced(drained);
assert.equal(drained.zones[4].drainage.waterUnits,0);
assert.equal(drained.ledger.drainedUnits,
 soaked.ledger.drainedUnits+soaked.zones[4].drainage.waterUnits);
const blocked=applyTerrariumSubstrateWaterEvent(seed,{
 zoneId:'zone_2',type:'mesh',open:false
});
balanced(blocked);
const noPercolation=createTerrariumSubstrateWater({zones:[{
 surfaceWaterUnits:0,rootWaterUnits:1900,drainageWaterUnits:0,
 infiltrationPermille:0,wickingPermille:0,evaporationPermille:0,
 lateralPermille:0,percolationPermille:400,meshOpen:false
}]});
const openPercolation=applyTerrariumSubstrateWaterEvent(noPercolation,{
 zoneId:'zone_0',type:'mesh',open:true
});
const blockedAfter=advanceTerrariumSubstrateWater(noPercolation,{minutes:20});
const openedAfter=advanceTerrariumSubstrateWater(openPercolation,{minutes:20});
balanced(blockedAfter);balanced(openedAfter);
assert.equal(blockedAfter.zones[0].drainage.waterUnits,0);
assert.ok(openedAfter.zones[0].drainage.waterUnits>1000);
assert.equal(openedAfter.ledger.drainedUnits,0,'closed outlet stores drainage water');
const openOutlet=applyTerrariumSubstrateWaterEvent(openedAfter,{
 zoneId:'zone_0',type:'outlet',open:true
});
const trickle=advanceTerrariumSubstrateWater(openOutlet,{minutes:25});
balanced(trickle);
assert.ok(trickle.ledger.drainedUnits>0);
assert.ok(trickle.zones[0].drainage.waterUnits<openOutlet.zones[0].drainage.waterUnits);
const lateral=createTerrariumSubstrateWater({zones:[
 {surfaceWaterUnits:0,rootWaterUnits:3200,drainageWaterUnits:0,
  infiltrationPermille:0,percolationPermille:0,wickingPermille:0,
  evaporationPermille:0,lateralPermille:500},
 {surfaceWaterUnits:0,rootWaterUnits:0,drainageWaterUnits:0,
  infiltrationPermille:0,percolationPermille:0,wickingPermille:0,
  evaporationPermille:0,lateralPermille:500}
]});
const migrated=advanceTerrariumSubstrateWater(lateral,{minutes:3});
balanced(migrated);
assert.ok(migrated.zones[1].root.waterUnits>0,
 'lateral dampness can spread to neighboring soil');
assert.ok(migrated.zones[0].root.waterUnits<3200);
assert.equal(migrated.ledger.evaporatedUnits,0);
assert.equal(totals(migrated),totals(lateral),
 'lateral flow conserves all game water units');
const simple=createTerrariumSubstrateWater({zones:[{
 surfaceWaterUnits:150,rootWaterUnits:320,drainageWaterUnits:0,
 infiltrationPermille:0,percolationPermille:0,wickingPermille:0,
 evaporationPermille:0,lateralPermille:0,outletPermille:0
}]});
const stable=advanceTerrariumSubstrateWater(simple,{minutes:100});
assert.deepEqual(stable.zones[0],simple.zones[0]);
balanced(stable);
for(const candidate of [
 ()=>createTerrariumSubstrateWater({zones:[]}),
 ()=>createTerrariumSubstrateWater({zones:Array.from({length:13},()=>({}))}),
 ()=>createTerrariumSubstrateWater({zones:[{surfaceCapacityUnits:0}]}),
 ()=>createTerrariumSubstrateWater({zones:[{rootWaterUnits:4000}]}),
 ()=>createTerrariumSubstrateWater({zones:[{rootWaterUnits:NaN}]}),
 ()=>createTerrariumSubstrateWater({zones:[{percolationPermille:1100}]}),
 ()=>createTerrariumSubstrateWater({zones:[{meshOpen:1}]}),
 ()=>createTerrariumSubstrateWater({zones:[{unsafe:true}]}),
 ()=>advanceTerrariumSubstrateWater(seed,{minutes:0}),
 ()=>advanceTerrariumSubstrateWater(seed,{minutes:241}),
 ()=>advanceTerrariumSubstrateWater(seed,{minutes:1.3}),
 ()=>advanceTerrariumSubstrateWater(seed,{minutes:Infinity}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'mist',zoneId:'unknown',amountUnits:40}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'mist',zoneId:'zone_0',amountUnits:-1}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'water',zoneId:'zone_0',amountUnits:5001}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'drain',zoneId:'zone_0',amountUnits:0}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'outlet',zoneId:'zone_0',open:'yes'}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'mesh',zoneId:'zone_0',open:false,amountUnits:2}),
 ()=>applyTerrariumSubstrateWaterEvent(seed,{type:'unknown',zoneId:'zone_0'}),
 ()=>buildSubstrateToMicroclimateDraft(seed,{}),
 ()=>buildSubstrateToMicroclimateDraft(seed,createTerrariumMicroclimate({columns:2})),
 ()=>inspectTerrariumSubstrateWater({...seed,revision:-1})
])assert.throws(candidate,RangeError);
assert.equal(isValidTerrariumSubstrateWater({
 ...seed,ledger:{...seed.ledger,addedUnits:100}
}),false,'forged water addition violates balance');
assert.equal(isValidTerrariumSubstrateWater({
 ...seed,zones:[...seed.zones.slice(0,4),{
  ...seed.zones[4],root:{...seed.zones[4].root,waterUnits:7000}
 }]
}),false,'over-capacity water is rejected');
assert.equal(isValidTerrariumSubstrateWater({
 ...seed,zones:seed.zones.map((z,i)=>i===0?{...z,id:'__proto__'}:z)
}),false);
assert.ok(!JSON.stringify(seed).includes('ml'),'water units are abstract');
const source=readFileSync(new URL('../src/ohm-core/terrarium-substrate-water-v02.mjs',import.meta.url),'utf8');
assert.doesNotMatch(source,/localStorage|sessionStorage|window\.|document\.|supabase|fetch\(|Date\.|setInterval/i);
console.log('PASS V0.2 layered substrate: per-layer mass ledger, 60-minute split-time, evaporation, mesh blockade, refill/overflow, root seepage, drainage, and read-only microclimate bridge');
