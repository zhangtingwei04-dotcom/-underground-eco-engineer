import assert from 'node:assert/strict';
import {inspectSnakeBendFrameV08c} from '../src/ohm-core/snake-bend-monitor-v08c.mjs';
const ds=2.28/23;
const make=(angle=0)=>{
 const points=[{x:0,y:0,z:.135}];
 for(let i=1;i<24;i++){
  const phi=i<=1?0:angle;
  const prev=points.at(-1);
  points.push({x:prev.x+ds*Math.cos(phi),
    y:prev.y+ds*Math.sin(phi),z:.135});
 }
 return Object.freeze({segmentLength:ds,points:Object.freeze(
   points.map(p=>Object.freeze(p)))});
};
for(const [angle,expected] of [[0,true],[.2,true],[.65,true],[.72,false]]){
 const pose=make(angle),before=JSON.stringify(pose);
 const m=inspectSnakeBendFrameV08c({pose});
 assert.equal(m.version,'0.8C');
 assert.equal(m.sourceJointCount,24);
 assert.equal(m.withinVisualLimit,expected);
 assert.ok(Math.abs(m.maximumRadians-angle)<1e-6);
 assert.ok(m.maximumRadians<1.1);
 assert.equal(m.sourceModified,false);
 assert.equal(m.headColliderModified,false);
 assert.equal(m.skinApplied,false);
 assert.equal(m.affectsSave,false);
 assert.equal(m.affectsEcology,false);
 assert.equal(m.physicalCollisionCertified,false);
 assert.equal(JSON.stringify(pose),before);
 assert.ok(Object.isFrozen(m));
}
for(const patch of [
  {pose:{...make(),points:[{x:1,y:2,z:3}]}},
  {pose:{...make(),segmentLength:.11}},
  {pose:{...make(),points:[{x:NaN,y:0,z:0},...make().points.slice(1)]}},
  {pose:{...make(),points:[...make().points.slice(0,4),
    {x:100,y:0,z:.135},...make().points.slice(5)]}},
  {pose:make(),limitRadians:NaN}
]) assert.throws(()=>inspectSnakeBendFrameV08c(patch),RangeError);
console.log('PASS V0.8C read-only 3D source-bone bend monitor with fixed length / strict 0.65 rad gate');
