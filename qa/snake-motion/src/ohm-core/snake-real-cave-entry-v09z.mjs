/**
 * Project OHM V0.9Z PUBLIC NEUTRAL — ACTUAL 3D SOLID cave walls/roof,
 * explicit open mouth, and head-first V0.9T/U/S stage-sized movement
 * through the entrance until the last 1617th mesh vertex is inside.
 *
 * IMPORTANT: first engineering version: a STRAIGHT rectangular tunnel.
 * NOT curved-cave navigation, soft soil displacement, forces, friction,
 * exact continuous triangle collision, a natural cave art asset, or
 * gameplay integration. Actual cave solid meshes (floor, two walls,
 * roof, back plate) are explicit, not an empty abstract cover AABB.
 *
 * Every candidate movement is source replay-authenticated by V0.9U
 * with V0.9T authoritative 24 joints, stage-specific bone lengths,
 * and ALL head/body 3216 triangles. This module adds conservative
 * swept-triangle-vs-solid-AABB checks for actual roof/walls/floor/back.
 * This is a conservative broadphase, i.e. can hold even without
 * an exact triangle-solid contact; NEVER claims contact resolution.
 */
import {advanceSnakeVariableSizeMotionV09t,
 advanceSnakeReverseStepV09y}
 from './snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u,
 inspectSnakeSizedMeshStepV09u}
 from './snake-sized-mesh-motion-v09u.mjs';
import {inspectSnakeReverseMeshStepV09y}
 from './snake-reverse-hide-movement-v09y.mjs';

export const SNAKE_REAL_CAVE_ENTRY_V09Z_VERSION='0.9Z';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const idOK=s=>typeof s==='string'&&
 /^[a-z][a-z0-9_-]{0,63}$/.test(s);
function fail(reason,detail={}){
 return F({version:'0.9Z',ok:false,reason,...detail,
  actualGameSourceFramesCommitted:0,
  exactContinuous3DMeshCollisionCertified:false,
  physicalForcesCertified:false,
  formalWorldSaveModified:false,skinApplied:false});
}
function boxFaces(s){
 const {x0,x1,y0,y1,z0,z1}=s;
 const pts=F([
  F({x:x0,y:y0,z:z0}),F({x:x1,y:y0,z:z0}),
  F({x:x1,y:y1,z:z0}),F({x:x0,y:y1,z:z0}),
  F({x:x0,y:y0,z:z1}),F({x:x1,y:y0,z:z1}),
  F({x:x1,y:y1,z:z1}),F({x:x0,y:y1,z:z1})
 ]);
 const triangles=F([
  0,2,1, 0,3,2, 4,5,6, 4,6,7,
  0,1,5, 0,5,4, 1,2,6, 1,6,5,
  2,3,7, 2,7,6, 3,0,4, 3,4,7
 ]);
 return F({name:s.id,positions:pts,triangles,
  triangleCount:12,vertexCount:8,
  solid:true,collider:'solid_aabb_mesh'});
}
const rect=(id,x0,x1,y0,y1,z0,z1)=>F({
 id,x0,x1,y0,y1,z0,z1
});
function insideSolidAabb(q,box,eps=0){
 return q.x>=box.x0-eps&&q.x<=box.x1+eps&&
  q.y>=box.y0-eps&&q.y<=box.y1+eps&&
  q.z>=box.z0-eps&&q.z<=box.z1+eps;
}
function triangleSweptBounds(A,B,ia,ib,ic){
 let x0=Infinity,x1=-Infinity,y0=Infinity,
  y1=-Infinity,z0=Infinity,z1=-Infinity;
 for(const i of [ia,ib,ic]){
  for(const q of [A[i],B[i]]){
   x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);
   y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);
   z0=Math.min(z0,q.z);z1=Math.max(z1,q.z);
  }
 }
 return {x0,x1,y0,y1,z0,z1};
}
function overlaps(a,b,eps=.0002){
 return a.x0<=b.x1+eps&&a.x1>=b.x0-eps&&
  a.y0<=b.y1+eps&&a.y1>=b.y0-eps&&
  a.z0<=b.z1+eps&&a.z1>=b.z0-eps;
}
function validCave(c,scene){
 return c?.version==='0.9Z'&&
  c.sceneId===scene?.sceneId&&
  c.revision===scene?.revision&&
  c.solids?.length===5&&c.solidMeshes?.length===5&&
  finite(c.mouthX)&&finite(c.backX)&&
  finite(c.centerY)&&finite(c.halfWidth)&&
  finite(c.floorZ)&&finite(c.roofZ)&&
  c.backX<c.mouthX&&
  c.roofZ>c.floorZ&&
  c.solids.every(s=>s.x0<s.x1&&s.y0<s.y1&&s.z0<s.z1);
}
/** A real closed-wall straight tunnel with OPEN ENTRANCE at x=mouth.
 * Cave body extends toward NEGATIVE x. Back solid stops entering the
 * rock beyond x=backX. Outer glass/source rocks are still V0.9T-owned.
 *
 * This is a procedural geometry generator, NOT a rendered screenshot.
 */
