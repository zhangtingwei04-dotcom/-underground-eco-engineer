/**
 * Project OHM ECO V0.3d — bounded 2.5D scene-object geometry adapter.
 *
 * Converts scene-owned rectangle footprints, height and movable light mounts
 * into a FIVE-SAMPLE per-zone transmission mask. A simple 3D ray-vs-AABB
 * visibility test provides geometric shade; NOT photometric accuracy,
 * diffuse light, physical ray tracing of meshes, heat, UVB or husbandry.
 *
 * V0.3b remains the SINGLE authority for effective plant lightUnits, V0.3a
 * owns organic pools and V0.2b owns moisture and the game clock.
 *
 * Never modifies a formal player save, Phaser, storage or browser globals.
 */
import {
 createTerrariumEcologyLightV03b,isValidTerrariumEcologyLightV03b,
 advanceTerrariumEcologyLightV03b,applyTerrariumEcologyLightV03bEvent,
 setTerrariumEcologyLightTransmissionV03b,
 inspectTerrariumEcologyLightV03b,
 buildTerrariumEcologyLightV03bActionSnapshot
} from './terrarium-ecology-light-v03b.mjs';

export const TERRARIUM_SCENE_GEOMETRY_V03D_VERSION='0.3d';
const W=1000,H=400,MAX_OBJECTS=12,MAX_MOUNTS=12;
const fail=k=>{throw new RangeError(k)};
const F=Object.freeze;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,k)=>obj(x)&&Object.keys(x).every(n=>k.includes(n));
const num=(n,lo,hi)=>typeof n==='number'&&Number.isFinite(n)&&n>=lo&&n<=hi;
const integer=(n,hi)=>Number.isSafeInteger(n)&&n>=0&&n<=hi;
const id=x=>typeof x==='string'&&/^[a-z0-9][a-z0-9_-]{0,63}$/i.test(x);
const kinds=['rock_overhang','canopy','screen'];
const same=(x,y)=>x.length===y.length&&x.every((n,i)=>n===y[i]);

const boxKeys=['id','kind','x','y','width','depth','height','transmissionPermille'];
function normalizeBox(v){
 if(!exact(v,boxKeys)||boxKeys.some(k=>!(k in v))||
    !id(v.id)||!kinds.includes(v.kind)||
    !integer(v.x,W)||!integer(v.y,H)||
    !integer(v.width,W)||v.width<1||
    !integer(v.depth,H)||v.depth<1||
    !integer(v.height,1000)||v.height<1||
    !integer(v.transmissionPermille,1000)||
    v.x+v.width>W||v.y+v.depth>H)
   fail('invalid_scene_box');
 return F({...v});
}
function normalizeZone(z){
 if(!exact(z,['id','x','y','width','depth'])||
    ['id','x','y','width','depth'].some(k=>!(k in z))||
    !id(z.id)||!integer(z.x,W)||!integer(z.y,H)||
    !integer(z.width,W)||z.width<1||
    !integer(z.depth,H)||z.depth<1||
    z.x+z.width>W||z.y+z.depth>H)fail('invalid_scene_zone');
 return F({...z});
}
function normalizeMount(m){
 if(!exact(m,['fixtureId','x','y','height'])||
    ['fixtureId','x','y','height'].some(k=>!(k in m))||
    !id(m.fixtureId)||!integer(m.x,W)||
    !integer(m.y,H)||!integer(m.height,2000)||m.height<1)
   fail('invalid_scene_light_mount');
 return F({...m});
}
function validUnique(items,n,parse,max){
 if(!Array.isArray(items)||items.length>max)return false;
 const ids=new Set();
 try{
  for(const item of items){
   const x=parse(item);
   const key=x.fixtureId??x.id;
   if(ids.has(key))return false;
   ids.add(key);
  }
  return items.length===n||n===null;
 }catch{return false}
}
const defaults=n=>Array.from({length:n},(_,i)=>{
 const x=Math.floor(i*W/n),end=Math.floor((i+1)*W/n);
 return F({id:'zone_'+i,x,y:0,width:end-x,depth:H});
});
function validGeometry(zones,objects,mounts,light){
 const n=light.biota.zones.length;
 if(!validUnique(zones,n,normalizeZone,12)||
    !zones.every((z,i)=>z.id==='zone_'+i)||
    !validUnique(objects,null,normalizeBox,MAX_OBJECTS)||
    !validUnique(mounts,null,normalizeMount,MAX_MOUNTS))
   return false;
 return mounts.every(m=>light.fixtures.some(f=>f.id===m.fixtureId));
}
const active=(f,minute)=>{
 const d=((minute%1440)-f.startMinute+1440)%1440;
 return d<f.durationMinutes;
};
function fixtureContribution(f,i,minute){
 if(!active(f,minute))return 0;
 const d=Math.abs(i-f.zoneIndex);
 if(d>f.spreadZones)return 0;
 return Math.floor(f.strengthUnits*(f.spreadZones+1-d)/
  (f.spreadZones+1)*(1000/(1000+f.heightUnits)));
}
function defaultMount(light,zones,fixture){
 const zone=zones[fixture.zoneIndex];
 return {fixtureId:fixture.id,
  x:zone.x+Math.floor(zone.width/2),
  y:zone.y+Math.floor(zone.depth/2),
  height:800};
}
/** Deterministic segment-vs-box intersection: light at (x,y,z) to
 * vegetation sample at (x,y,0). Occluders are vertical AABB prisms.
 * This is a local geometry PROXY, not shadows cast onto render pixels.
 */
