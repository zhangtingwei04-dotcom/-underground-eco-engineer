/**
 * Project OHM — Snake habitat-driven action point prototype V0.1.
 * Species habits influence goals, not bone count or procedural animation frames.
 * Values and priorities are GAME-PLAY DESIGN PLACEHOLDERS, NOT measured
 * ethological activity probabilities, temperatures or husbandry standards.
 * No RNG, I/O, network, saved-game or background effects.
 */
export const SNAKE_ACTIVITY_POINTS_VERSION = '0.1';
export const SNAKE_POINT_KINDS = Object.freeze([
  'hide', 'warm_area', 'cool_area', 'water',
  'loose_substrate', 'branch', 'covered_area', 'open_area'
]);
export const SNAKE_DAY_PHASES = Object.freeze(['dawn','day','dusk','night']);
/** Behavior opportunities are attached to *places*, not forced daily chores. */
export const SNAKE_POINT_BEHAVIORS = Object.freeze({
  hide:Object.freeze(['sheltering','resting']),
  warm_area:Object.freeze(['thermoregulating','basking']),
  cool_area:Object.freeze(['thermoregulating','sheltering']),
  water:Object.freeze(['drinking','investigating']),
  loose_substrate:Object.freeze(['burrowing','exploring']),
  branch:Object.freeze(['climbing','exploring','resting']),
  covered_area:Object.freeze(['sheltering','exploring']),
  open_area:Object.freeze(['exploring'])
});
const KINDS = new Set(SNAKE_POINT_KINDS);
const ID_PATTERN = /^[a-z][a-z0-9_-]{0,63}$/;
const own = (a,k) => Object.prototype.hasOwnProperty.call(a,k);
const finite = x => typeof x === 'number' && Number.isFinite(x);
const bounded = x => finite(x) && x >= 0 && x <= 1;
const freeze = obj => Object.freeze(obj);

/**
 * Every preference is a TUNABLE, unmeasured game weighting (not a frequency).
 * Evidence references support broad capabilities/choice of opportunity ONLY.
 * No field hardcodes mandatory climbing, digging, or daily sleep schedules.
 */
export const SNAKE_HABIT_PROFILES = freeze({
  generic_snake: freeze({
    speciesId:'generic_snake', taxonomy:'art_test_not_a_real_species',
    evidenceStatus:'not_applicable',
    preferences:freeze({hide:1,warm_area:1,cool_area:1,water:1,
      loose_substrate:1,branch:1,covered_area:1,open_area:1}),
    evidence:freeze([])
  }),
  corn_snake: freeze({
    speciesId:'corn_snake', taxonomy:'Pantherophis guttatus',
    evidenceStatus:'qualitative_public_sources_not_behavior_probabilities',
    preferences:freeze({hide:1.12,warm_area:1,cool_area:1,water:1,
      loose_substrate:.78,branch:1.3,covered_area:1.13,open_area:1}),
    evidence:freeze([
      'https://animaldiversity.org/accounts/Pantherophis_guttatus/',
      'https://www.rspca.org.uk/adviceandwelfare/pets/other/cornsnake'
    ])
  }),
  hognose_snake: freeze({
    speciesId:'hognose_snake', taxonomy:'Heterodon nasicus',
    evidenceStatus:'qualitative_public_sources_not_behavior_probabilities',
    preferences:freeze({hide:1.12,warm_area:1,cool_area:1,water:1,
      loose_substrate:1.35,branch:.68,covered_area:1.1,open_area:1}),
    evidence:freeze([
      'https://animaldiversity.org/accounts/Heterodon_nasicus/',
      'https://animalparknc.org/residents/western-hognose-snake/'
    ])
  })
});

/**
 * distanceCost = normalized path-cost estimate [0,1], not straight-line
 * physical distance. safe and reachable are inputs from other modules:
 * we DO NOT calculate collision or prove welfare/safety here.
 */
export function validateSnakeActionPoints(points) {
  if(!Array.isArray(points) || points.length > 256) return {ok:false,error:'invalid_point_list'};
  const ids = new Set();
  for(const p of points) {
    if(!p || typeof p !== 'object' || Array.isArray(p) ||
       typeof p.id !== 'string' || !ID_PATTERN.test(p.id))
      return {ok:false,error:'invalid_point'};
    if(ids.has(p.id))return {ok:false,error:'duplicate_id'};
    ids.add(p.id);
    if(!KINDS.has(p.kind) || typeof p.safe!=='boolean' ||
       typeof p.reachable!=='boolean' || !bounded(p.distanceCost))
      return {ok:false,error:'invalid_point_conditions'};
    if(p.behaviorTags !== undefined && (!Array.isArray(p.behaviorTags) ||
       p.behaviorTags.length===0 || new Set(p.behaviorTags).size!==p.behaviorTags.length ||
       p.behaviorTags.some(tag => !SNAKE_POINT_BEHAVIORS[p.kind].includes(tag))))
      return {ok:false,error:'invalid_behavior_tags'};
    if(p.kind==='branch' && typeof p.supportStable !== 'boolean')
      return {ok:false,error:'missing_support_condition'};
    if(p.kind==='loose_substrate' && typeof p.diggable !== 'boolean')
      return {ok:false,error:'missing_dig_condition'};
    if(p.kind==='water' && typeof p.waterAccessible !== 'boolean')
      return {ok:false,error:'missing_water_condition'};
  }
  return {ok:true};
}

