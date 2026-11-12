/**
 * Project OHM V0.7J — deterministic, READ-ONLY front-glass foliage composition.
 * The V0.7I authority owns every source patch and its rooted morphology.
 * This layer only chooses a less cluttered subset of existing fern fronds,
 * opens their fan gradually away from the unchanged soil root, and narrows
 * leaflet art. It cannot create plants, change soil, ecology, terrain,
 * snake motion, species facts, saves or cloud state.
 */
export const SNAKE_BOTANY_COMPOSITION_VERSION='0.7J';
const freeze=Object.freeze;
const point=(x,y)=>freeze({
 x:Math.round(x*1000)/1000,y:Math.round(y*1000)/1000
});
function transformFrond(frond,root,fan){
 const warp=p=>{
  // Zero displacement at soil contact; stronger separation in the canopy.
  const elevation=Math.max(0,root.y-p.y);
  return point(p.x+fan*.17*elevation,p.y);
 };
 const stipe=freeze(frond.stipe.map(warp));
 const rachis=freeze(frond.rachis.map(warp));
 const pinnae=freeze(frond.pinnae.map(p=>{
  const base=warp(p.base),tip=warp(p.tip);
  const mid=point((base.x+tip.x)/2,(base.y+tip.y)/2);
  const narrow=p0=>{
   const shifted=warp(p0);
   return point(mid.x+(shifted.x-mid.x)*.66,
                mid.y+(shifted.y-mid.y)*.66);
  };
  // Existing four-point spear shape; no extra leaflet, no new attachment.
  const blade=freeze([base,narrow(p.blade[1]),tip,narrow(p.blade[3])]);
  return freeze({
   ...p,base,tip,blade,
   attachmentToRachis:freeze({
    from:warp(p.attachmentToRachis.from),
    to:base
   })
  });
 }));
 return freeze({...frond,stipe,rachis,pinnae,
  tip:warp(frond.tip),root,
  visualTreatment:'spaced_fan_narrow_pinnae_not_new_botanical_growth'});
}
export function composeSnakeBotanyV07j(rooted){
 if(!rooted||rooted.version!=='0.7I'||
   !Array.isArray(rooted.patches)||rooted.patches.length>100||
   rooted.skinApplied!==false)
  throw new RangeError('v07j_requires_transparent_v07i_authority');
 const ids=new Set();
 const patches=rooted.patches.map(p=>{
  if(!p||ids.has(p.id)||!Number.isFinite(p.root?.x)||
     !Number.isFinite(p.root?.y)||p.appearanceOnly!==true||
     p.root.x!==p.sourceAnchor?.x||p.root.y!==p.sourceAnchor?.y||
     p.soilBase?.center?.x!==p.root.x||
     p.soilBase?.center?.y!==p.root.y||
     !['moss','fern'].includes(p.type)||p.kind!==p.type)
   throw new RangeError('v07j_untrusted_root_or_patch');
  ids.add(p.id);
  if(p.type==='moss'){
   if(!Array.isArray(p.shoots)||!Array.isArray(p.carpet)||
      !Array.isArray(p.cushions)||p.fronds?.length!==0)
    throw new RangeError('v07j_untrusted_moss');
   // Preserve existing moss cushions/carpet and ALL rooted leafy stems.
   return freeze({...p,composition:'source_moss_unaltered'});
  }
  if(!Array.isArray(p.fronds)||p.fronds.length<4||
     p.fronds.length>6)
   throw new RangeError('v07j_untrusted_fern');
  const n=p.fronds.length;
  const chosen=[0,Math.floor((n-1)/2),n-1];
  const fronds=freeze(chosen.map(index=>{
   const source=p.fronds[index];
   if(source.root?.x!==p.root.x||source.root?.y!==p.root.y||
      source.stipe?.[0]?.x!==p.root.x||
      source.stipe?.[0]?.y!==p.root.y||
      !Array.isArray(source.pinnae)||source.pinnae.length<12)
    throw new RangeError('v07j_detached_source_frond');
   const fan=index/(n-1)*2-1;
   return transformFrond(source,p.root,fan);
  }));
  return freeze({
   ...p,fronds,sourceFrondCount:n,
   hiddenFrondCount:n-fronds.length,
   composition:'three_existing_fronds_spaced_with_unmoved_soil_root'
  });
 });
 return freeze({
  ...rooted,version:SNAKE_BOTANY_COMPOSITION_VERSION,
  patches:freeze(patches),skinApplied:false,
  sourceVersion:'0.7I',
  effectOnEcology:freeze([]),
  status:'read_only_fern_composition_not_growth_or_3d_geometry'
 });
}
