/**
 * Scales & Seeds / OHM ECO V0.3a — plant patches and bounded detritus pools.
 *
 * Every zone reads the SAME verified V0.2b clock and water authority.
 * Plants (moss/fern) and decomposers are abstract GROUP/appearance indices,
 * never organisms, species-level models, measured growth rates or husbandry.
 *
 * Organic accounting (independent of soil water):
 *   initial litter/fragmented/mineral proxies + added litter
 *   === litter + fragmented + mineral proxies.
 * No organic matter appears from plant COVER or from "fungal growth".
 * Mineral proxy never automatically becomes new plant biomass.
 *
 * Default integer game coefficients have NO real-world unit calibration.
 * No network, saves, player data, Phaser or wall-clock reads.
 */
import {
  createCoupledTerrariumEcology,isValidCoupledTerrariumEcology,
  advanceCoupledTerrariumEcology,applyCoupledTerrariumEcologyEvent,
  inspectCoupledTerrariumEcology,buildCoupledTerrariumEcologyActionSnapshot
} from './terrarium-ecology-coupled-v02b.mjs';

export const TERRARIUM_BIOTA_V03_VERSION='0.3a';
const TYPES=['none','moss','fern'];
const GROUPS=['fungi','springtails','isopods'];
const MAX=1000000000;
const fail=x=>{throw new RangeError(x)};
const integer=(v,max=MAX)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const only=(o,keys)=>obj(o)&&Object.keys(o).every(k=>keys.includes(k));
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const f=Object.freeze;
const defaults=f({
  plantKind:'none',plantCoverUnits:0,lightUnits:500,
  litterUnits:0,fragmentedUnits:0,mineralUnits:0,
  fungiIndex:350,springtailIndex:180,isopodIndex:100
});
const optionKeys=Object.keys(defaults);
function parseZone(o,i){
  if(!only(o,optionKeys))fail('invalid_biota_zone_config');
  const v={...defaults,...o};
  if(!TYPES.includes(v.plantKind)||
     !integer(v.plantCoverUnits,1000)||
     (v.plantKind==='none'&&v.plantCoverUnits!==0)||
     !integer(v.lightUnits,1000)||
     !integer(v.litterUnits,1000000)||
     !integer(v.fragmentedUnits,1000000)||
     !integer(v.mineralUnits,1000000)||
     !GROUPS.every(g=>integer(v[g==='fungi'?'fungiIndex':g==='springtails'?'springtailIndex':'isopodIndex'],1000)))
    fail('invalid_biota_zone_config_values');
  return f({
    id:'zone_'+i,
    plant:f({kind:v.plantKind,coverUnits:v.plantCoverUnits,
      conditionUnits:750,lightUnits:v.lightUnits}),
    litterUnits:v.litterUnits,fragmentedUnits:v.fragmentedUnits,
    mineralUnits:v.mineralUnits,
    decomposers:f({fungiIndex:v.fungiIndex,
      springtailIndex:v.springtailIndex,isopodIndex:v.isopodIndex})
  });
}
const amount=z=>z.litterUnits+z.fragmentedUnits+z.mineralUnits;
const total=zones=>zones.reduce((n,z)=>n+amount(z),0);
const cloneZone=z=>({
 ...z,plant:{...z.plant},decomposers:{...z.decomposers}
});
const freezeZone=z=>f({...z,plant:f({...z.plant}),
  decomposers:f({...z.decomposers})});
const envelope=(coupled,zones,ledger,revision)=>f({
  schemaVersion:4,version:TERRARIUM_BIOTA_V03_VERSION,
  minute:coupled.minute,revision,environment:coupled,
  zones:f(zones.map(freezeZone)),ledger:f({...ledger})
});
export function isValidTerrariumBiotaV03(state){
  try{
    if(!obj(state)||state.schemaVersion!==4||
       state.version!==TERRARIUM_BIOTA_V03_VERSION||
       !integer(state.minute,10000000)||
       !integer(state.revision,10000000)||
       !isValidCoupledTerrariumEcology(state.environment)||
       state.minute!==state.environment.minute||
       !Array.isArray(state.zones)||
       state.zones.length!==state.environment.substrate.zones.length||
       !only(state.ledger,['initialUnits','addedUnits'])||
       Object.keys(state.ledger).length!==2||
       !integer(state.ledger.initialUnits)||
       !integer(state.ledger.addedUnits))
      return false;
    for(let i=0;i<state.zones.length;i++){
      const z=state.zones[i];
      if(!obj(z)||z.id!=='zone_'+i||!obj(z.plant)||
         !TYPES.includes(z.plant.kind)||
         !integer(z.plant.coverUnits,1000)||
         (z.plant.kind==='none'&&z.plant.coverUnits!==0)||
         !integer(z.plant.conditionUnits,1000)||
         !integer(z.plant.lightUnits,1000)||
         !integer(z.litterUnits)||!integer(z.fragmentedUnits)||
         !integer(z.mineralUnits)||!obj(z.decomposers)||
         !GROUPS.every(g=>integer(z.decomposers[
          g==='fungi'?'fungiIndex':g==='springtails'?'springtailIndex':'isopodIndex'
         ],1000)))
        return false;
    }
    return state.ledger.initialUnits+state.ledger.addedUnits===
      total(state.zones);
  }catch{return false;}
}

