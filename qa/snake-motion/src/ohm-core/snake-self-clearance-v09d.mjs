/**
 * Public Project OHM V0.9D — whole-centerline 3D nonlocal
 * capsule-separation QA on the SAME real 24-joint V0.7S source pose.
 *
 * Uses the existing V0.7Y taper profile as a cautious candidate envelope.
 * No rendered triangle intersection, skin, muscle, traction or continuous
 * swept 3D collision is certified. A negative proxy gap warns of a possible
 * issue; an unverified body is NEVER silently corrected or teleported.
 */
import {snakeSlimFactorV07y}
 from './snake-slender-volume-v07y.mjs';
import {advanceSnakeRouteFollowerV09c}
 from './snake-route-follower-v09c.mjs';

export const SNAKE_SELF_CLEARANCE_V09D_VERSION='0.9D';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const vec=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const clip=(x,a,b)=>Math.max(a,Math.min(b,x));
const radians=(a,b,c)=>{
 const u=vec(a,b),v=vec(c,b),x=Math.hypot(u.x,u.y,u.z),
  y=Math.hypot(v.x,v.y,v.z);
 if(x<1e-9||y<1e-9)throw new RangeError('v09d_degenerate_joint_angle');
 return Math.acos(clip(dot(u,v)/(x*y),-1,1));
};
/** Robust finite 3D segment distance, including parallel/endpoint cases. */
function segmentDistance(a,b,c,d){
 const u=vec(b,a),v=vec(d,c),w=vec(a,c),
  A=dot(u,u),B=dot(u,v),C=dot(v,v),D=dot(u,w),
  E=dot(v,w),det=A*C-B*B;
 if(A<1e-12||C<1e-12)throw new RangeError('v09d_zero_length_link');
 let sN=0,sD=det,tN=0,tD=det;
 if(det<1e-12){sN=0;sD=1;tN=E;tD=C}
 else{
  sN=B*E-C*D;tN=A*E-B*D;
  if(sN<0){sN=0;tN=E;tD=C}
  else if(sN>sD){sN=sD;tN=E+B;tD=C}
 }
 if(tN<0){
  tN=0;
  if(-D<0)sN=0;
  else if(-D>A)sN=sD;
  else{sN=-D;sD=A}
 }else if(tN>tD){
  tN=tD;
  if(-D+B<0)sN=0;
  else if(-D+B>A)sN=sD;
  else{sN=-D+B;sD=A}
 }
 const s=Math.abs(sN)<1e-12?0:sN/sD,
  t=Math.abs(tN)<1e-12?0:tN/tD;
 return Math.hypot(w.x+s*u.x-t*v.x,
   w.y+s*u.y-t*v.y,w.z+s*u.z-t*v.z);
}
function verifiedPose(pose){
 if(!pose||pose.points?.length!==24||
  !finite(pose.bodyRadius)||Math.abs(pose.bodyRadius-.13)>1e-8||
  !finite(pose.segmentLength)||
  Math.abs(pose.segmentLength*23-2.28)>1e-5||
  pose.points.some(p=>![p.x,p.y,p.z].every(finite)))
  throw new RangeError('v09d_requires_unchanged_24_joint_source_pose');
 for(let i=1;i<24;i++){
  if(Math.abs(dist(pose.points[i-1],pose.points[i])-
    pose.segmentLength)>1e-5)
   throw new RangeError('v09d_source_link_length_changed');
 }
}
/**
 * Check all non-neighbor links, excluding 3 close neighbors of each link.
 * This is a conservative candidate capsule check on the source centerline.
 */
