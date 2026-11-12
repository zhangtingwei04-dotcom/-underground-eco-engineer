/**
 * Project OHM V0.7K — cosmetic soil-to-moss edge blending for the private
 * front-glass lab. Input is V0.7J's original, source-rooted foliage.
 *
 * NOT rhizoids, plant growth, soil physics, mineral units or new organisms.
 * Pure deterministic screen-space soil art; leaves V0.3d world, V0.3q
 * fingerprint, V0.7I/J botanics, snake geometry and saves unchanged.
 */
export const SNAKE_MOSS_SOIL_VERSION='0.7K';
const F=Object.freeze;
const q=x=>Math.round(x*1000)/1000;
const point=(x,y)=>F({x:q(x),y:q(y)});
const polygon=points=>F(points.map(p=>point(p.x,p.y)));
const finite=x=>Number.isFinite(x);
const validMoss=p=>p&&p.type==='moss'&&p.kind==='moss'&&
 p.appearanceOnly===true&&p.composition==='source_moss_unaltered'&&
 p.root&&p.sourceAnchor&&p.soilBase&&
 finite(p.root.x)&&finite(p.root.y)&&
 p.root.x===p.sourceAnchor.x&&p.root.y===p.sourceAnchor.y&&
 p.soilBase.center?.x===p.root.x&&
 p.soilBase.center?.y===p.root.y&&
 finite(p.soilBase.width)&&p.soilBase.width>0&&p.soilBase.width<120&&
 finite(p.soilBase.height)&&p.soilBase.height>0&&p.soilBase.height<40&&
 ['carpet_proxy','cushion_proxy'].includes(p.visualGrowthHabit)&&
 Array.isArray(p.shoots)&&p.shoots.length>=11&&
 Array.isArray(p.fronds)&&p.fronds.length===0;
function transition(p){
 const {x,y}=p.root,w=p.soilBase.width,h=p.soilBase.height;
 // Both lips close within the original source patch's soil collar.
 // Sampled small oscillations avoid a single geometric sticker edge.
 const upper=[],lower=[];
 const carpet=p.visualGrowthHabit==='carpet_proxy';
 for(let i=0;i<=12;i++){
  const u=i/12,centerWeight=1-Math.abs(2*u-1);
  const px=x+(u*2-1)*w;
  const irregular=Math.sin((i+1)*2.31+p.id.length*.71)*h*.18;
  upper.push(point(px,y-h*(.24+centerWeight*(carpet?.50:.67))+irregular));
  lower.push(point(px,y+h*(.17+centerWeight*.22)));
 }
 // Back shadow is BELOW the low moss tuft and clipped to the source collar.
 const backBlend=polygon([
  ...upper,...lower.slice().reverse()
 ]);
 // Frontsoil seam partially buries stems; no implied new soil thickness.
 const frontTop=[],frontBottom=[];
 for(let i=0;i<=12;i++){
  const u=i/12,centerWeight=1-Math.abs(2*u-1);
  const px=x+(u*2-1)*w*.91;
  frontTop.push(point(px,y-h*(.02+.32*centerWeight)+
    Math.sin(i*3.43+p.id.length)*h*.10));
  frontBottom.push(point(px,y+h*(.48+.2*centerWeight)));
 }
 const frontBlend=polygon([...frontTop,...frontBottom.slice().reverse()]);
 const sediment=F(Array.from({length:9},(_,i)=>{
  const u=(i+.5)/9,offset=(u*2-1);
  return F({
   center:point(x+offset*w*.84,
    y+h*(.05+.31*((i*3+p.id.length)%5)/4)),
   radius:q(Math.max(.35,Math.min(1.45,h*(.11+(i%3)*.045)))),
   role:'nonliving_soil_art_grain'
  });
 }));
 return F({
  id:p.id,zoneId:p.zoneId,root:p.root,
  sourceRoot:p.sourceAnchor,backBlend,frontBlend,sediment,
  role:'nonliving_substrate_edge_art_not_new_moss_or_root',
  sourceHabit:p.visualGrowthHabit
 });
}
export function buildMossSoilTransitionsV07k(botany){
 if(!botany||botany.version!=='0.7J'||botany.sourceVersion!=='0.7I'||
    botany.skinApplied!==false||!Array.isArray(botany.patches)||
    botany.patches.length>100)
  throw new RangeError('v07k_requires_transparent_v07j_authority');
 const seen=new Set();
 const transitions=[];
 for(const p of botany.patches){
  if(!p||typeof p.id!=='string'||seen.has(p.id))
   throw new RangeError('v07k_duplicate_or_invalid_patch');
  seen.add(p.id);
  if(p.type==='moss'){
   if(!validMoss(p))throw new RangeError('v07k_detached_or_invalid_moss');
   transitions.push(transition(p));
  }else if(p.type!=='fern'){
   throw new RangeError('v07k_unknown_plant_type');
  }
 }
 return F({
  version:SNAKE_MOSS_SOIL_VERSION,
  sourceVersion:'0.7J',sceneId:botany.sceneId,
  sceneRevision:botany.sceneRevision,
  transitions:F(transitions),
  effectsOnEcology:F([]),
  skinApplied:false,
  status:'read_only_substrate_visual_edge_not_moss_growth_or_true_3d_contact'
 });
}
