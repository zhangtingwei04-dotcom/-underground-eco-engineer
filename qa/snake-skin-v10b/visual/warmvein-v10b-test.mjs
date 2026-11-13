/**
 * PUBLIC REVIEW V1.0B-V1.0V: actual V0.9T/U mesh -> original warmvein texture in
 * WebGL2. No substitute simulated "snake sprite" here.
 *
 * Uses the matching public neutral source modules in the same repository.
 */
import {createWarmveinPixelAtlasV10b}
 from '../warmvein-skin-v10b.mjs';
import {createWarmveinPixelAtlasV10c}
 from '../warmvein-skin-v10c.mjs';
import {createWarmveinPixelAtlasV10g}
 from '../warmvein-skin-v10g.mjs';
import {createWarmveinPixelAtlasV10p}
 from '../warmvein-skin-v10p.mjs';
import {createWarmveinPixelAtlasV10q}
 from '../warmvein-skin-v10q.mjs';
import {createWarmveinPixelAtlasV10t}
 from '../warmvein-head-neck-skin-v10t.mjs';
import {inspectWarmveinGPUCaptureV10v}
 from '../warmvein-gpu-capture-v10v.mjs';
import {selectWarmveinVisibleEyesV10x}
 from '../warmvein-eye-occlusion-v10x.mjs';
import {makeWarmveinDisplayTaperV10w}
 from '../warmvein-visual-taper-v10w.mjs';
import {deriveWarmveinRenderNormalsV10g}
 from '../warmvein-body-light-v10g.mjs';
import {makeWarmveinTransparentBodyFitV10h}
 from '../warmvein-transparent-body-fit-v10h.mjs';
import {inspectWarmveinBodyContinuityV10j}
 from '../warmvein-body-continuity-v10j.mjs';
import {inspectWarmveinOverlapGroundV10k}
 from '../warmvein-overlap-ground-v10k.mjs';
import {planWarmveinSafeArcV10l,inspectWarmveinApprovedArcStepV10l}
 from '../warmvein-safe-arc-v10l.mjs';
import {beginWarmveinRestHoldV10m,planWarmveinReleaseStepV10m}
 from '../warmvein-rest-release-v10m.mjs';
import {inspectWarmveinRealReverseV10n}
 from '../warmvein-real-reverse-v10n.mjs';
import {planWarmveinReverseFlexV10o,inspectWarmveinReverseFlexV10o}
 from '../warmvein-reverse-flex-v10o.mjs';
import {createWarmveinNoPaintedEyesAtlasV10d,
 deriveWarmveinEyeAnchorsV10d}
 from '../warmvein-eyes-v10d.mjs';
import {fitWarmveinStaticEyesV10e}
 from '../warmvein-static-eye-fit-v10e.mjs';
import {refineWarmveinHeadRenderV10r,fitWarmveinHeadEyesV10r}
 from '../warmvein-head-refine-v10r.mjs';
import {sculptWarmveinHeadV10y,fitWarmveinNaturalEyesV10y}
 from '../warmvein-head-shape-v10y.mjs';
import {inspectWarmveinHeadNeckUVV10s}
 from '../warmvein-head-neck-uv-v10s.mjs';
import {inspectWarmveinAppearanceV10f}
 from '../warmvein-motion-appearance-v10f.mjs';
import {createTerrariumSceneGeometryV03d}
 from '../../snake-motion/src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {startSnakeVariableSizeMotionV09t,
 advanceSnakeVariableSizeMotionV09t,advanceSnakeReverseStepV09y}
 from '../../snake-motion/src/ohm-core/snake-variable-size-locomotion-v09t.mjs';
import {buildSnakeSizedMeshCandidateV09u,
 inspectSnakeSizedMeshStepV09u}
 from '../../snake-motion/src/ohm-core/snake-sized-mesh-motion-v09u.mjs';
import {bindSnakePixelSurfaceV10a}
 from '../../snake-motion/src/ohm-core/snake-pixel-surface-bridge-v10a.mjs';
import {inspectSnakeReverseMeshStepV09y}
 from '../../snake-motion/src/ohm-core/snake-reverse-hide-movement-v09y.mjs';

const F=Object.freeze;
const canvas=document.getElementById('view'),
 status=document.getElementById('status');
const stageEl=document.getElementById('stage'),
 materialEl=document.getElementById('material'),
 turnEl=document.getElementById('turn');
const stepEl=document.getElementById('step'),
 playEl=document.getElementById('play'),
 resetEl=document.getElementById('reset'),
 restEl=document.getElementById('restHold'),
 releaseEl=document.getElementById('releaseTurn'),
 straightEl=document.getElementById('releaseStraight'),
 reverseEl=document.getElementById('reverseReal'),
 reverseFlexEl=document.getElementById('reverseFlex'),
 reverseFlexPlayEl=document.getElementById('reverseFlexPlay'),
 headFocusEl=document.getElementById('headFocus'),
 captureEl=document.getElementById('capture'),
 compareLabelsEl=document.getElementById('compareLabels');
const gl=canvas.getContext('webgl2',{
 alpha:true,preserveDrawingBuffer:true,
 antialias:false,powerPreference:'low-power'
});
const atlases=F({
 pixel:createWarmveinPixelAtlasV10b({seed:18073}),
 'pixel-c':createWarmveinPixelAtlasV10c({seed:18073}),
 'pixel-d':createWarmveinNoPaintedEyesAtlasV10d({seed:18073}),
 'pixel-g':createWarmveinPixelAtlasV10g({seed:18073}),
 'pixel-p':createWarmveinPixelAtlasV10p({seed:18073}),
 'pixel-q':createWarmveinPixelAtlasV10q({seed:18073}),
 'pixel-t':createWarmveinPixelAtlasV10t({seed:18073})
});
let atlas=atlases['pixel-t'];
const atlasCanvas=document.getElementById('atlasPreview');
const contactCanvas=document.getElementById('contactPreview'),
 contactSummaryEl=document.getElementById('contactSummary'),
 neckUVCanvas=document.getElementById('neckUVPreview'),
 neckUVSummaryEl=document.getElementById('neckUVSummary');
const terrain=F({groundZ:0,rock:null,perch:null});
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'public_v10b_standalone_visual_QA',objects:[]
});
const canonicalPose=F({
 version:'0.7U_canonical_source_pose',
 points:F(Array.from({length:24},(_,i)=>F({
  x:1.44-i*2.28/23,y:0,z:.135
 }))),
 bodyRadius:.13,segmentLength:2.28/23
});
const preservedScene=JSON.stringify(scene);
const preservedCanonical=JSON.stringify(canonicalPose);
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
let stage=Number(stageEl.value),state=null,
 meshCandidate=null,authorized=0,mode=materialEl.value,
 running=false,blocked=false,timer=null,lastReason=null;
let program=null,positionBuffer=null,uvBuffer=null,
 normalBuffer=null,texture=null,uMode=null,uScale=null,uCenter=null,
 uSampler=null,positionAttrib=null,uvAttrib=null,normalAttrib=null;
let eyeProgram=null,eyeBuffer=null,eyePositionAttrib=null,
 eyeCenterUniform=null,eyeScaleUniform=null,eyeStyleUniform=null,eyeSizeAttrib=null,
 eyeShadeAttrib=null,eyeDebug=null,eyeVisibility=null;
let cachedMesh=null,cachedGPU=null,lastAppearanceAudit=null,
 latestRenderOnlyBodyFit=null,latestBodyContinuity=null,
 latestContactAudit=null,latestArcAudit=null,
 restHoldSession=null,latestRestHold=null,latestReleaseIntent=null,
 latestReverseAudit=null,latestReverseFlexAudit=null,flexRunning=false,
 latestHeadRefinement=null,latestNeckUVAudit=null,
 latestVisualTaper=null,latestNaturalHead=null,headFocus=false;
const compareMode=()=>mode==='transparent-compare';
const headCompareMode=()=>mode==='head-compare';
const splitCompare=()=>compareMode()||headCompareMode();
const skinCompareMode=()=>mode==='skin-compare';
const naturalHeadCompareMode=()=>mode==='head-y-compare';
const sameFrameSplit=()=>splitCompare()||skinCompareMode()||naturalHeadCompareMode();
const refinedHeadMode=()=>['pixel-q','pixel-t','skin-compare','head-y-compare','transparent','transparent-h',
 'head-compare','flat'].includes(mode);
