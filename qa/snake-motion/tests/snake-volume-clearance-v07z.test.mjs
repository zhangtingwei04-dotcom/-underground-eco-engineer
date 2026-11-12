import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
 from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {buildTransparentHeadNeckBridgeV07r}
 from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';
import {buildSnakeGhostContinuityV07v}
 from '../src/ohm-core/snake-ghost-continuity-v07v.mjs';
import {buildSnakeHeadNeckSculptV07w}
 from '../src/ohm-core/snake-head-neck-sculpt-v07w.mjs';
import {buildSnakeNeckFollowV07x}
 from '../src/ohm-core/snake-neck-follow-v07x.mjs';
import {buildSnakeSlenderVolumeV07y}
 from '../src/ohm-core/snake-slender-volume-v07y.mjs';
import {inspectSnakeVolumeClearanceV07z,SNAKE_VOLUME_CLEARANCE_VERSION}
 from '../src/ohm-core/snake-volume-clearance-v07z.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07z_candidate_safety_and_optical_overlap',
 objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const terrain=Object.freeze({groundZ:0,rock:null,perch:null});
const ds=.19,start=[];
for(let i=0;i<=6;i++)start.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const degree of [90,120,150,180,210,240]){
 const a=degree*Math.PI/180,p=start.at(-1);
 start.push(Object.freeze({
  x:p.x+Math.cos(a)*ds,y:p.y+Math.sin(a)*ds,z:.135
 }));
}
const pose13=Object.freeze({
 bodyRadius:.13,segmentLength:ds,points:Object.freeze(start)
});
const step=2.28/23;
const pose24=Object.freeze({
 bodyRadius:.13,segmentLength:step,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:1.15-i*step,y:0,z:.135
 })))
});
function realSlender(pose){
 const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
  speciesId:'generic_snake',length:2.28
 }),pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 const ghost=buildSnakeGhostContinuityV07v({
  pose,head,volume,bridge
 });
 const sculpt=buildSnakeHeadNeckSculptV07w({
  pose,head,volume,ghost,scene,terrain
 });
 assert.equal(sculpt.ok,true,sculpt.reason);
 const neckFollow=buildSnakeNeckFollowV07x({
  pose,head,volume,sculpt,scene,terrain
 });
 assert.equal(neckFollow.ok,true,neckFollow.reason);
 const slender=buildSnakeSlenderVolumeV07y({
  pose,volume,neckFollow,scene,terrain
 });
 assert.equal(slender.ok,true,slender.reason);
 return slender;
}
for(const [name,pose] of [
 ['source_U_13',pose13],['source_straight_24',pose24]
]){
 const slender=realSlender(pose);
 const before=JSON.stringify({pose,slender});
 const z=inspectSnakeVolumeClearanceV07z({pose,slender});
 assert.equal(z.ok,true);
 assert.equal(z.version,SNAKE_VOLUME_CLEARANCE_VERSION);
 assert.equal(z.qualityAccepted,true,name);
 assert.equal(z.sourceJointCount,pose.points.length);
 assert.equal(z.checkedNonlocalBonePairs,
  pose.points.length===13?36:190);
 assert.ok(z.minimum3DClearance>.08);
 assert.ok(z.maximumSourceBendRadians<=.524);
 assert.equal(z.selfOverlapCandidates.length,0);
 assert.equal(z.tightBends.length,0);
 assert.equal(z.ringDirectionReversals.length,0);
 assert.equal(z.sourceBonesChanged,false);
 assert.equal(z.bodyMeshChanged,false);
 assert.equal(z.headChanged,false);
 assert.equal(z.visualDiagnosticOnly,true);
 assert.equal(z.fullTriangleSelfCollisionVerified,false);
 assert.equal(z.continuousSweptSelfCollisionVerified,false);
 assert.equal(z.realMusclePhysicsVerified,false);
 assert.equal(z.collisionCertifiedForPlayers,false);
 assert.equal(z.skinApplied,false);
 assert.equal(z.affectsSave,false);
 assert.equal(z.affectsEcology,false);
 assert.ok(Object.isFrozen(z)&&Object.isFrozen(z.selfOverlapCandidates));
 assert.deepEqual(z,inspectSnakeVolumeClearanceV07z({pose,slender}));
 assert.equal(JSON.stringify({pose,slender}),before);
}
function synthetic(points,radius=.024){
 const pose=Object.freeze({
  bodyRadius:.13,segmentLength:ds,
  points:Object.freeze(points.map(p=>Object.freeze(p)))
 });
 const rings=[];
 for(let i=0;i<49;i++){
  const segment=Math.min(11,Math.floor(i/4));
  const local=(i-segment*4)/4;
  const a=points[segment],b=points[segment+1];
  const center={
   x:a.x+(b.x-a.x)*local,
   y:a.y+(b.y-a.y)*local,
   z:a.z+(b.z-a.z)*local
  };
  rings.push(Object.freeze(Array.from({length:12},(_,j)=>{
   const theta=2*Math.PI*j/12;
   return Object.freeze({
    x:center.x,y:center.y+radius*Math.cos(theta),
    z:center.z+radius*Math.sin(theta)
   });
  })));
 }
 const bodyWorldRings=Object.freeze(rings);
 const slender=Object.freeze({
  version:'0.7Y',ok:true,sourceJointCount:13,
  sourceBonesModified:false,sourceHeadModified:false,
  originalHeadColliderStillAuthoritative:true,
  sameVerticesRenderedAndSampled:true,
  skinApplied:false,certifiedForGameplay:false,
  profileScales:Object.freeze(Array(49).fill(.74)),
  bodyWorldRings,
  bodyCandidate:Object.freeze({
   vertices:Object.freeze(rings.flat())
  })
 });
 return {pose,slender};
}
const directions=[[1,0,0],[0,1,0],[-1,0,0],[0,-1,0]];
function walk(start,steps){
 const points=[{...start}];
 for(const move of steps){
  const p=points.at(-1);
  points.push({
   x:p.x+move[0]*ds,
   y:p.y+move[1]*ds,
   z:p.z+move[2]*ds
  });
 }
 return points;
}
// The "plastic chain" failure fixture deliberately returns to already
// occupied world coordinates. It is NOT a playable snake posture.
const overlap=synthetic(walk({x:-.4,y:-.5,z:.2},[
 directions[0],directions[0],directions[0],
 directions[1],directions[1],
 directions[2],directions[2],directions[2],
 directions[3],directions[3],
 directions[0],directions[0]
]));
const a=inspectSnakeVolumeClearanceV07z(overlap);
assert.equal(a.ok,true);
assert.equal(a.qualityAccepted,false,
 'nonlocal 3D capsule overlap must not be called a harmless image effect');
