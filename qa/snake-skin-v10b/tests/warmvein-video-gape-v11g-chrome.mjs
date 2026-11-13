/**
 * Genuine Chromium WebGL2 V1.1G compare: legacy lower-only vs
 * real-video-inspired neck/head lift, and larger lift alternative.
 */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,mkdirSync,rmSync,writeFileSync,existsSync}
 from 'node:fs';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..'),
 out=path.join(root,'qa/snake-skin-v10b/.qa-artifacts/v11g-video-motion');
mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidate=[process.env.OHM_CHROME_BIN,'google-chrome','chromium','chromium-browser']
 .filter(Boolean).find(cmd=>spawnSync(cmd,['--version'],{
  encoding:'utf8',timeout:5000
 }).status===0);
if(!candidate)throw Error('V1.1G actual Chrome WebGL2 required');
const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-video-gape-v11g-'));
let chrome=null,socket=null;
const server=createServer((req,res)=>{
 let target;
 try{target=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
 catch{res.writeHead(400);res.end();return;}
 if(!target.startsWith('qa/snake-skin-v10b/static-head/')||
  target.includes('..')||target.includes('\\')){
  res.writeHead(403);res.end();return;
 }
 const p=path.resolve(root,target);
 if(!p.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{
  const c=readFileSync(p);
  res.writeHead(200,{'Cache-Control':'no-store',
   'Content-Type':target.endsWith('.html')?'text/html; charset=utf-8':
    'text/javascript; charset=utf-8'});
  res.end(c);
 }catch{res.writeHead(404);res.end();}
});
class CDP{
 constructor(ws){
  this.ws=ws;this.id=0;this.waiting=new Map();
  ws.addEventListener('message',event=>{
   let message;try{message=JSON.parse(String(event.data))}catch{return;}
   const p=this.waiting.get(message.id);if(!p)return;
   this.waiting.delete(message.id);clearTimeout(p.timer);
   if(message.error)p.reject(Error(JSON.stringify(message.error)));
   else p.resolve(message.result);
  });
 }
 call(method,params={},timeout=50000){
  return new Promise((resolve,reject)=>{
   const id=++this.id,timer=setTimeout(()=>{
    this.waiting.delete(id);reject(Error(method+' timeout'));
   },timeout);
   this.waiting.set(id,{resolve,reject,timer});
   this.ws.send(JSON.stringify({id,method,params}));
  });
 }
}
async function evaluate(cdp,code){
 const r=await cdp.call('Runtime.evaluate',{
  expression:code,returnByValue:true
 },60000);
 if(r.exceptionDetails)throw Error('V1.1G browser JS exception '+JSON.stringify(r.exceptionDetails));
 return r.result.value;
}
try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
 });
 const userDir=path.join(temp,'chrome');
 chrome=spawn(candidate,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+userDir,'about:blank'
 ],{cwd:root,stdio:['ignore','ignore','pipe']});
 let port=null,stderr='';
 chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-2500)});
 for(let t=0;t<300;t++){
  if(chrome.exitCode!==null)throw Error('Chrome quit '+stderr);
  const f=path.join(userDir,'DevToolsActivePort');
  if(existsSync(f)){port=Number(readFileSync(f,'utf8').split('\n')[0]);break;}
  await sleep(100);
 }
 assert.ok(port>0);
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list',{
  signal:AbortSignal.timeout(20000)
 })).json();
 const page=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 assert.ok(page);
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 const cdp=new CDP(socket);
 await cdp.call('Page.enable');
 await cdp.call('Runtime.enable');
 const url='http://127.0.0.1:'+server.address().port+
  '/qa/snake-skin-v10b/static-head/v11g.html';
 await cdp.call('Page.navigate',{url});
 let ready=null;
 for(let i=0;i<180;i++){
  ready=await evaluate(cdp,
   "({ready:document.readyState,qa:window.__warmveinStaticV11gQA?.()??null})");
  if(ready?.ready==='complete'&&ready?.qa?.realWebGL2Drawn)break;
  await sleep(100);
 }
 assert.equal(ready?.qa?.realWebGL2Drawn,true,'V1.1G did not render');
 const scenarios=[
  {profile:'video-head-lift',pose:'closed'},
  {profile:'lower-only',pose:'wide'},
  {profile:'video-head-lift',pose:'wide'},
  {profile:'upper-dominant',pose:'wide'},
  {profile:'video-head-lift',pose:'medium'}
 ];
 const views=['side','quarter','front'];
 const results=[],unique=new Set();
 const prefix='data:image/png;base64,';
 for(const scenario of scenarios)for(const view of views){
  const code=[
   "(()=>{",
   "const profile=document.querySelector('#profile');",
   "profile.value="+JSON.stringify(scenario.profile)+";",
   "profile.dispatchEvent(new Event('change',{bubbles:true}));",
   "const pose=document.querySelector('#pose');",
   "pose.value="+JSON.stringify(scenario.pose)+";",
   "pose.dispatchEvent(new Event('change',{bubbles:true}));",
   "const model=document.querySelector('#model');",
   "model.value='head';model.dispatchEvent(new Event('change',{bubbles:true}));",
   "const camera=document.querySelector('#angle');",
   "camera.value="+JSON.stringify(view)+";",
   "camera.dispatchEvent(new Event('change',{bubbles:true}));",
   "const c=document.querySelector('#render'),gl=c.getContext('webgl2');gl.finish();",
   "const px=new Uint8Array(c.width*c.height*4);",
   "gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,px);",
   "let colored=0,sum=0;",
   "for(let i=0;i<px.length;i+=16){",
   "const r=px[i],g=px[i+1],b=px[i+2];",
   "if(r+g+b>200)colored++;sum=(sum*31+r*5+g*3+b)>>>0;}",
   "return {qa:window.__warmveinStaticV11gQA(),",
   "error:gl.getError(),colored,sum,png:c.toDataURL('image/png')};",
   "})()"
  ].join('');
  const v=await evaluate(cdp,code);
  assert.equal(v.error,0);
  assert.equal(v.qa.version,'1.1G');
  assert.equal(v.qa.realWebGL2Drawn,true);
  assert.equal(v.qa.headBodyRootUnmoved,true);
  assert.equal(v.qa.noProductionControllerTouched,true);
  assert.equal(v.qa.splitHeadAndJawControls,true);
  assert.equal(v.qa.headLiftIsWholeSkullPitchNotCranialLid,true);
  assert.equal(v.qa.motionProfile,scenario.profile);
  assert.equal(v.qa.pose,scenario.pose);
  assert.equal(v.qa.angle,view);
  assert.ok(v.qa.maximumFixedRootMovement<1e-7);
  if(scenario.profile==='lower-only')assert.equal(v.qa.headPitchDegrees,0);
  else if(scenario.pose==='wide')assert.ok(v.qa.headPitchDegrees>=14);
  if(scenario.pose==='closed')assert.equal(v.qa.gapeDegrees,0);
  assert.ok(v.colored>500);
  assert.ok(v.png.startsWith(prefix));
  const png=Buffer.from(v.png.slice(prefix.length),'base64');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),1100);
  assert.equal(png.readUInt32BE(20),660);
  const hash=createHash('sha256').update(png).digest('hex');
  assert.equal(unique.has(hash),false,'identical screenshot indicates non-changing pose');
  unique.add(hash);
  const filename='v11g_'+scenario.profile+'_'+scenario.pose+'_'+view+'.png';
  writeFileSync(path.join(out,filename),png);
  results.push({profile:scenario.profile,pose:scenario.pose,
   view,pitch:v.qa.headPitchDegrees,
   gape:v.qa.gapeDegrees,sha256:hash,colored:v.colored});
  console.log('PASS V1.1G real Chrome '+filename);
 }
 // Verify scrubber genuinely changes the GPU image, not only labels.
 for(const phase of [22,50,89]){
  const code=[
   "(()=>{",
   "const t=document.querySelector('#timeline');",
   "t.value="+String(phase)+";t.dispatchEvent(new Event('input',{bubbles:true}));",
   "const c=document.querySelector('#render');",
   "return {qa:window.__warmveinStaticV11gQA(),png:c.toDataURL('image/png')};",
   "})()"
  ].join('');
  const v=await evaluate(cdp,code);
  assert.equal(v.qa.movingPreviewPhase,phase/100);
  assert.ok(v.qa.gapeDegrees>=0&&v.qa.gapeDegrees<=46);
  assert.ok(v.qa.maximumFixedRootMovement<1e-7);
  const png=Buffer.from(v.png.slice(prefix.length),'base64');
  const hash=createHash('sha256').update(png).digest('hex');
  assert.equal(unique.has(hash),false);
  unique.add(hash);
  const name='v11g_timeline_t'+phase+'.png';
  writeFileSync(path.join(out,name),png);
  results.push({timeline:phase,gape:v.qa.gapeDegrees,pitch:v.qa.headPitchDegrees,sha256:hash});
 }
 assert.equal(results.length,18);
 writeFileSync(path.join(out,'v11g-motion-evidence.json'),
  JSON.stringify({version:'1.1G',sourceReference:'User video 2026-11-08 21:16:20, 22–26 s',
   note:'Video-inspired only, not measured motion capture; art not approved',
   screenshots:results},null,2));
 console.log('PASS V1.1G genuine Chrome WebGL2: 15 profile/angle captures + 3 timeline poses, fixed neck root');
}finally{
 if(socket)socket.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');await sleep(250);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
 }
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(temp,{recursive:true,force:true});
}
