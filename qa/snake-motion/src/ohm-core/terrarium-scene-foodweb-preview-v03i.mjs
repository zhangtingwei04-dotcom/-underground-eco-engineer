/**
 * ECO V0.3i: a SCENE-LEVEL READ-ONLY foodweb comparison adapter.
 *
 * Source authority stays in V0.3d -> V0.3b -> V0.3a -> V0.2b:
 * geometry, 5-zone light, organic ledgers, water and game clock.
 *
 * V0.3h may propose role-corrected decomposition but never replaces,
 * double-applies or silently merges into source organic pools.
 * Intended for private ecology UI to compare two QA models safely.
 *
 * All organic flows, bacteria Index and temperature coefficients
 * are synthetic game-proxy values, not measured ecological rates
 * or real-world animal care advice. No formal save is edited.
 */
import {
 isValidTerrariumSceneGeometryV03d,
 advanceTerrariumSceneGeometryV03d
} from './terrarium-scene-geometry-v03d.mjs';
import {isValidTerrariumBiotaV03} from './terrarium-biota-v03a.mjs';
import {
 previewTerrariumFoodWebRoleFlowV03h,
 getTerrariumFoodWebRoleV03h
} from './terrarium-foodweb-roles-v03h.mjs';
export const TERRARIUM_SCENE_FOODWEB_PREVIEW_V03I_VERSION='0.3i';
const F=Object.freeze;
const validIndex=v=>Number.isSafeInteger(v)&&v>=0&&v<=1000;
function bad(reason,extra={}){
 return F({version:'0.3i',ok:false,reason,...extra,
  authoritativeSourceUnchanged:true,
  shadowPoolsNeverCommitted:true,
  realGameSaveModified:false});
}
const total=z=>z.litterUnits+z.fragmentedUnits+z.mineralUnits;
const takePools=z=>F({
 litterUnits:z.litterUnits,
 fragmentedUnits:z.fragmentedUnits,
 processedProxyUnits:z.mineralUnits
});
/**
 * Two models run from ONE verified scene at a game-time boundary:
 * - current V0.3a authoritative state advances normally.
 * - V0.3h alternative runs separately from PRE-ADVANCE source
 *   pools, never applying its output to the real scene.
 *
 * The two systems are NOT meant to be summed together.
 */
export function previewTerrariumSceneFoodWebV03i({
 scene,minutes=60,bacteriaIndexesByZone=null
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
  !Number.isInteger(minutes)||minutes<60||minutes>240||
  minutes%60!==0||
  scene.minute%60!==0)
  return bad('scene_or_time_not_valid_for_hourly_comparison');
 const from=scene.base.biota;
 if(!isValidTerrariumBiotaV03(from))
  return bad('invalid_authoritative_v03a_biota');
 const n=from.zones.length;
 const bacteria=bacteriaIndexesByZone===null?
  Array(n).fill(400):bacteriaIndexesByZone;
 if(!Array.isArray(bacteria)||bacteria.length!==n||
  !bacteria.every(validIndex))
  return bad('invalid_per_zone_bacteria_proxy');
 let after;
 try{after=advanceTerrariumSceneGeometryV03d(
  scene,{minutes});
 }catch(e){
  return bad('authoritative_scene_advance_rejected',
   {sourceError:e?.message??null});
 }
 const end=after.base.biota;
 if(end.zones.length!==n||end.minute!==scene.minute+minutes||
  end.environment.minute!==end.minute||
  !isValidTerrariumBiotaV03(end))
  return bad('source_advance_invalid_or_incomplete');
 const hours=minutes/60;
 const comparisons=from.zones.map((z,i)=>{
  const preview=previewTerrariumFoodWebRoleFlowV03h({
   biotaState:from,zoneId:z.id,
   bacteriaIndex:bacteria[i],hours
  });
  if(!preview.ok)return null;
  const authoritativePools=takePools(end.zones[i]);
  const sourceInitialPools=takePools(z);
  const proposed=preview.proposedPools;
  const expected=total(z);
  const conserved=total(end.zones[i])===expected&&
   proposed.litterUnits+proposed.fragmentedUnits+
    proposed.processedProxyUnits===expected;
  if(!conserved)return null;
  return F({
   id:z.id,
   sourceStart:sourceInitialPools,
   sourceAfterAuthoritativeAdvance:authoritativePools,
   alternativeReadOnlyAfterSameInterval:proposed,
   microbialDecomposerIndexes:preview.microbialDecomposerIndexes,
   isopodDetritivoreIndex:preview.detritivoreIndex,
   springtailMicrograzerIndex:preview.micrograzerIndex,
   currentPlantKind:z.plant.kind,
   plantRole: z.plant.kind==='none'?'no_plant':
    getTerrariumFoodWebRoleV03h(z.plant.kind)?.group??'unknown',
   plantSourceBefore:F({...z.plant}),
   plantSourceAfter:F({...end.zones[i].plant}),
   alternativeFragmentationUnits:
    preview.temporaryFoodWebFlow.litterShreddedIntoFragmentsUnits,
   alternativeMicrobialProcessingUnits:
    preview.temporaryFoodWebFlow.fragmentsProcessedByMicrobesUnits,
   noDoubleCount:true,
   sourceSceneOwnsLightAndMoisture:true,
   bothModelsProxyTotal:expected
  });
 });
 if(comparisons.some(x=>x===null))
  return bad('comparison_conservation_or_role_gate_failed');
 const beforeOrganic=from.ledger.initialUnits+
  from.ledger.addedUnits;
 const afterOrganic=end.ledger.initialUnits+
  end.ledger.addedUnits;
 if(beforeOrganic!==afterOrganic||
  comparisons.reduce((s,x)=>s+x.bothModelsProxyTotal,0)!==
   beforeOrganic)
  return bad('scene_ledger_nonconservation');
 return F({
  version:'0.3i',ok:true,
  sceneId:scene.sceneId,
  sceneRevisionBefore:scene.revision,
  sceneRevisionAfterCandidate:after.revision,
  fromMinute:scene.minute,toMinute:after.minute,
  periodMinutes:minutes,
  fiveZoneCount:n,
  sourceModel:'V0.3d/V0.3b/V0.3a authoritative ecology',
  shadowModel:'V0.3h alternative role flow, uncommitted',
  beforeLedger:F({...from.ledger}),
  afterLedger:F({...end.ledger}),
  authoritativeSceneCandidate:after,
  zones:F(comparisons),
  sourceModelOrganicTotalBefore:beforeOrganic,
  sourceModelOrganicTotalAfter:afterOrganic,
  noNewOrganicMatter:true,
  authoritativelyAdvancedWaterAndLightOnlyInSource:true,
  originalSceneStillUnmodified:true,
  shadowPoolsNeverCommitted:true,
  changedToFormalBiotaSchema:false,
  addedBacteriaToPlayerSave:false,
  playerInventoryUpdated:false,
  userVisibleNewSpriteRendered:false,
  exactMassCarbonNitrogenModel:false,
  realGameSaveModified:false
 });
}