export function createTerrariumBiotaV03({
  environment=null,environmentOptions={},zoneConfigs=null
}={}){
  if(!only(environmentOptions,
    ['microclimate','substrate','microclimateOptions','substrateOptions']))
    fail('invalid_biota_environment_options');
  const env=environment??createCoupledTerrariumEcology(environmentOptions);
  if(!isValidCoupledTerrariumEcology(env))fail('invalid_biota_environment');
  const n=env.substrate.zones.length;
  if(zoneConfigs!==null&&(!Array.isArray(zoneConfigs)||
     zoneConfigs.length!==n))fail('invalid_biota_zone_count');
  const zones=Array.from({length:n},(_,i)=>
    parseZone(zoneConfigs===null?{}:zoneConfigs[i],i));
  const state=envelope(env,zones,{initialUnits:total(zones),addedUnits:0},0);
  if(!isValidTerrariumBiotaV03(state))fail('invalid_biota_initial_state');
  return state;
}
const conditions=(env,z,i)=>{
  const climate=env.microclimate.cells[i];
  const substrate=env.substrate.zones[i];
  const root=substrate.root.waterUnits/substrate.root.capacityUnits;
  const surface=substrate.surface.waterUnits/substrate.surface.capacityUnits;
  const temperature=climate.temperatureC;
  // Heuristic only: moss has a surface-wetness proxy while ferns use root
  // moisture. No conversion to true tissue water potential or plant health.
  const moisture=z.plant.kind==='moss'
    ?Math.max(surface,climate.relativeHumidity*.45)
    :root;
  const light=z.plant.lightUnits/1000;
  const tolerableGameTemp=temperature>=12&&temperature<=35;
  const wetness=moisture>=.18&&moisture<=.92;
  const photosynthesisCandidate=z.plant.kind!=='none'&&
    light>=.22&&tolerableGameTemp&&wetness;
  const microbialActivity=temperature>=8&&temperature<=40?
    clamp((root+.7*surface)/1.7,0,1):0;
  return {moisture,root,surface,light,temperature,
    photosynthesisCandidate,microbialActivity};
};
function hourlyZone(env,z,i){
  const next=cloneZone(z),sig=conditions(env,z,i);
  const p=next.plant;
  // Display cover & condition are NOT biomass or quantified growth.
  if(p.kind!=='none'){
    if(sig.photosynthesisCandidate){
      p.conditionUnits=clamp(p.conditionUnits+2,0,1000);
      p.coverUnits=clamp(p.coverUnits+(p.conditionUnits>350?2:0),0,1000);
    }else{
      const stressed=sig.light<.04||sig.moisture<.05||
        sig.temperature<7||sig.temperature>39;
      if(stressed)p.conditionUnits=clamp(p.conditionUnits-2,0,1000);
      // A moss patch is not declared dead from dryness; many taxa recover.
      if(stressed&&p.conditionUnits<200)
        p.coverUnits=clamp(p.coverUnits-1,0,1000);
    }
  }
  const {decomposers:d}=next;
  // Presence indices are bounded proxies, NOT individuals or births/deaths.
  if(sig.microbialActivity>.20&&next.litterUnits>0)
    d.fungiIndex=clamp(d.fungiIndex+1,0,1000);
  else if(sig.microbialActivity<.10)
    d.fungiIndex=clamp(d.fungiIndex-1,0,1000);
  if(sig.microbialActivity>.18&&next.fragmentedUnits>0)
    d.springtailIndex=clamp(d.springtailIndex+1,0,1000);
  if(sig.microbialActivity<.09)
    d.springtailIndex=clamp(d.springtailIndex-1,0,1000);
  if(sig.microbialActivity>.20&&next.litterUnits>20)
    d.isopodIndex=clamp(d.isopodIndex+1,0,1000);
  if(sig.microbialActivity<.09)
    d.isopodIndex=clamp(d.isopodIndex-1,0,1000);
  const active=sig.microbialActivity;
  // ABSTRACT organic-pool transfers. Fungi/microbes represent decomposition,
  // fauna influence fragmentation. No "free nutrients" from empty substrate.
  const shred=Math.min(next.litterUnits,Math.floor(
    next.litterUnits*(d.fungiIndex+d.springtailIndex*.18+
      d.isopodIndex*.30)*active/100000
  ));
  next.litterUnits-=shred;
  next.fragmentedUnits+=shred;
  const mineral=Math.min(next.fragmentedUnits,Math.floor(
    next.fragmentedUnits*(d.fungiIndex+.15*d.springtailIndex)*
    active/130000
  ));
  next.fragmentedUnits-=mineral;
  next.mineralUnits+=mineral;
  return next;
}
/** 60-game-minute group update; full environment still advances each minute.
 * For split calls, the group update always occurs on minute % 60 === 0.
 */
