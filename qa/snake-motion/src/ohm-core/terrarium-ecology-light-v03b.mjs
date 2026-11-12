/**
 * OHM ECO V0.3b: deterministic plant taxon references, local light schedules,
 * and explicitly sourced organic input. Isolated engineering prototype.
 *
 * V0.3a owns plant/decomposer and organic ledger; V0.2b owns water/time.
 * THIS adapter is the sole owner of V0.3a's lightUnits while coupled.
 * Light intensities, distances and growth coefficients are fictional game
 * indices, not PPFD/DLI, horticultural advice, safety or real photosynthesis.
 */
import {
  createTerrariumBiotaV03,isValidTerrariumBiotaV03,
  advanceTerrariumBiotaV03,applyTerrariumBiotaV03Event,
  inspectTerrariumBiotaV03,buildTerrariumBiotaV03ActionSnapshot
} from './terrarium-biota-v03a.mjs';

export const TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION='0.3b';
const fail=m=>{throw new RangeError(m)};
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const keys=(x,allowed)=>obj(x)&&Object.keys(x).every(k=>allowed.includes(k));
const int=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const freeze=Object.freeze;
const uid=x=>typeof x==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(x);
const kind=['artificial_led','daylight_proxy'];
const sources=['player_placement','simulated_event','research_staff'];
const patchKinds=['moss','fern'];
const taxonData=[
 {id:'moss_polytrichum_commune',plantKind:'moss',
   scientificName:'Polytrichum commune Hedw.',
   taxonomyUrl:'https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=3213',
   evidence:'taxonomy_name_only'},
 {id:'fern_nephrolepis_exaltata',plantKind:'fern',
   scientificName:'Nephrolepis exaltata (L.) Schott',
   taxonomyUrl:'https://powo.science.kew.org/taxon/17160830-1',
   evidence:'taxonomy_name_only'}
];
export const OHM_PLANT_TAXON_REFERENCES_V03B=freeze(taxonData.map(x=>
 freeze({...x,husbandry:'not_evaluated',snakeCoHousing:'not_evaluated',
   modelCoefficients:'generic_morphotype_game_heuristic_only'})));
const byId=new Map(OHM_PLANT_TAXON_REFERENCES_V03B.map(x=>[x.id,x]));
const normFixture=x=>{
 if(!keys(x,['id','type','zoneIndex','strengthUnits','spreadZones',
             'heightUnits','startMinute','durationMinutes'])||
    !uid(x.id)||!kind.includes(x.type)||
    !int(x.zoneIndex,11)||!int(x.strengthUnits,1000)||
    !int(x.spreadZones,11)||!int(x.heightUnits,1000)||
    !int(x.startMinute,1439)||!int(x.durationMinutes,1440)||
    x.durationMinutes===0)fail('invalid_light_fixture');
 return freeze({...x});
};
const validFixtures=(list,count)=>{
 if(!Array.isArray(list)||list.length>12)return false;
 const ids=new Set();
 return list.every(x=>{
  let y;
  try{y=normFixture(x)}catch{return false}
  if(ids.has(y.id)||y.zoneIndex>=count)return false;
  ids.add(y.id);return true;
 });
};
const validTransmission=(a,count)=>Array.isArray(a)&&a.length===count&&
 a.every(x=>int(x,1000));
