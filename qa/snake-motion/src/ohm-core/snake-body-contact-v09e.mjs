/**
 * OHM PUBLIC V0.9E — classifies plausible 3D body-over-body contact without
 * declaring that two interpenetrating capsules are legal.
 *
 * A vertically stacked segment may be spatially touching or passing over
 * another segment. Support is only a *candidate* if the lower segment is
 * near the source terrain; no force, self-surface mesh, friction or lift
 * solver is implied. Nothing in this file raises the snake or moves a bone.
 *
 * The V0.9D conservative collision/curvature gate is preserved verbatim.
 * The user's real-world reference (snakes coil over their bodies) does not
 * authorize allowing negative 3D penetration. All tests are synthetic.
 */
import {snakeSlimFactorV07y}
 from './snake-slender-volume-v07y.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {
 inspectSnakeSelfClearanceV09d,
 advanceSnakeRouteWithSelfGuardV09d
} from './snake-self-clearance-v09d.mjs';

export const SNAKE_BODY_CONTACT_V09E_VERSION='0.9E';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const add=(a,b,t)=>F({x:a.x+(b.x-a.x)*t,
 y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
/**
 * Stable exact closest pair of 3D line segments, including parallel cases.
 * This is NOT a continuous swept test between frames.
 */
function closestSegments(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(a,c);
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),
  D=dot(u,w),E=dot(v,w),det=A*C-B*B;
 if(A<1e-12||C<1e-12)
  throw new RangeError('v09e_degenerate_source_segment');
 let sN=0,sD=det,tN=0,tD=det;
 if(det<1e-12){sN=0;sD=1;tN=E;tD=C;}
 else{
  sN=B*E-C*D;tN=A*E-B*D;
  if(sN<0){sN=0;tN=E;tD=C;}
  else if(sN>sD){sN=sD;tN=E+B;tD=C;}
 }
 if(tN<0){
  tN=0;
  if(-D<0)sN=0;
  else if(-D>A)sN=sD;
  else{sN=-D;sD=A;}
 }else if(tN>tD){
  tN=tD;
  if(-D+B<0)sN=0;
  else if(-D+B>A)sN=sD;
  else{sN=-D+B;sD=A;}
 }
 const s=Math.abs(sN)<1e-12?0:sN/sD;
 const t=Math.abs(tN)<1e-12?0:tN/tD;
 const first=add(a,b,s),second=add(c,d,t);
 return F({first,second,
  centerDistance:Math.hypot(first.x-second.x,first.y-second.y,
   first.z-second.z),
  projectedXYDistance:Math.hypot(first.x-second.x,first.y-second.y),
  verticalCenterSeparation:Math.abs(first.z-second.z)});
}
/** Reports 3D overpass vs contact vs overlap. Never modifies the input. */
export function inspectSnakeBodyContactV09e({
 pose,terrain=null,minBoneIndexGap=4,
 contactMargin=.02,penetrationTolerance=.008,
 terrainSupportMargin=.05
}={}){
 // V0.9D is the sole authority on conservative link-length/bend/capsule
 // acceptance, including the unchanged -0.008 default penetration limit.
 const legacy=inspectSnakeSelfClearanceV09d({
  pose,minBoneIndexGap,collisionTolerance:penetrationTolerance
 });
 if(!finite(contactMargin)||contactMargin<0||contactMargin>.04||
    !finite(terrainSupportMargin)||terrainSupportMargin<0||
    terrainSupportMargin>.08)
  throw new RangeError('v09e_invalid_contact_gate');
 if(terrain!==null){
  if(!terrain||typeof terrain!=='object')
   throw new RangeError('v09e_invalid_terrain');
  // Uses the existing authoritative terrain-heightfield shape checker.
  sampleSnakeTerrain(pose.points[0].x,pose.points[0].y,terrain);
 }
 const pts=pose.points,links=pts.length-1,
  radii=pts.map((_,i)=>pose.bodyRadius*snakeSlimFactorV07y(i/23));
 const near=[],suspectedPenetrations=[],stackCandidates=[];
 let spatiallySeparatedOverpassCount=0,planarCloseCount=0,
  unsupportedVerticalTouchCount=0,minimumGap=Infinity;
 for(let i=0;i<links;i++)for(let j=i+minBoneIndexGap;j<links;j++){
  const c=closestSegments(pts[i],pts[i+1],pts[j],pts[j+1]);
  const rA=Math.max(radii[i],radii[i+1]);
  const rB=Math.max(radii[j],radii[j+1]);
  const radiusSum=rA+rB,gap=c.centerDistance-radiusSum;
  minimumGap=Math.min(minimumGap,gap);
  const alignedInXY=c.projectedXYDistance<=radiusSum+contactMargin;
  if(!alignedInXY)continue;
  const verticallyLayered=c.verticalCenterSeparation>
    .72*radiusSum;
  if(verticallyLayered&&gap>contactMargin){
   spatiallySeparatedOverpassCount++;continue;
  }
  if(gap>contactMargin)continue;
  const lower=c.first.z<=c.second.z?c.first:c.second,
   lowerRadius=c.first.z<=c.second.z?rA:rB;
  let terrainEvidence=null;
  if(terrain!==null){
   const surface=sampleSnakeTerrain(lower.x,lower.y,terrain);
   terrainEvidence=F({kind:surface.source,
    centerBottomMinusGround:lower.z-lowerRadius-surface.z});
  }
  const grounded=terrainEvidence!==null&&
   terrainEvidence.centerBottomMinusGround>=-penetrationTolerance&&
   terrainEvidence.centerBottomMinusGround<=terrainSupportMargin;
  const verticalTouch=verticallyLayered&&
   c.projectedXYDistance<=radiusSum*.55;
  let classification;
  if(gap< -penetrationTolerance){
   classification='possible_3d_penetration';
  }else if(verticalTouch&&grounded){
   classification='ground_supported_vertical_contact_candidate';
  }else if(verticalTouch){
   classification='vertical_contact_support_unverified';
   unsupportedVerticalTouchCount++;
  }else{
   classification='planar_or_diagonal_near_contact';
   planarCloseCount++;
  }
  const record=F({boneA:i,boneB:j,classification,
   signedCapsuleGap:gap,centerDistance:c.centerDistance,
   projectedXYDistance:c.projectedXYDistance,
   verticalCenterSeparation:c.verticalCenterSeparation,
   upperLink:c.first.z>c.second.z?i:j,
   lowerLink:c.first.z<=c.second.z?i:j,
   terrainEvidence});
  near.push(record);
  if(classification==='possible_3d_penetration')
   suspectedPenetrations.push(record);
  if(classification==='ground_supported_vertical_contact_candidate')
   stackCandidates.push(record);
 }
 return F({
  version:SNAKE_BODY_CONTACT_V09E_VERSION,
  sourceBoneCount:24,checkedNonlocalPairs:legacy.checkedNonlocalPairs,
  candidateClearanceAccepted:legacy.candidateClearanceAccepted,
  // Hard invariant: adding a contact vocabulary never weakens V0.9D.
  releaseAllowedByExistingV09dGate:legacy.candidateClearanceAccepted,
  minimumCapsuleGap:minimumGap,
  suspectedPenetrationCount:suspectedPenetrations.length,
  suspectedPenetrations:F(suspectedPenetrations),
  possibleSupportedContactCount:stackCandidates.length,
  possibleSupportedContacts:F(stackCandidates),
  unsupportedVerticalTouchCount,planarCloseCount,
  separatedOverpassCount:spatiallySeparatedOverpassCount,
  nearPairs:F(near),maximumBendRadians:legacy.maximumBendRadians,
  physicsSupportForceVerified:false,
  trueMeshSelfCollisionVerified:false,
  continuousSweptContactVerified:false,
  fullBodyReturnVerified:false,skinApplied:false,
  sourceBodyModified:false,
  note:'vertical_layering_and_terrain_proximity_are_not_a_contact_force_solver'
 });
}
function blocked(state,reason,diagnostic){
 return F({version:SNAKE_BODY_CONTACT_V09E_VERSION,
  ok:false,phase:'body_contact_stop',reason,
  previousState:state,diagnostic,renderablePose:null,
  playerObservationRecorded:false,skinApplied:false,
  saveModified:false,gameSceneIntegrationAuthorized:false});
}
/** Opt-in guard for real existing V0.9C full-body steps. */
export function advanceSnakeRouteWithContactGuardV09e({
 state,scene,terrain,seconds=1/30
}={}){
 if(state?.version!=='0.9C'||!state.pose||
  !['moving_outbound','moving_return'].includes(state.phase))
  throw new RangeError('v09e_invalid_source_follower');
 const before=inspectSnakeBodyContactV09e({pose:state.pose,terrain});
 if(!before.releaseAllowedByExistingV09dGate)
  return blocked(state,'previous_v09d_gate_rejected',before);
 const next=advanceSnakeRouteWithSelfGuardV09d({
  state,scene,terrain,seconds
 });
 if(next.phase==='self_clearance_stop'||next.phase==='stopped')
  return F({...next,contactGuardV09e:'v09d_source_stop_unchanged',
   gameSceneIntegrationAuthorized:false});
 if(!['moving_outbound','moving_return'].includes(next.phase))
  return F({...next,contactGuardV09e:'source_ended_not_body_support_proof',
   physicsSupportForceVerified:false});
 const after=inspectSnakeBodyContactV09e({pose:next.pose,terrain});
 if(!after.releaseAllowedByExistingV09dGate)
  return blocked(state,'next_v09d_gate_rejected',after);
 return F({...next,contactGuardV09e:'v09d_clear_with_contact_classification',
  bodyContactDiagnosticV09e:after,
  physicsSupportForceVerified:false,
  gameSceneIntegrationAuthorized:false});
}
