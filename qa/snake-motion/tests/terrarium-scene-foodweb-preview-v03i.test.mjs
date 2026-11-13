import assert from 'node:assert/strict';
import {
 createTerrariumSceneGeometryV03d,
 isValidTerrariumSceneGeometryV03d,
 advanceTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 previewTerrariumSceneFoodWebV03i
} from '../src/ohm-core/terrarium-scene-foodweb-preview-v03i.mjs';
import {
 isValidTerrariumBiotaV03
} from '../src/ohm-core/terrarium-biota-v03a.mjs';

const fixture={
 id:'led',type:'artificial_led',zoneIndex:2,
 strengthUnits:900,spreadZones:4,heightUnits:0,
 startMinute:0,durationMinutes:1440
};
const baseOptions={
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{columns:5,rows:1,
    ambient:{temperatureC:24,relativeHumidity:.5},
    cellOverrides:[{x:0,y:0,heater:1},{x:2,y:0,waterLevel:.9}]},
   substrateOptions:{zones:Array.from({length:5},(_,i)=>({
    surfaceWaterUnits:i===0?0:650,
    rootWaterUnits:i===0?0:1600,
    percolationPermille:0,lateralPermille:0
   }))}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:120,
    lightUnits:800,litterUnits:200,fragmentedUnits:20,
    fungiIndex:300,springtailIndex:600,isopodIndex:550},
   {plantKind:'fern',plantCoverUnits:120,
    lightUnits:500,litterUnits:250,fragmentedUnits:80,
    fungiIndex:300,springtailIndex:300,isopodIndex:250},
   {plantKind:'none',plantCoverUnits:0,
    litterUnits:0,fragmentedUnits:0, mineralUnits:0,
    fungiIndex:700,springtailIndex:700,isopodIndex:700},
   {plantKind:'moss',plantCoverUnits:250,
    lightUnits:600,litterUnits:4000,fragmentedUnits:700,
    fungiIndex:900,springtailIndex:200,isopodIndex:450},
   {plantKind:'fern',plantCoverUnits:320,
    lightUnits:800,litterUnits:3000,fragmentedUnits:300,
    fungiIndex:850,springtailIndex:400,isopodIndex:400}
  ]
 },
 fixtures:[fixture]
};
const blocker={
 id:'stone_01',kind:'rock_overhang',
 x:570,y:120,width:60,depth:160,height:500,
 transmissionPermille:0
};
const mount={fixtureId:'led',x:500,y:200,height:800};
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'neutral_foodweb_v03i_real_scene',
 baseOptions,objects:[blocker],mounts:[mount]
});
assert.equal(isValidTerrariumSceneGeometryV03d(scene),true);
const before=JSON.stringify(scene);
const r=previewTerrariumSceneFoodWebV03i({
 scene,minutes:60,
 bacteriaIndexesByZone:[100,250,750,850,300]
});
assert.equal(r.ok,true,'real V0.3d scene-level shadow preview');
assert.equal(r.sourceModel,'V0.3d/V0.3b/V0.3a authoritative ecology');
assert.equal(r.sceneId,scene.sceneId);
assert.equal(r.fromMinute,0);
assert.equal(r.toMinute,60);
assert.equal(r.periodMinutes,60);
assert.equal(r.fiveZoneCount,5);
assert.equal(r.zones.length,5);
assert.equal(r.originalSceneStillUnmodified,true);
assert.equal(r.shadowPoolsNeverCommitted,true);
assert.equal(r.changedToFormalBiotaSchema,false);
assert.equal(r.addedBacteriaToPlayerSave,false);
assert.equal(r.realGameSaveModified,false);
assert.equal(r.userVisibleNewSpriteRendered,false);
assert.equal(JSON.stringify(scene),before);
assert.equal(isValidTerrariumSceneGeometryV03d(
 r.authoritativeSceneCandidate),true);
assert.equal(isValidTerrariumBiotaV03(
 r.authoritativeSceneCandidate.base.biota),true);
const reference=advanceTerrariumSceneGeometryV03d(scene,{minutes:60});
assert.deepEqual(r.authoritativeSceneCandidate,reference,
 'the original source engine MUST remain exactly authoritative');
assert.notStrictEqual(r.authoritativeSceneCandidate,scene);
const get=z=>z.litterUnits+z.fragmentedUnits+z.mineralUnits;
const beforeOrganic=scene.base.biota.zones.reduce((sum,z)=>sum+get(z),0);
const afterOrganic=r.authoritativeSceneCandidate.base.biota
 .zones.reduce((sum,z)=>sum+get(z),0);
assert.equal(r.sourceModelOrganicTotalBefore,beforeOrganic);
assert.equal(r.sourceModelOrganicTotalAfter,afterOrganic);
assert.equal(beforeOrganic,afterOrganic);
assert.equal(r.noNewOrganicMatter,true);
assert.deepEqual(r.beforeLedger,r.afterLedger);
for(let i=0;i<5;i++){
 const a=r.zones[i];
 const z=scene.base.biota.zones[i];
 const advanced=r.authoritativeSceneCandidate.base.biota.zones[i];
 assert.equal(a.id,'zone_'+i);
 assert.equal(a.sourceStart.litterUnits,z.litterUnits);
 assert.equal(a.sourceStart.fragmentedUnits,z.fragmentedUnits);
 assert.equal(a.sourceStart.processedProxyUnits,z.mineralUnits);
 assert.equal(a.sourceAfterAuthoritativeAdvance.litterUnits,
  advanced.litterUnits);
 assert.equal(a.alternativeReadOnlyAfterSameInterval.litterUnits+
  a.alternativeReadOnlyAfterSameInterval.fragmentedUnits+
  a.alternativeReadOnlyAfterSameInterval.processedProxyUnits,get(z));
 assert.equal(a.bothModelsProxyTotal,get(z));
 assert.equal(a.noDoubleCount,true);
 assert.equal(a.sourceSceneOwnsLightAndMoisture,true);
 assert.equal(a.microbialDecomposerIndexes.bacteria,
  [100,250,750,850,300][i]);
 assert.deepEqual(a.plantSourceBefore,z.plant);
 assert.deepEqual(a.plantSourceAfter,advanced.plant);
}
assert.equal(r.zones[0].plantRole,'primary_producer');
assert.equal(r.zones[1].plantRole,'primary_producer');
assert.equal(r.zones[2].plantRole,'no_plant');
assert.equal(r.zones[0].alternativeFragmentationUnits,0,
 'dry zone environmental authority prevents synthetic shredding');
