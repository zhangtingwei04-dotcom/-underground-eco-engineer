import assert from 'node:assert/strict';
import {makeWarmveinDisplayTaperV10w} from '../warmvein-visual-taper-v10w.mjs';
const positions=[];
const uv=[];
for(let ring=0;ring<=100;ring++){
 for(let j=0;j<16;j++){
  const theta=2*Math.PI*j/16;
  positions.push(Object.freeze({
   x:1.4-ring*.025,
   y:Math.cos(theta)*.13,
   z:.13+Math.sin(theta)*.13
  }));
  uv.push(Object.freeze({u:ring/100,v:j/16}));
 }
}
positions.push(Object.freeze({x:1.54,y:0,z:.13}));
uv.push(Object.freeze({u:0,v:.25}));
const triangles=Object.freeze(Array.from({length:3216*3},(_,i)=>i%1617));
const mesh=Object.freeze({
 vertexCount:1617,triangleCount:3216,
 radialSegments:16,headExtraRingCount:8,
 bodyRingCount:93,neckSocketRingStartIndex:128,
 headBodySeamSharedVertices:true,noseVertexIndex:1616,
 positions:Object.freeze(positions),uv:Object.freeze(uv),triangles
});
const before=JSON.stringify(mesh.positions);
for(const stageProgress of [0,1,2,3]){
 const result=makeWarmveinDisplayTaperV10w({sourceMesh:mesh,stageProgress});
 assert.equal(result.ok,true);
 assert.equal(result.version,'1.0W');
 assert.equal(result.renderMesh.vertexCount,1617);
 assert.equal(result.renderMesh.triangleCount,3216);
 assert.equal(result.renderMesh.uv,mesh.uv);
 assert.equal(result.renderMesh.triangles,mesh.triangles);
 assert.equal(result.renderMesh.v10wSourceMeshReference,mesh);
 assert.equal(result.sourceMesh,mesh);
 assert.equal(result.sourceHeadAndSocketUnchanged,true);
 assert.equal(result.sourceNoseUnchanged,true);
 assert.equal(result.noSourcePhysicsModified,true);
 assert.equal(result.playerSaveModified,false);
 assert.equal(result.visuallyApproved,false);
 assert.equal(result.ringAudit.length,93);
 assert.ok(result.lastRingRelativeRadius<.06);
 assert.ok(result.middleBodyRelativeRadius<.80);
 assert.ok(result.maximumSingleRingFactorStep<.14);
 assert.ok(result.maximumOriginalGroundMinimumDriftWorld<1e-9);
 assert.equal(result.renderMesh.positions[1616],mesh.positions[1616]);
 for(let i=0;i<16*9;i++){
  assert.deepEqual(result.renderMesh.positions[i],mesh.positions[i]);
 }
 for(let ring=8;ring<=100;ring++){
  const beforeRing=mesh.positions.slice(ring*16,(ring+1)*16);
  const afterRing=result.renderMesh.positions.slice(ring*16,(ring+1)*16);
  assert.ok(afterRing.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
  assert.ok(Math.abs(
   Math.min(...beforeRing.map(p=>p.z))-
   Math.min(...afterRing.map(p=>p.z)))<1e-9);
  const centerY=beforeRing.reduce((a,p)=>a+p.y,0)/16;
  const originalMaxY=Math.max(...beforeRing.map(p=>Math.abs(p.y-centerY)));
  const displayMaxY=Math.max(...afterRing.map(p=>Math.abs(p.y-centerY)));
  assert.ok(displayMaxY<=originalMaxY+1e-12);
 }
 assert.equal(JSON.stringify(mesh.positions),before);
}
assert.throws(()=>makeWarmveinDisplayTaperV10w({sourceMesh:{},stageProgress:2}),RangeError);
assert.throws(()=>makeWarmveinDisplayTaperV10w({sourceMesh:mesh,stageProgress:4}),RangeError);
console.log('PASS V1.0W: deterministic real-topology 101-ring renderer-only tail taper; original head/neck, UV, physics and saves unchanged');
