import assert from 'node:assert/strict';
import {buildWarmveinGapeMotionV11g,GAPE_TIMELINE_V11G,GAPE_PROFILES_V11G}
 from '../static-head/warmvein-gape-motion-v11g.mjs';

const poses=['closed','slight','medium','wide'];
const skullAverageZ=m=>{
 const n=m.materialTriangleCounts.cranial_vault*3;
 // Inspect the same FRONT-MOST 30% of ORIGINAL skull triangle
 // indices across every frame. Selecting by transformed x would
 // silently alter the tracked vertex set when the head pitches.
 let sum=0,count=0;
 for(let i=Math.floor(n*.7);i<n;i++){
  sum+=m.vertices[i*3+2];count++;
 }
 assert.ok(count>90);
 return sum/count;
};
const results={};
for(const profile of GAPE_PROFILES_V11G.map(x=>x.id)){
 for(const scene of ['head','coil']){
  let previousGape=-Infinity;
  for(const pose of poses){
   const a=buildWarmveinGapeMotionV11g({scene,pose,profile});
   assert.equal(a.version,'1.1G');
   assert.equal(a.scene,scene);
   assert.equal(a.profile,profile);
   assert.equal(a.renderOnlyPrototype,true);
   assert.equal(a.splitHeadAndJawControls,true);
   assert.equal(a.headLiftIsWholeSkullPitchNotCranialLid,true);
   assert.equal(a.c1ContinuousNeckHermiteTransition,true);
   assert.ok(a.measuredSkullNeckTangentError<.015);
   assert.equal(a.retainedBodyRoot,true);
   assert.equal(a.disconnectedSourceSkeletonUnchanged,true);
   assert.equal(a.originalPlayerSaveUnchanged,true);
   assert.equal(a.artistApproved,false);
   assert.ok(a.maximumFixedRootMovement<1e-7);
   assert.equal(a.vertexCount,a.triangleCount*3);
   assert.equal(a.vertices.length,a.normals.length);
   assert.equal(a.vertices.length,a.colors.length);
   assert.ok([...a.vertices].every(Number.isFinite));
   assert.ok([...a.normals].every(Number.isFinite));
   assert.ok(a.gapeDegrees>previousGape);
   previousGape=a.gapeDegrees;
   if(profile==='lower-only')assert.equal(a.headPitchDegrees,0);
   else if(pose==='wide')assert.ok(a.headPitchDegrees>=13);
   results[profile+'_'+scene+'_'+pose]={pitch:a.headPitchDegrees,gape:a.gapeDegrees};
  }
 }
}
const closed=buildWarmveinGapeMotionV11g({scene:'head',pose:'closed'});
const wide=buildWarmveinGapeMotionV11g({scene:'head',pose:'wide'});
const old=buildWarmveinGapeMotionV11g({scene:'head',pose:'wide',profile:'lower-only'});
const big=buildWarmveinGapeMotionV11g({scene:'head',pose:'wide',profile:'upper-dominant'});
assert.ok(skullAverageZ(wide)-skullAverageZ(closed)>.06,
 'video profile must visibly raise upper snout as a whole head');
assert.ok(Math.abs(skullAverageZ(old)-skullAverageZ(closed))<1e-6,
 'legacy profile must leave upper skull immobile');
assert.ok(skullAverageZ(big)>skullAverageZ(wide)+.02,
 'upper-dominant comparison must be visually distinct');
assert.equal(wide.lowerJawRelativeGapeDegrees,46);
assert.equal(wide.headPitchDegrees,14);
assert.equal(big.headPitchDegrees,23);
assert.equal(old.headPitchDegrees,0);
assert.equal(closed.headPitchDegrees,0);
assert.equal(closed.gapeDegrees,0);
for(const p of [0,.12,.28,.44,.65,.82,1]){
 const a=buildWarmveinGapeMotionV11g({scene:'head',phase:p});
 assert.equal(a.phase,p);
 assert.ok(Number.isFinite(a.gapeDegrees));
 assert.ok(a.gapeDegrees>=0&&a.gapeDegrees<=46);
 assert.ok(a.headPitchDegrees>=0&&a.headPitchDegrees<=14);
 assert.equal(a.maximumFixedRootMovement,0);
}
for(const p of [.05,.2,.29,.5,.7,.88,.99]){
 const a=buildWarmveinGapeMotionV11g({scene:'coil',phase:p});
 assert.equal(a.maximumFixedRootMovement,0);
 assert.ok(a.vertexCount>50000);
}
assert.deepEqual(GAPE_TIMELINE_V11G.map(x=>x.t),[0,.18,.28,.44,.7,.88,1]);
assert.throws(()=>buildWarmveinGapeMotionV11g({scene:'none'}),RangeError);
assert.throws(()=>buildWarmveinGapeMotionV11g({profile:'unknown'}),RangeError);
assert.throws(()=>buildWarmveinGapeMotionV11g({phase:-.1}),RangeError);
assert.throws(()=>buildWarmveinGapeMotionV11g({phase:1.1}),RangeError);
assert.throws(()=>buildWarmveinGapeMotionV11g({pose:'none'}),RangeError);
console.log('PASS V1.1G video-inspired two-control mouth: upper skull visibly rises, lower mandible still opens, fixed neck root intact, continuous pose samples reversible; not biomechanical certification');
