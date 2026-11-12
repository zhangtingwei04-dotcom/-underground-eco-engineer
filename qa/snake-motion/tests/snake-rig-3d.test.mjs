import assert from 'node:assert/strict';
import {
  SNAKE_RIG_3D_VERSION,SNAKE_RIG_PROFILES,makeSnakeRig3D,
  sampleSnakeSpine,deformSnakeRig3D
} from '../src/ohm-core/snake-rig-3d.mjs';

assert.equal(SNAKE_RIG_3D_VERSION,1);
const rig=makeSnakeRig3D();
assert.equal(rig.schemaVersion,1);
assert.equal(rig.speciesId,'hognose_snake');
assert.equal(rig.bones.length,14);
assert.equal(rig.vertices.length,97*16);
assert.equal(rig.uv.length,rig.vertices.length);
assert.equal(rig.joints.length,rig.vertices.length);
assert.equal(rig.weights.length,rig.vertices.length);
assert.equal(rig.triangles.length,(96*16*2*3));
assert.deepEqual(rig.bones.map(b=>b.parent),[null,...Array.from({length:13},(_,i)=>i)]);
assert.ok(Object.isFrozen(rig)&&Object.isFrozen(rig.vertices)&&Object.isFrozen(rig.vertices[0]));
assert.equal(JSON.stringify(rig),JSON.stringify(makeSnakeRig3D()),
  'same shape parameters reproduce the same rig');
for(let i=0;i<rig.vertices.length;i++){
 const uv=rig.uv[i],w=rig.weights[i],joint=rig.joints[i];
 assert.ok(uv.u>=0&&uv.u<=1&&uv.v>=0&&uv.v<1);
 assert.ok(joint.every(j=>Number.isInteger(j)&&j>=0&&j<rig.boneCount));
 assert.ok(w.every(x=>x>=0&&x<=1));
 assert.ok(Math.abs(w.reduce((x,y)=>x+y,0)-1)<1e-10,'skin weights sum to 1');
}
for(const t of rig.triangles)assert.ok(Number.isInteger(t)&&t>=0&&t<rig.vertices.length);
const ringRadius=i=>Math.hypot(rig.vertices[i*16].y,rig.vertices[i*16].z);
assert.ok(ringRadius(38)>ringRadius(96)*20,'rear must taper continuously');
assert.ok(ringRadius(12)<ringRadius(38),'neck narrower than trunk');
assert.ok(rig.headAnchors.rostralTip.z>0,'mildly raised hognose snout');
assert.ok(rig.headAnchors.nearNostril.x>rig.headAnchors.nearEye.x);

const straight=[{x:0,y:0,z:.14},{x:-1.4,y:0,z:.14}];
const curve=[
 {x:0,y:0,z:.16},{x:-.35,y:.04,z:.17},
 {x:-.7,y:.23,z:.21},{x:-1.05,y:.23,z:.17},{x:-1.4,y:0,z:.14}
];
const frames=sampleSnakeSpine(curve,{samples:rig.ringCount});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const mag=a=>Math.hypot(a.x,a.y,a.z);
for(const frame of frames){
 assert.ok(Math.abs(mag(frame.tangent)-1)<1e-9);
 assert.ok(Math.abs(mag(frame.normal)-1)<1e-9);
 assert.ok(Math.abs(mag(frame.binormal)-1)<1e-9);
 assert.ok(Math.abs(dot(frame.tangent,frame.normal))<1e-9);
 assert.ok(Math.abs(dot(frame.tangent,frame.binormal))<1e-9);
}
const a=deformSnakeRig3D(rig,straight),b=deformSnakeRig3D(rig,curve);
assert.notEqual(JSON.stringify(a.positions),JSON.stringify(b.positions));
assert.strictEqual(a.uv,rig.uv,'all poses retain stable UV identity');
assert.strictEqual(b.uv,rig.uv,'no pattern scrambling during bending');
assert.strictEqual(b.triangles,rig.triangles);
assert.equal(b.positions.length,rig.vertices.length);
const shifted=curve.map(p=>({x:p.x+5,y:p.y-2,z:p.z+.9}));
const c=deformSnakeRig3D(rig,shifted);
for(let i=0;i<rig.vertices.length;i+=51){
 assert.ok(Math.abs((c.positions[i].x-b.positions[i].x)-5)<1e-9);
 assert.ok(Math.abs((c.positions[i].y-b.positions[i].y)+2)<1e-9);
 assert.ok(Math.abs((c.positions[i].z-b.positions[i].z)-.9)<1e-9);
}
assert.ok(Math.max(...b.positions.map(p=>p.z))>Math.max(...a.positions.map(p=>p.z)),
  '3D centerline raises parts of the body');
