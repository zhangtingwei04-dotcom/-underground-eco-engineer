/**
 * OHM ECO V0.3g: responsive Chromium viewport QA.
 * Checks the actual offline HTML + Canvas, including the readable five-zone
 * DOM controls, at landscape and phone-sized desktop Chromium viewports.
 * This is NOT Safari, iOS device emulation, touch-hardware or real-world care.
 * No network services or browser packages; temporary screenshots deleted.
 */
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const uri=pathToFileURL(path.join(root,'terrarium-pixel-sprites-v03g-lab.html')).href;
let browser=null;
for(const bin of [
 process.env.OHM_CHROME_BIN,'google-chrome','google-chrome-stable',
 'chromium','chromium-browser'
].filter(Boolean)){
 const v=spawnSync(bin,['--version'],{encoding:'utf8',timeout:4000});
 if(v.status===0){browser=bin;break;}
}
const html=readFileSync(new URL('../terrarium-pixel-sprites-v03g-lab.html',import.meta.url),'utf8');
assert.match(html,/<nav class="zone-dock"[^>]+id="zoneDock"/);
assert.match(html,/@media\(max-width:430px\)/);
assert.match(html,/id="observeMode" aria-pressed="false"/);
assert.match(html,/id="editMode" aria-pressed="true"/);
assert.match(html,/id="zoneSummary"/);
assert.match(html, /@media \(min-width:700px\) and \(orientation:landscape\)/);
assert.match(html,/aria-label="可直接點選的五個生態區"/);
assert.match(html,/buildTerrariumPixelSpritesV03g/);
assert.match(html,/const wideCanvas=stage\.getBoundingClientRect\(\)\.width>=620/);
if(!browser){
 console.log('SKIP V0.3g real responsive Chromium: no headless Chrome present. HTML static mobile checks passed; iPhone Safari manual QA REQUIRED');
}else{
 const temp=mkdtempSync(path.join(os.tmpdir(),'ohm-v03g-responsive-'));
 const common=[
  '--headless','--no-sandbox','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run',
  '--hide-scrollbars','--force-device-scale-factor=1',
  '--virtual-time-budget=2500',
  '--user-data-dir='+path.join(temp,'user')
 ];
 function chrome(args, target=uri){
  const result=spawnSync(browser,[...common,...args,target],{
   cwd:root,encoding:'utf8',timeout:35000,maxBuffer:6*1024*1024
  });
  if(result.status!==0)
   throw Error('Chromium launch failed: '+String(result.stderr).slice(-1400));
  return result.stdout;
 }
 const views=[
  {name:'wide_landscape',width:1280,height:1024},
  {name:'narrow_portrait',width:430,height:932},
  {name:'short_landscape',width:932,height:480}
 ];
 try{
  for(const view of views){
   const flags=['--window-size='+view.width+','+view.height];
   const dom=chrome([...flags,'--dump-dom']);
   assert.match(dom,/id="selectedTitle">[^<]*stone_01/,
     'JS must initialize scene object for '+view.name);
   assert.match(dom,/id="zonePick3"[^>]*aria-pressed="true"/,
     'zone 3 must be selected on boot '+view.name);
   for(let i=0;i<5;i++){
    assert.match(dom,new RegExp('id="zoneLight'+i+'">[^<]*%'),
      'all five ecological light values must render '+view.name);
   }
   assert.match(dom,/id="ledgerStatus"[^>]*>[^<]*帳目吻合/,
     'game resources must balance '+view.name);
   const filename=path.join(temp,view.name+'.png');
   chrome([...flags,'--screenshot='+filename]);
   assert.ok(existsSync(filename),'screenshot missing '+view.name);
   const bytes=readFileSync(filename);
   assert.equal(bytes.subarray(0,8).toString('hex'),
    '89504e470d0a1a0a');
   assert.ok(bytes.length>9000,'unexpected empty screenshot '+view.name);
   const w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20);
   assert.ok(w>=view.width&&h>=view.height,
    'viewport screenshot smaller than requested '+view.name);
   console.log('PASS V0.3g Chromium '+view.name+
    ': core initialization, five readable zone outputs, balanced water/organic, PNG '+w+'x'+h+' ('+bytes.length+' bytes)');
   if(process.env.OHM_EMIT_V03G_CAPTURE==='1'&&view.name==='narrow_portrait'){
    console.log('V03G_MOBILE_SCREEN_BASE64_BEGIN');
    console.log(bytes.toString('base64'));
    console.log('V03G_MOBILE_SCREEN_BASE64_END');
   }
  }
  // Run a second real Chromium instance at a short, phone-like landscape
  // viewport. It actually clicks observe/edit and checks computed CSS.
  // This is not Safari, a touch device, or a player save integration.
  const probeJS=`<script type="module">
  const by=id=>document.getElementById(id);
  const before=[by('clock').textContent,by('organicCount').textContent,by('objectCount').textContent];
  by('observeMode').click();
  const observe=by('labRoot').getAttribute('data-mode')==='observe';
  const hidden=getComputedStyle(document.querySelector('[aria-label="物件與植物資料"]')).display==='none';
  const dock=by('zoneDock').getBoundingClientRect();
  const dockVisible=dock.top<innerHeight-20&&dock.left>=0&&dock.right<=innerWidth+1;
  by('zonePick2').click();
  const readable=by('zoneSummary').textContent.includes('水盆')&&by('zoneSummary').textContent.includes('有效光');
  const stable=before.join('|')===[by('clock').textContent,by('organicCount').textContent,by('objectCount').textContent].join('|');
  by('editMode').click();
  const edit=by('labRoot').getAttribute('data-mode')==='edit' &&
    getComputedStyle(document.querySelector('[aria-label="物件與植物資料"]')).display!=='none';
  document.body.setAttribute('data-qa-v03h',observe&&hidden&&dockVisible&&readable&&stable&&edit?'pass':'fail');
  document.body.setAttribute('data-qa-v03h-checks',
    JSON.stringify({observe,hidden,dockVisible,readable,stable,edit,dockTop:Math.round(dock.top),viewportHeight:innerHeight}));
  <\/script>`;
  const probeFile=path.join(temp,'v03h-landscape-qa.html');
  writeFileSync(probeFile,html.replace('</body>',probeJS+'</body>'),'utf8');
  // Chrome 157 headless Linux reserves ~200 px of --window-size height.
  // Request 680 so the actual document viewport is 932x480, not 932x280.
  const probed=chrome(['--window-size=932,680','--dump-dom'],pathToFileURL(probeFile).href);
  assert.match(probed,/<body[^>]*data-qa-v03h="pass"/,'short landscape interactive observe/edit and visible dock');
  console.log('PASS V0.3h real Chromium short landscape: readable zone dock, read-only ecology, mode switches and CSS visibility.');
 }finally{rmSync(temp,{recursive:true,force:true});}
}