const eyeIsIndependent=()=>mode!=='pixel'&&mode!=='pixel-c';
function shader(type,src){
 const s=gl.createShader(type);
 gl.shaderSource(s,src);gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
  throw new Error('shader failed: '+gl.getShaderInfoLog(s));
 return s;
}
function initializeGL(){
 if(!gl)throw new Error('WebGL2 not available on this browser');
 const vertex=shader(gl.VERTEX_SHADER,
  '#version 300 es\n'+
  'in vec3 aPosition;\nin vec2 aUV;\nin vec3 aNormal;\n'+
  'uniform vec2 uCenter;\nuniform vec2 uScale;\n'+
  'out vec2 vUV;\nout vec3 vNormal;\n'+
  'void main(){\n'+
  'vec2 p=vec2(aPosition.x,aPosition.y+.56*aPosition.z-.07);\n'+
  'gl_Position=vec4((p-uCenter)/uScale,-(aPosition.z-.56*aPosition.y)*.45,1.0);\n'+
  'vUV=aUV;\nvNormal=aNormal;\n}');
 const fragment=shader(gl.FRAGMENT_SHADER,
  '#version 300 es\nprecision mediump float;\n'+
  'in vec2 vUV;\nin vec3 vNormal;\n'+
  'uniform sampler2D uTexture;\nuniform int uMode;\n'+
  'out vec4 outputColor;\n'+
  'void main(){\n'+
  'vec4 ink=texture(uTexture,vUV);\n'+
  'if(uMode==0)ink=vec4(0.32,0.82,0.87,0.48);\n'+
  'else if(uMode==1)ink=vec4(0.77,0.70,0.58,1.0);\n'+
  'if(uMode==3){\n'+
  'float light=dot(normalize(vNormal),normalize(vec3(0.24,-0.28,0.93)));\n'+
  'float shades=clamp(0.82+0.20*light,0.68,1.08);\n'+
  'shades=floor(shades*7.0+0.5)/7.0;\n'+
  'ink.rgb=clamp(ink.rgb*shades,0.0,1.0);\n}\n'+
  'outputColor=ink;\n}');
 program=gl.createProgram();
 gl.attachShader(program,vertex);
 gl.attachShader(program,fragment);
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))
  throw new Error('shader link failed: '+gl.getProgramInfoLog(program));
 positionBuffer=gl.createBuffer();uvBuffer=gl.createBuffer();
 normalBuffer=gl.createBuffer();
 positionAttrib=gl.getAttribLocation(program,'aPosition');
 uvAttrib=gl.getAttribLocation(program,'aUV');
 normalAttrib=gl.getAttribLocation(program,'aNormal');
 uMode=gl.getUniformLocation(program,'uMode');
 uScale=gl.getUniformLocation(program,'uScale');
 uCenter=gl.getUniformLocation(program,'uCenter');
 uSampler=gl.getUniformLocation(program,'uTexture');
 texture=gl.createTexture();
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,
  atlas.width,atlas.height,0,gl.RGBA,
  gl.UNSIGNED_BYTE,new Uint8Array(atlas.rgba));
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
 gl.disable(gl.CULL_FACE);
 gl.enable(gl.BLEND);
 gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
 gl.enable(gl.DEPTH_TEST);
 gl.depthFunc(gl.LEQUAL);
 initializeEyeGL();
}
/** Two small shader eye sprites attached to real moving head vertices.
 * They are a separate draw pass, not atlas pixels or new physics mesh.
 */
function initializeEyeGL(){
 // Fixed, glossy, deep brown-black eyes. No animated eyelids.
 const vertex=shader(gl.VERTEX_SHADER,`#version 300 es
in vec3 aEyePosition;
in float aEyeSize;
in float aEyeShade;
uniform vec2 uEyeCenter;
uniform vec2 uEyeScale;
out float vEyeShade;
void main(){
 vec2 p=vec2(aEyePosition.x,aEyePosition.y+.56*aEyePosition.z-.07);
 gl_Position=vec4((p-uEyeCenter)/uEyeScale,-(aEyePosition.z-.56*aEyePosition.y)*.45-.002,1.);
 gl_PointSize=aEyeSize;
 vEyeShade=aEyeShade;
}`);
 const fragment=shader(gl.FRAGMENT_SHADER,`#version 300 es
precision mediump float;
in float vEyeShade;
uniform float uEyeStyle;
out vec4 outputColor;
void main(){
 vec2 q=gl_PointCoord-vec2(.5);
 float circle=length(vec2(q.x/.46,q.y/.44));
 if(circle>1.)discard;
 // V1.0R detail remains a shader-only bigger round iris.
 // Snakes keep both eyes open; no eyelids, blink or facial muscles.
 vec3 col=vec3(.075,.040,.028);
 if(uEyeStyle>.5){
  if(circle>.89)col=vec3(.13,.07,.045);
  else if(circle>.77)col=vec3(.44,.23,.10);
  else{
   col=mix(vec3(.60,.30,.095),vec3(.90,.57,.22),
    clamp(.5+.5*(q.x-q.y),0.,1.));
   float irisGrain=sin(atan(q.y,q.x)*21.)*.06;
   col+=vec3(irisGrain,irisGrain*.73,0.);
   if(length(vec2(q.x/.055,q.y/.255))<1.)col=vec3(.035,.026,.022);
  }
  if(length(vec2((q.x+.13)/.075,(q.y+.13)/.082))<1.)
   col=vec3(.98,.91,.75);
 }else{
  // Legacy iris stays available on the left for source comparison.
  if(circle>.87)col=vec3(.27,.12,.070);
  else if(circle>.69)col=vec3(.69,.37,.13);
  else if(circle>.58)col=vec3(.23,.12,.062);
  float glint=length(vec2((q.x+.105)/.080,(q.y+.125)/.079));
  if(glint<1.)col=vec3(.99,.95,.80);
  float lower=length(vec2((q.x-.14)/.10,(q.y-.16)/.053));
  if(lower<1.0 && circle<.65)col=mix(col,vec3(.54,.30,.16),.35);
 }
 outputColor=vec4(clamp(col,0.,1.),vEyeShade);
}`);
 eyeProgram=gl.createProgram();
 gl.attachShader(eyeProgram,vertex);gl.attachShader(eyeProgram,fragment);
 gl.linkProgram(eyeProgram);
 if(!gl.getProgramParameter(eyeProgram,gl.LINK_STATUS))
  throw new Error('independent eye shader link: '+gl.getProgramInfoLog(eyeProgram));
 eyeBuffer=gl.createBuffer();
 eyePositionAttrib=gl.getAttribLocation(eyeProgram,'aEyePosition');
 eyeSizeAttrib=gl.getAttribLocation(eyeProgram,'aEyeSize');
 eyeShadeAttrib=gl.getAttribLocation(eyeProgram,'aEyeShade');
 eyeCenterUniform=gl.getUniformLocation(eyeProgram,'uEyeCenter');
 eyeScaleUniform=gl.getUniformLocation(eyeProgram,'uEyeScale');
 eyeStyleUniform=gl.getUniformLocation(eyeProgram,'uEyeStyle');
}
function paintAtlasPreview(){
 if(!atlasCanvas)return;
 const ctx=atlasCanvas.getContext('2d');
 if(!ctx)return;
 if(atlasCanvas.width!==atlas.width)atlasCanvas.width=atlas.width;
 if(atlasCanvas.height!==atlas.height)atlasCanvas.height=atlas.height;
 const image=ctx.createImageData(atlas.width,atlas.height);
 image.data.set(new Uint8Array(atlas.rgba));
 ctx.putImageData(image,0,0);
 atlasCanvas.dataset.revision=atlas.privateSkinRevision;
}
/**
 * Compact 101-ring ground-distance diagnostic strip from the ORIGINAL
 * V0.9U source. Not a contact force, collision or coiling simulation.
 */