export function createSnakeSolidCaveV09z({
 scene,id='neutral_straight_hide',mouthX=-.68,
 backX=-3.85,centerY=0,halfWidth=.34,
 floorZ=0,roofZ=.43,wallThickness=.12,roofThickness=.14
}={}){
 if(!scene||!idOK(id)||
  ![mouthX,backX,centerY,halfWidth,floorZ,roofZ,
   wallThickness,roofThickness].every(finite)||
  mouthX>1||mouthX< -2||backX<-3.95||
  backX>mouthX-.4||halfWidth<.10||halfWidth>.60||
  Math.abs(centerY)>1.1||
  floorZ<-.1||floorZ>.1||
  roofZ<floorZ+.18||roofZ>1.1||
  wallThickness<.05||wallThickness>.3||
  roofThickness<.05||roofThickness>.3)
  throw new RangeError('v09z_invalid_cave_dimensions');
 const top=roofZ+roofThickness;
 const left=centerY-halfWidth,right=centerY+halfWidth;
 const solids=F([
  rect('left_wall',backX,mouthX,
   left-wallThickness,left,floorZ-.06,top),
  rect('right_wall',backX,mouthX,
   right,right+wallThickness,floorZ-.06,top),
  rect('roof',backX,mouthX,
   left-wallThickness,right+wallThickness,roofZ,top),
  rect('floor',backX,mouthX,
   left-wallThickness,right+wallThickness,floorZ-.09,floorZ),
  rect('back_wall',backX-wallThickness,backX,
   left-wallThickness,right+wallThickness,floorZ-.09,top)
 ]);
 // A real source object inside the tunnel invalidates the corridor
 // instead of treating the rock as magically walk-through.
 const cover=rect('cave_hollow',backX,mouthX,left,right,
  floorZ,roofZ);
 let obstruction=null;
 for(const o of scene.objects??[]){
  const solidXY=rect(o.id,
   (o.x-500)/125,(o.x+o.width-500)/125,
   (o.y-200)/125,(o.y+o.depth-200)/125,
   floorZ,roofZ);
  if(overlaps(cover,solidXY,0))obstruction=o.id;
 }
 const meshes=F(solids.map(boxFaces));
 const cave=F({version:'0.9Z',id,
  sceneId:scene.sceneId,revision:scene.revision,
  mouthX,backX,centerY,halfWidth,
  floorZ,roofZ,wallThickness,roofThickness,
  solids,solidMeshes:meshes,
  sourceRockBlocker:obstruction,
  entrance:F({
   open:true,x:mouthX,yMin:left,yMax:right,
   zMin:floorZ,zMax:roofZ,
   forwardDirection:'negative_x_head_first'
  }),
  realWallsAndRoofModeled:true,
  roofWallFloorSolidTriangleCount:60,
  centerlineOnly:false,
  artificialStraightTunnelOnly:true,
  gameSceneIntegrated:false,skinApplied:false});
 if(!validCave(cave,scene))
  throw new RangeError('v09z_invalid_built_cave');
 return cave;
}
/** Safe-space test for ALL visible mesh vertices; no head-only or
 * 24-joint shortcut, plus physical solid-collider checks.
 * A vertex crossing the roof/wall is rejected even if head arrived.
 */
