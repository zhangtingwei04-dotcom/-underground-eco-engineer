/**
 * Project Ohm ECO V0.3f: deterministic pixel-style render decals and
 * touch-target arbitration for the V0.3e scene projection.
 *
 * Cosmetic only: it MUST NOT create ecological events, photosynthesis,
 * animal behaviour, plant measurements or its own world positions.
 * The same V0.3d/V0.3e immutable snapshot drives art and selection.
 */
import {
 hitTestTerrariumRenderV03e
} from './terrarium-scene-render-projection-v03e.mjs';

export const TERRARIUM_PIXEL_VISUAL_V03F_VERSION='0.3f';
const F=Object.freeze;
const err=m=>{throw new RangeError(m)};
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const record=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const validPoint=p=>record(p)&&finite(p.x)&&finite(p.y);
const snap=(x,size)=>Math.round(x/size)*size;
const idHash=(s)=>{
 let h=2166136261;
 for(let i=0;i<s.length;i++){
  h=Math.imul(h^s.charCodeAt(i),16777619);
 }
 return h>>>0;
};
const random=(seed,index)=>{
 let v=(seed+Math.imul(index+1,2654435761))>>>0;
 v=Math.imul(v^(v>>>16),2246822519)>>>0;
 v=Math.imul(v^(v>>>13),3266489917)>>>0;
 return ((v^(v>>>16))>>>0)/4294967296;
};
const interp=(q,u,v)=>({
 x:(1-u)*(1-v)*q[0].x+u*(1-v)*q[1].x+
    u*v*q[2].x+(1-u)*v*q[3].x,
 y:(1-u)*(1-v)*q[0].y+u*(1-v)*q[1].y+
    u*v*q[2].y+(1-u)*v*q[3].y
});
const colors=F({
 rock:F(['#55473b','#806e56','#b0a07a','#e0cb95']),
 canopy:F(['#244b38','#477c51','#7eaa6b','#b5ce83']),
 screen:F(['#486963','#73918b','#a9c0b0']),
 moss:F(['#426e50','#6c9d65','#a0c685','#c9dda2']),
 fern:F(['#386a4d','#5a9565','#9dc586','#c7dba2']),
 gravel:F(['#536a61','#789288','#a2aa96']),
 shade:F(['#213b32','#304a38','#59704c']),
 light:F(['#a58a58','#c5ae70','#f0d998'])
});
const isFrame=f=>record(f)&&f.version==='0.3e'&&
 Array.isArray(f.zones)&&Array.isArray(f.objects)&&
 Array.isArray(f.mounts)&&record(f.camera)&&
 ['top','oblique'].includes(f.camera.view);
const tile=(p,size,fill,shape='square')=>F({
 x:snap(p.x,size),y:snap(p.y,size),
 width:size,height:size,fill,shape
});
const stable=(items)=>F(items.map(x=>F(x)));
function drawTexture(poly,n,seed,palette,size,kind){
 const out=[];
 for(let i=0;i<n;i++){
  const u=.12+random(seed,i*3)*.76;
  const v=.12+random(seed,i*3+1)*.76;
  const p=interp(poly,u,v);
  const shade=random(seed,i*3+2);
  const swatch=palette[Math.min(palette.length-1,
    Math.floor(shade*palette.length))];
  out.push(tile(p,size,swatch,kind));
 }
 return stable(out);
}
/**
 * Per-zone and per-object pixel-stamped art references. Geometry and
 * plant counts are authoritative read-only snapshots; random noise is seeded
 * by stable IDs and never stored back into ecological state.
 *
 * Returns small rectangle stamps to paint ON TOP of existing projected
 * land and object polygons; does not pretend to be sprites or real foliage.
 */
