import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  TERRARIUM_SCENE_OCCLUSION_V03C_VERSION,
  createTerrariumSceneOcclusionV03c,
  isValidTerrariumSceneOcclusionV03c,
  advanceTerrariumSceneOcclusionV03c,
  applyTerrariumSceneOcclusionV03cEvent,
  inspectTerrariumSceneOcclusionV03c,
  buildTerrariumSceneOcclusionV03cActionSnapshot
} from '../src/ohm-core/terrarium-scene-occlusion-v03c.mjs';
import {
 createTerrariumEcologyLightV03b,
 isValidTerrariumEcologyLightV03b
} from '../src/ohm-core/terrarium-ecology-light-v03b.mjs';

const baseOptions={
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{
    columns:3,rows:1,ambient:{temperatureC:24,relativeHumidity:.52},
    sites:[{id:'bowl',kind:'water',cellIndex:0,safe:true,
      reachable:true,distanceCost:.3,flags:{waterReachable:true}}],
    cellOverrides:[{x:0,y:0,waterLevel:.9}]
   },
   substrateOptions:{zones:Array.from({length:3},()=>({
    surfaceWaterUnits:550,rootWaterUnits:1600,
    percolationPermille:0,lateralPermille:0
   }))}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:120,litterUnits:1000},
   {plantKind:'fern',plantCoverUnits:200,litterUnits:1200},
   {plantKind:'moss',plantCoverUnits:140,litterUnits:1300}
  ]
 },
 fixtures:[{id:'led',type:'artificial_led',zoneIndex:1,
  strengthUnits:850,spreadZones:1,heightUnits:0,
  startMinute:0,durationMinutes:1440}]
};
const shadow={id:'roof',kind:'rock_overhang',startZone:1,endZone:1,
 coveragePermille:1000,transmissionPermille:0};
const partial={id:'canopy',kind:'canopy',startZone:1,endZone:2,
 coveragePermille:500,transmissionPermille:0};
const second={id:'screen',kind:'screen',startZone:1,endZone:1,
 coveragePermille:500,transmissionPermille:0};
function waterLedger(s){
 return s.base.biota.environment.substrate.ledger;
}
function organicLedger(s){return s.base.biota.ledger;}
function verify(s){
 assert.equal(isValidTerrariumSceneOcclusionV03c(s),true);
 assert.equal(isValidTerrariumEcologyLightV03b(s.base),true);
 assert.equal(s.minute,s.base.minute);
 assert.equal(s.minute,s.base.biota.environment.minute);
 assert.equal(s.minute,s.base.biota.environment.substrate.minute);
 const w=s.base.biota.environment.substrate;
 const stored=w.zones.reduce((sum,z)=>sum+z.surface.waterUnits+
  z.root.waterUnits+z.drainage.waterUnits,0);
 const lw=waterLedger(s);
 assert.equal(lw.initialUnits+lw.addedUnits,
  stored+lw.evaporatedUnits+lw.drainedUnits+lw.overflowUnits);
 const lo=organicLedger(s);
 assert.equal(lo.initialUnits+lo.addedUnits,
  s.base.biota.zones.reduce((sum,z)=>sum+
   z.litterUnits+z.fragmentedUnits+z.mineralUnits,0));
}
assert.equal(TERRARIUM_SCENE_OCCLUSION_V03C_VERSION,'0.3c');
const unshaded=createTerrariumSceneOcclusionV03c({baseOptions});
verify(unshaded);
const plain=createTerrariumEcologyLightV03b(baseOptions);
assert.deepEqual(unshaded.base,plain,
 'without occluders V0.3c must preserve exact V0.3b defaults');
assert.deepEqual(unshaded.base.transmissionByZone,[1000,1000,1000]);
const plainLight=unshaded.base.biota.zones.map(z=>z.plant.lightUnits);
assert.deepEqual(plainLight,[425,850,425]);
const initialSnapshot=JSON.stringify(unshaded);
const covered=createTerrariumSceneOcclusionV03c({
 baseOptions,occluders:[shadow]
});
verify(covered);
assert.deepEqual(covered.base.transmissionByZone,[1000,0,1000]);
assert.deepEqual(covered.base.biota.zones.map(z=>z.plant.lightUnits),
 [425,0,425],'overhang kills only the local plant light, not distant zones');
assert.equal(JSON.stringify(unshaded),initialSnapshot);
assert.deepEqual(waterLedger(covered),waterLedger(unshaded),
 'adding a shade cannot alter water mass');
