/**
 * PRIVATE OHM V1.0J — read-only geometrical comparison diagnostics.
 * Compare the preapproved V0.9U source with V1.0H's display-only
 * silhouette, ring by ring and across adjacent SOURCE-approved frames.
 * Does not grant motion, body-size, collision, or gameplay authority.
 */
export const WARMVEIN_BODY_CONTINUITY_V10J='1.0J';
const F=Object.freeze;
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mag=v=>Math.hypot(v.x,v.y,v.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const angle=(a,b)=>{
 const n=mag(a)*mag(b);
 return n<1e-12?null:Math.acos(clamp(dot(a,b)/n,-1,1))*180/Math.PI;
};
function ring(mesh,i){
 const first=i*16;
 const center={x:0,y:0,z:0};
 for(let j=0;j<16;j++){
  const p=mesh.positions[first+j];
  center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
 }
 return F({
  center,
  sideRadius:distance(mesh.positions[first],mesh.positions[first+8])*.5,
  verticalRadius:distance(mesh.positions[first+4],mesh.positions[first+12])*.5
 });
}
function shape(fit){
 if(fit?.version!=='1.0H'||fit.ok!==true||
  fit.originalSourceMesh?.vertexCount!==1617||
  fit.renderMesh?.vertexCount!==1617||
  fit.renderMesh?.triangleCount!==3216||
  fit.renderMesh.positions?.length!==1617||
  fit.originalSourceMesh.positions?.length!==1617||
  fit.originalSourceMesh.uv!==fit.renderMesh.uv||
  fit.originalSourceMesh.triangles!==fit.renderMesh.triangles||
  fit.originalSourceMesh.headBodySeamSharedVertices!==true||
  fit.originalCollisionShellUnchanged!==true||
  fit.originalV09tSkeletonUnchanged!==true)
  throw new RangeError('v10j_requires_genuine_v10h_source_mesh');
 const widths=[],centers=[];
 let greatestCentroidShift=0,highestVerticalRadiusChange=0;
 for(let i=0;i<101;i++){
  const source=ring(fit.originalSourceMesh,i);
  const display=ring(fit.renderMesh,i);
  if(![source.sideRadius,source.verticalRadius,display.sideRadius,
   display.verticalRadius].every(finite)||
   source.sideRadius<1e-5||display.sideRadius<1e-5)
   throw new RangeError('v10j_degenerate_ring');
  const ratio=display.sideRadius/source.sideRadius;
  widths.push(F({
   ring:i,ratio,sourceSide:source.sideRadius,
   shownSide:display.sideRadius,
   widthGapWorld:source.sideRadius-display.sideRadius
  }));
  centers.push(source.center);
  greatestCentroidShift=Math.max(greatestCentroidShift,
   distance(source.center,display.center));
  highestVerticalRadiusChange=Math.max(highestVerticalRadiusChange,
   Math.abs(display.verticalRadius-source.verticalRadius));
 }
 let maxCenterlineBend=0;
 for(let i=1;i<100;i++){
  const a=minus(centers[i],centers[i-1]);
  const b=minus(centers[i+1],centers[i]);
  const turn=angle(a,b);
  if(turn!==null)maxCenterlineBend=Math.max(maxCenterlineBend,turn);
 }
 return {widths,centers,greatestCentroidShift,
  highestVerticalRadiusChange,maxCenterlineBend};
}
/**
 * Both from and to must be V1.0H data derived from V0.9U source
 * candidates already separately approved by the upstream V0.9U checker.
 * No subjective "looks natural" certification is possible here.
 */
export function inspectWarmveinBodyContinuityV10j({
 fit,previousFit=null
}={}){
 const current=shape(fit),previous=previousFit===null?null:shape(previousFit);
 if(previousFit!==null&&previousFit.stageProgress!==fit.stageProgress)
  throw new RangeError('v10j_different_life_stages_cannot_temporally_compare');
 let maxRatioDrift=0,maxSourceWidthStep=0,maxShownWidthStep=0;
 let maxVisibleOffsetStep=0;
 if(previous){
  for(let i=0;i<101;i++){
   const now=current.widths[i],before=previous.widths[i];
   maxRatioDrift=Math.max(maxRatioDrift,Math.abs(now.ratio-before.ratio));
   maxSourceWidthStep=Math.max(maxSourceWidthStep,
    Math.abs(now.sourceSide-before.sourceSide));
   maxShownWidthStep=Math.max(maxShownWidthStep,
    Math.abs(now.shownSide-before.shownSide));
   maxVisibleOffsetStep=Math.max(maxVisibleOffsetStep,
    Math.abs(now.widthGapWorld-before.widthGapWorld));
  }
 }
 const maxJumpAcrossRings=Math.max(...current.widths.slice(1)
  .map((w,i)=>Math.abs(w.ratio-current.widths[i].ratio)));
 const minimumRatio=Math.min(...current.widths.map(w=>w.ratio));
 const maximumRatio=Math.max(...current.widths.map(w=>w.ratio));
 const centerStable=current.greatestCentroidShift<1e-8;
 const verticalStable=current.highestVerticalRadiusChange<1e-8;
 const relativeProfileStable=minimumRatio>=.8599&&maximumRatio<=1.0001&&
  maxJumpAcrossRings<.027&&maxRatioDrift<1e-7;
 const noTailOrSeamJump=Math.abs(
  current.widths[7].ratio-current.widths[8].ratio)<1e-8;
 const all=relativeProfileStable&&noTailOrSeamJump&&
  centerStable&&verticalStable;
 return F({
  version:'1.0J',ok:all,
  reason:all?null:'sudden_visual_radius_or_welded_seam_change',
  stageProgress:fit.stageProgress,
  sourceRingCount:101,sourceVertexCount:1617,
  minimumDisplayToSourceSideWidthRatio:minimumRatio,
  maximumDisplayToSourceSideWidthRatio:maximumRatio,
  headToNeckSideWidthRatios:F([current.widths[7].ratio,
   current.widths[8].ratio]),
  trunkMiddleSideWidthRatio:current.widths[48].ratio,
  tailTipRingSideWidthRatio:current.widths[100].ratio,
  maxAdjacentRingWidthRatioJump:maxJumpAcrossRings,
  maximumCurrentSourceCenterlineBendDegrees:current.maxCenterlineBend,
  maximumRenderCentroidShiftWorld:current.greatestCentroidShift,
  maximumVerticalRadiusChangeWorld:current.highestVerticalRadiusChange,
  maximumSourceSideWidthStepWorld:maxSourceWidthStep,
  maximumShownSideWidthStepWorld:maxShownWidthStep,
  maximumSideWidthDifferenceStepWorld:maxVisibleOffsetStep,
  maximumRatioDriftAcrossSourceFrames:maxRatioDrift,
  headNeckWeldSideWidthRatioStable:noTailOrSeamJump,
  originalSourceCollisionRadiusRetained:true,
  meshContactCollisionProved:false,
  coilingAndOcclusionCertified:false,
  renderQualityCertified:false,
  onlyPreviouslyVerifiedMotionShouldBePassed:true,
  gameSaveWritten:false,blinkEnabled:false
 });
}