export function buildTerrariumPixelVisualV03f(frame,{
 pixelSize=6,detail='normal',palette='woodland'
}={}){
 if(!isFrame(frame)||!Number.isInteger(pixelSize)||
    pixelSize<3||pixelSize>16||
    !['low','normal'].includes(detail)||
    palette!=='woodland')err('invalid_pixel_visual');
 const scale=detail==='low'?.52:1;
 const zones=frame.zones.map(z=>{
  const cover=z.plantCoverUnits;
  if(!Number.isInteger(cover)||cover<0||cover>1000)
   err('invalid_pixel_plant_cover');
  const kind=z.plantKind==='fern'?'fern':
    z.plantKind==='moss'?'moss':'gravel';
  const count=kind==='gravel'?Math.round(5*scale):
    cover===0?0:Math.round((6+cover/50)*scale);
  const p=colors[kind];
  const stamps=drawTexture(z.polygon,count,
    idHash(z.id+':'+kind),p,pixelSize,'ground');
  return F({id:z.id,plantKind:z.plantKind,
    actualLightUnits:z.actualLightUnits,
    stamps});
 });
 const objects=frame.objects.map(o=>{
  const paletteName=o.kind==='rock_overhang'?'rock':
    o.kind==='canopy'?'canopy':'screen';
  const stamps=drawTexture(o.roof,Math.round(20*scale),
    idHash(o.id+':'+o.kind),colors[paletteName],
    pixelSize,'object');
  return F({id:o.id,kind:o.kind,stamps});
 });
 return F({version:TERRARIUM_PIXEL_VISUAL_V03F_VERSION,
  pixelSize,detail,palette,
  zones:F(zones),objects:F(objects),
  visualDisclaimer:'hand-authored_pixel_style_decals_not_measured_ecology'});
}
function polygonContains(p,poly){
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if(((a.y>p.y)!==(b.y>p.y))&&
    p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
 }
 return inside;
}
function center(poly){
 return poly.reduce((s,p)=>({
  x:s.x+p.x/poly.length,y:s.y+p.y/poly.length
 }),{x:0,y:0});
}
function dist(p,q){return Math.hypot(p.x-q.x,p.y-q.y)}
function candidate(type,id,priority,near=0){
 return F({type,id,priority,distance:near});
}
/**
 * Large finger target: 24 canvas units for a lamp, 22 for a small object
 * roof centre. Exact polygon hits still win over this assist.
 * Zones only appear if no object/light hits: no background stealing taps.
 */
export function listTerrariumTouchTargetsV03f(frame,{
 x,y,radius=24
}={}){
 if(!isFrame(frame)||!finite(x)||!finite(y)||
    !finite(radius)||radius<0||radius>80)
   err('invalid_touch_targets');
 const p={x,y},choices=[];
 const exact=hitTestTerrariumRenderV03e(frame,{x,y,hitRadius:0});
 for(const m of frame.mounts){
  const d=dist(p,m.light);
  if(d<=radius)
   choices.push(candidate('mount',m.fixtureId,d<=10?0:2,d));
 }
 for(const o of frame.objects){
  const roof=polygonContains(p,o.roof);
  const faces=o.faces.some(face=>polygonContains(p,face.polygon));
  const d=dist(p,center(o.roof));
  if(roof||faces||d<=Math.min(22,radius))
   choices.push(candidate('object',o.id,
     roof||faces?1:3,d));
 }
 if(exact&&exact.type!=='zone'&&
    !choices.some(c=>c.type===exact.type&&c.id===exact.id))
  choices.push(candidate(exact.type,exact.id,0,0));
 // The ordering remains stable even when multiple selectable objects
 // overlap and are moved or re-created in a different insertion order.
 choices.sort((a,b)=>a.priority-b.priority||
   a.distance-b.distance||
   (a.type+':'+a.id).localeCompare(b.type+':'+b.id));
 if(choices.length===0){
  const zone=hitTestTerrariumRenderV03e(frame,{x,y,hitRadius:0});
  if(zone&&zone.type==='zone')choices.push(
    candidate('zone',zone.id,4,0));
 }
 return stable(choices.map(({type,id})=>F({type,id})));
}
/** Repeated taps at the same location cycle through overlapping selections.
 * The UI owns recent taps only for interaction; no save schema changes.
 */
export function resolveTerrariumTouchSelectionV03f(frame,{
 x,y,selected=null,previousTap=null,cycleDistance=16,
 radius=24
}={}){
 if(!finite(cycleDistance)||cycleDistance<0||cycleDistance>50||
    (previousTap!==null&&!validPoint(previousTap))||
    (selected!==null&&(!record(selected)||
       !['object','mount','zone'].includes(selected.type)||
       typeof selected.id!=='string')))
  err('invalid_touch_selection');
 const options=listTerrariumTouchTargetsV03f(frame,{x,y,radius});
 if(!options.length)return F({selected:null,options,cycled:false});
 let index=0,cycled=false;
 const near=previousTap!==null&&
  dist(previousTap,{x,y})<=cycleDistance;
 if(near&&selected&&options.length>1){
  const match=options.findIndex(c=>c.type===selected.type&&
    c.id===selected.id);
  if(match>=0){index=(match+1)%options.length;cycled=true;}
 }
 return F({selected:options[index],options,cycled});
}
