/**
 * PROJECT OHM — PUBLIC SYNTHETIC PATTERN BLUEPRINT v1
 *
 * A single snake has one immutable, serializable pattern identity.
 * Generate descriptors ONCE from a deterministic 32-bit seed; save the
 * descriptors as well as the seed and exact algorithm version. Never
 * reroll them on login, animation, growth, or skeleton resampling.
 *
 * This is neutral UV/data research only. NO real gene-expression model,
 * morph-accurate paint, pixel shader, snake skin, or game save I/O.
 * Genotypes, body geometry and appearance are deliberately separate.
 */
export const SNAKE_PATTERN_BLUEPRINT_VERSION=1;
export const SNAKE_PATTERN_GENERATOR='ohm-pattern-blueprint-1';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const allowedSpecies=F(['generic_snake','corn_snake','western_hognose']);
const allowedStyles=F(['neutral_saddles','neutral_blotches']);
const allowedPalettes=F(['neutral_amber','neutral_earth','neutral_gray']);
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&
 Object.keys(x).length===keys.length&&
 keys.every(k=>Object.prototype.hasOwnProperty.call(x,k));
function fail(reason){throw new RangeError('pattern_'+reason)}
function requireOne(value,allowed,reason){
 if(!allowed.includes(value))fail(reason);
 return value;
}
function uint32(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)
  fail('invalid_seed_u32');
 return seed>>>0;
}
function hash(str){
 let h=2166136261;
 for(let i=0;i<str.length;i++){
  h=Math.imul(h^str.charCodeAt(i),16777619)>>>0;
 }
 return h>>>0;
}
function hex(x){return (x>>>0).toString(16).padStart(8,'0')}
function rng(seed){
 let x=seed>>>0||0x6d2b79f5;
 return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;
  return (x>>>0)/4294967296;};
}
const q=n=>Math.round(n*1000000)/1000000;
const wrap=n=>{const v=q(((n%1)+1)%1);return v>=1?0:v;};
function payload({seed,speciesId,styleId,paletteId,markCount}){
 const selectedSeed=uint32(seed);
 const species=requireOne(speciesId,allowedSpecies,'unknown_species');
 const style=requireOne(styleId,allowedStyles,'unknown_style');
 const palette=requireOne(paletteId,allowedPalettes,'unknown_palette');
 if(!Number.isInteger(markCount)||markCount<8||markCount>40)
  fail('invalid_mark_count');
 const next=rng((selectedSeed^hash(species+'|'+style+'|'+palette))>>>0);
 const marks=[];
 for(let i=0;i<markCount;i++){
  const u=q(.1+(.8/markCount)*(i+.42+(next()-.5)*.22));
  const v=wrap(.92+next()*.16);
  const lengthU=q((.8/markCount)*(.50+.28*next()));
  const widthV=q(.10+.085*next());
  const asymmetry=q((next()-.5)*.2);
  const irregularity=q(.10+.38*next());
  marks.push(F({
   id:'mark_'+String(i+1).padStart(3,'0'),
   u,v,lengthU,widthV,asymmetry,irregularity,
   pigmentSlot:'mark'
  }));
 }
 return {
  version:SNAKE_PATTERN_BLUEPRINT_VERSION,
  generator:SNAKE_PATTERN_GENERATOR,
  patternId:'pattern-v1-'+hex(selectedSeed)+'-'+hex(hash(species+'|'+style+'|'+palette+'|'+markCount)),
  seed:selectedSeed,speciesId:species,styleId:style,paletteId:palette,
  markCount,
  surfaceConvention:'head-to-tail-u__dorsal-seam-v0__ventral-v0_5',
  marks:F(marks)
 };
}
function seal(p){
 const checksum=hex(hash(JSON.stringify(p)));
 return F({...p,integrityChecksum:checksum});
}
function assertBlueprint(b){
 const keys=['version','generator','patternId','seed','speciesId',
  'styleId','paletteId','markCount','surfaceConvention','marks','integrityChecksum'];
 if(!exact(b,keys)||b.version!==SNAKE_PATTERN_BLUEPRINT_VERSION||
  b.generator!==SNAKE_PATTERN_GENERATOR)
  fail('unsupported_blueprint_version_or_shape');
 if(typeof b.integrityChecksum!=='string'||
  !/^[0-9a-f]{8}$/.test(b.integrityChecksum))
  fail('invalid_checksum');
 const expected=seal(payload(b));
 if(JSON.stringify(expected)!==JSON.stringify(b))
  fail('blueprint_mismatch_or_modified_descriptors');
 return expected;
}
/** Arguments must be public neutral profile identifiers, never DNA claims. */
export function createSnakePatternBlueprintV1({
 seed,speciesId='generic_snake',
 styleId='neutral_saddles',paletteId='neutral_earth',
 markCount=16
}={}){
 return seal(payload({seed,speciesId,styleId,paletteId,markCount}));
}
/** On new load use saved descriptors, not fresh random generation. */
export function restoreSnakePatternBlueprintV1(serialized){
 if(typeof serialized!=='string'||serialized.length>24000||
  serialized.length<10)fail('invalid_serialized_size');
 let obj;
 try{obj=JSON.parse(serialized)}
 catch{fail('invalid_serialized_json')}
 return assertBlueprint(obj);
}
/** Caller must persist this record atomically with the animal save. */
export function serializeSnakePatternBlueprintV1(blueprint){
 const b=assertBlueprint(blueprint);
 return JSON.stringify(b);
}
/**
 * A pure UV-to-ring anchor adapter, NOT pixel skin or body geometry.
 * UV coordinates remain identical across length growth and 13->24 bones.
 * Ring indices are transient and must NEVER be stored as pattern IDs.
 */
export function sampleSnakePatternSurfaceV1(blueprint,{
 bodyLength,ringCount,radialSegments
}={}){
 const b=assertBlueprint(blueprint);
 if(!finite(bodyLength)||bodyLength<=0||bodyLength>20||
  !Number.isInteger(ringCount)||ringCount<8||ringCount>1024||
  !Number.isInteger(radialSegments)||radialSegments<8||
  radialSegments>128)
  fail('invalid_surface_geometry');
 const anchors=b.marks.map(mark=>F({
  id:mark.id,u:mark.u,v:mark.v,
  lengthU:mark.lengthU,widthV:mark.widthV,
  ringIndex:Math.round(mark.u*(ringCount-1)),
  radialIndex:Math.round(mark.v*radialSegments)%radialSegments,
  bodyDistance:q(mark.u*bodyLength)
 }));
 return F({
  version:1,patternId:b.patternId,bodyLength,ringCount,
  radialSegments,anchors:F(anchors),uvIdentityPreserved:true,
  originalBonesChanged:false,skinApplied:false,
  growthMutation:false,geneticsSimulated:false
 });
}
/** Correct circular surface distance (seam v=0 == v=1). */
export function circularPatternSurfaceDistanceV1(a,b){
 if(!finite(a)||!finite(b)||a<0||a>1||b<0||b>1)
  fail('invalid_circumference_fraction');
 const delta=Math.abs(a-b);
 return Math.min(delta,1-delta);
}
