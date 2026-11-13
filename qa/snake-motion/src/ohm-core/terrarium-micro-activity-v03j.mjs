/**
 * ECO V0.3j — source-bound READ-ONLY micro-guild observation cues.
 *
 * Uses a real V0.3d five-zone snapshot and the already audited
 * V0.3i source-versus-shadow comparison. Only proposes a tiny
 * deterministic storyboard for fauna/mycelium in the DEV viewer.
 *
 * No individual is simulated: a small icon is an illustrative
 * visual cue, NEVER a census, reproduction, animal health result,
 * precise locomotion physics or exact spatial observation.
 *
 * REAL BIOLOGY caveats:
 * - Springtails have diverse diets; many eat fungi/bacteria and
 *   detritus. Jumping is optional and stimulus-dependent.
 * - Terrestrial isopods often seek damp cover and shred litter.
 * - Saprotrophic fungal mycelium is part of microbial decomposition;
 *   not all fungi are saprotrophs.
 * - Moss is a photosynthetic producer, never a decomposer.
 *
 * All rates, probabilities, icon positions and animation are
 * SYNTHETIC debug fixtures. Zero event/source writes.
 */
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';
import {previewTerrariumSceneFoodWebV03i}
 from './terrarium-scene-foodweb-preview-v03i.mjs';

export const TERRARIUM_MICRO_ACTIVITY_V03J_VERSION='0.3j';
const F=Object.freeze;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const bad=(reason)=>F({version:'0.3j',ok:false,reason,
 sourceSceneUnchanged:true,gameplayReadOnly:true,
 saveModified:false,visualOnly:true});
const hash=(seed,a,b,c)=> {
 let n=(seed^Math.imul(a+1,2246822507)^
  Math.imul(b+1,3266489909)^Math.imul(c+1,668265263))>>>0;
 n=Math.imul(n^(n>>>16),2246822507);
 n=Math.imul(n^(n>>>13),3266489909);
 return (n^(n>>>16))>>>0;
};
function zoneMoisture(soil){
 const s=soil.surface,r=soil.root;
 return clamp(.5*(s.capacityUnits>0?s.waterUnits/s.capacityUnits:0)+
  .5*(r.capacityUnits>0?r.waterUnits/r.capacityUnits:0),0,1);
}
const roleInfo=F([
 F({id:'isopod',label:'落葉碎屑取食者',kind:'detritivore',
  fact:'代表性鼠婦取食落葉；不代表已清除所有污物'}),
 F({id:'springtail',label:'菌食／微型消費者',kind:'micrograzer',
  fact:'可能攝食微生物與部分腐植；跳動不是必然行為'}),
 F({id:'mycelium',label:'腐生菌絲',kind:'microbial_decomposer',
  fact:'可見菌絲提示微生物活動，不等於真菌種數或健康診斷'})
]);
export const TERRARIUM_MICRO_ACTIVITY_ROLE_CATALOG_V03J=roleInfo;
/**
 * Source authority remains V0.3d and V0.3a; V0.3h indices/flow
 * are only for side-by-side developer diagnosis.
 * 
 * observedDisturbance is an intentional debug STIMULUS flag: jump
 * cues require both a grazer-viable zone and supplied disturbance.
 * It does NOT increment V0.3a event/observation ledgers.
 */
