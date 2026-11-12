import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 makeSnakeHeadAttachment,poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {buildTransparentHeadNeckBridgeV07r}
 from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 buildSnakeGhostContinuityV07v,
 SNAKE_GHOST_CONTINUITY_VERSION
} from '../src/ohm-core/snake-ghost-continuity-v07v.mjs';

const ds=.19,pts=[];
for(let i=0;i<=6;i++)pts.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const a=deg*Math.PI/180,p=pts.at(-1);
 pts.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,
  y:p.y+Math.sin(a)*ds,z:.135
 }));
}
const pose13=Object.freeze({
 segmentLength:ds,bodyRadius:.13,
 points:Object.freeze(pts)
});
function makeDemo(pose,speciesId='generic_snake'){
 const attachment=makeSnakeHeadAttachment({
  speciesId,length:pose.segmentLength*(pose.points.length-1)
 });
 const head=poseSnakeHeadAttachment(attachment,pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 return {pose,attachment,head,volume,bridge};
}
const source=makeDemo(pose13);
const before=JSON.stringify(source);
const v=buildSnakeGhostContinuityV07v(source);
assert.equal(v.version,SNAKE_GHOST_CONTINUITY_VERSION);
assert.equal(v.camera,'V0.7G_front_glass');
assert.equal(v.sourceJointCount,13);
assert.equal(v.originalBodyRingCount,49);
assert.equal(v.headRingCount,8);
assert.equal(v.collarRingCount,11);
assert.equal(v.sourceBoneCount,12);
assert.equal(v.headColliderMeshIdentical,true);
assert.equal(v.unscaledCanonicalHead,true);
assert.equal(v.headDisplayScale,1);
assert.equal(v.v07rFormerHeadDisplayScale,1);
assert.ok(v.headToBodySocketRadiusRatio>.8&&
 v.headToBodySocketRadiusRatio<1.2);
assert.ok(v.maxWorldShellShift>.001&&v.maxWorldShellShift<=.018+1e-9,
 'noticeably smooth bends within explicit 3D world displacement cap');
assert.ok(Object.isFrozen(v)&&
 Object.isFrozen(v.bodyWorldRings)&&Object.isFrozen(v.headWorldRings[0]));
assert.equal(v.originalHeadColliderUnchanged,true);
assert.equal(v.originalBodyShellUnchanged,true);
assert.equal(v.sourceBoneEndpointsPreserved,true);
assert.equal(v.sourceRockCollisionAuthorityUnchanged,true);
assert.equal(v.bodySurfaceCollisionVerified,false);
assert.equal(v.fullHeadCollisionContinuousVerified,false);
assert.equal(v.realContactPhysicsVerified,false);
assert.equal(v.skinApplied,false);
assert.equal(v.playableCaveAuthorized,false);
assert.equal(v.affectsEcology,false);
assert.equal(v.affectsSave,false);
assert.equal(v.bodyProjection.outline.length,98);
assert.equal(v.headProjection.outline.length,16);
assert.equal(v.collarProjection.outline.length,22);
assert.equal(v.headProjection.projectedRings.length,8);
assert.ok(v.bodyProjection.minimumWidth>1);
assert.ok(v.headProjection.minimumWidth>.05);
assert.ok(v.collarProjection.minimumWidth>.05);
assert.equal(JSON.stringify(source),before,
 'a new silhouette must NEVER mutate canonical collision or bone state');
assert.deepEqual(v,buildSnakeGhostContinuityV07v(source),
 '3D display ring relaxation should be deterministic');

for(let i=0;i<source.head.meshPositions.length;i++){
 const expected=source.head.meshPositions[i];
 const actual=v.headWorldRings[Math.floor(i/16)][i%16];
 assert.deepEqual(actual,expected,
  'visible head ring MUST be identical to canonical head collision mesh');
 const observed=v.headProjection.projectedRings[Math.floor(i/16)][i%16];
 assert.deepEqual(observed,projectSnakeFrontGlassPointV07g(expected),
  'head shape must use true original camera and full head collider XYZ');
}
for(let i=0;i<v.bodyWorldRings.length;i++){
 for(let j=0;j<v.bodyWorldRings[i].length;j++){
  const a=v.bodyWorldRings[i][j],b=source.volume.worldRings[i][j];
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<=.018+1e-8);
  assert.deepEqual(v.bodyProjection.projectedRings[i][j],
   projectSnakeFrontGlassPointV07g(a));
 }
}
for(let j=0;j<12;j++){
 assert.deepEqual(v.bodyWorldRings[0][j],source.volume.worldRings[0][j]);
 assert.deepEqual(v.bodyWorldRings[4][j],source.volume.worldRings[4][j],
  'source first bone endpoint must be an exact silhouette anchor');
 assert.deepEqual(v.bodyWorldRings.at(-1)[j],
  source.volume.worldRings.at(-1)[j]);
}
for(let j=0;j<16;j++){
 assert.deepEqual(v.collarWorldRings[0][j],
  source.head.meshPositions[j],
  '3D collar starts at REAL head source rear vertex');
 assert.ok(v.collarWorldRings.at(-1).some(p=>
  source.bridge.sourceBodyJoinRing.some(q=>
   Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<1e-8)),
  '3D collar is joined to the original first body bone');
}
const straight=Object.freeze({
 bodyRadius:.13,segmentLength:2.28/23,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:1.15-i*(2.28/23),y:0,z:.135
 })))
});
const valid24=makeDemo(straight);
const volume24=buildSnakeGhostContinuityV07v(valid24);
assert.equal(volume24.sourceJointCount,24);
assert.equal(volume24.originalBodyRingCount,93);
assert.equal(volume24.headColliderMeshIdentical,true);
assert.equal(volume24.originalHeadColliderUnchanged,true);
assert.equal(volume24.v07rFormerHeadDisplayScale,1);
const thin=Object.freeze({
 bodyRadius:.08,segmentLength:.2,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:-2.3+i*.2,y:.4,z:.085
 })))
});
const oldHognose=makeDemo(thin,'hognose_snake');
assert.ok(oldHognose.bridge.headDisplayScale<.7);
assert.throws(()=>buildSnakeGhostContinuityV07v(oldHognose),
 /v07v_head_collider_and_body_neck_ratio_incompatible/,
 'refuse mismatch rather than silently shrinking the head in art');
