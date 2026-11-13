/**
 * V1.1F: 32 new full-coil and head-only 3D views of newly modeled jaw/cranial geometry.
 * Does not import 24-joint gameplay state or external art meshes.
 */
import {buildWarmveinGapeMotionV11g,GAPE_PROFILES_V11G,GAPE_TIMELINE_V11G}
 from './warmvein-gape-motion-v11g.mjs';
const F=Object.freeze;
const canvas=document.querySelector('#render'),
 poseEl=document.querySelector('#pose'),
 modelEl=document.querySelector('#model'),
 profileEl=document.querySelector('#profile'),
 timelineModeEl=document.querySelector('#timelineMode'),
 timelineEl=document.querySelector('#timeline'),
 playEl=document.querySelector('#play'),
 pauseEl=document.querySelector('#pause'),
 angleEl=document.querySelector('#angle'),
 summary=document.querySelector('#summary'),
 saveEl=document.querySelector('#save');
const gl=canvas.getContext('webgl2',{
 alpha:false,depth:true,antialias:true,preserveDrawingBuffer:true,
 powerPreference:'low-power'
});
if(!gl)throw Error('V1.1G motion QA requires WebGL2');
const angles=F({
 side:F({label:'側面',v:F([0,-1,.18])}),
 quarter:F({label:'斜側面',v:F([.67,-.71,.24])}),
 front:F({label:'正面',v:F([1,0,.16])}),
 elevated:F({label:'略俯視',v:F([.25,-.44,.87])})
});
const normalize=a=>a.map(x=>x/Math.max(1e-10,Math.hypot(...a)));
const cross=(a,b)=>[
 a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],
 a[0]*b[1]-a[1]*b[0]
];
function shader(type,src){
 const item=gl.createShader(type);
 gl.shaderSource(item,src);
 gl.compileShader(item);
 if(!gl.getShaderParameter(item,gl.COMPILE_STATUS))
  throw Error(gl.getShaderInfoLog(item));
 return item;
}
const vertexSource=[
 '#version 300 es','precision highp float;',
 'in vec3 aPosition;','in vec3 aNormal;','in vec3 aColor;',
 'uniform vec3 uCenter;','uniform vec3 uRight;',
 'uniform vec3 uUp;','uniform vec3 uTowardCamera;',
 'uniform vec2 uHalf;','out vec3 vNormal;','out vec3 vColor;',
 'void main(){',
 'vec3 p=aPosition-uCenter;',
 'gl_Position=vec4(dot(p,uRight)/uHalf.x,dot(p,uUp)/uHalf.y,',
 '-dot(p,uTowardCamera)*.38,1.0);',
 'vNormal=aNormal;vColor=aColor;','}'
].join('\n');
const fragmentSource=[
 '#version 300 es','precision highp float;',
 'in vec3 vNormal;','in vec3 vColor;','out vec4 pixel;',
 'void main(){',
 'vec3 n=normalize(vNormal);',
 'float lit=max(0.,dot(n,normalize(vec3(.36,-.42,.84))));',
 'float lighting=.58+.42*lit;',
 'vec3 col=pow(vColor*lighting,vec3(.9));',
 'pixel=vec4(col,1.0);','}'
].join('\n');
const vs=shader(gl.VERTEX_SHADER,vertexSource),
 fs=shader(gl.FRAGMENT_SHADER,fragmentSource);
const program=gl.createProgram();
gl.attachShader(program,vs);gl.attachShader(program,fs);
gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))
 throw Error(gl.getProgramInfoLog(program));
