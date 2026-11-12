import assert from 'node:assert/strict';
import {
 buildNeutralSnakeTransparentMorphologyV09f,
 neutralSnakeRadiusV09f,NEUTRAL_SNAKE_MORPHOLOGY_V09F
} from '../src/ohm-core/snake-transparent-morphology-v09f.mjs';
import {inspectSnakeSelfClearanceV09d}
 from '../src/ohm-core/snake-self-clearance-v09d.mjs';

const F=Object.freeze,L=2.28/23;
function makePose(mode){
 let x=1.15,y=-.4;
 const points=[F({x,y,z:.13})];
 for(let i=1;i<24;i++){
  const theta=mode==='straight'?0:
   mode==='s_curve'?.5*Math.sin(i*.45):i*.055;
  x-=L*Math.cos(theta);y+=L*Math.sin(theta);
  points.push(F({x,y,z:.13}));
 }
 return F({segmentLength:L,bodyRadius:.13,points:F(points)});
}
assert.equal(NEUTRAL_SNAKE_MORPHOLOGY_V09F.skinApplied,false);
assert.ok(neutralSnakeRadiusV09f(.4)>neutralSnakeRadiusV09f(0),
 'trunk should gently thicken from the neck');
assert.ok(neutralSnakeRadiusV09f(.92)<
 neutralSnakeRadiusV09f(.7),'tail progressively narrows');
assert.ok(neutralSnakeRadiusV09f(1)<.02);
const outcomes=[];
for(const style of ['straight','s_curve','turn']){
 const pose=makePose(style),before=JSON.stringify(pose);
 const mesh=buildNeutralSnakeTransparentMorphologyV09f({pose});
 assert.equal(mesh.ok,true);
 assert.equal(mesh.version,'0.9F');
 assert.equal(mesh.bodyRingCount,139);
 assert.equal(mesh.headRingCount,9);
 assert.equal(mesh.radialSegments,12);
 assert.equal(mesh.sourceJointCount,24);
 assert.equal(mesh.sourceTotalLength,2.28);
 assert.equal(mesh.maximumSourceAnchorDrift,0);
 assert.equal(mesh.sourceBonePositionsUnchanged,true);
 assert.equal(mesh.sourceHeadColliderUnchanged,true);
 assert.equal(mesh.existingV09dCollisionGuardUnchanged,true);
 assert.equal(mesh.sourceSceneCollisionForNewMeshCertified,false);
 assert.equal(mesh.visibleTriangleMeshCollisionCertified,false);
 assert.equal(mesh.playerVisibleGameArtApproved,false);
 assert.equal(mesh.dynamicMorphologyTested,false);
 assert.equal(mesh.skinApplied,false);
 assert.equal(mesh.saveModified,false);
 assert.equal(mesh.privateSpeciesIntroduced,false);
 assert.ok(mesh.headWidestRadius>mesh.neckRadius*1.2,
  'distinct head width, not a single hose');
 assert.ok(mesh.midBodyRadius>mesh.neckRadius*1.2,
  'slender neck and moderately full middle body');
 assert.ok(mesh.tailTipRadius<mesh.midBodyRadius*.2,
  'tail must have a long gradual taper');
 assert.ok(mesh.bodyProjection.minimumWidthPx>1,
  'even the tail must not collapse at front-glass view');
 assert.ok(mesh.headProjection.minimumWidthPx>1);
 assert.deepEqual(mesh,buildNeutralSnakeTransparentMorphologyV09f({pose}),
  'morphology must be reproducible from identical source pose');
 assert.equal(JSON.stringify(pose),before,
  'visual morphology must never overwrite canonical source joints');
 const original=inspectSnakeSelfClearanceV09d({pose});
 assert.equal(original.checkedNonlocalPairs,190);
 outcomes.push({style,rings:mesh.bodyRingCount,
  headRings:mesh.headRingCount,neckRadius:mesh.neckRadius,
  midBodyRadius:mesh.midBodyRadius,tailRadius:mesh.tailTipRadius,
  minVisibleBodyWidth:mesh.bodyProjection.minimumWidthPx,
  safeSourceProxy:original.candidateClearanceAccepted});
}
assert.throws(()=>buildNeutralSnakeTransparentMorphologyV09f({
 pose:{...makePose('straight'),points:makePose('straight').points.slice(1)}
}),RangeError);
assert.throws(()=>buildNeutralSnakeTransparentMorphologyV09f({
 pose:makePose('straight'),sectionsPerBone:2
}),RangeError);
assert.throws(()=>neutralSnakeRadiusV09f(2),RangeError);
console.log('PASS V0.9F: 3 static source poses, 24 anchors unchanged, transparent slim neck and trunk, shaped head, progressive tail and single reproducible projection '+JSON.stringify(outcomes));
