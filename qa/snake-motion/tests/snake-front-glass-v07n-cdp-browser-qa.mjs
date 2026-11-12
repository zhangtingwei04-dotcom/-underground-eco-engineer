/**
 * Project OHM V0.7N — one Chrome process, CDP viewport/raster QA.
 * Real Chromium, no browser npm dependencies, only local static ESM.
 *
 * One shared browser session captures BOTH default and debug screenshots
 * for BOTH horizontal viewports. Avoids 8 slow separate Chrome launches.
 * The page itself checks same-frame CANVAS pixel differences so changing
 * button styling cannot fake a rendered V0.7N terrain overlay.
 */
import assert from 'node:assert/strict';
import {spawn,spawnSync} from 'node:child_process';
import {createServer} from 'node:http';
import {
 readFileSync,mkdtempSync,rmSync,existsSync,mkdirSync,
 writeFileSync,copyFileSync
} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const labFile='snake-transparent-v07g-lab.html';
const html=readFileSync(path.join(root,labFile),'utf8');
for(const match of [
 /<canvas id="stage" width="1440" height="810"/,
 /createSnakeTerrainDebugV07n/,
 /qaV07nRasterVerified/,
 /qaV07nStageVisible/,
 /qa_v07n/,
 /advanceSnakeNeckTemporalV07f/,
 /advanceSnakeWallProbeV07p/,
 /qaV07pRenderable/,
 /buildContinuousTransparentRigV07o/,
 /buildTransparentBodyVolumeV07q/,
 /buildTransparentHeadNeckBridgeV07r/,
 /prepareSnakeGroundHandoffV07s/,
 /qaV07sHandoff/,
 /advanceSnakeGroundTemporalV07t/,
 /qaV07tHeadLed/,
 /advanceSnakeCurvatureRelayV07u/,
 /qaV07uRelay/,
 /buildSnakeGhostContinuityV07v/,
 /qaV07vHeadColliderIdentity/,
 /buildSnakeHeadNeckSculptV07w/,
 /qaV07wSourceHead/,
 /buildSnakeNeckFollowV07x/,
 /qaV07xNeckFollow/,
 /buildSnakeSlenderVolumeV07y/,
 /qaV07ySlender/,
 /inspectSnakeVolumeClearanceV07z/,
 /qaV07zQuality/,
 /buildSnakeOpacityUnionV08a/,
 /qaV08aOnePass/
])assert.ok(match.test(html),'missing real lab source marker: '+String(match));
const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-snake-cdp-'));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const mime=file=>file.endsWith('.html')?'text/html; charset=utf-8':
 file.endsWith('.mjs')?'text/javascript; charset=utf-8':
 'text/plain; charset=utf-8';
