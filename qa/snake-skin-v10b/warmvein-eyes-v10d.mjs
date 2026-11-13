/**
 * PRIVATE Project OHM V1.0D — independent (render-only) fictional eyes.
 *
 * Real snakes have fixed transparent spectacles and cannot blink. This
 * blink is an explicitly fictional warmvein species design experiment.
 * The parent V0.9T/U 24-joint source and the existing 1,617-vertex
 * welded head/body collision mesh are NEVER modified by this module.
 */
import {createWarmveinPixelAtlasV10c}
 from './warmvein-skin-v10c.mjs';
import {WARMVEIN_V10B_PALETTE}
 from './warmvein-skin-v10b.mjs';

export const WARMVEIN_INDEPENDENT_EYES_V10D='1.0D';
const F=Object.freeze;
const isFiniteNumber=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const pixel=(w,x,y)=>(y*w+x)*4;
const parseRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));

/** Only remove formerly PAINTED black eye marks.
 * Existing V1.0B/C files remain intact, viewable as legacy references.
 * New eye geometry & blink are built separately from this UV material.
 */
export function createWarmveinNoPaintedEyesAtlasV10d({seed=18073}={}){
 const old=createWarmveinPixelAtlasV10c({seed});
 const rgba=old.rgba.slice();
 const black=parseRGB(WARMVEIN_V10B_PALETTE.eye);
 const shine=parseRGB(WARMVEIN_V10B_PALETTE.eyeGlint);
 const headBase=parseRGB(WARMVEIN_V10B_PALETTE.flame);
 let cleanedPixelCount=0;
 for(let y=0;y<old.height;y++)for(let x=0;x<11;x++){
  const i=pixel(old.width,x,y);
  const colored=[rgba[i],rgba[i+1],rgba[i+2]];
  const painted=[black,shine].some(c=>c.every((v,k)=>v===colored[k]));
  if(!painted)continue;
  for(let k=0;k<3;k++)rgba[i+k]=headBase[k];
  cleanedPixelCount++;
 }
 // Preserve V0.9R angular wrapping, incl. any changed first row.
 for(let x=0;x<old.width;x++){
  const from=pixel(old.width,x,0);
  const to=pixel(old.width,x,old.height-1);
  for(let k=0;k<4;k++)rgba[to+k]=rgba[from+k];
 }
 const stable=F(rgba);
 const sampleRGBA=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
     x<0||x>=old.width||y<0||y>=old.height)
    throw new RangeError('v10d_bad_pixel_coordinates');
  return F(stable.slice(pixel(old.width,x,y),
   pixel(old.width,x,y)+4));
 };
 const nearSeamRowEqual=Array.from({length:old.width},(_,x)=>
  sampleRGBA(x,0).every((n,k)=>
   n===stable[pixel(old.width,x,old.height-1)+k])).every(Boolean);
 if(!nearSeamRowEqual||cleanedPixelCount===0)
  throw new Error('v10d_original_eye_paint_removal_failed');
 return F({
  version:'1.0A',privateSkinRevision:'1.0D',
  kind:'private_warmvein_eye_free_uv_skin',
  seed,width:old.width,height:old.height,
  rgba:stable,pixels:old.pixels,channelCount:4,
  filter:'NEAREST',wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  mipmapping:'disabled_for_debug',
  pixelAnchoring:'mesh_uv_not_world_space',
  nearSeamRowEqual,sampleRGBA,cleanedPixelCount,
  detachedEyes:true,originalV10cUnmodified:true,
  anatomicalSnakeBlinkClaim:false,fictionalEyeLids:true,
  physicalDorsalFrameVerifiedForAllTurns:false,
  prototypeSkinOnly:true,gameAssetInstalled:false,
  sourceMotionAndColliderNeverModified:true,
  playerSaveModified:false
 });
}

/** Locate BOTH eyes on real welded HEAD rings (not on world XY or a
 * pasted 2D face sprite). Head rings 0..7 precede the shared socket.
 * Ring 4, angular indices 2 & 6, are above the lateral cheeks and
 * follow the original V0.9R head surface through every true step.
 */
