/**
 * Project OHM ECO V0.3g — tiny original pixel-sprite silhouettes.
 *
 * VISUAL ONLY. Sprite pixels are derived from the verified, immutable V0.3e
 * render frame; V0.3d still owns every world position. A pixel symbol must
 * never imply a species sighting, growth event, terrarium care advice,
 * physical shadow or resource. Free of DOM/Canvas/Phaser/storage/network.
 *
 * The 7-15 cell templates are provisional original placeholder artwork,
 * NOT production-ready anatomical/species artwork.
 */
export const TERRARIUM_PIXEL_SPRITES_V03G_VERSION='0.3g';
const freeze=Object.freeze;
const fail=x=>{throw new RangeError(x)};
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const palettes=freeze({
 moss:freeze({g:'#557f4b',G:'#88ad69',H:'#b2cb82',d:'#38543f'}),
 fern:freeze({g:'#477550',G:'#7eb06a',H:'#bbd08c',s:'#917b58'}),
 rock:freeze({d:'#493f37',r:'#79654e',R:'#ad9272',h:'#dac09a'}),
 canopy:freeze({d:'#31523b',g:'#4e8151',G:'#89b26b',H:'#bed28a'}),
 screen:freeze({d:'#566a67',r:'#8ba8a0',h:'#c4d6c1'}),
 lamp:freeze({o:'#a4814e',g:'#efd08b',G:'#d6b871',H:'#fff0b1'})
});
const patterns=freeze({
 moss:freeze([
 '...g...g...','..gGg.gGg..','.gGGGgGGGg.','gGGHGGHGGGg',
 '.gGGGGGGGg.','..ggGGGgg..','...ddddd...'
 ]),
 fern:freeze([
 '.......G.......','......GHG......','....G..s..G....','...GHG.s.GHG...',
 '..G..G.s.G..G..','.GHG.G.s.G.GHG.',
 '.....G.s.G.....','...GHG.s.GHG...','......GsG......',
 '.......s.......','.......s.......'
 ]),
 rock:freeze([
 '...dddddd....','..drrrrRRdd..','.drrRRRhhRRd.','drrRRRhhRrrrd',
 'drrrRrrRRrrrd','ddRrrRrrRrrdd','..ddrrrrddd..'
 ]),
 canopy:freeze([
 '...gg...gg...','..gGGg.gGGg..','.gGGHGgGGHGg.',
 'gGGHGGGGHGGGg','gGGGGGGGGGGGg','.gGGGGGGGGGg.','..ggdGGGdgg..',
 '....ddddd....'
 ]),
 screen:freeze([
 'drdrdrdrdrd','r.d.r.d.r.d','drdrdrdrdrd','r.d.r.d.r.d',
 'drdrdrdrdrd','r.d.r.d.r.d','drdrdrdrdrd'
 ]),
 lamp:freeze([
 '....g....','g...g...g','.g.GHG.g.','..GHHHG..',
 'ggHHHHHgg','..GHHHG..','.g.GHG.g.','g...g...g','....g....'
 ])
});
function validateTemplates(){
 for(const [type,rows] of Object.entries(patterns)){
  const width=rows[0].length;
  if(!width||width>18||rows.length>18||rows.some(row=>row.length!==width))
   fail('sprite_template_shape_'+type);
  for(const row of rows){
   for(const ch of row)if(ch!=='.'&&!(ch in palettes[type]))
    fail('sprite_palette_'+type);
  }
 }
}
validateTemplates();
const center=poly=>{
 if(!Array.isArray(poly)||poly.length!==4||
    poly.some(p=>!object(p)||!finite(p.x)||!finite(p.y)))
  fail('invalid_sprite_quad');
 return freeze(poly.reduce((sum,p)=>({x:sum.x+p.x/4,y:sum.y+p.y/4}),
  {x:0,y:0}));
};
function tileSprite(kind,point,size,detail){
 if(!patterns[kind]||!finite(point.x)||!finite(point.y))
  fail('invalid_sprite_anchor');
 const rows=patterns[kind],w=rows[0].length,h=rows.length;
 const x0=Math.round(point.x-size*w/2),y0=Math.round(point.y-size*h/2);
 const output=[];
 for(let y=0;y<h;y++){
  for(let x=0;x<w;x++){
   const ch=rows[y][x];
   if(ch==='.')continue;
   // Decimate decorative cells only, without moving the sprite or
   // altering the underlying species and world geometry.
   if(detail==='low'&&((x+y)%4===0 ||
     ((ch==='H'||ch==='h')&&(x+y)%2===0)))continue;
   output.push(freeze({
    x:x0+x*size,y:y0+y*size,width:size,height:size,
    fill:palettes[kind][ch]
   }));
  }
 }
 return freeze(output);
}
/**
 * Body silhouettes follow the frame's zone, object and fixture geometry.
 * Zones with 0 plant cover never render living plants.
 */
export function buildTerrariumPixelSpritesV03g(frame,{
 detail='normal',tileSize=5
}={}){
 if(!object(frame)||frame.version!=='0.3e'||
    !Array.isArray(frame.zones)||!Array.isArray(frame.objects)||
    !Array.isArray(frame.mounts)||
    !['top','oblique'].includes(frame.camera?.view)||
    !['low','normal'].includes(detail)||
    !Number.isSafeInteger(tileSize)||tileSize<3||tileSize>9)
  fail('invalid_pixel_sprite_frame');
 const zones=frame.zones.map(z=>{
  if(typeof z.id!=='string'||!Number.isInteger(z.plantCoverUnits)||
     z.plantCoverUnits<0||z.plantCoverUnits>1000)
   fail('invalid_sprite_plant_zone');
  const kind=z.plantCoverUnits===0?null:
   z.plantKind==='fern'?'fern':z.plantKind==='moss'?'moss':null;
  const c=center(z.polygon);
  const anchor=freeze({x:c.x,y:c.y-15});
  const tiles=kind?tileSprite(kind,anchor,tileSize,detail):freeze([]);
  return freeze({id:z.id,kind,anchor,tiles});
 });
 const objects=frame.objects.map(o=>{
  if(typeof o.id!=='string')fail('invalid_sprite_object_id');
  const kind=o.kind==='rock_overhang'?'rock':
   o.kind==='canopy'?'canopy':o.kind==='screen'?'screen':null;
  if(!kind)fail('invalid_sprite_object_kind');
  const c=center(o.roof);
  // Smaller object symbols stay visually close to the actual roof quad.
  const size=Math.max(3,tileSize-1);
  return freeze({id:o.id,kind,anchor:c,
   tiles:tileSprite(kind,c,size,detail)});
 });
 const mounts=frame.mounts.map(m=>{
  if(typeof m.fixtureId!=='string'||!object(m.light)||
     !finite(m.light.x)||!finite(m.light.y))
   fail('invalid_sprite_mount');
  const anchor=freeze({x:m.light.x,y:m.light.y});
  return freeze({id:m.fixtureId,kind:'lamp',anchor,
   tiles:tileSprite('lamp',anchor,Math.max(3,tileSize-1),detail)});
 });
 return freeze({
  version:TERRARIUM_PIXEL_SPRITES_V03G_VERSION,detail,tileSize,
  zones:freeze(zones),objects:freeze(objects),mounts:freeze(mounts),
  artStatus:'provisional_original_pixel_silhouettes_not_anatomy_or_observation'
 });
}
