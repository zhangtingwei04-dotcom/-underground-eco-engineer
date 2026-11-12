import assert from 'node:assert/strict';
import {
  SNAKE_HEAD_ATTACH_VERSION,SNAKE_HEAD_ART_PROFILES,
  makeSnakeHeadAttachment,poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {makeUniversalSnakePose} from '../src/ohm-core/snake-skeleton-motion.mjs';
import {createSnakeGrowthMotionBridge} from '../src/ohm-core/snake-growth-motion-adapter.mjs';

const close=(a,b,epsilon=1e-8)=>Math.abs(a-b)<=epsilon;
const vecClose=(a,b,epsilon=1e-8)=>
  close(a.x,b.x,epsilon)&&close(a.y,b.y,epsilon)&&close(a.z,b.z,epsilon);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const norm=p=>Math.hypot(p.x,p.y,p.z);
assert.equal(SNAKE_HEAD_ATTACH_VERSION,'0.1');
const species=Object.keys(SNAKE_HEAD_ART_PROFILES);
assert.deepEqual(species,['generic_snake','corn_snake','hognose_snake']);
let frames=0;
for(const speciesId of species){
  for(const length of [.4,.9,1.4,2.4]){
    const head=makeSnakeHeadAttachment({speciesId,length});
    const growth=createSnakeGrowthMotionBridge({speciesId,bodyLength:length});
    assert.equal(head.totalBodyLength,growth.bodyLength);
    assert.equal(head.uv.length,head.localVertices.length);
    assert.equal(head.localVertices.length,head.ringCount*16);
    assert.equal(head.triangles.length,(head.ringCount-1)*16*6);
    assert.ok(Object.isFrozen(head));
    assert.ok(Object.isFrozen(head.localVertices));
    assert.equal(head.localAnchors.neckSocket.x,0);
    assert.equal(head.localAnchors.neckSocket.y,0);
    assert.equal(head.localAnchors.neckSocket.z,0);
    assert.equal(head.speciesId,speciesId);
    for(const mode of ['ground','explore','supported']){
      const pose=makeUniversalSnakePose({length,mode,boneCount:24,bodyRadius:growth.bodyRadius,time:.44});
      const snapshot=JSON.stringify(pose);
      for(const yaw of [-.21,0,.21]){
        for(const pitch of [-.16,0,.16]){
          const result=poseSnakeHeadAttachment(head,pose.points,{
            yaw,pitch,roll:.06,tongueExtension:.7
          });
          frames++;
          assert.strictEqual(result.uv,head.uv);
          assert.strictEqual(result.triangles,head.triangles);
          assert.equal(result.meshPositions.length,head.localVertices.length);
          assert.ok(vecClose(result.origin,pose.points[0]));
          assert.ok(vecClose(result.anchors.neckSocket,pose.points[0]));
          for(const axis of ['forward','side','up'])assert.ok(close(norm(result.frame[axis]),1));
          assert.ok(close(dot(result.frame.forward,result.frame.side),0));
          assert.ok(close(dot(result.frame.forward,result.frame.up),0));
          assert.ok(close(dot(result.frame.side,result.frame.up),0));
          assert.ok(result.meshPositions.every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
          assert.ok(result.tongue);
          const tips=result.tongue;
          assert.ok(norm({
            x:tips.forkLeft.x-tips.forkRight.x,
            y:tips.forkLeft.y-tips.forkRight.y,
            z:tips.forkLeft.z-tips.forkRight.z
          })>1e-7,'fork endpoints should be distinct');
          assert.equal(result.neck.correctionRequired,true);
        }
      }
      assert.equal(JSON.stringify(pose),snapshot,'head rig may not deform body spine');
    }
    const straight=[{x:0,y:0,z:.25},{x:-.05,y:0,z:.25},{x:-.10,y:0,z:.25}];
    const baseline=poseSnakeHeadAttachment(head,straight);
    assert.ok(vecClose(baseline.frame.forward,{x:1,y:0,z:0}));
    assert.ok(vecClose(baseline.frame.side,{x:0,y:1,z:0}));
    assert.ok(vecClose(baseline.frame.up,{x:0,y:0,z:1}));
    assert.equal(baseline.neck.correctionRequired,false);
    assert.equal(baseline.tongue,null);
    const raised=poseSnakeHeadAttachment(head,straight,{pitch:.2});
    assert.ok(raised.anchors.rostralTip.z>baseline.anchors.rostralTip.z,
      'pitch raises rostral tip');
    const shifted=straight.map(p=>({x:p.x+5,y:p.y-2,z:p.z+1.3}));
    const shiftedHead=poseSnakeHeadAttachment(head,shifted);
    assert.ok(vecClose({
      x:shiftedHead.anchors.leftEye.x-baseline.anchors.leftEye.x,
      y:shiftedHead.anchors.leftEye.y-baseline.anchors.leftEye.y,
      z:shiftedHead.anchors.leftEye.z-baseline.anchors.leftEye.z
    },{x:5,y:-2,z:1.3}));
    const straightTongue=poseSnakeHeadAttachment(head,straight,{tongueExtension:1}).tongue;
    assert.ok(straightTongue.forkLeft.y>straightTongue.forkRight.y);
  }
}
for(const size of [.5,1,2.1]){
  const hog=makeSnakeHeadAttachment({speciesId:'hognose_snake',length:size});
  const corn=makeSnakeHeadAttachment({speciesId:'corn_snake',length:size});
  const neutral=makeSnakeHeadAttachment({speciesId:'generic_snake',length:size});
  assert.ok(hog.localAnchors.rostralTip.z>corn.localAnchors.rostralTip.z);
  assert.equal(corn.localAnchors.rostralTip.z,0);
  assert.equal(neutral.localAnchors.rostralTip.z,0);
  assert.ok(hog.localAnchors.rightEye.y<0);
  assert.ok(corn.localAnchors.leftEye.y>0);
}
const baby=makeSnakeHeadAttachment({speciesId:'hognose_snake',length:.5});
const adult=makeSnakeHeadAttachment({speciesId:'hognose_snake',length:1.4});
assert.deepEqual(baby.uv,adult.uv,'head UV identity survives size changes');
const shape=makeSnakeHeadAttachment({speciesId:'hognose_snake',length:1.4,
  factors:{length:1.15,width:.9,height:1.12}});
assert.equal(shape.shape.width,.9);
assert.ok(shape.localAnchors.rostralTip.x>adult.localAnchors.rostralTip.x);
assert.ok(shape.localAnchors.leftEye.y<adult.localAnchors.leftEye.y);
assert.deepEqual(shape.uv,adult.uv,'nonuniform size adjustment retains UV topology');
assert.notDeepEqual(shape.localVertices,adult.localVertices);
const vertical=[
 {x:0,y:0,z:2},{x:0,y:0,z:1.9},{x:0,y:0,z:1.8}
];
const upright=poseSnakeHeadAttachment(adult,vertical);
assert.ok(upright.meshPositions.every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
const withHint=poseSnakeHeadAttachment(adult,vertical,{upHint:{x:1,y:0,z:0}});
assert.ok(withHint.meshPositions.every(v=>[v.x,v.y,v.z].every(Number.isFinite)));
for(const params of [
 {speciesId:'__proto__'},
 {speciesId:'unlisted_snake'},
 {length:0},{length:5.1},{length:NaN},
 {radialSegments:7},{factors:{length:0,width:1,height:1}},
 {factors:{length:1,width:1,height:1,extra:2}},
 {factors:{length:1,width:1,height:1.3}},
]) assert.throws(()=>makeSnakeHeadAttachment(params),RangeError);
const standard=makeSnakeHeadAttachment();
const good=[{x:0,y:0,z:.3},{x:-.1,y:0,z:.3},{x:-.2,y:0,z:.3}];
for(const options of [
 {yaw:Infinity},{yaw:.31},{pitch:-.31},{roll:.13},
 {tongueExtension:-.01},{tongueExtension:1.1},{upHint:{x:0,y:0,z:0}}
])assert.throws(()=>poseSnakeHeadAttachment(standard,good,options),RangeError);
for(const badSpine of [
 [],good.slice(0,2),
 [{x:0,y:0,z:0},{x:0,y:0,z:0},{x:0,y:0,z:0}],
 [{x:0,y:0,z:0},{x:NaN,y:0,z:0},{x:-.2,y:0,z:0}]
])assert.throws(()=>poseSnakeHeadAttachment(standard,badSpine),RangeError);
assert.throws(()=>poseSnakeHeadAttachment(null,good),RangeError);
console.log('PASS snake head attachment V0.1: '+frames+
  ' head poses across 3 species, 4 body sizes, 3 motion modes, orientation/UV/anchor and invalid-input checks');
