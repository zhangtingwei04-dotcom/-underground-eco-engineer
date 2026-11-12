/**
 * Project OHM — V0.2b unified microclimate + substrate water clock.
 *
 * SOLE SOIL-WATER OWNER: V0.2 layer storage + integer ledger.
 * V0.1 substrateMoisture is a READ-ONLY, one-way root-saturation projection;
 * its legacy game-side moisture decay is disabled for coupled ticks.
 *
 * Separate resource: V0.1 waterLevel is the WATER BOWL indicator, never the
 * V0.2 soil ledger. Neither model is physically calibrated husbandry advice.
 *
 * This is an isolated immutable simulation slice; no persistence, transport
 * or actual saved-player migration.
 */
import {
  createTerrariumMicroclimate,
  isValidTerrariumMicroclimate,
  advanceTerrariumMicroclimate,
  changeTerrariumMicroclimateControls,
  projectTerrariumMicroclimateSoilMoisture,
  inspectTerrariumMicroclimate,
  buildTerrariumMicroclimateActionSnapshot
} from './terrarium-microclimate-v01.mjs';
import {
  createTerrariumSubstrateWater,
  isValidTerrariumSubstrateWater,
  advanceTerrariumSubstrateWater,
  applyTerrariumSubstrateWaterEvent,
  inspectTerrariumSubstrateWater
} from './terrarium-substrate-water-v02.mjs';

export const TERRARIUM_ECOLOGY_COUPLED_VERSION='0.2b';
const fail=s=>{throw new RangeError(s)};
const finiteInt=x=>Number.isSafeInteger(x)&&x>=0&&x<=10000000;
const obj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const legalKeys=(o,keys)=>obj(o)&&Object.keys(o).every(k=>keys.includes(k));
const round=x=>Number(x.toFixed(7));
const freeze=o=>Object.freeze(o);
const ratio=z=>round(z.root.waterUnits/z.root.capacityUnits);
const ratios=substrate=>substrate.zones.map(ratio);
const unchanged=(a,b)=>a.every((x,i)=>x===b[i]);

function ensureCompatible(climate,substrate){
  if(!isValidTerrariumMicroclimate(climate)||
     !isValidTerrariumSubstrateWater(substrate)||
     climate.rows!==1||climate.columns!==substrate.zones.length||
     climate.minute!==substrate.minute)
    fail('incompatible_coupled_ecology_clocks_or_grid');
}
const encapsulate=(climate,substrate,revision)=>freeze({
  schemaVersion:3,
  version:TERRARIUM_ECOLOGY_COUPLED_VERSION,
  ownership:'layered_substrate_root',
  minute:climate.minute,
  revision,
  microclimate:climate,
  substrate
});

export function isValidCoupledTerrariumEcology(state){
  try{
    if(!obj(state)||state.schemaVersion!==3||
       state.version!==TERRARIUM_ECOLOGY_COUPLED_VERSION||
       state.ownership!=='layered_substrate_root'||
       !finiteInt(state.minute)||!finiteInt(state.revision))
      return false;
    ensureCompatible(state.microclimate,state.substrate);
    return state.minute===state.microclimate.minute &&
      unchanged(state.microclimate.cells.map(c=>c.substrateMoisture),
        ratios(state.substrate));
  }catch{return false;}
}

/** Create a fresh prototype or compose two existing, aligned, VALID states.
 * Initial imported V0.1 moisture is discarded in favour of V0.2 root data.
 * The caller must not silently migrate actual saves via this function.
 */
export function createCoupledTerrariumEcology({
  microclimate=null,substrate=null,
  microclimateOptions={},substrateOptions={}
}={}){
  if(!legalKeys(microclimateOptions,
     ['columns','rows','ambient','cellOverrides','sites'])||
     !legalKeys(substrateOptions,['zones']))
    fail('invalid_coupled_creation_options');
  const c=microclimate??createTerrariumMicroclimate(microclimateOptions);
  const w=substrate??createTerrariumSubstrateWater(substrateOptions);
  ensureCompatible(c,w);
  const projected=projectTerrariumMicroclimateSoilMoisture(c,ratios(w));
  const state=encapsulate(projected,w,0);
  if(!isValidCoupledTerrariumEcology(state))fail('invalid_new_coupled_ecology');
  return state;
}