export function previewTerrariumMicroActivityV03j({
 scene,minutes=60,bacteriaIndexesByZone=null,
 observedDisturbance=false,seed=7919
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
  ![true,false].includes(observedDisturbance)||
  !Number.isSafeInteger(seed)||seed<0||seed>2147483647)
  return bad('invalid_scene_or_debug_observation_options');
 const before=JSON.stringify(scene);
 const comparison=previewTerrariumSceneFoodWebV03i({
  scene,minutes,bacteriaIndexesByZone
 });
 if(!comparison.ok)return bad('foodweb_comparison_rejected_'+comparison.reason);
 const rows=scene.base.biota.zones.map((zone,i)=>{
  const soil=scene.base.biota.environment.substrate.zones[i];
  const moisture=zoneMoisture(soil);
  const light=zone.plant.lightUnits;
  const plant=zone.plant.kind;
  const c=comparison.zones[i];
  const haveOrganics=c.sourceStart.litterUnits+
   c.sourceStart.fragmentedUnits>0;
  const fungi=c.microbialDecomposerIndexes.saprotrophicFungi;
  const bacteria=c.microbialDecomposerIndexes.bacteria;
  const iso=c.isopodDetritivoreIndex;
  const spring=c.springtailMicrograzerIndex;
  const activeEnvironment=moisture>.03&&
   scene.base.biota.environment.microclimate.cells[i].temperatureC>=8&&
   scene.base.biota.environment.microclimate.cells[i].temperatureC<=40;
  // Illustrative visible behavior, NOT life-stage or organism count.
  const isopodCue= iso===0?'absent':
   !activeEnvironment?'under_shelter':
   haveOrganics&&c.sourceStart.litterUnits>0?
    'litter_foraging':'seeking_cover';
  const springtailCue=spring===0?'absent':
   !activeEnvironment?'not_visible':
   !haveOrganics?'not_visible':
   (fungi+bacteria)>0?
    observedDisturbance?'disturbance_jump':'microbe_grazing':
    'on_detritus';
  const myceliumCue=fungi===0?'absent':
   !activeEnvironment||!haveOrganics?'not_visible':
   c.alternativeMicrobialProcessingUnits>0?
    'possible_decomposition':'filaments_near_organics';
  const cues=F([
   F({...roleInfo[0],state:isopodCue,
    visible:isopodCue==='litter_foraging',
    activityIsProxy:true}),
   F({...roleInfo[1],state:springtailCue,
    visible:['microbe_grazing','disturbance_jump','on_detritus']
     .includes(springtailCue),activityIsProxy:true}),
   F({...roleInfo[2],state:myceliumCue,
    visible:myceliumCue==='possible_decomposition'||
     myceliumCue==='filaments_near_organics',
    activityIsProxy:true})
  ]);
  return F({id:zone.id,zoneIndex:i,
   sourcePosition:F({...scene.zones[i]}),
   sourceMoisture:moisture,
   sourceLightUnits:light,
   photosyntheticPlantKind:plant,
   mossIsDecomposer:false,
   temperatureC:scene.base.biota.environment.microclimate.cells[i].temperatureC,
   observedDisturbanceIsDebugOnly:observedDisturbance,
   cues,
   sourceCurrentOrganic:F({...c.sourceStart}),
   sourceAfterOldFormula:F({...c.sourceAfterAuthoritativeAdvance}),
   alternativeAfterV03h:F({...c.alternativeReadOnlyAfterSameInterval}),
   alternativeFragmentationUnits:c.alternativeFragmentationUnits,
   alternativeMicrobialProcessingUnits:c.alternativeMicrobialProcessingUnits,
   sourceTotalOrganicUnits:c.bothModelsProxyTotal,
   shadowRateNotBiological:false,
   bacteriaIndexSyntheticOnly:bacteria,
   observationIsNotOrganismCount:true
  });
 });
 const snapshot=F({version:'0.3j',ok:true,
  sceneId:scene.sceneId,revision:scene.revision,
  fromMinute:scene.minute,
  toMinute:comparison.toMinute,
  minutes:comparison.periodMinutes,seed,
  observedDisturbance,
  zones:F(rows),zoneCount:rows.length,
  sourceSceneCandidate:comparison.authoritativeSceneCandidate,
  sourceLedgerBefore:comparison.beforeLedger,
  sourceLedgerAfter:comparison.afterLedger,
  sourceOrganicTotal:comparison.sourceModelOrganicTotalBefore,
  afterSourceOrganicTotal:comparison.sourceModelOrganicTotalAfter,
  sourceSceneUnchanged:JSON.stringify(scene)===before,
  sourceWaterLightClockAuthoritative:true,
  foodwebShadowNeverCommitted:true,
  roleSpecificMicroActivityVisible:true,
  spriteCountIsNotAnimalPopulation:true,
  fungusSpriteIsNotActualBiomass:true,
  periodicFramesOnlyVisual:true,
  noDailyPlayerObligations:true,
  allRatesSynthetic:true,gameplayReadOnly:true,
  saveModified:false
 });
 return snapshot.sourceSceneUnchanged?snapshot:
  bad('source_scene_unexpected_mutation');
}
/**
 * Deterministic 8-phase pose samples. Source scenes are never
 * advanced by a rendering frame; all positions are normalized to
 * individual zone cells, not exact tracked animal positions.
 */
export function sampleTerrariumMicroActivityFrameV03j({
 preview,phase=0
}={}){
 if(preview?.version!=='0.3j'||preview.ok!==true||
  preview.zoneCount!==5||preview.zones.length!==5||
  !Number.isInteger(phase)||phase<0||phase>7)
  return bad('invalid_activity_frame_request');
 const samples=[];
 for(const zone of preview.zones){
  for(const cue of zone.cues){
   if(!cue.visible)continue;
   const role=cue.id;
   const count=role==='mycelium'?2:role==='isopod'?2:3;
   for(let i=0;i<count;i++){
    const h=hash(preview.seed,zone.zoneIndex,
     i,role==='isopod'?1:role==='springtail'?2:3);
    const baseX=.16+(h%600)/1000;
    const baseY=.24+((h>>>10)%520)/1000;
    const speed=role==='mycelium'?0:
     role==='isopod'?.012:.018;
    const drift=speed*Math.sin(phase*Math.PI/4+i*.9);
    const jump=role==='springtail'&&
     cue.state==='disturbance_jump'?
      .06*Math.sin(phase*Math.PI/7):0;
    samples.push(F({zoneId:zone.id,zoneIndex:zone.zoneIndex,
     role,sceneRole:cue.kind,state:cue.state,
     localX:clamp(baseX+drift,.04,.96),
     localY:clamp(baseY-jump,.04,.94),
     magnitude:role==='mycelium'?
      .04+.012*Math.sin(phase*Math.PI/7):
      role==='isopod'?.018:.009,
     illustrativeNotIndividualTracked:true,
     biologicalActionRateNotCertified:true}));
   }
  }
 }
 return F({version:'0.3j',ok:true,phase,
  frameCountInCycle:8,sceneId:preview.sceneId,
  fromMinute:preview.fromMinute,toMinute:preview.toMinute,
  markers:F(samples),
  markerCount:samples.length,
  stateValuesUnmodified:true,
  frameNeverMovesWorldClock:true,
  playerHasNoExtraDailyChore:true,
  gameSaveModified:false});
}
