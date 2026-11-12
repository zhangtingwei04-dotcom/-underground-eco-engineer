/**
 * Project OHM — layered terrarium substrate water V0.2.
 *
 * Three storage layers per zone: surface litter/moss, root/substrate soil,
 * and an artificial drainage reservoir. A mesh sits between root and drain
 * (permeability switch, NOT another water tank). Water moves by deterministic,
 * integer, bounded game rules, never real-world litres or soil hydraulic data.
 *
 * Strict ledger: initial + added = current + evaporated + drained + overflow.
 * No disease, welfare, humidity or temperature inference. No save or network I/O.
 */
export const TERRARIUM_SUBSTRATE_WATER_VERSION='0.2';
const num=x=>Number.isSafeInteger(x)&&x>=0;
const range=(x,lo,hi)=>Number.isSafeInteger(x)&&x>=lo&&x<=hi;
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  (Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const fail=s=>{throw new RangeError(s)};
const cap=(v,top)=>Math.min(top,Math.max(0,v));
const frac=(x,c)=>x/c;
const keys=Object.freeze([
 'surfaceCapacityUnits','rootCapacityUnits','drainageCapacityUnits',
 'surfaceWaterUnits','rootWaterUnits','drainageWaterUnits',
 'infiltrationPermille','percolationPermille','wickingPermille',
 'evaporationPermille','lateralPermille','outletPermille',
 'meshOpen','outletOpen'
]);
const RATE_NAMES=Object.freeze([
 'infiltrationPermille','percolationPermille','wickingPermille',
 'evaporationPermille','lateralPermille','outletPermille'
]);
export const SUBSTRATE_TEST_DEFAULT=Object.freeze({
 surfaceCapacityUnits:1000,rootCapacityUnits:3200,drainageCapacityUnits:2600,
 surfaceWaterUnits:180,rootWaterUnits:920,drainageWaterUnits:0,
 infiltrationPermille:160,percolationPermille:45,wickingPermille:10,
 evaporationPermille:18,lateralPermille:20,outletPermille:40,
 meshOpen:true,outletOpen:false
});
function checkProfile(o){
 if(!isObj(o)||Object.keys(o).some(k=>!keys.includes(k)))fail('invalid_substrate_profile');
 const p={...SUBSTRATE_TEST_DEFAULT,...o};
 for(const k of ['surfaceCapacityUnits','rootCapacityUnits','drainageCapacityUnits'])
  if(!range(p[k],100,100000))fail('invalid_substrate_capacity');
 for(const [key,storage] of [
  ['surfaceWaterUnits','surfaceCapacityUnits'],
  ['rootWaterUnits','rootCapacityUnits'],
  ['drainageWaterUnits','drainageCapacityUnits']
 ])if(!range(p[key],0,p[storage]))fail('invalid_substrate_initial_water');
 for(const k of RATE_NAMES)if(!range(p[k],0,1000))fail('invalid_substrate_rate');
 if(typeof p.meshOpen!=='boolean'||typeof p.outletOpen!=='boolean')
  fail('invalid_substrate_equipment');
 return p;
}
const currentTotal=zones=>zones.reduce((sum,z)=>
 sum+z.surface.waterUnits+z.root.waterUnits+z.drainage.waterUnits,0);
const layer=(capacityUnits,waterUnits)=>Object.freeze({capacityUnits,waterUnits});
const zoneFreeze=z=>Object.freeze({
  id:z.id,
  surface:layer(z.surface.capacityUnits,z.surface.waterUnits),
  root:layer(z.root.capacityUnits,z.root.waterUnits),
  drainage:layer(z.drainage.capacityUnits,z.drainage.waterUnits),
  meshOpen:z.meshOpen,outletOpen:z.outletOpen,
  rates:Object.freeze({...z.rates})
});
const freezeState=s=>Object.freeze({...s,
 zones:Object.freeze(s.zones.map(zoneFreeze)),
 ledger:Object.freeze({...s.ledger})
});
function packZone(i,p){
 return {
  id:'zone_'+i,
  surface:{capacityUnits:p.surfaceCapacityUnits,waterUnits:p.surfaceWaterUnits},
  root:{capacityUnits:p.rootCapacityUnits,waterUnits:p.rootWaterUnits},
  drainage:{capacityUnits:p.drainageCapacityUnits,waterUnits:p.drainageWaterUnits},
  meshOpen:p.meshOpen,outletOpen:p.outletOpen,
  rates:Object.fromEntries(RATE_NAMES.map(k=>[k,p[k]]))
 };
}
export function isValidTerrariumSubstrateWater(s){
 try{
  if(!isObj(s)||s.schemaVersion!==2||
    s.version!==TERRARIUM_SUBSTRATE_WATER_VERSION||
    !range(s.minute,0,10000000)||!range(s.revision,0,10000000)||
    !Array.isArray(s.zones)||s.zones.length<1||s.zones.length>12||
    !isObj(s.ledger))return false;
  const ledger=s.ledger;
  if(!['initialUnits','addedUnits','evaporatedUnits','drainedUnits','overflowUnits']
    .every(k=>range(ledger[k],0,1000000000))||
    Object.keys(ledger).length!==5)return false;
  for(let i=0;i<s.zones.length;i++){
    const z=s.zones[i];
    if(!isObj(z)||z.id!=='zone_'+i||
      !isObj(z.surface)||!isObj(z.root)||!isObj(z.drainage)||
      typeof z.meshOpen!=='boolean'||typeof z.outletOpen!=='boolean'||
      !isObj(z.rates)||Object.keys(z.rates).length!==RATE_NAMES.length||
      !RATE_NAMES.every(k=>own(z.rates,k)&&range(z.rates[k],0,1000)))
      return false;
    for(const l of [z.surface,z.root,z.drainage])
      if(!range(l.capacityUnits,100,100000)||
        !range(l.waterUnits,0,l.capacityUnits)||
        Object.keys(l).length!==2)return false;
  }
  return ledger.initialUnits+ledger.addedUnits===
    currentTotal(s.zones)+ledger.evaporatedUnits+
    ledger.drainedUnits+ledger.overflowUnits;
 }catch{return false;}
}
/** Optional overrides form a list of complete per-zone parameters (defaults
 * fill missing fields). Neither screens nor bottom layers hold unlimited water.
 */
export function createTerrariumSubstrateWater({zones=Array.from({length:5},()=>({}))}={}){
 if(!Array.isArray(zones)||zones.length<1||zones.length>12)
  fail('invalid_substrate_zone_count');
 const records=zones.map((input,i)=>packZone(i,checkProfile(input)));
 const s=freezeState({
  schemaVersion:2,version:TERRARIUM_SUBSTRATE_WATER_VERSION,
  minute:0,revision:0,zones:records,
  ledger:{
   initialUnits:currentTotal(records),addedUnits:0,
   evaporatedUnits:0,drainedUnits:0,overflowUnits:0
  }
 });
 if(!isValidTerrariumSubstrateWater(s))fail('invalid_new_substrate');
 return s;
}
const transfer=(source,dest,requested)=>{
 const n=cap(requested,Math.min(source.waterUnits,
  dest.capacityUnits-dest.waterUnits));
 source.waterUnits-=n;dest.waterUnits+=n;return n;
};
const emptyZone=z=>({
 ...z,
 surface:{...z.surface},root:{...z.root},drainage:{...z.drainage},
 rates:{...z.rates}
});
function step(s){
 const zones=s.zones.map(emptyZone),ledger={...s.ledger};
 for(const z of zones){
  const {surface,root,drainage,rates:r}=z;
  const evaporation=Math.min(surface.waterUnits,
    Math.floor(surface.waterUnits*r.evaporationPermille/1000));
  surface.waterUnits-=evaporation;ledger.evaporatedUnits+=evaporation;
  transfer(surface,root,
    Math.floor(surface.waterUnits*r.infiltrationPermille/1000));
  if(z.meshOpen)
    transfer(root,drainage,
      Math.floor(root.waterUnits*r.percolationPermille/1000));
  // Capillary return is conditional on drier upper material. It is a
  // visual game heuristic, not a model of matric potential.
  if(frac(surface.waterUnits,surface.capacityUnits) <
      frac(root.waterUnits,root.capacityUnits)*.55)
    transfer(root,surface,Math.floor(root.waterUnits*r.wickingPermille/1000));
  if(z.outletOpen){
    const drain=Math.floor(drainage.waterUnits*r.outletPermille/1000);
    drainage.waterUnits-=drain;ledger.drainedUnits+=drain;
  }
 }
 // Adjacent root zones exchange storage units, one pair at a time.
 // Fixed left-to-right order is deterministic; no physical permeability
 // claim is made. Flow is capacity-limited, never generated or destroyed.
 for(let i=0;i<zones.length-1;i++){
  const left=zones[i],right=zones[i+1];
  const difference=frac(left.root.waterUnits,left.root.capacityUnits)-
    frac(right.root.waterUnits,right.root.capacityUnits);
  if(Math.abs(difference)<1e-12)continue;
  const donor=difference>0?left:right;
  const receiver=difference>0?right:left;
  const rate=Math.min(left.rates.lateralPermille,
    right.rates.lateralPermille);
  const proposed=Math.floor(Math.abs(difference)*
    Math.min(donor.root.capacityUnits,receiver.root.capacityUnits)*rate/1000);
  transfer(donor.root,receiver.root,proposed);
 }
 return freezeState({...s,minute:s.minute+1,revision:s.revision+1,
  zones,ledger});
}
/** Time progresses by whole GAME minutes, not rendering FPS. 240 max per call. */
export function advanceTerrariumSubstrateWater(s,{minutes=1}={}){
 if(!isValidTerrariumSubstrateWater(s)||
   !range(minutes,1,240)||s.minute+minutes>10000000||
   s.revision+minutes>10000000)fail('invalid_substrate_time_step');
 let state=s;
 for(let i=0;i<minutes;i++)state=step(state);
 return state;
}
/** Inputs are waterUnits (abstract integers), not millilitres. */
export function applyTerrariumSubstrateWaterEvent(s,event){
 if(!isValidTerrariumSubstrateWater(s)||s.revision>=10000000||
   !isObj(event)||typeof event.zoneId!=='string')fail('invalid_substrate_event');
 const i=s.zones.findIndex(z=>z.id===event.zoneId);
 if(i<0)fail('unknown_substrate_zone');
 const zones=s.zones.map(emptyZone),z=zones[i],ledger={...s.ledger};
 if(event.type==='mist'||event.type==='water'){
  if(!range(event.amountUnits,1,5000)||
    Object.keys(event).some(k=>!['type','zoneId','amountUnits'].includes(k)))
    fail('invalid_substrate_water_amount');
  const accepted=Math.min(event.amountUnits,
    z.surface.capacityUnits-z.surface.waterUnits);
  z.surface.waterUnits+=accepted;
  ledger.addedUnits+=event.amountUnits;
  ledger.overflowUnits+=event.amountUnits-accepted;
 }else if(event.type==='drain'){
  if(!range(event.amountUnits,1,5000)||
    Object.keys(event).some(k=>!['type','zoneId','amountUnits'].includes(k)))
    fail('invalid_substrate_drain_amount');
  const drained=Math.min(z.drainage.waterUnits,event.amountUnits);
  z.drainage.waterUnits-=drained;
  ledger.drainedUnits+=drained;
 }else if(event.type==='mesh'||event.type==='outlet'){
  if(typeof event.open!=='boolean'||
    Object.keys(event).some(k=>!['type','zoneId','open'].includes(k)))
    fail('invalid_substrate_switch');
  if(event.type==='mesh')z.meshOpen=event.open;
  else z.outletOpen=event.open;
 }else fail('unknown_substrate_event');
 const next=freezeState({...s,revision:s.revision+1,zones,ledger});
 if(!isValidTerrariumSubstrateWater(next))fail('invalid_substrate_event_result');
 return next;
}
/** Readout only; does not classify snake health or plants. */
export function inspectTerrariumSubstrateWater(s){
 if(!isValidTerrariumSubstrateWater(s))fail('invalid_substrate_state');
 return Object.freeze({
  version:s.version,minute:s.minute,revision:s.revision,
  units:'abstract_integer_water_storage_units_not_ml',
  totalUnits:currentTotal(s.zones),
  ledger:Object.freeze({...s.ledger}),
  zones:Object.freeze(s.zones.map(z=>Object.freeze({
   id:z.id,meshOpen:z.meshOpen,outletOpen:z.outletOpen,
   layers:Object.freeze(['surface','root','drainage'].map(k=>
    Object.freeze({kind:k,waterUnits:z[k].waterUnits,
      capacityUnits:z[k].capacityUnits,
      saturation:z[k].waterUnits/z[k].capacityUnits})))
  }))),
  status:'mass_accounted_game_water_layers_not_actual_hydrology'
 });
}
/**
 * This is a READ-ONLY proposal for V0.1's cell substrate moisture field.
 * Do not apply on every tick while V0.1 also evaporates substrate moisture:
 * first establish a single owner/clock, then integrate via versioned adapter.
 */
export function buildSubstrateToMicroclimateDraft(s,climate){
 if(!isValidTerrariumSubstrateWater(s)||!climate||
  !Array.isArray(climate.cells)||climate.cells.length!==s.zones.length)
  fail('incompatible_substrate_climate_grid');
 const changes=s.zones.map((z,i)=>Object.freeze({
  cellId:climate.cells[i].id,
  changes:Object.freeze({
   substrateMoisture:Number((z.root.waterUnits/z.root.capacityUnits).toFixed(7))
  })
 }));
 if(changes.some(x=>typeof x.cellId!=='string'||!/^cell_\d+_\d+$/.test(x.cellId)))
  fail('invalid_climate_cell_id');
 return Object.freeze({version:'0.2-draft',sourceRevision:s.revision,
  changes:Object.freeze(changes),
  policy:'read_only_proposal_do_not_double_update_v01_moisture'
 });
}
