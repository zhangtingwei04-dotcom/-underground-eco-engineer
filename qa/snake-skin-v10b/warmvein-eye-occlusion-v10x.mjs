/**
 * PUBLIC V1.0X — visibility of the actual TWO anatomical eye anchors.
 * This is an eye-only renderer gate: do not remove/relocate the far eye
 * in the species, UV, head vertices, motion state, collision, or saves.
 *
 * The orthographic camera projects (x,y,z) -> (x,y+.56*z).
 * Its depth-facing axis is therefore (0,-.56,1), not simply world Z.
 * A side view displays the more camera-facing eye and hides the far eye,
 * preventing GL point sprites from protruding beyond the head silhouette.
 * A sufficiently frontal (toward-camera) view may display both.
 */
export const WARMVEIN_EYE_OCCLUSION_V10X='1.0X';
export const WARMVEIN_CAMERA_VERTICAL_MIX_V10X=.56;
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const len=v=>Math.hypot(v.x,v.y,v.z);
const camera=F({x:0,y:-.56/Math.hypot(1,.56),
 z:1/Math.hypot(1,.56)});
const frontalThreshold=.78;
export function selectWarmveinVisibleEyesV10x({mesh,eyes}={}){
 if(mesh?.vertexCount!==1617||mesh.noseVertexIndex!==1616||
  !Array.isArray(mesh.positions)||mesh.positions.length!==1617||
  !Array.isArray(eyes)||eyes.length!==2||
  eyes[0]?.surfaceVertexIndex===eyes[1]?.surfaceVertexIndex||
  eyes.some(e=>!e||!['left','right'].includes(e.side)||
   !Number.isInteger(e.surfaceVertexIndex)||
   e.surfaceVertexIndex<64||e.surfaceVertexIndex>79||
   ![e.position?.x,e.position?.y,e.position?.z,
    e.pointSizePx,e.approximateCameraFacing].every(finite)))
  throw new RangeError('v10x_requires_original_two_attached_head_eyes');
 const socket={x:0,y:0,z:0};
 for(let j=128;j<144;j++){
  const p=mesh.positions[j];
  if(!p||![p.x,p.y,p.z].every(finite))
   throw new RangeError('v10x_invalid_original_shared_socket');
  socket.x+=p.x/16;socket.y+=p.y/16;socket.z+=p.z/16;
 }
 const nose=mesh.positions[1616];
 if(!nose||![nose.x,nose.y,nose.z].every(finite))
  throw new RangeError('v10x_invalid_source_nose');
 const forward={x:nose.x-socket.x,y:nose.y-socket.y,z:nose.z-socket.z};
 const forwardLength=len(forward);
 if(forwardLength<.00001)
  throw new RangeError('v10x_degenerate_head_forward');
 const facing=dot(forward,camera)/forwardLength;
 const ranked=eyes.slice().sort((a,b)=>
  b.approximateCameraFacing-a.approximateCameraFacing);
 // Far-side sprite is hidden in profile irrespective of whether its
 // oversized GL_POINT would extend beyond the opaque head contour.
 // For a true frontal view both eyes may be visible if camera-facing.
 const frontal=facing>=frontalThreshold;
 const visible=frontal?
  eyes.filter(e=>e.approximateCameraFacing>=.09):
  (ranked[0].approximateCameraFacing>-.10?[ranked[0]]:[]);
 const hidden=eyes.filter(e=>!visible.includes(e));
 return F({
  version:WARMVEIN_EYE_OCCLUSION_V10X,
  visibleEyes:F(visible),hiddenEyes:F(hidden),
  visibleEyeCount:visible.length,hiddenEyeCount:hidden.length,
  profileView:!frontal,frontFacingDot:facing,
  visibleAnchorIds:F(visible.map(e=>e.surfaceVertexIndex)),
  hiddenAnchorIds:F(hidden.map(e=>e.surfaceVertexIndex)),
  cameraDepthAxis:camera,
  eyeAnchorsRemainTwo:true,
  originalHeadVerticesAndColliderUntouched:true,
  atlasUnchanged:true,
  noBlink:true,playerSaveModified:false,
  actualDeviceVisualApprovalPending:true
 });
}