const server=createServer((req,res)=>{
 let url;
 try{url=new URL(req.url,'http://127.0.0.1');}
 catch{res.writeHead(400);res.end();return;}
 let relative;
 try{relative=decodeURIComponent(url.pathname).replace(/^\/+/, '');}
 catch{res.writeHead(400);res.end();return;}
 if((relative!==labFile&&!relative.startsWith('src/ohm-core/'))||
    relative.includes('..')||relative.includes('\\')){
  res.writeHead(403);res.end();return;
 }
 const resolved=path.resolve(root,relative);
 if(!(resolved===path.join(root,labFile)||
      resolved.startsWith(path.join(root,'src','ohm-core')+path.sep))){
  res.writeHead(403);res.end();return;
 }
 try{
  const bytes=readFileSync(resolved);
  res.writeHead(200,{
   'Content-Type':mime(resolved),
   'Cache-Control':'no-store',
   'X-Content-Type-Options':'nosniff'
  });
  res.end(bytes);
 }catch{res.writeHead(404);res.end();}
});
let chromeBin=null;
for(const binary of [
 process.env.OHM_CHROME_BIN,'google-chrome','google-chrome-stable',
 'chromium','chromium-browser'
].filter(Boolean)){
 const r=spawnSync(binary,['--version'],{timeout:4000,encoding:'utf8'});
 if(r.status===0){chromeBin=binary;break;}
}
let chrome=null,cdp=null;
function assertPng(bytes,view){
 assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
 assert.equal(bytes.readUInt32BE(16),view.w);
 assert.equal(bytes.readUInt32BE(20),view.h);
 assert.ok(bytes.length>12000,'Chrome PNG too small or blank: '+view.name);
}
async function waitForChrome(portFile,stderr){
 for(let i=0;i<300;i++){
  if(chrome.exitCode!==null)
   throw Error('Chrome exited before CDP startup: '+stderr());
  if(existsSync(portFile)){
   const n=Number(readFileSync(portFile,'utf8').split('\n')[0]);
   if(Number.isInteger(n)&&n>0)return n;
  }
  await sleep(100);
 }
 throw Error('Chrome CDP startup timeout: '+stderr());
}
function connectWebSocket(url){
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(url);
  const timer=setTimeout(()=>{
   ws.close();reject(Error('Chrome CDP WebSocket connect timed out'));
  },20000);
  ws.addEventListener('open',()=>{clearTimeout(timer);resolve(ws)},{once:true});
  ws.addEventListener('error',e=>{
   clearTimeout(timer);reject(Error('Chrome CDP WebSocket failed: '+e.type));
  },{once:true});
 });
}
class CDP{
 constructor(ws){
  this.ws=ws;this.id=0;this.pending=new Map();this.closed=false;
  ws.addEventListener('message',ev=>{
   let parsed;
   try{parsed=JSON.parse(String(ev.data));}
   catch{return}
   const promise=this.pending.get(parsed.id);
   if(!promise)return;
   this.pending.delete(parsed.id);
   clearTimeout(promise.timer);
   if(parsed.error)promise.reject(Error(JSON.stringify(parsed.error)));
   else promise.resolve(parsed.result);
  });
  ws.addEventListener('close',()=>{
   this.closed=true;
   for(const value of this.pending.values()){
    clearTimeout(value.timer);
    value.reject(Error('Chrome disconnected during '+value.method));
   }
   this.pending.clear();
  });
 }
 send(method,params={},timeoutMs=45000){
  if(this.closed||this.ws.readyState!==WebSocket.OPEN)
   return Promise.reject(Error('Chrome CDP socket is not open'));
  return new Promise((resolve,reject)=>{
   const id=++this.id;
   const timer=setTimeout(()=>{
    this.pending.delete(id);
    reject(Error('Chrome CDP '+method+' exceeded '+timeoutMs+' ms'));
   },timeoutMs);
   this.pending.set(id,{resolve,reject,timer,method});
   this.ws.send(JSON.stringify({id,method,params}));
  });
 }
 close(){this.ws.close();}
}
const expression='(()=>{'+
 'const d=document.body?.dataset;if(!d)return null;'+
 'return {'+
 'status:d.qaV07g,frames:Number(d.qaV07gFrames),'+
 'transparent:d.qaV07gTransparent,camera:d.qaV07gCamera,'+
 'probeMode:d.qaV07pMode,probeRenderable:d.qaV07pRenderable,'+
 'probePhase:d.qaV07pPhase,probePitch:Number(d.qaV07pPitch),'+
 'probeRestored:d.qaV07pRestored,probeRearAnchored:d.qaV07pRearAnchored,'+
 'opacityMode:d.qaV08aMode,opacityOnePass:d.qaV08aOnePass,'+
 'opacityPaintPasses:Number(d.qaV08aPaintPasses),'+
 'clearanceMode:d.qaV07zMode,clearance:d.qaV07zQuality,'+
 'clearanceMin:Number(d.qaV07zMinimum3DClearance),'+
 'clearancePairs:Number(d.qaV07zPairs),'+
 'clearanceOverlap:Number(d.qaV07zOverlapCount),'+
 'clearanceProjectionOnly:Number(d.qaV07zProjectionOnlyCount),'+
 'clearanceMaxBend:Number(d.qaV07zMaximumBend),'+
 'clearanceFlipCount:Number(d.qaV07zFlipCount),'+
 'slenderMode:d.qaV07yMode,slender:d.qaV07ySlender,'+
 'slimMid:Number(d.qaV07yMidScale),'+
 'slimNeck:Number(d.qaV07yNeckScale),'+
 'slimTail:Number(d.qaV07yTailScale),'+
 'slimSocketGap:Number(d.qaV07ySocketGap),'+
 'slimBodySamples:Number(d.qaV07yBodyChecks),'+
 'slimHeadSamples:Number(d.qaV07yHeadChecks),'+
 'slimBendRelief:Number(d.qaV07yBendRelief),'+
 'neckFollowMode:d.qaV07xMode,neckFollow:d.qaV07xNeckFollow,'+
 'neckSamples:Number(d.qaV07xSamples),'+
 'neckHeadRings:Number(d.qaV07xHeadRings),'+
 'neckRings:Number(d.qaV07xNeckRings),'+
 'neckShift:Number(d.qaV07xRingShift),'+
 'neckAngle:Number(d.qaV07xSourceAngle),'+
 'neckHalfFrame:Number(d.qaV07xHalfFrameChecks),'+
 'sculptMode:d.qaV07wMode,sculpt:d.qaV07wSourceHead,'+
 'sculptHeadRings:Number(d.qaV07wHeadRings),'+
 'sculptNeckRings:Number(d.qaV07wNeckRings),'+
 'sculptChecks:Number(d.qaV07wCollisionChecks),'+
 'sculptNoSkin:d.qaV07wNoSkin,'+
 'ghostMode:d.qaV07vMode,ghost:d.qaV07vHeadColliderIdentity,'+
 'ghostShift:Number(d.qaV07vShellShift),ghostRatio:Number(d.qaV07vHeadRatio),'+
 'ghostScale:Number(d.qaV07vHeadScale),ghostCollar:Number(d.qaV07vCollarRings),'+
 'relayMode:d.qaV07uMode,relay:d.qaV07uRelay,'+
 'relayTurn:Number(d.qaV07uTurn),relayBend:Number(d.qaV07uFrontBend),'+
 'relayFirstHead:Number(d.qaV07uFirstHeadBend),'+
 'relayFirstRear:Number(d.qaV07uFirstRearBend),'+
 'relayQuietFrames:Number(d.qaV07uQuietFrames),'+
 'relayMovingFrames:Number(d.qaV07uMovingFrames),'+
 'relayCoexistFrames:Number(d.qaV07uCoexistFrames),'+
 'relayQuiet:Number(d.qaV07uQuietGround),'+
 'relayMoving:Number(d.qaV07uMovingGround),'+
 'relayHeadTravel:Number(d.qaV07uHeadTravel),'+
 'headLedMode:d.qaV07tMode,headLed:d.qaV07tHeadLed,'+
 'temporalElapsed:Number(d.qaV07tElapsed),'+
 'temporalHeadTravel:Number(d.qaV07tHeadTravel),'+
 'temporalSupport:Number(d.qaV07tSupportCount),'+
 'handoffMode:d.qaV07sMode,handoff:d.qaV07sHandoff,'+
 'groundFrames:Number(d.qaV07sFrames),headTravel:Number(d.qaV07sHeadTravel),'+
 'sourceLength:Number(d.qaV07sSourceTotalLength),'+
 'headNeck:d.qaV07rHeadNeck,collarRings:Number(d.qaV07rCollarRings),'+ 
 'headDisplayScale:Number(d.qaV07rHeadScale),'+
 'headIsSourceCollider:d.qaV07rHeadIsSourceCollider,'+
 'volume:d.qaV07qVolume,rings:Number(d.qaV07qRings),'+
 'minimum3dThickness:Number(d.qaV07qMinimumThickness),'+
 'continuous:d.qaV07oContinuous,contourCount:Number(d.qaV07oContourPoints),'+
 'nodesHidden:d.qaV07oNodesHidden,contourTransparent:d.qaV07oTransparent,'+
 'plants:Number(d.qaV07hEcology),stones:Number(d.qaV07hStones),'+
 'empty:d.qaV07hEmptyZone,rooted:d.qaV07iRooted,'+
 'fern:Number(d.qaV07iFern),moss:Number(d.qaV07iMoss),'+
 'composed:d.qaV07jComposed,'+
 'fronds:Number(d.qaV07jVisibleFronds),'+
 'mossContact:d.qaV07kMossContact,'+
 'mossSeams:Number(d.qaV07kMossCount),'+
 'terrainReady:d.qaV07nOverlayReady,stageVisible:d.qaV07nStageVisible,'+
 'triangles:Number(d.qaV07nTriangles),'+
 'caveAuthorized:d.qaV07nCaveAuthorization,'+
 'visible:d.qaV07nVisible,'+
 'rasterVerified:d.qaV07nRasterVerified,'+
 'changedPixels:Number(d.qaV07nChangedCanvasPixels),'+
 'qaText:document.getElementById("qaStatus")?.textContent,'+
 'ready:document.readyState'+
 '};})()';