const loc={
 pos:gl.getAttribLocation(program,'aPosition'),
 normal:gl.getAttribLocation(program,'aNormal'),
 color:gl.getAttribLocation(program,'aColor'),
 center:gl.getUniformLocation(program,'uCenter'),
 right:gl.getUniformLocation(program,'uRight'),
 up:gl.getUniformLocation(program,'uUp'),
 toward:gl.getUniformLocation(program,'uTowardCamera'),
 half:gl.getUniformLocation(program,'uHalf')
};
const buffers=F({
 pos:gl.createBuffer(),normal:gl.createBuffer(),color:gl.createBuffer()
});
let mesh=null,lastAudit=null,playing=false,raf=null,started=0,lastFrameTime=-Infinity;
const ANIMATION_DURATION_MS=3500;
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.disable(gl.CULL_FACE);
gl.disable(gl.BLEND);
function render(){
 const pose=poseEl.value,angle=angleEl.value,
  model=modelEl.value;
 if(!angles[angle])throw new Error('v11g_unknown_camera');
 if(!['coil','head'].includes(model))throw new Error('v11g_unknown_scene');
 const phase=timelineModeEl.checked?Number(timelineEl.value)/100:null;
 mesh=buildWarmveinGapeMotionV11g({scene:model,profile:profileEl.value,pose,phase});
 const camera=normalize(angles[angle].v);
 const right=normalize(cross([0,0,1],camera));
 const up=normalize(cross(camera,right));
 const center=model==='coil'?[-.77,-.46,.10]:[-.29,0,.12];
 const halfWidth=model==='coil'?1.74:.65;
 const halfHeight=halfWidth*canvas.height/canvas.width;
 gl.viewport(0,0,canvas.width,canvas.height);
 gl.clearColor(.085,.10,.105,1);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.useProgram(program);
 gl.uniform3fv(loc.center,center);
 gl.uniform3fv(loc.right,right);
 gl.uniform3fv(loc.up,up);
 gl.uniform3fv(loc.toward,camera);
 gl.uniform2fv(loc.half,[halfWidth,halfHeight]);
 for(const [array,buffer,attrib] of [
  [mesh.vertices,buffers.pos,loc.pos],
  [mesh.normals,buffers.normal,loc.normal],
  [mesh.colors,buffers.color,loc.color]
 ]){
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,array,gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(attrib);
  gl.vertexAttribPointer(attrib,3,gl.FLOAT,false,0,0);
 }
 gl.drawArrays(gl.TRIANGLES,0,mesh.vertexCount);
 const error=gl.getError();
 if(error!==gl.NO_ERROR)throw Error('v11g_WebGL2_error_'+error);
 lastAudit=F({
  version:mesh.version,pose,angle,model,gapeDegrees:mesh.gapeDegrees,
  headPitchDegrees:mesh.headPitchDegrees,
  lowerJawRelativeGapeDegrees:mesh.lowerJawRelativeGapeDegrees,
  maximumFixedRootMovement:mesh.maximumFixedRootMovement,
  headLiftIsWholeSkullPitchNotCranialLid:mesh.headLiftIsWholeSkullPitchNotCranialLid,
  splitHeadAndJawControls:mesh.splitHeadAndJawControls,
  upperTipRiseEstimateWorld:mesh.upperTipRiseEstimateWorld,
  movingPreviewPhase:mesh.phase,
  motionInterval:mesh.motionInterval,
  motionProfile:mesh.profile,
  originalSourceModel:mesh.originalMaterialVersion,
  vertexCount:mesh.vertexCount,triangleCount:mesh.triangleCount,
  mouthGapAtMuzzleWorld:mesh.mouthGapAtMuzzleWorld,
  surfaceGroups:mesh.materialTriangleCounts,
  staticOnly:mesh.phase===null,
  animationStudyOnly:mesh.phase!==null,
  realWebGL2Drawn:true,
  coiledRestStaticMode:model==='coil',
  headBodyRootUnmoved:mesh.retainedBodyRoot,
  noProductionControllerTouched:mesh.disconnectedSourceSkeletonUnchanged,
  sameWorldPixelScaleXY:Math.abs(
   canvas.width/(2*halfWidth)-canvas.height/(2*halfHeight))<1e-9,
  original24JointMotionTouched:false,
  productionMeshOrCollisionModified:false,
  downloadedReferenceMeshUsed:false,
  poseAppropriateForVisualReview:true,
  anatomicallyValidated:false,artistAccepted:false
 });
 summary.textContent='V1.1G 影片動作對照｜'+
  (timelineModeEl.checked?'時間 '+timelineEl.value+'%｜':'固定口型 '+pose+'｜')+
  '顎部相對開口 '+mesh.gapeDegrees.toFixed(1)+'°／整顆頭仰起 '+mesh.headPitchDegrees.toFixed(1)+'°／'+angles[angle].label+
  '／'+(model==='coil'?'全身盤繞':'頭部近景')+
  '｜真 WebGL2 '+mesh.triangleCount.toLocaleString()+
  ' 三角面。這是原創顯示用動作研究，並非正式骨架或經驗收的自然動作。';
 window.__warmveinStaticGapeQA=()=>lastAudit;
 window.__warmveinStaticV11gQA=()=>lastAudit;
}
poseEl.addEventListener('change',()=>{
 timelineModeEl.checked=false;playing=false;render();
});
angleEl.addEventListener('change',render);
modelEl.addEventListener('change',render);
profileEl.addEventListener('change',render);
timelineModeEl.addEventListener('change',render);
timelineEl.addEventListener('input',()=>{
 timelineModeEl.checked=true;playing=false;render();
});
function animate(now){
 if(!playing)return;
 if(!started)started=now;
 if(now-lastFrameTime<68){raf=requestAnimationFrame(animate);return;}
 lastFrameTime=now;
 timelineModeEl.checked=true;
 const elapsed=(now-started)%ANIMATION_DURATION_MS;
 timelineEl.value=String(Math.round(elapsed/ANIMATION_DURATION_MS*100));
 render();
 raf=requestAnimationFrame(animate);
}
playEl.addEventListener('click',()=>{
 playing=true;started=0;lastFrameTime=-Infinity;
 if(raf!==null)cancelAnimationFrame(raf);
 raf=requestAnimationFrame(animate);
});
pauseEl.addEventListener('click',()=>{
 playing=false;
 if(raf!==null)cancelAnimationFrame(raf);
 raf=null;
});
saveEl.addEventListener('click',()=>{
 if(!mesh||!lastAudit)throw Error('no static mesh to save');
 const url=canvas.toDataURL('image/png');
 const a=document.createElement('a');
 a.href=url;
 a.download='ohm-v11g-'+modelEl.value+'-'+profileEl.value+'-'+(timelineModeEl.checked?'t'+timelineEl.value:poseEl.value)+'-'+angleEl.value+'.png';
 document.body.appendChild(a);a.click();a.remove();
});
render();
