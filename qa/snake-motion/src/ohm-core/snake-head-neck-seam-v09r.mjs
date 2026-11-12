/**
 * Project OHM public synthetic V0.9R — continuous neutral head/neck
 * socket from the SAME V0.9Q body centerline and local size radii.
 *
 * Keeps V0.9Q 24-joint / 93-section body unmodified. Adds eight neutral,
 * gradually widening/narrowing forward head rings and a closed nose cap
 * to ONE indexed candidate mesh; the original body head ring is the same
 * indexed seam, not two overlapping rings or a hidden crack.
 *
 * Bounded head look has zero yaw/pitch derivative at the neck socket:
 * it changes ONLY the new render+capsule candidate forward of the
 * original head, never the source 24 joints, V0.9C/D/G head collider,
 * source locomotion, player saves, real species anatomy or external skin.
 *
 * Conservative head-shell vs source stone/glass, nonlocal body 3D capsule,
 * mesh vertices vs heightfield, and authenticated interframe checks are
 * diagnostics, not swept triangle/force/biological completion.
 */
import {buildSnakeSharedBodyGeometryV09q}
 from './snake-shared-body-geometry-v09q.mjs';
import {sampleSnakeTerrain}
 from './snake-terrain-contact.mjs';
import {advanceSnakeRouteWithTurnSpaceGuardV09g}
 from './snake-turn-space-v09g.mjs';

export const SNAKE_HEAD_NECK_SEAM_V09R_VERSION='0.9R';
const F=Object.freeze;
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const V=(x,y,z)=>F({x,y,z});
const add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z);
const sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z);
const mul=(a,s)=>V(a.x*s,a.y*s,a.z*s);
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>V(a.y*b.z-a.z*b.y,
 a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x);