function paintContactAudit(){
 if(!contactCanvas||!latestContactAudit)return;
 const ctx=contactCanvas.getContext('2d');
 if(!ctx)return;
 const a=latestContactAudit,w=contactCanvas.width,h=contactCanvas.height;
 ctx.clearRect(0,0,w,h);
 ctx.fillStyle='#242b22';ctx.fillRect(0,0,w,h);
 const each=w/101;
 const flagged=new Set(a.projectedPairSamples.flatMap(x=>[x.ringA,x.ringB]));
 for(const ring of a.rings){
  ctx.fillStyle=ring.penetratingKnownFlatGround?'#d36463':
   ring.nearFlatGroundCandidate?'#88ad79':
   ring.raisedAboveFlatGroundCandidate?'#d7a15d':'#a3a292';
  ctx.fillRect(ring.ring*each,15,Math.ceil(each)-1,h-33);
  if(flagged.has(ring.ring)){
   ctx.fillStyle='#dfa9a7';
   ctx.fillRect(ring.ring*each,9,Math.ceil(each)-1,5);
  }
 }
 ctx.fillStyle='#f2e6cd';ctx.font='15px system-ui';
 ctx.fillText('頭',7,h-6);
 ctx.fillText('尾',w-25,h-6);
 if(contactSummaryEl){
  contactSummaryEl.textContent=
   '原始 101 環：接近平地 '+a.nearFlatGroundRingCount+
   '／101；明顯離地候選 '+a.raisedAboveFlatGroundRingCount+
   '；畫面投影接近 '+a.projectedProximityPairs+
   ' 組；高度交會候選 '+a.possibleVerticalOverUnderPairs+
   ' 組；上下關係未確定 '+a.unresolvedNearBodyPairs+
   ' 組。注意：這些都不是身體交疊或接觸已通過物理驗收。';
 }
}
function uploadSelectedAtlas(){
 if(!gl||!texture)return;
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,
  atlas.width,atlas.height,0,gl.RGBA,
  gl.UNSIGNED_BYTE,new Uint8Array(atlas.rgba));
}
function uploadViewportAtlas(target){
 if(!gl||!texture||target?.width!==256||target?.height!==128)
  throw new RangeError('v10u_requires_authentic_256x128_rgba_atlas');
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,
  target.width,target.height,0,gl.RGBA,gl.UNSIGNED_BYTE,
  new Uint8Array(target.rgba));
}
function setStatus(message){
 status.textContent=message;
 status.dataset.verifiedFrames=String(authorized);
 status.dataset.stage=String(stage);
 status.dataset.mode=mode;
 status.dataset.skinOk=String(Boolean(meshCandidate?.ok));
 status.dataset.safeHold=String(blocked);
 status.dataset.independentEyes=String(eyeIsIndependent());
 status.dataset.eyeOpening='1';
 status.dataset.blinkFeatureEnabled='false';
 status.dataset.bodyFitV10h=String(mode==='transparent-h'||compareMode());
 status.dataset.sameSourceSplitComparison=String(sameFrameSplit());
 status.dataset.v10uSameFrameQTTextureCompare=String(skinCompareMode());
 status.dataset.v10vCaptureOnlyFromOriginalWebGL='true';
 status.dataset.refinedHeadOnOriginalCollider=String(
  latestHeadRefinement?.displayOnlyNoColliderUpdate??false);
 status.dataset.updatedEyesUseRealHeadRings=String(
  eyeDebug?.version==='1.0R');
 status.dataset.headFocusEnabled=String(headFocus);
 status.dataset.neckUVSourceSafe=String(latestNeckUVAudit?.ok??false);
 status.dataset.neckUVFixedSourceLayout=String(
  latestNeckUVAudit?.fixedUVLayoutVerified??false);
 status.dataset.sharedNeckRingTwoFaces=String(
  latestNeckUVAudit?.socketTwoFaceRingEdgesVerified??false);
 status.dataset.neckCollarSuspected=String(
  latestNeckUVAudit?.suspectedVisibleNeckColorCollar??false);
 status.dataset.dorsalUVAtWorldTop=String(
  latestNeckUVAudit?.dorsalAtlasAlignedToHighestWorldZ??false);
 status.dataset.ventralUVAtWorldBottom=String(
  latestNeckUVAudit?.ventralAtlasAlignedToLowestWorldZ??false);
 status.dataset.collisionShellAdjusted='false';
 status.dataset.contactAuditOnly='true';
 status.dataset.contactAuditOk=String(latestContactAudit?.ok??false);
 status.dataset.originalMinGroundGap=String(
  latestContactAudit?.minimumFlatGroundGapWorld??'');
 status.dataset.sourceGroundEvidenceMatched=String(
  latestContactAudit?.upstreamV09uSourceEvidenceMatched??false);
 status.dataset.authenticatedArcSteps=String(
  latestArcAudit?.verifiedDirectionalFrames??0);
 status.dataset.arcFullyCoiled='false';
 status.dataset.restHoldIsActive=String(restHoldSession?.ok===true);
 status.dataset.restKeepsSameSourceFrame=String(
  latestRestHold?.sourceFrameCountAdvancedByHold===0);
 status.dataset.lastReleaseIsRealSourceRequest=String(
  latestReleaseIntent?.requiresRealV09tStateAdvance??false);
 status.dataset.realV09yReverseVerified=String(
  latestReverseAudit?.reverseSourceAuthenticated??false);
 status.dataset.reverseFlexJointDisplacementDifferent=String(
  latestReverseFlexAudit?.bodyMotionNonRigidAcrossJoints??false);
 status.dataset.bodyContinuityAccepted=String(
  latestBodyContinuity?.ok??false);
 status.dataset.maxWidthRatioStep=String(
  latestBodyContinuity?.maximumRatioDriftAcrossSourceFrames??'');
 status.dataset.appearanceAuditOk=String(lastAppearanceAudit?.ok??false);
 status.dataset.headNeckDegrees=String(
  lastAppearanceAudit?.headNeckTurnDegrees??'');
 status.dataset.minFlatGroundGap=String(
  lastAppearanceAudit?.minimumFlatGroundSurfaceGapWorld??'');
}
/**
 * V0.9R intentionally shares 16 radial vertices at 0...15/16:
 * segment 15→0 crosses the UV angular seam. GPU-only draw
 * triangles get a repeated v=1 copy for seam triangle; no new
 * physics vertices or collision geometry are ever created.
 */
export function expandSnakeGPUSeamTrianglesV10b(mesh){
 if(mesh?.vertexCount!==1617||mesh?.triangleCount!==3216)
  throw new RangeError('unexpected_V09R_shared_mesh');
 const positions=[],uv=[],normals=[];
 const normalData=deriveWarmveinRenderNormalsV10g(mesh).normals;
 for(let k=0;k<mesh.triangles.length;k+=3){
  const ids=mesh.triangles.slice(k,k+3);
  const minV=Math.min(...ids.map(i=>mesh.uv[i].v));
  const maxV=Math.max(...ids.map(i=>mesh.uv[i].v));
  const seam=maxV-minV>.5;
  for(const i of ids){
   const p=mesh.positions[i],q=mesh.uv[i];
   positions.push(p.x,p.y,p.z);
   const n=normalData[i];
   normals.push(n.x,n.y,n.z);
   uv.push(q.u,seam&&q.v<.5?q.v+1:q.v);
  }
 }
 return F({positions:new Float32Array(positions),
  uv:new Float32Array(uv),
  normals:new Float32Array(normals),
  renderVertexCount:mesh.triangleCount*3,
  originalPhysicsVertexCount:mesh.vertexCount,
  triangleCount:mesh.triangleCount,
  rendererOnlySeamDuplicate:true});
}
function drawIndependentEyes(mesh,midX,halfWidth,viewportWidth=canvas.width,{
 enhanced=false,verticalHalf=.54,centerY=0
}={}){
 if(!eyeProgram||!eyeIsIndependent())return;
 // Both versions use REAL V0.9R head ring-4 vertices on the
 // currently displayed render mesh, not painted UV nor a fake face.
 const naturalHead=enhanced&&mesh.v10yDisplayOnlyHead===true;
 eyeDebug=(naturalHead?fitWarmveinNaturalEyesV10y:
  enhanced?fitWarmveinHeadEyesV10r:fitWarmveinStaticEyesV10e)({
  mesh,stageProgress:stage,canvasWidth:viewportWidth,
  worldHalfWidth:halfWidth
 });
 // Keep BOTH eyes attached to their original head vertices, but on
 // a side-on camera only draw the near eye. Far-eye GL point sprites
 // cannot be allowed to protrude around the head silhouette.
 eyeVisibility=selectWarmveinVisibleEyesV10x({mesh,eyes:eyeDebug.eyes});
 const packed=new Float32Array(
  eyeVisibility.visibleEyes.flatMap(e=>[
   e.position.x,e.position.y,e.position.z,
   e.pointSizePx,e.faceBrightness
  ])
 );
 gl.useProgram(eyeProgram);
 gl.uniform2f(eyeScaleUniform,halfWidth,verticalHalf);
 gl.uniform1f(eyeStyleUniform,enhanced?1:0);
 gl.uniform2f(eyeCenterUniform,midX,centerY);
 gl.bindBuffer(gl.ARRAY_BUFFER,eyeBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,packed,gl.DYNAMIC_DRAW);
 gl.enableVertexAttribArray(eyePositionAttrib);
 gl.vertexAttribPointer(eyePositionAttrib,3,gl.FLOAT,false,20,0);
 gl.enableVertexAttribArray(eyeSizeAttrib);
 gl.vertexAttribPointer(eyeSizeAttrib,1,gl.FLOAT,false,20,12);
 gl.enableVertexAttribArray(eyeShadeAttrib);
 gl.vertexAttribPointer(eyeShadeAttrib,1,gl.FLOAT,false,20,16);
 gl.depthMask(false);
 gl.drawArrays(gl.POINTS,0,eyeVisibility.visibleEyeCount);
 gl.depthMask(true);
}
/**
 * V1.0I uses the SAME WebGL2 context, V0.9T/U state and approved frame
 * on BOTH halves. Only the displayed positions differ. The source
 * renderCandidate and collision shell are never replaced.
 */