export function deriveWarmveinEyeAnchorsV10d(mesh){
 if(mesh?.vertexCount!==1617||mesh?.triangleCount!==3216||
    mesh?.headExtraRingCount!==8||
    mesh?.neckSocketRingStartIndex!==128||
    mesh?.radialSegments!==16||
    mesh?.positions?.length!==1617||
    mesh?.headBodySeamSharedVertices!==true)
  throw new RangeError('v10d_needs_original_welded_v09r_mesh');
 const ring=4,radial=mesh.radialSegments,origin=ring*radial;
 const center={x:0,y:0,z:0};
 for(let j=0;j<radial;j++){
  const p=mesh.positions[origin+j];
  if(![p?.x,p?.y,p?.z].every(isFiniteNumber))
   throw new RangeError('v10d_invalid_head_surface_vertex');
  center.x+=p.x/radial;
  center.y+=p.y/radial;
  center.z+=p.z/radial;
 }
 const anchors=[2,6].map((j,i)=>{
  const index=origin+j,p=mesh.positions[index];
  const difference={
   x:p.x-center.x,y:p.y-center.y,z:p.z-center.z
  };
  const radius=Math.hypot(difference.x,difference.y,difference.z);
  if(!isFiniteNumber(radius)||radius<.0001)
   throw new RangeError('v10d_degenerate_eye_head_radius');
  // Tiny renderer-only surface offset avoids the iris clipping into skin.
  const outward=radius*.06;
  return F({
   side:i===0?'left':'right',
   sourceHeadRing:4,surfaceVertexIndex:index,
   position:F({
    x:p.x+difference.x/radius*outward,
    y:p.y+difference.y/radius*outward,
    z:p.z+difference.z/radius*outward
   }),
   projectedEyeRadiusWorld:radius*.22,
   attachment:'V0.9R_original_8_ring_head',
   rendererOnly:true,collisionMeshModified:false
  });
 });
 return F({
  version:'1.0D',anchors:F(anchors),
  originalMeshVertexCount:mesh.vertexCount,
  originalMeshTriangleCount:mesh.triangleCount,
  originalSourceReferencesUnchanged:true,
  eyeWorldCoordinatesFromRealMovingHead:true,
  geometryForCollisionsAdded:0,gameSaveModified:false
 });
}

/** Deterministic fictional blink for a per-individual seed.
 * No re-randomization, no wall-clock change to growth, no setInterval.
 * The caller can animate this eye-only visual while the snake rests.
 */
export function sampleWarmveinBlinkV10d({
 elapsedSeconds=0,seed=18073,
 auto=true,manualStartSeconds=null
}={}){
 if(!isFiniteNumber(elapsedSeconds)||elapsedSeconds<0||
   !Number.isSafeInteger(seed)||seed<0||seed>2147483647||
   typeof auto!=='boolean'||
   !(manualStartSeconds===null||
    (isFiniteNumber(manualStartSeconds)&&manualStartSeconds>=0)))
  throw new RangeError('v10d_invalid_blink_parameters');
 const period=5.4+(seed%13)*.16;
 const offset=1.8+(seed%7)*.2;
 const position=elapsedSeconds%period;
 const autoPhase=auto?position-offset:-1;
 const manualPhase=manualStartSeconds===null?-1:
   elapsedSeconds-manualStartSeconds;
 const phase=manualPhase>=0&&manualPhase<=.32?
  manualPhase:(autoPhase>=0&&autoPhase<=.32?autoPhase:-1);
 let openness=1;
 if(phase>=0&&phase<.12)openness=1-phase/.12;
 else if(phase>=.12&&phase<.18)openness=0;
 else if(phase>=.18&&phase<.32)
  openness=clamp((phase-.18)/.14,0,1);
 return F({
  version:'1.0D',
  openness:clamp(openness,0,1),
  blinking:phase>=0,
  lidPhase:phase,auto,
  periodSeconds:period,
  repeatedPatternDeterministic:true,
  fictionalBehavior:true,
  originalSkeletonMotionUntouched:true,
  energyOrGrowthChanged:false,gameSaveModified:false
 });
}
