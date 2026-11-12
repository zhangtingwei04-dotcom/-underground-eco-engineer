import assert from 'node:assert/strict';
import {
 SNAKE_GROWTH_MOTION_VERSION,createSnakeGrowthMotionBridge,
 sampleSnakeGrowthMotionFrame
} from '../src/ohm-core/snake-growth-motion-adapter.mjs';
import {inspectUniversalSnakePose} from '../src/ohm-core/snake-skeleton-motion.mjs';
import {inspectSnakeTerrainClearance} from '../src/ohm-core/snake-terrain-contact.mjs';

assert.equal(SNAKE_GROWTH_MOTION_VERSION,'0.1');
const species=['corn_snake','hognose_snake','generic_snake'];
const lengths=[.32,.6,1.2,1.9];
let frames=0;
for(const speciesId of species){
 let previous=null;
 for(const bodyLength of lengths){
  // Stage is metadata; a species may have varied sizes at the same stage.
  const bridge=createSnakeGrowthMotionBridge({speciesId,bodyLength,
    growthStage:'juvenile'});
  assert.equal(bridge.boneCount,24);
  assert.equal(bridge.rig.boneCount,24);
  assert.equal(bridge.motionParameters.length,bodyLength);
  assert.equal(bridge.rig.length,bodyLength);
  assert.ok(bridge.bodyRadius>0&&bridge.bodyRadius<bodyLength*.13);
  assert.ok(bridge.rig.vertices.length>1000);
  assert.equal(Object.isFrozen(bridge),true);
  if(previous){
   assert.deepEqual(bridge.rig.uv,previous.rig.uv,
     'UV coordinates must remain stable across body growth');
   assert.equal(bridge.rig.uv.length,previous.rig.uv.length);
   assert.ok(bridge.motionParameters.length>previous.motionParameters.length);
  }
  previous=bridge;
  const sameSizeDifferentStage=createSnakeGrowthMotionBridge({
    speciesId,bodyLength,growthStage:'adult'
  });
  assert.equal(sameSizeDifferentStage.bodyRadius,bridge.bodyRadius,
    'age stage does not forcibly resize a snake');
  assert.deepEqual(sameSizeDifferentStage.rig.vertices,bridge.rig.vertices);
  for(const mode of ['ground','explore','supported']){
   for(const time of [0,.5,2.1]){
    const frame=sampleSnakeGrowthMotionFrame(bridge,{mode,time});
    frames++;
    assert.equal(frame.pose.points.length,24);
    assert.equal(frame.mesh.positions.length,bridge.rig.vertices.length);
    assert.equal(frame.mesh.uv,bridge.rig.uv);
    assert.equal(frame.head.speciesId,speciesId);
    assert.equal(frame.head.meshPositions.length,bridge.headAttachment.localVertices.length);
    assert.strictEqual(frame.head.uv,bridge.headAttachment.uv);
    assert.ok(Math.abs(frame.head.origin.x-frame.pose.points[0].x)<1e-8);
    assert.ok(Math.abs(frame.head.origin.y-frame.pose.points[0].y)<1e-8);
    assert.ok(Math.abs(frame.head.origin.z-frame.pose.points[0].z)<1e-8);
    assert.equal(frame.pose.mode,mode);
    const inspect=inspectUniversalSnakePose(frame.pose);
    assert.equal(inspect.ok,true,speciesId+' '+bodyLength+' '+mode+' t='+time);
    assert.ok(inspect.maxLengthError<1e-8);
    assert.ok(frame.mesh.positions.every(v=>
      Number.isFinite(v.x)&&Number.isFinite(v.y)&&Number.isFinite(v.z)
    ));
   }
  }
 }
}
for(const speciesId of species){
 for(const length of [.6,1.4]){
  const bridge=createSnakeGrowthMotionBridge({speciesId,bodyLength:length});
  const frame=sampleSnakeGrowthMotionFrame(bridge,{
    terrain:{groundZ:0,rock:null,perch:null},mode:'ground',time:0.6
  });
  assert.equal(frame.poseSource,'heightfield_approximation');
  assert.equal(inspectSnakeTerrainClearance(frame.pose,{samplesPerBone:12}).ok,true);
  assert.equal(frame.mesh.uv,bridge.rig.uv);
 }
}
const headShapeVariant=createSnakeGrowthMotionBridge({
  speciesId:'hognose_snake',bodyLength:1.4,
  headFactors:{length:1.1,width:.88,height:1.06}
});
const defaultSameSize=createSnakeGrowthMotionBridge({
  speciesId:'hognose_snake',bodyLength:1.4
});
assert.deepEqual(headShapeVariant.headShapeFactors,{length:1.1,width:.88,height:1.06});
assert.equal(headShapeVariant.bodyLength,defaultSameSize.bodyLength);
assert.equal(headShapeVariant.motionParameters.length,defaultSameSize.motionParameters.length);
assert.deepEqual(headShapeVariant.rig.uv,defaultSameSize.rig.uv);
assert.deepEqual(headShapeVariant.rig.vertices,defaultSameSize.rig.vertices,
  'head growth must not corrupt trunk mesh');
