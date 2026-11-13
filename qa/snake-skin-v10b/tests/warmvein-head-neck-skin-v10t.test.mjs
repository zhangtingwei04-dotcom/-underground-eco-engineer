import assert from 'node:assert/strict';
import {createWarmveinPixelAtlasV10q}
 from '../warmvein-skin-v10q.mjs';
import {createWarmveinPixelAtlasV10t}
 from '../warmvein-head-neck-skin-v10t.mjs';

const q=createWarmveinPixelAtlasV10q({seed:18073});
const t=createWarmveinPixelAtlasV10t({seed:18073});
const again=createWarmveinPixelAtlasV10t({seed:18073});
const different=createWarmveinPixelAtlasV10t({seed:18074});
const qBefore=JSON.stringify(q.rgba);
assert.equal(t.privateSkinRevision,'1.0T');
assert.equal(t.sourceReferenceRevision,'1.0Q');
assert.equal(t.width,256);
assert.equal(t.height,128);
assert.equal(t.rgba.length,256*128*4);
assert.equal(t.nearSeamRowEqual,true);
assert.equal(t.filter,'NEAREST');
assert.equal(t.wrapV,'REPEAT');
assert.equal(t.pixelAnchoring,'mesh_uv_not_world_space');
assert.deepEqual(t.rgba,again.rgba);
assert.notDeepEqual(t.rgba,different.rgba);
assert.equal(Object.isFrozen(t.rgba),true);
assert.equal(t.noPaintedEyeOrBlink,true);
assert.equal(t.atlasNoNewTransverseNeckBand,true);
assert.equal(t.originalUVAndIndexedMeshUnchanged,true);
assert.equal(t.originalHeadAndCollisionUnchanged,true);
assert.equal(t.playerSaveModified,false);
assert.equal(t.gameAssetInstalled,false);
assert.equal(t.visualWebGLAndIPhoneApproved,false);
assert.deepEqual(t.editedLongitudinalColumns,{first:0,last:55});
assert.ok(t.headAreaPixelsChanged>1900);
assert.ok(t.neckAreaPixelsChanged>2500);
assert.ok(t.rootBranchPixelsTouched>20);
assert.ok(t.ventralPixelsChanged>500);
const colors=(a,b)=>Math.hypot(...a.slice(0,3).map((v,k)=>v-b[k]));
let changedOnHead=0;
for(let y=0;y<128;y++){
 for(let x=0;x<256;x++){
  const next=t.sampleRGBA(x,y),prev=q.sampleRGBA(x,y);
  assert.equal(next[3],255);
  if(x>=56)assert.deepEqual(next,prev,
   'texture beyond the 56-column head/neck region must remain pixel-identical');
  else if(next.some((v,k)=>v!==prev[k]))changedOnHead++;
 }
}
assert.ok(changedOnHead>5800);
const oldHead=q.sampleRGBA(17,32);
const newHead=t.sampleRGBA(17,32);
assert.ok(oldHead[0]>220&&oldHead[1]>140);
assert.ok(newHead[0]<145&&newHead[1]<120,
 'legacy neon-orange head is now a coherent dark brown bark/copper color');
let oldDoubleHighContrast=0,newDoubleHighContrast=0;
for(let sector=0;sector<16;sector++){
 const y=sector*8;
 const old=[17,20,23].map(x=>q.sampleRGBA(x,y));
 const current=[17,20,23].map(x=>t.sampleRGBA(x,y));
 if(colors(old[0],old[1])>90&&colors(old[1],old[2])>90)
  oldDoubleHighContrast++;
 if(colors(current[0],current[1])>90&&colors(current[1],current[2])>90)
  newDoubleHighContrast++;
}
assert.equal(oldDoubleHighContrast,4,
 'old original seed reproduces the locally detected UV color problem');
assert.equal(newDoubleHighContrast,0,
 'fixed material must eliminate the double head/socket/body color jump');
for(let x=0;x<256;x++)
 assert.deepEqual(t.sampleRGBA(x,0),t.sampleRGBA(x,127),
  'dorsal/flank UV wrap seam is still identical after head repair');
assert.equal(JSON.stringify(q.rgba),qBefore,
 'old V1.0Q must remain unchanged and independently selectable');
assert.throws(()=>t.sampleRGBA(-1,0),RangeError);
assert.throws(()=>t.sampleRGBA(256,0),RangeError);
assert.throws(()=>createWarmveinPixelAtlasV10t({seed:-1}),RangeError);
console.log('PASS private V1.0T: true 256x128 head palette repaired; 4/16 UV double jumps -> 0/16; no mesh, UV, collider, body texture beyond column 55, or player save modified');
