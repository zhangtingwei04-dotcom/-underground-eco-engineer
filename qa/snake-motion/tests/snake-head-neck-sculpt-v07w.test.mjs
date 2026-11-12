import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 makeSnakeHeadAttachment,poseSnakeHeadAttachment
} from '../src/ohm-core/snake-head-attachment.mjs';
import {buildTransparentBodyVolumeV07q}
 from '../src/ohm-core/snake-transparent-volume-v07q.mjs';
import {buildTransparentHeadNeckBridgeV07r}
 from '../src/ohm-core/snake-transparent-head-neck-v07r.mjs';
import {buildSnakeGhostContinuityV07v}
 from '../src/ohm-core/snake-ghost-continuity-v07v.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 SNAKE_HEAD_NECK_SCULPT_VERSION,buildSnakeHeadNeckSculptV07w
} from '../src/ohm-core/snake-head-neck-sculpt-v07w.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07w_authored_source_and_candidate_head',
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
const ds=.19,points=[];
for(let i=0;i<=6;i++)points.push(Object.freeze({
 x:.65,y:-1.32+i*ds,z:.135
}));
for(const deg of [90,120,150,180,210,240]){
 const t=deg*Math.PI/180,p=points.at(-1);
 points.push(Object.freeze({
  x:p.x+Math.cos(t)*ds,y:p.y+Math.sin(t)*ds,z:.135
 }));
}
const pose13=Object.freeze({
 bodyRadius:.13,segmentLength:ds,points:Object.freeze(points)
});
const pose24=Object.freeze({
 bodyRadius:.13,segmentLength:2.28/23,
 points:Object.freeze(Array.from({length:24},(_,i)=>Object.freeze({
  x:1.15-i*(2.28/23),y:0,z:.135
 })))
});
function sources(pose,speciesId='generic_snake'){
 const head=poseSnakeHeadAttachment(makeSnakeHeadAttachment({
  speciesId,length:pose.segmentLength*(pose.points.length-1)
 }),pose.points);
 const volume=buildTransparentBodyVolumeV07q({pose});
 const bridge=buildTransparentHeadNeckBridgeV07r({
  pose,head,volume
 });
 const ghost=speciesId==='generic_snake'?
  buildSnakeGhostContinuityV07v({pose,head,volume,bridge}):null;
 return {pose,head,volume,bridge,ghost,scene,terrain};
}
let valid13=null;
for(const [name,pose] of [['13_rearing',pose13],['24_ground',pose24]]){
 const source=sources(pose),initial=JSON.stringify(source);
 const v=buildSnakeHeadNeckSculptV07w(source);
 if(name==='13_rearing')valid13=source;
 assert.equal(v.version,SNAKE_HEAD_NECK_SCULPT_VERSION);
 assert.equal(v.ok,true,v.reason);
 assert.equal(v.reason,null);
 assert.equal(v.sourceJointCount,pose.points.length);
 assert.equal(v.sourceHeadVersion,'0.1');
 assert.equal(v.sourceVolumeVersion,'0.7Q');
 assert.equal(v.sourceGhostVersion,'0.7V');
 assert.equal(v.camera,'V0.7G_front_glass');
 assert.equal(v.visibleCollisionMeshIdentical,true);
 assert.equal(v.headAndSocketContinuous,true);
 assert.equal(v.candidateHeadRenderVertexCount,160);
 assert.equal(v.candidate.headRingCount,10);
 assert.equal(v.candidate.neckRingCount,11);
 assert.equal(v.candidate.ringCount,20);
 assert.equal(v.candidate.radialSegments,16);
 assert.equal(v.candidate.vertices.length,320);
 assert.equal(v.candidate.triangles.length,636);
 assert.equal(v.candidateCollisionChecks,956);
 assert.equal(v.headProjection.projectedRings.length,10);
 assert.equal(v.collarProjection.projectedRings.length,11);
 assert.ok(v.headProjection.minimumWidth>.035);
 assert.ok(v.collarProjection.minimumWidth>.035);
 assert.equal(v.candidateSculptNotBiologicalAnatomy,true);
 assert.equal(v.originalHeadColliderStillRunsUpstream,true);
 assert.equal(v.sourceHeadModified,false);
 assert.equal(v.sourceBoneModified,false);
 assert.equal(v.sourceRockAuthorityUnchanged,true);
 assert.equal(v.fullSweptCollisionVerified,false);
 assert.equal(v.modelCertifiedForPlayers,false);
 assert.equal(v.realContactPhysicsVerified,false);
 assert.equal(v.skinApplied,false);
 assert.equal(v.playableCaveAuthorized,false);
 assert.equal(v.affectsEcology,false);
 assert.equal(v.affectsSave,false);
 assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.candidate.vertices)&&
  Object.isFrozen(v.candidate.triangles));
 // Mesh starts at the thin NOSE, ends at the neck socket, and uses
 // exactly the same world vertices as the visible head and collar.
 const headForward=source.head.frame.forward;
 const distForward=p=>(p.x-source.head.origin.x)*headForward.x+
  (p.y-source.head.origin.y)*headForward.y+
  (p.z-source.head.origin.z)*headForward.z;
 assert.ok(distForward(v.candidate.vertices[0])>0,
  'candidate solid must start at snout, not loop abruptly from nose to rear');
 assert.ok(distForward(v.candidate.vertices[144])<0,
  'candidate head ring before neck must be behind head center');
 for(let ring=0;ring<10;ring++)
  for(let j=0;j<16;j++){
   const bodyIndex=(9-ring)*16+j;
   const visible=v.headProjection.projectedRings[ring][j];
   const world=v.candidate.vertices[bodyIndex];
   assert.deepEqual(visible,projectSnakeFrontGlassPointV07g(world),
    'head visual vertex and candidate collider MUST use SAME XYZ');
  }
 const neckStart=v.candidate.vertices.slice(144,160);
 assert.ok(neckStart.some((p,i)=>Math.hypot(
  p.x-source.head.meshPositions[i].x,
  p.y-source.head.meshPositions[i].y,
  p.z-source.head.meshPositions[i].z
 )>.001),'new candidate has genuinely redesigned source head rear ring');
 assert.deepEqual(v,buildSnakeHeadNeckSculptV07w(source),
  'same canonical source must create exactly the same candidate');
 assert.equal(JSON.stringify(source),initial,
  'candidate may not change old head collider, bones, scene or terrain');
}
const s=valid13;
assert.throws(()=>buildSnakeHeadNeckSculptV07w({
 ...s,head:{...s.head,speciesId:'hognose_snake'}
}),RangeError,'no fake species-validated sculpt');
assert.throws(()=>buildSnakeHeadNeckSculptV07w({
 ...s,pose:{...s.pose,segmentLength:s.pose.segmentLength+.01}
}),RangeError);
assert.throws(()=>buildSnakeHeadNeckSculptV07w({
 ...s,ghost:{...s.ghost,headColliderMeshIdentical:false}
}),RangeError);
assert.throws(()=>buildSnakeHeadNeckSculptV07w({
 ...s,ghost:{...s.ghost,headWorldRings:
  s.ghost.headWorldRings.map((r,i)=>i===0?[
   {...r[0],x:r[0].x+.01},...r.slice(1)
  ]:r)}
}),RangeError);
for(const neckRings of [0,4,15,NaN])
 assert.throws(()=>buildSnakeHeadNeckSculptV07w({
  ...s,neckRings
 }),RangeError);
const colliding=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{
  id:'head_restricted_stone',kind:'rock_overhang',x:564,y:23,
  width:65,depth:60,height:110,transmissionPermille:0
 }
});
const blocked=buildSnakeHeadNeckSculptV07w({...s,scene:colliding});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,
 'v07w_candidate_intersects_authoritative_rock_xy');
assert.equal(blocked.candidate,null);
assert.equal(blocked.headProjection,null);
assert.equal(blocked.modelCertifiedForPlayers,false);
const buried=buildSnakeHeadNeckSculptV07w({
 ...s,terrain:{...terrain,groundZ:.13}
});
assert.equal(buried.ok,false);
assert.equal(buried.reason,
 'v07w_candidate_below_authoritative_ground');
assert.equal(buried.candidate,null);
const file=readFileSync(new URL(
 '../src/ohm-core/snake-head-neck-sculpt-v07w.mjs',import.meta.url),
 'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildSnakeHeadNeckSculptV07w/);
assert.match(html,/qaV07wSourceHead/);
assert.doesNotMatch(file,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7W: 10-ring tapered 3D head+11-neck shared visible/candidate mesh, 956 sampled world collision checks, 13/24 source bones unchanged, rocks/ground fail closed, no skin, physics or game approval');