const fullTransmission=count=>Array(count).fill(1000);
const inWindow=(f,minute)=>{
 const offset=((minute%1440)-f.startMinute+1440)%1440;
 return offset<f.durationMinutes;
};
function illumination(fixtures,minute,count,transmission){
 return Array.from({length:count},(_,i)=>{
  let units=0;
  for(const lamp of fixtures){
   if(!inWindow(lamp,minute))continue;
   const d=Math.abs(i-lamp.zoneIndex);
   if(d>lamp.spreadZones)continue;
   // Distance and height are schematic attenuation, not measured lux/PPFD.
   const spread=(lamp.spreadZones+1-d)/(lamp.spreadZones+1);
   units+=Math.floor(lamp.strengthUnits*spread*
     (1000/(1000+lamp.heightUnits)));
  }
  return Math.floor(Math.min(1000,units)*transmission[i]/1000);
 });
}
const validSpecies=(refs,zones)=>{
 if(!Array.isArray(refs)||refs.length!==zones.length)return false;
 return refs.every((id,i)=>id===null||
  (byId.has(id)&&byId.get(id).plantKind===zones[i].plant.kind));
};
const validReceipt=(v,count)=>{
 return keys(v,['eventId','minute','zoneId','amountUnits','source',
                'classification'])&&
 uid(v.eventId)&&int(v.minute,10000000)&&
 typeof v.zoneId==='string'&&
 /^zone_(\d{1,2})$/.test(v.zoneId)&&
 Number(v.zoneId.slice(5))<count&&
 int(v.amountUnits,5000)&&v.amountUnits>0&&
 keys(v.source,['kind','referenceId'])&&sources.includes(v.source.kind)&&
 uid(v.source.referenceId)&&
 v.classification==='in_game_event_not_observation';
};
const envelope=(biota,fixtures,species,receipts,revision,transmission)=>freeze({
 schemaVersion:5,version:TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION,
 minute:biota.minute,revision,biota,
 fixtures:freeze(fixtures.map(x=>freeze({...x}))),
 transmissionByZone:freeze([...transmission]),
 speciesByZone:freeze([...species]),
 receipts:freeze(receipts.map(x=>freeze({...x,source:freeze({...x.source})})))
});
function alignLight(biota,fixtures,targetMinute,transmission){
 const light=illumination(fixtures,targetMinute,biota.zones.length,
   transmission);
 for(let i=0;i<light.length;i++){
  if(biota.zones[i].plant.lightUnits===light[i])continue;
  biota=applyTerrariumBiotaV03Event(biota,{channel:'biota',
    zoneId:'zone_'+i,type:'light',lightUnits:light[i]});
 }
 return biota;
}
export function isValidTerrariumEcologyLightV03b(s){
 try{
  if(!obj(s)||s.schemaVersion!==5||
     s.version!==TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION||
     !int(s.minute,10000000)||!int(s.revision,10000000)||
     !isValidTerrariumBiotaV03(s.biota)||s.minute!==s.biota.minute||
     !validFixtures(s.fixtures,s.biota.zones.length)||
     !validTransmission(s.transmissionByZone,s.biota.zones.length)||
     !validSpecies(s.speciesByZone,s.biota.zones)||
     !Array.isArray(s.receipts)||s.receipts.length>128||
     !s.receipts.every(x=>validReceipt(x,s.biota.zones.length))||
     new Set(s.receipts.map(x=>x.eventId)).size!==s.receipts.length||
     s.receipts.some(x=>x.minute>s.minute))
    return false;
  const light=illumination(s.fixtures,s.minute,s.biota.zones.length,
    s.transmissionByZone);
  return light.every((v,i)=>v===s.biota.zones[i].plant.lightUnits);
 }catch{return false}
}
/** Reference names provide verified taxonomic spelling ONLY. Neither taxon is
 * automatically selected for terrarium co-housing or real species parameters.
 */
export function createTerrariumEcologyLightV03b({
 biota=null,biotaOptions={},fixtures=[],speciesByZone=null,
 transmissionByZone=null
}={}){
 if(!keys(biotaOptions,['environment','environmentOptions','zoneConfigs']))
  fail('invalid_light_creation_options');
 let raw=biota??createTerrariumBiotaV03(biotaOptions);
 if(!isValidTerrariumBiotaV03(raw)||
    !validFixtures(fixtures,raw.zones.length))
  fail('invalid_light_environment_or_fixtures');
 const species=speciesByZone===null?
  Array(raw.zones.length).fill(null):speciesByZone;
 const transmission=transmissionByZone===null?
  fullTransmission(raw.zones.length):transmissionByZone;
 if(!validTransmission(transmission,raw.zones.length))
  fail('invalid_light_transmission');
 if(!validSpecies(species,raw.zones))fail('invalid_plant_taxon_references');
 raw=alignLight(raw,fixtures,raw.minute,transmission);
 const out=envelope(raw,fixtures,species,[],0,transmission);
 if(!isValidTerrariumEcologyLightV03b(out))fail('invalid_v03b_created');
 return out;
}
/** Apply the future minute's lighting BEFORE the shared hourly biota update.
 * Thus an on/off boundary on hour H is honored by the Hth hourly tick.
 * Chunk sizes and repeated calls are numerically identical.
 */