assert.equal(r.zones[2].bothModelsProxyTotal,0);
assert.equal(r.zones[2].alternativeFragmentationUnits,0);
assert.equal(r.zones[2].alternativeMicrobialProcessingUnits,0);
assert.ok(r.zones[3].alternativeFragmentationUnits>0);
assert.ok(r.zones[3].alternativeMicrobialProcessingUnits>0);
assert.equal(r.authoritativeSceneCandidate.base.transmissionByZone[3]<
 1000,true,'source rock still casts actual source-owned light shade');
assert.equal(r.authoritativeSceneCandidate.objects.length,1);
assert.equal(JSON.stringify(scene),before);

const chunks=advanceTerrariumSceneGeometryV03d(
 advanceTerrariumSceneGeometryV03d(scene,{minutes:27}),
 {minutes:33});
assert.deepEqual(chunks,r.authoritativeSceneCandidate,
 'true source 27+33 simulation remains the same');
const repeat=previewTerrariumSceneFoodWebV03i({
 scene,minutes:60,
 bacteriaIndexesByZone:[100,250,750,850,300]
});
assert.deepEqual(repeat,r,'same scene/synthetic coefficients deterministic');

const hour4=previewTerrariumSceneFoodWebV03i({
 scene,minutes:240
});
assert.equal(hour4.ok,true);
assert.equal(hour4.toMinute,240);
assert.equal(hour4.fiveZoneCount,5);
assert.equal(hour4.noNewOrganicMatter,true);
assert.equal(isValidTerrariumSceneGeometryV03d(
 hour4.authoritativeSceneCandidate),true);
assert.deepEqual(hour4.authoritativeSceneCandidate,
 advanceTerrariumSceneGeometryV03d(scene,{minutes:240}));

// Actual source-scoped organic event enters authoritative ledger
// ONCE. Shadow comparison merely reads it, cannot duplicate input.
const litter=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'base',event:{
  channel:'organic',type:'litter_input',
  eventId:'new_leaf_input',minute:0,
  zoneId:'zone_3',amountUnits:100,
  source:{kind:'player_placement',referenceId:'leaf_input_source'}
 }
});
const afterInput=previewTerrariumSceneFoodWebV03i({
 scene:litter,minutes:60
});
assert.equal(afterInput.ok,true);
assert.equal(afterInput.beforeLedger.addedUnits,100);
assert.equal(afterInput.afterLedger.addedUnits,100);
assert.equal(afterInput.zones[3].sourceStart.litterUnits,4100);
assert.equal(afterInput.noNewOrganicMatter,true);
assert.equal(scene.base.biota.ledger.addedUnits,0);

// Shadow must fail closed without damaging player data/legacy schema.
for(const args of [
 {scene,minutes:30},
 {scene,minutes:241},
 {scene,minutes:-1},
 {scene,minutes:60,bacteriaIndexesByZone:[1]},
 {scene,minutes:60,bacteriaIndexesByZone:[1,2,3,4,-1]},
 {scene,minutes:60,bacteriaIndexesByZone:[1,2,3,4,1001]},
 {scene,minutes:60,bacteriaIndexesByZone:42},
 {scene:null,minutes:60},
 {scene:{...scene,revision:-5},minutes:60},
 {scene:{...scene,base:{...scene.base,biota:{
  ...scene.base.biota,ledger:{initialUnits:100000,addedUnits:0}
 }}},minutes:60}
]){
 const fail=previewTerrariumSceneFoodWebV03i(args);
 assert.equal(fail.ok,false);
 assert.equal(fail.shadowPoolsNeverCommitted,true);
 assert.equal(fail.realGameSaveModified,false);
}
const nonhour=advanceTerrariumSceneGeometryV03d(scene,{minutes:27});
assert.equal(previewTerrariumSceneFoodWebV03i({
 scene:nonhour,minutes:60
}).ok,false,'no hourly shadow use during misaligned source minute');
assert.equal(JSON.stringify(scene),before);

console.log('PASS ECO V0.3i five-zone source V0.3d scene + separate role-corrected V0.3h shadow, source light/water/organic exact and no writes');
console.log(JSON.stringify({
 sourceFiveZones:r.fiveZoneCount,
 shadowVsAuthorityZone3:{
  authority:r.zones[3].sourceAfterAuthoritativeAdvance,
  shadow:r.zones[3].alternativeReadOnlyAfterSameInterval
 },
 beforeOrganic,afterOrganic,
 realSceneObjectBlocksLight:true,
 syntheticBacteriaOnlyInShadow:true,
 noSourceLedgerDoubleCounting:true,
 noOrganicMaterialFromNothing:true,
 noFormalSchemaOrSaveEdits:true
}));
