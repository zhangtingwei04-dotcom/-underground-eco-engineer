/**
 * PRIVATE PROJECT OHM V1.0Q — detailed full-body UV candidate based
 * on the latest player-approved 2-view snake reference, NOT on the
 * previously rejected blocky technical illustration.
 *
 * 256 x 128 RGBA; gold branching root veins, irregular dark bark
 * scale mosaic, copper head transition, pale segmented ventral scales.
 * This is a SOURCE MATERIAL candidate. Original V0.9T/U/R 24-joint
 * pose, collider, UV vertices, eyes, growth, saves and behavior do
 * not change. Still pending actual GPU/head-to-tail visual review.
 */
import {createWarmveinPixelAtlasV10p}
 from './warmvein-skin-v10p.mjs';

export const WARMVEIN_PIXEL_SKIN_V10Q='1.0Q';
export const WARMVEIN_V10Q_SIZE=Object.freeze({width:256,height:128});
const W=256,H=128,F=Object.freeze;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const smooth=t=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const blend=(a,b,t)=>a.map((v,k)=>Math.round(v*(1-clamp(t,0,1))+b[k]*clamp(t,0,1)));
const PAL=F({
 bark:rgb('#53372E'),barkShade:rgb('#3B2928'),
 barkLift:rgb('#6C4637'),copper:rgb('#AC663B'),
 scaleRim:rgb('#AD7954'),scaleShade:rgb('#422D2A'),
 rootCore:rgb('#F2B456'),rootFork:rgb('#E1A04B'),
 rootShadow:rgb('#95542F'),
 cream:rgb('#EBD5AF'),ivory:rgb('#F5E1BF'),
 bellyEdge:rgb('#C69D75'),bellyLine:rgb('#AA8667')
});
function hash(seed,x,y){
 let n=(seed^Math.imul(x+13,0x9e3779b1)^Math.imul(y+37,0x85ebca77))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
}
const wrapDist=(v,c)=>Math.abs(((v-c+1.5)%1)-.5);
const pix=(x,y)=>4*(y*W+x);
const line=(ax,ay,bx,by,width,kind='branch')=>F({ax,ay,bx,by,width,kind});
const closest=(x,y,l)=>{
 const ux=l.bx-l.ax,uy=l.by-l.ay;
 const t=clamp(((x-l.ax)*ux+(y-l.ay)*uy)/(ux*ux+uy*uy||1),0,1);
 const dx=x-(l.ax+t*ux),dy=y-(l.ay+t*uy);
 return Math.hypot(dx,dy);
};

/** Fixed graph in atlas-local coordinates: every branch is persistent
 * at a fixed UV, never animated or re-randomized per moving frame.
 */
