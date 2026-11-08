/**
 * Ohm Core — reptile locomotion & behavior capability contracts v0.1.
 * Pure configuration/state validation, NOT a biology or animation simulator.
 * Real-species profiles must be backed by research before gameplay use.
 */
export const MOTION_MODES=Object.freeze(['rest','walk','slither','climb','burrow','swim']);
export const BEHAVIOR_TAGS=Object.freeze(['resting','exploring','foraging','feeding','sheltering','basking']);
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function fail(error){return {ok:false,error};}
export function validateMotionProfile(profile){
  if(!profile||typeof profile!=='object'||Array.isArray(profile))return fail('invalid_profile');
  if(typeof profile.speciesId!=='string'||!ID.test(profile.speciesId))return fail('invalid_species_id');
  if(profile.evidenceStatus!=='unverified'&&profile.evidenceStatus!=='reviewed')return fail('invalid_evidence_status');
  if(!Array.isArray(profile.modes)||profile.modes.length===0||profile.modes.length>MOTION_MODES.length||
     profile.modes.some(m=>!MOTION_MODES.includes(m))||new Set(profile.modes).size!==profile.modes.length)
    return fail('invalid_motion_modes');
  if(!profile.modes.includes('rest'))return fail('missing_rest_mode');
  if(!Array.isArray(profile.behaviors)||profile.behaviors.some(b=>!BEHAVIOR_TAGS.includes(b))||
    new Set(profile.behaviors).size!==profile.behaviors.length)return fail('invalid_behaviors');
  if(!profile.transitions||typeof profile.transitions!=='object'||Array.isArray(profile.transitions))
    return fail('invalid_transitions');
  for(const [from,targets] of Object.entries(profile.transitions)){
    if(!profile.modes.includes(from)||!Array.isArray(targets)||new Set(targets).size!==targets.length||
      targets.some(to=>!profile.modes.includes(to)))return fail('invalid_transition');
  }
  for(const mode of profile.modes)if(!has(profile.transitions,mode))return fail('missing_transition');
  return {ok:true};
}
export function createMotionState(profile,{individualId='demo-individual',mode='rest'}={}){
  const valid=validateMotionProfile(profile);if(!valid.ok)return valid;
  if(typeof individualId!=='string'||!ID.test(individualId))return fail('invalid_individual_id');
  if(!profile.modes.includes(mode))return fail('unsupported_motion');
  return {ok:true,state:{schemaVersion:1,speciesId:profile.speciesId,individualId,mode,sequence:0}};
}
export function requestMotion(state,nextMode,profile){
  const valid=validateMotionProfile(profile);if(!valid.ok)return valid;
  if(!state||state.schemaVersion!==1||state.speciesId!==profile.speciesId||
    typeof state.individualId!=='string'||!ID.test(state.individualId)||
    !Number.isSafeInteger(state.sequence)||state.sequence<0||
    !profile.modes.includes(state.mode))return fail('invalid_motion_state');
  if(!profile.modes.includes(nextMode))return fail('unsupported_motion');
  if(state.mode===nextMode)return {ok:true,state:{...state},events:[]};
  if(!profile.transitions[state.mode].includes(nextMode))return fail('transition_not_allowed');
  if(state.sequence===Number.MAX_SAFE_INTEGER)return fail('sequence_overflow');
  return {ok:true,state:{...state,mode:nextMode,sequence:state.sequence+1},
    events:[{type:'motion_changed',individualId:state.individualId,from:state.mode,to:nextMode}]};
}
/** A purely mechanical test fixture. NOT a biological profile of any real reptile. */
export const DEMO_MOTION_PROFILE=Object.freeze({
  speciesId:'demo-reptile',evidenceStatus:'unverified',
  modes:Object.freeze(['rest','walk','climb']),
  behaviors:Object.freeze(['resting','exploring']),
  transitions:Object.freeze({rest:Object.freeze(['walk']),walk:Object.freeze(['rest','climb']),climb:Object.freeze(['walk'])})
});
