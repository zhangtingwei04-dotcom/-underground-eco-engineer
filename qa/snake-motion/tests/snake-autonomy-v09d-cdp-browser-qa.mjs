/**
 * V0.9D: dedicated real Chrome 2-landscape-viewport source-trace
 * screenshot QA. Only verifies render/provenance and captured pixels,
 * never declares finished animal appearance or full self-surface physics.
 */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,mkdirSync,rmSync,writeFileSync,existsSync}
 from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filename='snake-autonomy-v09d-lab.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out=path.resolve(root,process.env.OHM_V09D_CAPTURE_DIR??'.qa-artifacts/v09d');
assert.ok(out.startsWith(root+path.sep),'no captures outside checkout');
mkdirSync(out,{recursive:true});
const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-v09d-cdp-'));
let browser=null,cdp=null,errors='';
const server=createServer((req,res)=>{
 let pathname='';
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
 catch{res.writeHead(400);res.end();return}
 if((pathname!==filename&&!pathname.startsWith('src/ohm-core/'))||
  pathname.includes('..')||pathname.includes('\\')){
  res.writeHead(403);res.end();return;
 }
 const abs=path.resolve(root,pathname);
 if(abs!==path.join(root,filename)&&
  !abs.startsWith(path.join(root,'src/ohm-core')+path.sep)){
  res.writeHead(403);res.end();return;
 }
 try{
  res.writeHead(200,{'Content-Type':pathname.endsWith('.html')?
   'text/html; charset=utf-8':'text/javascript; charset=utf-8',
   'Cache-Control':'no-store'});
  res.end(readFileSync(abs));
 }catch{res.writeHead(404);res.end()}
});
function websocket(url){
 return new Promise((resolve,reject)=>{
  const sock=new WebSocket(url),timer=setTimeout(()=>{
   sock.close();reject(Error('CDP websocket timeout'));
  },15000);
  sock.addEventListener('open',()=>{clearTimeout(timer);resolve(sock)},{once:true});
  sock.addEventListener('error',e=>{clearTimeout(timer);
   reject(Error('CDP websocket '+e.type));
  },{once:true});
 });
}
class CDP{
 constructor(ws){
  this.ws=ws;this.id=0;this.pending=new Map();
  ws.addEventListener('message',e=>{
   let v;try{v=JSON.parse(String(e.data))}catch{return}
   const p=this.pending.get(v.id);if(!p)return;
   clearTimeout(p.timer);this.pending.delete(v.id);
   if(v.error)p.reject(Error(JSON.stringify(v.error)));
   else p.resolve(v.result);
  });
  ws.addEventListener('close',()=>{
   for(const p of this.pending.values()){
    clearTimeout(p.timer);p.reject(Error('CDP socket closed'))
   }
   this.pending.clear();
  });
 }
 send(method,params={},timeout=45000){
  return new Promise((resolve,reject)=>{
   const id=++this.id,timer=setTimeout(()=>{
    this.pending.delete(id);reject(Error(method+' timeout'))
   },timeout);
   this.pending.set(id,{resolve,reject,timer});
   this.ws.send(JSON.stringify({id,method,params}));
  });
 }
}
const binCandidates=[
 process.env.OHM_CHROME_BIN,'google-chrome','chromium','chromium-browser'
].filter(Boolean);
let bin=null;
for(const c of binCandidates){
 const x=spawnSync(c,['--version'],{encoding:'utf8',timeout:5000});
 if(x.status===0){bin=c;break}
}
if(!bin&&process.env.OHM_REQUIRE_CHROME==='1')
 throw Error('V0.9D dedicated Chrome validation is required but unavailable');
