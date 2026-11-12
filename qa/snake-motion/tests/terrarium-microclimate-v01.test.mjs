import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  TERRARIUM_MICROCLIMATE_VERSION,
  createTerrariumMicroclimate,isValidTerrariumMicroclimate,
  advanceTerrariumMicroclimate,changeTerrariumMicroclimateControls,
  inspectTerrariumMicroclimate,buildTerrariumMicroclimateActionSnapshot
} from '../src/ohm-core/terrarium-microclimate-v01.mjs';
import {buildSnakeActionInputFromEcology}
  from '../src/ohm-core/snake-ecology-action-adapter.mjs';
import {chooseSnakeActivityPoint}
  from '../src/ohm-core/snake-activity-points.mjs';

const base={
 columns:5,rows:1,ambient:{temperatureC:24,relativeHumidity:.48},
 cellOverrides:[
  {x:0,y:0,heater:1,substrateMoisture:.08},
  {x:1,y:0,cooler:.6,shade:.7},
  {x:2,y:0,waterLevel:.9,substrateMoisture:.4},
  {x:3,y:0,shade:.9,substrateRetention:.8,substrateMoisture:.5},
  {x:4,y:0,shade:.45,substrateRetention:.85,substrateMoisture:.85}
 ],
 sites:[
  {id:'warm01',cellIndex:0,kind:'warm_area',safe:true,reachable:true,
    distanceCost:.4,flags:{thermalService:true}},
  {id:'cool01',cellIndex:1,kind:'cool_area',safe:true,reachable:true,
    distanceCost:.3,flags:{thermalService:true}},
  {id:'bowl01',cellIndex:2,kind:'water',safe:true,reachable:true,
    distanceCost:.2,flags:{waterReachable:true}},
  {id:'hide01',cellIndex:3,kind:'hide',safe:true,reachable:true,
    distanceCost:.1,flags:{hasCover:true}},
  {id:'soil01',cellIndex:4,kind:'loose_substrate',safe:true,reachable:true,
    distanceCost:.25,flags:{diggable:true}}
 ]
};
const c=id=>base.sites.find(s=>s.id===id);
assert.equal(TERRARIUM_MICROCLIMATE_VERSION,'0.1');
const s0=createTerrariumMicroclimate(base);
assert.equal(isValidTerrariumMicroclimate(s0),true);
assert.equal(s0.revision,0);
assert.equal(s0.minute,0);
assert.equal(s0.cells.length,5);
assert.equal(s0.cells[0].temperatureC,24);
assert.ok(Object.isFrozen(s0)&&Object.isFrozen(s0.cells[0])&&
  Object.isFrozen(s0.sites[0].flags));
const original=JSON.stringify(s0);
const s60=advanceTerrariumMicroclimate(s0,{minutes:60});
assert.equal(s60.minute,60);
assert.equal(s60.revision,60);
assert.ok(s60.cells[0].temperatureC>s60.cells[2].temperatureC,
  'active heater must create a local warmer zone');
assert.ok(s60.cells[1].temperatureC<s60.cells[2].temperatureC,
  'cooler and cover have separate local effects');
assert.ok(s60.cells[2].relativeHumidity>s60.cells[0].relativeHumidity,
  'water bowl creates a higher local game humidity indicator');
assert.ok(s60.cells[4].substrateMoisture>s60.cells[0].substrateMoisture,
  'moist/retentive soil remains distinct from dry warm zone');
assert.ok(s60.cells[2].waterLevel<.9,'water reservoir changes with time');
assert.equal(JSON.stringify(s0),original,'pure simulation cannot mutate original');
assert.deepEqual(s60,advanceTerrariumMicroclimate(s0,{minutes:60}),
  'same initial state and minutes produce same output');
const split=advanceTerrariumMicroclimate(
 advanceTerrariumMicroclimate(s0,{minutes:27}),{minutes:33});
assert.deepEqual(split,s60,'time steps independent of frame scheduling');
const refresh=JSON.parse(JSON.stringify(s60));
assert.equal(isValidTerrariumMicroclimate(refresh),true);
assert.deepEqual(advanceTerrariumMicroclimate(refresh,{minutes:2}),
 advanceTerrariumMicroclimate(s60,{minutes:2}),'JSON roundtrip stable');
