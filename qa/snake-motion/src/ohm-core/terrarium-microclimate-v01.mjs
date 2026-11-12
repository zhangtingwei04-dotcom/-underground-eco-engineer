/**
 * Project OHM — Terrarium local microclimate V0.1.
 *
 * A deterministic, CPU-bounded, engine-independent 2D cell prototype.
 * Game tuning coefficients are NOT thermal physics, actual humidity/water
 * conservation, husbandry thresholds, physiology or disease diagnoses.
 * Units: temperatureC (degrees C as game state), relativeHumidity (0..1),
 * substrateMoisture (0..1), waterLevel (0..1), all other controls (0..1).
 *
 * Independent minute ticks: render FPS never controls the ecology clock.
 * No Date, RNG, storage, network, Phaser, or writes to player saves.
 */
export const TERRARIUM_MICROCLIMATE_VERSION='0.1';
const TYPES=Object.freeze([
  'hide','warm_area','cool_area','water','loose_substrate',
  'branch','covered_area','open_area'
]);
const ID=/^[a-z][a-z0-9_-]{0,63}$/;
const ENV_CLASS=new Set(['normal','too_dry','too_damp','unknown']);
const KEYS=Object.freeze([
  'heater','cooler','shade','ventilation','substrateRetention',
  'substrateMoisture','waterLevel'
]);
const num=x=>typeof x==='number'&&Number.isFinite(x);
const unit=x=>num(x)&&x>=0&&x<=1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const rnd=x=>Number(x.toFixed(7));
const owns=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const obj=o=>o&&typeof o==='object'&&!Array.isArray(o);
const fail=why=>{throw new RangeError(why);};
const frozen=o=>Object.freeze(o);
const DEFAULT=Object.freeze({
  heater:0,cooler:0,shade:0,ventilation:.35,
  substrateRetention:.5,substrateMoisture:.15,waterLevel:0
});
const sampleDefaults=Object.freeze({temperatureC:24,relativeHumidity:.50});
const allowedFlags=new Set([
  'hasCover','diggable','branchStable','waterReachable',
  'thermalService','qualityFlag'
]);
function controls(input){
  if(!obj(input)||Object.keys(input).some(k=>!KEYS.includes(k)))fail('unknown_microclimate_control');
  for(const v of Object.values(input))if(!unit(v))fail('invalid_microclimate_control');
  return input;
}
function checkAmbient(a){
  if(!obj(a)||!num(a.temperatureC)||a.temperatureC<0||a.temperatureC>50||
     !unit(a.relativeHumidity))fail('invalid_microclimate_ambient');
}
function checkSites(sites,cellCount){
  if(!Array.isArray(sites)||sites.length>256)fail('invalid_microclimate_sites');
  const seen=new Set();
  for(const s of sites){
    if(!obj(s)||typeof s.id!=='string'||!ID.test(s.id)||seen.has(s.id)||
       !TYPES.includes(s.kind)||!Number.isInteger(s.cellIndex)||
       s.cellIndex<0||s.cellIndex>=cellCount||
       typeof s.safe!=='boolean'||typeof s.reachable!=='boolean'||
       !unit(s.distanceCost)||!obj(s.flags)||
       Object.entries(s.flags).some(([k,v])=>!allowedFlags.has(k)||typeof v!=='boolean')||
       s.microclimateClass!==undefined&&!ENV_CLASS.has(s.microclimateClass))
      fail('invalid_microclimate_site');
    seen.add(s.id);
  }
}
/** Validator accepts JSON roundtrips but rejects malformed/tampered states. */
export function isValidTerrariumMicroclimate(state){
  try{
    if(!obj(state)||state.schemaVersion!==1||
       !Number.isInteger(state.columns)||state.columns<1||state.columns>12||
       !Number.isInteger(state.rows)||state.rows<1||state.rows>12||
       !Number.isSafeInteger(state.revision)||state.revision<0||state.revision>1e7||
       !Number.isSafeInteger(state.minute)||state.minute<0||state.minute>1e7)
      return false;
    checkAmbient(state.ambient);
    const size=state.rows*state.columns;
    if(!Array.isArray(state.cells)||state.cells.length!==size)return false;
    for(let i=0;i<size;i++){
      const c=state.cells[i];
      if(!obj(c)||c.id!=='cell_'+(i%state.columns)+'_'+Math.floor(i/state.columns)||
         c.x!==i%state.columns||c.y!==Math.floor(i/state.columns)||
         !num(c.temperatureC)||c.temperatureC<0||c.temperatureC>60||
         !unit(c.relativeHumidity))return false;
      controls(Object.fromEntries(KEYS.map(k=>[k,c[k]])));
    }
    checkSites(state.sites,size);
    return true;
  }catch{return false;}
}
function freezeCell(c){return frozen(c)}
function freezeSite(s){return frozen({...s,flags:frozen({...s.flags})})}
function freezeState(s){return frozen({...s,ambient:frozen({...s.ambient}),
  cells:frozen(s.cells.map(freezeCell)),
  sites:frozen(s.sites.map(freezeSite))})}

