/**
 * Corn snake visual texture plan v0.4 — pure, deterministic data.
 * A visual ART prototype, not measured scale arrangement, morph genetics,
 * real animal coloration, collision or biomechanical simulation.
 * The renderer can bake these speckles into a cached sprite/texture later.
 */
import {makeCornSnakePattern} from './corn-snake-motion.mjs';

export const CORN_VISUAL_VERSION=1;
const MORPHS=Object.freeze(['normal','amelanistic','anerythristic','motley','stripe']);
const BODY_WIDTH_KEYS=Object.freeze([
  [0,0.70],[0.09,0.85],[0.26,1],[0.55,0.98],
  [0.73,0.84],[0.87,0.62],[0.96,0.25],[1,0.025]
]);

export function getCornSnakeHalfWidth(s,maxWidth=17){
  if(!Number.isFinite(s)||s<0||s>1||!Number.isFinite(maxWidth)||maxWidth<=0)
    throw new RangeError('invalid_body_width');
  for(let i=1;i<BODY_WIDTH_KEYS.length;i++){
    const [stop,w]=BODY_WIDTH_KEYS[i], [prev,prevW]=BODY_WIDTH_KEYS[i-1];
    if(s<=stop){
      const k=(s-prev)/(stop-prev);
      return maxWidth*(prevW+(w-prevW)*k);
    }
  }
  return maxWidth*BODY_WIDTH_KEYS.at(-1)[1];
}

/**
 * Create stable animal-local visual features, not live particles.
 * s = position head-to-tail along body, radial = signed side offset.
 */
export function makeCornSnakeVisualTemplate({seed=1049,morphId='normal',fleckCount=180}={}){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||
     !MORPHS.includes(morphId)||!Number.isInteger(fleckCount)||fleckCount<0||fleckCount>500)
    return {ok:false,error:'invalid_visual_options'};
  const base=makeCornSnakePattern(seed,35);
  if(!base.ok)return base;
  let state=(seed^0x9e3779b9)>>>0;
  const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  const flecks=Array.from({length:fleckCount},(_,i)=>({
    s:0.02+random()*0.93,
    radial:(random()*2-1)*0.78,
    size:0.8+random()*1.5,
    shade:i%4
  }));
  return {ok:true,visual:{
    schemaVersion:CORN_VISUAL_VERSION,
    seed,morphId,
    marks:base.marks,
    flecks
  }};
}
