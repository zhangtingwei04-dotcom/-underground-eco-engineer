import assert from 'node:assert/strict';
import {buildWarmveinStaticHeadV11f,GAPE_POSES_V11F}
 from '../static-head/warmvein-static-anatomy-v11f.mjs';
import {buildWarmveinStaticCoilV11f}
 from '../static-head/warmvein-static-coil-v11f.mjs';
assert.deepEqual(GAPE_POSES_V11F.map(p=>p.id),
 ['closed','slight','medium','wide']);
let lastGap=-Infinity;
for(const pose of GAPE_POSES_V11F){
 const h=buildWarmveinStaticHeadV11f({pose:pose.id});
 assert.equal(h.version,'1.1F');
 assert.equal(h.pose,pose.id);
 assert.equal(h.gapeDegrees,pose.degrees);
 assert.ok(h.triangleCount>8000);
 assert.equal(h.vertices.length,h.colors.length);
 assert.equal(h.vertices.length,h.normals.length);
 for(const part of ['cranial_vault','throat_chin','upper_palate',
  'recessed_oral_basin','left_mandible','right_mandible','upper_lip',
  'neck_volume','eye_iris','nostril'])
  assert.ok(h.materialTriangleCounts[part]>10,'missing '+part);
 assert.equal(h.upperCranialVaultReallyCurved,true);
 assert.equal(h.mouthFloorInsideLips,true);
 assert.equal(h.mouthMembraneConfinedToPosteriorCorners,true);
 assert.equal(h.downloaded3DReferenceUsed,false);
 assert.equal(h.noChangesToProduction24BonesOrSaves,true);
 assert.equal(h.passedArtistReview,false);
 const t=h.geometryAudit;
 assert.ok(t.snoutLengthShorteningPercent>25&&t.snoutLengthShorteningPercent<30,
  'new snout must be materially shorter from the same eye landmark');
 assert.ok(t.newEyeToTipOverHeadWidth<1.05,
  'eye-to-tip should not dominate the head width');
 assert.equal(t.originalEyeLandmarkUnmoved,true);
 assert.equal(t.posteriorJawPivotUnmoved,true);
 assert.equal(t.displacedNostrilBySameProportion,true);
 assert.ok(t.nostrilX<t.frontTipX);
 assert.ok(t.roundedCapLengthWorld>0);
 assert.equal(h.rounded3DSnoutCap,true);
 assert.equal(h.reducedAnteriorSnout,true);
 assert.equal(h.volumetricMandibleTube,true);
 assert.equal(h.continuousAnteriorChinBridge,true);
 assert.equal(h.insetOralBasin,true);
 assert.equal(h.noFlatMandibleBoards,true);
 assert.equal(h.curvedVentralChinSkin,true);
 assert.equal(h.noExposedBoneProngs,true);
 assert.equal(h.curvedCheekThroatTransition,true);
 assert.equal(h.matchedNeckBodyRing44,true);
 assert.equal(h.smoothSharedNeckCrownNormals,true);
 assert.equal(h.physicallyCorrectedDorsalNormalDirection,true);
 assert.equal(h.neckBodyRoot.length,44);
 assert.equal(h.neckToHead.length,44);
 assert.ok(h.materialTriangleCounts.cheek_throat_flex_transition>500);
 assert.ok(h.materialTriangleCounts.curved_ventral_chin_skin>1200);

 assert.ok(h.materialTriangleCounts.left_mandible>2000);
 assert.ok(h.materialTriangleCounts.right_mandible>2000);
 assert.ok(h.materialTriangleCounts.anterior_chin_bridge>100);
 assert.ok(h.materialTriangleCounts.rounded_upper_nose_cap>50);

 assert.equal(h.frameReferencesValidated,true);
 assert.equal(h.trueLeftRightJawBranches,true);
 assert.equal(h.nonRigidMandibleDisplayBend,true);
 assert.equal(h.exactBiomechanicalJawModel,false);
 assert.ok(h.mouthGapAtMuzzleWorld>lastGap+.001);
 lastGap=h.mouthGapAtMuzzleWorld;
 const body=buildWarmveinStaticCoilV11f({mouth:pose.id});
 assert.equal(body.version,'1.1F-static-rest');
 assert.equal(body.headTriangleCount,h.triangleCount);
 assert.equal(body.bodyRingCount,121);
 assert.equal(body.bodyRadialSegments,44);
 assert.equal(body.oneContiguousCenterline,true);
 assert.equal(body.planarClearanceAudit.overlapPairs,0);
 assert.ok(body.planarClearanceAudit.minimumProjectedGap>0);
 assert.ok(body.tailLastRadius<body.bodyMidRadius*.1);
 assert.ok(body.triangleCount>h.triangleCount+4000);
 assert.equal(body.vertexCount,body.triangleCount*3);
 assert.ok(body.materialTriangleCounts.body_belly>300);
 assert.ok(body.materialTriangleCounts.body_dorsal>300);
 assert.ok([...body.vertices].every(Number.isFinite));
 assert.ok([...body.normals].every(Number.isFinite));
 assert.equal(body.staticOnly,true);
 assert.equal(body.noOriginal24BoneControllerUsed,true);
 assert.equal(body.originalGameSaveUntouched,true);
 assert.equal(body.artistApproved,false);
 assert.equal(body.matchedNeckBodyRoot,true);
 assert.ok(body.maximumNeckBodySeamDistanceWorld<1e-8);
 assert.equal(body.improvedJoinedNormalsAtRoot,true);
 assert.equal(body.smoothShoulderRestLift,true);
 assert.equal(body.connectedBodyRootRing.length,44);
 for(let j=0;j<44;j++)for(let k=0;k<3;k++)
  assert.ok(Math.abs(body.connectedBodyRootRing[j][k]-h.neckBodyRoot[j][k])<1e-8);
 assert.equal(body.slightlyIrregularStaticRestShape,true);
 assert.equal(body.jawVideoReferenceUsed,true);
 assert.equal(body.snoutReducedRelativeToV11C,true);
}
assert.throws(()=>buildWarmveinStaticHeadV11f({pose:'moving'}),RangeError);
assert.throws(()=>buildWarmveinStaticCoilV11f({mouth:'none'}),RangeError);
console.log('PASS static V1.1F: true curved 3D head and independent jaw surface, four gape poses, 121-ring coiled body, no planar centerline overlap, tapered tail, original motion/saves untouched');
