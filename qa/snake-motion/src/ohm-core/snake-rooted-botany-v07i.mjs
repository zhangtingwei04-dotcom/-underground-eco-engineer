/**
 * Project OHM SNAKE / ECO V0.7I — rooted, read-only botanical silhouettes.
 *
 * Generic, non-species-specific fern pinnate fronds (stipe / rachis /
 * paired pinnae) and visually distinct moss cushion/carpet silhouettes.
 * References: University of Auckland "The fern frond"; Missouri Dept of
 * Conservation "Mosses". Botanical STRUCTURE reference only, not species
 * identification, measured plant individuals, growth, or welfare evidence.
 *
 * Input MUST be V0.7H's V0.3d/V0.3q source-backed patch descriptors;
 * this module cannot create a plant for an unplanted zone. Every visible
 * plant is attached to its original projected soil anchor. No animation,
 * clock, random re-rolls, cloud writes, terrain reshaping, snake or physics.
 */
export const SNAKE_ROOTED_BOTANY_VERSION='0.7I';
const F=Object.freeze;
const good=n=>typeof n==='number'&&Number.isFinite(n);
const bad=key=>{throw new RangeError(key)};
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const quant=x=>Math.round(x*1000)/1000;
const pt=(x,y)=>F({x:quant(x),y:quant(y)});
const poly=a=>F(a.map(p=>pt(p.x,p.y)));
const segment=(a,b)=>F({from:pt(a.x,a.y),to:pt(b.x,b.y)});
const validPatch=p=>p&&
 typeof p.id==='string'&&/^[a-z0-9_-]{1,90}$/i.test(p.id)&&
 ['fern','moss'].includes(p.plantKind)&&
 p.anchor&&good(p.anchor.x)&&good(p.anchor.y)&&
 good(p.world?.x)&&good(p.world?.y)&&
 good(p.coverScale)&&p.coverScale>0&&p.coverScale<=1&&
 good(p.size)&&p.size>0&&p.size<=120&&
 good(p.leafLeanDegrees)&&Math.abs(p.leafLeanDegrees)<=25&&
 good(p.silhouetteWidth)&&p.silhouetteWidth>=.7&&p.silhouetteWidth<=1.3&&
 good(p.tipLength)&&p.tipLength>=.7&&p.tipLength<=1.3&&
 Number.isInteger(p.variant)&&p.variant>=0&&p.variant<=15&&
 Number.isInteger(p.grain)&&p.grain>=0&&p.grain<=4&&
 Number.isInteger(p.tintStep)&&p.tintStep>=-2&&p.tintStep<=2;