function makeRootNetwork(seed){
 const segments=[];
 const nodes=[];
 for(let i=0;i<15;i++){
  const x=25+i*14.5+((hash(seed,i,99)%7)-3)*.55;
  const y=31+5.4*Math.sin(.63*i+seed*.00043)+
    2.3*Math.sin(1.7*i+.6);
  nodes.push({x,y});
 }
 for(let i=0;i<nodes.length-1;i++){
  const a=nodes[i],b=nodes[i+1];
  const midx=(a.x+b.x)/2,midy=(a.y+b.y)/2+
   (hash(seed,i,52)%9-4)*.34;
  segments.push(line(a.x,a.y,midx,midy,1.10,'spine'));
  segments.push(line(midx,midy,b.x,b.y,1.00,'spine'));
 }
 for(let i=0;i<nodes.length;i++){
  const a=nodes[i],h=hash(seed,i,17);
  const side=(h&1)?1:-1;
  const dx=9+(h>>>3)%11;
  const spread=11+(h>>>8)%14;
  const endpoint={x:clamp(a.x+dx,25,250),y:clamp(a.y+side*spread,7,54)};
  const bend={x:a.x+dx*.43,y:a.y+side*spread*.62};
  segments.push(line(a.x,a.y,bend.x,bend.y,.93,'branch'));
  segments.push(line(bend.x,bend.y,endpoint.x,endpoint.y,.75,'branch'));
  // A distinct secondary fork, less bright and slimmer.
  if(i%3!==1){
   const fx=bend.x+dx*.41,fy=bend.y-side*(5+(h>>>16)%7);
   segments.push(line(bend.x,bend.y,fx,fy,.55,'twig'));
  }
  // Interrupted transverse root veins connect into the opposite flank.
  if(i%2===0){
   const y=a.y-side*(8+(h>>>14)%12);
   segments.push(line(a.x-2,a.y,a.x+7,y,.62,'twig'));
  }
 }
 return F(segments);
}
export function createWarmveinPixelAtlasV10q({seed=18073}={}){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295)
  throw new RangeError('invalid_warmvein_v10q_seed');
 const previous=createWarmveinPixelAtlasV10p({seed});
 const rgba=new Array(W*H*4);
 const network=makeRootNetwork(seed);
 let goldRootPixels=0,branchForkPixels=0,scaleTexturePixels=0,
  creamBellyPixels=0,changedFromNearestV10p=0;
 for(let y=0;y<H-1;y++){
  const v=y/(H-1),dorsal=wrapDist(v,.25),
   ventral=wrapDist(v,.75);
  for(let x=0;x<W;x++){
   const i=pix(x,y),old=previous.sampleRGBA(Math.floor(x/2),Math.floor(y/2));
   let color=old.slice(0,3);
   if(x<20){
    // Keep the V1.0D-based nose/head eye-free: eye is a separate
    // geometric draw pass, not a painted black dot.
   } else if(ventral<.161){
    // Soft pale underside, broad shallow plate joints.
    const rim=smooth((ventral-.108)/.056);
    color=blend(PAL.ivory,PAL.bellyEdge,.64*rim);
    if(x%11===0&&ventral<.120){
     color=blend(color,PAL.bellyLine,.20);
    }
    if(ventral<.106)creamBellyPixels++;
   } else {
    const xfade=smooth((x-20)/30);
    const lower=smooth((dorsal-.17)/.33);
    color=blend(PAL.bark,PAL.copper,.37*lower);
    const patch=hash(seed,Math.floor(x/18),Math.floor(y/13));
    const noise=Math.sin(x*.043+Math.sin(y*.122)*.6)+
     .5*Math.sin(x*.115-y*.078+seed*.0007);
    color=blend(color,PAL.barkShade,
     clamp(.12+.19*noise+.09*(patch%5),.02,.55));
    color=blend(color,PAL.barkLift,
     .13*(1-lower));
    // Offset, nonuniform miniature dorsal scale rims. No checkerboard.
    const row=Math.floor(y/4.25),offset=(row%2)*2.55;
    const sx=Math.floor((x+offset)/5.5);
    const fractX=((x+offset)/5.5)%1;
    const fractY=(y/4.25)%1;
    const sh=hash(seed,sx,row),rimTop=fractY<.18,
     rimSide=fractX<.115;
    if(rimTop&&sh%9!==0){
     color=blend(color,PAL.scaleRim,.20+.09*(sh%4));
     scaleTexturePixels++;
    }else if(rimSide){
     color=blend(color,PAL.scaleShade,.25);
     scaleTexturePixels++;
    }
    if(sh%17===0)color=blend(color,PAL.copper,.10);
    // All root paths are anchored to the exact same body UV network.
    // Their dark halos and brighter cores occupy the dorsal/flank,
    // never the cream segmented belly.
    if(dorsal<.412){
     let minSpine=1e4,minBranch=1e4;
     for(const l of network){
      const dist=closest(x,y,l);
      const normalized=dist/l.width;
      if(l.kind==='spine')minSpine=Math.min(minSpine,normalized);
      else minBranch=Math.min(minBranch,normalized);
     }
     const near=Math.min(minSpine,minBranch);
     if(near<2.55){
      color=blend(color,PAL.rootShadow,
       .40*(1-smooth((near-.35)/2.2)));
     }
     if(minSpine<1||minBranch<1){
      const spine=minSpine<=minBranch;
      const flicker=hash(seed,Math.floor(x/3),Math.floor(y/3))%13;
      const shade=spine?PAL.rootCore:PAL.rootFork;
      color=blend(color,shade,
       (.78+.17*(1-Math.min(minSpine,minBranch)))*
       (flicker===0?.72:1));
      goldRootPixels++;
      if(!spine)branchForkPixels++;
     }
    }
    // No tail band or fat isolated rectangles; gold fades smoothly.
    if(x>229){
     const fade=smooth((x-229)/26);
     color=blend(color,PAL.bark,.28*fade);
    }
    color=blend(old.slice(0,3),color,xfade);
   }
   rgba[i]=color[0];rgba[i+1]=color[1];rgba[i+2]=color[2];rgba[i+3]=255;
   if(color.some((q,k)=>q!==old[k]))changedFromNearestV10p++;
  }
 }
 for(let x=0;x<W;x++){
  const src=pix(x,0),dst=pix(x,H-1);
  for(let k=0;k<4;k++)rgba[dst+k]=rgba[src+k];
 }
 const pixels=F(rgba);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=W||y<0||y>=H)
   throw new RangeError('invalid_warmvein_v10q_pixel');
  return F(pixels.slice(pix(x,y),pix(x,y)+4));
 };
 const nearSeamRowEqual=Array.from({length:W},(_,x)=>
  sampleRGBA(x,0).every((v,i)=>v===pixels[pix(x,H-1)+i]))
  .every(Boolean);
 return F({
  version:'1.0A',privateSkinRevision:'1.0Q',
  kind:'private_warmvein_fine_bark_gold_root_veins_candidate',
  seed,width:W,height:H,pixels:W*H,channelCount:4,
  rgba:pixels,sampleRGBA,nearSeamRowEqual,
  filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  goldRootPixels,branchForkPixels,scaleTexturePixels,
  creamBellyPixels,changedFromNearestV10p,
  rootSegments:network.length,sourceReferenceRevision:'1.0P',
  originalUVMeshAndColliderUnmodified:true,
  independentStaticEyes:true,eyeBlinkEnabled:false,
  noActualLightEmission:true,
  newSpeciesMovementAdded:false,
  noDirectBackwardCornSnakeGameplay:true,
  gameAssetInstalled:false,playerSaveModified:false,
  fullBodyGPUAndPhoneAppearanceCertified:false,
  naturalCoilingCertified:false
 });
}
