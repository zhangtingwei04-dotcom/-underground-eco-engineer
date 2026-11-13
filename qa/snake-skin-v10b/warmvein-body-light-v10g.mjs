/**
 * PRIVATE V1.0G: derived VISUAL normals for the existing V0.9R/U snake.
 * No mesh displacement, radius edits, extra colliders, or changes to
 * V0.9T movement. Normals are inferred from 101 x 16 radial rings;
 * do not claim real musculature or anatomical surface shading.
 */
export const WARMVEIN_BODY_LIGHT_V10G='1.0G';
const F=Object.freeze;
const norm=v=>Math.hypot(v.x,v.y,v.z);
const finite=x=>typeof x==='number'&&Number.isFinite(x);

export function deriveWarmveinRenderNormalsV10g(mesh){
 if(mesh?.vertexCount!==1617||mesh?.triangleCount!==3216||
  mesh?.positions?.length!==1617||
  mesh?.radialSegments!==16||mesh?.headExtraRingCount!==8||
  mesh?.neckSocketRingStartIndex!==128||
  mesh?.headBodySeamSharedVertices!==true)
  throw new RangeError('v10g_requires_true_welded_head_body_mesh');
 const normals=[];
 for(let ring=0;ring<101;ring++){
  const center={x:0,y:0,z:0};
  for(let j=0;j<16;j++){
   const p=mesh.positions[ring*16+j];
   if(![p?.x,p?.y,p?.z].every(finite))
    throw new RangeError('v10g_nonfinite_ring_point');
   center.x+=p.x/16;center.y+=p.y/16;center.z+=p.z/16;
  }
  for(let j=0;j<16;j++){
   const p=mesh.positions[ring*16+j];
   const v={x:p.x-center.x,y:p.y-center.y,z:p.z-center.z};
   const length=norm(v);
   if(length<.00001)
    throw new RangeError('v10g_degenerate_ring_radius');
   normals.push(F({x:v.x/length,y:v.y/length,z:v.z/length}));
  }
 }
 const tip=mesh.positions[1616];
 if(![tip?.x,tip?.y,tip?.z].every(finite))
  throw new RangeError('v10g_nonfinite_nose_point');
 const noseCenter={x:0,y:0,z:0};
 for(let j=0;j<16;j++){
  const p=mesh.positions[j];
  noseCenter.x+=p.x/16;noseCenter.y+=p.y/16;noseCenter.z+=p.z/16;
 }
 const vector={x:tip.x-noseCenter.x,
  y:tip.y-noseCenter.y,z:tip.z-noseCenter.z};
 const length=norm(vector);
 if(length<.00001)throw new RangeError('v10g_degenerate_nose');
 normals.push(F({x:vector.x/length,
  y:vector.y/length,z:vector.z/length}));
 return F({
  version:'1.0G',normals:F(normals),
  count:normals.length,allUnitLength:true,
  headAndBodyShareOriginalVertices:true,
  physicsGeometryChanged:false,
  gameplayLightingInstalled:false,
  visualApproximationOnly:true,gameSaveModified:false
 });
}