const view=inspectTerrariumMicroclimate(s60);
assert.equal(view.minute,60);
assert.equal(view.cells[0].temperatureC,s60.cells[0].temperatureC);
assert.equal(Object.isFrozen(view),true);
assert.equal(Object.isFrozen(view.cells[0]),true);
assert.ok(!Object.hasOwn(view.cells[0],'heater'),
  'read-only summary does not reveal raw control values');
const siteSnapshot=buildTerrariumMicroclimateActionSnapshot(s60);
assert.equal(siteSnapshot.revision,s60.revision);
assert.equal(siteSnapshot.sites.length,5);
assert.equal(siteSnapshot.sites.find(x=>x.id==='bowl01').conditions.hasWater,true);
assert.equal(siteSnapshot.sites.find(x=>x.id==='warm01').conditions.thermalService,true);
assert.equal(siteSnapshot.sites.every(x=>x.conditions.microclimate==='unknown'),true,
 'raw relative humidity cannot automatically diagnose animal health');
const adapted=buildSnakeActionInputFromEcology({
 snapshot:siteSnapshot,speciesId:'corn_snake',thermalSignal:'neutral'
});
assert.equal(adapted.points.length,5);
assert.ok(adapted.points.every(x=>x.safe&&x.reachable));
const hydration=chooseSnakeActivityPoint({...adapted,needs:{hydration:1}});
assert.equal(hydration.targetId,'bowl01','hydration priority uses water site');
const turnedOff=changeTerrariumMicroclimateControls(s60,{
 cellId:'cell_0_0',changes:{heater:0}
});
assert.equal(turnedOff.minute,60,'controls events do not advance world clock');
assert.equal(turnedOff.revision,61);
assert.equal(turnedOff.cells[0].heater,0);
assert.equal(s60.cells[0].heater,1,'event must not mutate prior state');
const offAction=buildSnakeActionInputFromEcology({
 snapshot:buildTerrariumMicroclimateActionSnapshot(turnedOff),
 speciesId:'corn_snake',thermalSignal:'seek_warm'
});
assert.equal(offAction.points.find(x=>x.id==='warm01').reachable,false);
assert.equal(chooseSnakeActivityPoint(offAction).unmetNeeds[0],
 'no_safe_accessible_warm_area');
const cooled=advanceTerrariumMicroclimate(turnedOff,{minutes:70});
assert.ok(cooled.cells[0].temperatureC<turnedOff.cells[0].temperatureC,
 'heater off allows warm side to cool');
const dryBowl=changeTerrariumMicroclimateControls(s60,{
 cellId:'cell_2_0',changes:{waterLevel:0}
});
const drySnapshot=buildTerrariumMicroclimateActionSnapshot(dryBowl);
assert.equal(drySnapshot.sites.find(x=>x.id==='bowl01').conditions.hasWater,false);
const dryAction=buildSnakeActionInputFromEcology({
 snapshot:drySnapshot,speciesId:'corn_snake',needs:{hydration:1}
});
assert.equal(dryAction.points.find(x=>x.id==='bowl01').reachable,false);
assert.equal(chooseSnakeActivityPoint(dryAction).unmetNeeds[0],
 'no_safe_accessible_water');
const restored=changeTerrariumMicroclimateControls(dryBowl,{
 cellId:'cell_2_0',changes:{waterLevel:.85}
});
assert.equal(buildTerrariumMicroclimateActionSnapshot(restored)
 .sites.find(x=>x.id==='bowl01').conditions.hasWater,true);
const unsafe={...base,sites:base.sites.map(x=>x.id==='hide01'
  ?{...x,safe:false,flags:{...x.flags,qualityFlag:true}}
  :x)};
const flagged=buildTerrariumMicroclimateActionSnapshot(
 createTerrariumMicroclimate(unsafe));
assert.equal(flagged.sites.find(x=>x.id==='hide01').safe,false);
const dryClassified={...base,sites:base.sites.map(x=>x.id==='soil01'
  ?{...x,microclimateClass:'too_damp'}:x)};
const microClass=buildTerrariumMicroclimateActionSnapshot(
 createTerrariumMicroclimate(dryClassified));
