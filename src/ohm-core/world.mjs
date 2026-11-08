/**
 * Ohm Core v0.1 — platform-independent executable rules.
 * No Phaser, browser globals, network, storage, external dependencies or side effects.
 * This is a deliberately small vertical slice, NOT a replacement for existing gameplay.
 */
export const CORE_VERSION = 1;
const MAX_LOCATIONS = 64;
const MAX_EVENTS = 100;
const SAFE_ID = /^[a-z][a-z0-9_-]{0,63}$/i;
const allowedActions = new Set(['TRAVEL', 'OBSERVE', 'TICK']);
function fail(reason) { return { ok:false, error:reason }; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function createWorld({worldId='ohm-demo', startLocation='research-room'}={}) {
  if(!SAFE_ID.test(worldId) || !SAFE_ID.test(startLocation)) throw new Error('invalid_identifier');
  return {
    schemaVersion:CORE_VERSION,
    worldId,
    clock:0,
    location:startLocation,
    visited:[startLocation],
    observations:[],
    eventSequence:0
  };
}
export function validateWorld(value) {
  if(!value || typeof value!=='object' || Array.isArray(value)) return fail('invalid_world');
  if(value.schemaVersion!==CORE_VERSION) return fail('unsupported_schema_version');
  if(!SAFE_ID.test(value.worldId||'') || !SAFE_ID.test(value.location||'')) return fail('invalid_identifier');
  if(!Number.isSafeInteger(value.clock) || value.clock<0 || !Number.isSafeInteger(value.eventSequence) || value.eventSequence<0) return fail('invalid_clock');
  if(!Array.isArray(value.visited) || value.visited.length>MAX_LOCATIONS || !value.visited.every(id=>typeof id==='string' && SAFE_ID.test(id))) return fail('invalid_locations');
  if(!value.visited.includes(value.location)) return fail('location_not_visited');
  if(!Array.isArray(value.observations) || value.observations.length>MAX_EVENTS) return fail('invalid_observations');
  if(!value.observations.every(o=>o && typeof o==='object' && typeof o.location==='string' && SAFE_ID.test(o.location) && Number.isSafeInteger(o.at) && o.at>=0 && o.at<=value.clock)) return fail('invalid_observations');
  return {ok:true};
}
/**
 * @param {object} state - validated, JSON-serializable world state
 * @param {{type:string, location?:string, minutes?:number}} command
 * @param {{locations?:Record<string,{exits:string[]} >}} rules - explicit map graph
 * @returns {{ok:boolean,state?:object,events?:Array<object>,error?:string}}
 */
export function dispatchWorld(state,command,rules={}) {
  const checked=validateWorld(state);
  if(!checked.ok) return checked;
  if(!command || typeof command!=='object' || Array.isArray(command) || !allowedActions.has(command.type)) return fail('unknown_command');
  const locations=rules.locations || {};
  if(!locations || typeof locations!=='object') return fail('invalid_map');
  const next=clone(state);
  const events=[];
  if(command.type==='TRAVEL') {
    const target=command.location;
    if(typeof target!=='string' || !SAFE_ID.test(target)) return fail('invalid_location');
    const exits=locations[next.location]?.exits;
    if(!Array.isArray(exits) || !exits.includes(target) || !locations[target]) return fail('inaccessible_location');
    next.location=target;
    if(!next.visited.includes(target)) {
      if(next.visited.length>=MAX_LOCATIONS) return fail('location_limit');
      next.visited.push(target);
    }
    events.push({type:'location_changed',location:target});
  } else if(command.type==='OBSERVE') {
    if(next.observations.length>=MAX_EVENTS) return fail('observation_limit');
    next.observations.push({location:next.location,at:next.clock});
    events.push({type:'observation_recorded',location:next.location});
  } else {
    if(!Number.isSafeInteger(command.minutes) || command.minutes<1 || command.minutes>60) return fail('invalid_tick');
    if(!Number.isSafeInteger(next.clock+command.minutes)) return fail('clock_overflow');
    next.clock+=command.minutes;
    events.push({type:'clock_advanced',minutes:command.minutes});
  }
  next.eventSequence+=events.length;
  return {ok:true,state:next,events};
}

export const DEMO_MAP=Object.freeze({
  locations: {
    'research-room':{exits:['terrarium-room','library']},
    'terrarium-room':{exits:['research-room']},
    library:{exits:['research-room']}
  }
});
