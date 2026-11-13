/**
 * V1.1A: 16 static 3D views of newly modeled jaw/cranial geometry.
 * Does not import 24-joint gameplay state or external art meshes.
 */
import {buildWarmveinStaticGapeV11a,MOUTH_POSES_V11A}
 from './warmvein-static-gape-v11a.mjs';
const F=Object.freeze;
const canvas=document.querySelector('#render'),
 poseEl=document.querySelector('#pose'),
 angleEl=document.querySelector('#angle'),
 summary=document.querySelector('#summary'),
 saveEl=document.querySelector('#save');
const gl=canvas.getContext('webgl2',{
 alpha:false,depth:true,antialias:true,preserveDrawingBuffer:true,
 powerPreference:'low-power'
});
if(!gl)throw Error('static V1.1A requires WebGL2');
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
let mesh=null,lastAudit=null;
gl.enable(gl.DEPTH_TEST);
gl.depthFunc(gl.LEQUAL);
gl.disable(gl.CULL_FACE);
gl.disable(gl.BLEND);
function render(){
 const pose=poseEl.value,angle=angleEl.value;
 if(!angles[angle])throw new Error('v11a_unknown_camera');
 mesh=buildWarmveinStaticGapeV11a({pose});
 const camera=normalize(angles[angle].v);
 const right=normalize(cross([0,0,1],camera));
 const up=normalize(cross(camera,right));
 const center=[-.12,0,-.08];
 const halfWidth=angle==='side'?.55:.55;
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
 if(error!==gl.NO_ERROR)throw Error('v11a_WebGL2_error_'+error);
 lastAudit=F({
  version:mesh.version,pose,angle,gapeDegrees:mesh.gapeDegrees,
  vertexCount:mesh.vertexCount,triangleCount:mesh.triangleCount,
  mouthGapAtMuzzleWorld:mesh.mouthGapAtMuzzleWorld,
  surfaceGroups:mesh.materialTriangleCounts,
  staticOnly:true,realWebGL2Drawn:true,
  sameWorldPixelScaleXY:Math.abs(
   canvas.width/(2*halfWidth)-canvas.height/(2*halfHeight))<1e-9,
  original24JointMotionTouched:false,
  productionMeshOrCollisionModified:false,
  downloadedReferenceMeshUsed:false,
  poseAppropriateForVisualReview:true,
  anatomicallyValidated:false,artistAccepted:false
 });
 summary.textContent='V1.1A 試作｜'+
  MOUTH_POSES_V11A.find(x=>x.id===pose).label+
  '（顎部角度 '+mesh.gapeDegrees+'°）／'+angles[angle].label+
  '｜真 WebGL2 '+mesh.triangleCount.toLocaleString()+
  ' 三角面。這是獨立原創靜態模型，不是正式骨架、進食模擬或生態箱成品。';
 window.__warmveinStaticGapeQA=()=>lastAudit;
}
poseEl.addEventListener('change',render);
angleEl.addEventListener('change',render);
saveEl.addEventListener('click',()=>{
 if(!mesh||!lastAudit)throw Error('no static mesh to save');
 const url=canvas.toDataURL('image/png');
 const a=document.createElement('a');
 a.href=url;
 a.download='ohm-v11a-static-'+poseEl.value+'-'+angleEl.value+'.png';
 document.body.appendChild(a);a.click();a.remove();
});
render();
