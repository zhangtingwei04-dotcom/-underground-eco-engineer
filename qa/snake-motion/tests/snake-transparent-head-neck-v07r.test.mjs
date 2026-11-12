import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 makeSnakeHeadAttachment,poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 buildTransparentHeadNeckBridgeV07r,SNAKE_HEAD_NECK_BRIDGE_VERSION
} from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';

const s=.19,r=.13,z=.135,pts=[];
for(let i=0;i<=6;i++)pts.push(Object.freeze({
 x:.65,y:-1.32+i*s,z
}));
for(const degrees of [90,120,150,180,210,240]){
 const p=pts.at(-1),a=degrees*Math.PI/180;
 pts.push(Object.freeze({
  x:p.x+Math.cos(a)*s,y:p.y+Math.sin(a)*s,z
 }));
}
const nearGlass=Object.freeze({
 segmentLength:s,bodyRadius:r,points:Object.freeze(pts)
});
const straight=Object.freeze({
 segmentLength:.2,bodyRadius:.08,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:-2.3+i*.2,y:.4,z:.085
 })))
});
const immutableBefore=new Map();
for(const [pose,speciesId] of [
 [nearGlass,'generic_snake'],[straight,'hognose_snake']
]){
 const attachment=makeSnakeHeadAttachment({
  speciesId,length:pose.segmentLength*(pose.points.length-1)
 });
 const head=poseSnakeHeadAttachment(attachment,pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const original=JSON.stringify({pose,head,volume});
 immutableBefore.set(speciesId,original);
 const data=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 assert.equal(SNAKE_HEAD_NECK_BRIDGE_VERSION,'0.7R');
 assert.equal(data.version,'0.7R');
 assert.equal(data.camera,'V0.7G_front_glass');
 assert.equal(data.sourceHeadVersion,'0.1');
 assert.equal(data.sourceVolumeVersion,'0.7Q');
 assert.equal(data.sourceJointCount,pose.points.length);
 assert.equal(data.bodyJoinRingIndex,volume.sectionsPerBone);
 assert.equal(data.radialSegments,16);
 assert.equal(data.collarRingCount,9);
 assert.equal(data.headRingCount,attachment.ringCount);
 assert.equal(data.headDisplayOnlyRescale,true);
 assert.ok(data.headDisplayScale>.2&&data.headDisplayScale<=1);
 assert.equal(data.sourceBodyEndpointPreserved,true);
 assert.equal(data.bonesChanged,false);
 assert.equal(data.headMeshChanged,false);
 assert.equal(data.skinApplied,false);
 assert.equal(data.neckIKVerified,false);
 assert.equal(data.collisionMeshVerified,false);
 assert.equal(data.playableCaveAuthorized,false);
 assert.equal(data.affectsEcology,false);
 assert.equal(data.affectsSave,false);
 assert.ok(Object.isFrozen(data)&&Object.isFrozen(data.headWorldRings));
 assert.ok(Object.isFrozen(data.collarWorldRings[0]));
 assert.equal(data.headWorldRings[0].length,16);
 assert.equal(data.collarProjection.projectedRings.length,9);
 assert.equal(data.headProjection.projectedRings.length,attachment.ringCount);
 assert.equal(data.collarProjection.outline.length,18);
 assert.equal(data.headProjection.outline.length,attachment.ringCount*2);
 assert.ok(data.collarProjection.minimumThickness>.05);
 assert.ok(data.headProjection.minimumThickness>.05);
 for(let j=0;j<16;j++){
  assert.deepEqual(data.sourceHeadRearRing[j],head.meshPositions[j],
   'the first source head vertex is never modified');
  assert.deepEqual(data.collarWorldRings[0][j],
   data.displayHeadRearRing[j],
   'collar first ring has NO GAP from display head rear ring');
 }
 for(const ring of data.collarWorldRings)
  for(const p of ring)
   assert.ok([p.x,p.y,p.z].every(Number.isFinite));
 for(const ring of data.collarProjection.projectedRings)
  for(const point of ring)
   assert.ok(Number.isFinite(point.x)&&Number.isFinite(point.y));
 for(let i=0;i<data.collarWorldRings.length;i++)
  for(let j=0;j<16;j++)
   assert.deepEqual(data.collarProjection.projectedRings[i][j],
    projectSnakeFrontGlassPointV07g(data.collarWorldRings[i][j]),
    'all intermediate neck vertices must use original V0.7G camera');
 for(const p of data.collarWorldRings.at(-1))
  assert.ok(data.sourceBodyJoinRing.some(q=>
   Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)<1e-7),
   'the 3D collar end must coincide with V0.7Q source body join loop');
 assert.deepEqual(data,buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 }), 'same 3D head + body must give identical collar, no random artifacts');
 assert.equal(JSON.stringify({pose,head,volume}),original,
  'transparent preview may not touch head collider or fixed bones');
 if(speciesId==='hognose_snake')
  assert.ok(data.headDisplayScale<.7,
   'legacy large head must be normalized VISUALLY, not by editing collision mesh');
}
const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
 speciesId:'generic_snake',length:s*(pts.length-1)
}),nearGlass.points);
const volume=buildTransparentBodyVolumeV07q({pose:nearGlass});
const valid=()=>buildTransparentHeadNeckBridgeV07r({
 pose:nearGlass,head,volume
});
const real=valid();
assert.equal(real.sourceHeadRearRing[0],head.meshPositions[0]);
const oldHead=JSON.stringify(head);
assert.ok(real.headDisplayScale===1,
 'the well-proportioned fixture head must keep its original size');
assert.equal(JSON.stringify(head),oldHead);
assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
 pose:nearGlass,head:{...head,neck:{...head.neck,first:{x:0,y:0,z:0}}},
 volume
}),RangeError);
assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
 pose:nearGlass,head:{...head,origin:{x:0,y:0,z:0}},volume
}),RangeError);
assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
 pose:nearGlass,head,volume:{...volume,skinApplied:true}
}),RangeError);
assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
 pose:nearGlass,head,volume:{...volume,worldRings:[]}
}),RangeError);
assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
 pose:{...nearGlass,points:nearGlass.points.map((p,i)=>
  i===2?{...p,z:p.z+.01}:p)},head,volume
}),RangeError);
for(const sections of [0,3,13,NaN,4.5])
 assert.throws(()=>buildTransparentHeadNeckBridgeV07r({
  pose:nearGlass,head,volume,sections
 }),RangeError);
const source=readFileSync(new URL(
 '../src/ohm-core/snake-transparent-head-neck-v07r.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildTransparentHeadNeckBridgeV07r/);
assert.match(html,/qaV07rHeadNeck/);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7R: 3D 16-vertex head collar matches original 0.7Q join ring, both 13-/24-joint rigs, head-size debug-only normalization, transparent continuous front glass, source head collider/bones untouched.');