// Body proportions are species/profile data, while the rig topology,
// skinning, UV and 3D centerline code remains common.
assert.deepEqual(Object.keys(SNAKE_RIG_PROFILES),
  ['hognose_snake','generic_snake','corn_snake']);
const neutral=makeSnakeRig3D({speciesId:'generic_snake'});
const corn=makeSnakeRig3D({speciesId:'corn_snake'});
assert.equal(rig.speciesId,'hognose_snake');
assert.equal(rig.headStyle,'hognose_rostral_art');
assert.equal(neutral.headStyle,'neutral_smooth');
assert.equal(corn.headStyle,'corn_smooth_art');
assert.equal(neutral.boneCount,rig.boneCount);
assert.equal(corn.boneCount,rig.boneCount);
assert.equal(neutral.vertices.length,rig.vertices.length);
assert.equal(corn.vertices.length,rig.vertices.length);
assert.deepEqual(neutral.bones,rig.bones,'same rest skeleton can bind different body skins');
assert.deepEqual(corn.bones,rig.bones);
assert.deepEqual(neutral.uv,rig.uv,'UV identity shared across profiles');
assert.deepEqual(corn.joints,rig.joints);
assert.deepEqual(corn.weights,rig.weights);
assert.deepEqual(corn.triangles,rig.triangles);
assert.notDeepEqual(neutral.vertices,rig.vertices,'neutral trunk uses its own shape');
assert.notDeepEqual(corn.vertices,neutral.vertices,'corn has a distinct slimmer mesh');
assert.equal(neutral.headAnchors.rostralTip.z,0,
  'generic snakes must not inherit upturned hognose snout');
assert.equal(corn.headAnchors.rostralTip.z,0);
assert.ok(rig.headAnchors.rostralTip.z>0);
for(const candidate of [neutral,corn]){
 const posed=deformSnakeRig3D(candidate,curve);
 assert.strictEqual(posed.uv,candidate.uv,'species-specific texture UV stays stable during movement');
 assert.strictEqual(posed.triangles,candidate.triangles);
 assert.ok(posed.positions.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 for(const weights of candidate.weights){
   assert.ok(Math.abs(weights.reduce((a,b)=>a+b,0)-1)<1e-10);
 }
}
assert.throws(()=>makeSnakeRig3D({speciesId:'unknown_snake'}),RangeError);
assert.throws(()=>makeSnakeRig3D({speciesId:'__proto__'}),RangeError);
assert.throws(()=>makeSnakeRig3D({length:0}),RangeError);
assert.throws(()=>makeSnakeRig3D({boneCount:3}),RangeError);
assert.throws(()=>makeSnakeRig3D({ringCount:8}),RangeError);
assert.throws(()=>makeSnakeRig3D({radialSegments:2}),RangeError);
assert.throws(()=>sampleSnakeSpine([{x:0,y:0,z:0},{x:0,y:0,z:0}]),RangeError);
assert.throws(()=>sampleSnakeSpine([{x:0,y:0,z:0},{x:1,y:0,z:NaN}]),RangeError);
assert.throws(()=>deformSnakeRig3D({},curve),RangeError);
console.log('PASS Snake Rig 3D: backward-compatible hognose, generic and corn shape profiles, shared skin weights/UV, raised poses and input guards');