async function evalState(cdp){
 const r=await cdp.send('Runtime.evaluate',{
  expression,returnByValue:true,awaitPromise:false
 },30000);
 if(r.exceptionDetails)throw Error('JavaScript runtime error in Chrome: '+
  JSON.stringify(r.exceptionDetails).slice(0,700));
 return r.result?.value??null;
}
async function visit(cdp,url,view,debug,probe='off',ghost=false,sculpt=false,neckFollow=false,slender=false,clearance=false,opacity=false){
 await cdp.send('Emulation.setDeviceMetricsOverride',{
  width:view.w,height:view.h,deviceScaleFactor:1,mobile:false
 });
 const nav=await cdp.send('Page.navigate',{url},45000);
 if(nav.errorText)throw Error('Chrome navigation error '+nav.errorText);
 const requiredFrames=probe==='hold'?38:175;
 let state=null;
 for(let i=0;i<420;i++){ 
  state=await evalState(cdp);
  if(state?.status==='fail')
   throw Error(view.name+' browser simulation failed: '+
    JSON.stringify(state));
  if(state?.status==='pass'&&state?.frames>=requiredFrames&&
     state?.probeMode===(probe==='off'?'false':'true')&&
     state?.ghostMode===(ghost?'true':'false')&&
     state?.sculptMode===(sculpt?'true':'false')&&
     state?.neckFollowMode===(neckFollow?'true':'false')&&
     state?.slenderMode===(slender?'true':'false')&&
     state?.clearanceMode===(clearance?'true':'false')&&
      state?.opacityMode===(opacity?'true':'false')&&
      (!opacity||(state?.opacityOnePass==='true'&&state?.opacityPaintPasses===1))&&
     (!clearance||(state?.clearance==='true'&&
      state?.clearanceMin>.10&&
      state?.clearanceOverlap===0&&
      state?.clearanceFlipCount===0&&
      // Bend is checked below as a real assertion; do not poll 100s on failure.
      Number.isFinite(state?.clearanceMaxBend)&&
      state?.clearancePairs===(probe==='hold'?36:190)))&&
     (!slender||(state?.slender==='true'&&
      state?.slimMid>.65&&state?.slimMid<.8&&
      state?.slimNeck>.68&&state?.slimNeck<.83&&
      Math.abs(state?.slimTail-.88)<1e-8&&
      state?.slimSocketGap<1e-4&&
      state?.slimHeadSamples===2864&&
      state?.slimBodySamples===(probe==='hold'?5196:9948)))&&
     (!neckFollow||(state?.neckFollow==='true'&&
      state?.neckSamples===2864&&state?.neckRings===11&&
      state?.neckHeadRings===10&&state?.neckShift>.0001&&
      state?.neckShift<=.055+1e-8))&&
     (!sculpt||(state?.sculpt==='true'&&
      state?.sculptHeadRings===10&&state?.sculptNeckRings===11&&
      state?.sculptChecks===956&&state?.sculptNoSkin==='true'))&&
     (!ghost||(state?.ghost==='true'&&state?.ghostShift>.001&&
      state?.ghostShift<=.018+1e-8&&state?.ghostScale===1&&
      state?.ghostCollar===11&&
      state?.ghostRatio>.8&&state?.ghostRatio<1.3))&&
     (probe!=='hold'||(state?.probePhase==='hold'&&state?.probePitch>.3))&&
     (!['rest','handoff','temporal','relay'].includes(probe)||state?.probeRestored==='true')&&
     (!['handoff','temporal','relay'].includes(probe)||(state?.handoff==='true'&&
      state?.groundFrames>=70&&state?.headTravel>.15&&
      Math.abs(state?.sourceLength-2.28)<1e-12))&&
     (!['temporal','relay'].includes(probe)||(state?.headLed==='true'&&
      state?.temporalElapsed>2.3&&
      state?.temporalHeadTravel>.18&&state?.temporalSupport>=20))&&
     (probe!=='relay'||(
      state?.relay==='true'&&state?.relayTurn>.20&&
      state?.relayBend>.0006&&state?.relayQuietFrames>=1&&
      state?.relayMovingFrames>=1&&state?.relayHeadTravel>.18))&&
     state?.terrainReady==='true'&&
     state?.visible===(debug?'true':'false')&&
     (!debug||state?.rasterVerified==='true'))break;
  await sleep(200);
 }
 assert.ok(state?.status==='pass'&&state.frames>=requiredFrames,
  view.name+' Chrome simulation unfinished ('+probe+'): '+JSON.stringify(state));
 assert.equal(state.probeMode,probe==='off'?'false':'true',
  'near-glass probe must be EXPLICITLY opt-in');
 assert.equal(state.opacityMode,opacity?'true':'false',
   view.name+' V0.8A explicit opt-in');
  if(opacity){assert.equal(state.opacityOnePass,'true');assert.equal(state.opacityPaintPasses,1);}
  assert.equal(state.clearanceMode,clearance?'true':'false',
  view.name+' V0.7Z debug-only body diagnostic must be opt-in');
 if(clearance){
  assert.equal(state.clearance,'true');
  assert.ok(state.clearanceMin>.10);
  assert.equal(state.clearanceOverlap,0);
  assert.equal(state.clearanceFlipCount,0);
  assert.ok(state.clearanceMaxBend<.65,
    view.name+' probe='+probe+' measured maximum bend='+state.clearanceMaxBend+
    ' rad; QA dataset='+JSON.stringify(state));
  assert.equal(state.clearancePairs,probe==='hold'?36:190);
 }
 assert.equal(state.slenderMode,slender?'true':'false',
  view.name+' V0.7Y must remain opt-in and private');
 if(slender){
  assert.equal(state.slender,'true',
   view.name+' V0.7Y displayed slim body and candidate must share XYZ');
  assert.ok(state.slimMid>.65&&state.slimMid<.8,
   'about 26% trunk radius reduction is a real 3D parameter');
  assert.ok(state.slimNeck>.68&&state.slimNeck<.83);
  assert.ok(Math.abs(state.slimTail-.88)<1e-8);
  assert.ok(state.slimSocketGap<1e-4);
  assert.equal(state.slimHeadSamples,2864);
  assert.equal(state.slimBodySamples,probe==='hold'?5196:9948);
 }
 assert.equal(state.neckFollowMode,neckFollow?'true':'false',
  view.name+' source-tangent neck follower requires explicit QA opt-in');
 if(neckFollow){
  assert.equal(state.neckFollow,'true',
   view.name+' V0.7X visible neck and candidate mesh must be same 3D source');
  assert.equal(state.neckSamples,2864,
   view.name+' V0.7X mesh vertex+face+edge-midpoint checks required');
  assert.equal(state.neckHeadRings,10);
  assert.equal(state.neckRings,11);
  assert.ok(state.neckShift>.0001&&state.neckShift<=.055+1e-8);
 }
 assert.equal(state.sculptMode,sculpt?'true':'false',
  view.name+' V0.7W requires explicit opt-in and source-matched mesh');
 if(sculpt){
  assert.equal(state.sculpt,'true');
  assert.equal(state.sculptHeadRings,10);
  assert.equal(state.sculptNeckRings,11);
  assert.equal(state.sculptChecks,956,
   'new 3D candidate mesh vertices+face centroids must pass current source');
  assert.equal(state.sculptNoSkin,'true');
 }
 assert.equal(state.ghostMode,ghost?'true':'false',
  view.name+' true collider head ghost requires explicit opt-in');
 if(ghost){
  assert.equal(state.ghost,'true',
   view.name+' V0.7V canonical source head MUST equal the actual collision mesh');
  assert.ok(state.ghostShift>.001&&state.ghostShift<=.018+1e-8);
  assert.equal(state.ghostScale,1,
   'do not revive V0.7R hidden display-only head shrink');
  assert.ok(state.ghostRatio>.8&&state.ghostRatio<1.3);
  assert.equal(state.ghostCollar,11);
 }
 assert.equal(state.handoffMode,
  ['handoff','temporal','relay'].includes(probe)?'true':'false');
 assert.equal(state.headLedMode,
  ['temporal','relay'].includes(probe)?'true':'false');
 assert.equal(state.relayMode,probe==='relay'?'true':'false');
 if(probe==='relay'){
  assert.equal(state.relay,'true');
  assert.ok(state.relayTurn>.20&&state.relayBend>.0006);
  assert.ok(state.relayMovingFrames>0&&state.relayQuietFrames>0,
   view.name+' grounded quiet and moving observations must occur over the ANIMATION; same-frame coexistence is not established');
  assert.equal(state.relayMoving+state.relayQuiet,24,
   'each latest grounded joint must be classified, not mislabeled as actual friction');
  if(state.relayFirstRear>=0)assert.ok(state.relayFirstHead>=0&&
   state.relayFirstHead<=state.relayFirstRear);
 }
 if(['temporal','relay'].includes(probe)){ 
  assert.equal(state.headLed,'true',
   view.name+' V0.7T real head-led controller must be active');
  assert.ok(state.temporalElapsed>2.3&&state.temporalHeadTravel>.18);
  assert.ok(state.temporalSupport>=20);
 }
 if(['handoff','temporal','relay'].includes(probe)){
  assert.equal(state.handoff,'true',view.name+' V0.7S source-guarded handoff required');
  assert.ok(state.groundFrames>=70&&state.headTravel>.15);
  assert.ok(Math.abs(state.sourceLength-2.28)<1e-12,'V0.7S must not expand to unrelated 2.5 route');
 }
 if(probe!=='off'){
  assert.equal(state.probeRenderable,'true',
   view.name+' actual V0.7P pose must render, not an old fallback frame');
  assert.equal(state.probeRearAnchored,'true',
   view.name+' rear U/J ground support may not move during vertical probing');
  if(probe==='hold'){
   assert.equal(state.probePhase,'hold');
   assert.ok(state.probePitch>.3,'probe should visibly lift head');
  }else{
   assert.equal(state.probeRestored,'true',
    view.name+' rise/hold/lower/rest must return EXACT base posture');
  }
 }
 assert.equal(state.camera,'front_glass');
 assert.equal(state.transparent,'true');
 assert.equal(state.headNeck,'true',
  view.name+' V0.7R must preserve source head/neck/vertebrae in true 3D');
 assert.equal(state.collarRings,9,
  view.name+' explicit 3D collar must join canonical head to body ring');
 assert.ok(state.headDisplayScale>.2&&state.headDisplayScale<=1,
  view.name+' head size normalization may only touch render art');
 assert.equal(state.headIsSourceCollider,'false',
  view.name+' visible head is a LAB proxy; physical head collider is unchanged');
 assert.equal(state.volume,'true',
  view.name+' V0.7Q must render actual 3D cross-sections from fixed source pose');
 assert.equal(state.rings,['off','handoff','temporal','relay'].includes(probe)?93:49,
  view.name+' 3D ring count must reflect 24-joint walk or 13-joint lab probe');
 assert.ok(state.minimum3dThickness>1,
  view.name+' physical-looking cross-section must not collapse into 2D thin line');
 assert.equal(state.continuous,'true',
  view.name+' body must be continuous V0.7O from existing projected spine');
 const expectedContourPoints=['off','handoff','temporal','relay'].includes(probe)?278:146;
 assert.equal(state.contourCount,expectedContourPoints,
  view.name+' continuous contour must derive from the ACTUAL source joint count, '+
  'not invent 24 joints when the wall-probe fixture has 13');
 assert.equal(state.nodesHidden,'true',
  view.name+' bead-like bright bone nodes must be OFF by default');
 assert.equal(state.contourTransparent,'true',
  view.name+' V0.7O cannot add an external snake skin');
 assert.ok(state.plants>=14);
 assert.equal(state.stones,3);
 assert.equal(state.empty,'true');
 assert.equal(state.rooted,'true');
 assert.ok(state.fern>0&&state.moss>0);
 assert.equal(state.fern+state.moss,state.plants);
 assert.equal(state.composed,'true');
 assert.equal(state.fronds,state.fern*3);
 assert.equal(state.mossContact,'true');
 assert.equal(state.mossSeams,state.moss);
 assert.equal(state.terrainReady,'true');
 assert.equal(state.stageVisible,'true',
  view.name+' must fit the ENTIRE front-glass terrarium in the viewport, not crop bottom edges');
 assert.equal(state.triangles,32);
 assert.equal(state.caveAuthorized,'false');
 assert.equal(state.visible,debug?'true':'false');
 if(debug){
  assert.equal(state.rasterVerified,'true',
   view.name+' wireframe must paint pixels not merely change button style');
  assert.ok(state.changedPixels>=250,
   view.name+' need actual changed terrain CANVAS pixels, got '+state.changedPixels);
 }else{
  assert.equal(state.changedPixels,0,
   view.name+' normal screen must have no terrain wireframe');
 }
 const shot=await cdp.send('Page.captureScreenshot',{
  format:'png',fromSurface:true,captureBeyondViewport:false,
  optimizeForSpeed:true
 },60000);
 assert.ok(typeof shot.data==='string'&&shot.data.length>100);
 const png=Buffer.from(shot.data,'base64');
 assertPng(png,view);
 // Compare the actual CANVAS glass-world RGB pixels, NOT buttons/HUD or
 // the screenshot's page title. The snake lives inside this canvas ROI.
 let glassDigest=null;
 if(neckFollow||slender){
  const proof=await cdp.send('Runtime.evaluate',{
   expression:'(()=>{const c=document.getElementById("stage");'+
    'if(!c)return null;const a=c.getContext("2d").'+
    'getImageData(80,185,1280,585).data;'+
    'let h=2166136261;for(let i=0;i<a.length;i+=4){'+
    'h=Math.imul(h^a[i],16777619);'+
    'h=Math.imul(h^a[i+1],16777619);'+
    'h=Math.imul(h^a[i+2],16777619);}return(h>>>0).toString(16);})()',
   returnByValue:true
  },30000);
  if(proof.exceptionDetails)
   throw Error('Chrome glass-only pixel digest failed');
  glassDigest=proof.result?.value;
  assert.ok(typeof glassDigest==='string'&&glassDigest.length>0);
 }
 return {state,png,glassDigest};
}
try{
 if(!chromeBin){
  if(process.env.OHM_REQUIRE_CHROME==='1')
   throw Error('V0.7N real browser gate requires Google Chrome/Chromium');
  console.log('SKIP V0.7N real browser: no Chrome installed; CI never claims screenshot pass');
 }else{
  await new Promise((resolve,reject)=>{
   server.once('error',reject);
   server.listen(0,'127.0.0.1',resolve);
  });
  const baseUrl='http://127.0.0.1:'+server.address().port+
   '/'+labFile+'?qa_v07g=1';
  const profile=path.join(temp,'chrome-profile');
  let recentError='';
  chrome=spawn(chromeBin,[
   '--headless=new','--no-sandbox','--disable-dev-shm-usage',
   '--disable-background-networking','--disable-extensions',
   '--disable-popup-blocking','--no-first-run',
   '--no-default-browser-check','--hide-scrollbars',
   '--force-device-scale-factor=1',
   '--remote-debugging-port=0','--remote-allow-origins=*',
   '--user-data-dir='+profile,
   'about:blank'
  ],{cwd:root,stdio:['ignore','ignore','pipe']});
  chrome.stderr.on('data',b=>{
   recentError=(recentError+b.toString()).slice(-3000);
  });
  const port=await waitForChrome(path.join(profile,'DevToolsActivePort'),
   ()=>recentError);
  const targets=await (await fetch(
   'http://127.0.0.1:'+port+'/json/list',
   {signal:AbortSignal.timeout(20000)})).json();
  const target=targets.find(p=>p.type==='page'&&p.webSocketDebuggerUrl);
  assert.ok(target,'Chrome CDP needs an addressable page target');
  cdp=new CDP(await connectWebSocket(target.webSocketDebuggerUrl));
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  const views=[
   {name:'wide_front_glass',w:1440,h:900},
   {name:'short_phone_landscape',w:932,h:480}
  ];
  let done=0;
  for(const view of views){
   const plain=await visit(cdp,baseUrl,view,false);
   const terrain=await visit(cdp,baseUrl+'&qa_v07n=1',view,true);
   const probe=await visit(cdp,baseUrl+'&qa_v07p=1&qa_v07p_hold=1',
    view,false,'hold');
   const lowered=await visit(cdp,baseUrl+'&qa_v07p=1',
    view,false,'rest');
   const ground=await visit(cdp,baseUrl+'&qa_v07s=1',
    view,false,'handoff');
   const temporal=await visit(cdp,baseUrl+'&qa_v07t=1',
    view,false,'temporal');
   const relay=await visit(cdp,baseUrl+'&qa_v07u=1',
    view,false,'relay');
   const ghostHold=await visit(cdp,baseUrl+
    '&qa_v07p=1&qa_v07p_hold=1&qa_v07v=1',
    view,false,'hold',true);
   const ghostRelay=await visit(cdp,baseUrl+'&qa_v07u=1&qa_v07v=1',
    view,false,'relay',true);
   const sculptHold=await visit(cdp,baseUrl+
    '&qa_v07p=1&qa_v07p_hold=1&qa_v07v=1&qa_v07w=1',
    view,false,'hold',true,true);
   const sculptRelay=await visit(cdp,baseUrl+
    '&qa_v07u=1&qa_v07v=1&qa_v07w=1',
    view,false,'relay',true,true);
   const followHold=await visit(cdp,baseUrl+
    '&qa_v07p=1&qa_v07p_hold=1&qa_v07v=1&qa_v07w=1&qa_v07x=1',
    view,false,'hold',true,true,true);
   const followRelay=await visit(cdp,baseUrl+
    '&qa_v07u=1&qa_v07v=1&qa_v07w=1&qa_v07x=1',
    view,false,'relay',true,true,true);
   const slenderHold=await visit(cdp,baseUrl+
    '&qa_v07p=1&qa_v07p_hold=1&qa_v07y=1',
    view,false,'hold',true,true,true,true);
   const slenderRelay=await visit(cdp,baseUrl+
    '&qa_v07u=1&qa_v07y=1',
    view,false,'relay',true,true,true,true);
   const clearanceHold=await visit(cdp,baseUrl+
    '&qa_v07p=1&qa_v07p_hold=1&qa_v07z=1',
    view,false,'hold',true,true,true,true,true);
   const clearanceRelay=await visit(cdp,baseUrl+
    '&qa_v07u=1&qa_v07z=1',
    view,false,'relay',true,true,true,true,true);
   const unionHold=await visit(cdp,baseUrl+
     '&qa_v07p=1&qa_v07p_hold=1&qa_v08a=1',
     view,false,'hold',true,true,true,true,true,true);
    const unionRelay=await visit(cdp,baseUrl+
     '&qa_v07u=1&qa_v08a=1',
     view,false,'relay',true,true,true,true,true,true);
    assert.notEqual(unionHold.glassDigest,clearanceHold.glassDigest,
     view.name+' V0.8A raised RGB must differ from old 3-pass');
    assert.notEqual(unionRelay.glassDigest,clearanceRelay.glassDigest,
     view.name+' V0.8A grounded RGB must differ from old 3-pass');
    // Only a diagnostic label/telemetry can differ here: V0.7Z
   // intentionally does not mutate the rendered snake surface at all.
   assert.ok(!clearanceHold.png.equals(slenderHold.png));
   assert.ok(!clearanceRelay.png.equals(slenderRelay.png));
   assert.notEqual(slenderHold.glassDigest,followHold.glassDigest,
    view.name+' V0.7Y raised REAL terrarium canvas pixels must change');
   assert.notEqual(slenderRelay.glassDigest,followRelay.glassDigest,
    view.name+' V0.7Y ground REAL terrarium canvas pixels must change');
   assert.ok(!slenderHold.png.equals(followHold.png));
   assert.ok(!slenderRelay.png.equals(followRelay.png));
   assert.ok(!followHold.png.equals(sculptHold.png),
    view.name+' 13-joint 3D neck tangent should change actual canvas artwork');
   assert.ok(!followRelay.png.equals(sculptRelay.png),
    view.name+' 24-joint 3D neck turn should change actual canvas artwork');
   assert.ok(!sculptHold.png.equals(ghostHold.png),
    view.name+' new source-matched 3D head sculpt must alter real raised image');
   assert.ok(!sculptRelay.png.equals(ghostRelay.png),
    view.name+' candidate head and neck must alter real 24-joint glide image');
   assert.ok(!ghostHold.png.equals(probe.png),
    view.name+' 13-joint V0.7V U bend must change real Chrome pixels');
   assert.ok(!ghostRelay.png.equals(relay.png),
    view.name+' 24-joint ghost shape must change real Chrome pixels');
   assert.ok(!relay.png.equals(temporal.png),
    view.name+' V0.7U source-safe shallow turn should actually alter the real 3D body raster');
   assert.ok(temporal.state.temporalHeadTravel<
    ground.state.headTravel,
    view.name+' V0.7T ramp should avoid initial full-speed lateral slide');
   assert.ok(!temporal.png.equals(ground.png),
    view.name+' eased head-first ground image must differ from V0.7S abrupt movement');
   assert.ok(!ground.png.equals(plain.png)&&!ground.png.equals(probe.png),
    view.name+' valid ground handoff must be a distinct real Chrome image');
   assert.ok(!probe.png.equals(plain.png),
    view.name+' near-wall raised transparent pose must change real raster');
   assert.equal(lowered.state.probeRestored,'true');
   assert.ok(!plain.png.equals(terrain.png),
    view.name+' default and terrain captures must not be byte-identical');
   const folder=process.env.OHM_V07G_CAPTURE_DIR?
    path.resolve(root,process.env.OHM_V07G_CAPTURE_DIR):null;
   if(folder){
    assert.ok(folder.startsWith(root+path.sep),
     'internal artifact path must be inside the private CI checkout');
    mkdirSync(folder,{recursive:true});
    writeFileSync(path.join(folder,view.name+'.png'),plain.png);
    writeFileSync(path.join(folder,view.name+'_terrain_debug.png'),
     terrain.png);
    writeFileSync(path.join(folder,view.name+'_wall_probe_hold.png'),
     probe.png);
    writeFileSync(path.join(folder,view.name+'_wall_to_ground_handoff.png'),
     ground.png);
    writeFileSync(path.join(folder,view.name+'_head_led_ground_departure.png'),
     temporal.png);
    writeFileSync(path.join(folder,view.name+'_ground_curvature_relay.png'),
     relay.png);
    writeFileSync(path.join(folder,view.name+'_true_head_ghost_wall_hold.png'),
     ghostHold.png);
    writeFileSync(path.join(folder,view.name+'_true_head_ghost_bend_relay.png'),
     ghostRelay.png);
    writeFileSync(path.join(folder,view.name+'_candidate_head_sculpt_wall_hold.png'),
     sculptHold.png);
    writeFileSync(path.join(folder,view.name+'_candidate_head_sculpt_bend_relay.png'),
     sculptRelay.png);
    writeFileSync(path.join(folder,view.name+'_two_bone_neck_wall_hold.png'),
     followHold.png);
    writeFileSync(path.join(folder,view.name+'_two_bone_neck_bend_relay.png'),
     followRelay.png);
    writeFileSync(path.join(folder,view.name+'_slender_body_wall_hold.png'),
     slenderHold.png);
    writeFileSync(path.join(folder,view.name+'_slender_body_ground_turn.png'),
     slenderRelay.png);
    writeFileSync(path.join(folder,view.name+'_v07z_3d_clearance_wall_hold.png'),
     clearanceHold.png);
    writeFileSync(path.join(folder,view.name+'_v07z_3d_clearance_ground_turn.png'),
     clearanceRelay.png);
    writeFileSync(path.join(folder,view.name+'_v08a_unified_wall_hold.png'),unionHold.png);
    writeFileSync(path.join(folder,view.name+'_v08a_unified_ground_turn.png'),unionRelay.png);
   }
   console.log('PASS V0.8A Chrome '+view.name+
     ': one-pass source-safe opacity and distinct RGB in both poses');
   console.log('PASS V0.7N Chrome CDP '+view.name+': 180-frame real canvas, '+
    view.w+'x'+view.h+', source-backed moss/ferns/rocks, normal '+
    plain.png.length+' bytes, terrain '+terrain.png.length+
    ' bytes, '+terrain.state.changedPixels+
    ' changed CANVAS pixels; snake still transparent and caves blocked');
   console.log('PASS V0.7P Chrome '+view.name+
    ': held raised source-safe transparent body '+probe.png.length+
    ' PNG bytes; 40-step hold, 180-step rest, rear ground anchors immovable');
   console.log('PASS V0.7Z Chrome '+view.name+
    ': real 3D candidate gap '+clearanceRelay.state.clearanceMin.toFixed(4)+
    ', nonlocal pairs '+clearanceRelay.state.clearancePairs+
    ', overlaps 0, ring flips 0, display unchanged except diagnostic overlay');
   console.log('PASS V0.7Y Chrome '+view.name+
    ': '+(100*(1-slenderHold.state.slimMid)).toFixed(1)+
    '% smaller visual trunk radius; 13/24-joint body+neck 3D candidates, '+
    slenderHold.state.slimBodySamples+' / '+
    slenderRelay.state.slimBodySamples+' body samples, '+
    'real glass-only RGB digest changed in both poses, zero skin');
   console.log('PASS V0.7X Chrome '+view.name+
    ': 13/24-joint true 3D neck follower, '+
    followHold.state.neckSamples+' vertex/face/edge samples, '+
    followHold.state.neckShift.toFixed(6)+' max XYZ world shift, '+
    'same original head and socket, changed real canvas pixels');
   console.log('PASS V0.7W Chrome '+view.name+
    ': candidate head and display mesh share exact 3D vertices; 10 head rings, '+
    sculptHold.state.sculptNeckRings+' neck rings, '+
    sculptHold.state.sculptChecks+' collision samples, 13/24-joint images differ');
   console.log('PASS V0.7V Chrome '+view.name+
    ': true collider source head, '+ghostHold.state.ghostCollar+
    ' 3D collar rings, bounded ghost offset '+
    ghostHold.state.ghostShift.toFixed(5)+
    ' world units; 13/24-joint real raster changed without skin');
   console.log('PASS V0.7U Chrome '+view.name+
    ': '+relay.state.relayTurn.toFixed(3)+' radians shallow turn, '+
    relay.state.relayBend.toFixed(5)+' front curvature change, '+
    relay.state.relayMovingFrames+' frames with moving joints / '+
    relay.state.relayQuietFrames+' frames with quiet joints; latest '+
    relay.state.relayMoving+' moving / '+relay.state.relayQuiet+
    ' quiet proxies, NOT force-derived contact migration');
   console.log('PASS V0.7S/T Chrome '+view.name+
    ': 13→24 fixed-length handoff, '+ground.state.groundFrames+
    ' frames, direct head travel '+ground.state.headTravel.toFixed(3)+
    ', eased head-led travel '+temporal.state.temporalHeadTravel.toFixed(3)+
    ' with '+temporal.state.temporalSupport+' grounded joints');
   done++;
  }
  assert.equal(done,2);
  console.log('PASS V0.7N/P/S/T/U/V/W/X/Y/Z + V0.8A: one Chrome session, 36 real landscape PNGs '+
   '(baseline 6 plus V0.7V/V0.7W/V0.7X/V0.7Y/V0.7Z overlays per viewport), '+
   'real 3D versus camera-only overlap diagnostics without new collision authority or skin');
 }
}finally{
 if(cdp)cdp.close();
 if(chrome&&chrome.exitCode===null){
  chrome.kill('SIGTERM');
  await sleep(400);
  if(chrome.exitCode===null)chrome.kill('SIGKILL');
 }
 await new Promise(resolve=>server.listening?server.close(resolve):resolve());
 rmSync(temp,{recursive:true,force:true});
}
