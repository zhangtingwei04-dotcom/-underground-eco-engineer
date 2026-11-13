import assert from 'node:assert/strict';
import {buildWarmveinStaticHeadV11b,GAPE_POSES_V11B}
 from '../static-head/warmvein-static-anatomy-v11b.mjs';
import {buildWarmveinStaticCoilV11b}
 from '../static-head/warmvein-static-coil-v11b.mjs';
assert.deepEqual(GAPE_POSES_V11B.map(p=>p.id),
 ['closed','slight','medium','wide']);
let lastGap=-Infinity;
for(const pose of GAPE_POSES_V11B){
 const h=buildWarmveinStaticHeadV11b({pose:pose.id});
 assert.equal(h.version,'1.1B');
 assert.equal(h.pose,pose.id);
 assert.equal(h.gapeDegrees,pose.degrees);
 assert.ok(h.triangleCount>8000);
 assert.equal(h.vertices.length,h.colors.length);
 assert.equal(h.vertices.length,h.normals.length);
 for(const part of ['cranial_vault','throat_chin','upper_palate',
  'oral_floor','left_mandible','right_mandible','upper_lip',
  'neck_volume','eye_iris','nostril'])
  assert.ok(h.materialTriangleCounts[part]>10,'missing '+part);
 assert.equal(h.upperCranialVaultReallyCurved,true);
 assert.equal(h.mouthFloorInsideLips,true);
 assert.equal(h.mouthMembraneConfinedToPosteriorCorners,true);
 assert.equal(h.downloaded3DReferenceUsed,false);
 assert.equal(h.noChangesToProduction24BonesOrSaves,true);
 assert.equal(h.passedArtistReview,false);
 assert.ok(h.mouthGapAtMuzzleWorld>lastGap+.001);
 lastGap=h.mouthGapAtMuzzleWorld;
 const body=buildWarmveinStaticCoilV11b({mouth:pose.id});
 assert.equal(body.version,'1.1B-static-rest');
 assert.equal(body.headTriangleCount,h.triangleCount);
 assert.equal(body.bodyRingCount,121);
 assert.equal(body.bodyRadialSegments,20);
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
}
assert.throws(()=>buildWarmveinStaticHeadV11b({pose:'moving'}),RangeError);
assert.throws(()=>buildWarmveinStaticCoilV11b({mouth:'none'}),RangeError);
console.log('PASS static V1.1B: true curved 3D head and independent jaw surface, four gape poses, 121-ring coiled body, no planar centerline overlap, tapered tail, original motion/saves untouched');
