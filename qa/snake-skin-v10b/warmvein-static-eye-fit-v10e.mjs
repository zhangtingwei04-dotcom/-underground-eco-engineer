/**
 * PRIVATE OHM V1.0E - visual-only eye fitting on the EXISTING V0.9R/U head.
 * Eye shape follows the accepted warmvein concept: dark round glassy eye,
 * subtle amber rim and one tiny highlight. No blinks / eyelids.
 *
 * This module NEVER modifies or authorizes a movement, physical mesh,
 * life-stage growth, collision shell, creature stats or player save.
 */
import {deriveWarmveinEyeAnchorsV10d}
 from './warmvein-eyes-v10d.mjs';

export const WARMVEIN_STATIC_EYE_FIT_V10E='1.0E';
const F=Object.freeze;
const clamp=(x,low,high)=>Math.max(low,Math.min(high,x));
const valid=n=>typeof n==='number'&&Number.isFinite(n);
const EYE_SIZE_BY_STAGE=F([1.15,1.07,1,.94]);
const CAMERA_VERTICAL_MIX=.56;

/**
 * Derive two independent, fixed-OPEN eye sprites from actual head rings.
 * Their point size follows the actual local head radius and viewport;
 * only the eye-to-head ratio becomes subtly smaller in later stages.
 *
 * Camera (same as private WebGL QA): projectedScreen=(x,y+.56*z).
 * The dot score is a visual shadow heuristic, NOT true ray occlusion.
 * The existing GPU head depth test still handles fragment occlusion.
 */
export function fitWarmveinStaticEyesV10e({
 mesh,stageProgress,canvasWidth=1100,worldHalfWidth=1.5
}={}){
 if(!Number.isInteger(stageProgress)||stageProgress<0||
    stageProgress>3||!Number.isInteger(canvasWidth)||
    canvasWidth<320||canvasWidth>8192||
    !valid(worldHalfWidth)||worldHalfWidth<=0||
    worldHalfWidth>100)
  throw new RangeError('v10e_invalid_eye_viewport_or_stage');
 const linked=deriveWarmveinEyeAnchorsV10d(mesh);
 const ringStart=4*16,headCenter={x:0,y:0,z:0};
 for(let j=0;j<16;j++){
  const p=mesh.positions[ringStart+j];
  headCenter.x+=p.x/16;
  headCenter.y+=p.y/16;
  headCenter.z+=p.z/16;
 }
 const out=linked.anchors.map(anchor=>{
  const q=anchor.position;
  const offset={
   x:q.x-headCenter.x,y:q.y-headCenter.y,
   z:q.z-headCenter.z
  };
  const n=Math.hypot(offset.x,offset.y,offset.z);
  if(!valid(n)||n<.0001)
   throw new RangeError('v10e_invalid_eye_head_normal');
  const cameraFacing=(offset.z-CAMERA_VERTICAL_MIX*offset.y)/
   (n*Math.hypot(1,CAMERA_VERTICAL_MIX));
  const cameraShade=clamp(.74+.26*cameraFacing,.52,1);
  const rawSize=anchor.projectedEyeRadiusWorld*
   canvasWidth/worldHalfWidth*EYE_SIZE_BY_STAGE[stageProgress];
  return F({
   side:anchor.side,
   sourceHeadRing:anchor.sourceHeadRing,
   surfaceVertexIndex:anchor.surfaceVertexIndex,
   position:anchor.position,
   pointSizePx:clamp(rawSize,7,26),
   eyeStageRatio:EYE_SIZE_BY_STAGE[stageProgress],
   faceBrightness:cameraShade,
   approximateCameraFacing:cameraFacing,
   eyeAlwaysOpen:true,blinkEnabled:false,
   originalHeadSurfaceAnchor:true,
   addedPhysicalGeometry:0
  });
 });
 return F({
  version:'1.0E',ok:true,eyes:F(out),
  originalMeshVertexCount:linked.originalMeshVertexCount,
  originalMeshTriangleCount:linked.originalMeshTriangleCount,
  stageProgress,
  eyeMaterialIndependentFromPixelSkin:true,
  pixelEyeDiameterFromHeadRadius:true,
  originalMeshAndCollisionUnmodified:true,
  eyeBlinkEnabled:false,playerSaveModified:false,
  actualCameraRayOcclusionCertified:false,
  realDeviceRasterAppearanceCertified:false
 });
}
