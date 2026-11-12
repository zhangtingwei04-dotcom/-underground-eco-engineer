/**
 * PROJECT OHM V0.7Z - PRIVATE, render-only 3D body-shape diagnostics.
 *
 * Articulated plastic-snake videos suggest many small bend increments. This
 * does NOT reproduce their copyrighted toy shape, or certify snake physiology.
 * It checks the CURRENT V0.7Y transparent candidate for tight source bends,
 * distant body-capsule proximity, ring radial direction reversal, and
 * SCREEN-ONLY overlap (2D projection but separated in 3D).
 *
 * Source bones, skin, 3D shell, original obstacle authority and save remain
 * untouched. Capsule proximity is an APPROXIMATION, not a continuous triangle
 * self-collision or a physically proved nonintersecting surface.
 */
import {projectSnakeFrontGlassPointV07g}
 from './snake-front-glass-projection-v07g.mjs';

export const SNAKE_VOLUME_CLEARANCE_VERSION='0.7Z';
const F=Object.freeze;
const validNumber=n=>typeof n==='number'&&Number.isFinite(n);
const valid3=p=>p&&[p.x,p.y,p.z].every(validNumber);
const P=(x,y,z)=>F({x,y,z});
const sub=(a,b)=>P(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,t)=>P(a.x*t,a.y*t,a.z*t);
const add=(a,b)=>P(a.x+b.x,a.y+b.y,a.z+b.z);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const mag=p=>Math.sqrt(dot(p,p));
const distance=(a,b)=>mag(sub(a,b));
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const avg=ring=>P(
 ring.reduce((s,p)=>s+p.x,0)/ring.length,
 ring.reduce((s,p)=>s+p.y,0)/ring.length,
 ring.reduce((s,p)=>s+p.z,0)/ring.length
);
const normalized=v=>{const l=mag(v);if(l<1e-9)throw new RangeError('v07z_degenerate_source_tangent');return mul(v,1/l)};
const problem=(reason,meta={})=>F({
 version:SNAKE_VOLUME_CLEARANCE_VERSION,ok:false,reason,
 qualityAccepted:false,
 sourceBonesChanged:false,bodyMeshChanged:false,headChanged:false,
 collisionCertifiedForPlayers:false,realMusclePhysicsVerified:false,
 fullTriangleSelfCollisionVerified:false,skinApplied:false,...meta
});
function segmentGap(a,b,c,d){
 // Closest points of two finite segments, including parallel and endpoints.
 const u=sub(b,a),v=sub(d,c),w=sub(a,c);
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),
 D=dot(u,w),E=dot(v,w),det=A*C-B*B;
 let sn=0,sd=det,tn=0,td=det;
 if(A<1e-12||C<1e-12)
  throw new RangeError('v07z_zero_length_segment');
 if(det<1e-12){sn=0;sd=1;tn=E;td=C;}
 else{
  sn=B*E-C*D;tn=A*E-B*D;
  if(sn<0){sn=0;tn=E;td=C;}
  else if(sn>sd){sn=sd;tn=E+B;td=C;}
 }
 if(tn<0){
  tn=0;
  if(-D<0)sn=0;
  else if(-D>A)sn=sd;
  else{sn=-D;sd=A;}
 }else if(tn>td){
  tn=td;
  if(-D+B<0)sn=0;
  else if(-D+B>A)sn=sd;
  else{sn=-D+B;sd=A;}
 }
 const s=Math.abs(sn)<1e-12?0:sn/sd;
 const t=Math.abs(tn)<1e-12?0:tn/td;
 return F({distance:mag(add(w,sub(mul(u,s),mul(v,t)))),tA:s,tB:t});
}
function segmentGap2D(a,b,c,d){
 const A=P(a.x,a.y,0),B=P(b.x,b.y,0),
 C=P(c.x,c.y,0),D=P(d.x,d.y,0);
 // For a degenerate projected link, use the corresponding point.
 if(distance(A,B)<1e-9&&distance(C,D)<1e-9)return distance(A,C);
 if(distance(A,B)<1e-9){
  const v=sub(D,C),t=clamp(dot(sub(A,C),v)/dot(v,v),0,1);
  return distance(A,add(C,mul(v,t)));
 }
 if(distance(C,D)<1e-9){
  const v=sub(B,A),t=clamp(dot(sub(C,A),v)/dot(v,v),0,1);
  return distance(C,add(A,mul(v,t)));
 }
 return segmentGap(A,B,C,D).distance;
}
function validate(pose,slender){
 if(![13,24].includes(pose?.points?.length)||
    !pose.points.every(valid3)||
    !validNumber(pose.segmentLength)||
    Math.abs(pose.segmentLength*(pose.points.length-1)-2.28)>1e-5||
    slender?.version!=='0.7Y'||slender.ok!==true||
    slender.sourceBonesModified!==false||
    slender.sourceHeadModified!==false||
    slender.originalHeadColliderStillAuthoritative!==true||
    slender.sameVerticesRenderedAndSampled!==true||
    slender.skinApplied!==false||
    slender.certifiedForGameplay!==false||
    slender.sourceJointCount!==pose.points.length||
    slender.bodyCandidate?.vertices?.length!==
     ((pose.points.length-1)*4+1)*12||
    slender.bodyWorldRings?.length!==(pose.points.length-1)*4+1||
    slender.profileScales?.length!==slender.bodyWorldRings.length)
  throw new RangeError('v07z_untrusted_slender_source');
 for(let i=0;i<pose.points.length;i++){
  if(i>0&&Math.abs(distance(pose.points[i],pose.points[i-1])-
    pose.segmentLength)>1e-5)
   throw new RangeError('v07z_source_bone_length_changed');
 }
 for(let i=0;i<slender.bodyWorldRings.length;i++){
  const ring=slender.bodyWorldRings[i];
  if(ring?.length!==12||!ring.every(valid3))
   throw new RangeError('v07z_corrupt_body_ring');
  for(let j=0;j<12;j++)
   if(distance(ring[j],slender.bodyCandidate.vertices[i*12+j])>1e-10)
    throw new RangeError('v07z_render_collision_xyz_mismatch');
 }
}
export function inspectSnakeVolumeClearanceV07z({
 pose,slender,maxBendRadians=1.05,minBoneIndexGap=4,
 collisionTolerance=.008,projectedPixelMargin=0
}={}){
 if(!validNumber(maxBendRadians)||maxBendRadians<.5||
    maxBendRadians>2||!Number.isInteger(minBoneIndexGap)||
    minBoneIndexGap<3||minBoneIndexGap>6||
    !validNumber(collisionTolerance)||collisionTolerance<0||
    collisionTolerance>.04||
    !validNumber(projectedPixelMargin)||projectedPixelMargin<0||
    projectedPixelMargin>24)
  throw new RangeError('v07z_invalid_diagnostic_limits');
 validate(pose,slender);
 const joints=pose.points,segments=joints.length-1;
 const headings=[],turnAngles=[],tightBends=[];
 for(let i=0;i<segments;i++)
  headings.push(normalized(sub(joints[i+1],joints[i])));
 for(let i=1;i<segments;i++){
  const angle=Math.acos(clamp(dot(headings[i-1],headings[i]),-1,1));
  turnAngles.push(angle);
  if(angle>maxBendRadians)tightBends.push(F({
   jointIndex:i,angleRadians:angle
  }));
 }
 const sourceRings=slender.bodyWorldRings;
 const perJointRadius=[];
 const perJointProjectedRadius=[];
 const projectedJointCenters=[];
 for(let i=0;i<joints.length;i++){
  const ring=sourceRings[i*4];
  const center=avg(ring);
  if(distance(center,joints[i])>2e-5)
   throw new RangeError('v07z_body_ring_not_centered_on_source_bone');
  const projected=projectSnakeFrontGlassPointV07g(center);
  if(!validNumber(projected.x)||!validNumber(projected.y))
   throw new RangeError('v07z_invalid_camera_projection');
  perJointRadius.push(Math.max(...ring.map(p=>distance(p,center))));
  perJointProjectedRadius.push(Math.max(...ring.map(p=>{
   const v=projectSnakeFrontGlassPointV07g(p);
   return Math.hypot(v.x-projected.x,v.y-projected.y);
  })));
  projectedJointCenters.push(projected);
 }
 let minimum3DClearance=Infinity,minimumProjectedGapPx=Infinity;
 const pairs=[],selfOverlapCandidates=[],projectionOnlyPairs=[];
 for(let i=0;i<segments;i++)for(let j=i+minBoneIndexGap;j<segments;j++){
  const gap=segmentGap(joints[i],joints[i+1],joints[j],joints[j+1]);
  const radiusA=Math.max(perJointRadius[i],perJointRadius[i+1]);
  const radiusB=Math.max(perJointRadius[j],perJointRadius[j+1]);
  // Spheres around each segment are conservative 3D *proxy* capsules.
  const clearance=gap.distance-radiusA-radiusB;
  const pixGap=segmentGap2D(
   projectedJointCenters[i],projectedJointCenters[i+1],
   projectedJointCenters[j],projectedJointCenters[j+1]
  )-Math.max(perJointProjectedRadius[i],perJointProjectedRadius[i+1])-
    Math.max(perJointProjectedRadius[j],perJointProjectedRadius[j+1]);
  minimum3DClearance=Math.min(minimum3DClearance,clearance);
  minimumProjectedGapPx=Math.min(minimumProjectedGapPx,pixGap);
  const pair=F({
   sourceBoneA:i,sourceBoneB:j,
   segmentSeparation3D:gap.distance,
   candidateCapsuleClearance:clearance,
   projectedGapPixels:pixGap,
   fullTriangleIntersectionProven:false
  });
  pairs.push(pair);
  if(clearance<-collisionTolerance)selfOverlapCandidates.push(pair);
  // This is the key art distinction: two regions can overlap in ONE
  // front-glass view without occupying the same 3D space.
  if(pixGap<=projectedPixelMargin&&clearance>collisionTolerance)
   projectionOnlyPairs.push(pair);
 }
 // Cross-section first radial axis should change continuously, rather
 // than abruptly reverse 180° at a bone U-turn (engineering warning only).
 const ringDirectionReversals=[];
 let lowestAdjacentRadialDot=1;
 for(let i=1;i<sourceRings.length;i++){
  const a=sourceRings[i-1],b=sourceRings[i];
  const va=normalized(sub(a[0],avg(a)));
  const vb=normalized(sub(b[0],avg(b)));
  const alignment=dot(va,vb);
  lowestAdjacentRadialDot=Math.min(lowestAdjacentRadialDot,alignment);
  if(alignment<-.1)ringDirectionReversals.push(F({
   ringIndex:i,radialDot:alignment
  }));
 }
 // A negative sampled capsule gap is a warning/rejection for the
 // opt-in preview, NEVER a verified penetration of actual triangle meshes.
 const qualityAccepted=tightBends.length===0&&
  selfOverlapCandidates.length===0&&ringDirectionReversals.length===0;
 return F({
  version:SNAKE_VOLUME_CLEARANCE_VERSION,ok:true,
  qualityAccepted,sourceJointCount:joints.length,
  checkedNonlocalBonePairs:pairs.length,
  minimum3DClearance,
  minimumProjectedGapPx,
  maximumSourceBendRadians:Math.max(0,...turnAngles),
  tightBends:F(tightBends),
  selfOverlapCandidates:F(selfOverlapCandidates),
  projectionOnlyPairs:F(projectionOnlyPairs),
  ringDirectionReversals:F(ringDirectionReversals),
  minimumAdjacentRadialDot:lowestAdjacentRadialDot,
  sourceBoneIndicesPreserved:true,
  sourceBonesChanged:false,bodyMeshChanged:false,headChanged:false,
  visualDiagnosticOnly:true,
  fullTriangleSelfCollisionVerified:false,
  continuousSweptSelfCollisionVerified:false,
  realMusclePhysicsVerified:false,
  collisionCertifiedForPlayers:false,
  skinApplied:false,affectsSave:false,affectsEcology:false
 });
}