/** Every site must explicitly supply assessed safe/reachable flags.
 * No humidity/temperature number will be called biologically 'safe'.
 */
export function createTerrariumMicroclimate({
  columns=5,rows=1,ambient=sampleDefaults,
  cellOverrides=[],sites=[]
}={}){
  if(!Number.isInteger(columns)||columns<1||columns>12||
     !Number.isInteger(rows)||rows<1||rows>12||
     !Array.isArray(cellOverrides)||cellOverrides.length>columns*rows)
    fail('invalid_microclimate_grid');
  checkAmbient(ambient);
  const count=columns*rows;
  const cells=Array.from({length:count},(_,i)=>({
    id:'cell_'+(i%columns)+'_'+Math.floor(i/columns),
    x:i%columns,y:Math.floor(i/columns),
    temperatureC:ambient.temperatureC,
    relativeHumidity:ambient.relativeHumidity,...DEFAULT
  }));
  const touched=new Set();
  for(const override of cellOverrides){
    if(!obj(override)||!Number.isInteger(override.x)||!Number.isInteger(override.y)||
       override.x<0||override.x>=columns||override.y<0||override.y>=rows)
      fail('invalid_microclimate_cell');
    const at=override.y*columns+override.x;
    if(touched.has(at))fail('duplicate_microclimate_cell');
    touched.add(at);
    const fields={...override};delete fields.x;delete fields.y;
    controls(fields);
    Object.assign(cells[at],fields);
  }
  checkSites(sites,count);
  const state=freezeState({
    schemaVersion:1,revision:0,minute:0,columns,rows,
    ambient:{temperatureC:ambient.temperatureC,
      relativeHumidity:ambient.relativeHumidity},
    cells,sites
  });
  if(!isValidTerrariumMicroclimate(state))fail('microclimate_creation_failed');
  return state;
}
function neighbors(s,i){
  const {rows,columns}=s,x=i%columns,y=Math.floor(i/columns);
  const out=[];
  if(x>0)out.push(i-1);
  if(x<columns-1)out.push(i+1);
  if(y>0)out.push(i-columns);
  if(y<rows-1)out.push(i+columns);
  return out;
}
function tick(s,externalMoistureByCell=null){
  const cells=s.cells.map((c,i)=>{
    // In a coupled V0.2b tick, layered substrate is the sole source
    // of root-zone water. The legacy moisture decay must NOT run again.
    const inputMoisture=externalMoistureByCell===null?
      c.substrateMoisture:externalMoistureByCell[i];
    const n=neighbors(s,i).map(k=>s.cells[k]);
    const mean=(key)=>n.length?n.reduce((a,b)=>a+b[key],0)/n.length:c[key];
    const temp=c.temperatureC+
      .12*(mean('temperatureC')-c.temperatureC)+
      (.025+.014*c.ventilation)*(s.ambient.temperatureC-c.temperatureC)+
      .24*c.heater-.18*c.cooler-.017*c.shade;
    // These humidity values are normalised game *indicators*, not
    // simulated absolute atmospheric water masses.
    const rh=c.relativeHumidity+
      .11*(mean('relativeHumidity')-c.relativeHumidity)+
      (.024+.02*c.ventilation)*(s.ambient.relativeHumidity-c.relativeHumidity)+
      .007*c.waterLevel+.0025*inputMoisture-.002*c.heater;
    const moisture=externalMoistureByCell===null?
      clamp(c.substrateMoisture-
        .0007*(1-.55*c.substrateRetention)*(1-.35*c.shade),0,1):
      inputMoisture;
    const water=clamp(c.waterLevel-.00032*(1+.45*c.heater),0,1);
    return {...c,
      temperatureC:rnd(clamp(temp,0,60)),
      relativeHumidity:rnd(clamp(rh,0,1)),
      substrateMoisture:rnd(moisture),
      waterLevel:rnd(water)
    };
  });
  return freezeState({...s,revision:s.revision+1,minute:s.minute+1,cells});
}
/** Fixed one-minute settlement: A+B minutes equals A, then B minutes. */
export function advanceTerrariumMicroclimate(state,{
  minutes=1,externalMoistureByCell=null
}={}){
  if(!isValidTerrariumMicroclimate(state)||!Number.isInteger(minutes)||
     minutes<1||minutes>240||state.minute+minutes>1e7||
     state.revision+minutes>1e7)
    fail('invalid_microclimate_advance');
  if(externalMoistureByCell!==null){
    if(minutes!==1||!Array.isArray(externalMoistureByCell)||
       externalMoistureByCell.length!==state.cells.length||
       externalMoistureByCell.some(v=>!unit(v)))
      fail('invalid_external_soil_moisture');
  }
  let s=state;
  for(let t=0;t<minutes;t++)s=tick(s,externalMoistureByCell);
  return s;
}
/**
 * Event/initialization projection for V0.2b. The coupled state owns soil
 * water and this returns only a derived moisture *view* for V0.1.
 * Does not change the game clock or touch water-balance ledger.
 */
