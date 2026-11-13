/**
 * Project OHM ECO V0.3h — conservative soil food-web ROLE correction.
 *
 * Backward-compatible, READ-ONLY overlay for source V0.3a.
 * It does not change the V0.3a ledger or water/light authority:
 * its one-zone organic flow is a PROPOSED, ALTERNATIVE rule-set
 * to replace overbroad "all = decomposers" coefficients later.
 *
 * Key ecological distinctions:
 *   saprotrophic fungi + bacteria: microbial decomposer proxies
 *   terrestrial isopods: litter shredder/detritivore proxy
 *   springtails: fungal/bacterial grazer; many also eat detritus
 *   moss/ferns: photosynthetic primary producer patches, NOT detritus
 *   beetles: cannot classify without taxon/diet info
 *
 * Not a per-organism model, laboratory decomposition rate, measured
 * nitrogen/carbon cycle, sanitation guarantee, or live player save.
 * Numerical values are SYNTHETIC game engineering test coefficients.
 *
 * Conservation is intentionally enforced across three SOURCE
 * abstract bookkeeping pools. It is NOT physical carbon
 * conservation (real decomposition also produces CO2 and biomass).
 */
import {isValidTerrariumBiotaV03}
 from './terrarium-biota-v03a.mjs';

export const TERRARIUM_FOODWEB_ROLES_V03H_VERSION='0.3h';
const F=Object.freeze;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const integer=(x,limit)=>Number.isSafeInteger(x)&&x>=0&&x<=limit;
const ENTRY=F([
 F({id:'fungi',group:'microbial_decomposer',
  role:'saprotrophic_decomposition',kind:'microbial',
  note:'Only saprotrophic fungi are intended, not all fungi'}),
 F({id:'bacteria',group:'microbial_decomposer',
  role:'degradation_and_nutrient_cycling',kind:'microbial',
  note:'Separate synthetic proxy; not present in V0.3a schema'}),
 F({id:'isopods',group:'detritivore',
  role:'shredding_and_consuming_litter',kind:'macrofauna',
  note:'Fragmentation can help microbes; not instant fertilizer'}),
 F({id:'springtails',group:'micrograzer',
  role:'fungivory_bacterivory_and_some_detritivory',kind:'mesofauna',
  note:'Diets vary among species; not a universal cleanup tool'}),
 F({id:'moss',group:'primary_producer',
  role:'photosynthesis_and_microhabitat',kind:'plant',
  note:'Needs appropriate light; not a decomposer'}),
 F({id:'fern',group:'primary_producer',
  role:'photosynthesis_and_microhabitat',kind:'plant',
  note:'Needs appropriate light; not a decomposer'}),
 F({id:'beetle_unspecified',group:'depends_on_species',
  role:'detritivore_or_fungivore_or_predator',kind:'unresolved_insect',
  note:'Cannot assign all beetles to decomposer class'})
]);
export const TERRARIUM_FOODWEB_ROLE_CATALOG_V03H=ENTRY;
export function getTerrariumFoodWebRoleV03h(id){
 return ENTRY.find(r=>r.id===id)??null;
}
const fail=(reason)=>F({
 version:'0.3h',ok:false,reason,
 legacySourceLedgerModified:false,formalGameSaveModified:false
});
/**
 * V0.3a supplies exactly the TRUE source substrate/water/clock
 * sample and existing litter/fragmented/processed-proxy pools.
 * The synthetic bacteria index is separate and cannot be
 * represented as a V0.3a on-disk field until schema migration.
 */
