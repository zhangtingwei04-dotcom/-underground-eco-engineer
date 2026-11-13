import assert from 'node:assert/strict';
import {inspectWarmveinGPUCaptureV10v} from '../warmvein-gpu-capture-v10v.mjs';

const width=128,height=80,leftW=width/2;
const paint=(arr,side,{changed=false}={})=>{
 for(let y=20;y<48;y++)
  for(let x=13;x<43;x++){
   const ix=side*leftW+x,k=4*(width*y+ix);
   arr[k]=changed&&x<23?110:80;
   arr[k+1]=changed&&x<23?145:92;
   arr[k+2]=changed&&x<23?68:84;
   arr[k+3]=255;
  }
};
const both=new Uint8Array(width*height*4);
paint(both,0);paint(both,1,{changed:true});
const snap=inspectWarmveinGPUCaptureV10v({
 rgba:both,width,height,split:true,qtCompare:true
});
assert.equal(snap.version,'1.0V');
assert.equal(snap.ok,true);
assert.equal(snap.reason,'ok');
assert.equal(snap.leftVisiblePixels,snap.rightVisiblePixels);
assert.ok(snap.visiblePixels>100);
assert.ok(snap.pairedOpaquePixels>100);
assert.ok(snap.pixelsWithQTColorDifference>100);
assert.equal(snap.pairedAlphaMismatchPixels,0);
assert.equal(snap.sourceMeshMutated,false);
assert.equal(snap.gameSaveWritten,false);
assert.equal(snap.qaAcceptanceNotCertified,true);
const identical=new Uint8Array(width*height*4);
paint(identical,0);paint(identical,1);
const same=inspectWarmveinGPUCaptureV10v({
 rgba:identical,width,height,split:true,qtCompare:true
});
assert.equal(same.ok,false);
assert.equal(same.reason,'qt_material_difference_not_visible');
const missing=new Uint8Array(width*height*4);
paint(missing,0);
const one=inspectWarmveinGPUCaptureV10v({
 rgba:missing,width,height,split:true,qtCompare:true
});
assert.equal(one.ok,false);
assert.equal(one.reason,'one_panel_missing_gpu_snake');
assert.equal(inspectWarmveinGPUCaptureV10v({
 rgba:new Uint8Array(width*height*4),width,height,split:true
}).reason,'empty_or_nearly_empty_gpu_frame');
assert.throws(()=>inspectWarmveinGPUCaptureV10v({
 rgba:new Uint8Array(10),width,height
}),RangeError);
assert.throws(()=>inspectWarmveinGPUCaptureV10v({
 rgba:both,width,height,split:false,qtCompare:true
}),RangeError);
console.log('PASS V1.0V: authentic framebuffer acceptance requires both painted panels and visible Q/T color difference; empty, identical, missing or malformed data rejected');