export function inspectSnakeCaveMeshOccupancyV09z({
 sizedState,scene,terrain,cave,meshCandidate=null
}={}){
 if(!validCave(cave,scene))
  return fail('cave_source_scene_stale_or_invalid');
 if(cave.sourceRockBlocker!==null)
  return fail('real_source_rock_inside_cave_hollow',
   {blocker:cave.sourceRockBlocker});
 const candidate=meshCandidate??
  buildSnakeSizedMeshCandidateV09u({
   sizedState,scene,terrain
  });
 if(!candidate.ok)return fail('current_body_mesh_not_safe',
  {meshReason:candidate.reason??null});
 const v=candidate.mesh.positions,
  tris=candidate.mesh.triangles;
 let inside=0,headInside=true,tailInside=true,penetration=null;
 let firstInteriorX=Infinity,deepestInteriorX=-Infinity;
 for(let i=0;i<v.length;i++){
  const p=v[i];
  if(p.x<=cave.mouthX&&p.x>=cave.backX)
  {firstInteriorX=Math.min(firstInteriorX,p.x);
   deepestInteriorX=Math.max(deepestInteriorX,p.x);}
  const isWithin=p.x>=cave.backX&&p.x<=cave.mouthX&&
   p.y>=cave.centerY-cave.halfWidth&&
   p.y<=cave.centerY+cave.halfWidth&&
   p.z>=cave.floorZ&&p.z<=cave.roofZ;
  if(isWithin)inside++;
  const inHead=i<candidate.mesh.neckSocketRingStartIndex+
   candidate.mesh.radialSegments||
   i===candidate.mesh.noseVertexIndex;
  const inTail=i>=candidate.mesh.neckSocketRingStartIndex+
   (candidate.mesh.bodyRingCount-1)*candidate.mesh.radialSegments&&
   i<candidate.mesh.neckSocketRingStartIndex+
   candidate.mesh.bodyRingCount*candidate.mesh.radialSegments;
  if(inHead&&!isWithin)headInside=false;
  if(inTail&&!isWithin)tailInside=false;
  if(!penetration)for(const solid of cave.solids)
   if(insideSolidAabb(p,solid))
   {penetration=F({vertex:i,solid:solid.id});break;}
 }
 let firstTriangleRisk=null,checked=0;
 if(!penetration){
  for(let i=0;i<tris.length;i+=3){
   const a=v[tris[i]],b=v[tris[i+1]],c=v[tris[i+2]];
   const box=rect('triangle',
    Math.min(a.x,b.x,c.x),Math.max(a.x,b.x,c.x),
    Math.min(a.y,b.y,c.y),Math.max(a.y,b.y,c.y),
    Math.min(a.z,b.z,c.z),Math.max(a.z,b.z,c.z));
   checked++;
   for(const solid of cave.solids)
    if(overlaps(box,solid,.0002)){
     firstTriangleRisk=F({triangle:i/3,solid:solid.id});
     break;
    }
   if(firstTriangleRisk)break;
  }
 }
 const safe=penetration===null&&firstTriangleRisk===null;
 const fullMeshInside=inside===v.length&&safe;
 return F({version:'0.9Z',ok:safe,
  reason:penetration?'visible_vertex_inside_cave_solid':
   firstTriangleRisk?'conservative_triangle_cave_solid_contact':null,
  firstPenetration:penetration,firstTriangleRisk,
  inspectedTriangleCount:checked,
  actualCaveSolidsChecked:5,
  caveSolidMeshTriangles:60,
  allVisibleVerticesCount:v.length,
  interiorVertices:inside,
  headFullyInside:headInside,
  tailFullyInside:tailInside,
  entireTransparentMeshInside:fullMeshInside,
  headInsideButTailOut:headInside&&!tailInside,
  trulyHeadFirstPassagePossible:
   cave.entrance.forwardDirection==='negative_x_head_first',
  sourceFrame:sizedState?.verifiedFrames??null,
  onlyStraightSolidTunnelNotCurveNavigation:true,
  convexAabbContactConservativeMayHaveFalsePositives:true,
  exactContinuous3DPhysicalContactCertified:false,
  playerSaveModified:false,skinApplied:false});
}
/** Checks the whole 3216-triangle mesh between BOTH real V0.9T
 * poses against actual cave wall, roof, floor and back-wall solids.
 * No vertex can pass through a thin wall between frames without
 * conservatively triggering a swept AABB overlap HOLD.
 */
