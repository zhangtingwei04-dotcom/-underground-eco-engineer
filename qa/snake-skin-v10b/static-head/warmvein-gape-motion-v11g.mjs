/**
 * OHM V1.1G — Original real-video-informed, RENDER ONLY gape motion.
 * Not a claim that a snake's upper skull hinges open as a lid.
 *
 * Reference: user-provided real corn snake, 2026-11-08 ~22–26 s:
 * upper snout rises in IMAGE coordinates as the whole head pitches;
 * lower jaw drops relative to the skull; neck remains anchored.
 *
 * Two controls (skull lift + relative mandibular opening) solve an
 * obvious previous mistake: F kept the skull entirely fixed while
 * turning only the lower jaw down, so even a better jaw looked wrong.
 * Do not replace the old 24-joint controller, UV, collision or saves.
 */
import {buildWarmveinStaticHeadV11f,GAPE_POSES_V11F}
 from './warmvein-static-anatomy-v11f.mjs';
import {buildWarmveinStaticCoilV11f}
 from './warmvein-static-coil-v11f.mjs';

export const WARMVEIN_VIDEO_GAPE_V11G='1.1G';
export const GAPE_PROFILES_V11G=Object.freeze([
 Object.freeze({id:'video-head-lift',label:'影片參考｜頭微仰＋下顎張開',maxHeadPitchDeg:14}),
 Object.freeze({id:'upper-dominant',label:'對照候選｜頭仰得更多',maxHeadPitchDeg:23}),
 Object.freeze({id:'lower-only',label:'舊方式｜固定上半頭，只動下顎',maxHeadPitchDeg:0})
]);
export const GAPE_TIMELINE_V11G=Object.freeze([
 Object.freeze({t:0,gape:0,pitchFactor:0,label:'閉嘴'}),
 Object.freeze({t:.18,gape:0,pitchFactor:0,label:'開始前'}),
 Object.freeze({t:.28,gape:9,pitchFactor:.28,label:'開始張'}),
 Object.freeze({t:.44,gape:46,pitchFactor:1,label:'完全張開'}),
 Object.freeze({t:.70,gape:46,pitchFactor:1,label:'維持張口'}),
 Object.freeze({t:.88,gape:12,pitchFactor:.25,label:'逐漸閉嘴'}),
 Object.freeze({t:1,gape:0,pitchFactor:0,label:'恢復閉嘴'})
]);
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t)};
function getPhase(phase){
 const p=clamp(phase,0,1);
 for(let i=1;i<GAPE_TIMELINE_V11G.length;i++){
  const a=GAPE_TIMELINE_V11G[i-1],b=GAPE_TIMELINE_V11G[i];
  if(p<=b.t){
   const k=ease((p-a.t)/Math.max(1e-8,b.t-a.t));
   return {gape:a.gape+(b.gape-a.gape)*k,
    pitchFactor:a.pitchFactor+(b.pitchFactor-a.pitchFactor)*k,
    interval:a.label+' → '+b.label};
  }
 }
 return {gape:0,pitchFactor:0,interval:'閉嘴'};
}
function transform(point,pitchRad){
 const [x,y,z]=point;
 const ROOT=-1.08,SKULL=-.67,ZROOT=.113;
 if(x<=ROOT||Math.abs(pitchRad)<1e-12)return point.slice();
 const u=clamp((x-ROOT)/(SKULL-ROOT),0,1);
 const blend=ease(u),phi=pitchRad*blend;
 const lift=.010*blend*(pitchRad/(14*Math.PI/180));
 const c=Math.cos(phi),s=Math.sin(phi);
 if(x<SKULL){
  // Bend front neck progressively; root remains exactly fixed.
  return [x-(z-ZROOT)*s,y,ZROOT+(z-ZROOT)*c+lift];
 }
 const dx=x-SKULL,dz=z-ZROOT;
 return [SKULL+dx*c-dz*s,y,ZROOT+dx*s+dz*c+lift];
}
export function buildWarmveinGapeMotionV11g({
 scene='head',profile='video-head-lift',
 pose='closed',phase=null
}={}){
 if(scene!=='head'&&scene!=='coil')throw new RangeError('v11g_invalid_scene');
 const chosen=GAPE_PROFILES_V11G.find(x=>x.id===profile);
 if(!chosen)throw new RangeError('v11g_invalid_profile');
 const selected=GAPE_POSES_V11F.find(x=>x.id===pose);
 if(!selected)throw new RangeError('v11g_invalid_pose');
 if(phase!==null&&(!Number.isFinite(phase)||phase<0||phase>1))
  throw new RangeError('v11g_invalid_timeline_phase');
 const sample=phase===null?
  {gape:selected.degrees,
   pitchFactor:selected.degrees/46,
   interval:'固定口型｜'+pose}:
  getPhase(phase);
 const gape=Math.max(0,Math.min(46,sample.gape));
 const tiltDeg=chosen.maxHeadPitchDeg*sample.pitchFactor;
 const tiltRad=tiltDeg*Math.PI/180;
 const original=scene==='head'?
  buildWarmveinStaticHeadV11f({pose,degreesOverride:gape}):
  buildWarmveinStaticCoilV11f({mouth:pose,degreesOverride:gape});
 const vertices=new Float32Array(original.vertices);
 const normals=new Float32Array(original.normals);
 const headVertexCount=scene==='head'?
  original.vertexCount:original.headTriangleCount*3;
 const beforeFirstRoot=true; // Both head and coil include a fixed -1.08 neck ring.
 // In a COIL scene only the sculpted head/neck receives a pose
 // deformation; its 44-point body joint stays fixed at x=-1.08.
 for(let i=0;i<headVertexCount;i++){
  const o=i*3,x=vertices[o],z=vertices[o+2];
  const p=transform([x,vertices[o+1],z],tiltRad);
  vertices[o]=p[0];vertices[o+1]=p[1];vertices[o+2]=p[2];
  // Rigid part rotates normals with the head. The bent neck's
  // exact geometric normals are an approximation in this test.
  const a=tiltRad*ease((x+1.08)/(.41));
  const c=Math.cos(a),sn=Math.sin(a);
  const nx=normals[o],nz=normals[o+2];
  normals[o]=nx*c-nz*sn;
  normals[o+2]=nx*sn+nz*c;
 }
 // Source and output root coordinates are exact at the fixed
 // attachment. Prevent "head floating off its body" regressions.
 let maxRootDrift=0;
 if(beforeFirstRoot){
  const rootIndices=[];
  for(let i=0;i<headVertexCount;i++)
   if(Math.abs(original.vertices[i*3]+1.08)<1e-7)
    rootIndices.push(i);
  for(const i of rootIndices){
   const o=i*3;
   maxRootDrift=Math.max(maxRootDrift,
    Math.hypot(vertices[o]-original.vertices[o],
     vertices[o+1]-original.vertices[o+1],
     vertices[o+2]-original.vertices[o+2]));
  }
  if(maxRootDrift>1e-7)throw Error('v11g_neck_root_became_unanchored');
 }
 const tipX=original.geometryAudit?.frontTipX??.08;
 const upperTipRelativeLift=
  (tipX+.67)*Math.sin(tiltRad)+.010*(tiltDeg/14);
 return Object.freeze({
  version:WARMVEIN_VIDEO_GAPE_V11G,
  scene,profile,pose,phase,
  motionInterval:sample.interval,
  gapeDegrees:gape,
  headPitchDegrees:tiltDeg,
  upperTipRiseEstimateWorld:upperTipRelativeLift,
  lowerJawRelativeGapeDegrees:gape,
  splitHeadAndJawControls:true,
  headLiftIsWholeSkullPitchNotCranialLid:true,
  realVideoTimingIsQualitativeNotMotionCapture:true,
  referenceUserVideoTime:'2026-11-08 21:16:20 video 22.3–26.6s',
  retainedBodyRoot:true,
  maximumFixedRootMovement:maxRootDrift,
  disconnectedSourceSkeletonUnchanged:true,
  originalPlayerSaveUnchanged:true,
  renderOnlyPrototype:true,actualSnakeBiomechanicsUnverified:true,
  artistApproved:false,
  mouthGapAtMuzzleWorld:original.mouthGapAtMuzzleWorld,
  vertexCount:original.vertexCount,
  triangleCount:original.triangleCount,
  vertices, normals,colors:original.colors,
  materialTriangleCounts:original.materialTriangleCounts,
  originalMaterialVersion:original.version
 });
}
