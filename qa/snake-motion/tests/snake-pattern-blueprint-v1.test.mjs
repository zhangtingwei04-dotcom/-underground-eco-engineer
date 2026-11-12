import assert from 'node:assert/strict';
import {
 createSnakePatternBlueprintV1,restoreSnakePatternBlueprintV1,
 serializeSnakePatternBlueprintV1,sampleSnakePatternSurfaceV1,
 circularPatternSurfaceDistanceV1
} from '../src/ohm-core/snake-pattern-blueprint-v1.mjs';

const input={seed:38472915,speciesId:'corn_snake',
 styleId:'neutral_saddles',paletteId:'neutral_amber',markCount:22};
const originalInput=JSON.stringify(input);
const a=createSnakePatternBlueprintV1(input);
const first=JSON.stringify(a);
const again=createSnakePatternBlueprintV1({...input});
assert.equal(first,JSON.stringify(again),
 'same seed and version must recreate exactly the same pattern');
assert.equal(JSON.stringify(input),originalInput,'input must not mutate');
assert.equal(a.version,1);
assert.equal(a.seed,input.seed);
assert.equal(a.marks.length,22);
assert.ok(Object.isFrozen(a)&&Object.isFrozen(a.marks));
assert.ok(a.marks.every(Object.isFrozen));
assert.equal(a.integrityChecksum.length,8);
const stored=serializeSnakePatternBlueprintV1(a);
assert.equal(stored,first);
assert.deepEqual(restoreSnakePatternBlueprintV1(stored),a);
assert.equal(serializeSnakePatternBlueprintV1(
 restoreSnakePatternBlueprintV1(stored)),stored,
 'load-save round trip must be byte-identical');
assert.ok(a.marks.every((mark,i)=>{
 assert.equal(mark.id,'mark_'+String(i+1).padStart(3,'0'));
 assert.ok(mark.u>=.09&&mark.u<.91);
 assert.ok(mark.v>=0&&mark.v<1);
 return mark.lengthU>0&&mark.widthV>0;
}));
for(const [bodyLength,ringCount,radialSegments] of [
 [.72,13,12],[1.5,24,16],[2.28,128,24],[3.6,256,32]
]){
 const mesh=sampleSnakePatternSurfaceV1(a,{
  bodyLength,ringCount,radialSegments
 });
 assert.equal(mesh.anchors.length,a.marks.length);
 assert.equal(mesh.skinApplied,false);
 assert.equal(mesh.originalBonesChanged,false);
 assert.equal(mesh.geneticsSimulated,false);
 for(let i=0;i<a.marks.length;i++){
  assert.equal(mesh.anchors[i].id,a.marks[i].id);
  assert.equal(mesh.anchors[i].u,a.marks[i].u);
  assert.equal(mesh.anchors[i].v,a.marks[i].v);
  assert.equal(mesh.anchors[i].ringIndex,
   Math.round(a.marks[i].u*(ringCount-1)));
  assert.ok(Math.abs(mesh.anchors[i].bodyDistance-
   a.marks[i].u*bodyLength)<=.00000051);
 }
}
assert.equal(JSON.stringify(a),first,
 'rendering/growth sampling must NEVER rewrite the blueprint');
const b=createSnakePatternBlueprintV1({...input,seed:38472916});
assert.notEqual(JSON.stringify(a.marks),JSON.stringify(b.marks),
 'different seeds should lead to different marks');
assert.notEqual(a.patternId,b.patternId);
const c=createSnakePatternBlueprintV1({...input,speciesId:'western_hognose'});
assert.notEqual(a.patternId,c.patternId);
const z=createSnakePatternBlueprintV1({seed:0});
assert.equal(z.marks.length,16);
const high=createSnakePatternBlueprintV1({seed:0xffffffff});
assert.equal(high.seed,0xffffffff);
assert.equal(circularPatternSurfaceDistanceV1(.99,.01),.020000000000000018);
assert.equal(circularPatternSurfaceDistanceV1(.25,.75),.5);
for(const obj of [
 {...a,seed:a.seed+1},
 {...a,version:2},
 {...a,generator:'future-generator'},
 {...a,marks:[...a.marks.slice(0,2)]},
 {...a,marks:[{...a.marks[0],u:.5},...a.marks.slice(1)]},
 {...a,integrityChecksum:'00000000'},
 {...a,newExtra:'untrusted'}
]){
 assert.throws(()=>restoreSnakePatternBlueprintV1(JSON.stringify(obj)),
  RangeError,'tampered/unknown descriptor must fail closed');
}
for(const bad of [-1,2**32,1.5,NaN,Infinity,'999']){
 assert.throws(()=>createSnakePatternBlueprintV1({...input,seed:bad}),
  RangeError);
}
for(const bad of [0,2,41,2.5]){
 assert.throws(()=>createSnakePatternBlueprintV1({
  ...input,markCount:bad
 }),RangeError);
}
assert.throws(()=>createSnakePatternBlueprintV1({
 ...input,speciesId:'not_real'
}),RangeError);
assert.throws(()=>restoreSnakePatternBlueprintV1('{not-json'),RangeError);
assert.throws(()=>sampleSnakePatternSurfaceV1(a,{
 bodyLength:-1,ringCount:24,radialSegments:12
}),RangeError);
assert.throws(()=>sampleSnakePatternSurfaceV1(a,{
 bodyLength:2.28,ringCount:0,radialSegments:12
}),RangeError);
assert.throws(()=>circularPatternSurfaceDistanceV1(-.1,.5),RangeError);
console.log('PASS public pattern V1: deterministic and saved UV blueprint, 13/24+ joint/growth stability, closed version and mutation guards, NO skin');