export function projectTerrariumMicroclimateSoilMoisture(state,ratios){
  if(!isValidTerrariumMicroclimate(state)||state.revision>=1e7||
     !Array.isArray(ratios)||ratios.length!==state.cells.length||
     ratios.some(v=>!unit(v)))fail('invalid_soil_moisture_projection');
  const cells=state.cells.map((c,i)=>({...c,substrateMoisture:ratios[i]}));
  return freezeState({...state,revision:state.revision+1,cells});
}
/** Apply player/scene equipment or moisture events without changing time. */
export function changeTerrariumMicroclimateControls(state,{cellId,changes}={}){
  if(!isValidTerrariumMicroclimate(state)||typeof cellId!=='string'||
     !obj(changes)||Object.keys(changes).length===0||
     state.revision>=1e7)fail('invalid_microclimate_change');
  controls(changes);
  const at=state.cells.findIndex(c=>c.id===cellId);
  if(at<0)fail('microclimate_cell_not_found');
  const cells=state.cells.map((c,i)=>i===at?{...c,...changes}:c);
  return freezeState({...state,revision:state.revision+1,cells});
}
/** Return a detached, immutable read-only cell view; never a welfare report. */
export function inspectTerrariumMicroclimate(state){
  if(!isValidTerrariumMicroclimate(state))fail('invalid_microclimate_state');
  return frozen({
    version:TERRARIUM_MICROCLIMATE_VERSION,
    revision:state.revision,minute:state.minute,
    grid:frozen({columns:state.columns,rows:state.rows}),
    cells:frozen(state.cells.map(c=>frozen({
      id:c.id,x:c.x,y:c.y,temperatureC:c.temperatureC,
      relativeHumidity:c.relativeHumidity,
      substrateMoisture:c.substrateMoisture,waterLevel:c.waterLevel
    }))),
    status:'relative_game_microclimate_no_animal_suitability_inferred'
  });
}
/**
 * Bridge to buildSnakeActionInputFromEcology. Every site explicitly
 * receives externally assessed safety/path access. Flags are independent:
 * a warm area with an OFF heater is not a working heat service; water bowl
 * availability also needs an accessible water source, not proximity alone.
 * Humidity cannot automatically diagnose disease or judge microclimate.
 */
export function buildTerrariumMicroclimateActionSnapshot(state){
  if(!isValidTerrariumMicroclimate(state))fail('invalid_microclimate_state');
  const sites=state.sites.map(s=>{
    const c=state.cells[s.cellIndex],f=s.flags;
    const conditions={
      qualityFlag:f.qualityFlag??false,
      microclimate:s.microclimateClass??'unknown'
    };
    if(s.kind==='hide'||s.kind==='covered_area')
      conditions.hasCover=f.hasCover===true;
    if(s.kind==='water')
      conditions.hasWater=f.waterReachable===true&&c.waterLevel>0;
    if(s.kind==='loose_substrate')
      conditions.diggable=f.diggable===true;
    if(s.kind==='branch')
      conditions.branchStable=f.branchStable===true;
    if(s.kind==='warm_area')
      conditions.thermalService=f.thermalService===true&&c.heater>0;
    if(s.kind==='cool_area')
      conditions.thermalService=f.thermalService===true&&c.cooler>0;
    return frozen({id:s.id,kind:s.kind,safe:s.safe,
      reachable:s.reachable,distanceCost:s.distanceCost,
      conditions:frozen(conditions)});
  });
  return frozen({revision:state.revision,sites:frozen(sites)});
}
