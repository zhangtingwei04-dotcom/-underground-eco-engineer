import assert from 'node:assert/strict';
import { makeUniversalSnakePose, inspectUniversalSnakePose, OHM_SNAKE_POSE_MODES } from '../src/ohm-core/snake-skeleton-motion.mjs';
assert.deepEqual(OHM_SNAKE_POSE_MODES,['ground','explore','supported']);
const snapshot=makeUniversalSnakePose({mode:'ground',time:1.4});
assert.deepEqual(snapshot,makeUniversalSnakePose({mode:'ground',time:1.4}), 'deterministic');
assert.ok(Object.isFrozen(snapshot.points));
assert.equal(snapshot.boneCount,24);
for(const mode of OHM_SNAKE_POSE_MODES){
  for(const count of [12,24,48]){
    for(const t of [0,.02,.2,1.1,4.5,10]){
      const p=makeUniversalSnakePose({mode,boneCount:count,time:t});
      const result=inspectUniversalSnakePose(p);
      assert.ok(result.ok,mode+'/'+count+'/'+t+': '+JSON.stringify(result));
      assert.ok(result.maxLengthError<1e-11, 'bone spacings remain fixed');
      assert.ok(result.maxBendAngleRadians<.75, 'no hard joint kink');
      assert.ok(p.points.every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
      assert.ok(p.points[0].x===0 && p.points[0].y===0);
      assert.equal(p.points.length,count);
      assert.equal(result.terrainCollisionChecked,false);
    }
  }
}
const g=makeUniversalSnakePose({mode:'ground'});
const e=makeUniversalSnakePose({mode:'explore'});
const s=makeUniversalSnakePose({mode:'supported'});
assert.ok(e.points[0].z>g.points[0].z+.1,'raised head');
assert.ok(e.points.at(-1).z===e.bodyRadius,'rear remains on floor');
assert.ok(s.points[Math.round((s.boneCount-1)*.52)].z>g.bodyRadius+.05,'midpoint raised');
assert.ok(s.support && !g.support && !e.support);
assert.ok(g.contactIndices.length>e.contactIndices.length);
const moving=makeUniversalSnakePose({mode:'ground',time:.8});
assert.notDeepEqual(moving.points,g.points,'animated lateral curve');
for(const invalid of [
  {mode:'flying'},{length:-1},{time:Infinity},{bodyRadius:1},
  {boneCount:5},{boneCount:100},{waveAmplitude:9},{cycles:0}
]) assert.throws(()=>makeUniversalSnakePose(invalid),RangeError);
assert.throws(()=>inspectUniversalSnakePose({}),RangeError);
console.log('PASS V0.5B universal snake: 54 pose combinations with fixed-length, bend, clearance and motion assertions');