for(const options of [
 {maxWorldShift:0},{maxWorldShift:.03},
 {compatibilityRatio:.5},{compatibilityRatio:2},
 {collarSections:1},{collarSections:17}
])assert.throws(()=>buildSnakeGhostContinuityV07v({
 ...source,...options
}),RangeError);
assert.throws(()=>buildSnakeGhostContinuityV07v({
 ...source,pose:{...pose13,points:pts.map((p,i)=>
  i===1?{...p,x:p.x+.04}:p)}
}),RangeError);
assert.throws(()=>buildSnakeGhostContinuityV07v({
 ...source,head:{...source.head,meshPositions:
  source.head.meshPositions.map((p,i)=>i===0?{...p,x:p.x+.01}:p)}
}),RangeError);
assert.throws(()=>buildSnakeGhostContinuityV07v({
 ...source,bridge:{...source.bridge,sourceHeadWorldRings:
  source.bridge.sourceHeadWorldRings.map((r,i)=>i===0?[
   {...r[0],x:r[0].x+.01},...r.slice(1)
  ]:r)}
}),RangeError,'reject any visual geometry that silently diverges from the source head collider');
const code=readFileSync(new URL(
 '../src/ohm-core/snake-ghost-continuity-v07v.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildSnakeGhostContinuityV07v/);
assert.match(html,/qaV07vHeadColliderIdentity/);
assert.doesNotMatch(code,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7V: 13/24 fixed-length ghost body, true source collider head EXACTLY visible, 11 3D collar rings, bounded corner softening; oversized head ratio is refused, no new skin or collision authority.');
