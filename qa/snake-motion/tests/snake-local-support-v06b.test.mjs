import assert from 'node:assert/strict';
import {
  SNAKE_LOCAL_SUPPORT_VERSION,conformSnakeBodyWithLocalSupport
} from '../src/ohm-core/snake-local-support-v06b.mjs';
import {makeUniversalSnakePose} from '../src/ohm-core/snake-skeleton-motion.mjs';
import {
  SNAKE_TERRAIN_PRESET,inspectSnakeTerrainClearance
} from '../src/ohm-core/snake-terrain-contact.mjs';
import {
  createSnakeGrowthMotionBridge
} from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {
  poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {deformSnakeRig3D}
  from '../src/ohm-core/snake-rig-3d.mjs';

const flat={groundZ:0,rock:null,perch:null};
const oval=x=>({groundZ:0,rock:{x,y:0,radius:.45,height:.09},perch:null});
const mag=(p,q)=>Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z);
const assertExact=(pose,label)=>{
 assert.ok(Object.isFrozen(pose));
 assert.ok(Object.isFrozen(pose.points));
 assert.ok(Object.isFrozen(pose.lift));
 assert.equal(pose.points.length,pose.boneCount);
 for(let i=1;i<pose.points.length;i++)
  assert.ok(Math.abs(mag(pose.points[i],pose.points[i-1])-pose.segmentLength)<1e-7,
    label+' fixed segment '+i);
 const clearance=inspectSnakeTerrainClearance(pose,{samplesPerBone:16});
 assert.equal(clearance.ok,true,label+' clearance '+JSON.stringify(clearance));
 assert.equal(clearance.groundHeightfieldChecked,true);
 assert.equal(clearance.selfCollisionChecked,false);
 assert.equal(clearance.exactMeshCollisionChecked,false);
};
assert.equal(SNAKE_LOCAL_SUPPORT_VERSION,'0.6B');
let count=0;
for(const bodyLength of [.6,1.4,2.5]){
 for(const boneCount of [16,24,40]){
  for(const mode of ['ground','explore','supported']){
   for(const time of [0,.35,1.1]){
    const base=makeUniversalSnakePose({length:bodyLength,boneCount,
      bodyRadius:bodyLength*.045,mode,time});
    const orig=JSON.stringify(base);
    const corrected=conformSnakeBodyWithLocalSupport(base,{terrain:flat});
    assertExact(corrected,'flat '+bodyLength+' '+boneCount+' '+mode+' '+time);
    assert.ok(corrected.lift.every(x=>x===0),'no fictitious hovering on flat ground');
    if(mode!=='explore'){
     assert.equal(corrected.suspendedIndices.length,0,
       'fixed supported arch must vanish without an actual raised surface');
    }
    assert.equal(JSON.stringify(base),orig,'new module cannot mutate the legacy pose');
    assert.equal(JSON.stringify(corrected),
      JSON.stringify(conformSnakeBodyWithLocalSupport(base,{terrain:flat})),
      'must be deterministic for an identical input');
    count++;
   }
  }
 }
}
const demo=makeUniversalSnakePose({length:1.4,boneCount:24,
  bodyRadius:.067,mode:'ground',time:.2});
const groundOnly=conformSnakeBodyWithLocalSupport(demo,{terrain:flat});
const raised=conformSnakeBodyWithLocalSupport(demo,{terrain:oval(-.7)});
assertExact(raised,'raised soft rock');
assert.ok(raised.supportedIndices.length>0,'rock must determine some contacts');
assert.ok(raised.contactZones.some(z=>z.surface==='rock_rounded_heightfield'));
assert.ok(raised.lift.some(x=>x>1e-4),'some unsupported neighbors should be elevated smoothly');
assert.ok(raised.suspendedIndices.length>0,'nearby raised sections should be visible');
assert.ok(raised.points.some((p,i)=>p.z>groundOnly.points[i].z+.01),
  'terrain must affect actual 3D pose');
assert.notDeepEqual(raised.points,groundOnly.points);
const changedPosition=conformSnakeBodyWithLocalSupport(demo,{terrain:oval(-1.03)});
assertExact(changedPosition,'rock moved');
assert.notDeepEqual(raised.supportedIndices,changedPosition.supportedIndices,
 'support locations must come from rock position rather than fixed bone IDs');
const naturalLegacySupported=conformSnakeBodyWithLocalSupport(
 makeUniversalSnakePose({mode:'supported'}),{terrain:flat}
);
assert.ok(naturalLegacySupported.lift.every(x=>x===0));
assert.equal(naturalLegacySupported.contactZones.length,0);
const withPrevious=conformSnakeBodyWithLocalSupport(demo,{
  terrain:oval(-.7),previousLift:new Array(24).fill(0),follow:.25
});
assertExact(withPrevious,'smoothed temporal response');
assert.ok(withPrevious.lift.every((x,i)=>Math.abs(x-raised.lift[i]*.25)<1e-10));
assert.ok(withPrevious.lift.some(x=>x>0));
const repeated=conformSnakeBodyWithLocalSupport(demo,{
  terrain:oval(-.7),previousLift:raised.lift,follow:.25
});
assertExact(repeated,'same scene with history');
assert.deepEqual(repeated.lift,raised.lift,'stable terrain should not make lift drift');
for(const speciesId of ['generic_snake','corn_snake','hognose_snake']){
 const bridge=createSnakeGrowthMotionBridge({speciesId,bodyLength:1.4});
 const base=makeUniversalSnakePose({...bridge.motionParameters,mode:'ground',time:1.5});
 const pose=conformSnakeBodyWithLocalSupport(base,{terrain:SNAKE_TERRAIN_PRESET});
 assertExact(pose,'mesh compatibility '+speciesId);
 const skin=deformSnakeRig3D(bridge.rig,pose.points);
 const head=poseSnakeHeadAttachment(bridge.headAttachment,pose.points,{yaw:.06});
 assert.equal(skin.positions.length,bridge.rig.vertices.length);
 assert.strictEqual(skin.uv,bridge.rig.uv);
 assert.equal(head.speciesId,speciesId);
 assert.ok(mag(head.origin,pose.points[0])<1e-9);
 assert.equal(head.meshPositions.length,bridge.headAttachment.localVertices.length);
}
const invalid=[
 ()=>conformSnakeBodyWithLocalSupport(null),
 ()=>conformSnakeBodyWithLocalSupport({}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{iterations:0}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{gravity:-1}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{gravity:Infinity}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{relaxation:0}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{follow:-.01}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{follow:1.1}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{previousLift:[0,1]}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{previousLift:Array.from({length:24},()=>NaN)}),
 ()=>conformSnakeBodyWithLocalSupport(demo,{terrain:{groundZ:0,rock:{height:10}}}),
];
for(const attempt of invalid)assert.throws(attempt,RangeError);
console.log('PASS V0.6B: '+count+' flat poses, moving contact zones, soft local drape, temporal response, head/skin compatibility and strict clearance');
