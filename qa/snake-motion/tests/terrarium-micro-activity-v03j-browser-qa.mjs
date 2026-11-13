/**
 * ECO V0.3j real Chromium Canvas/DOM smoke, using local module files.
 * No network, accounts, saves, or certified Safari device QA.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync,writeFileSync,
 unlinkSync,rmSync} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import os from 'node:os';

const home=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const filepath=path.join(home,'visual/terrarium-micro-activity-v03j.html');
const html=readFileSync(filepath,'utf8');
const script=readFileSync(path.join(home,
 'visual/terrarium-micro-activity-v03j.mjs'),'utf8');
for(const pattern of [
 /id="world"/,/id="zones"/,/id="step"/,/id="disturb"/,
 /id="reset"/,/id="pause"/,
 /<script type="module" src=".\/terrarium-micro-activity-v03j.mjs"/
])assert.match(html,pattern);
assert.match(script,/previewTerrariumMicroActivityV03j/);
assert.match(script,/sampleTerrariumMicroActivityFrameV03j/);
const executableScript=script.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\n]*/g,'');
assert.doesNotMatch(executableScript,/\b(localStorage|sessionStorage|XMLHttpRequest)\b|\bfetch\s*\(/);
let binary=null;
for(const bin of [
 process.env.OHM_CHROME_BIN,'google-chrome','google-chrome-stable',
 'chromium','chromium-browser'
].filter(Boolean)){
 const r=spawnSync(bin,['--version'],{
  encoding:'utf8',timeout:4000});
 if(r.status===0){binary=bin;break}
}
if(!binary){
 if(process.env.OHM_REQUIRE_CHROME==='1')
  throw new Error('ECO V0.3j requires Chromium for visual QA');
 console.log('SKIP ECO V0.3j Chromium: binary unavailable');
}else{
 const tmp=mkdtempSync(path.join(os.tmpdir(),'ohm-v03j-chrome-'));
 const probe=path.join(home,'visual','.qa-v03j-probe-'+process.pid+'.html');
 const flags=[
  '--headless','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run',
  '--allow-file-access-from-files',
  '--force-device-scale-factor=1',
  '--virtual-time-budget=2700',
  '--user-data-dir='+path.join(tmp,'chrome-user')
 ];
 const run=(argv,uri)=>{
  const r=spawnSync(binary,[...flags,...argv,uri],{
   cwd:home,encoding:'utf8',timeout:40000,
   maxBuffer:10*1024*1024});
  if(r.status!==0)throw new Error(
   'Chrome headless failed '+String(r.stderr).slice(-1700));
  return r.stdout;
 };
 const views=[
  {name:'wide_landscape',width:1280,height:800},
  {name:'short_landscape',width:932,height:680},
  {name:'phone_portrait',width:430,height:930}
 ];
 try{
  for(const view of views){
   const url=pathToFileURL(filepath).href;
   const args=['--window-size='+view.width+','+view.height];
   const dom=run([...args,'--dump-dom'],url);
   assert.match(dom,/id="world"/,'Canvas missing '+view.name);
   assert.match(dom,/id="summary"/,'Summary missing '+view.name);
   assert.match(dom,/class="zone"/,
    'browser ESM failed to render zones '+view.name);
   assert.match(dom,/菌絲|微生物/,
    'microscopic guild labels missing '+view.name);
   assert.match(dom,/五區有機物/,view.name);
   const png=path.join(tmp,view.name+'.png');
   run([...args,'--screenshot='+png],url);
   assert.ok(existsSync(png));
   const bytes=readFileSync(png);
   assert.equal(bytes.subarray(0,8).toString('hex'),
    '89504e470d0a1a0a');
   assert.ok(bytes.length>10000,
    'screenshot too small or blank '+view.name);
   assert.ok(bytes.readUInt32BE(16)>=view.width);
   assert.ok(bytes.readUInt32BE(20)>=view.height);
   console.log('PASS ECO V0.3j real Chrome '+view.name+
    ': five zone DOM + Canvas screenshot '+bytes.length+' bytes');
  }
  const injected=[
   '<script type="module">',
   'const q=()=>window.__ohmEcoV03jQA?.();',
   'const before=q();',
   "const zones=document.querySelectorAll('article.zone').length;",
   "const frame=document.getElementById('world');",
   'const width=frame.getBoundingClientRect().width;',
   "const wrapper=document.querySelector('.canvas-wrap');",
   "document.getElementById('step').click();",
   'const advanced=q();',
   "document.getElementById('disturb').click();",
   'const disturbed=q();',
   "document.getElementById('pause').click();",
   "const pause=document.getElementById('pause');",
   "document.getElementById('reset').click();",
   'const reset=q();',
   'const assertions={',
   'initialized:before?.previewOK===true&&before.zoneCount===5,',
   'fiveZones:zones===5,',
   'locallyAdvancedBy60:advanced?.sourceMinute===60,',
   'organicConserved:advanced?.organicTotal===before?.organicTotal,',
   'disturbanceIsVisualOnly:disturbed?.disturbance===true &&',
   '  disturbed.organicTotal===advanced.organicTotal,',
   "pauseToggled:pause.getAttribute('aria-pressed')==='true',",
   'localReset:reset?.sourceMinute===0&&reset.disturbance===false,',
   'canvasHasWidth:width>0,',
   'canvasHasScrollableParent:wrapper.scrollWidth>=wrapper.clientWidth,',
   'noSave:reset?.fullGameSaveWritten===false',
   '};',
   "document.body.setAttribute('data-qa-v03j',",
   "  Object.values(assertions).every(Boolean)?'pass':'fail');",
   "document.body.setAttribute('data-qa-details',",
   '  JSON.stringify(assertions));',
   '</script>'
  ].join('\n');
  writeFileSync(probe,html.replace('</body>',injected+'</body>'),'utf8');
  const tested=run(['--window-size=932,680','--dump-dom'],
   pathToFileURL(probe).href);
  assert.match(tested,/<body[^>]*data-qa-v03j="pass"/,
   'real Chrome controls must step LOCAL scene, keep ledger, reset');
  console.log('PASS ECO V0.3j real Chrome controls: local hour step, disturbance, pause, reset, no-save');
 }finally{
  try{unlinkSync(probe)}catch{}
  rmSync(tmp,{recursive:true,force:true});
 }
}