export function advanceTerrariumEcologyLightV03b(state,{minutes=1}={}){
 if(!isValidTerrariumEcologyLightV03b(state)||
    !Number.isInteger(minutes)||minutes<1||minutes>240||
    state.minute+minutes>10000000||state.revision+minutes>10000000)
  fail('invalid_v03b_minutes');
 let biota=state.biota;
 for(let i=0;i<minutes;i++){
  biota=alignLight(biota,state.fixtures,biota.minute+1,
      state.transmissionByZone);
  biota=advanceTerrariumBiotaV03(biota,{minutes:1});
 }
 const out=envelope(biota,state.fixtures,state.speciesByZone,
   state.receipts,state.revision+minutes,state.transmissionByZone);
 if(!isValidTerrariumEcologyLightV03b(out))fail('invalid_v03b_step');
 return out;
}
/** Light fixtures are the only authority for lightUnits in this adapter.
 * Organic events require explicit provenance; NEVER imply eyewitness
 * observations. A scheduled event is still an unverified IN-GAME event.
 */
export function applyTerrariumEcologyLightV03bEvent(state,e){
 if(!isValidTerrariumEcologyLightV03b(state)||
    state.revision>=10000000||!obj(e)||
    typeof e.channel!=='string')fail('invalid_v03b_event');
 let b=state.biota,fixtures=state.fixtures,species=state.speciesByZone,
     receipts=state.receipts;
 if(e.channel==='fixture'){
  if(e.type==='upsert'){
   if(!keys(e,['channel','type','fixture']))fail('invalid_fixture_event');
   const target=normFixture(e.fixture);
   if(target.zoneIndex>=b.zones.length)fail('invalid_fixture_zone');
   fixtures=fixtures.filter(x=>x.id!==target.id).concat([target]);
  }else if(e.type==='remove'){
   if(!keys(e,['channel','type','id'])||!uid(e.id)||
      !fixtures.some(x=>x.id===e.id))fail('invalid_fixture_removal');
   fixtures=fixtures.filter(x=>x.id!==e.id);
  }else fail('unknown_fixture_event');
  if(!validFixtures(fixtures,b.zones.length))fail('too_many_or_bad_fixtures');
  b=alignLight(b,fixtures,b.minute,state.transmissionByZone);
 }else if(e.channel==='plant_species'){
  if(!keys(e,['channel','zoneId','speciesId'])||
     typeof e.zoneId!=='string')fail('invalid_plant_species_event');
  const idx=b.zones.findIndex(x=>x.id===e.zoneId);
  if(idx<0||e.speciesId!==null&&!byId.has(e.speciesId))
    fail('unknown_plant_species');
  if(e.speciesId!==null&&
     byId.get(e.speciesId).plantKind!==b.zones[idx].plant.kind)
    fail('species_morphotype_mismatch');
  species=species.slice();species[idx]=e.speciesId;
 }else if(e.channel==='organic'){
  if(!keys(e,['channel','type','eventId','minute','zoneId',
              'amountUnits','source'])||
      e.type!=='litter_input'||e.minute!==state.minute||
      receipts.length>=128||
      receipts.some(x=>x.eventId===e.eventId))
    fail('invalid_or_duplicate_litter_provenance');
  const receipt={eventId:e.eventId,minute:e.minute,
    zoneId:e.zoneId,amountUnits:e.amountUnits,source:e.source,
    classification:'in_game_event_not_observation'};
  if(!validReceipt(receipt,b.zones.length))
    fail('invalid_litter_source');
  b=applyTerrariumBiotaV03Event(b,{channel:'biota',
    type:'leaf_litter',zoneId:e.zoneId,amountUnits:e.amountUnits});
  receipts=receipts.concat([receipt]);
 }else if(e.channel==='biota'){
  if(!keys(e,['channel','event'])||!obj(e.event)||
     e.event.channel!=='biota'||
     ['light','leaf_litter'].includes(e.event.type))
    fail('biota_event_bypasses_v03b_authority');
  b=applyTerrariumBiotaV03Event(b,e.event);
  if(e.event.type==='plant_patch'){
   const idx=b.zones.findIndex(x=>x.id===e.event.zoneId);
   if(idx>=0&&species[idx]!==null&&
      byId.get(species[idx]).plantKind!==b.zones[idx].plant.kind){
    species=species.slice();species[idx]=null;
   }
  }
 }else if(e.channel==='environment'){
  if(!keys(e,['channel','event'])||!obj(e.event)||
     e.event.channel!=='environment')
    fail('invalid_v03b_environment_event');
  b=applyTerrariumBiotaV03Event(b,e.event);
 }else fail('unknown_v03b_event_channel');
 const out=envelope(b,fixtures,species,receipts,state.revision+1,
   state.transmissionByZone);
 if(!isValidTerrariumEcologyLightV03b(out))fail('invalid_v03b_event_result');
 return out;
}
/**
 * V0.3c compatible, opt-in scene transmission projection.
 * This is a single-owner extension; V0.3b defaults to 1000 (unshaded).
 * Updates only the SAME canonical lightUnits authority, never soil water.
 */
