import assert from 'node:assert/strict';
import {
 createTerrariumBiotaV03,
 advanceTerrariumBiotaV03,
 applyTerrariumBiotaV03Event,
 isValidTerrariumBiotaV03
} from '../src/ohm-core/terrarium-biota-v03a.mjs';
import {
 TERRARIUM_FOODWEB_ROLE_CATALOG_V03H,
 getTerrariumFoodWebRoleV03h,
 previewTerrariumFoodWebRoleFlowV03h
} from '../src/ohm-core/terrarium-foodweb-roles-v03h.mjs';

const makeZone=(zoneConfig,moisture=true)=>{
 const zone=moisture?
  {surfaceWaterUnits:600,rootWaterUnits:2000,
   drainageWaterUnits:0}:
  {surfaceWaterUnits:0,rootWaterUnits:0,
   drainageWaterUnits:0};
 return createTerrariumBiotaV03({
  environmentOptions:{
   microclimateOptions:{
    columns:1,rows:1,
    ambient:{temperatureC:23,relativeHumidity:moisture?.65:.1}
   },
   substrateOptions:{zones:[zone]}
  },
  zoneConfigs:[zoneConfig]
 });
};
const base=makeZone({plantKind:'moss',
 plantCoverUnits:240,lightUnits:750,
 litterUnits:9000,fragmentedUnits:1600,
 mineralUnits:30,
 fungiIndex:700,springtailIndex:600,isopodIndex:500
});
assert.equal(isValidTerrariumBiotaV03(base),true);
const old=JSON.stringify(base);
const categories=TERRARIUM_FOODWEB_ROLE_CATALOG_V03H;
assert.equal(categories.length,7);
assert.equal(getTerrariumFoodWebRoleV03h('fungi').group,
 'microbial_decomposer');
assert.equal(getTerrariumFoodWebRoleV03h('bacteria').group,
 'microbial_decomposer');
assert.equal(getTerrariumFoodWebRoleV03h('isopods').group,
 'detritivore');
assert.equal(getTerrariumFoodWebRoleV03h('springtails').group,
 'micrograzer');
assert.equal(getTerrariumFoodWebRoleV03h('moss').group,
 'primary_producer');
assert.equal(getTerrariumFoodWebRoleV03h('fern').group,
 'primary_producer');
assert.equal(getTerrariumFoodWebRoleV03h('beetle_unspecified').group,
 'depends_on_species');
assert.equal(getTerrariumFoodWebRoleV03h('snake'),null);

const preview=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:base,zoneId:'zone_0',hours:24,bacteriaIndex:700
});
assert.equal(preview.ok,true);
assert.equal(preview.sourceVersion,'0.3a');
assert.equal(preview.zoneId,'zone_0');
assert.equal(preview.hours,24);
assert.equal(preview.plantKind,'moss');
assert.equal(preview.plantIsDecomposer,false);
assert.equal(preview.plantPhotosynthesisProposedHere,false);
assert.equal(preview.microbialDecomposerIndexes.bacteria,700);
assert.ok(preview.temporaryFoodWebFlow.litterShreddedIntoFragmentsUnits>0);
assert.ok(preview.temporaryFoodWebFlow.fragmentsProcessedByMicrobesUnits>0);
assert.equal(preview.springtailsDirectMineralizationContribution,0);
assert.equal(preview.isopodsDirectMineralizationContribution,0);
assert.equal(preview.syntheticProxyMassConserved,true);
assert.equal(preview.originalPools.litterUnits,9000);
assert.equal(preview.proposedPools.litterUnits<9000,true);
assert.equal(preview.proposedBookkeepingOrganicTotal,
 preview.sourceBookkeepingOrganicTotal);
assert.equal(preview.legacyV03aDecomposerFormulasUnchanged,true);
assert.equal(preview.shadowOnlyPendingAuthorityMigration,true);
assert.equal(preview.formalGameSaveModified,false);
assert.equal(JSON.stringify(base),old);
assert.deepEqual(preview,
 previewTerrariumFoodWebRoleFlowV03h({
  biotaState:base,zoneId:'zone_0',hours:24,bacteriaIndex:700
 }));

// Only the proposed model transfers pool units. No new material
// appears from moss cover, heat, bacteria or imaginary players.
const noOrganic=makeZone({plantKind:'moss',
 plantCoverUnits:240,lightUnits:750,
 litterUnits:0,fragmentedUnits:0,mineralUnits:0,
 fungiIndex:1000,springtailIndex:1000,isopodIndex:1000});
const empty=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:noOrganic,hours:24,bacteriaIndex:1000
});
assert.equal(empty.ok,true);
assert.equal(empty.proposedBookkeepingOrganicTotal,0);
assert.equal(empty.temporaryFoodWebFlow.litterShreddedIntoFragmentsUnits,0);
assert.equal(empty.temporaryFoodWebFlow.fragmentsProcessedByMicrobesUnits,0);
assert.equal(empty.caveGeothermalEnergyCreatesNoOrganics,true);

// Isopods alone can shred litter, but are not modeled as the
// microbial chemical conversion that fills the processed pool.
const shredOnly=makeZone({plantKind:'none',
 litterUnits:10000,fragmentedUnits:0,mineralUnits:0,
 fungiIndex:0,springtailIndex:0,isopodIndex:1000});
