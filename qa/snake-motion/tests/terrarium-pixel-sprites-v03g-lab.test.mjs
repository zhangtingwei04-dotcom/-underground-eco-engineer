import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('terrarium-pixel-sprites-v03g-lab.html');
const template=read('tools/terrarium-pixel-sprites-v03g-lab.template.html');
assert.match(template,/\/\*__OHM_V03G_CORE_BUNDLE__\*\//);
assert.match(html,/name="viewport"/);
assert.match(html,/safe-area-inset-bottom/);
assert.match(html,/min-height:44px/);
assert.match(html,/id="stage"/);
assert.match(html,/touch-action:none/);
assert.match(html,/pointerdown/);
assert.match(html,/pointerup/);
assert.match(html,/id="ledgerStatus"/);
assert.match(html,/visibilitychange/);
assert.match(html,/moveTerrariumSceneObjectByScreenDeltaV03e/);
assert.match(html,/projectTerrariumSceneForRenderV03e/);
assert.match(html,/buildTerrariumPixelVisualV03f/);
assert.match(html,/buildTerrariumPixelSpritesV03g/);
assert.match(html,/id="zoneDock"/);
assert.match(html,/id="labRoot" data-mode="edit"/);
assert.match(html,/id="observeMode" aria-pressed="false"/);
assert.match(html,/id="editMode" aria-pressed="true"/);
assert.match(html,/id="zoneSummary"/);
assert.match(html,/@media \(min-width:700px\) and \(orientation:landscape\) and \(max-height:540px\)/);
assert.match(html,/#labRoot\[data-mode="observe"\]/);
assert.match(html,/id="zonePick4"/);
assert.match(html,/resolveTerrariumTouchSelectionV03f/);
assert.match(html,/id="detailLow"/);
assert.match(html,/id="touchHint"/);
assert.match(html,/image-rendering:pixelated/);
assert.match(html, /@media \(min-width:700px\) and \(orientation:landscape\)/);
assert.match(html, /grid-template-columns:minmax\(0,1\.45fr\) minmax\(320px,1fr\)/);
assert.match(html, /section:nth-of-type\(1\)\{grid-column:1;grid-row:2 \/ span 2\}/);
assert.doesNotMatch(html,/\/\*__OHM_V03G_CORE_BUNDLE__\*\//);
assert.doesNotMatch(html,/^\s*import\b/m);
assert.doesNotMatch(html,/localStorage|sessionStorage|indexedDB|supabase|fetch\(|XMLHttpRequest|sendBeacon/i);
assert.match(execFileSync(process.execPath,
 ['tools/build-terrarium-pixel-sprites-v03g-lab.mjs','--check'],
 {cwd:new URL('..',import.meta.url),encoding:'utf8',timeout:15000}),
 /PASS V0.3g mobile pixel lab equals nine canonical modules/);
const scripts=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length,1);
const ops=[];
const ctx={};
for(const method of [
 'beginPath','moveTo','lineTo','closePath','fill','stroke',
 'clearRect','fillRect','quadraticCurveTo','arc','fillText'
])ctx[method]=(...args)=>ops.push({method,args});
ctx.createLinearGradient=()=>({addColorStop:()=>{}});
function node(){
 return {
  listeners:{},attributes:{},children:[],textContent:'',style:{},
  addEventListener(k,fn){this.listeners[k]=fn},
  click(){assert.ok(this.listeners.click,'no click handler');this.listeners.click()},
  setAttribute(k,v){this.attributes[k]=String(v)},
  getAttribute(k){return this.attributes[k]??null},
  replaceChildren(...items){this.children=[...items]},
  appendChild(item){this.children.push(item)},
  getBoundingClientRect(){return {left:0,top:0,width:960,height:600}}
 };
}
const elements=new Map();
const by=id=>{
 if(!elements.has(id))elements.set(id,node());
 return elements.get(id);
};
const stage=by('stage');
stage.getContext=k=>{assert.equal(k,'2d');return ctx};
stage.setPointerCapture=()=>{};
const docEvents={},timers=new Map();let counter=0;
const document={
 getElementById:by,hidden:false,
 createElement:()=>node(),
 addEventListener(k,fn){docEvents[k]=fn}
};
runInNewContext(scripts[0][1],{
 document,console,
 setInterval:(fn,ms)=>{assert.equal(ms,900);const id=++counter;timers.set(id,fn);return id},
 clearInterval:id=>timers.delete(id)
},{timeout:20000});
const click=(where,label)=>{
 const b=by(where).children.find(x=>x.textContent.includes(label));
 assert.ok(b,'missing '+where+' '+label);b.click();
};
const clock=()=>by('clock').textContent;
const pos=()=>by('position').textContent;
const number=x=>Number(x.replaceAll(',',''));
const org=()=>number(by('organicCount').textContent);
const safe=()=>by('ledgerStatus').textContent.includes('帳目吻合');
assert.equal(clock(),'第 1 日 00:00');
assert.equal(by('oblique').getAttribute('aria-pressed'),'true');
assert.equal(by('detailNormal').getAttribute('aria-pressed'),'true');
assert.equal(by('detailLow').getAttribute('aria-pressed'),'false');
assert.equal(by('zonePick3').getAttribute('aria-pressed'),'true');
assert.equal(by('zoneLight3').textContent,by('actualLight').textContent);
assert.match(by('zoneLight0').textContent,/%$/);
assert.match(html,/id="touchHint"[^>]*>[^<]*重疊/);
assert.equal(by('top').getAttribute('aria-pressed'),'false');
assert.ok(pos().includes('X 570'));
assert.equal(by('objectCount').textContent,'2');
assert.ok(number(by('rawLight').textContent.replace('%',''))>
 number(by('actualLight').textContent.replace('%','')),
 'rock shadows vegetation in default scene');
assert.ok(safe());
assert.ok(ops.filter(x=>x.method==='fillText').length>=5,
 'canvas scene should draw world-dependent plants and labels');
const organicStart=org();
const marksNormal=ops.filter(o=>o.method==='fillRect').length;
ops.length=0;
by('detailLow').click();
const marksLow=ops.filter(o=>o.method==='fillRect').length;
assert.ok(marksLow<marksNormal,
 'low detail must visibly reduce pixel stamps (not biological math)');
assert.equal(by('detailLow').getAttribute('aria-pressed'),'true');
assert.equal(org(),organicStart,'detail switch cannot change ecology');
ops.length=0;
by('detailNormal').click();
assert.ok(ops.filter(o=>o.method==='fillRect').length>marksLow);
assert.equal(by('detailNormal').getAttribute('aria-pressed'),'true');
assert.ok(safe());
const lightAtOblique=by('actualLight').textContent;
by('top').click();
assert.equal(by('top').getAttribute('aria-pressed'),'true');
assert.equal(by('oblique').getAttribute('aria-pressed'),'false');
assert.equal(by('actualLight').textContent,lightAtOblique,
 'switching camera must not change biology');
assert.ok(pos().includes('X 570'));
const down=(x,y,pointerId=1)=>stage.listeners.pointerdown({
 pointerId,clientX:x,clientY:y,preventDefault(){}
});
const up=(x,y,pointerId=1)=>stage.listeners.pointerup({
 pointerId,clientX:x,clientY:y
});
// ECO V0.3h: the separate observation UI must NOT mutate source state.
const beforeObserve={pos:pos(),clock:clock(),org:org(),count:by('objectCount').textContent};
by('observeMode').click();
assert.equal(by('labRoot').getAttribute('data-mode'),'observe');
assert.equal(by('observeMode').getAttribute('aria-pressed'),'true');
assert.equal(by('editMode').getAttribute('aria-pressed'),'false');
click('moveControls','左移');
click('placeControls','放置冠層');
click('eventControls','加入落葉');
click('eventControls','噴霧');
by('step60').click();by('step240').click();by('play').click();by('reset').click();
assert.equal(timers.size,0,'observe mode cannot create a simulation timer');
down(570,300,101);up(660,300,101);
assert.equal(pos(),beforeObserve.pos,'read-only drag cannot move stone');
assert.equal(clock(),beforeObserve.clock,'read-only does not advance time');
assert.equal(org(),beforeObserve.org,'read-only cannot add organic matter');
assert.equal(by('objectCount').textContent,beforeObserve.count);
by('zonePick2').click();
assert.equal(by('zonePick2').getAttribute('aria-pressed'),'true');
assert.match(by('zoneSummary').textContent,/水盆.*有效光.*根部濕潤.*植物覆蓋/);
assert.ok(safe());
by('editMode').click();
assert.equal(by('labRoot').getAttribute('data-mode'),'edit');
assert.equal(by('observeMode').getAttribute('aria-pressed'),'false');
down(570,300,102);up(570,300,102);
assert.ok(pos().includes('X 570'),'edit mode restores object picking');
// Top-view 960x600 with 30-px margin: world roof center 600,200 -> 570,300.
down(570,300);up(660,300);
assert.ok(pos().includes('X 670'),
 'dragging roof 90 canvas pixels should move world X by exactly 100');
assert.ok(safe());
assert.equal(org(),organicStart);
click('moveControls','左移');
assert.ok(pos().includes('X 620'));
click('moveControls','提高');
assert.ok(pos().includes('高 600'));
click('moveControls','降低');
assert.ok(pos().includes('高 500'));
by('oblique').click();
assert.equal(by('top').getAttribute('aria-pressed'),'false');
assert.ok(pos().includes('X 620'));
const visualBefore=by('actualLight').textContent;
by('top').click();
assert.equal(by('actualLight').textContent,visualBefore,
 'camera change cannot alter light after a drag');
click('eventControls','選取燈具');
assert.ok(pos().includes('燈具世界座標 X 500'));
const pointer2=2;
// Top-down fixture world (500,200) => (480,300)
down(480,300,pointer2);up(570,300,pointer2);
assert.ok(pos().includes('燈具世界座標 X 600'));
assert.equal(org(),organicStart);
assert.ok(safe());
// Empty zone 4 at top center world(900,350) -> screen(840,502.5)
down(840,502.5,3);up(840,502.5,3);
assert.ok(by('selectionHint').textContent.includes('土坡'));
click('placeControls','放置冠層');
assert.equal(by('objectCount').textContent,'3');
assert.ok(by('selectedTitle').textContent.includes('placed_4'));
assert.ok(safe());
click('eventControls','加入落葉');
assert.equal(org(),organicStart+500);
assert.equal(by('eventCount').textContent,'1');
assert.ok(safe());
click('eventControls','噴霧');
assert.equal(org(),organicStart+500,'soil water does not create leaf mass');
assert.ok(safe());
const lastClock=clock();
by('step60').click();
assert.notEqual(clock(),lastClock);
assert.equal(clock(),'第 1 日 01:00');
by('step240').click();
assert.equal(clock(),'第 1 日 05:00');
assert.ok(safe());
by('reset').click();
assert.equal(clock(),'第 1 日 00:00');
assert.equal(by('eventCount').textContent,'0');
assert.equal(by('objectCount').textContent,'2');
assert.ok(pos().includes('X 570'));
assert.equal(org(),organicStart);
// Two independently-owned objects can overlap in one scene region.
click('placeControls','放置冠層');
assert.equal(by('objectCount').textContent,'3');
click('moveControls','左移');
assert.ok(pos().includes('X 605'));
const overlapX=584,overlapY=300;
down(overlapX,overlapY,21);up(overlapX,overlapY,21);
const chosenFirst=by('selectedTitle').textContent;
down(overlapX,overlapY,22);up(overlapX,overlapY,22);
const chosenSecond=by('selectedTitle').textContent;
assert.notEqual(chosenFirst,chosenSecond,
 'repeated tap should cycle overlapped rock and canopy');
assert.ok([chosenFirst,chosenSecond].some(x=>x.includes('stone_01')));
assert.ok([chosenFirst,chosenSecond].some(x=>x.includes('placed_3')));
assert.ok(safe());
by('reset').click();
// CSS-pixel finger movement below 12px must NOT trigger world drag.
down(570,300,23);up(579,304,23);
assert.ok(pos().includes('X 570'),'tiny thumb wiggle must not move rock');
// On an actual phone the canvas is scaled down; picking still maps
// CSS finger coordinates to canonical Canvas geometry.
stage.getBoundingClientRect=()=>({left:0,top:0,width:390,height:244});
down(570*390/960,300*244/600,24);
up(570*390/960,300*244/600,24);
assert.ok(pos().includes('X 570'));
stage.getBoundingClientRect=()=>({left:0,top:0,width:960,height:600});
assert.ok(safe());
by('play').click();
assert.equal(timers.size,1);
assert.equal(by('play').getAttribute('aria-pressed'),'true');
for(const fn of timers.values())fn();
assert.equal(clock(),'第 1 日 01:00');
document.hidden=true;
docEvents.visibilitychange();
assert.equal(timers.size,0);
assert.equal(by('play').getAttribute('aria-pressed'),'false');
assert.ok(safe());
// Explicit readable DOM zone dock works even when canvas is visually tiny.
by('zonePick2').click();
assert.equal(by('zonePick2').getAttribute('aria-pressed'),'true');
assert.ok(by('selectedTitle').textContent.includes('水盆'));
assert.equal(by('actualLight').textContent,by('zoneLight2').textContent);
by('zonePick4').click();
assert.equal(by('zonePick4').getAttribute('aria-pressed'),'true');
assert.ok(by('selectedTitle').textContent.includes('土坡'));
assert.equal(by('actualLight').textContent,by('zoneLight4').textContent);
assert.ok(safe());
assert.equal(org(),organicStart,'changing visual zone cannot mutate organic mass');
console.log('PASS V0.3g nine-core pixel Canvas mobile UI: view independence, pointer roof and lamp drag, selection, plant light, geometry edits, sourced litter, independent water, fixed clock, hidden-page pause');
