/**
 * Ohm Core — Corn snake research profile (data-first prototype).
 * No Phaser or platform APIs; no invented genetic inheritance.
 */
export const CORN_SNAKE_SPECIES_ID='pantherophis-guttatus';
export const CORN_SNAKE_MORPH_REFERENCES=Object.freeze([
  Object.freeze({id:'normal',kind:'reference',pattern:'blotches'}),
  Object.freeze({id:'amelanistic',kind:'reference',pattern:'blotches'}),
  Object.freeze({id:'anerythristic',kind:'reference',pattern:'blotches'}),
  Object.freeze({id:'motley',kind:'reference',pattern:'modified-blotches'}),
  Object.freeze({id:'stripe',kind:'reference',pattern:'longitudinal-stripes'})
]);
const IDS=new Set(CORN_SNAKE_MORPH_REFERENCES.map(x=>x.id));
const SAFE_ID=/^[a-z][a-z0-9_-]{0,63}$/;
export function createCornSnakeAppearance({individualId='corn-snake-demo',morphId='normal',patternSeed=1}={}){
  if(typeof individualId!=='string'||!SAFE_ID.test(individualId))return {ok:false,error:'invalid_individual_id'};
  if(!IDS.has(morphId))return {ok:false,error:'unsupported_reference_morph'};
  if(!Number.isSafeInteger(patternSeed)||patternSeed<0||patternSeed>4294967295)
    return {ok:false,error:'invalid_pattern_seed'};
  return {ok:true,appearance:{schemaVersion:1,speciesId:CORN_SNAKE_SPECIES_ID,individualId,
    referenceMorphId:morphId,patternSeed,genotype:null,geneticsVerified:false}};
}
export function validateCornSnakeAppearance(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return {ok:false,error:'invalid_appearance'};
  const check=createCornSnakeAppearance({individualId:value.individualId,morphId:value.referenceMorphId,patternSeed:value.patternSeed});
  if(!check.ok)return check;
  if(value.schemaVersion!==1||value.speciesId!==CORN_SNAKE_SPECIES_ID||
     value.geneticsVerified!==false||value.genotype!==null)return {ok:false,error:'unsupported_appearance_schema'};
  return {ok:true};
}
