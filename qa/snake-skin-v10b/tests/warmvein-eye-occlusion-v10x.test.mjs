import assert from 'node:assert/strict';
import {selectWarmveinVisibleEyesV10x}
 from '../warmvein-eye-occlusion-v10x.mjs';
const positions=Array.from({length:1617},(_,i)=>Object.freeze({
 x:i===1616?1:0,y:0,z:0
}));
const mesh=Object.freeze({
 vertexCount:1617,noseVertexIndex:1616,
 positions:Object.freeze(positions)
});
const near=Object.freeze({side:'right',surfaceVertexIndex:70,
 position:Object.freeze({x:0,y:-.5,z:.5}),
 pointSizePx:12,approximateCameraFacing:.94});
const far=Object.freeze({side:'left',surfaceVertexIndex:66,
 position:Object.freeze({x:0,y:.5,z:.5}),
 pointSizePx:12,approximateCameraFacing:.18});
const eyes=Object.freeze([far,near]);
const before=JSON.stringify({mesh,eyes});
const side=selectWarmveinVisibleEyesV10x({mesh,eyes});
assert.equal(side.version,'1.0X');
assert.equal(side.profileView,true);
assert.equal(side.visibleEyeCount,1);
assert.equal(side.hiddenEyeCount,1);
assert.equal(side.visibleEyes[0],near);
assert.equal(side.hiddenEyes[0],far);
assert.deepEqual(side.visibleAnchorIds,[70]);
assert.deepEqual(side.hiddenAnchorIds,[66]);
assert.equal(side.eyeAnchorsRemainTwo,true);
assert.equal(side.originalHeadVerticesAndColliderUntouched,true);
assert.equal(side.playerSaveModified,false);
assert.equal(side.noBlink,true);
assert.ok(Math.abs(Math.hypot(
 side.cameraDepthAxis.x,side.cameraDepthAxis.y,
 side.cameraDepthAxis.z)-1)<1e-12);
const reverse=selectWarmveinVisibleEyesV10x({
 mesh,eyes:Object.freeze([
  Object.freeze({...far,approximateCameraFacing:.96}),
  Object.freeze({...near,approximateCameraFacing:.21})
 ])
});
assert.equal(reverse.visibleEyes[0].side,'left',
 'Eye visibility follows camera, not a permanently selected side.');
// A genuine head-on gaze can show both anatomically separate eyes.
const facingPositions=positions.slice();
facingPositions[1616]=Object.freeze({x:0,y:-.56,z:1});
const frontal=selectWarmveinVisibleEyesV10x({
 mesh:Object.freeze({...mesh,positions:Object.freeze(facingPositions)}),eyes
});
assert.equal(frontal.profileView,false);
assert.equal(frontal.visibleEyeCount,2);
assert.equal(frontal.hiddenEyeCount,0);
assert.throws(()=>selectWarmveinVisibleEyesV10x({mesh,eyes:[near,near]}),RangeError);
assert.throws(()=>selectWarmveinVisibleEyesV10x({
 mesh:{...mesh,vertexCount:100},eyes
}),RangeError);
assert.equal(JSON.stringify({mesh,eyes}),before);
console.log('PASS V1.0X: side profile one near eye, opposite eye fully hidden; frontal both optional; original eye anchors, mesh and saves preserved');