export function inspectSnakeCaveSolidSweepV09z({
 fromMesh,toMesh,cave,scene
}={}){
 if(!validCave(cave,scene)||
  fromMesh?.mesh?.vertexCount!==1617||
  toMesh?.mesh?.vertexCount!==1617||
  fromMesh.mesh.triangleCount!==3216||
  toMesh.mesh.triangleCount!==3216)
  return fail('invalid_solid_sweep_mesh_or_scene');
 const A=fromMesh.mesh.positions,B=toMesh.mesh.positions,
  ta=fromMesh.mesh.triangles,
  tb=toMesh.mesh.triangles;
 if(ta.length!==tb.length||
  ta.some((n,i)=>n!==tb[i]))
  return fail('mesh_topology_changed_during_solid_sweep');
 let risk=null,checked=0;
 for(let i=0;i<ta.length;i+=3){
  const sweep=triangleSweptBounds(A,B,
   ta[i],ta[i+1],ta[i+2]);
  checked++;
  for(const solid of cave.solids)
   if(overlaps(sweep,solid,.0002)){
    risk=F({triangle:i/3,solid:solid.id});break;
   }
  if(risk)break;
 }
 return F({version:'0.9Z',ok:risk===null,
  reason:risk?'swept_triangle_may_intersect_real_cave_solid':null,
  firstSweptCaveSolidRisk:risk,
  checkedSweptMeshTriangles:checked,
  physicalCaveSolidsChecked:5,
  exactContinuousTriangleVsTriangleCertified:false,
  failClosedOnAabbUncertainty:true,
  noNewPoseCommitted:true,skinApplied:false});
}
/** A true FORWARD V0.9T step, replayed by U, then swept against
 * our physical cave wall meshes. Full-mesh joint-sized source is
 * immutable; mover never changes bones/radii while traveling.
 */
export function inspectSnakeHeadFirstCaveStepV09z({
 previousState,nextState,scene,terrain,cave,
 turnRadians=0,seconds=.05
}={}){
 if(!validCave(cave,scene)||
  previousState?.version!=='0.9T'||
  nextState?.version!=='0.9T')
  return fail('cave_step_stale_or_invalid_source');
 if(cave.sourceRockBlocker!==null)
  return fail('real_source_rock_inside_cave_hollow',
   {blocker:cave.sourceRockBlocker});
 const forward=inspectSnakeSizedMeshStepV09u({
  previousState,nextState,scene,terrain,
  turnRadians,seconds,temporalSlices:3
 });
 if(!forward.ok)return fail('forward_24_joint_mesh_step_rejected',
  {sourceReason:forward.reason,
   sourceReplayMatched:forward.sourceReplayMatched??false});
 const swept=inspectSnakeCaveSolidSweepV09z({
  fromMesh:forward.from,toMesh:forward.to,cave,scene
 });
 if(!swept.ok)return fail('physical_cave_solid_contact_hold',{
  caveSolidRisk:swept.firstSweptCaveSolidRisk});
 const occupancy=inspectSnakeCaveMeshOccupancyV09z({
  sizedState:nextState,scene,terrain,cave,
  meshCandidate:forward.to
 });
 if(!occupancy.ok)return fail('physical_cave_occupancy_rejected',{
  sourceReason:occupancy.reason,
  caveSolidRisk:occupancy.firstTriangleRisk??
   occupancy.firstPenetration??null
 });
 return F({version:'0.9Z',ok:true,
  fromSourceFrame:previousState.verifiedFrames,
  toSourceFrame:nextState.verifiedFrames,
  signedSourceReplayMatched:forward.sourceReplayMatched,
  caveTriangleCollisionTested:true,
  caveSolidSweep:swept,occupancy,
  meshVertexCount:forward.to.mesh.vertexCount,
  meshTriangleCount:forward.to.mesh.triangleCount,
  everyCurrentBoneLengthUnchanged:forward.unchangedSourceBoneLengths,
  currentBodyRadiiNeverScaled:true,
  sourceFramesCommitted:0,
  exactContinuousMeshCollisionCertified:false,
  formalGameSaveModified:false,skinApplied:false});
}
/** Gradual head-first insertion through the ACTUAL entrance.
 * Uses current forward-facing snake; requires facing -X, reasonably
 * aligned to the open mouth. No 180-degree automatic turn, no
 * 2D route graph, no magical re-orientation. This is one straight
 * certified corridor, not yet pathfinding in arbitrary caves.
 */
