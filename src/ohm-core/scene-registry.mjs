/**
 * Ohm Core scene registry v0.2.
 * World rules and navigation metadata are platform-independent.
 * Phaser / future Ohm renderer only decides how to display a location.
 */
import { dispatchWorld, validateWorld } from './world.mjs';

const SAFE_ID = /^[a-z][a-z0-9_-]{0,63}$/i;
const MAX_SCENES = 64;
const MAX_EXITS = 16;
const has = (object,key) => Object.prototype.hasOwnProperty.call(object,key);

export const OHM_LOCATIONS = Object.freeze({
  locations: Object.freeze({
    'research-room': Object.freeze({
      title:'地下研究所', description:'研究與日常活動的起點',
      exits:Object.freeze(['terrarium-room','library'])
    }),
    'terrarium-room': Object.freeze({
      title:'生態箱室', description:'觀察已飼養的生物與生態環境',
      exits:Object.freeze(['research-room'])
    }),
    library: Object.freeze({
      title:'研究圖書館', description:'查閱物種與生態研究資料',
      exits:Object.freeze(['research-room'])
    })
  })
});

export function validateSceneRegistry(registry) {
  const locations = registry?.locations;
  if (!locations || typeof locations!=='object' || Array.isArray(locations)) return {ok:false,error:'invalid_registry'};
  const ids = Object.keys(locations);
  if (!ids.length || ids.length>MAX_SCENES) return {ok:false,error:'invalid_scene_count'};
  for(const id of ids) {
    if(!SAFE_ID.test(id)) return {ok:false,error:'invalid_scene_id'};
    const scene=locations[id];
    if(!scene || typeof scene!=='object' || Array.isArray(scene) ||
       typeof scene.title!=='string' || !scene.title.trim() || scene.title.length>80 ||
       typeof scene.description!=='string' || scene.description.length>300 ||
       !Array.isArray(scene.exits) || scene.exits.length>MAX_EXITS ||
       new Set(scene.exits).size!==scene.exits.length)
      return {ok:false,error:'invalid_scene_metadata'};
    for(const exit of scene.exits) {
      if(typeof exit!=='string' || !SAFE_ID.test(exit) || !has(locations,exit) || exit===id)
        return {ok:false,error:'invalid_scene_exit'};
    }
  }
  return {ok:true};
}

export function describeScene(state,registry=OHM_LOCATIONS) {
  const valid=validateWorld(state);
  if(!valid.ok) return valid;
  const definition=validateSceneRegistry(registry);
  if(!definition.ok) return definition;
  const scene=registry.locations[state.location];
  if(!scene) return {ok:false,error:'unknown_current_scene'};
  return {ok:true,id:state.location,title:scene.title,description:scene.description,
    exits:scene.exits.map(id=>({id,title:registry.locations[id].title}))};
}

export function travelToScene(state,target,registry=OHM_LOCATIONS) {
  const current=describeScene(state,registry);
  if(!current.ok) return current;
  if(!current.exits.some(exit=>exit.id===target)) return {ok:false,error:'inaccessible_location'};
  return dispatchWorld(state,{type:'TRAVEL',location:target},registry);
}
