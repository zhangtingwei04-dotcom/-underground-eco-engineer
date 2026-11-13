/** Early Q/T WebGL2 source-skin rendering proof: public Chrome only. */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,mkdirSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const lab='qa/snake-skin-v10b/visual/warmvein-v10b-test.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const capture=path.resolve(root,'qa/snake-skin-v10b/.qa-artifacts/v10v-chrome');
mkdirSync(capture,{recursive:true});
const folder=mkdtempSync(path.join(os.tmpdir(),'ohm-v10v-qt-'));
let chrome=null,protocol=null;
const server=createServer((req,res)=>{
 let pathname='';
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
 catch{res.writeHead(400);res.end();return;}
 const allowed=pathname.startsWith('qa/snake-skin-v10b/')||
  pathname.startsWith('qa/snake-motion/src/ohm-core/');
 if(!allowed||pathname.includes('..')||pathname.includes('\\')){
  res.writeHead(403);res.end();return;
 }
 const absolute=path.resolve(root,pathname);
 if(!absolute.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  res.writeHead(200,{'Content-Type':pathname.endsWith('.html')?
   'text/html; charset=utf-8':'text/javascript; charset=utf-8',
   'Cache-Control':'no-store'});
  res.end(readFileSync(absolute));
 }catch{res.writeHead(404);res.end();}
});
class CDP{
 constructor(socket){
  this.ws=socket;this.id=0;this.pending=new Map();
  socket.addEventListener('message',ev=>{
   let msg;try{msg=JSON.parse(String(ev.data))}catch{return}
   const p=this.pending.get(msg.id);if(!p)return;
   clearTimeout(p.timeout);this.pending.delete(msg.id);
   if(msg.error)p.reject(Error(JSON.stringify(msg.error)));
   else p.resolve(msg.result);
  });
 }
 send(method,params={},ms=45000){
  return new Promise((resolve,reject)=>{
   const id=++this.id,timeout=setTimeout(()=>{
    this.pending.delete(id);reject(Error(method+' timed out'))
   },ms);
   this.pending.set(id,{resolve,reject,timeout});
   this.ws.send(JSON.stringify({id,method,params}));
  });
 }
}
let bin=null;
for(const candidate of [
 process.env.OHM_CHROME_BIN,'google-chrome','chromium','chromium-browser'
].filter(Boolean)){
 const t=spawnSync(candidate,['--version'],{timeout:5000,encoding:'utf8'});
 if(t.status===0){bin=candidate;break}
}
if(!bin&&process.env.OHM_REQUIRE_CHROME==='1')
 throw Error('V1.0V genuine WebGL2 public Chrome required');