function drawSourceViewport(mesh,midX,halfWidth,{
 viewportX=0,viewportWidth=canvas.width,comparison=false,
 enhancedEyes=false,verticalHalf=.54,centerY=0,
 textureAtlas=null,forcePixel=false
}={}){
 const expanded=expandSnakeGPUSeamTrianglesV10b(mesh);
 gl.viewport(viewportX,0,viewportWidth,canvas.height);
 gl.scissor(viewportX,0,viewportWidth,canvas.height);
 gl.enable(gl.SCISSOR_TEST);
 gl.clear(gl.DEPTH_BUFFER_BIT);
 if(textureAtlas)uploadViewportAtlas(textureAtlas);
 gl.useProgram(program);
 gl.uniform1i(uMode,forcePixel?3:comparison?0:(mode==='pixel-g'||mode==='pixel-p'||mode==='pixel-q'||mode==='pixel-t')?3:
  (mode==='pixel'||mode==='pixel-c'||mode==='pixel-d')?2:
  mode==='flat'?1:0);
 gl.uniform2f(uScale,halfWidth,verticalHalf);
 gl.uniform2f(uCenter,midX,centerY);
 gl.activeTexture(gl.TEXTURE0);
 gl.bindTexture(gl.TEXTURE_2D,texture);
 gl.uniform1i(uSampler,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,expanded.positions,gl.DYNAMIC_DRAW);
 gl.enableVertexAttribArray(positionAttrib);
 gl.vertexAttribPointer(positionAttrib,3,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,uvBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,expanded.uv,gl.DYNAMIC_DRAW);
 gl.enableVertexAttribArray(uvAttrib);
 gl.vertexAttribPointer(uvAttrib,2,gl.FLOAT,false,0,0);
 gl.bindBuffer(gl.ARRAY_BUFFER,normalBuffer);
 gl.bufferData(gl.ARRAY_BUFFER,expanded.normals,gl.DYNAMIC_DRAW);
 gl.enableVertexAttribArray(normalAttrib);
 gl.vertexAttribPointer(normalAttrib,3,gl.FLOAT,false,0,0);
 gl.drawArrays(gl.TRIANGLES,0,expanded.renderVertexCount);
 drawIndependentEyes(mesh,midX,halfWidth,viewportWidth,{
  enhanced:enhancedEyes,verticalHalf,centerY
 });
 gl.disable(gl.SCISSOR_TEST);
}
/**
 * Color swatches are actual atlas texels at original V0.9R ring UVs.
 * 16 columns = 16 real radial sectors. This is a source UV diagnostic,
 * never a fake image of the 3D head, and never a UV rewrite.
 */
