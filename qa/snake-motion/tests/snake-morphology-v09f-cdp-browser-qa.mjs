/** Static 3-pose Chrome acceptance, no V0.9F motion promotion. */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFileSync,mkdtempSync,mkdirSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lab='snake-morphology-v09f-lab.html';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const capture=path.resolve(root,'.qa-artifacts/v09f-static');
mkdirSync(capture,{recursive:true});
const folder=mkdtempSync(path.join(os.tmpdir(),'ohm-v09f-static-'));
let chrome=null,protocol=null;
const server=createServer((req,res)=>{
 let pathname='';
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '');}
 catch{res.writeHead(400);res.end();return}
 if(pathname!=='snake-morphology-v09f-lab.html'&&!pathname.startsWith('src/ohm-core/')){
  res.writeHead(403);res.end();return
 }
 if(pathname.includes('..')||pathname.includes('\\')){
  res.writeHead(403);res.end();return
 }
 const absolute=path.resolve(root,pathname);
 if(absolute!==path.join(root,lab)&&!absolute.startsWith(
  path.join(root,'src/ohm-core')+path.sep)){
  res.writeHead(403);res.end();return
 }
 try{
  res.writeHead(200,{'Content-Type':pathname.endsWith('.html')?
   'text/html; charset=utf-8':'text/javascript; charset=utf-8',
   'Cache-Control':'no-store'});
  res.end(readFileSync(absolute));
 }catch{res.writeHead(404);res.end()}
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
 throw Error('V0.9F dedicated morphology Chrome required');
if(!bin)console.log('SKIP V0.9F no Chrome available');
if(bin)try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve)
 });
 const profile=path.join(folder,'profile');
 chrome=spawn(bin,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions',
  '--hide-scrollbars','--force-device-scale-factor=1',
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
 let firstHash=null;
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
    expression:'(()=>({status:document.body.dataset.qaV09f,'+
     'ready:document.readyState,qa:window.ohmQaV09f??null}))()',
    returnByValue:true
   });
   if(v.exceptionDetails)throw Error('morphology JS error '+JSON.stringify(v.exceptionDetails));
   data=v.result?.value;
   if(data?.status==='pass'&&data.ready==='complete')break;
   await sleep(100);
  }
  assert.equal(data?.status,'pass',view.id+' incomplete');
  assert.equal(data.qa.meshCount,3);
  assert.equal(data.qa.sourceJoints,24);
  assert.equal(data.qa.sourceAnchorsUnchanged,true);
  assert.equal(data.qa.staticOnly,true);
  assert.equal(data.qa.skinApplied,false);
  assert.equal(data.qa.sourceNewMeshCollisionCertified,false);
  assert.equal(data.qa.sourceDynamicValidated,false);
  assert.ok(data.qa.bodyTailRatio<.2);
  assert.ok(data.qa.nonempty>100, 'canonical static render must have bright silhouette and labels');
  if(firstHash===null)firstHash=data.qa.canvasHash;
  else assert.equal(data.qa.canvasHash,firstHash,
   'canonical 1440x810 morph should not change on viewport resize');
  const snap=await protocol.send('Page.captureScreenshot',{
   format:'png',fromSurface:true,captureBeyondViewport:false
  },60000);
  const png=Buffer.from(snap.data,'base64');
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16),view.w);
  assert.equal(png.readUInt32BE(20),view.h);
  assert.ok(png.length>15000,'static test must really render snake');
  writeFileSync(path.join(capture,view.id+'_static.png'),png);
  console.log('PASS V0.9F static real Chrome '+JSON.stringify({
   view:view.id,canvasHash:data.qa.canvasHash,
   screenshotBytes:png.length,bodyRings:data.qa.bodyRings,
   headRings:data.qa.headRings,tailRatio:data.qa.bodyTailRatio
  }));
 }
 console.log('PASS V0.9F TWO landscape static morphology screenshots; new dynamic movement is NOT approved by this test');
}finally{
 if(protocol)protocol.ws.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');await sleep(350);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
 }
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(folder,{recursive:true,force:true});
}
