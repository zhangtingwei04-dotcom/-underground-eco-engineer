import assert from 'node:assert/strict';
import {generateSnakePose} from '../src/ohm-core/corn-snake-motion.mjs';
import {sampleCornSnakeActivityV06,applyCornSnakeGestureV06} from '../src/ohm-core/corn-snake-activity-v06.mjs';
import {getCornSnakeHeadShapeV06 as head} from '../src/ohm-core/corn-snake-silhouette-v06.mjs';
for(const t of [0,3,7,17,51,104,270]){
 const a=sampleCornSnakeActivityV06(t,{seed:1049});
 const p=applyCornSnakeGestureV06(generateSnakePose(a.motionTime),a);
 const q=head(p);
 assert.deepEqual(q,head(p),'deterministic silhouette');
 assert.ok(Object.values(q).every(Number.isFinite));
 const dx=(p[0].x-p[4].x)*960,dy=(p[0].y-p[4].y)*540;
 assert.ok(Math.abs(Math.atan2(dy,dx)-q.angle)<1e-12,'neck-aligned head');
 assert.ok(q.front+q.back<40&&q.halfWidth<12,'reduced head proportions');
}
assert.throws(()=>head([]),TypeError);
assert.throws(()=>head(Array.from({length:5},()=>({x:.4,y:.8}))),RangeError);
assert.throws(()=>head(Array.from({length:5},()=>({x:NaN,y:.8}))),TypeError);
assert.throws(()=>head(generateSnakePose(0),{width:0}),TypeError);
console.log('PASS v0.6 neck-aligned head shape');
