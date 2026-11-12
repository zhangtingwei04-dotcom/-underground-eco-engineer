import assert from 'node:assert/strict';
import {HABITAT,DEMO_ROUTE,makeRoute,sampleRoute,journeyDistance,sampleSnake,
 checkRockClearance,samplePlantOcclusion,projectHabitatPoint,getBodyHalfWidth} from '../src/ohm-core/terrarium-depth.mjs';
const approx=(a,b,tol=1e-9)=>Math.abs(a-b)<=tol;
assert.ok(DEMO_ROUTE.length>750);
assert.ok(approx(sampleRoute(DEMO_ROUTE,0).x,70));
assert.ok(approx(sampleRoute(DEMO_ROUTE,DEMO_ROUTE.length).x,917));
assert.ok(approx(journeyDistance(0),journeyDistance(1)));
assert.ok(approx(journeyDistance(25),journeyDistance(19)));
assert.ok(journeyDistance(10)>journeyDistance(4));
for(const t of [0,1.2,2,5,8,11,15,18.8,19,25]) {
  const snake=sampleSnake(t);
  assert.equal(snake.length,81);
  assert.ok(snake.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.halfWidth>0));
  const clearance=checkRockClearance(snake);
  assert.ok(clearance.clear,`rock intersection t=${t}: ${clearance.minClearance}`);
  assert.deepEqual(snake,sampleSnake(t),'identical time must be deterministic');
}
for(let i=0;i<=380;i++){
  const t=i/20,pose=sampleSnake(t),collision=checkRockClearance(pose);
  assert.ok(collision.clear,`rock clipping at time ${t}: ${collision.minClearance}`);
  if(i>0){const prev=sampleSnake((i-1)/20),now=pose[0],old=prev[0];
    assert.ok(Math.hypot(now.x-old.x,now.y-old.y)<7,'head may not teleport between frames');}
}
for(const s of [0,.1,.25,.5,.75,.95,1]) assert.ok(getBodyHalfWidth(s)>0);
const f0=sampleSnake(0),f1=sampleSnake(.5);
assert.deepEqual(f0,f1,'resting pose remains frozen');
assert.deepEqual(sampleSnake(19),sampleSnake(25),'final pose remains frozen');
assert.ok(samplePlantOcclusion(sampleSnake(14)).some(v=>v.behindPlant),'plant occludes part of body');
assert.ok(samplePlantOcclusion(sampleSnake(14)).some(v=>!v.behindPlant),'not entire body vanishes');
assert.deepEqual(projectHabitatPoint({x:480,y:270},480,270),{x:240,y:135,scale:.5});
assert.deepEqual(projectHabitatPoint({x:480,y:270},540,960),{x:270,y:480,scale:.5625});
assert.throws(()=>makeRoute([[0,0]]),RangeError);
assert.throws(()=>journeyDistance(-1),RangeError);
assert.throws(()=>sampleSnake(2,{segments:500}),RangeError);
assert.throws(()=>checkRockClearance([{x:NaN,y:2,halfWidth:2},{x:1,y:2,halfWidth:2}]),RangeError);
assert.throws(()=>samplePlantOcclusion([{x:NaN,y:2}]),RangeError);
console.log('PASS terrarium-depth v0.1: fixed route, full body clearance, occlusion, timing, resize, invalid input');
