import assert from 'node:assert/strict';
import {sculptWarmveinHeadV10y,fitWarmveinNaturalEyesV10y}
 from '../warmvein-head-shape-v10y.mjs';

const F=Object.freeze;
function makeSource(){
 const positions=[],uv=[];
 for(let ring=0;ring<=100;ring++){
  const head=ring<8,centerX=1.4-ring*.022;
  const radius=head?
   [.013,.044,.082,.103,.122,.121,.112,.106][ring]:.106;
  for(let j=0;j<16;j++){
   const theta=Math.PI*2*j/16;
   positions.push(F({x:centerX,
    y:radius*Math.cos(theta),
    z:.16+radius*.78*Math.sin(theta)}));
   uv.push(F({u:ring/100,v:j/16}));
  }
 }
 positions.push(F({x:1.54,y:0,z:.16}));
 uv.push(F({u:0,v:.25}));
 return F({
  vertexCount:1617,triangleCount:3216,radialSegments:16,
  headExtraRingCount:8,headBodySeamSharedVertices:true,
  neckSocketRingStartIndex:128,noseVertexIndex:1616,
  positions:F(positions),uv:F(uv),
  triangles:F(Array.from({length:3216*3},(_,i)=>i%1617))
 });
}
const mesh=makeSource(),checksum=JSON.stringify(mesh);
for(const stageProgress of [0,1,2,3]){
 const v=sculptWarmveinHeadV10y({sourceMesh:mesh,stageProgress});
 assert.equal(v.ok,true);
 assert.equal(v.version,'1.0Y');
 assert.equal(v.renderMesh.vertexCount,1617);
 assert.equal(v.renderMesh.triangleCount,3216);
 assert.equal(v.originalHeadSocketAndBodyBitIdentical,true);
 assert.equal(v.originalNoseTipUnchanged,true);
 assert.equal(v.originalUVUnchanged,true);
 assert.equal(v.originalTrianglesUnchanged,true);
 assert.equal(v.original24JointsAndColliderUnchanged,true);
 assert.equal(v.originalPlayerSavesUnchanged,true);
 assert.ok(v.modifiedHeadVertices>=80);
 assert.ok(v.maximumInwardShrinkWorld>0);
 assert.ok(v.maximumOutwardGrowthWorld<=1e-10);
 assert.ok(v.maximumOriginalRingCenterDriftWorld<1e-9);
 assert.equal(v.ringMeasurements.length,8);
 assert.equal(v.renderMesh.positions[128],mesh.positions[128]);
 assert.equal(v.renderMesh.positions[1616],mesh.positions[1616]);
 for(let i=128;i<1617;i++)
  assert.equal(v.renderMesh.positions[i],mesh.positions[i],
   'Welded socket, complete body and nose tip must preserve source references');
 for(let ring=0;ring<8;ring++){
  const start=ring*16;
  const cy0=mesh.positions.slice(start,start+16)
   .reduce((t,p)=>t+p.y/16,0);
  const cy1=v.renderMesh.positions.slice(start,start+16)
   .reduce((t,p)=>t+p.y/16,0);
  const span0=Math.max(...mesh.positions.slice(start,start+16)
   .map(p=>Math.abs(p.y-cy0)));
  const span1=Math.max(...v.renderMesh.positions.slice(start,start+16)
   .map(p=>Math.abs(p.y-cy1)));
  assert.ok(span1<span0+.00000001,'head width must not grow');
 }
 // Real attached eye fitting: source eye anchors remain on ring 4,
 // and scaled iris shrinks relative to prior R oversized style.
 const eye=fitWarmveinNaturalEyesV10y({
  mesh:v.renderMesh,stageProgress,canvasWidth:1100,worldHalfWidth:1.5
 });
 assert.equal(eye.version,'1.0Y');
 assert.equal(eye.eyes.length,2);
 assert.deepEqual(eye.eyes.map(x=>x.sourceHeadRing),[4,4]);
 assert.ok(eye.eyes.every(x=>x.pointSizePx<=x.oldLargeEyeSizePx));
 assert.equal(eye.bothEyeAnchorsStillTracked,true);
 assert.equal(eye.physicalHeadAndSaveUnchanged,true);
 assert.equal(eye.noBlink,true);
}
assert.equal(JSON.stringify(mesh),checksum);
assert.throws(()=>sculptWarmveinHeadV10y({
 sourceMesh:{},stageProgress:2
}),RangeError);
assert.throws(()=>sculptWarmveinHeadV10y({
 sourceMesh:mesh,stageProgress:4
}),RangeError);
console.log('PASS V1.0Y: eight genuine head rings narrower and lower; original 8th neck socket, body, tip, UV, indices, source collision & saves untouched; eyes follow existing real ring-4 attachments');
