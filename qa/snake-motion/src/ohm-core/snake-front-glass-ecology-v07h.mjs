/**
 * Project OHM SNAKE/ECO V0.7H — source-owned botanical/stone artwork descriptors
 * for a fixed FRONT GLASS observation camera.
 *
 * V0.3d owns zones and actual placed object footprints. V0.3e provides the
 * read-only 5-zone biology/light projection consumed by V0.3q's deterministic
 * moss, fern and explicit rock-material cosmetic fingerprints.
 *
 * This module draws nothing, changes no ecology, grants no rock 'buffs',
 * does not invent single plant identities or real measured growth, and never
 * writes player saves. It is a private technical render descriptor only.
 */
import {
 createTerrariumRenderCameraV03e,
 projectTerrariumSceneForRenderV03e
} from './terrarium-scene-render-projection-v03e.mjs';
import {buildTerrariumNaturalVariationV03q}
 from './terrarium-natural-variation-v03q.mjs';
import {
 FRONT_GLASS_CAMERA_V07G,
 projectSnakeFrontGlassPointV07g
} from './snake-front-glass-projection-v07g.mjs';
import {terrariumFloorToSnakeV07c,snakeFloorToTerrariumV07c}
 from './snake-terrarium-corridor-v07c.mjs';
import {isValidTerrariumSceneGeometryV03d}
 from './terrarium-scene-geometry-v03d.mjs';

export const SNAKE_FRONT_GLASS_ECOLOGY_VERSION='0.7H';
const F=Object.freeze;
const fail=s=>{throw new RangeError(s)};
const valid=(x)=>typeof x==='number'&&Number.isFinite(x);
const q=x=>Math.round(x*1000)/1000;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const point=(x,y,z=0)=>projectSnakeFrontGlassPointV07g({
 ...terrariumFloorToSnakeV07c({x:q(x),y:q(y)}),z
});
const seedOf=str=>{
 let h=2166136261;
 for(let i=0;i<str.length;i++)h=Math.imul(h^str.charCodeAt(i),16777619);
 return h>>>0;
};
function specimenPatch(zone,entry,i,view){
 const morph=entry.detail.morphology,display=entry.detail.display;
 const seed=seedOf(zone.id+'/'+entry.kind+'/'+i+'/'+morph.variant);
 const col=i%4,row=Math.floor(i/4);
 const x=clamp(zone.x+zone.width*(.09+.205*col+
   row*.035)+morph.clusterOffset*zone.width+
   ((seed%11)-5)*.42,zone.x+7,zone.x+zone.width-7);
 // Rear and foreground are world-ground Y positions, not screen Y.
 // These are cosmetic anchors for a patch, NOT plant occurrence records.
 const y=zone.y+zone.depth*(i%2===0?
  (.17+(seed%8)*.007):(.75+(seed%9)*.009));
 const anchor=point(x,y);
 return F({
  id:zone.id+'_patch_'+i,
  zoneId:zone.id,plantKind:entry.kind,
  sourcePlantKind:entry.kind,
  world:F({x:q(x),y:q(y)}),anchor,
  visualRole:'representative_zone_patch_not_an_individual',
  coverScale:display.coverScale,
  tintStep:morph.colorTintStep,
  grain:morph.surfaceGrain,
  leafLeanDegrees:morph.leafLeanDegrees,
  silhouetteWidth:morph.silhouetteWidth,
  tipLength:morph.tipLength,
  variant:morph.variant,
  // Each patch scale is visual only. Cover is the SOURCE authority,
  // not a claim about real fern height, leaf count or photosynthesis.
  size:q((entry.kind==='fern'?55:25)*
    (.78+.42*display.coverScale)*
    (.88+(morph.variant%5)*.075)),
  worldLayer:y<200?'rear_half':'front_half',
  status:'read_only_cosmetic_no_measured_individual_size'
 });
}
function stoneDescriptor(source,skin){
 const centerX=source.x+source.width/2,
   centerY=source.y+source.depth/2;
 return F({
  id:source.id,kind:source.kind,
  material:skin.material,
  classification:skin.classification,
  patternName:skin.patternName,
  palette:skin.palette,
  pattern:skin.pattern,
  world:F({
   x:source.x,y:source.y,width:source.width,
   depth:source.depth,height:source.height
  }),
  anchor:point(centerX,centerY),
  widthPx:q(source.width/1000*1304),
  artHeightPx:q(clamp(source.height*.165,22,100)),
  worldLayer:centerY<200?'rear_half':'front_half',
  status:'v03d_object_footprint_v03q_cosmetic_surface_no_solid_mesh'
 });
}
/** Descriptors alone: don't mutate or wrap authoritative biology. */
export function buildSnakeFrontGlassEcologyV07h(scene,{
 materialByObjectId={}
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene))
  fail('invalid_front_glass_ecology_scene');
 const base=projectTerrariumSceneForRenderV03e(scene,{
  camera:createTerrariumRenderCameraV03e({
   view:'oblique',width:1200,height:640,padding:25
  })
 });
 const cosmetic=buildTerrariumNaturalVariationV03q(base,{
  materialByObjectId
 });
 const flora=[];
 for(const entry of cosmetic.flora){
  if(!entry.present)continue;
  const zone=scene.zones.find(z=>z.id===entry.id);
  if(!zone)fail('variation_zone_without_source');
  // Density is EXISTING V0.3a cover-derived information. Some zones
  // truly have zero cover and MUST NOT be drawn as planted.
  const count=clamp(Math.ceil(entry.detail.display.apparentDensity*1.05),1,10);
  for(let i=0;i<count;i++)flora.push(specimenPatch(zone,entry,i));
 }
 const stones=cosmetic.stones.map(entry=>{
  const o=scene.objects.find(s=>s.id===entry.id);
  if(!o||o.kind!=='rock_overhang')fail('variation_stone_without_source');
  return stoneDescriptor(o,entry);
 });
 return F({
  version:SNAKE_FRONT_GLASS_ECOLOGY_VERSION,
  sceneId:scene.sceneId,sceneRevision:scene.revision,
  camera:FRONT_GLASS_CAMERA_V07G.view,
  flora:F(flora),stones:F(stones),
  zonePatches:F(cosmetic.flora),
  materials: F(Object.entries(materialByObjectId)
   .sort(([a],[b])=>a.localeCompare(b))
   .map(([id,material])=>F({id,material}))),
  source:'V0.3d_scene_V0.3e_biology_V0.3q_cosmetics',
  worldChanges:F([]),ecologicalEffects:F([]),
  status:'front_glass_readonly_art_not_actual_single_organisms_or_physics'
 });
}
/**
 * Split each independent decorative patch/stone according to actual snake
 * WORLD GROUND Y (rather than its *screen* Y). The snake moves and turns
 * across depth; don't treat a screenshot row as a collision/occlusion rule.
 *
 * For partially overlapping depth intervals we do NOT claim exact 3D
 * segmentation: mark them 'mixed_unresolved' and draw behind the snake,
 * keeping the engineering wireframe visible instead of masking errors.
 */
