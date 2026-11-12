import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 buildContinuousTransparentRigV07o,SNAKE_CONTINUOUS_RIG_VERSION
} from '../src/ohm-core/snake-continuous-transparent-rig-v07o.mjs';

const N=24;
const spine=Object.freeze(Array.from({length:N},(_,i)=>Object.freeze({
 x:240+i*30,y:520+30*Math.sin(i/4)
})));
const radii=Object.freeze(spine.map((_,i)=>
 Math.round((18*(i<14?1:1-.85*((i-14)/9)))*1000)/1000));
const frame=Object.freeze({
 version:'0.7G',skinApplied:false,spine,radii
});
const original=JSON.stringify(frame);
const body=buildContinuousTransparentRigV07o(frame);
assert.equal(SNAKE_CONTINUOUS_RIG_VERSION,'0.7O');
assert.equal(body.version,'0.7O');
assert.equal(body.sourceVersion,'0.7G');
assert.equal(body.sourceJointCount,N);
assert.equal(body.axis.length,(N-1)*6+1);
assert.equal(body.left.length,body.axis.length);
assert.equal(body.right.length,body.axis.length);
assert.equal(body.outline.length,body.axis.length*2);
assert.equal(body.contourPointCount,body.outline.length);
assert.equal(body.debugJointRingsDefault,false);
assert.equal(body.animalGeometryChanged,false);
assert.equal(body.skinApplied,false);
assert.equal(body.affectsCollision,false);
assert.equal(body.affectsEcology,false);
assert.ok(Object.isFrozen(body));
assert.ok(Object.isFrozen(body.axis));
assert.ok(Object.isFrozen(body.outline));
assert.deepEqual(body.axis[0],spine[0]);
assert.deepEqual(body.tailPoint,{
 x:Math.round(spine.at(-1).x*1000)/1000,
 y:Math.round(spine.at(-1).y*1000)/1000
});
for(let i=0;i<N;i++){
 const p=body.axis[i*6];
 assert.ok(Math.hypot(p.x-spine[i].x,p.y-spine[i].y)<.0011,
  'sampled spline must interpolate existing projected joints');
}
for(let i=0;i<body.axis.length;i++){
 const a=body.left[i],b=body.right[i],c=body.axis[i];
 assert.ok([a.x,a.y,b.x,b.y,c.x,c.y].every(Number.isFinite));
 assert.ok(body.widths[i]>0,'no negative or zero body contour radius');
 const midpoint={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
 assert.ok(Math.hypot(midpoint.x-c.x,midpoint.y-c.y)<.0012,
  'both sides share one centerline, no disjoint bead circles');
 const halfSpan=Math.hypot(a.x-b.x,a.y-b.y)/2;
 assert.ok(Math.abs(halfSpan-body.widths[i])<.002,
  'contour width derives from existing V0.7G art radius');
 if(i>0){
  const prev=body.axis[i-1];
  assert.ok(Math.hypot(c.x-prev.x,c.y-prev.y)<8,
   'intermediate 2D curve samples must not jump between joints');
 }
}
assert.ok(body.widths.at(-1)<body.widths[0]*.2,
 'smooth tail must taper, no last-segment full-size bead');
assert.deepEqual(body,buildContinuousTransparentRigV07o(frame),
 'identical input must produce deterministic ghost contour');
assert.equal(JSON.stringify(frame),original,
 'screen art may not mutate the original rig coordinates or radii');
const straight={
 version:'0.7G',skinApplied:false,
 spine:Array.from({length:N},(_,i)=>({x:200+i*24,y:525})),
 radii:Array.from({length:N},()=>12)
};
const line=buildContinuousTransparentRigV07o(straight,{
 subdivisions:4,widthScale:1
});
assert.equal(line.axis.length,(N-1)*4+1);
assert.ok(line.axis.every(p=>Math.abs(p.y-525)<1e-6),
 'collinear joints must remain exactly straight');
assert.ok(line.left.every(p=>Math.abs(p.y-537)<.0011));
assert.ok(line.right.every(p=>Math.abs(p.y-513)<.0011));
for(const invalid of [
 null,{...frame,skinApplied:true},{...frame,version:'0.7N'},
 {...frame,radii:[...radii.slice(1)]},
 {...frame,radii:radii.map((r,i)=>i===3?NaN:r)},
 {...frame,spine:spine.map((p,i)=>i===8?{...p,x:Infinity}:p)},
 {...frame,spine:spine.map((p,i)=>i===2?spine[1]:p)}
])assert.throws(()=>buildContinuousTransparentRigV07o(invalid),
 RangeError,'invalid, altered or collapsed rig must be refused');
for(const opts of [
 {subdivisions:2},{subdivisions:13},{subdivisions:4.5},
 {widthScale:0},{widthScale:NaN},{widthScale:2}
])assert.throws(()=>buildContinuousTransparentRigV07o(frame,opts),
 RangeError);
const html=readFileSync(
 new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildContinuousTransparentRigV07o/);
assert.match(html,/drawContinuousTransparentRig/);
assert.match(html,/qaV07oContinuous/);
assert.match(html,/nodes=false/);
const source=readFileSync(new URL(
 '../src/ohm-core/snake-continuous-transparent-rig-v07o.mjs',
 import.meta.url),'utf8');
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7O: 24 source joints, 139 smooth samples, one tapered 278-point translucent contour, no circles by default, no skin, unchanged bones, bounded interpolation and deterministic output.');