if(!bin)console.log('SKIP V1.0V no Chrome available');
if(bin)try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve)
 });
 const profile=path.join(folder,'profile');
 chrome=spawn(bin,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions',
  '--hide-scrollbars','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--force-device-scale-factor=1',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'
 ],{cwd:root,stdio:['ignore','ignore','pipe']});
 let port=null,stderr='';
 chrome.stderr.on('data',d=>{stderr=(stderr+d).slice(-3000)});
 for(let n=0;n<300;n++){
  if(chrome.exitCode!==null)throw Error('Chrome closed '+stderr);
  const loc=path.join(profile,'DevToolsActivePort');
  if(existsSync(loc)){
   port=Number(readFileSync(loc,'utf8').split('\n')[0]);break
  }
  await sleep(100);
 }
 assert.ok(Number.isSafeInteger(port)&&port>0,'CDP port '+stderr);
 const list=await(await fetch('http://127.0.0.1:'+port+'/json/list',
  {signal:AbortSignal.timeout(20000)})).json();
 const page=list.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 assert.ok(page);
 const ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 protocol=new CDP(ws);
 await protocol.send('Page.enable');await protocol.send('Runtime.enable');
 let screenshots=0;
 for(const view of [{id:'wide_landscape',w:1440,h:900},
                    {id:'phone_landscape',w:932,h:480}]){
  await protocol.send('Emulation.setDeviceMetricsOverride',{
   width:view.w,height:view.h,deviceScaleFactor:1,mobile:false
  });
  const url='http://127.0.0.1:'+server.address().port+'/'+lab;
  const navigation=await protocol.send('Page.navigate',{url});
  if(navigation.errorText)throw Error(navigation.errorText);
  let data=null;
  for(let i=0;i<150;i++){
   const v=await protocol.send('Runtime.evaluate',{
    expression:"(()=>({ready:document.readyState,qa:window.__warmveinV10bQA?.()??null,status:document.querySelector('#status')?.textContent??null}))()",
    returnByValue:true
   });
   if(v.exceptionDetails)throw Error('browser script exception '+JSON.stringify(v.exceptionDetails));
   data=v.result?.value;
   if(data?.ready==='complete'&&data.qa?.sceneLoaded&&data.qa?.shaderReady)break;
   await sleep(100);
  }
  assert.equal(data?.qa?.sceneLoaded,true,view.id+' original source not loaded: '+data?.status);
  assert.equal(data?.qa?.shaderReady,true,view.id+' WebGL2 shader not ready');
  assert.equal(data.qa.currentMeshVertices,1617);
  assert.equal(data.qa.currentMeshTriangles,3216);
  assert.equal(data.qa.trueV09tUBacked,true);
  assert.equal(data.qa.gameSaveWritten,false);
  assert.equal(data.qa.preservedScene,true);
  assert.equal(data.qa.preservedCanonical,true);
  // Actually switch material on the rendered source, not merely parse
  // JS or inspect the 2D atlas preview.
  const evaluateExpression=[
   "(()=>{",
   "const select=document.querySelector('#material');",
   "select.value='skin-compare';",
   "select.dispatchEvent(new Event('change',{bubbles:true}));",
   "const canvas=document.querySelector('#view');",
   "const gl=canvas.getContext('webgl2');",
   "if(!gl)return {error:'webgl2-unavailable'};",
   "gl.finish();",
   "const px=new Uint8Array(canvas.width*canvas.height*4);",
   "gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,px);",
   "const w=canvas.width,h=canvas.height,half=Math.floor(w/2);",
   "let left=0,right=0,paired=0,changed=0;",
   "for(let y=0;y<h;y++)for(let x=0;x<half;x++){",
   "const a=(y*w+x)*4,b=(y*w+half+x)*4;",
   "const la=px[a+3]>30,ra=px[b+3]>30;",
   "if(la)left++;if(ra)right++;",
   "if(!la||!ra)continue;paired++;",
   "if(Math.max(Math.abs(px[a]-px[b]),Math.abs(px[a+1]-px[b+1]),Math.abs(px[a+2]-px[b+2]))>12)changed++;",
   "}",
   "return {error:gl.getError(),left,right,paired,changed,",
   " qa:window.__warmveinV10bQA(),png:canvas.toDataURL('image/png')};",
   "})()"
  ].join('');
  const check=await protocol.send('Runtime.evaluate',{
   expression:evaluateExpression,returnByValue:true
  },60000);
  if(check.exceptionDetails)
   throw Error(view.id+' Q/T GPU exception '+JSON.stringify(check.exceptionDetails));
  const v=check.result?.value;
  assert.equal(v.error,0,view.id+' WebGL error '+v.error);
  assert.equal(v.qa.v10uSameFrameQTTextureCompareMode,true);
  assert.equal(v.qa.v10uBothPanelsSameV10rMesh,true);
  assert.equal(v.qa.v10yWorldUnitsIsotropicXyCamera,true);
  assert.ok(Math.abs(v.qa.v10yCameraPixelScale.pixelsPerWorldX-
   v.qa.v10yCameraPixelScale.pixelsPerWorldY)<1e-9);
  assert.equal(v.qa.v10xEyeOcclusionActive,true);
  assert.equal(v.qa.v10xVisibleEyeCount,1,
   view.id+' side-on head must show only near-side eye');
  assert.equal(v.qa.v10xHiddenEyeCount,1,
   view.id+' far-side GL eye sprite must be suppressed');
  assert.equal(v.qa.v10xBothEyeAnchorsRemainTwo,true);
  assert.equal(v.qa.v10xCameraDepthProjectionConsistent,true);
  assert.ok(v.left>64&&v.right>64,view.id+' two real GPU snake panels required');
  assert.ok(v.paired>64,view.id+' source mesh silhouette mismatch');
  assert.ok(v.changed>0,view.id+' same-frame Q/T GPU color difference not visible');
  const prefix='data:image/png;base64,';
  assert.ok(v.png?.startsWith(prefix));
  const gpu=Buffer.from(v.png.slice(prefix.length),'base64');
  assert.equal(gpu.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(gpu.readUInt32BE(16),1100);
  assert.equal(gpu.readUInt32BE(20),600);
  writeFileSync(path.join(capture,view.id+'_real_gpu_qt.png'),gpu);
  const snap=await protocol.send('Page.captureScreenshot',{
   format:'png',fromSurface:true,captureBeyondViewport:false
  },60000);
  const full=Buffer.from(snap.data,'base64');
  assert.ok(full.length>15000);
  assert.equal(full.readUInt32BE(16),view.w);
  assert.equal(full.readUInt32BE(20),view.h);
  writeFileSync(path.join(capture,view.id+'_browser_screen.png'),full);
  // V1.0Y: compare the REAL source-backed R/Y heads in one GPU frame.
  const headCapture=await protocol.send('Runtime.evaluate',{
   expression:[
    "(()=>{",
    "const select=document.querySelector('#material');",
    "select.value='head-y-compare';",
    "select.dispatchEvent(new Event('change',{bubbles:true}));",
    "document.querySelector('#headFocus').click();",
    "const canvas=document.querySelector('#view');",
    "const gl=canvas.getContext('webgl2');",
    "gl.finish();",
    "const px=new Uint8Array(canvas.width*canvas.height*4);",
    "gl.readPixels(0,0,canvas.width,canvas.height,gl.RGBA,gl.UNSIGNED_BYTE,px);",
    "const w=canvas.width,h=canvas.height,half=Math.floor(w/2);",
    "let left=0,right=0,paired=0,different=0;",
    "for(let y=0;y<h;y++)for(let x=0;x<half;x++){",
    "const a=4*(y*w+x),b=4*(y*w+x+half);",
    "const la=px[a+3]>30,ra=px[b+3]>30;",
    "if(la)left++;if(ra)right++;if(!la||!ra)continue;paired++;",
    "if(Math.max(Math.abs(px[a]-px[b]),Math.abs(px[a+1]-px[b+1]),Math.abs(px[a+2]-px[b+2]))>12)different++;",
    "}",
    "return {qa:window.__warmveinV10bQA(),left,right,paired,different,error:gl.getError(),png:canvas.toDataURL('image/png')};",
    "})()"
   ].join(''),
   returnByValue:true
  },60000);
  if(headCapture.exceptionDetails)
   throw Error(view.id+' V1.0Y Chrome JS exception '+JSON.stringify(headCapture.exceptionDetails));
  const h=headCapture.result?.value;
  assert.equal(h.error,0,view.id+' V1.0Y WebGL GL error');
  assert.equal(h.qa.v10yNaturalHeadActive,true);
  assert.equal(h.qa.v10yHeadComparisonActive,true);
  assert.equal(h.qa.v10yWorldUnitsIsotropicXyCamera,true);
  assert.ok(Math.abs(h.qa.v10yCameraPixelScale.pixelsPerWorldX-
   h.qa.v10yCameraPixelScale.pixelsPerWorldY)<1e-9);
  assert.equal(h.qa.v10yWeldedNeckAndBodyUntouched,true);
  assert.equal(h.qa.v10yNoUVChange,true);
  assert.equal(h.qa.v10yNoPhysicalColliderOrSaveChanges,true);
  assert.ok(h.qa.v10yVisualHeadVerticesChanged>=80);
  assert.equal(h.qa.v10xVisibleEyeCount,1);
  assert.equal(h.qa.v10xHiddenEyeCount,1);
  assert.equal(h.qa.v10rHeadCloseupSelected,true);
  assert.ok(h.left>64&&h.right>64,'V1.0Y two real head panels must appear');
  assert.ok(h.paired>64,'old/new head panels should share source pose');
  assert.ok(h.different>0,'new head and eyes must have real color/shape differences');
  assert.ok(h.png?.startsWith(prefix));
  const headPng=Buffer.from(h.png.slice(prefix.length),'base64');
  assert.equal(headPng.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(headPng.readUInt32BE(16),1100);
  assert.equal(headPng.readUInt32BE(20),600);
  writeFileSync(path.join(capture,view.id+'_real_gpu_head_r_vs_y_closeup.png'),headPng);
  const headSnap=await protocol.send('Page.captureScreenshot',{
   format:'png',fromSurface:true,captureBeyondViewport:false
  },60000);
  const headFull=Buffer.from(headSnap.data,'base64');
  assert.equal(headFull.readUInt32BE(16),view.w);
  assert.equal(headFull.readUInt32BE(20),view.h);
  writeFileSync(path.join(capture,view.id+'_head_r_vs_y_browser.png'),headFull);
  console.log('PASS V1.0Y source-backed real Chrome head R/Y comparison '+JSON.stringify({
   view:view.id,oldPixels:h.left,newPixels:h.right,overlap:h.paired,
   actualChangedPixels:h.different,nearEyes:h.qa.v10xVisibleEyeCount,
   headVerticesChanged:h.qa.v10yVisualHeadVerticesChanged
  }));
  screenshots+=4;
  console.log('PASS public real WebGL2 Q/T source-same-frame '+JSON.stringify({
   view:view.id,left:v.left,right:v.right,paired:v.paired,
   colorDiffPixels:v.changed,visibleEyes:v.qa.v10xVisibleEyeCount,
   hiddenEyes:v.qa.v10xHiddenEyeCount,
   realGPUBytes:gpu.length,browserBytes:full.length
  }));
 }
 assert.equal(screenshots,8);
 console.log('PASS 8 real Chrome Q/T and V1.0Y side-view screenshots; not artist or iPhone approval');
}finally{
 if(protocol)protocol.ws.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');await sleep(350);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
 }
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(folder,{recursive:true,force:true});
}
