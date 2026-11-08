import assert from 'node:assert/strict';
import {generateSnakePose} from '../src/ohm-core/corn-snake-motion.mjs';
import {
  sampleCornSnakeActivity,applyCornSnakeHeadGesture,
  CORN_ACTIVITY_CYCLE_SECONDS,CORN_ACTIVITY_STATES
} from '../src/ohm-core/corn-snake-activity.mjs';

// All action labels occur; sample times are artistic demonstration checkpoints.
assert.equal(CORN_ACTIVITY_CYCLE_SECONDS,52);
assert.ok(['slither','rest','orient','observe','return','peek'].every(s=>CORN_ACTIVITY_STATES.includes(s)));
const stateAt=t=>sampleCornSnakeActivity(t).state;
assert.deepEqual([0,9,13,15,19,21,32,34,36,40].map(stateAt),
  ['slither','rest','orient','observe','return','slither','peek','peek','rest','slither']);
assert.equal(sampleCornSnakeActivity(9).motionTime,sampleCornSnakeActivity(12).motionTime,'body stops during rest');
assert.equal(sampleCornSnakeActivity(15).motionTime,sampleCornSnakeActivity(18).motionTime,'body remains while orienting to observe');
assert.equal(sampleCornSnakeActivity(34).motionTime,sampleCornSnakeActivity(36).motionTime,'head peeks without body teleport');
assert.equal(sampleCornSnakeActivity(52).motionTime,32,'one cycle preserves path travel');
assert.equal(sampleCornSnakeActivity(104).motionTime,64,'multiple cycles preserve path travel');
assert.equal(sampleCornSnakeActivity(14).look,0.5,'look eases in');
assert.equal(sampleCornSnakeActivity(15).look,1,'observe holds full look');
assert.equal(sampleCornSnakeActivity(20).look,0.5,'look eases out');
assert.equal(sampleCornSnakeActivity(21).look,0,'look completes before crawling');
assert.equal(sampleCornSnakeActivity(34).peek,1,'peek reaches maximum midway');
assert.ok(sampleCornSnakeActivity(33).peek>0&&sampleCornSnakeActivity(33).peek<1);
assert.equal(sampleCornSnakeActivity(36).peek,0);
for(const t of [9,13,15,19,21,32,36,40,52,104]){
  const a=sampleCornSnakeActivity(t-0.00001),b=sampleCornSnakeActivity(t);
  assert.ok(Math.abs(a.motionTime-b.motionTime)<0.0001,'path-time continuous at '+t);
  assert.ok(Math.abs(a.look-b.look)<0.0001,'head look continuous at '+t);
  assert.ok(Math.abs(a.peek-b.peek)<0.0001,'peek continuous at '+t);
}
for(const t of [0,14,16,20,22,34,40,100]){
  const act=sampleCornSnakeActivity(t);
  const base=generateSnakePose(act.motionTime);
  const posed=applyCornSnakeHeadGesture(base,act);
  assert.ok(posed.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)),'finite gesture coords at '+t);
  assert.deepEqual(posed.at(-1),base.at(-1),'tail is not moved by head gestures at '+t);
}
assert.throws(()=>sampleCornSnakeActivity(-1),RangeError);
assert.throws(()=>sampleCornSnakeActivity(NaN),RangeError);
assert.throws(()=>applyCornSnakeHeadGesture([],{}),TypeError);
const base=generateSnakePose(9);
assert.equal(applyCornSnakeHeadGesture(base,{look:0,peek:0}),base,'no gesture preserves body points');
assert.throws(()=>applyCornSnakeHeadGesture(base,{look:2}),RangeError);
console.log('PASS corn-snake activity v0.5 rhythm, rest, watch, peek, continuity and body stability');
