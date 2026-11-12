import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION,
  OHM_PLANT_TAXON_REFERENCES_V03B,
  createTerrariumEcologyLightV03b,isValidTerrariumEcologyLightV03b,
  advanceTerrariumEcologyLightV03b,applyTerrariumEcologyLightV03bEvent,
  inspectTerrariumEcologyLightV03b,
  buildTerrariumEcologyLightV03bActionSnapshot
} from '../src/ohm-core/terrarium-ecology-light-v03b.mjs';
const led={
 id:'grow01',type:'artificial_led',zoneIndex:4,
 strengthUnits:900,spreadZones:1,heightUnits:200,
 startMinute:60,durationMinutes:60
};
const make=()=>createTerrariumEcologyLightV03b({
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{
    columns:5,rows:1,ambient:{temperatureC:24,relativeHumidity:.5},
    cellOverrides:[{x:0,y:0,heater:1},{x:4,y:0,shade:.7}],
    sites:[{id:'drink',kind:'water',cellIndex:2,safe:true,
       reachable:true,distanceCost:.1,flags:{waterReachable:true}}]
   },
   substrateOptions:{zones:[
    {surfaceWaterUnits:100,rootWaterUnits:800},
    {surfaceWaterUnits:320,rootWaterUnits:1300},
    {surfaceWaterUnits:450,rootWaterUnits:1450},
    {surfaceWaterUnits:580,rootWaterUnits:1600,
     percolationPermille:0,lateralPermille:0},
    {surfaceWaterUnits:650,rootWaterUnits:1600,
     percolationPermille:0,lateralPermille:0}
   ]}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:240,lightUnits:999,
    litterUnits:1000},
   {plantKind:'none',plantCoverUnits:0},
   {plantKind:'none',plantCoverUnits:0},
   {plantKind:'moss',plantCoverUnits:200,litterUnits:1200},
   {plantKind:'fern',plantCoverUnits:250,litterUnits:1400}
  ]
 },
 fixtures:[led],
 speciesByZone:[
  'moss_polytrichum_commune',null,null,null,
  'fern_nephrolepis_exaltata'
 ]
});
const totalOrganic=s=>s.biota.zones.reduce((n,z)=>
 n+z.litterUnits+z.fragmentedUnits+z.mineralUnits,0);
const totalWater=s=>s.biota.environment.substrate.zones.reduce((n,z)=>
 n+z.surface.waterUnits+z.root.waterUnits+z.drainage.waterUnits,0);
function validate(s){
 assert.equal(isValidTerrariumEcologyLightV03b(s),true);
 assert.equal(s.minute,s.biota.minute);
 assert.equal(s.minute,s.biota.environment.minute);
 assert.equal(s.minute,s.biota.environment.substrate.minute);
 const o=s.biota.ledger,w=s.biota.environment.substrate.ledger;
 assert.equal(o.initialUnits+o.addedUnits,totalOrganic(s));
 assert.equal(w.initialUnits+w.addedUnits,
  totalWater(s)+w.evaporatedUnits+w.drainedUnits+w.overflowUnits);
}
const s0=make();
assert.equal(TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION,'0.3b');
assert.equal(OHM_PLANT_TAXON_REFERENCES_V03B.length,2);
assert.equal(OHM_PLANT_TAXON_REFERENCES_V03B[0].husbandry,'not_evaluated');
assert.equal(s0.biota.zones[4].plant.lightUnits,0,
 'new fixture authority overwrites previous V0.3a manual light values');
validate(s0);
const before=JSON.stringify(s0);
const s59=advanceTerrariumEcologyLightV03b(s0,{minutes:59});
validate(s59);
assert.equal(s59.biota.zones[4].plant.lightUnits,0);
const s60=advanceTerrariumEcologyLightV03b(s0,{minutes:60});
validate(s60);
assert.ok(s60.biota.zones[4].plant.lightUnits>0);
assert.equal(s60.biota.zones[0].plant.lightUnits,0);
assert.ok(s60.biota.zones[4].plant.coverUnits>
 s0.biota.zones[4].plant.coverUnits,
 'new fixture starts on hour boundary and hourly biota uses that light');
assert.deepEqual(s60,advanceTerrariumEcologyLightV03b(
 advanceTerrariumEcologyLightV03b(s0,{minutes:27}),{minutes:33}),
 'minute-clock 27+33 equals 60');