function paintNeckUVReview(){
 if(!neckUVCanvas||!latestNeckUVAudit?.ok)return;
 const ctx=neckUVCanvas.getContext('2d');
 if(!ctx)return;
 const source=latestHeadRefinement?.originalSourceMesh??
  latestRenderOnlyBodyFit?.renderMesh??meshCandidate?.mesh;
 if(!source)return;
 const uvAtlas=mode==='pixel-q'?atlases['pixel-q']:atlases['pixel-t'],total=16;
 ctx.clearRect(0,0,neckUVCanvas.width,neckUVCanvas.height);
 ctx.fillStyle='#1e2621';
 ctx.fillRect(0,0,neckUVCanvas.width,neckUVCanvas.height);
 ctx.textBaseline='middle';
 ctx.font='16px system-ui';
 const rows=[{ring:7,name:'頭部末環'},{ring:8,name:'共用頸環'},
  {ring:9,name:'身體首環'}];
 for(let row=0;row<3;row++){
  const y=12+row*40;
  ctx.fillStyle='#e8dfbc';
  ctx.fillText(rows[row].name,8,y+13);
  for(let j=0;j<total;j++){
   const uv=source.uv[rows[row].ring*16+j];
   const ix=clamp(Math.floor(uv.u*uvAtlas.width),0,uvAtlas.width-1);
   const iy=clamp(Math.floor(uv.v*uvAtlas.height),0,uvAtlas.height-1);
   const rgba=uvAtlas.sampleRGBA(ix,iy);
   const x=143+j*57;
   ctx.fillStyle='rgb('+rgba.slice(0,3).join(',')+')';
   ctx.fillRect(x,y,52,25);
   if(row===0){
    ctx.fillStyle='#e9dbab';ctx.font='11px system-ui';
    ctx.fillText(String(j),x+19,5);
   }
   if(row===1&&latestNeckUVAudit.sectors[j].
      headToSocketColorJumpRGB>90){
    ctx.strokeStyle='#e8ae6d';ctx.lineWidth=2;
    ctx.strokeRect(x,y,52,25);
   }
  }
 }
 neckUVSummaryEl.textContent=
  '真 V0.9R 第8頭環→共用頸環→第一身環；接縫每條邊有兩面／固定UV='+
  (latestNeckUVAudit.socketTwoFaceRingEdgesVerified?'是':'否')+
  '；背面對應上方／腹面對應下方='+
  (latestNeckUVAudit.dorsalAtlasAlignedToHighestWorldZ?'是':'待確認')+'／'+
  (latestNeckUVAudit.ventralAtlasAlignedToLowestWorldZ?'是':'待確認')+
  '；最高取色差 '+latestNeckUVAudit.maxNearestColorJumpRGB.toFixed(1)+
  ' RGB距離；'+
  (latestNeckUVAudit.suspectedVisibleNeckColorCollar?
   '疑似連續領圈，需目視調整':'沒有偵測到大範圍連續高對比領圈')+
  '。僅為UV/材質取樣診斷，不是實機畫面或美術合格證明。';
}
function render(){
 if(!gl||!state||!meshCandidate?.ok)return;
 const binding=bindSnakePixelSurfaceV10a({
  renderCandidate:meshCandidate,
  mode:(mode==='pixel'||mode==='pixel-c'||mode==='pixel-d'||mode==='pixel-g'||mode==='pixel-p'||mode==='pixel-q'||mode==='pixel-t'||mode==='skin-compare'||mode==='head-y-compare')?'pixel_debug':
   mode==='flat'?'flat_debug':'transparent',
  atlas
 });
 if(!binding.ok){stop();blocked=true;
  setStatus('材質安全閘門拒絕：'+binding.reason);return;}
 // Both compare panels are backed by the SAME actual V0.9U source frame.
 // The fitter alters ONLY renderer positions, never collision or UV.
 latestRenderOnlyBodyFit=(mode==='transparent-h'||compareMode())?
  makeWarmveinTransparentBodyFitV10h({
   sourceMesh:binding.mesh,stageProgress:stage,intensity:1
  }):null;
 // V1.0W is a LOCAL DISPLAY-ONLY shape candidate for Q/T skin.
 // Source motion, V0.9U physics shell, UV/index and save never change.
 const untaperedMesh=latestRenderOnlyBodyFit?.renderMesh??binding.mesh;
 latestVisualTaper=['pixel-q','pixel-t','skin-compare'].includes(mode)?
  makeWarmveinDisplayTaperV10w({
   sourceMesh:untaperedMesh,stageProgress:stage
  }):null;
 const originalOrBodyMesh=latestVisualTaper?.renderMesh??untaperedMesh;
 latestHeadRefinement=refinedHeadMode()?
  refineWarmveinHeadRenderV10r({
   mesh:originalOrBodyMesh,stageProgress:stage,intensity:1
  }):null;
 latestNaturalHead=latestHeadRefinement&&
  (['pixel-q','pixel-t','skin-compare','head-y-compare'].includes(mode))?
  sculptWarmveinHeadV10y({
   sourceMesh:latestHeadRefinement.renderMesh,stageProgress:stage
  }):null;
 const visibleMesh=latestNaturalHead?.renderMesh??
  latestHeadRefinement?.renderMesh??originalOrBodyMesh;
 try{
  latestNeckUVAudit=inspectWarmveinHeadNeckUVV10s({
   sourceMesh:originalOrBodyMesh,renderMesh:visibleMesh,
   atlas:mode==='pixel-q'?atlases['pixel-q']:atlases['pixel-t'],
   stageProgress:stage
  });
 }catch(error){
  stop();blocked=true;latestNeckUVAudit=null;
  setStatus('V1.0S 原始頭頸拓樸或 UV 被改動，安全停止：'+error.message);
  return;
 }
 const length=state.pose.boneLengths.reduce((a,b)=>a+b,0);
 const fullHalfWidth=(length+.65)*.55;
 const headRadius=state.pose.radiiWorldUnits[0];
 // Magnify the SAME actual moving head. Keep the x/y zoom isotropic.
 const nose=visibleMesh.positions[visibleMesh.noseVertexIndex];
 const originalHead=state.pose.points[0];
 const midX=headFocus?(originalHead.x+nose.x)*.5:
  (1.44+(1.44-length))*.5;
 const centerY=headFocus?.5*(
  originalHead.y+.56*originalHead.z-.07+
  nose.y+.56*nose.z-.07):0;
 const halfWidth=headFocus?headRadius*3.4:fullHalfWidth;
 const verticalHalf=headFocus?.54*halfWidth/fullHalfWidth:.54;
 gl.viewport(0,0,canvas.width,canvas.height);
 gl.disable(gl.SCISSOR_TEST);
 gl.clearColor(0,0,0,0);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 if(sameFrameSplit()){
  const leftWidth=Math.floor(canvas.width/2);
  const rightWidth=canvas.width-leftWidth;
  if(skinCompareMode()){
   // V1.0U: one approved source frame, ONE identical V1.0R render mesh,
   // same eye anchors/camera/lighting; only UV RGBA source changes.
   // Each viewport uploads its own actual Q or T material to the GPU.
   drawSourceViewport(visibleMesh,midX,halfWidth,{
    viewportX:0,viewportWidth:leftWidth,
    textureAtlas:atlases['pixel-q'],forcePixel:true,
    enhancedEyes:true,verticalHalf,centerY
   });
   drawSourceViewport(visibleMesh,midX,halfWidth,{
    viewportX:leftWidth,viewportWidth:rightWidth,
    textureAtlas:atlases['pixel-t'],forcePixel:true,
    enhancedEyes:true,verticalHalf,centerY
   });
  }else if(naturalHeadCompareMode()){
   // Same source frame, same approved V1.0T atlas and same camera;
   // left previous V1.0R and right sculpted V1.0Y with smaller eyes.
   drawSourceViewport(latestHeadRefinement.renderMesh,midX,halfWidth,{
    viewportX:0,viewportWidth:leftWidth,
    textureAtlas:atlases['pixel-t'],forcePixel:true,
    enhancedEyes:true,verticalHalf,centerY
   });
   drawSourceViewport(visibleMesh,midX,halfWidth,{
    viewportX:leftWidth,viewportWidth:rightWidth,
    textureAtlas:atlases['pixel-t'],forcePixel:true,
    enhancedEyes:true,verticalHalf,centerY
   });
  }else{
   // Head: V0.9R vs inward-only V1.0R.
   // Body: original vs V1.0H. Both use the SAME original source frame.
   drawSourceViewport(binding.mesh,midX,halfWidth,{
    viewportX:0,viewportWidth:leftWidth,comparison:true,
    enhancedEyes:false,verticalHalf,centerY
   });
   drawSourceViewport(visibleMesh,midX,halfWidth,{
    viewportX:leftWidth,viewportWidth:rightWidth,comparison:true,
    enhancedEyes:headCompareMode(),verticalHalf,centerY
   });
  }
 }else{
  drawSourceViewport(visibleMesh,midX,halfWidth,{
   comparison:false,enhancedEyes:Boolean(latestHeadRefinement),
   verticalHalf,centerY
  });
 }
 if(compareLabelsEl){
  compareLabelsEl.hidden=!sameFrameSplit();
  if(skinCompareMode()){
   compareLabelsEl.children[0].textContent='左｜V1.0Q 舊橘色頭部';
   compareLabelsEl.children[1].textContent='右｜V1.0T 新深褐頭頸';
  }else if(naturalHeadCompareMode()){
   compareLabelsEl.children[0].textContent='左｜V1.0R 舊粗頭＋大眼';
   compareLabelsEl.children[1].textContent='右｜V1.0Y 修長蛇頭＋小眼';
  }else if(headCompareMode()){
   compareLabelsEl.children[0].textContent='左｜V0.9R 原透明頭・舊眼睛';
   compareLabelsEl.children[1].textContent='右｜V1.0R 修正頭型・較大眼睛';
  }else{
   compareLabelsEl.children[0].textContent='左｜原始透明身體';
   compareLabelsEl.children[1].textContent='右｜V1.0H 修正版';
  }
 }
 paintContactAudit();
 paintNeckUVReview();
 setStatus('公開骨架／皮膚 '+atlas.privateSkinRevision+' 模式：'+mode+'｜'+
  (eyeIsIndependent()?'獨立雙眼固定張眼（眨眼暫緩）｜':'舊貼圖眼｜')+
  ['幼體','成長中','成體','大型成體'][stage]+
  '｜真實來源 '+authorized+' 幀｜'+
  (naturalHeadCompareMode()?'V1.0Y 頭型前後對照（同 T 材質；兩個外觀候選；碰撞原版）｜':
   skinCompareMode()?'真正 WebGL 同幀 Q/T 頭頸貼皮比較（同網格、同 Y 頭型、不同 RGBA）｜':
   headCompareMode()?'頭部左右同幀：原始頭 / V1.0R 大眼頭（碰撞同原版）｜':
   compareMode()?'左右同幀：原版 / V1.0H（碰撞同原版）｜':
   latestHeadRefinement?.ok?'V1.0R 微修頭型＋放大張眼（僅顯示）｜':
   mode==='transparent-h'?'V1.0H 側面收斂（僅顯示）｜':'')+
  (latestReverseAudit?.ok?
   'V0.9Y 真骨架後退 1 幀（不是解盤）｜':'')+
  (latestReverseFlexAudit?.ok?
   'V1.0O 逐節位移差 '+latestReverseFlexAudit.maximumJointDisplacementDifferenceFromHeadWorld.toFixed(5)+
   '；彎曲變化 '+latestReverseFlexAudit.centerlineBendDeltaRadians.toFixed(5)+
   ' rad（仍須目視驗收）｜':'')+
  (restHoldSession?.ok?'保持原始姿勢休息（未推進影格）｜':
   latestReleaseIntent?.ok?'已執行反向／直行來源步進（非真正解盤）｜':'')+
  (latestArcAudit?.ok&&latestArcAudit.verifiedDirectionalFrames>0?
   '真骨架漸轉 '+latestArcAudit.directionalArcDegrees.toFixed(1)+
   '°（非完整盤繞）｜':'')+
  (latestNeckUVAudit?.ok?
   '頸UV固定；頸口'+latestNeckUVAudit.sharedSocketImageX+'px；'+
    (latestNeckUVAudit.suspectedVisibleNeckColorCollar?'色差疑似領圈（待看圖）':'無廣泛連續高對比領圈')+
    '｜':'')+
  (latestContactAudit?.ok?
   '接地近環 '+latestContactAudit.nearFlatGroundRingCount+
   '／101；投影接近 '+latestContactAudit.projectedProximityPairs+' 組（非真盤繞）｜':'')+
  ((compareMode()||mode==='transparent-h')&&latestBodyContinuity?.ok?
    '中段側寬 '+(latestBodyContinuity.trunkMiddleSideWidthRatio*100).toFixed(1)+
    '%｜頭頸側寬 '+(latestBodyContinuity.headToNeckSideWidthRatios[0]*100).toFixed(1)+
    '%｜連續檢查通過｜':'')+
  '轉向 '+Number(turnEl.value).toFixed(3)+' rad/幀｜'+
  (lastAppearanceAudit?.ok?
   '頭頸彎 '+lastAppearanceAudit.headNeckTurnDegrees.toFixed(1)+'°｜'+
   '貼地間隙 '+lastAppearanceAudit.minimumFlatGroundSurfaceGapWorld.toFixed(3)+'（平地）｜'+
   'UV固定 '+(lastAppearanceAudit.uvIdenticalAcrossStep?'是':'否')+'｜':
   '外觀稽核待測｜')+
  '完整 1,617 頂點、3,216 面｜'+
  '骨長／半徑與碰撞體未由材質更改');
}
function resetStage(){
 stop();blocked=false;lastReason=null;latestArcAudit=null;
 restHoldSession=null;latestRestHold=null;latestReleaseIntent=null;
 latestReverseAudit=null;latestReverseFlexAudit=null;
 stage=Number(stageEl.value);
 const initial=startSnakeVariableSizeMotionV09t({
  canonicalSourcePose:canonicalPose,scene,terrain,
  stageProgress:stage
 });
 if(initial.phase!=='moving_sized')
  throw new Error('V0.9T initial source refused: '+initial.status);
 state=initial;authorized=0;
 meshCandidate=buildSnakeSizedMeshCandidateV09u({
  sizedState:state,scene,terrain
 });
 if(!meshCandidate.ok)
  throw new Error('V0.9U mesh refused: '+meshCandidate.reason);
 latestContactAudit=inspectWarmveinOverlapGroundV10k({
  candidate:meshCandidate,groundZ:0
 });
 if(!latestContactAudit.ok)
  throw new Error('V1.0K 初始接觸診斷拒絕：'+latestContactAudit.reason);
 lastAppearanceAudit=inspectWarmveinAppearanceV10f({
  candidate:meshCandidate,atlas,stageProgress:stage,groundZ:0
 });
 latestBodyContinuity=inspectWarmveinBodyContinuityV10j({
  fit:makeWarmveinTransparentBodyFitV10h({
   sourceMesh:meshCandidate.mesh,stageProgress:stage,intensity:1
  })
 });
 if(!latestBodyContinuity.ok)
  throw new Error('V1.0J 初始輪廓連續性失敗：'+latestBodyContinuity.reason);
 if(!lastAppearanceAudit.ok)
  throw new Error('V1.0F 初始外觀稽核失敗：'+lastAppearanceAudit.reason);
 render();
}
function safeStep(){
 if(blocked||!state)return false;
 if(restHoldSession?.ok){
  stop();
  setStatus('V1.0M 保持原來源姿勢休息中：不推進骨架影格。請選反向舒展或直行恢復。');
  return false;
 }
 if(latestReleaseIntent?.ok&&
    state.verifiedFrames!==latestReleaseIntent.sourceFrame)
  latestReleaseIntent=null;
 const turnRadians=Number(turnEl.value);
 const arcIntent=planWarmveinSafeArcV10l({
  state,requestedTurnRadians:turnRadians
 });
 if(!arcIntent.ok){
  blocked=true;lastReason=arcIntent.reason;
  stop();setStatus('V1.0L 盤繞探索角度限制停止：'+lastReason);
  return false;
 }
 const next=advanceSnakeVariableSizeMotionV09t({
  state,scene,terrain,seconds:1/30,turnRadians
 });
 if(next.phase!=='moving_sized'||
  next.verifiedFrames!==state.verifiedFrames+1){
  blocked=true;lastReason=next.status??'V0.9T hold';
  stop();setStatus('原有骨架安全停止：'+lastReason);return false;
 }
 const evidence=inspectSnakeSizedMeshStepV09u({
  previousState:state,nextState:next,
  scene,terrain,seconds:1/30,turnRadians
 });
 if(!evidence.ok){blocked=true;
  lastReason=evidence.reason;stop();
  setStatus('V0.9U 完整頭身網格阻止此影格：'+lastReason);
  return false;
 }
 const mesh=buildSnakeSizedMeshCandidateV09u({
  sizedState:next,scene,terrain
 });
 if(!mesh.ok){blocked=true;stop();
  setStatus('新網格貼皮拒絕：'+mesh.reason);return false;}
 const bound=bindSnakePixelSurfaceV10a({
  renderCandidate:mesh,atlas,mode:'pixel_debug'
 });
 if(!bound.ok){blocked=true;stop();
  setStatus('材質檢查拒絕：'+bound.reason);return false;}
 const appearance=inspectWarmveinAppearanceV10f({
  candidate:mesh,previousCandidate:meshCandidate,
  atlas,stageProgress:stage,groundZ:0
 });
 const contactAudit=inspectWarmveinOverlapGroundV10k({
  candidate:mesh,sourceV09uStep:evidence,groundZ:0
 });
 if(!contactAudit.ok||
    !contactAudit.upstreamV09uSourceEvidenceMatched){
  blocked=true;lastReason=contactAudit.reason??'v09u_source_evidence_mismatch';
  stop();setStatus('V1.0K 真來源交疊／地面診斷停止：'+lastReason);
  return false;
 }
 const nextArcAudit=inspectWarmveinApprovedArcStepV10l({
  previousState:state,nextState:next,
  sourceEvidence:evidence,contactAudit,
  arcIntent,previousArcTrace:latestArcAudit
 });
 if(!nextArcAudit.ok){
  blocked=true;lastReason=nextArcAudit.reason;stop();
  setStatus('V1.0L 真骨架轉向驗證停止：'+lastReason);
  return false;
 }
 const continuity=inspectWarmveinBodyContinuityV10j({
  fit:makeWarmveinTransparentBodyFitV10h({
   sourceMesh:mesh.mesh,stageProgress:stage,intensity:1
  }),
  previousFit:makeWarmveinTransparentBodyFitV10h({
   sourceMesh:meshCandidate.mesh,stageProgress:stage,intensity:1
  })
 });
 if(!continuity.ok){
  blocked=true;lastReason=continuity.reason;stop();
  setStatus('V1.0J 顯示輪廓連續性拒絕：'+continuity.reason);
  return false;
 }
 if(!appearance.ok){
  blocked=true;stop();
  setStatus('V1.0F 外觀/UV 一致性拒絕：'+appearance.reason);
  return false;
 }
 lastAppearanceAudit=appearance;
 latestBodyContinuity=continuity;
 latestContactAudit=contactAudit;
 latestArcAudit=nextArcAudit;
 latestReverseAudit=null;latestReverseFlexAudit=null;
 state=next;meshCandidate=mesh;authorized++;
 render();return true;
}
function stop(){
 if(timer!==null){clearInterval(timer);timer=null;}
 running=false;flexRunning=false;playEl.textContent='連續預覽';
 reverseFlexPlayEl.textContent='連續細微彎曲後退';
}
function start(){
 if(!state||blocked)return;
 if(running){stop();return;}
 if(restHoldSession?.ok){
  setStatus('V1.0M 仍在保持姿勢，不能啟動連續移動；請先選擇恢復方式。');
  return;
 }
 running=true;playEl.textContent='暫停';
 timer=setInterval(()=>{if(!safeStep())stop();},350);
}
stageEl.addEventListener('change',()=>{
 try{resetStage()}catch(e){stop();setStatus(e.message);}
});
materialEl.addEventListener('change',()=>{
 mode=materialEl.value;
 atlas=atlases[mode]??atlases['pixel-t'];
 lastAppearanceAudit=inspectWarmveinAppearanceV10f({
  candidate:meshCandidate,atlas,stageProgress:stage,groundZ:0
 });
 uploadSelectedAtlas();paintAtlasPreview();render();
});
turnEl.addEventListener('change',()=>render());
headFocusEl.addEventListener('click',()=>{
 headFocus=!headFocus;
 headFocusEl.textContent=headFocus?'查看完整蛇身':'放大查看頭部';
 render();
});
/**
 * V1.0V — an actual WebGL2 framebuffer PNG, not an atlas diagram.
 * Browser-local download only. Never uploads proprietary textures,
 * bypasses source locomotion guards, or touches the player's saves.
 */