assert.ok(a.selfOverlapCandidates.length>=1);
assert.ok(a.minimum3DClearance<0);
assert.ok(a.selfOverlapCandidates.some(p=>p.sourceBoneB-
 p.sourceBoneA>=4));
assert.equal(a.fullTriangleSelfCollisionVerified,false,
 'capsule intersection must not pretend triangles are proven colliding');

// In this FRONT-GLASS 2.5D camera: screen_y≈53.75*y - 163*z.
// Change real world Y and Z together while leaving projected Y constant,
// giving SCREEN overlap but large positive 3D separation.
const dz=ds/Math.sqrt(1+(163/53.75)**2);
const dy=dz*163/53.75;
const optical=synthetic(walk({x:-.4,y:-.8,z:.2},[
 directions[0],directions[0],directions[0],
 [0,dy/ds,dz/ds],[0,dy/ds,dz/ds],[0,dy/ds,dz/ds],
 directions[2],directions[2],directions[2],
 directions[2],directions[2],directions[2]
]));
const b=inspectSnakeVolumeClearanceV07z({...optical,maxBendRadians:1.8});
assert.equal(b.ok,true);
assert.equal(b.qualityAccepted,true,
 'pure depth and camera overlap should not trigger body penetration flag');
assert.equal(b.selfOverlapCandidates.length,0);
assert.ok(b.projectionOnlyPairs.length>=1,
 'same image area may represent well-separated 3D world segments');
assert.ok(b.projectionOnlyPairs.every(x=>
 x.projectedGapPixels<=0&&x.candidateCapsuleClearance>.008));

// A deliberately too-sharp articulation should be reported, not fixed by
// secretly stretching any source length or altering original head collider.
const kink=synthetic(walk({x:-1.2,y:-.5,z:.2},[
 [1,0,0],...Array(11).fill([
 Math.cos(.75),Math.sin(.75),0
 ])
]));
const c=inspectSnakeVolumeClearanceV07z({
 ...kink,maxBendRadians:.6
});
assert.equal(c.ok,true);
assert.equal(c.qualityAccepted,false);
assert.ok(c.tightBends.some(v=>
 v.jointIndex===1&&v.angleRadians>.7));
assert.ok(c.maximumSourceBendRadians>.7);
const flippedRings=synthetic(pose13.points);
const fr=flippedRings.slender.bodyWorldRings.slice();
const index=12,center=pose13.points[index/4];
fr[index]=Object.freeze(fr[index].map(p=>Object.freeze({
 x:2*center.x-p.x,y:2*center.y-p.y,z:2*center.z-p.z
})));
const ff=inspectSnakeVolumeClearanceV07z({
 pose:flippedRings.pose,
 slender:{
  ...flippedRings.slender,
  bodyWorldRings:fr,
  bodyCandidate:{vertices:fr.flat()}
 }
});
assert.equal(ff.ok,true);
assert.equal(ff.qualityAccepted,false);
assert.ok(ff.ringDirectionReversals.length>=1);
for(const bad of [
 {maxBendRadians:.3},{minBoneIndexGap:2},
 {collisionTolerance:-.01},{projectedPixelMargin:40}
])assert.throws(()=>inspectSnakeVolumeClearanceV07z({
 pose:pose13,slender:realSlender(pose13),...bad
}),RangeError);
const faulty=realSlender(pose13);
const badVertices=faulty.bodyCandidate.vertices.slice();
badVertices[0]={...badVertices[0],x:badVertices[0].x+.04};
assert.throws(()=>inspectSnakeVolumeClearanceV07z({
 pose:pose13,slender:{
  ...faulty,bodyCandidate:{...faulty.bodyCandidate,vertices:badVertices}
 }
}),RangeError,'reject a visible shell/candidate collision mismatch');
const src=readFileSync(new URL(
 '../src/ohm-core/snake-volume-clearance-v07z.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/inspectSnakeVolumeClearanceV07z/);
assert.match(html,/qaV07zQuality/);
assert.doesNotMatch(src,/localStorage|indexedDB|fetch|Math[.]random|saveGame/);
console.log('PASS V0.7Z: 13/24 source 3D capsule+ring diagnostics, synthetic self-overlap, camera-only overlap distinguished, sharp bend/ring flip caught, no skin/player physics claims');