export function previewTerrariumFoodWebRoleFlowV03h({
 biotaState,zoneId='zone_0',bacteriaIndex=400,hours=1
}={}){
 if(!isValidTerrariumBiotaV03(biotaState)||
  !integer(bacteriaIndex,1000)||
  !integer(hours,24))
  return fail('invalid_source_state_or_shadow_coefficients');
 if(hours<1)return fail('hours_must_be_positive');
 const index=biotaState.zones.findIndex(z=>z.id===zoneId);
 if(index<0)return fail('source_zone_missing');
 const z=biotaState.zones[index],
  climate=biotaState.environment.microclimate.cells[index],
  soil=biotaState.environment.substrate.zones[index];
 const start=F({
  litterUnits:z.litterUnits,
  fragmentedUnits:z.fragmentedUnits,
  processedProxyUnits:z.mineralUnits
 });
 const startMass=start.litterUnits+start.fragmentedUnits+
  start.processedProxyUnits;
 let litter=start.litterUnits,fragmented=start.fragmentedUnits,
  processed=start.processedProxyUnits,
  sumShred=0,sumMicrobe=0;
 const temp=climate.temperatureC;
 const root=soil.root.capacityUnits>0?
  soil.root.waterUnits/soil.root.capacityUnits:0;
 const surface=soil.surface.capacityUnits>0?
  soil.surface.waterUnits/soil.surface.capacityUnits:0;
 const moisture=clamp(.5*root+.5*surface,0,1);
 const climateGate=temp>=8&&temp<=40?1:0;
 const activity=climateGate*moisture;
 const fungi=z.decomposers.fungiIndex,
  isopods=z.decomposers.isopodIndex,
  springtails=z.decomposers.springtailIndex;
 // New role model: isopods accelerate physical fragmentation.
 // Fungi and bacteria actually process fragmented organics.
 // Springtails are visible grazer signals, NOT a direct
 // chemical mineralization multiplier.
 for(let h=0;h<hours;h++){
  const shred=Math.min(litter,Math.floor(
   litter*activity*(isopods*.65+fungi*.12+
    bacteriaIndex*.08)/90000
  ));
  litter-=shred;
  fragmented+=shred;
  const micro=Math.min(fragmented,Math.floor(
   fragmented*activity*(fungi*.78+
    bacteriaIndex*.85)/90000
  ));
  fragmented-=micro;
  processed+=micro;
  sumShred+=shred;
  sumMicrobe+=micro;
 }
 const remaining=F({litterUnits:litter,
  fragmentedUnits:fragmented,
  processedProxyUnits:processed});
 const endMass=litter+fragmented+processed;
 const guard=endMass===startMass&&
  remaining.litterUnits>=0&&
  remaining.fragmentedUnits>=0&&
  remaining.processedProxyUnits>=0;
 if(!guard)return fail('shadow_organic_accounting_failed');
 return F({version:'0.3h',ok:true,
  sourceVersion:biotaState.version,
  sourceRevision:biotaState.revision,
  sourceMinute:biotaState.minute,
  zoneId,hours,
  microbialDecomposerIndexes:F({
   saprotrophicFungi:fungi,bacteria:bacteriaIndex
  }),
  detritivoreIndex:isopods,
  micrograzerIndex:springtails,
  plantKind:z.plant.kind,
  plantCoverUnits:z.plant.coverUnits,
  plantLightUnits:z.plant.lightUnits,
  // This is NOT a new plant biomass/cover growth law.
  plantIsDecomposer:false,
  plantPhotosynthesisProposedHere:false,
  plantGrowthOccursWithoutLightHere:false,
  springtailsDirectMineralizationContribution:0,
  isopodsDirectMineralizationContribution:0,
  temporaryFoodWebFlow:F({
   litterShreddedIntoFragmentsUnits:sumShred,
   fragmentsProcessedByMicrobesUnits:sumMicrobe
  }),
  conditions:F({temperatureC:temp,
   moistureProxy:moisture,
   activityCoefficientSynthetic:activity}),
  originalPools:start,proposedPools:remaining,
  sourceBookkeepingOrganicTotal:startMass,
  proposedBookkeepingOrganicTotal:endMass,
  syntheticProxyMassConserved:true,
  wasteInstantlyErased:false,
  caveGeothermalEnergyCreatesNoOrganics:true,
  noSpeciesSpecificPopulationSimulation:true,
  legacyV03aDecomposerFormulasUnchanged:true,
  shadowOnlyPendingAuthorityMigration:true,
  sourceStateUnmodified:true,
  formalGameSaveModified:false,
  ownSourceOfOrganicMatter:false
 });
}