assert.deepEqual(organicLedger(covered),organicLedger(unshaded),
 'adding shade cannot invent organic matter');
assert.deepEqual(covered.base.biota.zones.map(z=>z.plant.coverUnits),
 unshaded.base.biota.zones.map(z=>z.plant.coverUnits),
 'shadow placement does not instantly create/deplete plant biomass');
const litHour=advanceTerrariumSceneOcclusionV03c(unshaded,{minutes:60});
const darkHour=advanceTerrariumSceneOcclusionV03c(covered,{minutes:60});
verify(litHour);verify(darkHour);
assert.ok(litHour.base.biota.zones[1].plant.coverUnits>
 unshaded.base.biota.zones[1].plant.coverUnits);
assert.equal(darkHour.base.biota.zones[1].plant.coverUnits,
 covered.base.biota.zones[1].plant.coverUnits,
 'fully shaded fern has no growth in V0.3a hourly candidate');
assert.deepEqual(darkHour,advanceTerrariumSceneOcclusionV03c(
  advanceTerrariumSceneOcclusionV03c(covered,{minutes:27}),
  {minutes:33}),'minute split 27+33 equals one 60-minute call');
assert.deepEqual(darkHour,advanceTerrariumSceneOcclusionV03c(
 covered,{minutes:60}),'same input yields deterministic result');
const view=inspectTerrariumSceneOcclusionV03c(covered);
assert.deepEqual(view.unshadedLightUnitsByZone,[425,850,425]);
assert.deepEqual(view.actualLightUnitsByZone,[425,0,425]);
assert.deepEqual(view.transmissionByZone,[1000,0,1000]);
assert.equal(view.sceneModel,'one_dimensional_zone_transmission_game_proxy');
assert.equal(view.occluders[0].kind,'rock_overhang');
assert.equal(view.evidence,'artificial_engineering_mask_not_raycasting_or_measured_PPFD');
assert.equal(Object.isFrozen(view.occluders),true);
assert.equal(Object.isFrozen(view.occluders[0]),true);
assert.equal(buildTerrariumSceneOcclusionV03cActionSnapshot(covered).sites[0].id,'bowl');
const cleared=applyTerrariumSceneOcclusionV03cEvent(darkHour,{
 channel:'occluder',type:'remove',id:'roof'
});
verify(cleared);
assert.equal(cleared.base.biota.zones[1].plant.lightUnits,850);
assert.deepEqual(cleared.occluders,[]);
assert.equal(cleared.minute,darkHour.minute);
assert.deepEqual(waterLedger(cleared),waterLedger(darkHour));
const recovered=advanceTerrariumSceneOcclusionV03c(cleared,{minutes:60});
verify(recovered);
assert.ok(recovered.base.biota.zones[1].plant.coverUnits>
 cleared.base.biota.zones[1].plant.coverUnits,
 'removing shade restores normal plant-growth candidate');
const shadeOne=applyTerrariumSceneOcclusionV03cEvent(unshaded,{
 channel:'occluder',type:'upsert',occluder:partial
});
verify(shadeOne);
assert.deepEqual(shadeOne.base.transmissionByZone,[1000,500,500]);
assert.deepEqual(shadeOne.base.biota.zones.map(z=>z.plant.lightUnits),
 [425,425,212]);
const shadeTwo=applyTerrariumSceneOcclusionV03cEvent(shadeOne,{
 channel:'occluder',type:'upsert',occluder:second
});
verify(shadeTwo);
assert.deepEqual(shadeTwo.base.transmissionByZone,[1000,250,500]);
assert.deepEqual(shadeTwo.base.biota.zones.map(z=>z.plant.lightUnits),
 [425,212,212]);
const changeSecond=applyTerrariumSceneOcclusionV03cEvent(shadeTwo,{
 channel:'occluder',type:'upsert',occluder:{...second,coveragePermille:1000}
});
verify(changeSecond);
assert.deepEqual(changeSecond.base.transmissionByZone,[1000,0,500]);
assert.equal(changeSecond.occluders.length,2,
 'upsert preserves unique scene object id');
const newLed=applyTerrariumSceneOcclusionV03cEvent(covered,{
 channel:'base',event:{channel:'fixture',type:'upsert',fixture:{
 id:'led2',type:'artificial_led',zoneIndex:1,strengthUnits:1000,
 spreadZones:0,heightUnits:0,startMinute:0,durationMinutes:1440}}
});
verify(newLed);
assert.equal(newLed.base.biota.zones[1].plant.lightUnits,0,
 'a new light cannot bypass an opaque rock overhang');
