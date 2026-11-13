/**
 * PRIVATE Project OHM V1.0B / 暖脈枝蛇（暫名）
 * "Forest poses" concept-board-inspired pixel skin EXPERIMENT.
 * User explicitly approved the visual direction, NOT the final
 * pattern, species taxonomy, game-ready texture or final name.
 *
 * DOES NOT CHANGE V0.9T/U source mesh, motion, collision or save.
 * Produces an atlas conforming exactly to the public neutral
 * V1.0A pixel-material protocol, so the same 1617 mesh vertices
 * and 3216 triangles are used for clear and pixel display modes.
 *
 * UV: u nose→tail; v=.25 APPROX dorsal, v=.75 ventral on horizontal
 * spine (normal=cross(worldZ,tangent); binormal≈worldZ). Head first
 * 8 cross-section rings. Actual body roll remains under test.
 *
 * Transparent / flat_debug / pixel_debug is provided by the
 * V1.0A public neutral material bridge; THIS private module only
 * returns proprietary pixel pattern, not a new collider.
 */
export const WARMVEIN_PIXEL_SKIN_V10B='1.0B';
const F=Object.freeze;
const PALETTE=F({
 outline:'#49241D',
 mahogany:'#62271E',
 darkPatch:'#832F24',
 brick:'#B34428',
 copper:'#E6732F',
 flame:'#F89B39',
 amber:'#FFC365',
 softHighlight:'#FFE19A',
 beige:'#E7B98A',
 belly:'#F1D7AD',
 bellyShade:'#BC8E6B',
 eye:'#19100D',
 eyeGlint:'#FFF5D4'
});
export const WARMVEIN_V10B_PALETTE=PALETTE;
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const blend=(a,b,w)=>a.map((n,i)=>Math.round(n*(1-w)+b[i]*w));
const wrap=(n,m)=>(n%m+m)%m;
const dist=(a,b,m)=>Math.abs(wrap(a-b+m/2,m)-m/2);
const h32=(seed,x,y)=>{
 let n=seed>>>0;
 n=(n^Math.imul(x+13,0x9e3779b1) ^
   Math.imul(y+37,0x85ebca77))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);
 n=Math.imul(n^(n>>>15),0x846ca68b);
 return (n^(n>>>16))>>>0;
};
const invalid=(msg)=>{throw new RangeError(msg)};
export function createWarmveinPixelAtlasV10b({
 seed=18073,width=128,height=64
}={}){
 if(!Number.isSafeInteger(seed)||seed<0||seed>2147483647||
  width!==128||height!==64)
  invalid('private_skin_invalid_seed_or_dimensions');
 const col=Object.fromEntries(Object.entries(PALETTE)
  .map(([k,v])=>[k,rgb(v)]));
 const rgba=new Array(width*height*4);
 const patchRows=[],eyeRows=[];
 for(let y=0;y<height;y++){
  // Atlas wraps around the radial seam v=0/1, not the torso length.
  const py=y===height-1?0:y;
  const v=py/(height-1);
  const around=(v-.25+1)%1;
  // Anatomical belly is diametrically opposite the dorsal normal.
  const belly=dist(v,.75,1);
  for(let x=0;x<width;x++){
   const u=x/(width-1),idx=(y*width+x)*4;
   const keyX=Math.floor(x/3),keyY=Math.floor(py/3);
   const jitter=h32(seed,keyX,keyY);
   const body=u>=.074;
   let color=col.copper;
   if(!body){
    // Head top copper, warm cheeks, eye near both sides,
    // pale jaw. The V0.9R shared neck ring must not have a
    // sudden contrast across u≈.07.
    color=belly<.16?col.belly:col.flame;
    if(belly<.23&&belly>.145)color=col.beige;
    if(dist(v,.0,1)<.023&&u>.019&&u<.048 ||
       dist(v,.50,1)<.023&&u>.019&&u<.048){
      color=col.eye;
      if(x===4&&py===0)color=col.eyeGlint;
    }
    if(v>.12&&v<.43&&
       Math.sin(x*.83+seed*.01)>.80)color=col.amber;
   }else if(belly<.155){
    color=belly<.095?col.belly:
      (jitter%7<2?col.bellyShade:col.beige);
    // belly plate hint, softly segmented, no checkerboard
    if(Math.floor(x/5)%4===0 && belly>.085)
     color=col.bellyShade;
   }else{
    const side=dist(v,.25,1);
    const t=(x-9)/119;
    const rootVein=Math.sin(t*67+seed*.0019+
       (v-.25)*20+Math.sin(t*28)*.8);
    const d=dist(v,.25+.018*Math.sin(x*.19),1);
    const xPeriod=13+Math.floor((seed%11)/3);
    const center=(x%xPeriod)-xPeriod/2;
    const lobe=Math.abs(center+(Math.sin(x*.43+seed*.013)*2.5));
    const wide=5.2+2.0*Math.sin(x*.17+seed*.002);
    const darkInside=
      side<.20 && lobe<wide &&
      (jitter%10!==3||side<.09);
    const crack= (Math.abs(rootVein)<.15&&side<.32) ||
      (d<.045&&Math.sin(x*.12+seed*.004)>.52);
    if(darkInside) color=side<.105?col.mahogany:col.darkPatch;
    else if(crack) color=col.amber;
    else if(jitter%17<3) color=col.brick;
    else color=side<.19?col.flame:col.copper;
    if(side>.32)color=col.brick;
    if(side>.37)color=col.mahogany;
    if(side>.42)color=col.copper;
    // Real uneven root-branch-like warm copper separators
    // without exact periodic corn-snake saddle marks.
    if(darkInside&&Math.abs(rootVein)<.085&&side<.16)
      color=col.flame;
    // Tail pattern fades to smaller broken markings.
    if(u>.90){
      const fade=Math.min(1,(u-.90)/.10);
      color=blend(color,col.copper,fade*.78);
    }
   }
   // Slight coarse stepping intentionally keeps pixels visible.
   // All colors are opaque; original collision geometry untouched.
   rgba[idx]=color[0];rgba[idx+1]=color[1];
   rgba[idx+2]=color[2];rgba[idx+3]=255;
  }
 }
 const frozen=F(rgba);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=width||y<0||y>=height)
   invalid('pixel_outside_private_atlas');
  return F(frozen.slice((y*width+x)*4,(y*width+x)*4+4));
 };
 return F({
  version:'1.0A',privateSkinRevision:'1.0B',
  kind:'private_original_warmvein_trial',
  width,height,seed,rgba:frozen,
  pixels:width*height,channelCount:4,
  filter:'NEAREST',
  wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  nearSeamRowEqual:Array.from({length:width},(_,x)=>
   frozen.slice(x*4,x*4+4).every((v,k)=>
    v===frozen[(height-1)*width*4+x*4+k])).every(Boolean),
  sampleRGBA,
  uniquePatternStablePerIndividual:true,
  approximateDorsalV:.25,approximateBellyV:.75,
  physicalDorsalFrameVerifiedForAllTurns:false,
  prototypeSkinOnly:true,speciesNameStillProvisional:true,
  sourceMotionAndColliderNeverModified:true,
  playerSaveModified:false
 });
}