export function inspectSnakeSelfClearanceV09d({
 pose,minBoneIndexGap=4,collisionTolerance=.008,
 maxBendRadians=.65
}={}){
 verifiedPose(pose);
 if(!Number.isInteger(minBoneIndexGap)||
    minBoneIndexGap<4||minBoneIndexGap>7||
    !finite(collisionTolerance)||collisionTolerance<0||
    collisionTolerance>.04||!finite(maxBendRadians)||
    maxBendRadians<.3||maxBendRadians>1.2)
  throw new RangeError('v09d_invalid_clearance_settings');
 const links=pose.points.length-1,pts=pose.points;
 const radii=pts.map((_,i)=>
  pose.bodyRadius*snakeSlimFactorV07y(i/23));
 let minGap=Infinity,minPair=null,pairs=0;
 const intersections=[];
 for(let i=0;i<links;i++)for(let j=i+minBoneIndexGap;j<links;j++){
  const ds=segmentDistance(pts[i],pts[i+1],pts[j],pts[j+1]);
  const radiusA=Math.max(radii[i],radii[i+1]),
   radiusB=Math.max(radii[j],radii[j+1]);
  const gap=ds-radiusA-radiusB;
  pairs++;
  if(gap<minGap){minGap=gap;minPair=F({boneA:i,boneB:j})}
  if(gap<-collisionTolerance)
   intersections.push(F({boneA:i,boneB:j,
    candidateGap:gap,centerlineDistance:ds}));
 }
 let maxAngle=0,worstBend=null;
 for(let i=1;i<pts.length-1;i++){
  const angle=radians(pts[i-1],pts[i],pts[i+1]);
  if(angle>maxAngle){maxAngle=angle;worstBend=i;}
 }
 return F({
  version:SNAKE_SELF_CLEARANCE_V09D_VERSION,ok:true,
  candidateClearanceAccepted:intersections.length===0&&
    maxAngle<=maxBendRadians+1e-8,
  checkedNonlocalPairs:pairs,minBoneIndexGap,
  minimumCapsuleGap:minGap,minimumPair:minPair,
  candidateOverlapCount:intersections.length,
  candidateOverlaps:F(intersections),
  maximumBendRadians:maxAngle,worstBendJoint:worstBend,
  sourceBoneCount:24,bodySourceUnmodified:true,
  selfSurfaceCollisionCertified:false,
  swept3DCollisionCertified:false,
  realMuscleDynamicsCertified:false,
  animalWelfareCertified:false,skinApplied:false,
  projectionOnlyNoOverlapProof:true
 });
}
function stop(state,reason,diagnostic){
 return F({
  version:SNAKE_SELF_CLEARANCE_V09D_VERSION,
  ok:false,phase:'self_clearance_stop',reason,
  actorId:state.actorId,previousState:state,
  diagnostic,
  renderablePose:null,movementCompleted:false,
  fullBodyReturnVerified:false,skinApplied:false,
  saveModified:false,playerObservationRecorded:false,
  gameSceneIntegrationAuthorized:false
 });
}
/**
 * Fail-closed opt-in gate AFTER V0.9C physics passes.
 * The old V0.9C path remains unchanged for regression comparisons.
 */
export function advanceSnakeRouteWithSelfGuardV09d({
 state,scene,terrain,seconds=1/30
}={}){
 if(state?.version!=='0.9C'||!state.pose||
   !['moving_outbound','moving_return'].includes(state.phase))
  throw new RangeError('v09d_invalid_source_follower');
 const before=inspectSnakeSelfClearanceV09d({pose:state.pose});
 if(!before.candidateClearanceAccepted)
  return stop(state,'previous_source_self_clearance_not_accepted',before);
 const next=advanceSnakeRouteFollowerV09c({state,scene,terrain,seconds});
 if(!['moving_outbound','moving_return'].includes(next.phase)){
  if(next.phase==='stopped')return F({...next,
   selfGuardV09d:'source_follower_stopped',
   renderablePose:null,gameSceneIntegrationAuthorized:false});
  return F({...next,
   selfGuardV09d:'head_ended_not_full_body_or_contact_proof',
   selfSurfaceCollisionCertified:false});
 }
 const after=inspectSnakeSelfClearanceV09d({pose:next.pose});
 if(!after.candidateClearanceAccepted)
  return stop(state,'next_source_self_clearance_rejected',after);
 return F({...next,selfGuardV09d:'candidate_capsules_clear',
  selfClearanceDiagnostic:after,
  selfSurfaceCollisionCertified:false,
  gameSceneIntegrationAuthorized:false});
}
