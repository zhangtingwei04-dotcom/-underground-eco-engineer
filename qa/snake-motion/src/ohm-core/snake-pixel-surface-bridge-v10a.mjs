/**
 * Project OHM neutral V1.0A PIXEL MATERIAL TECHNICAL TEST.
 *
 * Public repository: deliberately generic stripe/grid DIAGNOSTIC
 * pattern. No private fictional creature designs, proper names,
 * signature palette or visual-species art are present here.
 *
 * A CPU-side atlas and immutable render MATERIAL PLAN, NOT applied
 * to the user's Phaser game, not a raster/game-ready texture upload,
 * not real GPU draw calls or independently animated skin bones.
 *
 * The atlas is built ONCE per unique seed/configuration; the existing
 * V0.9U head and body mesh positions, indices, UVs, bone radii,
 * collision shell, and 24 source joints stay unchanged. UV anchored
 * textures therefore cannot scroll with world X/Y during movement.
 *
 * Seam policy: angular V wraps 0->1, and the first/last pixel rows
 * share identical colors. The current V0.9R closed nose tip uses
 * u=0, v=.5; pixel detailing of tip/scales remains a future issue.
 *
 * Do not confuse passing this material contract with visual approval,
 * a guaranteed biologically accurate scale pattern, or completed
 * pixel-art rasterization in a target game viewport.
 */