const length=a=>Math.hypot(a.x,a.y,a.z);
const unit=a=>{const n=length(a);
 if(n<1e-9)throw new RangeError('v09r_degenerate_head_basis');
 return mul(a,1/n);
};
const dist=(a,b)=>length(sub(a,b));
const lerp=(a,b,t)=>add(mul(a,1-t),mul(b,t));
const reject=(reason,stageProgress)=>F({
 version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,
 ok:false,reason,stageProgress,mesh:null,collisionShell:null,
 neckSocketIndex:null,sourceHeadUnmodified:true,
 headBodySeamCertified:false,mesh3DSweepCertified:false,
 sourceSizedMovementAuthorized:false,gameIntegrationAuthorized:false,
 speciesAnatomyCertified:false,skinApplied:false,saveModified:false
});
function intersectsRect(a,b,rock,radius){
 let enter=0,exit=1;
 for(const [start,delta,lo,hi] of [
  [a.x,b.x-a.x,rock.x-radius,rock.x+rock.width+radius],
  [a.y,b.y-a.y,rock.y-radius,rock.y+rock.depth+radius]
 ]){
  if(Math.abs(delta)<1e-12){
   if(start<lo||start>hi)return false;
  }else{
   let p=(lo-start)/delta,q=(hi-start)/delta;
   if(p>q){const tmp=p;p=q;q=tmp;}
   enter=Math.max(enter,p);exit=Math.min(exit,q);
   if(enter>exit)return false;
  }
 }
 return enter<=1&&exit>=0;
}
function segmentDistance(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(a,c);
 const A=dot(u,u),B=dot(u,v),C=dot(v,v),
  D=dot(u,w),E=dot(v,w),denom=A*C-B*B;
 if(A<1e-14||C<1e-14)
  throw new RangeError('v09r_degenerate_head_capsule_segment');
 let sN=0,sD=denom,tN=0,tD=denom;
 if(denom<1e-12){sN=0;sD=1;tN=E;tD=C;}
 else{
  sN=B*E-C*D;tN=A*E-B*D;
  if(sN<0){sN=0;tN=E;tD=C;}
  else if(sN>sD){sN=sD;tN=E+B;tD=C;}
 }
 if(tN<0){
  tN=0;
  if(-D<0)sN=0;
  else if(-D>A)sN=sD;
  else{sN=-D;sD=A;}
 }else if(tN>tD){
  tN=tD;
  if(-D+B<0)sN=0;
  else if(-D+B>A)sN=sD;
  else{sN=-D+B;sD=A;}
 }
 const s=Math.abs(sN)<1e-12?0:sN/sD;
 const t=Math.abs(tN)<1e-12?0:tN/tD;
 return length(add(w,sub(mul(u,s),mul(v,t))));
}
function basis(shared){
 const pts=shared.posePoints,root=pts[0];
 const next=pts[1];
 const forward=unit(sub(root,next));
 const r=shared.mesh.radialSegments;
 if(r%4!==0)throw new RangeError('v09r_requires_quarter_turn_radial_grid');
 const normal=unit(sub(shared.mesh.positions[0],root));
 const binormal=unit(sub(shared.mesh.positions[r/4],root));
 if(Math.abs(dot(forward,normal))>1e-6||
  Math.abs(dot(forward,binormal))>1e-6||
  Math.abs(dot(normal,binormal))>1e-6)
  throw new RangeError('v09r_mismatched_original_body_basis');
 return F({root,forward,normal,binormal});
}
const radialProfiles=F([
 F({t:1,width:.08,height:.08}),
 F({t:.875,width:.39,height:.38}),
 F({t:.75,width:.78,height:.68}),
 F({t:.625,width:1.01,height:.80}),
 F({t:.5,width:1.16,height:.87}),
 F({t:.375,width:1.19,height:.92}),
 F({t:.25,width:1.12,height:.96}),
 F({t:.125,width:1.02,height:.99})
]);
const noseDistanceScale=1.50; // length = 1.5 * exact source neck radius
function generateHead(shared,headYawRad,headPitchRad){
 const base=basis(shared),r0=shared.radiiWorldUnits[0];
 const headLength=noseDistanceScale*r0;
 const lateral=base.normal,vertical=base.binormal;
 const tanYaw=Math.tan(headYawRad),tanPitch=Math.tan(headPitchRad);
 const headRings=[],headCollision=[],headVertices=[];
 const radial=shared.mesh.radialSegments;
 let minGround=Infinity,maxGround=-Infinity,
  radialError=0;
 for(const item of radialProfiles){
  const s=headLength*item.t;
  // The quadratic deflection has d/ds=forward at s=0:
  // moving the eyes/nose never kinks the shared neck socket.
  const displacement=add(
   mul(base.forward,s),
   add(mul(lateral,s*s*tanYaw/(2*headLength)),
    mul(vertical,s*s*tanPitch/(2*headLength)))
  );
  const center=add(base.root,displacement);
  const heading=unit(add(base.forward,
   add(mul(lateral,item.t*tanYaw),
    mul(vertical,item.t*tanPitch))));
  const n=unit(sub(lateral,mul(heading,dot(lateral,heading))));
  const b=unit(cross(n,heading));
  const width=r0*item.width,height=r0*item.height;
  const vertices=[];
  for(let j=0;j<radial;j++){
   const theta=2*Math.PI*j/radial;
   const vertex=add(center,add(
    mul(n,width*Math.cos(theta)),
    mul(b,height*Math.sin(theta))
   ));
   const scaled=Math.sqrt(
    Math.pow(dot(sub(vertex,center),n)/width,2)+
    Math.pow(dot(sub(vertex,center),b)/height,2));
   radialError=Math.max(radialError,Math.abs(scaled-1));
   const ground=sampleSnakeTerrain(vertex.x,vertex.y,
    shared.sourceTerrain).z;
   const gap=vertex.z-ground;
   minGround=Math.min(minGround,gap);
   maxGround=Math.max(maxGround,gap);
   vertices.push(vertex);
   headVertices.push(vertex);
  }
  headRings.push(F({center,width,height,vertices:F(vertices),
   sourceNeckRadius:r0,forwardDistance:s,normal:n,binormal:b,
   headLookT:item.t}));
  headCollision.push(F({center,radius:Math.max(width,height),
   widthRadius:width,heightRadius:height,
   source:'same_v09q_neck_radius_and_quadratic_head_look'}));
 }
 const nose=add(base.root,add(mul(base.forward,headLength),
  add(mul(lateral,headLength*tanYaw/2),
   mul(vertical,headLength*tanPitch/2))));
 // Nose closes toward 1.02*L while remaining within small yaw/pitch.
 const tip=add(nose,mul(unit(add(base.forward,
  add(mul(lateral,tanYaw),mul(vertical,tanPitch)))),
  headLength*.015));
 const tipGap=tip.z-sampleSnakeTerrain(
  tip.x,tip.y,shared.sourceTerrain).z;
 minGround=Math.min(minGround,tipGap);
 maxGround=Math.max(maxGround,tipGap);
 return F({base,radiusAtSocket:r0,headLength,
  headRings:F(headRings),headCollision:F(headCollision),
  headVertices:F(headVertices),tip,
  minimumHeadVertexTerrainGapWorld:minGround,
  maximumHeadVertexTerrainGapWorld:maxGround,
  maxNormalizedEllipticalRadiusError:radialError,
  maxHeadWidthWorld:Math.max(...headRings.map(r=>r.width)),
  tangentAtSocketMatchesBody:true,
  smoothLookWithoutSourceNeckRewrite:true});
}
function headSceneSelfAudit(head,shared,scene,safetyMarginWorld){
 const items=[...head.headCollision,
  {center:head.base.root,radius:head.radiusAtSocket}];
 const marginPx=safetyMarginWorld*125;
 let minimumGlass=Infinity,blocked=null,minSelf=Infinity,
  checkedNonlocalPairs=0;
 for(let i=0;i<items.length;i++){
  const p=items[i].center,r=items[i].radius*125+marginPx;
  const fx=500+p.x*125,fy=200+p.y*125;
  minimumGlass=Math.min(minimumGlass,fx-r,1000-fx-r,
   fy-r,400-fy-r);
  if(minimumGlass<-.00001)blocked??='head_shell_outside_glass';
 }
 for(let i=0;i<items.length-1;i++){
  const first=items[i],second=items[i+1];
  const fa={x:500+first.center.x*125,
   y:200+first.center.y*125};
  const fb={x:500+second.center.x*125,
   y:200+second.center.y*125};
  const radius=125*Math.max(first.radius,second.radius)+marginPx;
  for(const rock of scene.objects){
   if(intersectsRect(fa,fb,rock,radius))
    blocked??='head_shell_source_rock_'+rock.id;
  }
  for(let j=4;j<23;j++){
   const pose=shared.posePoints,local=shared.radiiWorldUnits;
   const separation=segmentDistance(
    first.center,second.center,pose[j],pose[j+1])-
    Math.max(first.radius,second.radius)-
    Math.max(local[j],local[j+1]);
   minSelf=Math.min(minSelf,separation);
   checkedNonlocalPairs++;
  }
 }
 const selfClear=minSelf>=-.008;
 const terrainClear=head.minimumHeadVertexTerrainGapWorld>=-.00001;
 return F({ok:blocked===null&&selfClear&&terrainClear,
  sourceSceneClear:blocked===null,
  sourceSceneBlocker:blocked,
  minimumGlassGapPx:minimumGlass,
  nonlocal3DHeadCapsulesClear:selfClear,
  minimumNonlocal3DHeadGapWorld:minSelf,
  nonlocalHeadBodyPairsChecked:checkedNonlocalPairs,
  renderedHeadVertexGroundClear:terrainClear,
  minimumHeadVertexGroundGapWorld:
   head.minimumHeadVertexTerrainGapWorld});
}
function unifiedIndexedHeadBody(head,shared){
 const radial=shared.mesh.radialSegments;
 const extra=head.headRings.length;
 const prefix=extra*radial;
 const vertices=[...head.headVertices,...shared.mesh.positions,head.tip];
 const triangleList=[],uv=[];
 const allRings=extra+shared.mesh.ringCount;
 for(let i=0;i<allRings;i++)
  for(let j=0;j<radial;j++)
   uv.push(F({u:i/(allRings-1),v:j/radial}));
 uv.push(F({u:0,v:.5}));
 for(let i=0;i<extra;i++)
  for(let j=0;j<radial;j++){
   const first=i*radial+j;
   const next=i*radial+(j+1)%radial;
   triangleList.push(first,first+radial,next,
    next,first+radial,next+radial);
  }
 triangleList.push(...shared.mesh.triangles.map(n=>n+prefix));
 const tip=vertices.length-1;
 for(let j=0;j<radial;j++){
  triangleList.push(tip,j,(j+1)%radial);
 }
 const socket=prefix;
 let maxSeamGap=0,minSeamFaceCount=Infinity,
  maxSeamFaceCount=0;
 // Critical: this is the SAME indexed V0.9Q body ring, not a duplicate.
 // Both head and body triangles must share each of its 16 ring edges.
 for(let j=0;j<radial;j++){
  const a=socket+j,b=socket+(j+1)%radial;
  const bodyVertex=shared.mesh.positions[j];
  maxSeamGap=Math.max(maxSeamGap,dist(vertices[a],bodyVertex));
  let trianglesContainingEdge=0;
  for(let k=0;k<triangleList.length;k+=3){
   const face=[triangleList[k],triangleList[k+1],
    triangleList[k+2]];
   if(face.includes(a)&&face.includes(b))trianglesContainingEdge++;
  }
  minSeamFaceCount=Math.min(minSeamFaceCount,trianglesContainingEdge);
  maxSeamFaceCount=Math.max(maxSeamFaceCount,trianglesContainingEdge);
 }
 const shell=F({headSections:F([...head.headCollision,
  F({center:head.base.root,radius:head.radiusAtSocket,
   source:'exact_v09q_neck_socket'})]),
  bodySections:shared.collisionShell.sections,
  headNoseTip:head.tip,bodyPoints:shared.posePoints,
  allHeadAndBodyRadiiFromV09q:true,
  source:'same_v09q_pose_radii_and_v09r_neutral_head_look'
 });
 const mesh=F({positions:F(vertices),uv:F(uv),
  triangles:F(triangleList),vertexCount:vertices.length,
  triangleCount:triangleList.length/3,
  radialSegments:radial,bodyRingCount:shared.mesh.ringCount,
  headExtraRingCount:extra,noseVertexIndex:tip,
  neckSocketRingStartIndex:socket,
  headBodySeamSharedVertices:true,
  skinApplied:false});
 return F({mesh,shell,seam:F({
  socketRingStartIndex:socket,
  socketVertexCount:radial,
  maximumSeamVertexGapWorld:maxSeamGap,
  minimumSeamRingEdgeAdjacentFaceCount:minSeamFaceCount,
  maximumSeamRingEdgeAdjacentFaceCount:maxSeamFaceCount,
  noDuplicateNeckSocketRing:true,
  tangentAtNeckRootContinuous:head.tangentAtSocketMatchesBody,
  indexedSocketContinuous:maxSeamGap<1e-10&&
   minSeamFaceCount===2&&maxSeamFaceCount===2
 })});
}
/**
 * Neutral original head candidate only. A renderable returned mesh
 * means shared geometry and a topologically welded neutral neck pass,
 * not a realistic animal head, skin, 3D mesh sweep or gameplay motion.
 */
