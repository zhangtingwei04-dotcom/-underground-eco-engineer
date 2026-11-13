/**
 * PRIVATE OHM V1.0G — refinement of Warmvein (provisional name):
 * irregular branch-backed dorsal patches, staggered scale microstructure,
 * separate ventral plates, softly blended head/neck and tail pigmentation.
 *
 * This ONLY creates fixed 128x64 RGBA UV color data. The source is the
 * eye-free V1.0D atlas. Eyes stay independent and OPEN. Neither source
 * V0.9T/U geometry nor collisions/growth/saves are imported or changed.
 */
import {createWarmveinNoPaintedEyesAtlasV10d}
 from './warmvein-eyes-v10d.mjs';

export const WARMVEIN_PIXEL_SKIN_V10G='1.0G';
const F=Object.freeze;
const W=128,H=64;
const between=(n,a,b)=>Math.min(b,Math.max(a,n));
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const ink=F({
 copper:rgb('#E6732F'),sun:rgb('#F5A247'),
 amber:rgb('#FFC365'),gold:rgb('#EBA94D'),
 warm:rgb('#CE6330'),brick:rgb('#AD452C'),
 mahogany:rgb('#652A24'),dark:rgb('#803125'),
 flank:rgb('#B34D2F'),cream:rgb('#F1D7AD'),
 ivory:rgb('#E7BE91'),ventralEdge:rgb('#BC8E6B'),
 lower:rgb('#926045'),scaleGlint:rgb('#F8BD68')
});
const blend=(a,b,w)=>a.map((v,i)=>
 Math.round(v*(1-between(w,0,1))+b[i]*between(w,0,1)));
const dist=(v,a)=>Math.abs(((v-a+1.5)%1)-.5);
const hash=(seed,x,y)=>{
 let n=(seed^Math.imul(x+11,0x9e3779b1)^
  Math.imul(y+31,0x85ebca77))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
};
const smooth=t=>{t=between(t,0,1);return t*t*(3-2*t)};
const px=(x,y)=>4*(y*W+x);
const rings=[19,33,48,64,80,96,111,123];
const patchField=(seed,x,v,i)=>{
 const n=hash(seed,i,3);
 const c=rings[i]+((n%7)-3)*.72;
 const rx=(3.4+(n%6)*.53)*(i===7?.64:1);
 const radial=dist(v,.25);
 const width=.125+((n>>>6)%9)*.007;
 const curve=(Math.sin(v*16+i*2.41+seed*.0007)*1.05+
  Math.cos(v*32+i*.49)*.38);
 const u=(x-c-curve)/rx;
 const w=(radial/width)*(1+.1*Math.sin(x*.21+i));
 // Radial lobes make shapes look like organic branch-saddles.
 return u*u+w*w;
};

