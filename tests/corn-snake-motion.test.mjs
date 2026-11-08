import {generateSnakePose,makeCornSnakePattern,POSE_VERSION} from '../src/ohm-core/corn-snake-motion.mjs';
import assert from 'node:assert/strict';
import {getCornSnakeHalfWidth,makeCornSnakeVisualTemplate} from '../src/ohm-core/corn-snake-visual-template.mjs';

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
// v0.4 isolated pixel-texture plan: stable animal-local markings and tapered body.
const visualA=makeCornSnakeVisualTemplate({seed:1049,morphId:'normal'});
const visualB=makeCornSnakeVisualTemplate({seed:1049,morphId:'normal'});
const visualC=makeCornSnakeVisualTemplate({seed:1050,morphId:'normal'});
assert.equal(visualA.ok,true);
assert.deepEqual(visualA,visualB,'the same snake retains its texture seed');
assert.notDeepEqual(visualA.visual.flecks,visualC.visual.flecks,'another individual differs');
assert.equal(visualA.visual.flecks.length,180);
assert.ok(visualA.visual.flecks.every(f=>f.s>=0&&f.s<=1&&Math.abs(f.radial)<=0.78&&f.size>0));
assert.deepEqual(visualA.visual.marks,makeCornSnakePattern(1049).marks,'existing pattern design remains compatible');
assert.equal(makeCornSnakeVisualTemplate({seed:-1}).ok,false);
assert.equal(makeCornSnakeVisualTemplate({morphId:'fictional'}).ok,false);
assert.equal(makeCornSnakeVisualTemplate({fleckCount:999}).ok,false);
assert.ok(getCornSnakeHalfWidth(.26)>getCornSnakeHalfWidth(0),'body thickens behind the neck');
assert.ok(getCornSnakeHalfWidth(.26)>getCornSnakeHalfWidth(.73),'body begins to taper');
assert.ok(getCornSnakeHalfWidth(.87)>getCornSnakeHalfWidth(1),'tail ends thinner than the body');
assert.throws(()=>getCornSnakeHalfWidth(-0.1),RangeError);
console.log('PASS corn-snake v0.4 seeded pixel texture and body template');

console.log('PASS corn-snake v0.3 forward route, turn-follow, bounds and seeded markings');
