/**
 * Public neutral OHM V0.9N — synthetic life-stage morphology and size QA.
 *
 * These FOUR synthetic stages are engineering fixtures, NOT real-species
 * length/age/growth rates. Unlike scaling a rendered sprite, the 24-joint
 * candidate changes link LENGTH and distinct head/trunk/tail WIDTH ratios.
 *
 * Current V0.9C/V0.9D SOURCE MOTION is strictly fixed at 2.28 length and
 * .13 body radius; it must NEVER receive this changed pose as an authentic
 * motion source. Growth candidates are read-only diagnostics. A real
 * variable-size controller and full swept mesh/force validation are future
 * gates; no scene, animal pose, save or skin is modified here.
 */
import {inspectSnakeSelfClearanceV09d}
 from './snake-self-clearance-v09d.mjs';
import {snakeSlimFactorV07y}
 from './snake-slender-volume-v07y.mjs';
import {createSnakeTerrariumCorridorV07c}
 from './snake-terrarium-corridor-v07c.mjs';

export const SNAKE_GROWTH_ENVELOPE_V09N_VERSION='0.9N';
const F=Object.freeze;
const PX_PER_WORLD=125; // V0.7C uses .008 world units / floor pixel.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const xyDist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const p=(x,y,z)=>F({x,y,z});
const xy=(x,y)=>F({x,y});
const STAGES=F([
 F({stage:'juvenile',progress:0,lengthScale:.50,girthScale:.58,
  headRatio:1.19,tailRatio:.92}),
 F({stage:'growing',progress:1,lengthScale:.75,girthScale:.79,
  headRatio:1.10,tailRatio:.97}),
 F({stage:'adult',progress:2,lengthScale:1,girthScale:1,
  headRatio:1,tailRatio:1}),
 F({stage:'large_adult',progress:3,lengthScale:1.30,girthScale:1.18,
  headRatio:.96,tailRatio:1.04})
]);
export const SNAKE_SYNTHETIC_GROWTH_STAGES_V09N=STAGES;
function profileAt(progress){
 if(!finite(progress)||progress<0||progress>3)
  throw new RangeError('v09n_invalid_synthetic_stage_progress');
 const lower=Math.min(2,Math.floor(progress)),t=progress-lower;
 if(progress===3)return STAGES[3];
 const a=STAGES[lower],b=STAGES[lower+1];
 return F({
  stage:progress===Math.floor(progress)?a.stage:'between_stages',
  progress,lengthScale:a.lengthScale+(b.lengthScale-a.lengthScale)*t,
  girthScale:a.girthScale+(b.girthScale-a.girthScale)*t,
  headRatio:a.headRatio+(b.headRatio-a.headRatio)*t,
  tailRatio:a.tailRatio+(b.tailRatio-a.tailRatio)*t
 });
}
function heading3(a,b){
 const v={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
 const length=Math.hypot(v.x,v.y,v.z);
 if(length<1e-9)throw new RangeError('v09n_zero_source_link');
 return F({x:v.x/length,y:v.y/length,z:v.z/length});
}
function radiusAt(profile,i){
 const t=i/23;
 const head=Math.max(0,1-t/.24);
 const tail=Math.max(0,(t-.70)/.30);
 const relative=1+(profile.headRatio-1)*head+
  (profile.tailRatio-1)*tail;
 return .13*profile.girthScale*snakeSlimFactorV07y(t)*relative;
}
function boneWeights(profile){
 const weights=Array.from({length:23},(_,i)=>{
  const head=Math.max(0,1-i/5);
  const tail=Math.max(0,(i-16)/7);
  return 1+(profile.headRatio-1)*.45*head+
   (profile.tailRatio-1)*.55*tail;
 });
 const sum=weights.reduce((a,b)=>a+b,0);
 return F(weights.map(x=>23*x/sum));
}
/** Pure 24-point reinterpretation of the same ORIGINAL canonical source. */
export function projectSnakeGrowthCandidateV09n({
 sourcePose,stageProgress=2
}={}){
 const original=inspectSnakeSelfClearanceV09d({pose:sourcePose});
 if(!original.candidateClearanceAccepted)
  throw new RangeError('v09n_rejected_untrusted_source_pose');
 const stage=profileAt(stageProgress);
 const weights=boneWeights(stage);
 const coords=[p(...['x','y','z'].map(k=>sourcePose.points[0][k]))];
 for(let i=1;i<24;i++){
  const direction=heading3(sourcePose.points[i-1],
   sourcePose.points[i]);
  const link=sourcePose.segmentLength*stage.lengthScale*
   weights[i-1];
  const prev=coords[i-1];
  coords.push(p(prev.x+direction.x*link,
   prev.y+direction.y*link,
   prev.z+direction.z*link));
 }
 const radii=F(coords.map((_,i)=>radiusAt(stage,i)));
 const links=F(coords.slice(1).map((q,i)=>d(coords[i],q)));
 const floor=F(coords.map(q=>xy(q.x*PX_PER_WORLD+500,
  q.y*PX_PER_WORLD+200)));
 return F({
  version:SNAKE_GROWTH_ENVELOPE_V09N_VERSION,
  lifeStage:stage.stage,stageProgress,
  lengthWorldUnits:links.reduce((a,b)=>a+b,0),
  ratioToCanonicalLength:stage.lengthScale,
  maxRadiusWorldUnits:Math.max(...radii),
  headRadiusWorldUnits:radii[0],
  trunkRadiusWorldUnits:radii[11],
  tailRadiusWorldUnits:radii[23],
  profile:stage,
  jointCount:24,linkCount:23,
  points:F(coords),floorPoints:floor,
  radiiWorldUnits:radii,boneLengths:links,
  canonicalSourceUnmodified:true,
  sourceMotionAuthorized:false,
  sourceV09dAcceptsGrowthPose:false,
  physicallyCertified:false,skinApplied:false,saveModified:false
 });
}
function intersectSegmentRect(a,b,minX,minY,maxX,maxY){
 let lo=0,hi=1;
 for(const [s,t,low,high] of [
  [a.x,b.x-a.x,minX,maxX],[a.y,b.y-a.y,minY,maxY]
 ]){
  if(Math.abs(t)<1e-12){
   if(s<low||s>high)return false;
  }else{
   let enter=(low-s)/t,exit=(high-s)/t;
   if(enter>exit)[enter,exit]=[exit,enter];
   lo=Math.max(lo,enter);hi=Math.min(hi,exit);
   if(lo>hi)return false;
  }
 }
 return lo<=1&&hi>=0;
}
function capsule2DSegmentDistance(a,b,c,d){
 // Conservative planar segment distance (no 3D over/under-pass).
 function distPointSegment(q,u,v){
  const dx=v.x-u.x,dy=v.y-u.y;
  const len=dx*dx+dy*dy;
  const t=len>1e-14?clamp(((q.x-u.x)*dx+
   (q.y-u.y)*dy)/len,0,1):0;
  return Math.hypot(q.x-u.x-t*dx,q.y-u.y-t*dy);
 }
 const v1={x:b.x-a.x,y:b.y-a.y};
 const v2={x:d.x-c.x,y:d.y-c.y};
 const cross=(u,v)=>u.x*v.y-u.y*v.x;
 const delta={x:c.x-a.x,y:c.y-a.y};
 const crossValue=cross(v1,v2);
 if(Math.abs(crossValue)>1e-12){
  const t=cross(delta,v2)/crossValue;
  const u=cross(delta,v1)/crossValue;
  if(t>=0&&t<=1&&u>=0&&u<=1)return 0;
 }
 return Math.min(distPointSegment(a,c,d),
  distPointSegment(b,c,d),distPointSegment(c,a,b),
  distPointSegment(d,a,b));
}
function sceneAudit(candidate,scene,additionalPaddingPixels){
 const corridor=createSnakeTerrariumCorridorV07c(scene);
 const obstacles=scene.objects;
 let minGlass=Infinity,reason=null;
 for(let i=0;i<24;i++){
  const q=candidate.floorPoints[i];
  const margin=candidate.radiiWorldUnits[i]*PX_PER_WORLD+
   additionalPaddingPixels;
  minGlass=Math.min(minGlass,q.x-margin,1000-margin-q.x,
   q.y-margin,400-margin-q.y);
  if(minGlass<0)reason='body_growth_outside_glass';
 }
 if(reason)return F({clear:false,reason,minGlassGapPx:minGlass});
 for(let i=0;i<23;i++){
  const a=candidate.floorPoints[i],b=candidate.floorPoints[i+1];
  const radius=Math.max(candidate.radiiWorldUnits[i],
   candidate.radiiWorldUnits[i+1])*PX_PER_WORLD+
   additionalPaddingPixels;
  for(const rock of obstacles){
   if(intersectSegmentRect(a,b,
    rock.x-radius,rock.y-radius,
    rock.x+rock.width+radius,rock.y+rock.depth+radius))
    return F({clear:false,reason:'growth_touches_source_scene_object',
     blockerId:rock.id,minGlassGapPx:minGlass});
  }
 }
 return F({clear:true,reason:null,
  sourceSceneRevision:corridor.sceneRevision,
  minGlassGapPx:minGlass});
}
function nonlocalSelf(candidate){
 const v=candidate.floorPoints,r=candidate.radiiWorldUnits;
 let minGap=Infinity;
 for(let i=0;i<23;i++)
  for(let j=i+4;j<23;j++){
   const gap=capsule2DSegmentDistance(v[i],v[i+1],v[j],
    v[j+1])-(Math.max(r[i],r[i+1])+
    Math.max(r[j],r[j+1]))*PX_PER_WORLD;
   minGap=Math.min(minGap,gap);
   if(gap<-.8)return F({clear:false,minGapPx:minGap,
    reason:'nonlocal_2d_growth_capsule_overlap'});
  }
 return F({clear:true,minGapPx:minGap,reason:null});
}
/**
 * Checks an immutable growth candidate in the original scene. Other
 * collisions/pose authorities may still reject: this DOES NOT grant
 * original V0.9C 24-joint motion permission at a different body size.
 */
export function inspectSnakeGrowthEnvelopeV09n({
 sourcePose,scene,stageProgress=2,additionalPaddingPixels=2,
 goalFloor=null,goalRadiusPixels=160
}={}){
 if(!finite(additionalPaddingPixels)||
  additionalPaddingPixels<0||additionalPaddingPixels>12||
  goalFloor!==null&&(!finite(goalFloor.x)||!finite(goalFloor.y)||
   goalFloor.x<0||goalFloor.x>1000||
   goalFloor.y<0||goalFloor.y>400)||
  !finite(goalRadiusPixels)||goalRadiusPixels<35||
  goalRadiusPixels>240)
  throw new RangeError('v09n_invalid_growth_inspection_parameters');
 const candidate=projectSnakeGrowthCandidateV09n({
  sourcePose,stageProgress
 });
 const environment=sceneAudit(candidate,scene,additionalPaddingPixels);
 const self=nonlocalSelf(candidate);
 const goal=goalFloor===null?null:(()=>{
  const distances=candidate.floorPoints.map(q=>
   xyDist(q,goalFloor));
  const inside=distances.filter((x,i)=>x+
   candidate.radiiWorldUnits[i]*PX_PER_WORLD+
   additionalPaddingPixels<=goalRadiusPixels).length;
  return F({jointsInside:inside,all24Inside:inside===24,
   headDistancePx:distances[0],tailDistancePx:distances[23],
   meanDistancePx:distances.reduce((a,b)=>a+b,0)/24,
   worstDistancePx:Math.max(...distances)});
 })();
 return F({
  version:SNAKE_GROWTH_ENVELOPE_V09N_VERSION,
  stageProgress,lifeStage:candidate.lifeStage,
  candidate,environment,self,goal,
  static2DCandidateClear:environment.clear&&self.clear,
  sizeChangedFromCanonical:Math.abs(stageProgress-2)>1e-9,
  originalControllerMustPauseOnResize:true,
  noNewAuthorizedSourcePose:true,
  fullBodyReturnVerified:false,
  swept3DCollisionCertified:false,
  physicallyCertified:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * Continuous growth between two adjacent LIFE-STAGE samples has to avoid
 * a nonphysical jump and ensure no scene object is touched during resize.
 * For linearly moved joints, the swept link lies in the convex hull of its
 * four endpoint positions. Testing the hull's bounding AABB against each
 * inflated solid can over-reject, but must NOT under-report an AABB hit.
 */
export function inspectSnakeGrowthTransitionV09n({
 sourcePose,scene,fromProgress,toProgress,
 additionalPaddingPixels=2
}={}){
 if(!finite(fromProgress)||!finite(toProgress)||
  fromProgress<0||toProgress>3||
  toProgress<=fromProgress||toProgress-fromProgress>.20+1e-9||
  !finite(additionalPaddingPixels)||
  additionalPaddingPixels<0||additionalPaddingPixels>12)
  throw new RangeError('v09n_unbounded_growth_transition');
 const a=inspectSnakeGrowthEnvelopeV09n({
  sourcePose,scene,stageProgress:fromProgress,
  additionalPaddingPixels
 });
 const b=inspectSnakeGrowthEnvelopeV09n({
  sourcePose,scene,stageProgress:toProgress,
  additionalPaddingPixels
 });
 const rocks=scene.objects;
 let sweepClear=a.static2DCandidateClear&&b.static2DCandidateClear;
 let hitObject=null,reason=null;
 if(!sweepClear)reason='endpoint_growth_envelope_not_clear';
 for(let i=0;i<23;i++){
  const vertices=[a.candidate.floorPoints[i],
   a.candidate.floorPoints[i+1],
   b.candidate.floorPoints[i],
   b.candidate.floorPoints[i+1]];
  const pad=Math.max(a.candidate.radiiWorldUnits[i],
   a.candidate.radiiWorldUnits[i+1],
   b.candidate.radiiWorldUnits[i],
   b.candidate.radiiWorldUnits[i+1])*PX_PER_WORLD+
   additionalPaddingPixels;
  const loX=Math.min(...vertices.map(p=>p.x))-pad,
   hiX=Math.max(...vertices.map(p=>p.x))+pad,
   loY=Math.min(...vertices.map(p=>p.y))-pad,
   hiY=Math.max(...vertices.map(p=>p.y))+pad;
  if(loX<0||hiX>1000||loY<0||hiY>400){
   sweepClear=false;reason??='swept_growth_outside_glass';
  }
  const rock=rocks.find(r=>loX<=r.x+r.width&&
   hiX>=r.x&&loY<=r.y+r.depth&&hiY>=r.y);
  if(rock){sweepClear=false;hitObject=rock.id;
   reason??='swept_growth_link_bounds_hit_rock';}
 }
 return F({version:SNAKE_GROWTH_ENVELOPE_V09N_VERSION,
  fromProgress,toProgress,from:a,to:b,
  conservativeSwept2DAabbClear:sweepClear,
  reason,hitObject,
  growthStepLimited:true,noInstantLengthJump:true,
  immutableCanonicalSource:true,
  actualGrowthApplied:false,
  originalMovementPausedForRevalidation:true,
  conservative2DAabbMayRejectLegalGrowth:true,
  true3DSweepCertified:false,
  fullBodyReturnVerified:false,
  skinApplied:false,saveModified:false});
}
/**
 * NOT a universal rule for enclosure sizing. Simple synthetic chamber
 * geometry only, requiring both an aperture and space for the full animal.
 */
export function inspectSnakeSyntheticHideFitV09n({
 growthCandidate,openingWidthPixels,chamberLengthPixels,
 safetyPaddingPixels=2
}={}){
 if(growthCandidate?.version!==SNAKE_GROWTH_ENVELOPE_V09N_VERSION||
  !finite(openingWidthPixels)||openingWidthPixels<=0||
  !finite(chamberLengthPixels)||chamberLengthPixels<=0||
  !finite(safetyPaddingPixels)||safetyPaddingPixels<0||
  safetyPaddingPixels>12)
  throw new RangeError('v09n_invalid_synthetic_hide');
 const bodyDiameter=2*(growthCandidate.maxRadiusWorldUnits*
  PX_PER_WORLD+safetyPaddingPixels);
 const lengthNeeded=growthCandidate.lengthWorldUnits*
  PX_PER_WORLD+2*safetyPaddingPixels;
 return F({version:SNAKE_GROWTH_ENVELOPE_V09N_VERSION,
  fitsSyntheticAperture:openingWidthPixels>=bodyDiameter,
  fitsSyntheticChamberLength:chamberLengthPixels>=lengthNeeded,
  eligible2DProxy:openingWidthPixels>=bodyDiameter&&
   chamberLengthPixels>=lengthNeeded,
  requiredApertureWidthPx:bodyDiameter,
  requiredChamberLengthPx:lengthNeeded,
  animalWelfareCertified:false,
  actualHideInSceneVerified:false,
  skinApplied:false,saveModified:false});
}
