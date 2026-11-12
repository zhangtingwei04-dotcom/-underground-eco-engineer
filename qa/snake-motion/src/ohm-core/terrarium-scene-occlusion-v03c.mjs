/**
 * Project OHM ECO V0.3c: scene occlusion contract for existing V0.3b light.
 * 1-dimensional local zone spans are SCENE GEOMETRY PROXIES only.
 * Actual light belongs to V0.3b; this adapter provides its deterministic
 * local transmission mask (0..1000). No true ray casting, PPFD or welfare.
 *
 * Each overhang/canopy/rock occluder has fractional zone coverage and
 * transmission. The masks multiply, bounded to [0,1000], with no arbitrary
 * ambient light created. Plant cover is a display proxy, not biomass.
 * No persistence, networking, Phaser or wall-clock time.
 */
import {
 createTerrariumEcologyLightV03b,isValidTerrariumEcologyLightV03b,
 advanceTerrariumEcologyLightV03b,applyTerrariumEcologyLightV03bEvent,
 setTerrariumEcologyLightTransmissionV03b,
 inspectTerrariumEcologyLightV03b,
 buildTerrariumEcologyLightV03bActionSnapshot
} from './terrarium-ecology-light-v03b.mjs';

export const TERRARIUM_SCENE_OCCLUSION_V03C_VERSION='0.3c';
const freeze=Object.freeze;
const fail=m=>{throw new RangeError(m)};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>obj(x)&&Object.keys(x).every(k=>keys.includes(k));
const integer=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(x);
const allowed=['rock_overhang','canopy','screen'];
function normalize(x,zoneCount){
 if(!exact(x,['id','kind','startZone','endZone','coveragePermille','transmissionPermille'])||
    !id(x.id)||!allowed.includes(x.kind)||
    !integer(x.startZone,zoneCount-1)||
    !integer(x.endZone,zoneCount-1)||x.startZone>x.endZone||
    !integer(x.coveragePermille,1000)||
    !integer(x.transmissionPermille,1000))
   fail('invalid_scene_occluder');
 return freeze({...x});
}
function validOccluders(items,n){
 if(!Array.isArray(items)||items.length>16)return false;
 const ids=new Set();
 try{
  for(const item of items){
   const normalized=normalize(item,n);
   if(ids.has(normalized.id))return false;
   ids.add(normalized.id);
  }
  return true;
 }catch{return false}
}
function lightMask(items,n){
 const result=Array(n).fill(1000);
 for(const o of items){
  const one=1000-Math.floor(
    o.coveragePermille*(1000-o.transmissionPermille)/1000);
  for(let i=o.startZone;i<=o.endZone;i++)
   result[i]=Math.floor(result[i]*one/1000);
 }
 return result;
}
const same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
const wrap=(base,items,revision,sceneId)=>freeze({
 schemaVersion:6,version:TERRARIUM_SCENE_OCCLUSION_V03C_VERSION,
 minute:base.minute,revision,sceneId,
 base,occluders:freeze(items.map(x=>freeze({...x})))
});
export function isValidTerrariumSceneOcclusionV03c(s){
 try{
  if(!obj(s)||s.schemaVersion!==6||
     s.version!==TERRARIUM_SCENE_OCCLUSION_V03C_VERSION||
     !integer(s.minute,10000000)||!integer(s.revision,10000000)||
     !id(s.sceneId)||!isValidTerrariumEcologyLightV03b(s.base)||
     s.minute!==s.base.minute||
     !validOccluders(s.occluders,s.base.biota.zones.length))
    return false;
  return same(lightMask(s.occluders,s.base.biota.zones.length),
    s.base.transmissionByZone);
 }catch{return false;}
}
/** Compose existing scene data with a V0.3b state; no saved-game migration. */
export function createTerrariumSceneOcclusionV03c({
 base=null,baseOptions={},sceneId='terrarium_test',occluders=[]
}={}){
 if(!exact(baseOptions,['biota','biotaOptions','fixtures','speciesByZone',
                       'transmissionByZone']))
  fail('invalid_scene_creation_options');
 let b=base??createTerrariumEcologyLightV03b(baseOptions);
 if(!isValidTerrariumEcologyLightV03b(b)||!id(sceneId)||
    !validOccluders(occluders,b.biota.zones.length))
  fail('invalid_scene_creation');
 const mask=lightMask(occluders,b.biota.zones.length);
 if(!same(b.transmissionByZone,mask))
  b=setTerrariumEcologyLightTransmissionV03b(b,mask);
 const s=wrap(b,occluders,0,sceneId);
 if(!isValidTerrariumSceneOcclusionV03c(s))
  fail('invalid_scene_created');
 return s;
}
/** V0.3b remains the actual light authority and runs one game-minute clock.
 * The occlusion mask does not have a second independent climate timer.
 */