export function buildSnakeHeadNeckCandidateV09r({
 sourcePose,scene,terrain,stageProgress=2,
 headYawRad=0,headPitchRad=0,
 radialSegments=16,subdivisions=4
}={}){
 if(!finite(headYawRad)||Math.abs(headYawRad)>.18||
  !finite(headPitchRad)||Math.abs(headPitchRad)>.08||
  !scene||!terrain||!Number.isInteger(radialSegments)||
  radialSegments<8||radialSegments>32||radialSegments%4!==0||
  !Number.isInteger(subdivisions)||subdivisions<2||
  subdivisions>8)
  throw new RangeError('v09r_invalid_synthetic_head_options');
 const shared=buildSnakeSharedBodyGeometryV09q({
  sourcePose,scene,terrain,stageProgress,
  radialSegments,subdivisions
 });
 if(!shared.ok)return reject(
  shared.reason??'source_v09q_body_rejected',stageProgress);
 // No hidden terrain source from a stale state: the caller scene+terrain
 // must be re-evaluated in V0.9Q on every candidate build.
 const head=generateHead({...shared,sourceTerrain:terrain},
  headYawRad,headPitchRad);
 const headCheck=headSceneSelfAudit(head,shared,scene,.0035);
 if(!headCheck.ok)return F({...reject(
  headCheck.sourceSceneBlocker??
   (!headCheck.nonlocal3DHeadCapsulesClear?
    'head_hits_nonlocal_source_body':
    'neutral_head_vertices_below_heightfield'),
  stageProgress),headCheck});
 const combined=unifiedIndexedHeadBody(head,shared);
 if(!combined.seam.indexedSocketContinuous)
  return F({...reject('head_body_shared_socket_not_welded',
   stageProgress),seam:combined.seam});
 return F({
  version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,
  ok:true,stageProgress,lifeStage:shared.lifeStage,
  headYawRad,headPitchRad,
  sharedBodyV09q:shared,
  mesh:combined.mesh,
  collisionShell:combined.shell,
  seam:combined.seam,
  headCheck,
  sourceHeadPoint:shared.posePoints[0],
  headSourceRadius:head.radiusAtSocket,
  headNoseForwardExtent:head.headLength,
  headWidthMaxWorld:head.maxHeadWidthWorld,
  maximumHeadRadialMismatch:
   head.maxNormalizedEllipticalRadiusError,
  sourceHeadUnmodified:true,
  headLookNotAppliedToSource:true,
  headBodySeamCertified:true,
  variableSizeBodyAndHeadOneCandidateGeometry:true,
  anatomicalHeadCertified:false,
  legacyV01HeadAttachmentNotReplaced:true,
  sourceSizedMovementAuthorized:false,
  mesh3DSweepCertified:false,
  groundForceCertified:false,
  gameIntegrationAuthorized:false,
  skinApplied:false,saveModified:false
 });
}
/**
 * Never trust consecutive frame labels: replay V0.9C/D/G and compare
 * original pose and relay state. New head turn can change only <=0.035
 * rad / true source frame. Interframe head vertex and head-shell swept
 * AABB tests are conservative; neither authorizes new source physics.
 */