function blocked(start,point,box){
 let lo=0,hi=1;
 for(const [origin,delta,min,max] of [
  [start.x,point.x-start.x,box.x,box.x+box.width],
  [start.y,point.y-start.y,box.y,box.y+box.depth],
  [start.height,-start.height,0,box.height]
 ]){
  if(Math.abs(delta)<1e-10){
   if(origin<min||origin>max)return false;
  }else{
   let t0=(min-origin)/delta,t1=(max-origin)/delta;
   if(t0>t1)[t0,t1]=[t1,t0];
   lo=Math.max(lo,t0);hi=Math.min(hi,t1);
   if(lo>hi)return false;
  }
 }
 return lo<=1&&hi>=0;
}
/** 5 scene-space sample points per zone. Area coverage & soft shadows
 * are APPROXIMATED by sample count, not physically integrated rays.
 */
function samples(zone){
 const {x,y,width:w,depth:d}=zone;
 return [
  {x:x+w/2,y:y+d/2},
  {x:x+w/4,y:y+d/4},
  {x:x+3*w/4,y:y+d/4},
  {x:x+w/4,y:y+3*d/4},
  {x:x+3*w/4,y:y+3*d/4}
 ];
}
/** A scene can contain multiple lights. Each fixture is sampled
 * independently, then its V0.3b-schematic contribution is combined.
 * The result is projected back as ONE shared V0.3b transmission mask.
 * The final 0..1000 mask is approximate, especially if lamps saturate.
 */
