import assert from 'node:assert/strict';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {startSnakeVariableSizeMotionV09t,
 advanceSnakeVariableSizeMotionV09t}
 from '../src/ohm-core/snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u,
 inspectSnakeSizedMeshStepV09u}
 from '../src/ohm-core/snake-sized-mesh-motion-v09u.mjs';
import {
 createSnakeNeutralPixelAtlasV10a,
 bindSnakePixelSurfaceV10a,
 inspectSnakePixelUVStabilityV10a
} from '../src/ohm-core/snake-pixel-surface-bridge-v10a.mjs';

const F=Object.freeze;
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v10a_neutral_uv_stability',objects:[]
});
const terrain=F({groundZ:0,rock:null,perch:null});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),bodyRadius:.13,segmentLength:2.28/23
});
const before=JSON.stringify({scene,terrain,canonicalPose});
const atlas=createSnakeNeutralPixelAtlasV10a({seed:2703});
const identical=createSnakeNeutralPixelAtlasV10a({seed:2703});
const different=createSnakeNeutralPixelAtlasV10a({seed:2704});
assert.equal(atlas.version,'1.0A');
assert.equal(atlas.width,128);
assert.equal(atlas.height,64);
assert.equal(atlas.rgba.length,128*64*4);
assert.equal(atlas.nearSeamRowEqual,true);
assert.equal(atlas.wrapV,'REPEAT');
assert.equal(atlas.filter,'NEAREST');
assert.deepEqual(atlas.rgba,identical.rgba);
assert.notDeepEqual(atlas.rgba,different.rgba);
for(let x=0;x<128;x++){
 assert.deepEqual(atlas.sampleRGBA(x,0),atlas.sampleRGBA(x,63),
  'circumference vertical pixel seam must remain identical');
}
assert.throws(()=>atlas.sampleRGBA(0,64),RangeError);
assert.throws(()=>createSnakeNeutralPixelAtlasV10a({
 width:123}),RangeError);
assert.throws(()=>createSnakeNeutralPixelAtlasV10a({
 neutralPalette:{base:'invalid',stripe:'#000000',
  accent:'#000000',belly:'#000000'}}),RangeError);

// All four independent V0.9T bones/radii render through identical
// UV indices; material choice does NOT change locomotion or collider.
const results=[];
for(const stage of [0,1,2,3]){
 const source=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene,terrain,
  stageProgress:stage
 });
 assert.equal(source.phase,'moving_sized');
 const initialJSON=JSON.stringify(source);
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState:source,scene,terrain
 });
 assert.equal(mesh.ok,true);
 const transparent=bindSnakePixelSurfaceV10a({
  renderCandidate:mesh,mode:'transparent'
 });
 const flat=bindSnakePixelSurfaceV10a({
  renderCandidate:mesh,mode:'flat_debug'
 });
 const pixel=bindSnakePixelSurfaceV10a({
  renderCandidate:mesh,atlas,mode:'pixel_debug'
 });
 assert.equal(transparent.ok,true);
 assert.equal(flat.ok,true);
 assert.equal(pixel.ok,true);
 assert.equal(transparent.material.alpha,.32);
 assert.equal(pixel.material.alpha,1);
 assert.equal(pixel.material.nearestPixelFiltering,true);
 assert.strictEqual(pixel.material.texture,atlas);
 assert.strictEqual(pixel.mesh,mesh.mesh);
 assert.strictEqual(pixel.positions,mesh.mesh.positions);
 assert.strictEqual(pixel.uv,mesh.mesh.uv);
 assert.strictEqual(pixel.triangles,mesh.mesh.triangles);
 assert.strictEqual(pixel.collisionShell,mesh.collisionShell);
 assert.strictEqual(pixel.skeletonPose,source.pose);
 assert.strictEqual(pixel.sourceLocalRadii,
  source.pose.radiiWorldUnits);
 assert.equal(pixel.geometryModified,false);
 assert.equal(pixel.motionSourceAuthorizedHere,false);
 assert.equal(pixel.formalGameAssetInstalled,false);
 assert.equal(pixel.formalGameSaveModified,false);
 assert.equal(pixel.renderingWasNotActuallyExecuted,true);
 assert.equal(pixel.noSpeciesPatternsExposedInPublicQA,true);
 assert.equal(flat.mesh.vertexCount,1617);
 assert.equal(pixel.mesh.triangleCount,3216);
 assert.strictEqual(flat.positions,pixel.positions);
 assert.strictEqual(flat.collisionShell,pixel.collisionShell);
 assert.equal(pixel.uv.length,1617);
 const uvJSON=JSON.stringify(pixel.uv);
 let current=source,last=mesh,lastMaterial=pixel,
  movedAtLeastOne=false;
 for(let k=0;k<8;k++){
  const next=advanceSnakeVariableSizeMotionV09t({
   state:current,scene,terrain,turnRadians:.002
  });
  assert.equal(next.phase,'moving_sized');
  const step=inspectSnakeSizedMeshStepV09u({
   previousState:current,nextState:next,
   scene,terrain,turnRadians:.002
  });
  assert.equal(step.ok,true,
   'V1.0A stage '+stage+' movement '+k+' '+step.reason);
  const nextMesh=buildSnakeSizedMeshCandidateV09u({
   sizedState:next,scene,terrain
  });
  assert.equal(nextMesh.ok,true);
  const nextMaterial=bindSnakePixelSurfaceV10a({
   renderCandidate:nextMesh,atlas,mode:'pixel_debug'
  });
  assert.equal(nextMaterial.ok,true);
  const quality=inspectSnakePixelUVStabilityV10a({
   from:lastMaterial,to:nextMaterial
  });
  assert.equal(quality.ok,true,
   'moving snake material must use identical UV+atlas');
  assert.equal(quality.meshUVIdentical,true);
  assert.equal(quality.atlasReferenceIdentical,true);
  assert.equal(quality.boneLengthsFrozen,true);
  assert.equal(quality.localRadiiFrozen,true);
  assert.equal(quality.noWorldSpacePatternSwimming,true);
  if(quality.geometryReallyMoved)movedAtLeastOne=true;
  assert.equal(JSON.stringify(nextMaterial.uv),uvJSON);
  assert.strictEqual(nextMaterial.collisionShell,nextMesh.collisionShell);
  assert.equal(JSON.stringify(next.pose.boneLengths),
   JSON.stringify(source.pose.boneLengths));
  assert.equal(JSON.stringify(next.pose.radiiWorldUnits),
   JSON.stringify(source.pose.radiiWorldUnits));
  current=next;last=nextMesh;lastMaterial=nextMaterial;
 }
 assert.ok(movedAtLeastOne);
 assert.equal(JSON.stringify(source),initialJSON);
 results.push({stage,frames:current.verifiedFrames,
  sourceBodyLengthWorld:
   source.pose.boneLengths.reduce((a,b)=>a+b,0),
  meshVertices:last.mesh.vertexCount,
  uvFrozen:true,textureFixed:true,
  unchangedCollisionShell:true});
}
assert.deepEqual(results.map(x=>x.frames),[8,8,8,8]);