/** New material candidate, never a replacement for V1.0B/C/D. */
export function createWarmveinPixelAtlasV10g({seed=18073}={}){
 const old=createWarmveinNoPaintedEyesAtlasV10d({seed});
 const pixels=old.rgba.slice();
 let modifiedPixelCount=0,scaleAccentCount=0,
  ventralPlateCount=0,dorsalPatchCount=0;
 for(let y=0;y<H-1;y++){
  const v=y/(H-1),back=dist(v,.25),belly=dist(v,.75);
  for(let x=0;x<W;x++){
   const at=px(x,y);
   const baseline=[pixels[at],pixels[at+1],pixels[at+2]];
   const h=hash(seed,x,y);
   const scaleY=Math.floor(y/3);
   const stagger=(scaleY%2)*1;
   const scaleX=Math.floor((x+stagger)/3);
   const micro=hash(seed,scaleX,scaleY);
   const scaleEdge=(x+stagger)%3===0;
   const scaleTip=(x+stagger)%3===1&&y%3===0;
   let color=baseline;
   if(x<10){
    // Discrete head shields; do not recreate painted-on black eyes.
    if(belly>.18&&h%23===0)
     color=blend(color,ink.sun,.22);
   } else {
    const bodyRatio=(x-10)/(W-10);
    if(belly<.145){
     // Broad, subtly segmented VENTRAL plates; no squared checkerboard.
     const plate=(x+Math.floor(Math.sin(v*17)*1.4))%6;
     const tone=belly<.085?ink.cream:ink.ivory;
     color=blend(tone,ink.ventralEdge,
      belly>.115?.30:plate===0?.17:.035);
     if(plate===0&&belly<.115){
      color=blend(color,ink.ventralEdge,.20);
      ventralPlateCount++;
     }
    } else {
     // The dorsal crown is warmly lit, lower flanks progressively muted.
     color=back<.15?ink.sun:
      back<.29?ink.copper:back<.40?ink.warm:ink.flank;
     if(back>.43)color=ink.brick;
     let patch=Infinity,patchIndex=-1;
     for(let i=0;i<rings.length;i++){
      const p=patchField(seed,x,v,i);
      if(p<patch){patch=p;patchIndex=i;}
     }
     if(patch<1&&back<.27&&h%17!==0){
      color=patch<.72?ink.mahogany:ink.dark;
      dorsalPatchCount++;
     }else if(patch>=.95&&patch<1.21&&back<.30&&
      hash(seed,Math.floor(x/2),patchIndex)%4!==0){
      color=ink.gold; // interrupted amber edging, not a full halo
     } else {
      const branching=Math.sin(x*.19+v*15+
       Math.sin(x*.067+seed*.0003)*2.0);
      if(Math.abs(branching)<.12&&back<.31&&h%5!==0)
       color=blend(color,ink.amber,.62);
      if(micro%13<3&&back<.38)color=blend(color,ink.brick,.22);
     }
     // Staggered tiny scale rims, dark on one rim and lightly reflected
     // at the opposite corner; never a busy continuous grid.
     if(scaleEdge&&micro%5!==0){
      color=blend(color,ink.mahogany,
       back<.34?.13:.09);
      scaleAccentCount++;
     }else if(scaleTip&&micro%3!==0){
      color=blend(color,ink.scaleGlint,.17);
      scaleAccentCount++;
     }
    }
    // Smooth the body pigment into the unchanged 8-ring source head.
    const neckBlend=smooth((x-10)/12);
    color=blend(baseline,color,neckBlend);
    // Small, denser tail flecks; no harsh terminal stripe.
    if(bodyRatio>.84){
     const fade=smooth((bodyRatio-.84)/.16);
     color=blend(color,ink.copper,.72*fade);
     if(bodyRatio>.91&&h%19===0&&belly>.18)
      color=blend(color,ink.brick,.25*(1-fade*.5));
    }
   }
   for(let k=0;k<3;k++)pixels[at+k]=color[k];
   pixels[at+3]=255;
   if(color.some((n,k)=>n!==baseline[k]))modifiedPixelCount++;
  }
 }
 // UV radial seam: row 0 and row 63 are identical for REPEAT sampling.
 for(let x=0;x<W;x++)
  for(let k=0;k<4;k++)
   pixels[px(x,H-1)+k]=pixels[px(x,0)+k];
 const frozen=F(pixels);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=W||y<0||y>=H)
   throw new RangeError('v10g_invalid_uv_pixel');
  return F(frozen.slice(px(x,y),px(x,y)+4));
 };
 const nearSeamRowEqual=Array.from({length:W},(_,x)=>
  sampleRGBA(x,0).every((n,k)=>n===frozen[px(x,H-1)+k]))
  .every(Boolean);
 return F({
  version:'1.0A',privateSkinRevision:'1.0G',
  kind:'private_warmvein_irregular_scales_depth_candidate',
  seed,width:W,height:H,pixels:W*H,channelCount:4,
  rgba:frozen,sampleRGBA,nearSeamRowEqual,
  filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  modifiedPixelCount,scaleAccentCount,
  ventralPlateCount,dorsalPatchCount,
  fromEyeFreeV10d:true,independentEyesPreserved:true,
  eyeBlinkEnabled:false,
  silhouetteAndRadiusNeverModified:true,
  physicalDorsalFrameVerifiedForAllTurns:false,
  sourceMotionAndColliderNeverModified:true,
  originalV10dUnmodified:true,prototypeSkinOnly:true,
  gameAssetInstalled:false,playerSaveModified:false
 });
}