assert.equal(JSON.stringify(s0),before);
const s120=advanceTerrariumEcologyLightV03b(s0,{minutes:120});
validate(s120);
assert.equal(s120.biota.zones[4].plant.lightUnits,0,
 'lamp turns off at exact schedule end');
assert.deepEqual(s120,advanceTerrariumEcologyLightV03b(s60,{minutes:60}));
const lights=inspectTerrariumEcologyLightV03b(s60);
assert.equal(lights.lightUnitsByZone[0],0);
assert.ok(lights.lightUnitsByZone[4]>0);
assert.equal(lights.plants[4].scientificName,
 'Nephrolepis exaltata (L.) Schott');
assert.equal(lights.plants[0].modelCoefficients,
 'generic_morphotype_game_heuristic_only');
assert.equal(lights.lamps[0].on,true);
assert.equal(lights.speciesStatus,'taxonomic_reference_not_welfare_validated');
assert.equal(lights.observationStatus,'no_eyewitness_claims');
assert.ok(buildTerrariumEcologyLightV03bActionSnapshot(s60).sites.length>0);
const s60JSON=JSON.parse(JSON.stringify(s60));validate(s60JSON);
assert.deepEqual(advanceTerrariumEcologyLightV03b(s60JSON,{minutes:60}),
 advanceTerrariumEcologyLightV03b(s60,{minutes:60}));
const revised=applyTerrariumEcologyLightV03bEvent(s0,{
 channel:'fixture',type:'upsert',fixture:{
 ...led,id:'longnight',zoneIndex:0,startMinute:1380,durationMinutes:120,
 strengthUnits:600,spreadZones:0
 }
});
validate(revised);
assert.equal(revised.fixtures.length,2);
assert.equal(revised.biota.zones[0].plant.lightUnits,500,
 'wrapped 23:00-to-01:00 schedule active at midnight; height attenuates');
const removed=applyTerrariumEcologyLightV03bEvent(revised,{
 channel:'fixture',type:'remove',id:'grow01'
});
validate(removed);
assert.equal(removed.fixtures.length,1);
assert.equal(removed.biota.zones[4].plant.lightUnits,0);
assert.equal(revised.fixtures.length,2,'fixture event may not mutate source');
const assigned=applyTerrariumEcologyLightV03bEvent(s0,{
 channel:'plant_species',zoneId:'zone_3',
 speciesId:'moss_polytrichum_commune'
});
validate(assigned);
assert.equal(assigned.speciesByZone[3],'moss_polytrichum_commune');
const replanted=applyTerrariumEcologyLightV03bEvent(assigned,{
 channel:'biota',event:{channel:'biota',type:'plant_patch',
   zoneId:'zone_3',plantKind:'fern',coverUnits:150}
});
validate(replanted);
assert.equal(replanted.speciesByZone[3],null,
 'changing morphotype clears incompatible taxonomic reference');
assert.equal(replanted.biota.zones[3].plant.kind,'fern');
const organics=applyTerrariumEcologyLightV03bEvent(s0,{
 channel:'organic',type:'litter_input',eventId:'leaf-001',
 minute:0,zoneId:'zone_3',amountUnits:750,
 source:{kind:'player_placement',referenceId:'action-001'}
});
validate(organics);
assert.equal(organics.biota.ledger.addedUnits,750);
assert.equal(organics.receipts.length,1);
assert.equal(organics.receipts[0].classification,
 'in_game_event_not_observation');
assert.equal(organics.biota.environment.substrate.ledger.addedUnits,0,
 'litter and soil water have separate ledgers');