export function advanceTerrariumSceneOcclusionV03c(state,{minutes=1}={}){
 if(!isValidTerrariumSceneOcclusionV03c(state)||
    !Number.isInteger(minutes)||minutes<1||minutes>240||
    state.minute+minutes>10000000||state.revision+minutes>10000000)
  fail('invalid_scene_minutes');
 const base=advanceTerrariumEcologyLightV03b(state.base,{minutes});
 const next=wrap(base,state.occluders,state.revision+minutes,state.sceneId);
 if(!isValidTerrariumSceneOcclusionV03c(next))
  fail('invalid_scene_step');
 return next;
}
/** Scene occluders are the only writers of V0.3b zone transmissions.
 * Other events must explicitly delegate to V0.3b's audited channel contract.
 */
export function applyTerrariumSceneOcclusionV03cEvent(state,event){
 if(!isValidTerrariumSceneOcclusionV03c(state)||
    state.revision>=10000000||!obj(event))
  fail('invalid_scene_event');
 let occluders=state.occluders,base=state.base;
 if(event.channel==='occluder'){
  if(event.type==='upsert'){
   if(!exact(event,['channel','type','occluder']))
    fail('invalid_occluder_event');
   const o=normalize(event.occluder,base.biota.zones.length);
   occluders=occluders.filter(x=>x.id!==o.id).concat([o]);
  }else if(event.type==='remove'){
   if(!exact(event,['channel','type','id'])||!id(event.id)||
      !occluders.some(x=>x.id===event.id))
    fail('invalid_occluder_remove');
   occluders=occluders.filter(x=>x.id!==event.id);
  }else fail('unknown_occluder_event');
  if(!validOccluders(occluders,base.biota.zones.length))
   fail('invalid_occluder_collection');
  const mask=lightMask(occluders,base.biota.zones.length);
  if(!same(base.transmissionByZone,mask))
   base=setTerrariumEcologyLightTransmissionV03b(base,mask);
 }else if(event.channel==='base'){
  if(!exact(event,['channel','event'])||!obj(event.event))
   fail('invalid_scene_base_event');
  base=applyTerrariumEcologyLightV03bEvent(base,event.event);
 }else fail('unknown_scene_channel');
 const next=wrap(base,occluders,state.revision+1,state.sceneId);
 if(!isValidTerrariumSceneOcclusionV03c(next))
  fail('invalid_scene_event_result');
 return next;
}
/** Self-describing engineering snapshot. No visual pixels, real ray
 * intersections or real plant tissue light measurement is implied.
 */
export function inspectTerrariumSceneOcclusionV03c(state){
 if(!isValidTerrariumSceneOcclusionV03c(state))
  fail('invalid_scene_inspect');
 const info=inspectTerrariumEcologyLightV03b(state.base);
 return freeze({
  version:TERRARIUM_SCENE_OCCLUSION_V03C_VERSION,
  minute:state.minute,revision:state.revision,
  sceneId:state.sceneId,
  sceneModel:'one_dimensional_zone_transmission_game_proxy',
  unshadedLightUnitsByZone:freeze([...info.unshadedLightUnitsByZone]),
  actualLightUnitsByZone:freeze([...info.lightUnitsByZone]),
  transmissionByZone:freeze([...info.transmissionByZone]),
  occluders:freeze(state.occluders.map(o=>freeze({...o}))),
  lamps:info.lamps,biota:info.biota,
  organicReceipts:info.events,
  species:info.plants,
  evidence:'artificial_engineering_mask_not_raycasting_or_measured_PPFD'
 });
}
export function buildTerrariumSceneOcclusionV03cActionSnapshot(state){
 if(!isValidTerrariumSceneOcclusionV03c(state))
  fail('invalid_scene_snapshot');
 return buildTerrariumEcologyLightV03bActionSnapshot(state.base);
}