const leaf=applyTerrariumSceneOcclusionV03cEvent(covered,{
 channel:'base',event:{channel:'organic',type:'litter_input',
 eventId:'leaf_003',minute:0,zoneId:'zone_1',amountUnits:400,
 source:{kind:'player_placement',referenceId:'action_003'}}
});
verify(leaf);
assert.equal(leaf.base.receipts[0].classification,
 'in_game_event_not_observation');
assert.equal(organicLedger(leaf).addedUnits,400);
assert.deepEqual(waterLedger(leaf),waterLedger(covered));
const wet=applyTerrariumSceneOcclusionV03cEvent(covered,{
 channel:'base',event:{channel:'environment',event:{
  channel:'environment',event:{channel:'substrate',
  event:{type:'water',zoneId:'zone_1',amountUnits:700}}}}
});
verify(wet);
assert.equal(wet.base.biota.ledger.addedUnits,0);
assert.ok(wet.base.biota.environment.substrate.ledger.addedUnits>=700);
const json=JSON.parse(JSON.stringify(shadeTwo));
verify(json);
assert.deepEqual(advanceTerrariumSceneOcclusionV03c(json,{minutes:2}),
 advanceTerrariumSceneOcclusionV03c(shadeTwo,{minutes:2}));
const four=advanceTerrariumSceneOcclusionV03c(covered,{minutes:240});
verify(four);
assert.deepEqual(four,advanceTerrariumSceneOcclusionV03c(
 advanceTerrariumSceneOcclusionV03c(covered,{minutes:120}),
 {minutes:120}));
assert.equal(isValidTerrariumSceneOcclusionV03c({...covered,minute:100}),false);
assert.equal(isValidTerrariumSceneOcclusionV03c({...covered,
 base:{...covered.base,transmissionByZone:[1000,1000,1000]}}),false);
assert.equal(isValidTerrariumSceneOcclusionV03c({...covered,
 occluders:[{...shadow,transmissionPermille:1000}]}),false,
 'forged scene geometry cannot contradict light data');
for(const act of [
 ()=>createTerrariumSceneOcclusionV03c({baseOptions,occluders:[{
  ...shadow,startZone:2,endZone:1}]}),
 ()=>createTerrariumSceneOcclusionV03c({baseOptions,occluders:[{
  ...shadow,coveragePermille:1001}]}),
 ()=>createTerrariumSceneOcclusionV03c({baseOptions,occluders:[{
  ...shadow,startZone:-1}]}),
 ()=>createTerrariumSceneOcclusionV03c({baseOptions,occluders:[shadow,shadow]}),
 ()=>createTerrariumSceneOcclusionV03c({sceneId:'bad id',baseOptions}),
 ()=>createTerrariumSceneOcclusionV03c({baseOptions:{unknown:true}}),
 ()=>advanceTerrariumSceneOcclusionV03c(covered,{minutes:0}),
 ()=>advanceTerrariumSceneOcclusionV03c(covered,{minutes:241}),
 ()=>advanceTerrariumSceneOcclusionV03c(covered,{minutes:1.5}),
 ()=>applyTerrariumSceneOcclusionV03cEvent(covered,{
  channel:'occluder',type:'remove',id:'wrong'}),
 ()=>applyTerrariumSceneOcclusionV03cEvent(covered,{
  channel:'occluder',type:'upsert',occluder:{...shadow,kind:'bird'}}),
 ()=>applyTerrariumSceneOcclusionV03cEvent(covered,{
  channel:'base',event:{channel:'biota',event:{
   channel:'biota',type:'light',zoneId:'zone_1',lightUnits:900}}}),
 ()=>applyTerrariumSceneOcclusionV03cEvent(covered,{channel:'other'}),
 ()=>inspectTerrariumSceneOcclusionV03c({}),
 ()=>buildTerrariumSceneOcclusionV03cActionSnapshot({})
])assert.throws(act,RangeError);
const core=readFileSync(new URL(
 '../src/ohm-core/terrarium-scene-occlusion-v03c.mjs',import.meta.url),'utf8');
assert.doesNotMatch(core,/window\.|document\.|localStorage|sessionStorage|indexedDB|supabase|fetch\(|setInterval/i);
console.log('PASS V0.3c scene: unique light authority, deterministic overhang/canopy/screen masks, split clock, reversible shade, actual plant response, audit events, independent water/organic ledgers and invalid-state rejection');
