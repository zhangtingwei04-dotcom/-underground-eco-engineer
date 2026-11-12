/** PROJECT OHM V0.8A: one-pass, render-only ghost body/neck/head
 * overlay. No source bone, physical mesh, skin or game save changes. */
export const SNAKE_OPACITY_UNION_VERSION='0.8A';
const freeze=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function asPositiveLoop(pts,kind){
 if(!Array.isArray(pts)||pts.length<3||pts.length>5000||
  !pts.every(p=>p&&finite(p.x)&&finite(p.y)&&
   Math.abs(p.x)<10000&&Math.abs(p.y)<10000))
  throw new RangeError('v08a_invalid_'+kind+'_projection');
 let area=0;
 for(let i=0;i<pts.length;i++){
  const a=pts[i],b=pts[(i+1)%pts.length];
  area+=a.x*b.y-a.y*b.x;
 }
 if(!finite(area)||Math.abs(area)<1e-6)
  throw new RangeError('v08a_degenerate_'+kind+'_projection');
 const ordered=area<0?[...pts].reverse():[...pts];
 return freeze({kind,positiveWinding:true,
  points:freeze(ordered.map(p=>freeze({x:p.x,y:p.y})))});
}
export function buildSnakeOpacityUnionV08a({
 slender,headProjection,bodyJoinRingIndex,clearance
}={}){
 if(slender?.version!=='0.7Y'||slender.ok!==true||
  slender.sameVerticesRenderedAndSampled!==true||
  slender.sourceBonesModified!==false||
  slender.sourceHeadModified!==false||
  slender.originalHeadColliderStillAuthoritative!==true||
  slender.skinApplied!==false||slender.certifiedForGameplay!==false||
  clearance?.version!=='0.7Z'||clearance.ok!==true||
  clearance.qualityAccepted!==true||
  clearance.sourceJointCount!==slender.sourceJointCount||
  clearance.sourceBonesChanged!==false||
  clearance.bodyMeshChanged!==false||
  clearance.headChanged!==false||
  clearance.skinApplied!==false||
  clearance.collisionCertifiedForPlayers!==false||
  !Number.isInteger(bodyJoinRingIndex)||
  bodyJoinRingIndex<1||bodyJoinRingIndex>8)
  throw new RangeError('v08a_incompatible_source');
 const body=slender.bodyProjection;
 if(!Array.isArray(body?.outerA)||!Array.isArray(body?.outerB)||
  body.outerA.length!==body.outerB.length||
  body.outerA.length!==slender.bodyWorldRings?.length||
  bodyJoinRingIndex>=body.outerA.length-2)
  throw new RangeError('v08a_incompatible_projection');
 const b=asPositiveLoop([
  ...body.outerA.slice(bodyJoinRingIndex),
  ...body.outerB.slice(bodyJoinRingIndex).reverse()
 ],'body');
 const c=asPositiveLoop(slender.collarProjection?.outline,'collar');
 const h=asPositiveLoop(headProjection?.outline,'head');
 // With the SAME positive winding, a single nonzero Canvas fill
 // paints each pixel at most one translucent fill layer.
 return freeze({version:SNAKE_OPACITY_UNION_VERSION,ok:true,
  paths:freeze([b,c,h]),fillRule:'nonzero',translucentFillPasses:1,
  frontGlassOverlapCandidates:clearance.projectionOnlyPairs?.length??0,
  usesExistingV07yProjection:true,
  originalHeadColliderStillAuthoritative:true,
  sourceBonesChanged:false,bodyMeshChanged:false,headChanged:false,
  depthSorted3D:false,skinApplied:false,
  collisionCertifiedForPlayers:false,affectsSave:false,
  affectsEcology:false});
}