export function setTerrariumEcologyLightTransmissionV03b(state,
  transmissionByZone){
 if(!isValidTerrariumEcologyLightV03b(state)||
    state.revision>=10000000||
    !validTransmission(transmissionByZone,state.biota.zones.length))
   fail('invalid_scene_light_transmission');
 const biota=alignLight(state.biota,state.fixtures,state.minute,
   transmissionByZone);
 const out=envelope(biota,state.fixtures,state.speciesByZone,
   state.receipts,state.revision+1,transmissionByZone);
 if(!isValidTerrariumEcologyLightV03b(out))
   fail('invalid_scene_light_result');
 return out;
}
export function inspectTerrariumEcologyLightV03b(state){
 if(!isValidTerrariumEcologyLightV03b(state))
  fail('invalid_v03b_snapshot');
 const base=inspectTerrariumBiotaV03(state.biota);
 const light=illumination(state.fixtures,state.minute,
    state.biota.zones.length,state.transmissionByZone);
 return freeze({
  version:TERRARIUM_ECOLOGY_LIGHT_V03B_VERSION,
  minute:state.minute,revision:state.revision,
  lightUnitsByZone:freeze(light),
  unshadedLightUnitsByZone:freeze(illumination(state.fixtures,
    state.minute,state.biota.zones.length,
    fullTransmission(state.biota.zones.length))),
  transmissionByZone:freeze([...state.transmissionByZone]),
  lamps:freeze(state.fixtures.map(x=>freeze({...x,
    on:inWindow(x,state.minute)}))),
  plants:freeze(state.speciesByZone.map(id=>
    id===null?null:byId.get(id))),
  biota:base,events:freeze(state.receipts.map(x=>freeze({
    ...x,source:freeze({...x.source})
  }))),
  lightStatus:'game_proxy_not_PPFD_or_DLI',
  speciesStatus:'taxonomic_reference_not_welfare_validated',
  observationStatus:'no_eyewitness_claims'
 });
}
export function buildTerrariumEcologyLightV03bActionSnapshot(state){
 if(!isValidTerrariumEcologyLightV03b(state))fail('invalid_v03b_actions');
 return buildTerrariumBiotaV03ActionSnapshot(state.biota);
}
