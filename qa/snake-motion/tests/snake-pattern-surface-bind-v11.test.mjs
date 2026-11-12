import assert from 'node:assert/strict';
import {
 createSnakePatternBlueprintV1,serializeSnakePatternBlueprintV1
} from '../src/ohm-core/snake-pattern-blueprint-v1.mjs';
import {bindSnakePatternToSurfaceV11}
 from '../src/ohm-core/snake-pattern-surface-bind-v11.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentHeadNeckBridgeV07r}
 from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';
import {buildSnakeGhostContinuityV07v}
 from '../src/ohm-core/snake-ghost-continuity-v07v.mjs';
import {buildSnakeHeadNeckSculptV07w}
 from '../src/ohm-core/snake-head-neck-sculpt-v07w.mjs';
import {buildSnakeNeckFollowV07x}
 from '../src/ohm-core/snake-neck-follow-v07x.mjs';
import {buildSnakeSlenderVolumeV07y}
 from '../src/ohm-core/snake-slender-volume-v07y.mjs';

const pattern=createSnakePatternBlueprintV1({
 seed:38472915,speciesId:'corn_snake',
 paletteId:'neutral_amber',markCount:20
});
const originalPattern=serializeSnakePatternBlueprintV1(pattern);
const makeStraight=(count,length)=>Object.freeze({
 bodyRadius:.13,segmentLength:length/(count-1),
 points:Object.freeze(Array.from({length:count},(_,i)=>Object.freeze({
  x:1.15-i*length/(count-1),y:0,z:.135
 })))
});
const pose13=makeStraight(13,2.28),pose24=makeStraight(24,2.28);
const originalSource=JSON.stringify({pose13,pose24});
const vol13=buildTransparentBodyVolumeV07q({pose:pose13});
const vol24=buildTransparentBodyVolumeV07q({pose:pose24});
const bindings=[vol13,vol24].map(volume=>bindSnakePatternToSurfaceV11({
 blueprint:pattern,volume
}));
const [a,b]=bindings;
assert.equal(a.version,'1.1');
assert.equal(a.patternId,pattern.patternId);
assert.equal(a.marks.length,pattern.markCount);
assert.equal(a.sourceJointCount,13);
assert.equal(b.sourceJointCount,24);
assert.equal(a.ringCount,49);
assert.equal(b.ringCount,93);
assert.equal(a.geometryUsed,'v07q_unskinned_ghost');
assert.ok(a.allMarksOnExistingTriangles);
assert.equal(a.skinApplied,false);
assert.equal(a.pixelTextureApplied,false);
assert.equal(a.sourceBonesChanged,false);
assert.equal(a.sourceBodyMeshChanged,false);
assert.equal(a.storedBoneIndices,false);
assert.equal(a.affectsSave,false);
assert.equal(a.privateGameIntegrated,false);
for(let k=0;k<a.marks.length;k++){
 const p=a.marks[k],q=b.marks[k],desc=pattern.marks[k];
 assert.equal(p.id,q.id);
 assert.equal(p.u,q.u);
 assert.equal(p.v,q.v);
 assert.equal(p.u,desc.u);
 assert.equal(p.v,desc.v);
 assert.ok(Math.abs(p.xyz.x-q.xyz.x)<1e-5,
  'same physical length with 13/24 joints must keep longitudinal mark');
 assert.ok(Math.hypot(p.xyz.x-q.xyz.x,
  p.xyz.y-q.xyz.y,p.xyz.z-q.xyz.z)<.003,
  'same skeleton shape resampled into 13/24 joints should not wander');
 for(const [mark,mesh] of [[p,vol13],[q,vol24]]){
  assert.deepEqual(mark.screen,
   projectSnakeFrontGlassPointV07g(mark.xyz));
  const vertices=mesh.worldRings.flat();
  assert.equal(mark.surfaceTriangleIndices.length,3);
  assert.equal(mark.triangleWeights.length,3);
  const calculated={x:0,y:0,z:0};
  for(let j=0;j<3;j++){
   const v=vertices[mark.surfaceTriangleIndices[j]],
    w=mark.triangleWeights[j];
   assert.ok(w>=-1e-9&&w<=1+1e-9);
   calculated.x+=v.x*w;
   calculated.y+=v.y*w;
   calculated.z+=v.z*w;
  }
  assert.ok(Math.hypot(mark.xyz.x-calculated.x,
   mark.xyz.y-calculated.y,mark.xyz.z-calculated.z)<1e-8,
   'mark sample must lie on the exact existing mesh triangle');
 }
}
assert.equal(serializeSnakePatternBlueprintV1(pattern),originalPattern);
assert.equal(JSON.stringify({pose13,pose24}),originalSource);
const longer=makeStraight(24,2.508);
const growth=bindSnakePatternToSurfaceV11({
 blueprint:pattern,
 volume:buildTransparentBodyVolumeV07q({pose:longer}),
 bodyLength:2.508
});
for(let i=0;i<growth.marks.length;i++){
 const first=b.marks[i],second=growth.marks[i];
 assert.equal(first.id,second.id);
 assert.equal(first.u,second.u);
 assert.equal(first.v,second.v);
 assert.ok(Math.abs(second.bodyDistance-
  first.bodyDistance*1.1)<1e-6);
 assert.ok(Math.abs(second.xyz.x-
  (1.15-second.u*2.508))<.00002,
  'growth changes physical length, not normalized mark location');
}
const repeat=bindSnakePatternToSurfaceV11({
 blueprint:pattern,volume:vol24
});
assert.deepEqual(repeat,b);
assert.ok(Object.isFrozen(repeat)&&Object.isFrozen(repeat.marks));
assert.ok(Object.isFrozen(repeat.marks[0].xyz));
// A deliberately near-dorsal-seam mark has v>0.9. For a 12-radial
// ring, it must map around j=3 (up), NOT j=0 (side).
const seam=a.marks.find(m=>m.v>.9);
assert.ok(seam);
assert.ok(seam.azimuth>.15&&seam.azimuth<.25,
 'seam near v=1 should wrap near the DORSAL ring, not the lateral ring');