function captureVisibleWebGLV10v(){
 if(!gl||!state||!meshCandidate?.ok||blocked){
  setStatus('V1.0V 擷取拒絕：原始骨架未載入或已安全停止。');
  return;
 }
 try{
  // Freeze the approved source frame before reading the GPU buffer.
  stop();
  render();
  if(blocked)return;
  const rgba=new Uint8Array(canvas.width*canvas.height*4);
  gl.finish();
  gl.readPixels(0,0,canvas.width,canvas.height,
   gl.RGBA,gl.UNSIGNED_BYTE,rgba);
  const gpuError=gl.getError();
  if(gpuError!==gl.NO_ERROR)
   throw new Error('WebGL2 readPixels '+gpuError);
  const audit=inspectWarmveinGPUCaptureV10v({
   rgba,width:canvas.width,height:canvas.height,
   split:sameFrameSplit(),qtCompare:skinCompareMode()
  });
  if(!audit.ok)
   throw new Error('真畫面驗證拒絕：'+audit.reason);
  const exportCanvas=document.createElement('canvas');
  exportCanvas.width=canvas.width;
  exportCanvas.height=canvas.height+132;
  const ctx=exportCanvas.getContext('2d');
  if(!ctx)throw new Error('無法建立本機輸出畫布');
  ctx.fillStyle='#1d231d';
  ctx.fillRect(0,0,exportCanvas.width,exportCanvas.height);
  ctx.fillStyle='#f3dfb6';ctx.font='bold 23px system-ui';
  ctx.fillText('暖脈枝蛇｜V1.0V 真 WebGL2 原始影格擷取',22,34);
  ctx.font='15px system-ui';ctx.fillStyle='#d5c5a8';
  ctx.fillText('來源：V0.9T/U 24 節骨架；外觀比較非物理驗收',22,56);
  // The actual WebGL canvas is the ONLY depicted snake image.
  // CSS-scene decoration is not copied or mistaken for 3D content.
  ctx.fillStyle='#47513c';
  ctx.fillRect(0,66,canvas.width,canvas.height);
  ctx.drawImage(canvas,0,66);
  if(skinCompareMode()){
   ctx.fillStyle='#1d231de6';
   ctx.fillRect(9,74,canvas.width/2-18,36);
   ctx.fillRect(canvas.width/2+9,74,canvas.width/2-18,36);
   ctx.fillStyle='#faf0d6';ctx.font='bold 17px system-ui';
   ctx.fillText('左｜原版 V1.0Q',22,99);
   ctx.fillText('右｜修正 V1.0T',canvas.width/2+22,99);
  }
  ctx.fillStyle='#d9c8a6';ctx.font='15px system-ui';
  const name=['幼體','成長中','成體','大型成體'][stage];
  ctx.fillText('體型：'+name+'　安全來源影格：'+authorized+
   '　顯示：'+mode+'　'+(headFocus?'頭部特寫':'完整蛇身'),
   22,canvas.height+93);
  ctx.fillText('GPU 有色像素：'+audit.visiblePixels+
   (skinCompareMode()?'　Q／T 差異像素：'+
     audit.pixelsWithQTColorDifference:'')+
   '　｜　未經 iPhone Safari 美術／效能驗收',
   22,canvas.height+116);
  const png=exportCanvas.toDataURL('image/png');
  if(!png.startsWith('data:image/png;base64,'))
   throw new Error('PNG 編碼失敗');
  const link=document.createElement('a');
  link.href=png;
  link.download='warmvein-v10v-'+mode+'-stage'+stage+
   '-frame'+authorized+(headFocus?'-head':'-body')+'.png';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setStatus('V1.0V 真 WebGL2 像素檢查通過，已向瀏覽器提出本機 PNG 下載：'+
   audit.visiblePixels+' 有色像素'+
   (skinCompareMode()?'；Q/T 色差 '+audit.pixelsWithQTColorDifference+' 像素':'')+
   '。請確認 Safari 下載項目；這不是完成品／效能驗收。');
 }catch(error){
  setStatus('V1.0V 未輸出畫面：'+error.message+
   '。保留目前來源狀態，可嘗試 iPhone 原生截圖。');
 }
}
captureEl.addEventListener('click',captureVisibleWebGLV10v);