export function advanceTerrariumBiotaV03(state,{minutes=1}={}){
  if(!isValidTerrariumBiotaV03(state)||
     !Number.isInteger(minutes)||minutes<1||minutes>240||
     state.minute+minutes>10000000||
     state.revision+minutes>10000000)
    fail('invalid_biota_minutes');
  let env=state.environment,zones=state.zones;
  for(let i=0;i<minutes;i++){
    env=advanceCoupledTerrariumEcology(env,{minutes:1});
    if(env.minute%60===0)
      zones=zones.map((z,j)=>hourlyZone(env,z,j));
  }
  const next=envelope(env,zones,state.ledger,state.revision+minutes);
  if(!isValidTerrariumBiotaV03(next))fail('biota_step_failed');
  return next;
}
/** Environment events are delegated to V0.2b; NO soil writes here.
 * Biota events explicitly add external organic material or change indices.
 */
export function applyTerrariumBiotaV03Event(state,event){
  if(!isValidTerrariumBiotaV03(state)||state.revision>=10000000||
     !obj(event))fail('invalid_biota_event');
  let env=state.environment,ledger={...state.ledger};
  const zones=state.zones.map(cloneZone);
  if(event.channel==='environment'){
    if(!only(event,['channel','event'])||!obj(event.event))
      fail('invalid_biota_environment_event');
    env=applyCoupledTerrariumEcologyEvent(env,event.event);
  }else if(event.channel==='biota'){
    if(typeof event.zoneId!=='string')fail('invalid_biota_zone_id');
    const z=zones.find(x=>x.id===event.zoneId);
    if(!z)fail('unknown_biota_zone');
    if(event.type==='leaf_litter'){
      if(!only(event,['channel','zoneId','type','amountUnits'])||
         !integer(event.amountUnits,5000)||event.amountUnits<1||
         ledger.addedUnits+event.amountUnits>MAX||
         z.litterUnits+event.amountUnits>MAX)
        fail('invalid_litter_event');
      z.litterUnits+=event.amountUnits;
      ledger.addedUnits+=event.amountUnits;
    }else if(event.type==='plant_patch'){
      if(!only(event,['channel','zoneId','type','plantKind','coverUnits'])||
         !TYPES.includes(event.plantKind)||
         !integer(event.coverUnits,1000)||
         (event.plantKind==='none'&&event.coverUnits!==0))
        fail('invalid_plant_patch');
      z.plant.kind=event.plantKind;
      z.plant.coverUnits=event.coverUnits;
      z.plant.conditionUnits=750;
      // Changing cover is a visual placement event, not material production.
    }else if(event.type==='light'){
      if(!only(event,['channel','zoneId','type','lightUnits'])||
         !integer(event.lightUnits,1000))fail('invalid_light_event');
      z.plant.lightUnits=event.lightUnits;
    }else if(event.type==='decomposer_index'){
      if(!only(event,['channel','zoneId','type','group','indexUnits'])||
         !GROUPS.includes(event.group)||
         !integer(event.indexUnits,1000))fail('invalid_decomposer_event');
      const key=event.group==='fungi'?'fungiIndex':
        event.group==='springtails'?'springtailIndex':'isopodIndex';
      z.decomposers[key]=event.indexUnits;
    }else fail('unknown_biota_event');
  }else fail('unknown_biota_channel');
  const next=envelope(env,zones,ledger,state.revision+1);
  if(!isValidTerrariumBiotaV03(next))fail('invalid_biota_event_result');
  return next;
}

export function inspectTerrariumBiotaV03(state){
  if(!isValidTerrariumBiotaV03(state))fail('invalid_biota_snapshot');
  return f({
    version:TERRARIUM_BIOTA_V03_VERSION,
    minute:state.minute,revision:state.revision,
    environment:inspectCoupledTerrariumEcology(state.environment),
    organicLedger:f({...state.ledger,currentUnits:total(state.zones)}),
    zones:f(state.zones.map((z,i)=>{
      const signals=conditions(state.environment,z,i);
      return f({
        id:z.id,
        plant:f({...z.plant}),
        plantActivity:z.plant.kind==='none'?'no_patch':
          signals.photosynthesisCandidate?'favourable_candidate':
          signals.light<.22?'light_limited_candidate':
          'water_or_temperature_limited_candidate',
        decomposers:f({...z.decomposers}),
        litterUnits:z.litterUnits,
        fragmentedUnits:z.fragmentedUnits,mineralUnits:z.mineralUnits,
        signals:f({
          lightIndex:z.plant.lightUnits,
          surfaceMoistureIndex:Number(signals.surface.toFixed(5)),
          rootMoistureIndex:Number(signals.root.toFixed(5)),
          temperatureC:signals.temperature
        })
      });
    })),
    evidenceStatus:'qualitative_ecological_relations_numeric_game_heuristics_only',
    organicUnits:'abstract_conserved_pool_units_not_real_carbon_or_nutrients'
  });
}
/** Existing snake sites still come from actual V0.2b ecology, not from
 * plant growth indices or an invented animal observation.
 */
export function buildTerrariumBiotaV03ActionSnapshot(state){
  if(!isValidTerrariumBiotaV03(state))
    fail('invalid_biota_action_snapshot');
  return buildCoupledTerrariumEcologyActionSnapshot(state.environment);
}