const DEFAULT_NEEDS = freeze({
  security:0.25,hydration:0.15,activity:0.3,burrow:0.2,climb:0.2,
  thermal:'neutral'
});
const THERMALS = new Set(['neutral','seek_warm','seek_cool']);
function getNeeds(input) {
  if(input===null || typeof input!=='object' || Array.isArray(input))
    throw new RangeError('invalid_needs');
  const result={...DEFAULT_NEEDS,...input};
  if(!['security','hydration','activity','burrow','climb'].every(k=>bounded(result[k])) ||
     !THERMALS.has(result.thermal))throw new RangeError('invalid_needs');
  return result;
}
function intrinsic(kind,n) {
  switch(kind){
    case 'hide':return 0.75+3.0*n.security+0.5*(1-n.activity);
    case 'warm_area':return n.thermal==='seek_warm'?3.5:.25;
    case 'cool_area':return n.thermal==='seek_cool'?3.5:.25;
    case 'water':return .4+4.1*n.hydration;
    case 'loose_substrate':return .32+.9*n.activity+1.9*n.burrow;
    case 'branch':return .32+.9*n.activity+1.9*n.climb;
    case 'covered_area':return .65+1.55*n.security+.6*n.activity;
    case 'open_area':return .5+1.9*n.activity;
    default:throw new RangeError('unknown_kind');
  }
}
/**
 * Scores are deterministic (for tests and predictable gameplay), and are
 * ONLY relative game weights. Any eligible point may lose to 'rest'.
 * Day phase is accepted and preserved but does not alter numerical scores:
 * species-specific schedules cannot be inferred from the current sources.
 */
export function rankSnakeActivityPoints({
  speciesId='generic_snake',points=[],needs={},dayPhase='day',
  currentTargetId=null,cooldownIds=[]
}={}){
  if(!own(SNAKE_HABIT_PROFILES,speciesId))throw new RangeError('unknown_species_profile');
  const validated=validateSnakeActionPoints(points);
  if(!validated.ok)throw new RangeError(validated.error);
  if(!SNAKE_DAY_PHASES.includes(dayPhase))throw new RangeError('invalid_day_phase');
  const n=getNeeds(needs);
  if(currentTargetId!==null && (typeof currentTargetId!=='string'||!ID_PATTERN.test(currentTargetId)))
    throw new RangeError('invalid_current_target');
  if(!Array.isArray(cooldownIds) || cooldownIds.length>256 ||
    cooldownIds.some(x=>typeof x!=='string'||!ID_PATTERN.test(x)))
    throw new RangeError('invalid_cooldowns');
  const previous=new Set(cooldownIds),profile=SNAKE_HABIT_PROFILES[speciesId],candidates=[];
  for(const p of points){
    // Do not let a purely visual revisit cooldown block a critical water or
    // thermal opportunity. In real use a separate welfare monitor is required.
    const critical = (p.kind==='water' && n.hydration>=.9) ||
      (p.kind==='warm_area' && n.thermal==='seek_warm') ||
      (p.kind==='cool_area' && n.thermal==='seek_cool');
    // Incompatible or unreachable target never receives a numerical score.
    if(!p.safe || !p.reachable || (previous.has(p.id) && p.id!==currentTargetId && !critical) ||
       p.kind==='branch' && !p.supportStable ||
       p.kind==='loose_substrate' && !p.diggable ||
       p.kind==='water' && !p.waterAccessible)continue;
    let score=intrinsic(p.kind,n)*profile.preferences[p.kind] - .38*p.distanceCost;
    if(p.id===currentTargetId)score+=.32; // small hysteresis, not infinite lock-in
    candidates.push(freeze({id:p.id,kind:p.kind,
      score:Number(score.toFixed(6)),reason:'habit_'+p.kind,
      behaviors:freeze([...(p.behaviorTags??SNAKE_POINT_BEHAVIORS[p.kind])]),
      evidenceStatus:profile.evidenceStatus}));
  }
  // Missing environmental opportunities are explicit signals for a future
  // habitat/welfare subsystem, not an excuse to invent movement or teleport.
  const available=new Set(candidates.map(p=>p.kind));
  const unmet=[];
  if(n.hydration>=.9 && !available.has('water'))unmet.push('no_safe_accessible_water');
  if(n.thermal==='seek_warm' && !available.has('warm_area'))unmet.push('no_safe_accessible_warm_area');
  if(n.thermal==='seek_cool' && !available.has('cool_area'))unmet.push('no_safe_accessible_cool_area');
  // Rest in place is a deliberate outcome, not a missing route / bad tick.
  const restScore=1.25+1.1*(1-n.activity)+.3*n.security;
  candidates.push(freeze({id:null,kind:'rest',score:Number(restScore.toFixed(6)),
    reason:'remain_still',behaviors:freeze(['resting']),evidenceStatus:'general_game_rule'}));
  candidates.sort((a,b)=>b.score-a.score || String(a.id??'').localeCompare(String(b.id??'')));
  return freeze({version:SNAKE_ACTIVITY_POINTS_VERSION,speciesId,dayPhase,
    scored:freeze(candidates),needs:freeze(n),unmetNeeds:freeze(unmet),
    status:'prototype_design_weights_not_measured_behavior'});
}
export function chooseSnakeActivityPoint(options={}) {
  const ranking=rankSnakeActivityPoints(options);
  const choice=ranking.scored[0];
  return freeze({speciesId:ranking.speciesId,dayPhase:ranking.dayPhase,
    targetId:choice.id,activity:choice.kind,reason:choice.reason,
    shouldMove:choice.id!==null,ranking:ranking.scored,
    unmetNeeds:ranking.unmetNeeds,
    status:ranking.status});
}
