/**
 * PRIVATE OHM V1.0P — accepted exterior concept -> head-to-tail UV
 * CANDIDATE: bark-brown body, broken amber/gold branching root-veins,
 * light ventral plates, softly copper head, restrained tapering tail.
 *
 * This is artwork encoded in the EXISTING 128x64 body UV protocol.
 * No source skeleton, collision radius, physical coiling, eye sprite,
 * world-space projection, save state or creature behavior is modified.
 *
 * This does NOT certify image fidelity, dorsal UV alignment, 3D shader
 * output or iPhone visual appearance: those require actual device QA.
 */
import {createWarmveinPixelAtlasV10g}
 from './warmvein-skin-v10g.mjs';

export const WARMVEIN_PIXEL_SKIN_V10P='1.0P';
const F=Object.freeze;
const W=128,H=64;
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const C=F({
 bark:rgb('#623A30'),cocoa:rgb('#764638'),
 mid:rgb('#8D563C'),side:rgb('#9F6847'),
 clay:rgb('#AE6739'),amber:rgb('#DEA04E'),
 gold:rgb('#F3BD69'),rootShade:rgb('#B87642'),
 dark:rgb('#4D302D'),belly:rgb('#EBD3AC'),
 bellyEdge:rgb('#C69E79'),bellyDark:rgb('#AB8666')
});
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const mix=(a,b,w)=>a.map((x,i)=>
 Math.round(x*(1-clamp(w,0,1))+b[i]*clamp(w,0,1)));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const wrapDist=(v,c)=>Math.abs(((v-c+1.5)%1)-.5);
const hash=(seed,x,y)=>{
 let n=(seed^Math.imul(x+11,0x9e3779b1)^
  Math.imul(y+31,0x85ebca77))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
};
const spine=(x,seed)=>.247+
  .024*Math.sin(x*.064+seed*.00031)+
  .012*Math.sin(x*.191+1.8);
const pixel=(x,y)=>4*(y*W+x);

function rootVeinAt(seed,x,v){
 if(x<18||x>123)return F({gold:false,shade:false});
 let distance=10;
 const center=spine(x,seed);
 const gap=(Math.floor(x/19)+hash(seed,Math.floor(x/9),1)%5)%6===0;
 if(!gap)distance=Math.min(distance,Math.abs(v-center));
 // Non-periodic bifurcations with diagonal, branching second tips.
 for(let i=0;i<9;i++){
  const local=hash(seed,i,6);
  const start=20+i*11+((local%7)-3);
  const length=9+((local>>>4)%7);
  const t=(x-start)/length;
  if(t<0||t>1)continue;
  const split=i%2===0?-1:1;
  const anchor=spine(start,seed);
  const target=anchor+split*(.010+.137*t)+
   .010*Math.sin(Math.PI*t*(1.1+(i%3)*.35));
  distance=Math.min(distance,Math.abs(v-target));
  if(i%3===0&&t>.38){
   const second=anchor-split*(.018+.089*(t-.38)/.62);
   distance=Math.min(distance,Math.abs(v-second));
  }
 }
 return F({gold:distance<.010,shade:distance<.024});
}

/** Same atlas API as V1.0G; render geometry comes from original V0.9U. */
export function createWarmveinPixelAtlasV10p({seed=18073}={}){
 const old=createWarmveinPixelAtlasV10g({seed});
 const rgba=old.rgba.slice();
 let rootVeinPixels=0,subtleScalePixels=0,
  ventralPixels=0,changedPixelCount=0;
 for(let y=0;y<H-1;y++){
  const v=y/(H-1),dorsal=wrapDist(v,.25),
   ventral=wrapDist(v,.75);
  for(let x=0;x<W;x++){
   if(x<10)continue; // original copper head shields; NO painted eyes
   const index=pixel(x,y);
   const base=rgba.slice(index,index+3);
   const h=hash(seed,x,y);
   let color=C.bark;
   if(ventral<.159){
    const stripe=(x+Math.round(Math.sin(v*13)))%7===0;
    color=ventral<.108?C.belly:C.bellyEdge;
    if(stripe&&ventral<.112)
     color=mix(color,C.bellyDark,.23);
    ventralPixels++;
   }else{
    const fade=clamp((dorsal-.06)/.48,0,1);
    color=mix(C.cocoa,C.side,fade*.78);
    if(dorsal<.18)color=mix(color,C.bark,.45);
    if(dorsal>.29)color=mix(color,C.clay,.16);
    // Scales are deliberately understated: texture must read at
    // actual iPhone game scale, not as a noisy constant pixel grid.
    const shift=(Math.floor(y/3)%2);
    if((x+shift)%3===0&&h%5===0){
     color=mix(color,C.dark,.20);subtleScalePixels++;
    }else if(y%3===0&&h%7===0){
     color=mix(color,C.amber,.14);subtleScalePixels++;
    }
    // Gold branching vein lines live in dorsal and lateral color,
    // never over the cream belly. No repeating real corn-snake saddles.
    const r=rootVeinAt(seed,x,v);
    if(dorsal<.405&&r.shade){
     color=mix(color,C.rootShade,.60);
    }
    if(dorsal<.405&&r.gold){
     color= ((x+h)%13===0)?C.amber:C.gold;
     rootVeinPixels++;
    }
    if(dorsal>.40&&h%19===0)color=mix(color,C.dark,.20);
   }
   // Keep head-to-body color connection gradual, preserve the eye-free
   // anterior texture; taper the bright vein pigment along the tail.
   const neckWeight=smooth((x-10)/16);
   color=mix(base,color,neckWeight);
   if(x>115&&ventral>=.159)
    color=mix(color,C.bark,.50*smooth((x-115)/12));
   for(let k=0;k<3;k++)rgba[index+k]=color[k];
   rgba[index+3]=255;
   if(color.some((n,k)=>n!==base[k]))changedPixelCount++;
  }
 }
 // Dorsoventral radial UV wraps: row 63 repeats row 0 exactly.
 for(let x=0;x<W;x++)
  for(let k=0;k<4;k++)
   rgba[pixel(x,H-1)+k]=rgba[pixel(x,0)+k];
 const frozen=F(rgba);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
     x<0||x>=W||y<0||y>=H)
   throw new RangeError('v10p_invalid_uv_pixel');
  return F(frozen.slice(pixel(x,y),pixel(x,y)+4));
 };
 const nearSeamRowEqual=Array.from({length:W},(_,x)=>
  sampleRGBA(x,0).every((n,k)=>n===frozen[pixel(x,H-1)+k]))
  .every(Boolean);
 return F({
  version:'1.0A',privateSkinRevision:'1.0P',
  kind:'private_warmvein_approved_exterior_root_veins_candidate',
  seed,width:W,height:H,pixels:W*H,channelCount:4,
  rgba:frozen,sampleRGBA,nearSeamRowEqual,
  filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  rootVeinPixels,subtleScalePixels,ventralPixels,
  changedPixelCount,createdFromV10g:true,
  separateEyeRigRequired:true,eyeBlinkEnabled:false,
  originalMeshAndColliderUnmodified:true,
  gameAssetInstalled:false,playerSaveModified:false,
  imageFidelityAndDeviceRenderingCertified:false,
  naturalCoilingCertified:false
 });
}
