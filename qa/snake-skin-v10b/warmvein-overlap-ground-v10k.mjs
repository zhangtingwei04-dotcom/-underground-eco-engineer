/**
 * PRIVATE OHM V1.0K: conservative visual diagnostics for 101 rings.
 *
 * READ ONLY: no new coiling animation, lift, collisions, terrain solver,
 * texture, authoritative motion, or saves. Accept only V0.9U-sized
 * full head/body mesh; original V0.9S is still the surface-contact gate.
 *
 * 'Projected overlap' is merely a 2D screen-space *candidate*, never
 * evidence of actual biological stacking, body contact or penetration.
 * Only flat z = groundZ is checked here. For terrain use V0.9S.
 */
export const WARMVEIN_OVERLAP_GROUND_V10K='1.0K';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const distance3=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const xyDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const EPS=1e-5;

function validate(candidate,groundZ,ringSeparation,nearGroundTolerance){
 const m=candidate?.mesh;
 if(candidate?.version!=='0.9U'||candidate?.ok!==true||
  m?.vertexCount!==1617||m?.triangleCount!==3216||
  m?.positions?.length!==1617||m?.triangles?.length!==9648||
  m?.radialSegments!==16||m?.headExtraRingCount!==8||
  m?.neckSocketRingStartIndex!==128||
  m?.headBodySeamSharedVertices!==true||
  candidate?.headNeckSocketWelded!==true||
  !finite(groundZ)||!finite(nearGroundTolerance)||
  nearGroundTolerance<.001||nearGroundTolerance>.035||
  !Number.isInteger(ringSeparation)||
  ringSeparation<16||ringSeparation>32)
  throw new RangeError('v10k_requires_welded_source_mesh_and_flat_ground');
 for(const p of m.positions)
  if(!p||![p.x,p.y,p.z].every(finite))
   throw new RangeError('v10k_invalid_vertex');
}

const project=p=>({x:p.x,y:p.y+.56*p.z});
const select=(a,b,i,j)=>F({
 ringA:i,ringB:j,
 verticalCenterSeparationWorld:Math.abs(a.center.z-b.center.z),
 screenCenterDistanceWorld:xyDistance(a.projection,b.projection),
 originalXYCenterDistanceWorld:xyDistance(a.center,b.center),
 sourceRadiusSumWorld:a.radius+b.radius,
 upperRing:a.center.z>=b.center.z?i:j,
 lowerRing:a.center.z>=b.center.z?j:i
});

/**
 * Source motion evidence is reported ONLY if a separate V0.9U
 * step check succeeded for this exact end frame. No supplied evidence
 * is proof of real 3D motion; V0.9S is a sampled surface checker.
 */
