import assert from 'node:assert/strict';
import {generateSnakePose} from '../src/ohm-core/corn-snake-motion.mjs';
import {sampleCornSnakeActivityV06 as sample,applyCornSnakeGestureV06 as gesture} from '../src/ohm-core/corn-snake-activity-v06.mjs';
const a=t=>sample(t,{seed:1049}),b=t=>sample(t,{seed:775});
for(const t of [0,1,7,12,28,51.999,52,52.001,104,200,500,1000]){
 assert.deepEqual(a(t),a(t),'same individual, same elapsed time reproducible');
 assert.ok(Number.isFinite(a(t).motionTime));
 assert.ok(a(t).motionTime<=t+1e-8,'motion clock never exceeds elapsed time');
 const p=generateSnakePose(a(t).motionTime),q=gesture(p,a(t));
 assert.deepEqual(q.at(-1),p.at(-1),'tail remains fixed during local gestures');
 assert.ok(q.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
}
assert.notDeepEqual(a(100),b(100),'individual seed changes activity rhythm');
const states=new Set(Array.from({length:2400},(_,i)=>a(i*.1).state));
for(const s of ['slither','rest','orient','explore'])assert.ok(states.has(s),'state reachable: '+s);
let tongues=0;
for(let i=0;i<2400;i++)if(a(i*.1).tongue>0)tongues++;
assert.ok(tongues>0&&tongues<240,'tongue brief and intermittent, not permanent');
for(let i=1;i<=3000;i++){
 const prev=a((i-1)*.1),now=a(i*.1);
 assert.ok(now.motionTime>=prev.motionTime-1e-8,'no backwards movement clock');
 assert.ok(now.motionTime-prev.motionTime<=.100001,'no movement teleport');
}
for(const t of [52,104,156]){
 const left=a(t-.00001),right=a(t);
 assert.ok(Math.abs(left.motionTime-right.motionTime)<.0001,'no legacy fixed-cycle jump');
}
assert.throws(()=>sample(-1),RangeError);
assert.throws(()=>sample(Infinity),RangeError);
assert.throws(()=>sample(1,{seed:-1}),RangeError);
assert.throws(()=>gesture([],{}),TypeError);
console.log('PASS v0.6 seeded variable rhythm, neck stability, tongue intermittency, continuous movement clock');
