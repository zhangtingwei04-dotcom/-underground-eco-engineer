/**
 * PRIVATE OHM V1.0C: second, non-destructive pixel-material candidate.
 * Repaints the V1.0B RGBA atlas in BODY UV SPACE only: no skeleton,
 * collision, growth, time, network or player-save writes.
 * This is an ART EXPERIMENT, not a certified anatomical or game skin.
 */
import {createWarmveinPixelAtlasV10b,
 WARMVEIN_V10B_PALETTE} from './warmvein-skin-v10b.mjs';

export const WARMVEIN_PIXEL_SKIN_V10C='1.0C';
const F=Object.freeze;
const W=128,H=64;
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const around=(v,a)=>Math.abs(((v-a+.5+1)%1)-.5);
const hash=(seed,x,y)=>{
 let n=(seed^Math.imul(x+97,0x9e3779b1)^Math.imul(y+31,0x85ebca77))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
};
const tones=Object.fromEntries(Object.entries(WARMVEIN_V10B_PALETTE)
 .map(([k,v])=>[k,rgb(v)]));
const branches=F([
 F({x:19,r:5.2,w:.16}),F({x:34,r:6.7,w:.19}),
 F({x:52,r:4.4,w:.15}),F({x:67,r:7.1,w:.20}),
 F({x:86,r:5.5,w:.17}),F({x:101,r:6.4,w:.19}),
 F({x:114,r:3.1,w:.14})
]);

export function createWarmveinPixelAtlasV10c({seed=18073}={}){
 // Reuse V1.0B's seed/dimension validation and head design.
 const source=createWarmveinPixelAtlasV10b({seed});
 const pixels=source.rgba.slice();
 const pixel=(x,y)=>4*(y*W+x);
 let modified=0;
 for(let y=0;y<H-1;y++){
  const v=y/(H-1),side=around(v,.25),belly=around(v,.75);
  for(let x=11;x<W;x++){
   // Keep the entire V1.0B belly and the original eyes/head unchanged.
   if(belly<.155)continue;
   const u=x/(W-1);
   const grain=hash(seed,Math.floor(x/3),Math.floor(y/3));
   const micro=hash(seed,x,y);
   let color=side<.20?tones.flame:tones.copper;
   if(side>.29)color=tones.brick;
   if(side>.38)color=tones.mahogany;
   let dark=false,edge=false;
   for(let i=0;i<branches.length;i++){
    const b=branches[i];
    const wiggle=1.9*Math.sin(y*.108+i*1.67+seed*.0013)+
     1.3*Math.sin(y*.24+i*.57);
    const center=b.x+wiggle;
    const radial=side/(b.w*(1+.13*Math.sin(x*.31+i)));
    const axial=(x-center)/(b.r*(1+.1*Math.sin(y*.14+i)));
    const field=axial*axial+radial*radial;
    if(field<1 && micro%19!==0){dark=true;break;}
    if(field>=1&&field<1.27&&i%2===0)edge=true;
   }
   if(dark)color=side<.1?tones.mahogany:tones.darkPatch;
   else if(edge)color=tones.amber;
   else if(grain%29===0 && side<.29)color=tones.beige;
   // Thin fractured root veins; never replace the pale belly.
   const vein=Math.sin(x*.137+Math.sin(x*.049+seed*.001)*2.3+
    (v-.25)*17.1);
   if(!dark&&side<.31&&Math.abs(vein)<.105&&micro%5!==0)
    color=tones.amber;
   if(dark&&micro%23===0)color=tones.flame;
   // Avoid a visual neck collar by blending the head/neck transition.
   if(x<16){
    const mix=(x-10)/6,old=pixel(x,y);
    color=color.map((c,k)=>Math.round(pixels[old+k]*(1-mix)+c*mix));
   }
   // Tail markings should recede, not remain large dark saddles.
   if(u>.88){
    const t=clamp((u-.88)/.12,0,1)*.92;
    color=color.map((c,k)=>Math.round(c*(1-t)+tones.copper[k]*t));
   }
   const at=pixel(x,y);
   if(color.some((c,k)=>c!==pixels[at+k]))modified++;
   pixels[at]=color[0];pixels[at+1]=color[1];
   pixels[at+2]=color[2];pixels[at+3]=255;
  }
 }
 // Exact cyclic seam: GPU's v=1 must match v=0 pixel-for-pixel.
 for(let x=0;x<W;x++){
  const src=pixel(x,0),dst=pixel(x,H-1);
  for(let k=0;k<4;k++)pixels[dst+k]=pixels[src+k];
 }
 const frozen=F(pixels);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=W||y<0||y>=H)
   throw new RangeError('v10c_invalid_pixel');
  return F(frozen.slice(pixel(x,y),pixel(x,y)+4));
 };
 const seam=Array.from({length:W},(_,x)=>
  sampleRGBA(x,0).every((v,k)=>v===pixels[pixel(x,H-1)+k]))
  .every(Boolean);
 return F({
  version:'1.0A',privateSkinRevision:'1.0C',
  kind:'private_original_warmvein_organic_branch_trial',
  width:W,height:H,seed,rgba:frozen,pixels:W*H,
  channelCount:4,filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',
  wrapV:'REPEAT',mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  nearSeamRowEqual:seam,sampleRGBA,modifiedPixelCount:modified,
  uniquePatternStablePerIndividual:true,
  approximateDorsalV:.25,approximateBellyV:.75,
  physicalDorsalFrameVerifiedForAllTurns:false,
  sourceMotionAndColliderNeverModified:true,
  speciesNameStillProvisional:true,prototypeSkinOnly:true,
  playerSaveModified:false,gameAssetInstalled:false
 });
}
