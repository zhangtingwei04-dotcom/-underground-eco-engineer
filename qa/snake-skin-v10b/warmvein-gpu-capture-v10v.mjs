/**
 * PRIVATE OHM V1.0V — inspect AUTHENTIC WebGL2 framebuffer bytes.
 *
 * The caller uses gl.readPixels on the displayed, source-backed
 * V0.9T/U frame. This utility does NOT synthesize visual results,
 * manipulate the snake mesh, install textures or touch gameplay saves.
 *
 * WebGL readPixels is bottom-up; matching rows are compared on the
 * same row, so no flipping is needed for the symmetric Q/T diagnostics.
 */
export const WARMVEIN_GPU_CAPTURE_V10V='1.0V';
const F=Object.freeze;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));

export function inspectWarmveinGPUCaptureV10v({
 rgba,width,height,split=false,qtCompare=false,alphaThreshold=30
}={}){
 if(!(rgba instanceof Uint8Array)||
  !Number.isInteger(width)||width<64||
  !Number.isInteger(height)||height<64||
  rgba.length!==width*height*4||
  !Number.isFinite(alphaThreshold)||
  alphaThreshold<1||alphaThreshold>254||
  typeof split!=='boolean'||typeof qtCompare!=='boolean'||
  (qtCompare&&!split))
  throw new RangeError('v10v_requires_real_rgba_framebuffer');
 const leftW=Math.floor(width/2),rightW=width-leftW;
 let total=0,left=0,right=0,paired=0,
  deltaCount=0,maxDelta=0,alphaMismatch=0;
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++){
  const off=y*width*4;
  for(let x=0;x<width;x++){
   const a=rgba[off+x*4+3];
   if(a<alphaThreshold)continue;
   total++;
   if(x<leftW)left++;else right++;
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);
   minY=Math.min(minY,y);maxY=Math.max(maxY,y);
  }
 }
 if(qtCompare){
  // Both viewports must share the same pixel-space geometry. For odd
  // widths compare the overlapping horizontal span only.
  for(let y=0;y<height;y++){
   const off=y*width*4;
   for(let x=0;x<Math.min(leftW,rightW);x++){
    const a=off+x*4,b=off+(leftW+x)*4;
    const la=rgba[a+3]>=alphaThreshold,ra=rgba[b+3]>=alphaThreshold;
    if(la!==ra){alphaMismatch++;continue;}
    if(!la)continue;
    paired++;
    const diff=Math.max(
     Math.abs(rgba[a]-rgba[b]),
     Math.abs(rgba[a+1]-rgba[b+1]),
     Math.abs(rgba[a+2]-rgba[b+2]));
    maxDelta=Math.max(maxDelta,diff);
    if(diff>12)deltaCount++;
   }
  }
 }
 const nonblank=total>=64;
 const bothPopulated=!split||(left>=32&&right>=32);
 // Q/T material differences should show up in actual colored
 // pixels; never 'approve' a blank or identical pair of images.
 const contrastProven=!qtCompare||deltaCount>0;
 const success=nonblank&&bothPopulated&&contrastProven;
 const reason=!nonblank?'empty_or_nearly_empty_gpu_frame':
  !bothPopulated?'one_panel_missing_gpu_snake':
  !contrastProven?'qt_material_difference_not_visible':'ok';
 return F({
  version:WARMVEIN_GPU_CAPTURE_V10V,
  ok:success,reason,width,height,split,qtCompare,
  visiblePixels:total,leftVisiblePixels:left,rightVisiblePixels:right,
  pairedOpaquePixels:paired,pixelsWithQTColorDifference:deltaCount,
  maximumQTChannelDifference:maxDelta,
  pairedAlphaMismatchPixels:alphaMismatch,
  capturedContentBounds:total?F({minX,maxX,minY,maxY}):null,
  sourceFramebufferBytesInspected:true,
  gpuRenderingActuallyOccurred:nonblank,
  qaAcceptanceNotCertified:true,
  gameSaveWritten:false,sourceMeshMutated:false
 });
}