if(!bin)console.log('SKIP V0.9D no Chrome installed (no visual proof)');
if(bin)try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve)
 });
 const profile=path.join(temp,'profile');
 browser=spawn(bin,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions',
  '--hide-scrollbars','--force-device-scale-factor=1',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'
 ],{cwd:root,stdio:['ignore','ignore','pipe']});
 browser.stderr.on('data',d=>{errors=(errors+d).slice(-3000)});
 let port=null;
 for(let n=0;n<300;n++){
  if(browser.exitCode!==null)throw Error('Chrome died '+errors);
  const file=path.join(profile,'DevToolsActivePort');
  if(existsSync(file)){
   port=Number(readFileSync(file,'utf8').split('\n')[0]);break;
  }
  await sleep(100);
 }
 if(!Number.isSafeInteger(port)||port<1)throw Error('No Chrome CDP port '+errors);
 const targets=await(await fetch('http://127.0.0.1:'+port+'/json/list',
  {signal:AbortSignal.timeout(20000)})).json();
 const target=targets.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 assert.ok(target,'Missing CDP page');
 cdp=new CDP(await websocket(target.webSocketDebuggerUrl));
 await cdp.send('Page.enable');await cdp.send('Runtime.enable');
 const viewports=[
  {name:'wide_landscape',w:1440,h:900},
  {name:'phone_landscape',w:932,h:480}
 ];
 const frameSamples=[60,160,410,692];
 const crossView=new Map();
 for(const viewport of viewports){
  const traces=[];
  for(const frame of frameSamples){
   await cdp.send('Emulation.setDeviceMetricsOverride',{
    width:viewport.w,height:viewport.h,deviceScaleFactor:1,mobile:false
   });
   const url='http://127.0.0.1:'+server.address().port+'/'+filename+
    '?unsafe=1&frame='+frame;
   const nav=await cdp.send('Page.navigate',{url},45000);
   if(nav.errorText)throw Error(nav.errorText);
   let result=null;
   for(let attempts=0;attempts<200;attempts++){
    const raw=await cdp.send('Runtime.evaluate',{
     expression:'(()=>{if(!document.body)return{status:"loading"};const d=document.body.dataset;return {'+
      'status:d.qaV09d,frame:Number(d.qaFrame),'+
      'bones:Number(d.qaBones),pixels:Number(d.qaPixels),'+
      'hash:d.qaHash,overlap:Number(d.qaOverlap),'+
      'sourceFrames:Number(d.qaVerifiedFrames),'+
      'phase:d.qaPhase,safeMode:d.qaSafeMode,'+
      'safeStop:Number(d.qaSafeStop),ready:document.readyState,'+
      'error:document.getElementById("status")?.textContent,'+
      'sourceWindow:window.ohmQaV09d??null'+
      '};})()',returnByValue:true
    },45000);
    if(raw.exceptionDetails)throw Error('Chrome JS exception '+JSON.stringify(raw.exceptionDetails));
    result=raw.result?.value;
    if(result?.status==='fail')throw Error(viewport.name+' frame '+frame+
     ' test lab failed '+JSON.stringify(result).slice(0,1000));
    if(result?.status==='pass'&&result.frame===frame&&
      result.ready==='complete')break;
    await sleep(100);
   }
   assert.equal(result?.status,'pass',viewport.name+' incomplete');
   assert.equal(result.frame,frame);
   assert.equal(result.safeMode,'false',
    'the full suspect trace must be opt-in for engineering diagnostics');
   assert.equal(result.bones,24);
   assert.equal(result.sourceFrames,692);
   assert.ok(Number.isInteger(result.pixels)&&result.pixels>100);
   assert.ok(Number.isFinite(result.overlap));
   assert.equal(result.sourceWindow?.skinApplied,false);
   assert.equal(result.sourceWindow?.fullSurfaceCollisionCertified,false);
   const shot=await cdp.send('Page.captureScreenshot',{
    format:'png',fromSurface:true,captureBeyondViewport:false
   },60000);
   const png=Buffer.from(shot.data,'base64');
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(png.readUInt32BE(16),viewport.w);
   assert.equal(png.readUInt32BE(20),viewport.h);
   assert.ok(png.length>12000,'blank QA screenshot');
   writeFileSync(path.join(out,viewport.name+'_frame_'+
    String(frame).padStart(3,'0')+'.png'),png);
   const prev=crossView.get(frame);
   if(prev)assert.equal(result.hash,prev,
    'the same 1440x810 canonical scene raster must not depend on viewport');
   else crossView.set(frame,result.hash);
   traces.push({frame,hash:result.hash,overlap:result.overlap,
    pngBytes:png.length,phase:result.phase});
  }
  assert.equal(new Set(traces.map(x=>x.hash)).size,frameSamples.length,
   viewport.name+' actual head/body scene must change across source frames');
  // Default preview intentionally refuses to display any source frame
  // after the first candidate self-contact rejection. Verify this guard
  // from the ACTUAL real Chrome drawing, not only a unit-test string.
  const guardedUrl='http://127.0.0.1:'+server.address().port+
   '/'+filename+'?frame=692';
  const safeNavigation=await cdp.send('Page.navigate',{
   url:guardedUrl
  },45000);
  if(safeNavigation.errorText)throw Error(safeNavigation.errorText);
  let safe=null;
  for(let n=0;n<200;n++){
   const v=await cdp.send('Runtime.evaluate',{
    expression:'(()=>{if(!document.body)return{status:"loading"};const d=document.body.dataset;return {'+
     'status:d.qaV09d,frame:Number(d.qaFrame),'+
     'overlap:Number(d.qaOverlap),safeMode:d.qaSafeMode,'+
     'safeStop:Number(d.qaSafeStop),'+
     'ready:document.readyState};})()',
    returnByValue:true
   },45000);
   if(v.exceptionDetails)throw Error('safe mode browser JS exception');
   safe=v.result?.value;
   if(safe?.status==='fail')throw Error('safe mode source failed');
   if(safe?.status==='pass'&&safe.ready==='complete')break;
   await sleep(100);
  }
  assert.equal(safe?.status,'pass');
  assert.equal(safe.safeMode,'true');
  assert.ok(safe.safeStop>60&&safe.safeStop<692,
   'first suspect overlap must be detected during real return');
  assert.ok(safe.frame<safe.safeStop,
   'default preview must stop *before* first suspect contact frame');
  assert.equal(safe.overlap,0,
   'unapproved red overlapping pose cannot be the default preview');
  const safeCapture=await cdp.send('Page.captureScreenshot',{
   format:'png',fromSurface:true,captureBeyondViewport:false
  },60000);
  const safePng=Buffer.from(safeCapture.data,'base64');
  assert.equal(safePng.readUInt32BE(16),viewport.w);
  assert.equal(safePng.readUInt32BE(20),viewport.h);
  writeFileSync(path.join(out,viewport.name+'_safe_guard.png'),safePng);
  console.log('PASS V0.9D safe preview '+viewport.name+
   ' '+JSON.stringify(safe));
  console.log('PASS V0.9D real Chrome '+viewport.name+' '+JSON.stringify(traces));
 }
 console.log('PASS V0.9D: 8 opt-in diagnostic and 2 safe-default Chrome captures, 2 landscape viewports, 24 bone 692 source frames and strict pre-overlap preview stop; self-overlap is diagnostic, not physics certification');
}finally{
 if(cdp)cdp.ws.close();
 if(browser&&browser.exitCode===null){
  browser.kill('SIGTERM');await sleep(350);
  if(browser.exitCode===null)browser.kill('SIGKILL');
 }
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(temp,{recursive:true,force:true});
}