assert.equal(microClass.sites.find(x=>x.id==='soil01').conditions.microclimate,
 'too_damp');
assert.equal(microClass.sites.find(x=>x.id==='soil01').safe,true,
 'a microclimate label alone must not diagnose or flag danger');
const noCover={...base,sites:[{...c('hide01'),flags:{hasCover:false}}]};
assert.equal(buildSnakeActionInputFromEcology({
 snapshot:buildTerrariumMicroclimateActionSnapshot(
  createTerrariumMicroclimate(noCover))
}).points[0].reachable,false);
const zeroWater=createTerrariumMicroclimate({
 columns:1,rows:1,sites:[
  {id:'water_only',cellIndex:0,kind:'water',safe:false,
   reachable:true,distanceCost:0,flags:{waterReachable:true}}
 ]
});
assert.equal(buildTerrariumMicroclimateActionSnapshot(zeroWater)
 .sites[0].safe,false);
assert.equal(buildTerrariumMicroclimateActionSnapshot(zeroWater)
 .sites[0].conditions.hasWater,false);
assert.equal(createTerrariumMicroclimate({columns:1,rows:1})
 .sites.length,0,'no invented snake habitat');
for(const a of [
 ()=>createTerrariumMicroclimate({columns:13}),
 ()=>createTerrariumMicroclimate({rows:0}),
 ()=>createTerrariumMicroclimate({ambient:{temperatureC:24,relativeHumidity:50}}),
 ()=>createTerrariumMicroclimate({cellOverrides:[{x:0,y:0,heater:2}]}),
 ()=>createTerrariumMicroclimate({cellOverrides:[
    {x:0,y:0,heater:1},{x:0,y:0,shade:.2}]}),
 ()=>createTerrariumMicroclimate({cellOverrides:[{x:0,y:0,temp:100}]}),
 ()=>createTerrariumMicroclimate({...base,sites:[base.sites[0],base.sites[0]]}),
 ()=>createTerrariumMicroclimate({...base,sites:[{...c('warm01'),safe:undefined}]}),
 ()=>createTerrariumMicroclimate({...base,sites:[{...c('warm01'),flags:{qualityFlag:1}}]}),
 ()=>createTerrariumMicroclimate({...base,sites:[{...c('warm01'),cellIndex:500}]}),
 ()=>createTerrariumMicroclimate({...base,sites:[{...c('warm01'),microclimateClass:'sick'}]}),
 ()=>advanceTerrariumMicroclimate(s0,{minutes:0}),
 ()=>advanceTerrariumMicroclimate(s0,{minutes:241}),
 ()=>advanceTerrariumMicroclimate(s0,{minutes:.5}),
 ()=>advanceTerrariumMicroclimate(s0,{minutes:NaN}),
 ()=>changeTerrariumMicroclimateControls(s0,{cellId:'missing',changes:{heater:1}}),
 ()=>changeTerrariumMicroclimateControls(s0,{cellId:'cell_1_0',changes:{heater:-1}}),
 ()=>changeTerrariumMicroclimateControls(s0,{cellId:'cell_1_0',changes:{safe:true}}),
 ()=>changeTerrariumMicroclimateControls(s0,{cellId:'cell_1_0',changes:{}}),
 ()=>buildTerrariumMicroclimateActionSnapshot({}),
])assert.throws(a,RangeError);
assert.equal(isValidTerrariumMicroclimate({...s0,cells:[]}),false);
assert.equal(isValidTerrariumMicroclimate({...s0,revision:-3}),false);
assert.equal(isValidTerrariumMicroclimate({...s0,
 cells:s0.cells.map((c,i)=>i===1?{...c,relativeHumidity:1.3}:c)}),false);
const source=readFileSync(
 new URL('../src/ohm-core/terrarium-microclimate-v01.mjs',import.meta.url),'utf8');
assert.doesNotMatch(source,/Date\.|localStorage|sessionStorage|window\.|document\.|supabase|fetch\(/i,
 'ecology core may not access browser, saves, or services');
console.log('PASS terrarium microclimate V0.1: thermal/water/moisture gradients, 60 ticks, split-time equivalence, ecology action-point bridge, safety/provenance guards and pure saves');
