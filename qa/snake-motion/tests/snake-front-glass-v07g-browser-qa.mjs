/**
 * V0.7G real Chromium front-glass canvas QA.
 *
 * Starts an ephemeral local-only static server so canonical JS ESM imports
 * work without CORS bypass. Executes the SAME inline 180-frame debug path
 * and inspects a real Canvas screenshot. No network, no player saves.
 * Chromium is not equivalent to iPhone Safari or a human art review.
 */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {
 readFileSync,mkdtempSync,rmSync,existsSync,copyFileSync,mkdirSync
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const html=readFileSync(path.join(root,'snake-transparent-v07g-lab.html'),'utf8');
assert.match(html,/<canvas id="stage" width="1440" height="810"/);
assert.match(html,/projectTransparentSnakeV07g/);
assert.match(html,/advanceSnakeNeckTemporalV07f/);
assert.match(html,/buildSnakeFrontGlassEcologyV07h/);
assert.match(html,/classifyFrontGlassEcologyDepthV07h/);
assert.match(html,/buildSnakeRootedBotanyV07i/);
assert.match(html,/composeSnakeBotanyV07j/);
assert.match(html,/buildMossSoilTransitionsV07k/);
assert.match(html,/drawMossSoilContact/);
assert.match(html,/createSnakeTerrainMeshV07m/);
assert.match(html,/createSnakeTerrainDebugV07n/);
assert.match(html,/drawTerrainDebugOverlay/);
assert.match(html,/id="terrainDebug"/);
assert.match(html,/drawRootedBotany/);
assert.match(html,/drawEcologyItems\(layers.front\)/);
assert.match(html,/document\.body\.dataset\.qaV07g/);
assert.match(html,/qa_v07g/);
assert.doesNotMatch(html,/src\s*=\s*['"]https?:/i,
 'no remote/unknown art reference is allowed in internal snake QA');
const mime=filename=>filename.endsWith('.html')?'text/html; charset=utf-8':
 filename.endsWith('.mjs')?'text/javascript; charset=utf-8':
 'text/plain; charset=utf-8';
const server=createServer((req,res)=>{
 let url;
 try{url=new URL(req.url,'http://localhost');}
 catch{res.writeHead(400);res.end();return;}
 const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');
 if((relative!=='snake-transparent-v07g-lab.html'&&
    !relative.startsWith('src/ohm-core/'))||
   relative.includes('..')||relative.includes('\\')){
  res.writeHead(403);res.end();return;
 }
 const full=path.resolve(root,relative);
 if(!(full===path.join(root,'snake-transparent-v07g-lab.html')||
    full.startsWith(path.join(root,'src','ohm-core')+path.sep))){
  res.writeHead(403);res.end();return;
 }
 try{const bytes=readFileSync(full);
  res.writeHead(200,{'Content-Type':mime(full),
   'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-snake-v07g-front-'));
let chrome=null;
for(const bin of [
 process.env.OHM_CHROME_BIN,'google-chrome','google-chrome-stable',
 'chromium','chromium-browser'
].filter(Boolean)){
 const t=spawnSync(bin,['--version'],{timeout:4000,encoding:'utf8'});
 if(t.status===0){chrome=bin;break;}
}
function runChrome(flags,url){
 return new Promise((resolve,reject)=>{
  const args=[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage',
   '--disable-background-networking','--disable-extensions',
   '--disable-popup-blocking','--no-first-run','--hide-scrollbars',
   '--force-device-scale-factor=1',
   '--user-data-dir='+path.join(temp,'chrome_'+Math.random().toString(36).slice(2)),
   '--virtual-time-budget=2400',...flags,url
  ];
  const proc=spawn(chrome,args,{cwd:root,stdio:['ignore','pipe','pipe']});
  let out='',err='';
  const timer=setTimeout(()=>{
   proc.kill('SIGKILL');
   reject(Error('Chromium timeout '+err.slice(-1500)));
  },30000);
  proc.stdout.on('data',b=>out+=b.toString());
  proc.stderr.on('data',b=>err+=b.toString());
  proc.on('error',e=>{clearTimeout(timer);reject(e)});
  proc.on('close',code=>{
   clearTimeout(timer);
   if(code!==0)reject(Error('Chromium exit '+code+': '+err.slice(-1200)));
   else resolve(out);
  });
 });
}
try{
 if(!chrome){
  if(process.env.OHM_REQUIRE_CHROME==='1')
   throw Error('V0.7G real browser gate requires Chromium');
  console.log('SKIP V0.7G browser screenshot: no Chromium installed; static checks passed; real Safari AND Chromium visual QA still required.');
 }else{
  await new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(0,'127.0.0.1',resolve);
  });
  const url='http://127.0.0.1:'+server.address().port+
   '/snake-transparent-v07g-lab.html?qa_v07g=1';
  for(const view of [
   {name:'wide_front_glass',w:1440,h:900},
   {name:'short_phone_landscape',w:932,h:480}
  ]){
   const flags=['--window-size='+view.w+','+view.h];
   const dom=await runChrome([...flags,'--dump-dom'],url);
   const pass=/<body\b[^>]*data-qa-v07g="pass"/.test(dom);
   const frames=dom.match(/data-qa-v07g-frames="(\d+)"/)?.[1];
   const front=dom.includes('data-qa-v07g-camera="front_glass"');
   const transparent=dom.includes('data-qa-v07g-transparent="true"');
   assert.equal(pass,true,
    view.name+' browser must run actual module pipeline, not show a blank image');
   assert.ok(Number(frames)>=175,
    view.name+' 180 fixed steps must execute, got '+frames);
   assert.equal(front,true,
    view.name+' must use front glass camera, not top-down');
   assert.equal(transparent,true,
    view.name+' must keep snake body transparent without a final texture');
   const plantCount=Number(dom.match(/data-qa-v07h-ecology="(\d+)"/)?.[1]);
   const stoneCount=Number(dom.match(/data-qa-v07h-stones="(\d+)"/)?.[1]);
   const missingPlant=dom.includes('data-qa-v07h-empty-zone="true"');
   assert.ok(plantCount>=14,
    view.name+' must render REAL V0.3q zonal plant cover, not empty backdrop');
   assert.equal(stoneCount,3,
    view.name+' must render exactly 3 V0.3d rock surfaces');
   assert.equal(missingPlant,true,
    view.name+' cannot draw an invented living plant in an empty zone');
   const rooted=dom.includes('data-qa-v07i-rooted="true"');
   const fernCount=Number(dom.match(/data-qa-v07i-fern="(\d+)"/)?.[1]);
   const mossCount=Number(dom.match(/data-qa-v07i-moss="(\d+)"/)?.[1]);
   assert.equal(rooted,true,
    view.name+' all leaves/moss must attach to exact V0.7H soil roots');
   assert.ok(fernCount>0&&mossCount>0,
    view.name+' screen must draw only source-owned fern/moss patches');
   assert.equal(fernCount+mossCount,plantCount,
    view.name+' botanical geometry must match scene-owned live patches');
   assert.equal(dom.includes('data-qa-v07j-composed="true"'),true,
    view.name+' V0.7J must preserve all roots and transparent rig');
   const visibleFronds=Number(dom.match(/data-qa-v07j-visible-fronds="([0-9]+)"/)?.[1]);
   assert.ok(visibleFronds===fernCount*3,
    view.name+' must show exactly three EXISTING fronds per fern patch');
   assert.equal(dom.includes('data-qa-v07k-moss-contact="true"'),true,
    view.name+' moss seam must be attached to existing source roots');
   const mossSeams=Number(dom.match(/data-qa-v07k-moss-count="([0-9]+)"/)?.[1]);
   assert.equal(mossSeams,mossCount,
    view.name+' one soil seam per existing moss patch; no new life');
   assert.equal(dom.includes('data-qa-v07n-overlay-ready="true"'),true,
    view.name+' V0.7M triangle overlay must match current V0.3d scene');
   assert.equal(dom.includes('data-qa-v07n-triangles="32"'),true,
    view.name+' lab terrain grid must create 32 projected triangles');
   assert.equal(dom.includes('data-qa-v07n-cave-authorization="false"'),true,
    view.name+' cave overlay must not grant gameplay passage');
   assert.equal(dom.includes('data-qa-v07n-visible="false"'),true,
    view.name+' ordinary QA must keep technical wireframe invisible');
   const debugUrl=url+'&qa_v07n=1';
   const debugDom=await runChrome([...flags,'--dump-dom'],debugUrl);
   assert.equal(debugDom.includes('data-qa-v07n-visible="true"'),true,
    view.name+' explicit debug toggle must enable terrain wireframe');
   assert.equal(debugDom.includes('data-qa-v07n-overlay-ready="true"'),true,
    view.name+' enabled wireframe must keep validated scene mapping');
   assert.equal(debugDom.includes('data-qa-v07g-transparent="true"'),true,
    view.name+' enabling terrain must not coat or remove the snake');
   assert.ok(Number(debugDom.match(/data-qa-v07g-frames="([0-9]+)"/)?.[1])>=175,
    view.name+' overlay must retain 180-frame snake animation');
   assert.equal(debugDom.includes('data-qa-v07n-raster-verified="true"'),true,
    view.name+' V0.7N must paint actual CANVAS pixels, not just change button CSS');
   const changedPixels=Number(debugDom.match(
    /data-qa-v07n-changed-canvas-pixels="([0-9]+)"/)?.[1]);
   assert.ok(changedPixels>=250,
    view.name+' expected visible 3D terrain wireframe raster difference, got '+
    changedPixels+' pixels');
   assert.equal(dom.includes('data-qa-v07n-changed-canvas-pixels="0"'),true,
    view.name+' normal screenshot must not paint 3D wireframe');
   const output=path.join(temp,view.name+'.png');
   await runChrome([...flags,'--screenshot='+output],url);
   assert.ok(existsSync(output),'missing actual canvas capture '+view.name);
   const bytes=readFileSync(output);
   assert.equal(bytes.subarray(0,8).toString('hex'),
    '89504e470d0a1a0a');
   assert.ok(bytes.length>12000,
    'empty or broken screenshot '+view.name);
   assert.ok(bytes.readUInt32BE(16)>=view.w);
   assert.ok(bytes.readUInt32BE(20)>=view.h);
   console.log('PASS V0.7G Chromium '+view.name+
    ': 180-frame real canvas ESM pipeline, front glass, transparent rig; '+
    bytes.readUInt32BE(16)+'x'+bytes.readUInt32BE(20)+
    ', '+bytes.length+' PNG bytes');
   if(process.env.OHM_V07G_CAPTURE_DIR){
    // A CI artifact, never committed as game art or published to Pages.
    const folder=path.resolve(root,process.env.OHM_V07G_CAPTURE_DIR);
    if(!folder.startsWith(root+path.sep))throw Error('artifact path must be inside private repo runner');
    mkdirSync(folder,{recursive:true});
    copyFileSync(output,path.join(folder,view.name+'.png'));
   }
   const debugOutput=path.join(temp,view.name+'_terrain_debug.png');
   await runChrome([...flags,'--screenshot='+debugOutput],debugUrl);
   assert.ok(existsSync(debugOutput),
    view.name+' real Chrome terrain overlay screenshot missing');
   const debugBytes=readFileSync(debugOutput);
   assert.equal(debugBytes.subarray(0,8).toString('hex'),
    '89504e470d0a1a0a');
   assert.ok(debugBytes.length>12000,
    view.name+' terrain overlay screenshot must not be blank');
   assert.ok(!bytes.equals(debugBytes),
    view.name+' normal/terrain screenshots must be distinct raster outputs');
   assert.ok(debugBytes.readUInt32BE(16)>=view.w);
   assert.ok(debugBytes.readUInt32BE(20)>=view.h);
   if(process.env.OHM_V07G_CAPTURE_DIR){
    const folder=path.resolve(root,process.env.OHM_V07G_CAPTURE_DIR);
    if(!folder.startsWith(root+path.sep))throw Error('artifact path must be inside private repo runner');
    copyFileSync(debugOutput,
     path.join(folder,view.name+'_terrain_debug.png'));
   }
   // Private CI is allowed to return a single screenshot for direct art QA.
   // Do not archive or publish it as a player-facing preview.
   if(process.env.OHM_V07G_EMIT_CAPTURE==='1'&&
       view.name==='wide_front_glass'){
     console.log('V07G_FRONT_SCREENSHOT_BASE64_BEGIN');
     console.log(bytes.toString('base64'));
     console.log('V07G_FRONT_SCREENSHOT_BASE64_END');
   }
  }
 }
}finally{
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(temp,{recursive:true,force:true});
}
