/**
 * Project OHM ECO V0.3q — deterministic cosmetic plant/stone individuality.
 *
 * Consume the existing V0.3e immutable render frame. Never invent species,
 * actual individual organisms, mineral chemistry, substrate pH, welfare,
 * light/heat/humidity modifiers, observations or saved ecology events.
 *
 * Visual "specimens" here mean ZONE PATCH or scene OBJECT until an explicit,
 * authoritative per-specimen identity model is created. "mineralUnits" in the
 * V0.3a organic ledger is NOT a geological stone/mineral inventory.
 *
 * Read-only, no Phaser/DOM/network/localStorage/clock/random entropy.
 */
export const TERRARIUM_NATURAL_VARIATION_V03Q_VERSION='0.3q';
const F=Object.freeze;
const validId=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(x);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const bounded=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
const integer=(n,a,b)=>Number.isSafeInteger(n)&&n>=a&&n<=b;
const err=key=>{throw new RangeError(key)};
const hash=value=>{
 let h=2166136261;
 for(let i=0;i<value.length;i++)h=Math.imul(h^value.charCodeAt(i),16777619);
 return h>>>0;
};
const unit=(seed,salt)=>{
 let x=(seed^Math.imul(salt+1,0x9e3779b1))>>>0;
 x=Math.imul(x^(x>>>16),0x85ebca6b)>>>0;
 x=Math.imul(x^(x>>>13),0xc2b2ae35)>>>0;
 return ((x^(x>>>16))>>>0)/4294967296;
};
const q=(n)=>Number(n.toFixed(3));
const materialProfiles=F({
 unspecified_rock:F({category:'unknown_rock',surface:'unclassified',
   palette:'neutral_rock',pattern:'irregular_edges'}),
 slate:F({category:'rock',surface:'cleavage_proxy',
   palette:'cool_grey',pattern:'thin_layers'}),
 basalt:F({category:'rock',surface:'roughness_proxy',
   palette:'dark_ash',pattern:'fine_speckles'}),
 limestone:F({category:'rock',surface:'sedimentary_proxy',
   palette:'warm_chalk',pattern:'soft_layers'}),
 quartz:F({category:'mineral',surface:'crystal_faces_proxy',
   palette:'translucent_cream',pattern:'angular_facets'})
});
export const TERRARIUM_V03Q_MATERIAL_DISPLAY_TYPES=F(
 Object.keys(materialProfiles)
);
/**
 * Build stable details, keyed to actual V0.3e zone/object ID and kind.
 *
 * materialByObjectId is only a VISUAL label supplied by the caller;
 * no rock/mineral species is inferred from geometry, stone color, or the
 * old 'mineralUnits' decomposition ledger. Do not use this as husbandry data.
 */
export function buildTerrariumNaturalVariationV03q(frame,{
 materialByObjectId={}
}={}){
 if(!record(frame)||frame.version!=='0.3e'||!validId(frame.sceneId)||
  !Array.isArray(frame.zones)||!Array.isArray(frame.objects)||
  !record(materialByObjectId)||Array.isArray(materialByObjectId))
  err('invalid_variation_frame');
 const validMaterials=Object.keys(materialByObjectId);
 if(validMaterials.length>12||validMaterials.some(id=>
    !validId(id)||!Object.hasOwn(materialProfiles,materialByObjectId[id])))
  err('invalid_visual_material_dictionary');
 const usedRockIds=new Set();
 const flora=frame.zones.map(z=>{
  if(!record(z)||!validId(z.id)||
    !['none','moss','fern'].includes(z.plantKind)||
    !integer(z.plantCoverUnits,0,1000)||
    (z.plantKind==='none'&&z.plantCoverUnits!==0)||
    !bounded(z.rootMoistureIndex,0,1))
   err('invalid_variation_plant_patch');
  const present=z.plantKind!=='none'&&z.plantCoverUnits>0;
  if(!present)return F({id:z.id,kind:null,present:false,detail:null,
    identityScope:'zone_patch_not_an_individual_plant'});
  // One seed per ID + plant kind. Appearance never changes just because
  // a player switches camera, redraws a frame, or pauses/resumes a session.
  const seed=hash(frame.sceneId+'/'+z.id+'/'+z.plantKind);
  const isFern=z.plantKind==='fern';
  const morphology=F({
   variant:seed%16,
   leafLeanDegrees:q((unit(seed,0)-.5)*(isFern?22:11)),
   silhouetteWidth:q(.91+unit(seed,1)*.18),
   tipLength:q(.93+unit(seed,2)*.15),
   clusterOffset:q((unit(seed,3)-.5)*.14),
   colorTintStep:Math.floor(unit(seed,4)*5)-2,
   surfaceGrain:Math.floor(unit(seed,5)*5)
  });
  const display=F({
   coverScale:q(z.plantCoverUnits/1000),
   apparentDensity:Math.max(1,Math.round(z.plantCoverUnits/80)),
   // V0.3e exposes root moisture, not measured leaf hydration. Only
   // a small decorative gloss for ferns. Moss surface water is unknown.
   glossHint:isFern?q(.02+z.rootMoistureIndex*.09):null,
   status:'cosmetic_projection_not_measurement_or_biomass'
  });
  return F({id:z.id,kind:z.plantKind,present:true,
    identityScope:'zone_patch_not_an_individual_plant',
    detail:F({morphology,display})});
 });
 const stones=frame.objects.filter(o=>o?.kind==='rock_overhang')
  .map(o=>{
   if(!validId(o.id)||usedRockIds.has(o.id))err('invalid_rock_id');
   usedRockIds.add(o.id);
   const material=Object.hasOwn(materialByObjectId,o.id)
    ?materialByObjectId[o.id]:'unspecified_rock';
   const profile=materialProfiles[material];
   const seed=hash(frame.sceneId+'/'+o.id+'/'+material);
   const pattern=F({
    variant:seed%16,
    grainDensity:Math.floor(unit(seed,0)*5),
    facetSkewDegrees:q((unit(seed,1)-.5)*16),
    fractureOffset:q((unit(seed,2)-.5)*.22),
    edgeIrregularity:q(.02+unit(seed,3)*.1),
    colorTintStep:Math.floor(unit(seed,4)*5)-2,
    veinDirectionDegrees:q((unit(seed,5)-.5)*50)
   });
   return F({id:o.id,material,
    classification:profile.category,
    palette:profile.palette,patternName:profile.pattern,
    surfaceTrait:profile.surface,pattern,
    identityScope:'scene_object_not_chemical_mineral_assay',
    status:'cosmetic_only_no_rock_growth_or_unverified_buffs'});
  });
 // Caller cannot assign a material to imaginary/non-rock scene objects.
 if(validMaterials.some(id=>!usedRockIds.has(id)))
  err('visual_material_without_a_matching_rock');
 if(flora.length>12||stones.length>12||
    new Set(flora.map(p=>p.id)).size!==flora.length)
  err('duplicate_or_excess_visual_items');
 return F({
  version:TERRARIUM_NATURAL_VARIATION_V03Q_VERSION,
  sceneId:frame.sceneId,
  viewIndependent:true,
  flora:F(flora),stones:F(stones),
  authority:'V0.3e_projection_only',
  ecologicalEffects:F([]),
  visualStatus:'stable_cosmetic_variation_not_species_or_geological_simulation'
 });
}