// No pixel material should cause two distinct species/body meshes to
// silently share a changing UV or sneak a new collider into gameplay.
const s=startSnakeVariableSizeMotionV09t({
 canonicalSourcePose:canonicalPose,scene,terrain,
 stageProgress:2
});
const target=buildSnakeSizedMeshCandidateV09u({
 sizedState:s,scene,terrain
});
const good=bindSnakePixelSurfaceV10a({
 renderCandidate:target,atlas,mode:'pixel_debug'
});
const alteredMesh=F({...target.mesh,
 uv:F(target.mesh.uv.map((x,i)=>
  i===135?F({u:999,v:0}):x))});
const badUV=bindSnakePixelSurfaceV10a({
 renderCandidate:F({...target,mesh:alteredMesh}),
 atlas,mode:'pixel_debug'
});
assert.equal(badUV.ok,false);
assert.equal(badUV.reason,'unverified_or_incompatible_shared_mesh');
const badSeam=bindSnakePixelSurfaceV10a({
 renderCandidate:F({...target,headNeckSocketWelded:false}),
 atlas,mode:'pixel_debug'
});
assert.equal(badSeam.ok,false);
const badAtlas=bindSnakePixelSurfaceV10a({
 renderCandidate:target,
 atlas:F({...atlas,nearSeamRowEqual:false}),
 mode:'pixel_debug'
});
assert.equal(badAtlas.ok,false);
assert.equal(badAtlas.reason,'invalid_or_unstable_pixel_atlas');
const wrongMode=bindSnakePixelSurfaceV10a({
 renderCandidate:target,atlas,mode:'skin_is_always_on'
});
assert.equal(wrongMode.ok,false);
const flat=bindSnakePixelSurfaceV10a({
 renderCandidate:target,mode:'flat_debug'
});
const notSameMode=inspectSnakePixelUVStabilityV10a({
 from:good,to:flat
});
assert.equal(notSameMode.ok,false);
const replacedAtlas=bindSnakePixelSurfaceV10a({
 renderCandidate:target,atlas:identical,mode:'pixel_debug'
});
const differentReference=inspectSnakePixelUVStabilityV10a({
 from:good,to:replacedAtlas
});
assert.equal(differentReference.ok,false,
 'per-frame re-created texture reference must be refused');
assert.equal(differentReference.atlasReferenceIdentical,false);
assert.equal(JSON.stringify({scene,terrain,canonicalPose}),before);
console.log('PASS V1.0A detachable NEAREST neutral pixel atlas with stable UV and 4-stage 24-joint moving mesh, unchanged collision and no IP/game-save leak');
console.log(JSON.stringify({
 results,totalMotionFrames:32,
 atlasSize:'128x64',
 seamRowsEqual:true,
 meshVertices:1617,meshTriangles:3216,
 modes:['transparent','flat_debug','pixel_debug'],
 malformedUVRejected:true,brokenHeadSeamRejected:true,
 unstableAtlasRejected:true,
 productionPixelArtNotYetRendered:true,
 speciesPatternPrivate:true,
 formalGameAndSaveUntouched:true
}));