function fern(p){
 const {x,y}=p.anchor;
 const scale=p.size/31; // readable fern fronds in a wide 1440px glass tank
 const width=p.silhouetteWidth;
 const lean=p.leafLeanDegrees*Math.PI/180;
 const root=pt(x,y);
 const collarWidth=clamp(3*scale,1.5,4.7);
 const soilBase=F({center:root,
  width:quant(15*scale),height:quant(3.2*scale),
  topY:quant(y-2.0*scale),
  status:'screen_art_collar_not_root_depth_or_plant_biomass'});
 const fronds=[];
 const count=4+(p.variant%3); // 4–6 fronds, all attached to source patch.
 for(let f=0;f<count;f++){
  const phase=f/(count-1);
  const fan=(phase-.5)*2;
  const height=(32+(p.variant+f*3)%10)*scale*p.tipLength*
   (1-.20*Math.abs(fan));
  const horizontal=fan*height*.55*width+height*Math.sin(lean)*.40;
  const sway=height*(.055+(p.grain%3)*.009)*Math.sin(f*2.17+p.variant);
  // A continuous stipe/rachis centreline. Pinnae start above the stipe.
  const center=u=>pt(
   x+horizontal*u*u+sway*u*(1-u),
   y-height*u
  );
  const stipe=F([center(0),center(.12),center(.26)]);
  const rachis=F(Array.from({length:10},(_,i)=>
   center(.26+i/9*.74)));
  const pinnae=[];
  const pairs=6+(p.variant+f)%2;
  for(let i=0;i<pairs;i++){
   // Preserve an actual bare lower stipe, then taper towards frond apex.
   const u=.32+i/(pairs-1)*.61;
   const centerPoint=center(u);
   const previous=center(clamp(u-.03,0,1));
   const next=center(clamp(u+.03,0,1));
   const tangentX=next.x-previous.x,tangentY=next.y-previous.y;
   const length=Math.hypot(tangentX,tangentY);
   if(length<1e-8)bad('degenerate_fern_rachis');
   const nx=-tangentY/length,ny=tangentX/length;
   const tapered=Math.pow(Math.sin(Math.PI*(i+.55)/(pairs+.35)),.80);
   const leafLen=(9.1+f%2*1.3)*scale*tapered*width;
   const rise=(2.4+u*3.1)*scale;
   for(const side of [-1,1]){
    const offset=(i%2===0?-.6:.6)*scale;
    const base=pt(centerPoint.x+nx*side*.9*scale,
     centerPoint.y+ny*side*.9*scale+offset);
    const tip=pt(base.x+nx*side*leafLen+horizontal*.075,
     base.y+ny*side*leafLen-rise);
    const mid=pt((base.x+tip.x)/2,(base.y+tip.y)/2);
    const thickness=(1.85+((p.variant+i+f)%3)*.34)*scale*tapered;
    // Narrow, separated lanceolate pinnae rather than circular blobs.
    const blade=poly([
     base,
     pt(mid.x+tangentX/length*thickness,
       mid.y+tangentY/length*thickness),
     tip,
     pt(mid.x-tangentX/length*thickness,
       mid.y-tangentY/length*thickness)
    ]);
    pinnae.push(F({side,index:i,blade,base,tip,
     attachmentToRachis:segment(centerPoint,base)}));
   }
  }
  fronds.push(F({
   index:f,stipe,rachis,pinnae:F(pinnae),
   tip:center(1),root,
   silhouette:'pinnate_frond_with_separate_lanceolate_pinnae'
  }));
 }
 return F({
  type:'fern',root,soilBase,fronds:F(fronds),
  shoots:F([]),cushions:F([]),carpet:F([]),
  status:'pinnate_schematic_not_fern_species_identity_or_real_root'
 });
}
function moss(p){
 const {x,y}=p.anchor,scale=p.size/24; // low moss cushions and carpets
 const root=pt(x,y);
 const carpetStyle=p.variant%2===0;
 const count=carpetStyle?14:11;
 const shoots=[],cushions=[],carpet=[];
 for(let i=0;i<count;i++){
  const t=i/(count-1);
  const side=t*2-1;
  const centerX=x+side*15*scale*p.silhouetteWidth;
  const baseline=y-1.0*scale;
  const growth=(carpetStyle?7.0:11.8)*scale*
   (1-.47*Math.abs(side))*
   (.85+((p.variant+i*5)%7)*.04);
  const tip=pt(centerX+Math.sin((p.variant+i)*2)*2.4*scale,
   baseline-growth);
  const base=pt(centerX,baseline);
  const leaves=F([.34,.59,.83].map((u,j)=>{
   const cy=baseline-growth*u;
   const cx=base.x+(tip.x-base.x)*u;
   return F({
    left:segment(pt(cx,cy),
     pt(cx-(2.0+j*.15)*scale,cy-(1.4+j*.2)*scale)),
    right:segment(pt(cx,cy),
     pt(cx+(2.0+j*.15)*scale,cy-(1.4+j*.2)*scale))
   });
  }));
  shoots.push(F({root:base,tip,stem:segment(base,tip),leaves,
   status:'stylized_leafy_shoot_not_real_moss_species_or_sporophyte'}));
 }
 if(carpetStyle){
  carpet.push(poly([
   pt(x-18*scale,y),
   pt(x-15*scale,y-3.8*scale),
   pt(x-8*scale,y-5.8*scale),
   pt(x,y-4.8*scale),
   pt(x+11*scale,y-5.2*scale),
   pt(x+17*scale,y-3*scale),
   pt(x+18*scale,y),pt(x-18*scale,y)
  ]));
 }else{
  cushions.push(F({
   center:pt(x,y-4.0*scale),
   width:quant(17*scale),height:quant(9.5*scale),
   status:'cosmetic_cushion_not_measured_moss_volume'
  }));
 }
 return F({
  type:'moss',root,
  soilBase:F({center:root,width:quant(23*scale),
   height:quant(3*scale),topY:quant(y-1.5*scale),
   status:'moss_patch_soil_contact_art_not_real_rhizoid_model'}),
  fronds:F([]),shoots:F(shoots),
  cushions:F(cushions),carpet:F(carpet),
  visualGrowthHabit:carpetStyle?'carpet_proxy':'cushion_proxy',
  status:'generic_leafy_moss_shoots_not_species_identification'
 });
}
/** Read-only geometry built one time and drawn behind/in front of V0.7G rig. */
export function buildSnakeRootedBotanyV07i(ecology){
 if(!ecology||ecology.version!=='0.7H'||
   !Array.isArray(ecology.flora)||ecology.flora.length>100||
   !Array.isArray(ecology.zonePatches)||!Array.isArray(ecology.stones))
  bad('invalid_v07i_botany_authority');
 const allowed=new Map(ecology.zonePatches
  .filter(z=>z.present).map(z=>[z.id,z.kind]));
 const patches=ecology.flora.map(p=>{
  if(!validPatch(p)||allowed.get(p.zoneId)!==p.plantKind)
   bad('untrusted_planted_zone_or_patch');
  const shape=p.plantKind==='fern'?fern(p):moss(p);
  const keep=F({
   id:p.id,zoneId:p.zoneId,kind:p.plantKind,
   sourceAnchor:pt(p.anchor.x,p.anchor.y),
   // The first and last geometry vertices are measured in the SAME
   // V0.7G front glass projection, not a second visual coordinate system.
   ...shape,
   appearanceOnly:true
  });
  if(keep.root.x!==keep.sourceAnchor.x||
     keep.root.y!==keep.sourceAnchor.y)
   bad('plant_roots_not_attached_to_source_soil');
  return keep;
 });
 if(new Set(patches.map(p=>p.id)).size!==patches.length)
  bad('duplicate_visible_botany_patch');
 return F({
  version:SNAKE_ROOTED_BOTANY_VERSION,
  sceneId:ecology.sceneId,sceneRevision:ecology.sceneRevision,
  patches:F(patches),
  camera:ecology.camera,
  source:'V0.7H_planted_zone_patch_and_V0.3q_cosmetic_fingerprint',
  effectOnEcology:F([]),
  skinApplied:false,
  status:'source_rooted_art_geometry_no_actual_botanical_species_or_physics'
 });
}