export function inspectSnakeHeadNeckTransitionV09r({
 previousSource,nextSource,scene,terrain,stageProgress=2,
 previousYawRad=0,nextYawRad=0,
 previousPitchRad=0,nextPitchRad=0,seconds=1/30
}={}){
 if(previousSource?.version!=='0.9C'||
  nextSource?.version!=='0.9C'||
  previousSource.phase!=='moving_return'||
  nextSource.phase!=='moving_return'||
  previousSource.verifiedFrames+1!==nextSource.verifiedFrames||
  previousSource.sceneStamp!==nextSource.sceneStamp||
  previousSource.sceneRevision!==scene?.revision||
  nextSource.sceneRevision!==scene?.revision||
  previousSource.sceneId!==scene?.sceneId||
  nextSource.sceneId!==scene?.sceneId||
  !finite(seconds)||seconds<=0||seconds>.05||
  ![previousYawRad,nextYawRad,previousPitchRad,
   nextPitchRad].every(finite))
  throw new RangeError('v09r_nonadjacent_or_untrusted_source');
 if(Math.abs(nextYawRad-previousYawRad)>.035+1e-10||
  Math.abs(nextPitchRad-previousPitchRad)>.025+1e-10)
  return F({version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,
   ok:false,reason:'head_look_frame_jump_too_large',
   headBodySeamCertified:false,
   sourceFramesCommitted:0,skinApplied:false,saveModified:false});
 const replay=advanceSnakeRouteWithTurnSpaceGuardV09g({
  state:previousSource,scene,terrain,seconds
 });
 if(replay.phase!=='moving_return'||
  replay.verifiedFrames!==nextSource.verifiedFrames||
  JSON.stringify(replay.pose?.points)!==
   JSON.stringify(nextSource.pose?.points)||
  JSON.stringify(replay.relayState)!==
   JSON.stringify(nextSource.relayState))
  return F({version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,
   ok:false,reason:'unverified_original_source_step',
   sourceReplayMatched:false,
   sourceFramesCommitted:0,skinApplied:false,saveModified:false});
 const from=buildSnakeHeadNeckCandidateV09r({
  sourcePose:previousSource.pose,scene,terrain,
  stageProgress,headYawRad:previousYawRad,
  headPitchRad:previousPitchRad
 });
 const to=buildSnakeHeadNeckCandidateV09r({
  sourcePose:nextSource.pose,scene,terrain,
  stageProgress,headYawRad:nextYawRad,
  headPitchRad:nextPitchRad
 });
 if(!from.ok||!to.ok)
  return F({version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,
   ok:false,reason:'original_head_neck_candidate_rejected',
   fromReason:from.reason??null,toReason:to.reason??null,
   sourceReplayMatched:true,
   sourceFramesCommitted:0,skinApplied:false,saveModified:false});
 const radial=from.mesh.radialSegments;
 const nHead=from.mesh.headExtraRingCount;
 let sweptSceneClear=true,sweptGroundClear=true,
  worstGap=Infinity,temporalSamples=0,maxVertexStep=0,
  blocked=null;
 for(let i=0;i<=nHead;i++){
  const fromCenter=i<nHead?
   from.collisionShell.headSections[i].center:
   from.sharedBodyV09q.posePoints[0];
  const toCenter=i<nHead?
   to.collisionShell.headSections[i].center:
   to.sharedBodyV09q.posePoints[0];
  const rFrom=from.collisionShell.headSections[i].radius;
  const rTo=to.collisionShell.headSections[i].radius;
  const marginPx=125*Math.max(rFrom,rTo)+.0035*125;
  const minX=500+125*Math.min(fromCenter.x,toCenter.x)-marginPx;
  const maxX=500+125*Math.max(fromCenter.x,toCenter.x)+marginPx;
  const minY=200+125*Math.min(fromCenter.y,toCenter.y)-marginPx;
  const maxY=200+125*Math.max(fromCenter.y,toCenter.y)+marginPx;
  if(minX<0||maxX>1000||minY<0||maxY>400){
   sweptSceneClear=false;blocked??='swept_head_glass';
  }
  for(const rock of scene.objects)
   if(minX<=rock.x+rock.width&&maxX>=rock.x&&
    minY<=rock.y+rock.depth&&maxY>=rock.y){
    sweptSceneClear=false;blocked??='swept_head_source_rock_'+rock.id;
   }
 }
 const headVertexCount=nHead*radial+1;
 for(let i=0;i<headVertexCount;i++){
  const n=i===headVertexCount-1?
   from.mesh.noseVertexIndex:i;
  const a=from.mesh.positions[n],b=to.mesh.positions[n];
  maxVertexStep=Math.max(maxVertexStep,dist(a,b));
  for(const t of [0,.25,.5,.75,1]){
   const q=lerp(a,b,t);
   const gap=q.z-sampleSnakeTerrain(q.x,q.y,terrain).z;
   worstGap=Math.min(worstGap,gap);temporalSamples++;
   if(gap<-.00001)sweptGroundClear=false;
   const floorA={x:500+a.x*125,y:200+a.y*125};
   const floorB={x:500+b.x*125,y:200+b.y*125};
   for(const rock of scene.objects)
    if(intersectsRect(floorA,floorB,rock,0)){
     sweptSceneClear=false;
     blocked??='swept_head_vertex_source_rock_'+rock.id;
    }
  }
 }
 const stepBound=maxVertexStep<=.06;
 const ok=sweptSceneClear&&sweptGroundClear&&stepBound;
 return F({
  version:SNAKE_HEAD_NECK_SEAM_V09R_VERSION,ok,
  reason:ok?null:blocked??(!sweptGroundClear?
   'head_swept_heightfield_penetration':
   'head_vertex_step_too_large'),
  sourceReplayMatched:true,
  sourceStartFrame:previousSource.verifiedFrames,
  sourceEndFrame:nextSource.verifiedFrames,
  stageProgress,
  from,to,
  headBodySeamCertified:true,
  sharedNeckSocketStable:from.seam.indexedSocketContinuous&&
   to.seam.indexedSocketContinuous,
  headLookYawStepRad:nextYawRad-previousYawRad,
  headLookPitchStepRad:nextPitchRad-previousPitchRad,
  maximumHeadVertexStepWorld:maxVertexStep,
  headVertexStepBoundClear:stepBound,
  headSweptSourceSceneClear:sweptSceneClear,
  headSweptHeightfieldClear:sweptGroundClear,
  headSweptMinimumTerrainGapWorld:worstGap,
  headTemporalVertexSamples:temporalSamples,
  originalSourceUnmodified:true,
  sourceFramesCommitted:0,
  headNeckMesh3DSweepCertified:false,
  sourceSizedMovementAuthorized:false,
  gameIntegrationAuthorized:false,
  skinApplied:false,saveModified:false
 });
}