export function calculateTerrariumGeometryTransmissionV03d({
 base,zones,objects=[],mounts=[],minute=null
}={}){
 if(!isValidTerrariumEcologyLightV03b(base)||
    !validGeometry(zones,objects,mounts,base)||
    (minute!==null&&(!integer(minute,10000000))))
   fail('invalid_geometry_projection');
 const m=minute===null?base.minute:minute;
 const mountById=new Map(mounts.map(x=>[x.fixtureId,x]));
 return F(zones.map((zone,i)=>{
  let raw=0,post=0;
  const points=samples(zone);
  for(const fixture of base.fixtures){
   const units=fixtureContribution(fixture,i,m);
   if(units===0)continue;
   const light=mountById.get(fixture.id)??defaultMount(base,zones,fixture);
   raw+=units;
   let through=0;
   for(const point of points){
    let trans=1000;
    for(const box of objects){
     if(blocked(light,point,box))
      trans=Math.floor(trans*box.transmissionPermille/1000);
    }
    through+=trans;
   }
   post+=units*through/(points.length*1000);
  }
  return raw===0?1000:Math.max(0,Math.min(1000,
    Math.floor(1000*post/raw)));
 }));
}
const wrap=(base,zones,objects,mounts,sceneId,revision)=>F({
 schemaVersion:7,version:TERRARIUM_SCENE_GEOMETRY_V03D_VERSION,
 minute:base.minute,revision,sceneId,base,
 zones:F(zones.map(z=>F({...z}))),
 objects:F(objects.map(o=>F({...o}))),
 mounts:F(mounts.map(m=>F({...m})))
});
function applyMask(base,zones,objects,mounts,minute){
 const transmission=calculateTerrariumGeometryTransmissionV03d({
  base,zones,objects,mounts,minute
 });
 return same(base.transmissionByZone,transmission)?base:
  setTerrariumEcologyLightTransmissionV03b(base,transmission);
}
export function isValidTerrariumSceneGeometryV03d(s){
 try{
  if(!obj(s)||s.schemaVersion!==7||
     s.version!==TERRARIUM_SCENE_GEOMETRY_V03D_VERSION||
     !integer(s.minute,10000000)||!integer(s.revision,10000000)||
     !id(s.sceneId)||!isValidTerrariumEcologyLightV03b(s.base)||
     s.minute!==s.base.minute||
     !validGeometry(s.zones,s.objects,s.mounts,s.base))
    return false;
  return same(s.base.transmissionByZone,
    calculateTerrariumGeometryTransmissionV03d({
     base:s.base,zones:s.zones,objects:s.objects,mounts:s.mounts
    }));
 }catch{return false}
}
/** V0.3d composes V0.3b directly, rather than stacking the older V0.3c
 * one-dimensional occluders as a second source of truth. */
export function createTerrariumSceneGeometryV03d({
 base=null,baseOptions={},sceneId='terrarium_scene',
 zones=null,objects=[],mounts=[]
}={}){
 if(!exact(baseOptions,['biota','biotaOptions','fixtures','speciesByZone',
                        'transmissionByZone']))
  fail('invalid_scene_geometry_options');
 let b=base??createTerrariumEcologyLightV03b(baseOptions);
 if(!isValidTerrariumEcologyLightV03b(b)||!id(sceneId))fail('invalid_scene_base');
 const layouts=zones===null?defaults(b.biota.zones.length):zones;
 if(!validGeometry(layouts,objects,mounts,b))
  fail('invalid_scene_geometry');
 b=applyMask(b,layouts,objects,mounts,b.minute);
 const out=wrap(b,layouts,objects,mounts,sceneId,0);
 if(!isValidTerrariumSceneGeometryV03d(out))fail('scene_create_failed');
 return out;
}
/** The fixture schedule and moving objects are sampled at each game-minute
 * boundary, before the V0.3a hourly plant tick. 27+33 == 60.
 */
export function advanceTerrariumSceneGeometryV03d(s,{minutes=1}={}){
 if(!isValidTerrariumSceneGeometryV03d(s)||
    !Number.isInteger(minutes)||minutes<1||minutes>240||
    s.minute+minutes>10000000||s.revision+minutes>10000000)
  fail('invalid_scene_geometry_minutes');
 let base=s.base;
 for(let i=0;i<minutes;i++){
  base=applyMask(base,s.zones,s.objects,s.mounts,base.minute+1);
  base=advanceTerrariumEcologyLightV03b(base,{minutes:1});
 }
 const out=wrap(base,s.zones,s.objects,s.mounts,s.sceneId,
   s.revision+minutes);
 if(!isValidTerrariumSceneGeometryV03d(out))
  fail('scene_step_failed');
 return out;
}
/** All scene positions have a single owner: V0.3d objects/zones/mounts.
 * V0.3b base events still validate litter source and unique light ownership.
 * Every change to scene geometry reprojects the same plant light values.
 */