assert.ok(seam.xyz.z>.135,'dorsal surface mark is above body center');
// A genuine source-backed V0.7Y slim geometry must be sampled from
// its SAME collision/render vertices, not painted on the older broad ghost.
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'pattern_v11_slim_identity_qa',
 objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
 speciesId:'generic_snake',length:2.28
}),pose24.points);
const bridge=buildTransparentHeadNeckBridgeV07r({
 pose:pose24,head,volume:vol24
});
const ghost=buildSnakeGhostContinuityV07v({
 pose:pose24,head,volume:vol24,bridge
});
const sculpt=buildSnakeHeadNeckSculptV07w({
 pose:pose24,head,volume:vol24,ghost,scene,terrain
});
assert.equal(sculpt.ok,true,sculpt.reason);
const neckFollow=buildSnakeNeckFollowV07x({
 pose:pose24,head,volume:vol24,sculpt,scene,terrain
});
assert.equal(neckFollow.ok,true,neckFollow.reason);
const slender=buildSnakeSlenderVolumeV07y({
 pose:pose24,volume:vol24,neckFollow,scene,terrain
});
assert.equal(slender.ok,true,slender.reason);
const originalSlender=JSON.stringify(slender);
const slim=bindSnakePatternToSurfaceV11({
 blueprint:pattern,volume:vol24,slender
});
assert.equal(slim.geometryUsed,'v07y_slim_collision_sampled');
assert.equal(slim.skinApplied,false);
assert.equal(slim.sourceBonesChanged,false);
assert.equal(slim.marks.length,pattern.markCount);
const slimVertices=slender.bodyCandidate.vertices;
for(let i=0;i<slim.marks.length;i++){
 const mark=slim.marks[i];
 assert.equal(mark.id,b.marks[i].id);
 assert.equal(mark.u,b.marks[i].u);
 assert.equal(mark.v,b.marks[i].v);
 const v=mark.surfaceTriangleIndices,w=mark.triangleWeights;
 const xyz={x:0,y:0,z:0};
 for(let j=0;j<3;j++){
  xyz.x+=slimVertices[v[j]].x*w[j];
  xyz.y+=slimVertices[v[j]].y*w[j];
  xyz.z+=slimVertices[v[j]].z*w[j];
 }
 assert.ok(Math.hypot(mark.xyz.x-xyz.x,
  mark.xyz.y-xyz.y,mark.xyz.z-xyz.z)<1e-8,
  'slim mark MUST lie on the source-tested body candidate triangles');
}
assert.equal(JSON.stringify(slender),originalSlender);
for(const bad of [
 {volume:{...vol24,skinApplied:true}},
 {volume:{...vol24,bonesChanged:true}},
 {volume:{...vol24,worldRings:[]}},
 {volume:vol13,slender},
 {volume:vol24,slender:{...slender,ok:false}},
 {volume:vol24,slender:{...slender,sourceBonesModified:true}},
 {volume:vol24,slender:{...slender,bodyWorldRings:[[],...slender.bodyWorldRings.slice(1)]}},
 {volume:vol24,slender:{...slender,bodyCandidate:{
  ...slender.bodyCandidate,vertices:[{x:5,y:5,z:5},
   ...slender.bodyCandidate.vertices.slice(1)]}}},
 {volume:vol24,bodyLength:Infinity},
 {volume:vol24,blueprint:{...pattern,seed:35}}
])assert.throws(()=>bindSnakePatternToSurfaceV11({
 blueprint:pattern,volume:vol24,...bad
}),RangeError);
console.log('PASS V1.1 transparent 3D pattern anchor adapter: V0.7Q/Y exact face sampling, dorsal seam, 13-to-24 source resampling, growth-stable UV, strict no skin/save/collision changes');
