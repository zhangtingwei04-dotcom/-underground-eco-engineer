/**
 * Project OHM — ecology -> snake action-point input adapter V0.1.
 * Eco conditions may enable/disable a potential activity location.
 * This is a data/guard adapter, not a physiology, climate, microbial,
 * welfare, pathogen, collision, or animal movement simulator.
 *
 * Caller is responsible for measuring/simulating environmental conditions
 * and for species-specific interpretation of thermal status. No temperature,
 * humidity or microbial "safe thresholds" are invented here.
 * Input and output are pure data; no save I/O.
 */
export const SNAKE_ECOLOGY_ACTION_VERSION = '0.1';

const KINDS = Object.freeze([
  'hide','warm_area','cool_area','water','loose_substrate',
  'branch','covered_area','open_area'
]);
const KIND_SET = new Set(KINDS);
const ID = /^[a-z][a-z0-9_-]{0,63}$/;
const THERMAL = new Set(['neutral','seek_warm','seek_cool']);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const normalized=x=>finite(x)&&x>=0&&x<=1;

function checkSnapshot(snapshot) {
  if(!snapshot||typeof snapshot!=='object'||Array.isArray(snapshot)||
     !Number.isSafeInteger(snapshot.revision)||snapshot.revision<0||
     !Array.isArray(snapshot.sites)||snapshot.sites.length>256)
    throw new RangeError('invalid_ecology_snapshot');
  const seen=new Set();
  for(const s of snapshot.sites) {
    if(!s||typeof s!=='object'||Array.isArray(s)||
       typeof s.id!=='string'||!ID.test(s.id)||seen.has(s.id)||
       !KIND_SET.has(s.kind)||typeof s.safe!=='boolean'||
       typeof s.reachable!=='boolean'||!normalized(s.distanceCost)||
       !s.conditions||typeof s.conditions!=='object'||Array.isArray(s.conditions))
      throw new RangeError('invalid_ecology_site');
    seen.add(s.id);
    const c=s.conditions;
    for(const k of ['hasCover','hasWater','diggable','branchStable','thermalService','qualityFlag']) {
      if(c[k]!==undefined&&typeof c[k]!=='boolean')
        throw new RangeError('invalid_ecology_condition');
    }
    if(c.microclimate!==undefined&&!['normal','too_dry','too_damp','unknown'].includes(c.microclimate))
      throw new RangeError('invalid_microclimate');
  }
}
const guardedNeeds=(needs,thermalSignal)=>{
  if(!needs||typeof needs!=='object'||Array.isArray(needs)||
     !THERMAL.has(thermalSignal))
    throw new RangeError('invalid_ecology_needs');
  if(Object.prototype.hasOwnProperty.call(needs,'thermal')&&needs.thermal!==thermalSignal)
    throw new RangeError('conflicting_thermal_signal');
  // leave validated animal needs in the owning snake activity planner;
  // physiology is not inferred solely from ambient temperature.
  return Object.freeze({...needs,thermal:thermalSignal});
};
/**
 * All sites keep stable IDs, even when unavailable, to avoid reassigning
 * the target identity every time a branch, water dish or cover changes.
 * For an unknown state of a required site attribute, fail closed:
 * water/digging/branching/cover cannot be used until the environment
 * explicitly reports the resource is available.
 */
export function buildSnakeActionInputFromEcology({
  snapshot, speciesId='generic_snake', needs={},
  thermalSignal='neutral', currentTargetId=null,cooldownIds=[]
}={}) {
  checkSnapshot(snapshot);
  if(typeof speciesId!=='string'||!ID.test(speciesId)||
     currentTargetId!==null&&(typeof currentTargetId!=='string'||!ID.test(currentTargetId))||
     !Array.isArray(cooldownIds)||cooldownIds.length>256||
     cooldownIds.some(x=>typeof x!=='string'||!ID.test(x)))
    throw new RangeError('invalid_ecology_actor');
  const derivedNeeds=guardedNeeds(needs,thermalSignal);
  const report=[];
  const points=snapshot.sites.map(s=>{
    const c=s.conditions,reasons=[];
    if(!s.safe)reasons.push('hazard_reported');
    if(!s.reachable)reasons.push('path_blocked');
    if(c.qualityFlag===true)reasons.push('environment_quality_flag');
    if(s.kind==='hide'||s.kind==='covered_area'){
      if(c.hasCover!==true)reasons.push('cover_unavailable');
    }
    if(s.kind==='water'&&c.hasWater!==true)
      reasons.push('water_unavailable');
    if(s.kind==='loose_substrate'&&c.diggable!==true)
      reasons.push('substrate_unavailable');
    if(s.kind==='branch'&&c.branchStable!==true)
      reasons.push('branch_unstable');
    if((s.kind==='warm_area'||s.kind==='cool_area')&&c.thermalService!==true)
      reasons.push('thermal_area_unavailable');
    // dry or damp microclimate alone is not treated as injury/unsafe.
    // A separately evaluated 'qualityFlag' is required for hard exclusion.
    const safe=s.safe && c.qualityFlag!==true;
    const reachable=s.reachable && !reasons.some(r=>[
      'cover_unavailable','water_unavailable','substrate_unavailable',
      'branch_unstable','thermal_area_unavailable'
    ].includes(r));
    const p={id:s.id,kind:s.kind,safe,reachable,
      distanceCost:s.distanceCost};
    if(s.kind==='water')p.waterAccessible=c.hasWater===true;
    if(s.kind==='loose_substrate')p.diggable=c.diggable===true;
    if(s.kind==='branch')p.supportStable=c.branchStable===true;
    report.push(Object.freeze({id:s.id,kind:s.kind,
      available:safe&&reachable,reasons:Object.freeze(reasons),
      microclimate:c.microclimate??'unknown'}));
    return Object.freeze(p);
  });
  return Object.freeze({
    version:SNAKE_ECOLOGY_ACTION_VERSION,
    ecologyRevision:snapshot.revision,
    speciesId,
    points:Object.freeze(points),
    needs:derivedNeeds,
    currentTargetId,cooldownIds:Object.freeze([...cooldownIds]),
    reports:Object.freeze(report),
    status:'ecology_input_adapter_not_physiology_or_collision'
  });
}