restEl.addEventListener('click',()=>{
 if(blocked||!state){
  setStatus('安全停止的來源狀態不能用休息按鈕解鎖；請重置測試。');
  return;
 }
 stop();
 const session=beginWarmveinRestHoldV10m({
  state,approvedArc:latestArcAudit
 });
 if(!session.ok){
  setStatus('V1.0M 保持姿勢失敗：'+session.reason);
  return;
 }
 latestRestHold=session;restHoldSession=session;latestReleaseIntent=null;
 render();
});
function reverseHeldPose({flex=false,fromLoop=false}={}){
 const continuedFlex=flex&&latestReverseFlexAudit?.ok===true&&
  latestReverseFlexAudit.sourceFrameEnd===state?.verifiedFrames;
 if(blocked||!state||!(restHoldSession?.ok||continuedFlex)){
  setStatus('先保持來源姿勢，才能測試 V0.9Y 真後退；成功後可連續微彎。');
  return false;
 }
 if(!fromLoop)stop();
 const flexPlan=planWarmveinReverseFlexV10o({
  state,mode:flex?'micro-flex':'straight'
 });
 if(!flexPlan.ok){
  setStatus('V1.0O 真後退轉向限制拒絕：'+flexPlan.reason);
  return false;
 }
 const turnRadians=flexPlan.turnRadians;
 // Use V0.9Y's independent reverse source, NEVER replay reverse
 // through V0.9U's forward-only inspectSnakeSizedMeshStepV09u.
 const next=advanceSnakeReverseStepV09y({
  state,scene,terrain,seconds:1/30,turnRadians
 });
 if(next.phase!=='moving_sized'||
    next.verifiedFrames!==state.verifiedFrames+1){
  setStatus('V0.9Y 後退原骨架安全停止：'+(next.status??'source_safety_hold'));
  return false; // keep the original held source and do not advance
 }
 const proof=inspectSnakeReverseMeshStepV09y({
  previousState:state,nextState:next,
  scene,terrain,seconds:1/30,turnRadians
 });
 if(!proof.ok){
  setStatus('V0.9Y 後退完整網格拒絕：'+(proof.reason??'unknown'));
  return false;
 }
 const mesh=proof.finalMesh;
 if(!mesh?.ok){
  setStatus('V1.0N 真來源後退沒有有效的完整頭身網格');
  return false;
 }
 const bound=bindSnakePixelSurfaceV10a({
  renderCandidate:mesh,atlas,mode:'pixel_debug'
 });
 if(!bound.ok){
  setStatus('V1.0N 後退外觀綁定拒絕：'+bound.reason);return false;
 }
 const contactAudit=inspectWarmveinOverlapGroundV10k({
  candidate:mesh,groundZ:0
 });
 const approved=inspectWarmveinRealReverseV10n({
  previousState:state,nextState:next,
  reverseProof:proof,contactObservation:contactAudit,
  requestedTurnRadians:turnRadians
 });
 if(!approved.ok){
  setStatus('V1.0N 後退真來源證據拒絕：'+approved.reason);
  return false;
 }
 const flexAudit=flex?inspectWarmveinReverseFlexV10o({
  previousState:state,nextState:next,
  approvedReverse:approved,plan:flexPlan
 }):null;
 if(flex&&!flexAudit?.ok){
  setStatus('V1.0O 逐節後退審核拒絕：'+(flexAudit?.reason??'unknown'));
  return false;
 }
 const appearance=inspectWarmveinAppearanceV10f({
  candidate:mesh,previousCandidate:meshCandidate,
  atlas,stageProgress:stage,groundZ:0
 });
 const continuity=inspectWarmveinBodyContinuityV10j({
  fit:makeWarmveinTransparentBodyFitV10h({
   sourceMesh:mesh.mesh,stageProgress:stage,intensity:1
  }),
  previousFit:makeWarmveinTransparentBodyFitV10h({
   sourceMesh:meshCandidate.mesh,stageProgress:stage,intensity:1
  })
 });
 if(!appearance.ok||!continuity.ok){
  setStatus('V1.0N 後退外觀/寬度審核未通過：'+
   (!appearance.ok?appearance.reason:continuity.reason));
  return false;
 }
 // Source commit occurs ONLY after all 0.9Y and private guards pass.
 latestReverseAudit=approved;
 latestReverseFlexAudit=flexAudit;
 lastAppearanceAudit=appearance;
 latestBodyContinuity=continuity;
 latestContactAudit=contactAudit;
 latestArcAudit=null;
 latestReleaseIntent=null;
 restHoldSession=null;
 state=next;meshCandidate=mesh;authorized++;
 render();
 return true;
}
function startReverseFlex(){
 if(!state||blocked)return;
 if(running){stop();return;}
 if(!restHoldSession?.ok&&
    !(latestReverseFlexAudit?.ok&&
      latestReverseFlexAudit.sourceFrameEnd===state.verifiedFrames)){
  setStatus('先保持來源姿勢，再啟動 V1.0O 連續微彎後退。');
  return;
 }
 running=true;flexRunning=true;
 reverseFlexPlayEl.textContent='暫停細微彎曲後退';
 timer=setInterval(()=>{
  if(!reverseHeldPose({flex:true,fromLoop:true}))stop();
 },350);
}
function releaseHeldPose(mode){
 if(blocked||!state||!restHoldSession?.ok){
  setStatus('請先將已批准的真骨架姿勢暫停，才能執行來源反向／直行測試。');
  return;
 }
 const plan=planWarmveinReleaseStepV10m({
  state,hold:restHoldSession,mode
 });
 if(!plan.ok){
  setStatus('V1.0M 放鬆探索拒絕：'+plan.reason);
  return;
 }
 stop();
 const option=[...turnEl.options].find(
  o=>Math.abs(Number(o.value)-plan.turnRadians)<1e-12
 );
 if(!option){
  setStatus('V1.0M 未配置可供真來源測試的安全轉向選項');
  return;
 }
 restHoldSession=null;
 latestReleaseIntent=plan;
 turnEl.value=option.value;
 safeStep(); // full V0.9T/U and F/J/K/L gates run unchanged
}
releaseEl.addEventListener('click',()=>releaseHeldPose('counterturn'));
straightEl.addEventListener('click',()=>releaseHeldPose('straight'));
reverseEl.addEventListener('click',()=>reverseHeldPose());
reverseFlexEl.addEventListener('click',()=>reverseHeldPose({flex:true}));
reverseFlexPlayEl.addEventListener('click',startReverseFlex);
stepEl.addEventListener('click',()=>safeStep());
playEl.addEventListener('click',start);
resetEl.addEventListener('click',()=>{
 try{resetStage()}catch(e){stop();setStatus(e.message);}
});
try{
 initializeGL();paintAtlasPreview();resetStage();
 const compatible=JSON.stringify(scene)===preservedScene&&
  JSON.stringify(canonicalPose)===preservedCanonical;
 if(!compatible)throw new Error('source fixture mutated');
}catch(e){stop();setStatus('無法安全載入：'+e.message);}
window.__warmveinV10bQA=()=>F({
 version:'1.0R-refined-head-independent-larger-eyes',sceneLoaded:Boolean(state),
 stage,mode,verifiedFrames:authorized,
 currentMeshVertices:meshCandidate?.mesh?.vertexCount??0,
 currentMeshTriangles:meshCandidate?.mesh?.triangleCount??0,
 atlasSeed:atlas.seed,atlasRevision:atlas.privateSkinRevision,
 transparentV10hSelected:mode==='transparent-h'||compareMode(),
 sameSourceSplitView:sameFrameSplit(),
 v10uSameFrameQTTextureCompareMode:skinCompareMode(),
 v10uBothPanelsSameV10rMesh:skinCompareMode(),
 v10uOnlyQTPixelRGBAChanges:true,
 v10vRealFramebufferCaptureButtonPresent:Boolean(captureEl),
 v10vSnapshotLocalOnly:true,
 v10vNoSourceTimeAdvanceDuringCapture:true,
 v10uQAndTSourceAtlasRevisions:[atlases['pixel-q'].privateSkinRevision,
  atlases['pixel-t'].privateSkinRevision],
 v10rHeadCompareMode:headCompareMode(),
 v10sNeckUVSourceAudit:latestNeckUVAudit,
 v10sNotGPUScreenshotCertified:true,
 v10sNoRollingUVOffsetAdded:true,
 v10rHeadCloseupSelected:headFocus,
 v10rOriginalColliderUntouched:latestHeadRefinement?.displayOnlyNoColliderUpdate??true,
 v10rHeadRenderAudit:latestHeadRefinement?F({
  version:latestHeadRefinement.version,
  changedOriginalHeadVertices:latestHeadRefinement.headVerticesChanged,
  sharedSocketUnchanged:latestHeadRefinement.sharedSocketUnchanged,
  noseTipUnchanged:latestHeadRefinement.noseTipUnchanged,
  originalUVUnchanged:latestHeadRefinement.originalUvReferenceUnchanged,
  originalTrianglesUnchanged:latestHeadRefinement.originalTrianglesReferenceUnchanged,
  strictlyInwardGeometry:latestHeadRefinement.noHeadRingIncreasedBeyondOriginalShell
 }):null,
 v10rLargeEyesPreviewActive:eyeDebug?.version==='1.0R',
 comparisonOriginalMeshUsesUnchangedCollider:true,
 comparisonPanelsShareV09tUFrame:true,
 rendererOnlyBodyFit:latestRenderOnlyBodyFit?F({
  version:latestRenderOnlyBodyFit.version,
  intensity:latestRenderOnlyBodyFit.intensity,
  maximumProfileStep:latestRenderOnlyBodyFit.maximumProfileStep,
  headNeckRing7And8:latestRenderOnlyBodyFit.measurements.slice(7,9)
   .map(x=>x.sideScale),
  trunkMidSideScale:latestRenderOnlyBodyFit.measurements[48].sideScale,
  sourceUVUnchanged:latestRenderOnlyBodyFit.unchangedUVReference,
  sourceTrianglesUnchanged:latestRenderOnlyBodyFit.unchangedTriangleReference,
  sourceColliderUntouched:latestRenderOnlyBodyFit.originalCollisionShellUnchanged
 }):null,
 newPixelScalesAvailable:atlas.privateSkinRevision==='1.0G',
 v10gRendererNormalsFromOriginalMesh:true,
 v10gQuantizedLightingOnlyInNewMode:mode==='pixel-g'||mode==='pixel-p'||mode==='pixel-q'||mode==='pixel-t'||skinCompareMode(),
 v10pAcceptedExteriorReferenceSelected:mode==='pixel-p',
 v10qLatestFineScaleReferenceSelected:mode==='pixel-q',
 v10tHeadNeckContinuityFixSelected:mode==='pixel-t',
 v10tAtlasRevision:atlases['pixel-t'].privateSkinRevision,
 v10tNoHeadUVScroll:true,
 v10tNoPhysicalColliderModified:true,
 v10yNaturalHeadActive:Boolean(latestNaturalHead),
 v10yHeadComparisonActive:naturalHeadCompareMode(),
 v10yHeadArtNotYetApproved:latestNaturalHead?.skullAnatomyAndVisualApprovalPending??true,
 v10yWeldedNeckAndBodyUntouched:latestNaturalHead?.originalHeadSocketAndBodyBitIdentical??true,
 v10yNoUVChange:latestNaturalHead?.originalUVUnchanged??true,
 v10yNoPhysicalColliderOrSaveChanges:latestNaturalHead?.original24JointsAndColliderUnchanged??true,
 v10yVisualHeadVerticesChanged:latestNaturalHead?.modifiedHeadVertices??0,
 v10yEyeDiameterMeasuredPx:eyeDebug?.eyes.map(e=>e.pointSizePx)??[],
 v10wDisplayOnlyTailTaperActive:Boolean(latestVisualTaper),
 v10wRendererOnlySourceUntouched:latestVisualTaper?.noSourcePhysicsModified??true,
 v10wMidTrunkRelativeRadius:latestVisualTaper?.middleBodyRelativeRadius??null,
 v10wLastTailRingRelativeRadius:latestVisualTaper?.lastRingRelativeRadius??null,
 v10qTextureDimensions:[atlases['pixel-q'].width,atlases['pixel-q'].height],
 v10qNotYetApprovedByGPUOrPhone:true,
 atlasSeamOK:atlas.nearSeamRowEqual,
 atlasHeadAndBellyUnmodifiedFromV10b:mode==='pixel-c',
 independentEyeRigAvailable:Boolean(eyeProgram),
 independentEyesVisible:eyeIsIndependent(),
 eyeOpenFraction:1,
 blinkFeatureEnabled:false,
 eyelidAnimationScheduled:false,
 bothEyesFromActualHeadVertices:eyeDebug?.eyes?.length===2,
 v10xEyeOcclusionActive:Boolean(eyeVisibility),
 v10xVisibleEyeCount:eyeVisibility?.visibleEyeCount??null,
 v10xHiddenEyeCount:eyeVisibility?.hiddenEyeCount??null,
 v10xVisibleEyeAnchorIds:eyeVisibility?.visibleAnchorIds??[],
 v10xHiddenEyeAnchorIds:eyeVisibility?.hiddenAnchorIds??[],
 v10xCameraDepthProjectionConsistent:true,
 v10xBothEyeAnchorsRemainTwo:eyeVisibility?.eyeAnchorsRemainTwo??true,
 sourceHeadVertexIDs:eyeDebug?.eyes.map(a=>a.surfaceVertexIndex)??[],
 eyeStageProportions:eyeDebug?.eyes.map(e=>e.eyeStageRatio)??[],
 eyePixelDiameters:eyeDebug?.eyes.map(e=>e.pointSizePx)??[],
 turnRadiansPerStep:Number(turnEl.value),
 appearanceAudit:lastAppearanceAudit,
 bodySilhouetteAudit:latestBodyContinuity,
 overlapAndGroundObservation:latestContactAudit,
 approvedSourceArcTrace:latestArcAudit,
 exactSourceRestHold:latestRestHold?F({
  sourceFrame:latestRestHold.sourceFrame,
  noSourceFrameAdvanced:latestRestHold.sourceFrameCountAdvancedByHold===0,
  originalStatePreserved:latestRestHold.pausedBodyPoseIsExactOriginalReference,
  previewCurrentlyPaused:Boolean(restHoldSession?.ok)
 }):null,
 latestSourceOnlyReleaseIntent:latestReleaseIntent?F({
  turnRadians:latestReleaseIntent.turnRadians,
  needsOriginalV09t:latestReleaseIntent.requiresRealV09tStateAdvance,
  needsOriginalV09u:latestReleaseIntent.requiresV09uTemporalMeshApproval,
  physicalUnwrappingCertified:latestReleaseIntent.truePhysicalCoilReleaseCertified
 }):null,
 bodyRestAndUncoilingPhysicsStillNotCertified:true,
 verifiedOriginalReverseEvidence:latestReverseAudit,
 reverseFlexQualityAudit:latestReverseFlexAudit,
 reverseFlexNotBiologicallyCertified:true,
 noTrueOverUnderUncoilingClaim:true,
 newCoilPoseControllerGranted:false,
 realCoilAndStackingStillNotCertified:true,
 actualCoilingAnimationStillUnavailable:true,
 exactSurfaceContactNotCertified:true,
 bodySilhouetteQualityNotCertified:true,
 appearanceAuditOnlyNotPhysicalAuthorization:true,
 oldEyeTextureRemoved:atlases['pixel-d'].cleanedPixelCount,
 atlasHeadHasNoPaintedEyes:atlases['pixel-d'].detachedEyes,
 snakeEyesStayOpen:true,
 blinkDesignDeferred:true,
 newEyeGeometryColliders:0,
 preservedScene:JSON.stringify(scene)===preservedScene,
 preservedCanonical:JSON.stringify(canonicalPose)===preservedCanonical,
 trueV09tUBacked:true,sourceSafeHold:blocked,
 shaderReady:Boolean(program),gameSaveWritten:false,
 publicQAAtlasPublishedWithConsent:true
});

// Keep the original diagnostic entrypoint for scripts written for V1.0B.
window.__warmveinV10cQA=window.__warmveinV10bQA;
window.__warmveinV10dQA=window.__warmveinV10bQA;
window.__warmveinV10eQA=window.__warmveinV10bQA;
window.__warmveinV10fQA=window.__warmveinV10bQA;
window.__warmveinV10gQA=window.__warmveinV10bQA;
window.__warmveinV10hQA=window.__warmveinV10bQA;
window.__warmveinV10iQA=window.__warmveinV10bQA;
window.__warmveinV10jQA=window.__warmveinV10bQA;
window.__warmveinV10kQA=window.__warmveinV10bQA;
window.__warmveinV10lQA=window.__warmveinV10bQA;
window.__warmveinV10mQA=window.__warmveinV10bQA;
window.__warmveinV10nQA=window.__warmveinV10bQA;
window.__warmveinV10oQA=window.__warmveinV10bQA;
window.__warmveinV10rQA=window.__warmveinV10bQA;
window.__warmveinV10sQA=window.__warmveinV10bQA;