const isopods=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:shredOnly,hours:24,bacteriaIndex:0
});
assert.equal(isopods.ok,true);
assert.ok(isopods.temporaryFoodWebFlow
 .litterShreddedIntoFragmentsUnits>0);
assert.equal(isopods.temporaryFoodWebFlow
 .fragmentsProcessedByMicrobesUnits,0);
assert.equal(isopods.proposedPools.processedProxyUnits,0);

// Springtails alone are not magical instant mineralizers.
// Some springtails eat detritus; role assignment deliberately
// describes predominant feeding signals, not a strict universal.
const springOnly=makeZone({plantKind:'none',
 litterUnits:10000,fragmentedUnits:0,mineralUnits:0,
 fungiIndex:0,springtailIndex:1000,isopodIndex:0});
const springs=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:springOnly,hours:24,bacteriaIndex:0
});
assert.equal(springs.ok,true);
assert.equal(springs.temporaryFoodWebFlow
 .fragmentsProcessedByMicrobesUnits,0);
assert.equal(springs.temporaryFoodWebFlow
 .litterShreddedIntoFragmentsUnits,0);

// No animals needed for direct fungi/bacteria decomposer role.
const microOnly=makeZone({plantKind:'none',
 litterUnits:10000,fragmentedUnits:1000,mineralUnits:0,
 fungiIndex:900,springtailIndex:0,isopodIndex:0});
const microbes=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:microOnly,hours:24,bacteriaIndex:900
});
assert.ok(microbes.temporaryFoodWebFlow
 .fragmentsProcessedByMicrobesUnits>0);

// Moisture and thermal conditions matter, but are game heuristics,
// not real species rate constants or professional husbandry targets.
const dry=makeZone({plantKind:'moss',
 plantCoverUnits:240,lightUnits:0,
 litterUnits:9000,fragmentedUnits:1600,
 fungiIndex:700,springtailIndex:600,isopodIndex:500},false);
const dryPreview=previewTerrariumFoodWebRoleFlowV03h({
 biotaState:dry,hours:24,bacteriaIndex:700
});
assert.equal(dryPreview.ok,true);
assert.equal(dryPreview.conditions.moistureProxy,0);
assert.equal(dryPreview.temporaryFoodWebFlow.litterShreddedIntoFragmentsUnits,0);
assert.equal(dryPreview.temporaryFoodWebFlow.fragmentsProcessedByMicrobesUnits,0);
assert.equal(dryPreview.plantGrowthOccursWithoutLightHere,false);
assert.equal(dryPreview.plantIsDecomposer,false);

// Source V0.3a retains exclusive authority for actual time,
// organism, moisture, litter input, and full player-save schema.
// Our proposal cannot bypass its ledgers or mutate the source.
const afterV03a=advanceTerrariumBiotaV03(base,{minutes:60});
assert.equal(isValidTerrariumBiotaV03(afterV03a),true);
assert.equal(afterV03a.minute,60);
assert.equal(JSON.stringify(base),old);
const withLitter=applyTerrariumBiotaV03Event(base,{
 channel:'biota',type:'leaf_litter',zoneId:'zone_0',amountUnits:500
});
assert.equal(isValidTerrariumBiotaV03(withLitter),true);
assert.equal(withLitter.ledger.addedUnits,500);
assert.equal(previewTerrariumFoodWebRoleFlowV03h({
 biotaState:withLitter,hours:1
}).originalPools.litterUnits,9500);
assert.equal(JSON.stringify(base),old);

// Fail closed on malformed time, indices, missing zones and forged
// V0.3a conservation ledgers, instead of optimistic result.
for(const args of [
 {biotaState:base,zoneId:'unknown'},
 {biotaState:base,hours:0},
 {biotaState:base,hours:25},
 {biotaState:base,hours:1.5},
 {biotaState:base,bacteriaIndex:-1},
 {biotaState:base,bacteriaIndex:1001},
 {biotaState:{...base,ledger:{...base.ledger,addedUnits:999}}},
 {biotaState:null}
]){
 const x=previewTerrariumFoodWebRoleFlowV03h(args);
 assert.equal(x.ok,false);
 assert.equal(x.formalGameSaveModified,false);
}
console.log('PASS ECO V0.3h explicit bacteria/fungi, isopod shredders, springtail grazers, moss producers; mass-preserving read-only V0.3a shadow decomposition');
console.log(JSON.stringify({
 catalog:categories.map(x=>[x.id,x.group]),
 proposedWet24h:preview.temporaryFoodWebFlow,
 organicTotalInvariant:preview.sourceBookkeepingOrganicTotal,
 shreddedByIsopodsWithoutMicrobes:isopods.temporaryFoodWebFlow,
 springtailOnlyCreatesNoNutrients:springs.proposedPools,
 noOrganicInputCreatesNoMatter:empty.proposedBookkeepingOrganicTotal,
 lowMoisturePausesProposedDecomposition:true,
 existingV03aClockAndLedgerStillAuthoritative:true,
 shadowOnlyNotGameplay:true
}));