export function inspectWarmveinOverlapGroundV10k({
 candidate,sourceV09uStep=null,groundZ=0,
 ringSeparation=16,nearGroundTolerance=.010
}={}){
 validate(candidate,groundZ,ringSeparation,nearGroundTolerance);
 const originalMesh=candidate.mesh;
 const rings=[];
 let minimumFlatGap=Infinity,maximumFlatGap=-Infinity;
 let closeToGroundCount=0,clearanceWarningCount=0;
 for(let i=0;i<101;i++){
  let x=0,y=0,z=0;
  for(let j=0;j<16;j++){
   const p=originalMesh.positions[i*16+j];
   x+=p.x/16;y+=p.y/16;z+=p.z/16;
  }
  const center=F({x,y,z});
  let radius=0,minGap=Infinity,maxGap=-Infinity;
  for(let j=0;j<16;j++){
   const p=originalMesh.positions[i*16+j];
   radius=Math.max(radius,distance3(p,center));
   const gap=p.z-groundZ;
   minGap=Math.min(minGap,gap);
   maxGap=Math.max(maxGap,gap);
  }
  if(!finite(radius)||radius<=1e-7)
   throw new RangeError('v10k_degenerate_ring_radius');
  minimumFlatGap=Math.min(minimumFlatGap,minGap);
  maximumFlatGap=Math.max(maximumFlatGap,maxGap);
  const near=minGap>=-EPS&&minGap<=nearGroundTolerance;
  const possibleLift=minGap>nearGroundTolerance*2;
  if(near)closeToGroundCount++;
  if(possibleLift)clearanceWarningCount++;
  rings.push(F({
   ring:i,center,radius,projection:F(project(center)),
   minimumFlatGroundGapWorld:minGap,
   maximumFlatGroundGapWorld:maxGap,
   nearFlatGroundCandidate:near,
   raisedAboveFlatGroundCandidate:possibleLift,
   penetratingKnownFlatGround:minGap< -EPS
  }));
 }
 const projectedPairSamples=[],verticalPairSamples=[];
 let nonlocalPairsChecked=0,projectedProximityPairs=0,
  possibleVerticalOverUnderPairs=0,unresolvedNearBodyPairs=0;
 let minimumNonlocal3DSphereGap=Infinity;
 for(let i=0;i<101;i++)for(let j=i+ringSeparation;j<101;j++){
  const a=rings[i],b=rings[j];
  nonlocalPairsChecked++;
  const screenGap=xyDistance(a.projection,b.projection)-
   a.radius-b.radius;
  const originalPlanarGap=xyDistance(a.center,b.center)-
   a.radius-b.radius;
  const separation=distance3(a.center,b.center)-a.radius-b.radius;
  minimumNonlocal3DSphereGap=Math.min(
   minimumNonlocal3DSphereGap,separation);
  if(screenGap<=.003){
   projectedProximityPairs++;
   if(projectedPairSamples.length<12)
    projectedPairSamples.push(select(a,b,i,j));
  }
  if(originalPlanarGap<=.003){
   const verticalGap=Math.abs(a.center.z-b.center.z)-
    a.radius-b.radius;
   if(verticalGap>.003){
    possibleVerticalOverUnderPairs++;
    if(verticalPairSamples.length<12)
     verticalPairSamples.push(select(a,b,i,j));
   }else unresolvedNearBodyPairs++;
  }
 }
 const evidenceFrameMatched=sourceV09uStep!==null&&
  sourceV09uStep.version==='0.9U'&&
  sourceV09uStep.ok===true&&
  sourceV09uStep.sourceReplayMatched===true&&
  sourceV09uStep.trueSizedSourceEndFrame===candidate.sourceFrame&&
  sourceV09uStep.sourceStageProgress===candidate.stageProgress&&
  sourceV09uStep.temporal?.firstNonlocalTriangleCollision==null&&
  sourceV09uStep.temporal?.firstUncertainContact==null&&
  finite(sourceV09uStep.temporal?.minimumSampledSurfaceGroundGapWorld)&&
  sourceV09uStep.temporal.minimumSampledSurfaceGroundGapWorld>=-EPS;
 const originalMinSampledGap=sourceV09uStep===null?null:
  sourceV09uStep.temporal?.minimumSampledSurfaceGroundGapWorld??null;
 const groundPenetration=minimumFlatGap< -EPS;
 return F({
  version:'1.0K',ok:!groundPenetration,
  reason:groundPenetration?'original_mesh_below_known_flat_ground':null,
  ringCount:101,triangleCount:3216,vertexCount:1617,
  flatGroundZ:groundZ,ringSeparation,
  nearGroundTolerance,
  minimumFlatGroundGapWorld:minimumFlatGap,
  maximumFlatGroundGapWorld:maximumFlatGap,
  nearFlatGroundRingCount:closeToGroundCount,
  raisedAboveFlatGroundRingCount:clearanceWarningCount,
  nonlocalPairsChecked,
  projectedProximityPairs,
  possibleVerticalOverUnderPairs,
  unresolvedNearBodyPairs,
  minimumNonlocal3DSphereGapWorld:minimumNonlocal3DSphereGap,
  projectedPairSamples:F(projectedPairSamples),
  potentialVerticalOverUnderSamples:F(verticalPairSamples),
  rings:F(rings),
  upstreamV09uSourceEvidenceMatched:evidenceFrameMatched,
  upstreamV09sSampledGroundGapWorld:originalMinSampledGap,
  sourceMotionAuthenticatedByThisModule:false,
  projectionIsNotPhysicalPenetrationOrOcclusionProof:true,
  originalSourceAndColliderUntouched:true,
  onlyKnownFlatGroundChecked:true,
  sampledV09sNotExactContinuousContact:true,
  coilingOrStackingAnimationImplemented:false,
  originalSkinAndEyesUntouched:true,
  blinkEnabled:false,gameSaveWritten:false
 });
}
