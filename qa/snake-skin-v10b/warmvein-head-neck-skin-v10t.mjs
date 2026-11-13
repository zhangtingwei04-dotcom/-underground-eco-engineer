/**
 * PRIVATE OHM V1.0T — actual source-pixel correction for the V1.0Q head.
 *
 * V1.0Q left a legacy vivid-orange nose/head at atlas x=0..19.
 * That disconnected the real 8 head rings from the dark bark body
 * at the shared x=20 neck socket. V1.0T changes only *atlas colors*
 * in a bounded x=0..55 head/neck window, not the 1617 mesh vertices,
 * source UVs, 24 joints, collision shell, eye anchors or save format.
 *
 * This is a material refinement candidate pending true source WebGL
 * screenshot/iPhone visual approval, not a fake head mesh or ring band.
 */
import {createWarmveinPixelAtlasV10q}
 from './warmvein-skin-v10q.mjs';

export const WARMVEIN_HEAD_NECK_SKIN_V10T='1.0T';
const F=Object.freeze;
const W=256,H=128;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((n,i)=>Math.round(n*(1-t)+b[i]*t));
const near=(v,c)=>Math.abs(((v-c+1.5)%1)-.5);
const bodyDark=rgb('#4E382F'),headCopper=rgb('#83533B'),
 forehead=rgb('#695043'),scaleLight=rgb('#96715A'),
 scaleShade=rgb('#342A28'),bellyPale=rgb('#EAD0AB'),
 bellyPlate=rgb('#DEC19B'),bellyRim=rgb('#A68063'),
 rootLight=rgb('#E9B25D'),rootCore=rgb('#C68A43');
function hash(seed,x,y){
 let h=(seed^Math.imul(x+17,0x9e3779b1)^
  Math.imul(y+31,0x85ebca77))>>>0;
 h=Math.imul(h^(h>>>16),0x7feb352d);
 h=Math.imul(h^(h>>>15),0x846ca68b);
 return (h^(h>>>16))>>>0;
}
function distanceToSegment(x,y,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay;
 const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
 return Math.hypot(x-ax-t*dx,y-ay-t*dy);
}
function headMaterial(seed,x,y){
 const v=y/(H-1),bellyDistance=near(v,.75),
  dorsalDistance=near(v,.25);
 const noise=hash(seed,Math.floor(x/3),Math.floor(y/4));
 if(bellyDistance<.165){
  const rim=smooth((bellyDistance-.10)/.065);
  let c=mix(bellyPale,bellyRim,.65*rim);
  if((x%10)===0&&bellyDistance<.1)
   c=mix(c,bellyPlate,.48);
  return c;
 }
 const flank=smooth((dorsalDistance-.13)/.3);
 const noseshade=1-smooth((x-3)/42);
 let c=mix(bodyDark,headCopper,.27+.22*noseshade+.14*flank);
 c=mix(c,forehead,.19*(1-flank));
 const row=Math.floor(y/3.8),shift=(row%2)*2.1,
  column=Math.floor((x+shift)/4.8);
 const s=hash(seed,column,row);
 const dx=((x+shift)/4.8)%1,dy=(y/3.8)%1;
 if(dy<.18&&s%7!==0)c=mix(c,scaleLight,.15+.05*(s%4));
 if(dx<.12)c=mix(c,scaleShade,.22);
 if(s%13===0)c=mix(c,headCopper,.12);
 if(x<=8)c=mix(c,headCopper,.11*(1-smooth((x-2)/8)));
 return c;
}
function rootForkWeight(x,y){
 if(x<12||x>46)return 0;
 const center=31+2.5*Math.sin((x-25)*.11);
 let d=distanceToSegment(x,y,13,center-1.2,31,31);
 d=Math.min(d,distanceToSegment(x,y,22,30.2,41,30.8));
 d=Math.min(d,distanceToSegment(x,y,24,31,39,18));
 d=Math.min(d,distanceToSegment(x,y,31,31,44,44));
 const noseFade=smooth((x-12)/12);
 const tailFade=1-.38*smooth((x-35)/12);
 return (1-smooth((d-.15)/1.3))*noseFade*tailFade;
}
export function createWarmveinPixelAtlasV10t({seed=18073}={}){
 const original=createWarmveinPixelAtlasV10q({seed});
 if(original.width!==W||original.height!==H||
  original.nearSeamRowEqual!==true)
  throw new RangeError('v10t_requires_original_v10q_atlas');
 const pixels=original.rgba.slice();
 const changed={head:0,neck:0,belly:0,root:0};
 for(let y=0;y<H-1;y++){
  const v=y/(H-1),ventral=near(v,.75)<.165;
  for(let x=0;x<=55;x++){
   const k=(y*W+x)*4,old=original.sampleRGBA(x,y).slice(0,3);
   // Blend out to the EXACT existing Q pixels by x=55.
   const strength=x<=37?1:1-smooth((x-37)/18);
   let next=mix(old,headMaterial(seed,x,y),strength);
   // Nonrepeating, UV-fixed extensions from the bark body onto the
   // dorsal snout. No high-contrast transverse masking collar.
   if(!ventral&&near(v,.25)<.38){
    const vein=rootForkWeight(x,y);
    if(vein>.05){
     const gold=mix(rootCore,rootLight,
      .48+.25*Math.sin(x*.28+seed*.001));
     next=mix(next,gold,vein*.72);
     changed.root++;
    }
   }
   if(next.some((z,i)=>z!==old[i])){
    changed[x<20?'head':'neck']++;
    if(ventral)changed.belly++;
   }
   for(let i=0;i<3;i++)pixels[k+i]=next[i];
   pixels[k+3]=255;
  }
 }
 // Exact wrap-row equality, including the modified cranial palette.
 for(let x=0;x<W;x++){
  const to=(127*W+x)*4,from=x*4;
  for(let k=0;k<4;k++)pixels[to+k]=pixels[from+k];
 }
 const data=F(pixels);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=W||y<0||y>=H)
   throw new RangeError('invalid_v10t_pixel');
  return F(data.slice(4*(y*W+x),4*(y*W+x)+4));
 };
 const seam=Array.from({length:W},(_,x)=>
  sampleRGBA(x,0).every((v,i)=>v===data[(127*W+x)*4+i]))
  .every(Boolean);
 return F({
  version:'1.0A',privateSkinRevision:'1.0T',
  kind:'v10q_continuous_dark_head_and_neck_root_vein_correction',
  seed,width:W,height:H,pixels:W*H,channelCount:4,
  rgba:data,sampleRGBA,nearSeamRowEqual:seam,
  filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  sourceReferenceRevision:'1.0Q',
  editedLongitudinalColumns:F({first:0,last:55}),
  headAreaPixelsChanged:changed.head,
  neckAreaPixelsChanged:changed.neck,
  ventralPixelsChanged:changed.belly,
  rootBranchPixelsTouched:changed.root,
  noPaintedEyeOrBlink:true,
  atlasNoNewTransverseNeckBand:true,
  originalUVAndIndexedMeshUnchanged:true,
  originalHeadAndCollisionUnchanged:true,
  playerSaveModified:false,gameAssetInstalled:false,
  visualWebGLAndIPhoneApproved:false
 });
}
