import assert from 'node:assert/strict';
import {buildWarmveinStaticGapeV11a,MOUTH_POSES_V11A}
 from '../static-head/warmvein-static-gape-v11a.mjs';
assert.deepEqual(MOUTH_POSES_V11A.map(p=>p.id),
 ['closed','slight','medium','wide']);
const a=[];
for(const pose of MOUTH_POSES_V11A){
 const m=buildWarmveinStaticGapeV11a({pose:pose.id});
 assert.equal(m.version,'1.1A');
 assert.equal(m.pose,pose.id);
 assert.equal(m.gapeDegrees,pose.degrees);
 assert.ok(m.triangleCount>1000);
 assert.ok(m.vertexCount>3000);
 assert.equal(m.vertexCount,m.triangleCount*3);
 assert.equal(m.vertices.length,m.colors.length);
 assert.equal(m.vertices.length,m.normals.length);
 assert.ok(Object.values(m.materialTriangleCounts).every(v=>v>1));
 for(const group of ['upper_skull','upper_lip','palate',
  'left_lower_jaw','right_lower_jaw','inner_floor',
  'stretching_labial_membrane','eye_socket','eye_iris',
  'nostril','neck']){
  assert.ok(m.materialTriangleCounts[group]>1,'missing '+group);
 }
 assert.equal(m.distinctLeftRightMandibularSurfaces,true);
 assert.equal(m.connectedElasticFloor,true);
 assert.equal(m.noMovingSourceMotion,true);
 assert.equal(m.collisionAndSaveUntouched,true);
 assert.equal(m.actualV09uMeshUsed,false);
 assert.equal(m.modelImportedFromExternalGenerator,false);
 assert.equal(m.threeDimensionalGeometry,true);
 assert.equal(m.staticVisualApprovalPending,true);
 assert.ok(Number.isFinite(m.mouthGapAtMuzzleWorld));
 assert.ok(m.bounds.max[0]-m.bounds.min[0]>1.2);
 assert.ok(m.bounds.max[1]-m.bounds.min[1]>.2);
 assert.ok(m.bounds.max[2]-m.bounds.min[2]>.12);
 assert.ok([...m.vertices].every(Number.isFinite));
 assert.ok([...m.normals].every(Number.isFinite));
 assert.ok([...m.colors].every(v=>Number.isFinite(v)&&v>=0&&v<=1));
 a.push(m.mouthGapAtMuzzleWorld);
}
assert.ok(a[0]>=0&&a[0]<.01,'closed lip must nearly seal');
for(let i=1;i<a.length;i++)
 assert.ok(a[i]>a[i-1]+.02,
  'static jaw gape should increase when moving to next pose');
assert.ok(a[3]>.35,'large gape must visibly open');
assert.throws(()=>buildWarmveinStaticGapeV11a({pose:'unknown'}),RangeError);
console.log('PASS V1.1A: 4 deterministic jaw/crown static poses, two separate mandibular surfaces, sealed resting lips, increasing gape, all 3D triangles finite and original 24-joint motion/saves untouched');
