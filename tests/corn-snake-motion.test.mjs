import {generateSnakePose,makeCornSnakePattern,POSE_VERSION} from '../src/ohm-core/corn-snake-motion.mjs';
import assert from 'node:assert/strict';

assert.equal(POSE_VERSION,2,'new geometry contract version');
const p=generateSnakePose(1);
assert.equal(p.length,65);
assert.ok(p.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0.04&&q.x<=0.96&&q.y>=0.67&&q.y<=0.87),'snake stays within substrate floor plane');
assert.deepEqual(generateSnakePose(1),generateSnakePose(1),'same time gives same geometry');
assert.notDeepEqual(generateSnakePose(1),generateSnakePose(2),'time advances the body');
assert.deepEqual(generateSnakePose(3,{speed:0}),generateSnakePose(0,{speed:0}),'zero speed freezes the pose');

const h0=generateSnakePose(0)[0],h2=generateSnakePose(2)[0];
assert.ok(Math.hypot(h2.x-h0.x,h2.y-h0.y)>0.035,'head must genuinely travel');
const heads=Array.from({length:81},(_,i)=>generateSnakePose(i*0.5)[0]);
const deltaX=heads.slice(1).map((h,i)=>h.x-heads[i].x);
assert.ok(deltaX.some(x=>x>0.001)&&deltaX.some(x=>x < -0.001),'head eventually turns back instead of circling in place');
const laterBody=generateSnakePose(3)[14],previousHead=generateSnakePose(2)[0];
assert.ok(Math.hypot(laterBody.x-previousHead.x,laterBody.y-previousHead.y)<0.025,'body follows earlier head trajectory');

for(const t of [0,0.5,2,5,12,20,40,100]){
  const pose=generateSnakePose(t,{segments:96,length:0.55,speed:1.7});
  assert.equal(pose.length,97);
  assert.ok(pose.every(q=>Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0.04&&q.x<=0.96&&q.y>=0.67&&q.y<=0.87),'route stays visible at t='+t);
}
assert.throws(()=>generateSnakePose(NaN),RangeError);
assert.throws(()=>generateSnakePose(0,{segments:1000}),RangeError);
assert.throws(()=>generateSnakePose(0,{speed:-1}),RangeError);

const m=makeCornSnakePattern(77);
assert.equal(m.ok,true);
assert.equal(m.marks.length,35);
assert.deepEqual(makeCornSnakePattern(77),makeCornSnakePattern(77),'same individual seed regenerates same markings');
assert.notDeepEqual(makeCornSnakePattern(77),makeCornSnakePattern(78),'different seed changes markings');
assert.equal(makeCornSnakePattern(-1).ok,false);
assert.ok(m.marks.every(q=>q.position>0&&q.position<1));
console.log('PASS corn-snake v0.3 forward route, turn-follow, bounds and seeded markings');