export function previewSnakeHeadFirstCaveEntryV09z({
 receipt,sizedState,scene,terrain,cave,
 maxFrames=400,seconds=.05
}={}){
 if(receipt?.accepted!==false||
  receipt?.behavior!=='sniff_then_seek_cover'||
  !idOK(receipt.offerId)||
  !validCave(cave,scene)||
  sizedState?.version!=='0.9T'||
  sizedState.phase!=='moving_sized'||
  !Number.isInteger(maxFrames)||maxFrames<1||
  maxFrames>480||!finite(seconds)||seconds<=0||
  seconds>.05)
  return fail('invalid_head_first_cave_preview');
 const original=JSON.stringify(sizedState);
 const aimed=Math.abs(Math.atan2(
  Math.sin(sizedState.heading-Math.PI),
  Math.cos(sizedState.heading-Math.PI)));
 if(aimed>.04)return fail('head_not_facing_the_cave_mouth');
 if(Math.abs(sizedState.pose.points[0].y-cave.centerY)>
  Math.max(.01,cave.halfWidth*.35))
  return fail('snake_head_not_aligned_with_real_mouth');
 let state=sizedState;
 let before=inspectSnakeCaveMeshOccupancyV09z({
  sizedState:state,scene,terrain,cave
 });
 if(!before.ok)return fail('initial_body_hits_real_cave_solid',
  {sourceReason:before.reason});
 let firstHeadEntered=null,firstTailEntered=null,
  firstWholeBody=null,firstFailure=null,frames=0,
  maximumBodyStep=0;
 const timeline=[];
 for(let i=0;i<maxFrames&&!before.entireTransparentMeshInside;i++){
  const next=advanceSnakeVariableSizeMotionV09t({
   state,scene,terrain,turnRadians:0,seconds
  });
  if(next.phase!=='moving_sized'||
   next.verifiedFrames!==state.verifiedFrames+1){
   firstFailure=F({frame:i,reason:
    'v09t_forward_source_held',detail:next.status??null});
   break;
  }
  const checked=inspectSnakeHeadFirstCaveStepV09z({
   previousState:state,nextState:next,
   scene,terrain,cave,seconds
  });
  if(!checked.ok){
   firstFailure=F({frame:i,reason:checked.reason,
    detail:checked.caveSolidRisk??
     checked.sourceReason??null});
   break;
  }
  const occ=checked.occupancy;
  if(firstHeadEntered===null&&occ.headFullyInside)
   firstHeadEntered=next.verifiedFrames;
  if(firstTailEntered===null&&occ.tailFullyInside)
   firstTailEntered=next.verifiedFrames;
  if(firstWholeBody===null&&occ.entireTransparentMeshInside)
   firstWholeBody=next.verifiedFrames;
  maximumBodyStep=Math.max(maximumBodyStep,
   checked.caveSolidSweep.checkedSweptMeshTriangles);
  timeline.push(F({frame:next.verifiedFrames,
   headInside:occ.headFullyInside,
   tailInside:occ.tailFullyInside,
   meshVerticesInside:occ.interiorVertices,
   all1617Inside:occ.entireTransparentMeshInside}));
  frames++;state=next;before=occ;
 }
 return F({version:'0.9Z',
  ok:before.entireTransparentMeshInside,
  status:before.entireTransparentMeshInside?
   'head_body_tail_all_1617_mesh_vertices_in_real_solid_tunnel':
   firstFailure?'held_at_last_safe_cave_pose':
    'frame_budget_exhausted_before_full_body_cave_entry',
  requestedFrames:maxFrames,
  acceptedPhysicalCaveSteps:frames,
  firstHeadFullEntryFrame:firstHeadEntered,
  firstTailFullEntryFrame:firstTailEntered,
  firstWholeMeshEntryFrame:firstWholeBody,
  firstFailure,initialHead:sizedState.pose.points[0],
  initialTail:sizedState.pose.points[23],
  finalHead:state.pose.points[0],
  finalTail:state.pose.points[23],
  finalCaveOccupancy:before,
  progress:F(timeline),
  trueHeadFirstEntrance: firstHeadEntered!==null&&
   firstTailEntered!==null&&
   firstHeadEntered<firstTailEntered,
  all1617VerticesRequired:true,
  physical5SolidCaveColliderUsed:true,
  existingV09tUandSCurrentSizeSourceUsed:true,
  originalSourceUnmodified:
   JSON.stringify(sizedState)===original,
  noMovementBoneGrowth:
   JSON.stringify(state.pose.boneLengths)===
    JSON.stringify(sizedState.pose.boneLengths)&&
   JSON.stringify(state.pose.radiiWorldUnits)===
    JSON.stringify(sizedState.pose.radiiWorldUnits),
  onlyStraightCaveNoAutonomousWayfinding:true,
  completeCurvedCaveNavigation:false,
  actualGameSourceFramesCommitted:0,
  exactContinuous3DPhysicsCertified:false,
  formalWorldSaveModified:false,
  skinApplied:false});
}