assert.notDeepEqual(headShapeVariant.headAttachment.localVertices,
  defaultSameSize.headAttachment.localVertices);
const turned=sampleSnakeGrowthMotionFrame(headShapeVariant,{
  headLook:{yaw:.2,pitch:.1,tongueExtension:1},mode:'explore',time:.2
});
assert.ok(turned.head.tongue,'tongue must follow head frame');
assert.equal(turned.head.neck.correctionRequired,true);
assert.throws(()=>createSnakeGrowthMotionBridge({
  headFactors:{length:0,width:1,height:1}
}),RangeError);
for(const speciesId of species){
  const bridge=createSnakeGrowthMotionBridge({speciesId,bodyLength:1.4});
  const terrain={groundZ:0,rock:{x:-.7,y:0,radius:.45,height:.09},perch:null};
  const legacy=sampleSnakeGrowthMotionFrame(bridge,{mode:'supported',time:.23,terrain});
  const softened=sampleSnakeGrowthMotionFrame(bridge,{
    mode:'supported',time:.23,terrain,bodySupport:'local-v06b'
  });
  assert.equal(legacy.poseSource,'heightfield_approximation');
  assert.equal(softened.poseSource,'terrain_driven_local_support_v06b');
  assert.equal(softened.pose.version,'0.6B');
  assert.equal(softened.pose.source,'heightfield_contacts_not_fixed_body_indices');
  assert.equal(softened.pose.lift.length,24);
  assert.equal(softened.mesh.uv,bridge.rig.uv);
  assert.equal(softened.head.speciesId,speciesId);
  assert.ok(softened.pose.points.every(p=>Number.isFinite(p.z)));
  assert.equal(inspectSnakeTerrainClearance(softened.pose).ok,true);
  assert.notDeepEqual(softened.pose.points,legacy.pose.points,
    'explicit opt-in changes shape but leaves the old path available');
}
assert.throws(()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{
  bodySupport:'unsupported-option'
}),RangeError);
const invalid=[
 ()=>createSnakeGrowthMotionBridge({speciesId:'__proto__'}),
 ()=>createSnakeGrowthMotionBridge({speciesId:'unavailable'}),
 ()=>createSnakeGrowthMotionBridge({bodyLength:0}),
 ()=>createSnakeGrowthMotionBridge({bodyLength:Infinity}),
 ()=>createSnakeGrowthMotionBridge({bodyLength:NaN}),
 ()=>createSnakeGrowthMotionBridge({bodyLength:5.1}),
 ()=>createSnakeGrowthMotionBridge({growthStage:'ancient'}),
 ()=>createSnakeGrowthMotionBridge({boneCount:1}),
 ()=>createSnakeGrowthMotionBridge({boneCount:64,ringCount:97}),
 ()=>sampleSnakeGrowthMotionFrame(null),
 ()=>sampleSnakeGrowthMotionFrame(createSnakeGrowthMotionBridge(),{mode:'fly'})
];
for(const fn of invalid)assert.throws(fn,RangeError);
assert.equal(createSnakeGrowthMotionBridge().stagePolicy,
 'stage_is_metadata_not_an_age_to_length_formula');
console.log('PASS growth/motion bridge: '+frames+' frames, 6 flat terrain contacts, 3 species, 4 sizes, UV/length preservation and invalid-input guards');