/**
 * Exact 1-minute lockstep. Each tick updates V0.2 water once FIRST, then
 * feeds V0.2 root saturation into V0.1 temperature/humidity for that minute.
 * V0.1 legacy soil evaporation is bypassed (no duplicate water deduction).
 * Split 27+33 and one 60-minute call must produce identical state.
 */
export function advanceCoupledTerrariumEcology(state,{minutes=1}={}){
  if(!isValidCoupledTerrariumEcology(state)||
     !Number.isInteger(minutes)||minutes<1||minutes>240||
     state.minute+minutes>10000000||state.revision+minutes>10000000)
    fail('invalid_coupled_ecology_advance');
  let c=state.microclimate,w=state.substrate;
  for(let i=0;i<minutes;i++){
    w=advanceTerrariumSubstrateWater(w,{minutes:1});
    c=advanceTerrariumMicroclimate(c,{
      minutes:1,externalMoistureByCell:ratios(w)
    });
  }
  const next=encapsulate(c,w,state.revision+minutes);
  if(!isValidCoupledTerrariumEcology(next))
    fail('invalid_coupled_ecology_advance_result');
  return next;
}

/**
 * Event authority is explicit. Substrate water actions can only touch V0.2
 * water and equipment, then update the V0.1 derived soil view.
 * V0.1 control updates MAY change an independent bowl's waterLevel, but
 * cannot write substrateMoisture (or water retention) behind V0.2's back.
 */
export function applyCoupledTerrariumEcologyEvent(state,event){
  if(!isValidCoupledTerrariumEcology(state)||state.revision>=10000000||
     !obj(event)||typeof event.channel!=='string')
    fail('invalid_coupled_ecology_event');
  let c=state.microclimate,w=state.substrate;
  if(event.channel==='substrate'){
    if(!legalKeys(event,['channel','event'])||!obj(event.event))
      fail('invalid_coupled_substrate_event');
    w=applyTerrariumSubstrateWaterEvent(w,event.event);
    c=projectTerrariumMicroclimateSoilMoisture(c,ratios(w));
  }else if(event.channel==='microclimate'){
    if(!legalKeys(event,['channel','cellId','changes'])||
       typeof event.cellId!=='string'||
       !obj(event.changes)||Object.keys(event.changes).length===0||
       Object.keys(event.changes).some(k=>
         ['substrateMoisture','substrateRetention'].includes(k)))
      fail('coupled_soil_water_owned_by_substrate');
    c=changeTerrariumMicroclimateControls(c,{
      cellId:event.cellId,changes:event.changes
    });
  }else fail('unknown_coupled_ecology_channel');
  const next=encapsulate(c,w,state.revision+1);
  if(!isValidCoupledTerrariumEcology(next))
    fail('invalid_coupled_ecology_event_result');
  return next;
}

/** Read-only, detached engineering status. No animal safety inference. */
export function inspectCoupledTerrariumEcology(state){
  if(!isValidCoupledTerrariumEcology(state))
    fail('invalid_coupled_ecology_state');
  const climate=inspectTerrariumMicroclimate(state.microclimate);
  const soil=inspectTerrariumSubstrateWater(state.substrate);
  return freeze({
    version:TERRARIUM_ECOLOGY_COUPLED_VERSION,
    revision:state.revision,
    minute:state.minute,
    moistureAuthority:'substrate_root_water_units',
    climate,soil,
    soilMoistureDerivedFromRoot:true,
    bowlPolicy:'separate_water_resource_not_in_soil_ledger',
    status:'engineering_coupling_not_a_validated_hydrology_or_welfare_model'
  });
}

/** Snake-site availability remains exactly the existing V0.1 contract.
 * Soil moisture does not imply an animal can dig or that water was consumed.
 */
export function buildCoupledTerrariumEcologyActionSnapshot(state){
  if(!isValidCoupledTerrariumEcology(state))
    fail('invalid_coupled_ecology_state');
  const snapshot=buildTerrariumMicroclimateActionSnapshot(state.microclimate);
  return freeze({...snapshot,revision:state.revision,
    couplingVersion:TERRARIUM_ECOLOGY_COUPLED_VERSION});
}