export function classifyFrontGlassEcologyDepthV07h(ecology,pose){
 if(ecology?.version!==SNAKE_FRONT_GLASS_ECOLOGY_VERSION||
    !pose||!Array.isArray(pose.points)||pose.points.length<8||
    pose.points.some(p=>!p||!valid(p.x)||!valid(p.y)))
  fail('invalid_front_glass_depth_input');
 let min=Infinity,max=-Infinity;
 for(const p of pose.points){
  const xy=snakeFloorToTerrariumV07c({x:p.x,y:p.y});
  min=Math.min(min,xy.y);max=Math.max(max,xy.y);
 }
 const classify=e=>{
  const depth=e.world.y;
  const layer=depth<=min?'behind_snake':
    depth>=max?'in_front_of_snake':'mixed_unresolved';
  return F({...e,drawLayer:layer});
 };
 const items=F([
  ...ecology.flora.map(classify),...ecology.stones.map(e=>
   classify({...e,world:{...e.world,y:e.world.y+e.world.depth/2}}))
 ]);
 return F({
  version:SNAKE_FRONT_GLASS_ECOLOGY_VERSION,
  sceneId:ecology.sceneId,sceneRevision:ecology.sceneRevision,
  behind:F(items.filter(x=>x.drawLayer==='behind_snake')),
  front:F(items.filter(x=>x.drawLayer==='in_front_of_snake')),
  unresolved:F(items.filter(x=>x.drawLayer==='mixed_unresolved')),
  snakeWorldDepthRange:F({minY:q(min),maxY:q(max)}),
  status:'coarse_world_depth_visual_layering_no_occlusion_mesh'
 });
}