assert.equal(s0.receipts.length,0);
const result=advanceTerrariumEcologyLightV03b(organics,{minutes:240});
validate(result);
assert.equal(result.receipts.length,1);
assert.ok(result.biota.zones[3].litterUnits<=organics.biota.zones[3].litterUnits);
assert.throws(()=>applyTerrariumEcologyLightV03bEvent(organics,{
 channel:'organic',type:'litter_input',eventId:'leaf-001',
 minute:0,zoneId:'zone_3',amountUnits:750,
 source:{kind:'player_placement',referenceId:'action-001'}
}),RangeError,'duplicate receipts are rejected');
const watered=applyTerrariumEcologyLightV03bEvent(s0,{
 channel:'environment',
 event:{channel:'environment',event:{channel:'substrate',
  event:{type:'mist',zoneId:'zone_4',amountUnits:250}}}
});
validate(watered);
assert.equal(watered.biota.environment.substrate.ledger.addedUnits,250);
assert.equal(watered.biota.ledger.addedUnits,0);
assert.deepEqual(watered.fixtures,s0.fixtures);
const longDay=createTerrariumEcologyLightV03b({
 biotaOptions:{environmentOptions:{
  microclimateOptions:{columns:1,rows:1},
  substrateOptions:{zones:[{}]}
 },zoneConfigs:[{plantKind:'moss',plantCoverUnits:150}]},
 fixtures:[{id:'sun',type:'daylight_proxy',zoneIndex:0,
  strengthUnits:850,spreadZones:0,heightUnits:0,
  startMinute:0,durationMinutes:1440}]
});
validate(longDay);
const day=advanceTerrariumEcologyLightV03b(longDay,{minutes:240});
validate(day);
assert.equal(day.biota.zones[0].plant.lightUnits,850);
const saved=JSON.parse(JSON.stringify(day));validate(saved);
assert.deepEqual(advanceTerrariumEcologyLightV03b(saved,{minutes:30}),
 advanceTerrariumEcologyLightV03b(day,{minutes:30}));
for(const attempt of [
 ()=>createTerrariumEcologyLightV03b({fixtures:[{...led,id:'x',zoneIndex:13}]}),
 ()=>createTerrariumEcologyLightV03b({fixtures:[led,led]}),
 ()=>createTerrariumEcologyLightV03b({fixtures:[{...led,startMinute:1440}]}),
 ()=>createTerrariumEcologyLightV03b({fixtures:[{...led,durationMinutes:0}]}),
 ()=>createTerrariumEcologyLightV03b({speciesByZone:[
  'fern_nephrolepis_exaltata',null,null,null,null]}),
 ()=>advanceTerrariumEcologyLightV03b(s0,{minutes:0}),
 ()=>advanceTerrariumEcologyLightV03b(s0,{minutes:241}),
 ()=>advanceTerrariumEcologyLightV03b(s0,{minutes:Infinity}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'biota',
  event:{channel:'biota',type:'light',zoneId:'zone_0',lightUnits:500}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'biota',
  event:{channel:'biota',type:'leaf_litter',zoneId:'zone_0',amountUnits:400}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'organic',
  type:'litter_input',eventId:'leaf-2',minute:1,zoneId:'zone_0',
  amountUnits:300,source:{kind:'player_placement',referenceId:'event-2'}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'organic',
  type:'litter_input',eventId:'leaf-2',minute:0,zoneId:'zone_0',
  amountUnits:300,source:{kind:'eyewitness',referenceId:'event-2'}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'organic',
  type:'litter_input',eventId:'leaf-2',minute:0,zoneId:'zone_0',
  amountUnits:300,source:{kind:'player_placement',referenceId:''}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'organic',
  type:'litter_input',eventId:'leaf-2',minute:0,zoneId:'zone_0',
  amountUnits:0,source:{kind:'player_placement',referenceId:'r'}}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'plant_species',
  zoneId:'zone_4',speciesId:'moss_polytrichum_commune'}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'fixture',type:'remove',id:'not-found'}),
 ()=>applyTerrariumEcologyLightV03bEvent(s0,{channel:'unknown'}),
 ()=>inspectTerrariumEcologyLightV03b({}),
 ()=>buildTerrariumEcologyLightV03bActionSnapshot({})
])assert.throws(attempt,RangeError);
assert.equal(isValidTerrariumEcologyLightV03b({...s0,minute:100}),false);
assert.equal(isValidTerrariumEcologyLightV03b({...s0,
 biota:{...s0.biota,zones:s0.biota.zones.map((z,i)=>i===4?{
  ...z,plant:{...z.plant,lightUnits:999}
 }:z)}}),false,'manual fake light is rejected');
const code=readFileSync(new URL('../src/ohm-core/terrarium-ecology-light-v03b.mjs',import.meta.url),'utf8');
assert.doesNotMatch(code,/window\.|document\.|localStorage|sessionStorage|indexedDB|supabase|fetch\(|setInterval/i);
assert.doesNotMatch(code,/\bnew\s+Date\s*\(|\bDate\.(?:now|parse|UTC)\s*\(/);
console.log('PASS V0.3b: taxon names are reference-only, scheduled spatial light with midnight wrap and 60=27+33, sourced idempotent litter, distinct water and organic ledgers and rejected fake observations');