export const SNAKE_PIXEL_SURFACE_BRIDGE_V10A_VERSION='1.0A';
const F=Object.freeze;
const MODES=F(['transparent','flat_debug','pixel_debug']);
const isFinite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function error(reason,detail={}){
 return F({version:'1.0A',ok:false,reason,...detail,
  gameAssetInstalled:false,gameSaveModified:false,
  skeletonOrCollisionChanged:false});
}
function pixelHash(seed,u,v){
 let n=(seed>>>0)^Math.imul(u+1,2654435761)^
  Math.imul(v+13,2246822507);
 n^=n>>>16;n=Math.imul(n,2246822507);
 n^=n>>>13;n=Math.imul(n,3266489909);
 n^=n>>>16;
 return (n>>>0);
}
function hexToRGB(s){
 if(typeof s!=='string'||!/^#[0-9a-fA-F]{6}$/.test(s))
  throw new RangeError('invalid_neutral_qa_color');
 return F([1,3,5].map(i=>parseInt(s.slice(i,i+2),16)));
}
/**
 * Generic high-contrast non-proprietary stripe/grid atlas, whose
 * data is indexed by BODY-LOCAL U/V, not current x/y/z positions.
 *
 * width=128,height=64 are engineering choices; we have not tested
 * final device raster size or how pixel scale looks on screen.
 */
export function createSnakeNeutralPixelAtlasV10a({
 seed=1047,width=128,height=64,
 neutralPalette=F({
  base:'#71808b',stripe:'#b1b9c3',
  accent:'#45535f',belly:'#d7dde0'
 })
}={}){
 if(!Number.isInteger(seed)||seed<0||seed>4294967295||
  !Number.isInteger(width)||width<32||width>256||
  (width&(width-1))!==0||
  !Number.isInteger(height)||height<16||height>128||
  (height&(height-1))!==0||
  !neutralPalette||typeof neutralPalette!=='object')
  throw new RangeError('invalid_neutral_pixel_atlas_options');
 const p=Object.fromEntries(['base','stripe','accent','belly']
  .map(k=>[k,hexToRGB(neutralPalette[k])]));
 const rgba=[],token=[];
 for(let y=0;y<height;y++){
  // Force cyclic seam endpoints to agree. The interval inside the
  // texture is angularly periodic, so this doesn't wrap incorrectly
  // on a head that is aligned to the source's radial seam.
  const periodicY=y===height-1?0:y;
  for(let x=0;x<width;x++){
   const zone=(periodicY/(height-1));
   const stripe=(Math.floor(x/8)+Math.floor(periodicY/8))%4;
   const jitter=pixelHash(seed,Math.floor(x/4),
    Math.floor(periodicY/4))%11;
   const key=(zone>.42&&zone<.58)?'belly':
    (stripe===0?'stripe':(jitter===1?'accent':'base'));
   const rgb=p[key];
   rgba.push(rgb[0],rgb[1],rgb[2],255);
   token.push(key);
  }
 }
 const frozenRGB=F(rgba),frozenLabels=F(token);
 const getPixel=(x,y)=>{
  if(!Number.isInteger(x)||!Number.isInteger(y)||
   x<0||x>=width||y<0||y>=height)
   throw new RangeError('invalid_pixel_index');
  const i=4*(y*width+x);
  return F(frozenRGB.slice(i,i+4));
 };
 return F({version:'1.0A',
  kind:'neutral_public_checker_atlas',
  seed,width,height,
  rgba:frozenRGB,
  paletteTokens:frozenLabels,
  pixels:width*height,
  channelCount:4,
  filter:'NEAREST',
  mipmapping:'disabled_for_debug',
  wrapU:'CLAMP_TO_EDGE',wrapV:'REPEAT',
  pixelAnchoring:'mesh_uv_not_world_space',
  nearSeamRowEqual:Array.from({length:width},(_,x)=>
   frozenLabels[x]===frozenLabels[(height-1)*width+x])
   .every(Boolean),
  sampleRGBA:getPixel,
  speciesDesignPresent:false,
  productionTextureApproved:false,
  gameSaveModified:false});
}
function assertUV(mesh){
 if(mesh?.vertexCount!==1617||mesh.triangleCount!==3216||
  mesh.positions?.length!==mesh.vertexCount||
  mesh.uv?.length!==mesh.vertexCount||
  mesh.triangles?.length!==mesh.triangleCount*3||
  mesh.radialSegments!==16||
  mesh.neckSocketRingStartIndex!==128||
  mesh.headBodySeamSharedVertices!==true||
  mesh.noseVertexIndex!==mesh.vertexCount-1)
  return false;
 if(!mesh.uv.every(q=>q&&isFinite(q.u)&&isFinite(q.v)&&
  q.u>=0&&q.u<=1&&q.v>=0&&q.v<=1))
  return false;
 if(mesh.triangles.some(i=>!Number.isInteger(i)||
  i<0||i>=mesh.vertexCount))return false;
 for(let i=0;i<101;i++){
  const row=i*16;
  const u=mesh.uv[row].u;
  if(!mesh.uv.slice(row,row+16).every((q,j)=>
   Math.abs(q.u-u)<1e-9&&
   Math.abs(q.v-j/16)<1e-9))return false;
 }
 return mesh.uv[mesh.noseVertexIndex].u===0;
}
/** Material-only binding; source and mesh references are reused
 * unchanged. Transparent mode uses no texture; debug modes never
 * grant or revoke motion collision rights.
 */
export function bindSnakePixelSurfaceV10a({
 renderCandidate,atlas=null,mode='transparent'
}={}){
 if(!MODES.includes(mode)||
  renderCandidate?.version!=='0.9U'||
  renderCandidate.ok!==true||
  renderCandidate.headNeckSocketWelded!==true||
  !assertUV(renderCandidate.mesh))
  return error('unverified_or_incompatible_shared_mesh');
 if(mode==='pixel_debug'&&
  (atlas?.version!=='1.0A'||
   atlas.nearSeamRowEqual!==true||
   atlas.filter!=='NEAREST'||
   atlas.pixelAnchoring!=='mesh_uv_not_world_space'||
   atlas.rgba.length!==atlas.width*atlas.height*4))
  return error('invalid_or_unstable_pixel_atlas');
 const mesh=renderCandidate.mesh;
 const material=F({mode,
  texture:mode==='pixel_debug'?atlas:null,
  flatRGB:mode==='flat_debug'?F([155,166,174]):null,
  alpha:mode==='transparent'?.32:1,
  nearestPixelFiltering:mode==='pixel_debug',
  pixelUVsFromExistingMesh:true,
  textureChangesWithAnimationFrame:false,
  worldPositionNeverUsedAsUV:true,
  headNeckSocketShared:true,
  fragmentDisplayOnly:true
 });
 return F({version:'1.0A',ok:true,mode,
  material,mesh,
  positions:mesh.positions,uv:mesh.uv,triangles:mesh.triangles,
  collisionShell:renderCandidate.collisionShell,
  sourceBoneLengths:renderCandidate.currentSizedSourceLinkLengths,
  sourceLocalRadii:renderCandidate.currentSizedLocalRadii,
  skeletonPose:renderCandidate.sizedBodySource,
  meshIdentityPreserved:true,
  collisionIdentityPreserved:true,
  geometryModified:false,
  motionSourceAuthorizedHere:false,
  renderingWasNotActuallyExecuted:true,
  noSpeciesPatternsExposedInPublicQA:true,
  skinExperimentalOnly:mode==='pixel_debug',
  formalGameAssetInstalled:false,formalGameSaveModified:false});
}
/** Intra-actor temporal check for stable atlas/UV identity.
 * Compare the same source animal before and after an independently
 * authenticated V0.9T step; calling this alone does NOT authenticate
 * its locomotion — pass the step through V0.9U before using.
 */
export function inspectSnakePixelUVStabilityV10a({
 from,to
}={}){
 if(from?.version!=='1.0A'||to?.version!=='1.0A'||
  !from.ok||!to.ok||from.mode!==to.mode)
  return error('invalid_pixel_material_transition');
 const fa=from.material.texture,tb=to.material.texture;
 const atlasSame=fa===tb;
 const uvSame=from.uv.length===to.uv.length&&
  from.uv.every((q,i)=>q.u===to.uv[i].u&&
  q.v===to.uv[i].v);
 const geometryMoved=from.positions.some((v,i)=>{
  const p=to.positions[i];
  return Math.hypot(v.x-p.x,v.y-p.y,v.z-p.z)>1e-8;
 });
 const bonesSame=JSON.stringify(from.sourceBoneLengths)===
  JSON.stringify(to.sourceBoneLengths);
 const radiiSame=JSON.stringify(from.sourceLocalRadii)===
  JSON.stringify(to.sourceLocalRadii);
 const okay=uvSame&&atlasSame&&bonesSame&&radiiSame&&
  from.meshIdentityPreserved&&to.meshIdentityPreserved;
 return F({version:'1.0A',ok:okay,
  reason:okay?null:'atlas_or_body_profile_changed_during_motion',
  atlasReferenceIdentical:atlasSame,
  meshUVIdentical:uvSame,
  geometryReallyMoved:geometryMoved,
  boneLengthsFrozen: bonesSame,
  localRadiiFrozen:radiiSame,
  noWorldSpacePatternSwimming:uvSame&&atlasSame,
  noVisualDeviceFrameCertified:true,
  noPlayerGameMaterialActivated:true});
}
