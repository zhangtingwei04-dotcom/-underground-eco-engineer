import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 buildTransparentBodyVolumeV07q,SNAKE_TRANSPARENT_VOLUME_VERSION
} from '../src/ohm-core/snake-transparent-volume-v07q.mjs';

const straight={
 bodyRadius:.08,segmentLength:.2,
 points:Array.from({length:24},(_,i)=>Object.freeze({
  x:-2.3+i*.2,y:.4,z:.085
 }))
};
const ds=.19,z=.135,r=.13,points=[];
for(let i=0;i<=6;i++)
 points.push(Object.freeze({x:.65,y:-1.32+i*ds,z}));
for(const degrees of [90,120,150,180,210,240]){
 const a=degrees*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z
 }));
}
const nearGlass=Object.freeze({
 bodyRadius:r,segmentLength:ds,points:Object.freeze(points)
});
const input=JSON.stringify(nearGlass);
assert.equal(SNAKE_TRANSPARENT_VOLUME_VERSION,'0.7Q');
for(const pose of [straight,nearGlass]){
 const s=buildTransparentBodyVolumeV07q({pose});
 const n=pose.points.length;
 assert.equal(s.version,'0.7Q');
 assert.equal(s.sourceJointCount,n);
 assert.equal(s.sourceBoneCount,n-1);
 assert.equal(s.ringCount,(n-1)*4+1,
  'four ring subdivisions are graphical sections, not new physics joints');
 assert.equal(s.radialSegments,12);
 assert.equal(s.outline.length,s.ringCount*2);
 assert.equal(s.worldRings.length,s.ringCount);
 assert.equal(s.projectedRings.length,s.ringCount);
 assert.equal(s.projectedCenters.length,s.ringCount);
 assert.equal(s.skinApplied,false);
 assert.equal(s.bonesChanged,false);
 assert.equal(s.physicalBodyCollisionVerified,false);
 assert.equal(s.substrateOcclusionVerified,false);
 assert.equal(s.glassContactPhysicsVerified,false);
 assert.equal(s.playableCaveAuthorized,false);
 assert.equal(s.affectsEcology,false);
 assert.equal(s.affectsSave,false);
 assert.ok(Object.isFrozen(s)&&Object.isFrozen(s.worldRings));
 assert.ok(Object.isFrozen(s.worldRings[0]));
 assert.ok(Object.isFrozen(s.worldRings[0][0]));
 assert.ok(s.minimumProjectedThickness>1,
  '3D ring shell must project as a visible thick body, not a zero-width line');
 for(let i=0;i<n;i++){
  const c=s.worldCenters[i*4];
  const p=pose.points[i];
  assert.ok(Math.hypot(c.x-p.x,c.y-p.y,c.z-p.z)<2e-6,
   'the original fixed joint is unchanged in the new visible centerline');
 }
 for(const ring of s.projectedRings){
  assert.equal(ring.length,12);
  for(const p of ring)assert.ok(
   Number.isFinite(p.x)&&Number.isFinite(p.y));
 }
 for(let i=0;i<s.ringCount;i++){
  const ring=s.worldRings[i];
  const proj=s.projectedRings[i];
  assert.ok(s.radii[i].sideRadius>0);
  assert.ok(s.radii[i].upRadius>0);
  for(let k=0;k<ring.length;k++)
   assert.deepEqual(proj[k],
    projectSnakeFrontGlassPointV07g(ring[k]),
    'V0.7Q MUST use the original front-glass camera');
  if(i>0){
   const a=s.worldCenters[i],b=s.worldCenters[i-1];
   assert.ok(Math.abs(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)-
      pose.segmentLength/4)<1e-5,
    'each new ring center is only an interpolation of a source 3D link');
  }
 }
 assert.ok(s.radii.at(-1).sideRadius<
  s.radii[Math.floor(s.ringCount*.5)].sideRadius*.2,
  'tail must taper rather than look like a full-radius cut-off tube');
 assert.ok(s.radii[0].sideRadius<
  s.radii[Math.floor(s.ringCount*.4)].sideRadius,
  'transparent neck should gradually transition to the body');
 assert.deepEqual(s,buildTransparentBodyVolumeV07q({pose}),
  'deterministic ring positions must not inject animated noise');
}
assert.equal(JSON.stringify(nearGlass),input,'never mutate original bones');
const lab=buildTransparentBodyVolumeV07q({pose:nearGlass});
assert.equal(lab.ringCount,49);
assert.equal(lab.outline.length,98);
const walk=buildTransparentBodyVolumeV07q({pose:straight});
assert.equal(walk.ringCount,93);
assert.equal(walk.outline.length,186);
const tiny=buildTransparentBodyVolumeV07q({
 pose:nearGlass,radialSegments:8,sectionsPerBone:2
});
assert.equal(tiny.worldRings[0].length,8);
assert.equal(tiny.ringCount,25);
const raised={
 ...nearGlass,points:nearGlass.points.map((p,i)=>i===0?{
  ...p,z:p.z+.03
 }:p)
};
assert.throws(()=>buildTransparentBodyVolumeV07q({pose:raised}),
 RangeError,'cannot change source 3D bone lengths to improve projected art');
const crossingGlass={
 ...nearGlass,points:nearGlass.points.map(p=>({...p,y:p.y-.40}))
};
assert.throws(()=>buildTransparentBodyVolumeV07q({pose:crossingGlass}),
 RangeError,'do not clip a 3D ghost shell outside actual glass projection bounds');
for(const opts of [
 {radialSegments:7},{radialSegments:11},{radialSegments:26},
 {sectionsPerBone:1},{sectionsPerBone:9},{widthScale:0},
 {heightScale:2},{widthScale:NaN}
])assert.throws(()=>buildTransparentBodyVolumeV07q({
 pose:nearGlass,...opts
}),RangeError);
const src=readFileSync(new URL(
 '../src/ohm-core/snake-transparent-volume-v07q.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildTransparentBodyVolumeV07q/);
assert.match(html,/qaV07qVolume/);
assert.match(html,/drawContinuousTransparentRig/);
assert.doesNotMatch(src,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7Q: 13-/24-joint fixed-length rigs produce 49-/93-ring transparent 3D sections through original front glass; safe elliptical volume, neck/trunk/tail taper, immutable replay, invalid glass/bone art rejected; no skin/collision/burrow fiction.');
