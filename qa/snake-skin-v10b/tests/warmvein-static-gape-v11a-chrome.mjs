/**
 * Strict genuine Chromium/WebGL2 static art evidence — V1.1A.
 * 4 frozen jaw angles x 4 camera directions; 16 real framebuffer
 * screenshots. No proxy/synthetic screenshots are accepted.
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
 out=path.join(root,'qa/snake-skin-v10b/.qa-artifacts/v11a-static');
mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const candidate=[process.env.OHM_CHROME_BIN,'google-chrome','chromium','chromium-browser']
 .filter(Boolean).find(cmd=>spawnSync(cmd,['--version'],{
  encoding:'utf8',timeout:5000
 }).status===0);
if(!candidate)throw Error('V1.1A strict Chrome WebGL2 model screenshot required');
const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-static-gape-v11a-'));
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
 constructor(socket){
  this.ws=socket;this.id=0;this.waiting=new Map();
  socket.addEventListener('message',event=>{
   let message;
   try{message=JSON.parse(String(event.data))}catch{return;}
   const p=this.waiting.get(message.id);if(!p)return;
   this.waiting.delete(message.id);clearTimeout(p.timer);
   if(message.error)p.reject(Error(JSON.stringify(message.error)));
   else p.resolve(message.result);
  });
 }
 call(method,params={},timeout=35000){
  return new Promise((resolve,reject)=>{
   const id=++this.id,timer=setTimeout(()=>{
    this.waiting.delete(id);reject(Error(method+' timeout'));
   },timeout);
   this.waiting.set(id,{resolve,reject,timer});
   this.ws.send(JSON.stringify({id,method,params}));
  });
 }
}
async function evaluate(protocol,code){
 const r=await protocol.call('Runtime.evaluate',{
  expression:code,returnByValue:true
 },50000);
 if(r.exceptionDetails)throw Error('browser exception '+JSON.stringify(r.exceptionDetails));
 return r.result.value;
}
try{
 await new Promise((resolve,reject)=>{
  server.once('error',reject);server.listen(0,'127.0.0.1',resolve);
 });
 const profile=path.join(temp,'profile');
 chrome=spawn(candidate,[
  '--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions',
  '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader',
  '--remote-debugging-port=0','--remote-allow-origins=*',
  '--user-data-dir='+profile,'about:blank'
 ],{cwd:root,stdio:['ignore','ignore','pipe']});
 let port=null,stderr='';
 chrome.stderr.on('data',chunk=>{stderr=(stderr+chunk).slice(-2500)});
 for(let t=0;t<300;t++){
  if(chrome.exitCode!==null)throw Error('Chrome exit '+stderr);
  const file=path.join(profile,'DevToolsActivePort');
  if(existsSync(file)){
   port=Number(readFileSync(file,'utf8').split('\n')[0]);break;
  }
  await sleep(100);
 }
 assert.ok(port>0,'CDP port unavailable '+stderr);
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list',{
  signal:AbortSignal.timeout(20000)
 })).json();
 const page=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);
 assert.ok(page);
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((res,rej)=>{
  socket.addEventListener('open',res,{once:true});
  socket.addEventListener('error',rej,{once:true});
 });
 const cdp=new CDP(socket);
 await cdp.call('Page.enable');
 await cdp.call('Runtime.enable');
 const url='http://127.0.0.1:'+server.address().port+
  '/qa/snake-skin-v10b/static-head/index.html';
 const nav=await cdp.call('Page.navigate',{url});
 if(nav.errorText)throw Error(nav.errorText);
 let ready=null;
 for(let i=0;i<180;i++){
  ready=await evaluate(cdp,
   "({ready:document.readyState,qa:window.__warmveinStaticGapeQA?.()??null})");
  if(ready.ready==='complete'&&ready.qa?.realWebGL2Drawn)break;
  await sleep(100);
 }
 assert.equal(ready?.qa?.realWebGL2Drawn,true,
  'new static geometry page never rendered WebGL2');
 const poses=['closed','slight','medium','wide'];
 const angles=['side','quarter','front','elevated'];
 const results=[],unique=new Set();
 const base64='data:image/png;base64,';
 let lastGap=-Infinity;
 for(const pose of poses){
  for(const view of angles){
   const expression=[
    "(()=>{",
    "const p=document.querySelector('#pose');",
    "const a=document.querySelector('#angle');",
    "p.value="+JSON.stringify(pose)+";",
    "p.dispatchEvent(new Event('change',{bubbles:true}));",
    "a.value="+JSON.stringify(view)+";",
    "a.dispatchEvent(new Event('change',{bubbles:true}));",
    "const c=document.querySelector('#render');",
    "const gl=c.getContext('webgl2');",
    "gl.finish();",
    "const pixels=new Uint8Array(c.width*c.height*4);",
    "gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);",
    "let colored=0,sum=0;",
    "for(let i=0;i<pixels.length;i+=16){",
    "const r=pixels[i],g=pixels[i+1],b=pixels[i+2];",
    "if(r+g+b>200)colored++;",
    "sum=(sum*31+r*5+g*3+b)>>>0;",
    "}",
    "return {qa:window.__warmveinStaticGapeQA(),",
    "error:gl.getError(),colored,sum,",
    "png:c.toDataURL('image/png')};",
    "})()"
   ].join('');
   const result=await evaluate(cdp,expression),qa=result.qa;
   assert.equal(result.error,0);
   assert.equal(qa.version,'1.1A');
   assert.equal(qa.pose,pose);
   assert.equal(qa.angle,view);
   assert.equal(qa.realWebGL2Drawn,true);
   assert.equal(qa.sameWorldPixelScaleXY,true);
   assert.equal(qa.original24JointMotionTouched,false);
   assert.equal(qa.productionMeshOrCollisionModified,false);
   assert.equal(qa.downloadedReferenceMeshUsed,false);
   assert.equal(qa.artistAccepted,false);
   assert.ok(qa.triangleCount>1000);
   assert.ok(result.colored>500,'blank or tiny 3D output '+pose+' / '+view);
   assert.ok(result.png.startsWith(base64));
   const png=Buffer.from(result.png.slice(base64.length),'base64');
   assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
   assert.equal(png.readUInt32BE(16),1100);
   assert.equal(png.readUInt32BE(20),660);
   const sha256=createHash('sha256').update(png).digest('hex');
   assert.equal(unique.has(sha256),false,'duplicate static camera/pose '+pose+' '+view);
   unique.add(sha256);
   writeFileSync(path.join(out,'v11a_'+pose+'_'+view+'.png'),png);
   results.push({pose,view,mouthGap:qa.mouthGapAtMuzzleWorld,
    triangles:qa.triangleCount,coloredSamplePixels:result.colored,
    framebufferChecksum:result.sum,sha256});
   if(view==='side'){
    assert.ok(qa.mouthGapAtMuzzleWorld>lastGap);
    lastGap=qa.mouthGapAtMuzzleWorld;
   }
  }
 }
 assert.equal(results.length,16);
 assert.equal(unique.size,16);
 writeFileSync(path.join(out,'v11a-static-evidence.json'),
  JSON.stringify({version:'1.1A',reviewStatus:'NOT ARTIST APPROVED',
   noProductionIntegration:true,screenshots:results},null,2));
 console.log('PASS V1.1A 16 true Chrome WebGL2 static screenshots across four yawning states and four camera views; art acceptance remains pending');
}finally{
 if(socket)socket.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');await sleep(250);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
 }
 await new Promise(res=>server.listening?server.close(res):res());
 rmSync(temp,{recursive:true,force:true});
}