export function applyTerrariumSceneGeometryV03dEvent(s,e){
 if(!isValidTerrariumSceneGeometryV03d(s)||
    s.revision>=10000000||!obj(e)||typeof e.channel!=='string')
  fail('invalid_scene_geometry_event');
 let b=s.base,zones=s.zones,objects=s.objects,mounts=s.mounts;
 if(e.channel==='object'){
  if(e.type==='upsert'){
   if(!exact(e,['channel','type','object']))fail('invalid_object_write');
   const x=normalizeBox(e.object);
   objects=objects.filter(o=>o.id!==x.id).concat([x]);
  }else if(e.type==='remove'){
   if(!exact(e,['channel','type','id'])||!id(e.id)||
      !objects.some(o=>o.id===e.id))fail('invalid_object_remove');
   objects=objects.filter(o=>o.id!==e.id);
  }else fail('unknown_object_event');
 }else if(e.channel==='zone'){
  if(!exact(e,['channel','type','zone'])||e.type!=='update')
   fail('invalid_zone_event');
  const x=normalizeZone(e.zone);
  if(!zones.some(z=>z.id===x.id))fail('unknown_zone');
  zones=zones.map(z=>z.id===x.id?x:z);
 }else if(e.channel==='mount'){
  if(e.type==='upsert'){
   if(!exact(e,['channel','type','mount']))fail('invalid_mount_write');
   const x=normalizeMount(e.mount);
   mounts=mounts.filter(m=>m.fixtureId!==x.fixtureId).concat([x]);
  }else if(e.type==='remove'){
   if(!exact(e,['channel','type','fixtureId'])||
      !id(e.fixtureId)||!mounts.some(m=>m.fixtureId===e.fixtureId))
    fail('invalid_mount_remove');
   mounts=mounts.filter(m=>m.fixtureId!==e.fixtureId);
  }else fail('unknown_mount_event');
 }else if(e.channel==='base'){
  if(!exact(e,['channel','event'])||!obj(e.event))
   fail('invalid_scene_base_event');
  b=applyTerrariumEcologyLightV03bEvent(b,e.event);
  // Removing a fixture must remove now-orphaned custom mounts.
  mounts=mounts.filter(m=>b.fixtures.some(f=>f.id===m.fixtureId));
 }else fail('unknown_geometry_channel');
 if(!validGeometry(zones,objects,mounts,b))
  fail('invalid_geometry_event_result');
 b=applyMask(b,zones,objects,mounts,b.minute);
 const out=wrap(b,zones,objects,mounts,s.sceneId,s.revision+1);
 if(!isValidTerrariumSceneGeometryV03d(out))
  fail('invalid_geometry_event_result');
 return out;
}
export function inspectTerrariumSceneGeometryV03d(s){
 if(!isValidTerrariumSceneGeometryV03d(s))
  fail('invalid_scene_geometry_inspection');
 const v=inspectTerrariumEcologyLightV03b(s.base);
 return F({
  version:TERRARIUM_SCENE_GEOMETRY_V03D_VERSION,
  minute:s.minute,sceneId:s.sceneId,revision:s.revision,
  bounds:F({width:W,depth:H,heightUnits:2000}),
  zones:F(s.zones.map(z=>F({...z}))),
  objects:F(s.objects.map(o=>F({...o}))),
  mounts:F(s.mounts.map(m=>F({...m}))),
  rawLightUnitsByZone:v.unshadedLightUnitsByZone,
  actualLightUnitsByZone:v.lightUnitsByZone,
  transmissionByZone:v.transmissionByZone,
  biota:v.biota,lamps:v.lamps,organicReceipts:v.events,
  modelStatus:'bounded_2_5d_five_sample_aabb_ray_visibility_game_proxy',
  scienceStatus:'not_PPFD_DLI_lux_UVB_or_species_welfare_evidence'
 });
}
export function buildTerrariumSceneGeometryV03dActionSnapshot(s){
 if(!isValidTerrariumSceneGeometryV03d(s))
  fail('invalid_scene_geometry_action_snapshot');
 return buildTerrariumEcologyLightV03bActionSnapshot(s.base);
}
