import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../terrarium-hognose-v03b.html',import.meta.url),'utf8');
assert.match(html,/西部豬鼻蛇｜外觀重製 V0\.3B/);
assert.match(html,/C 混合版.*小幅上翹鼻端/);
assert.doesNotMatch(html,/supabase|localStorage|fetch\(|src\/ohm-core/i);
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(js,'standalone HTML inline JS must be available');
const init="  resetAll();draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(js.includes(init));
const instrumented=js.replace(init,
  "  resetAll();globalThis.__probe={advance,draw,currentBody,clearance,navigate,renderPixelSnake,"+
  "HOGNOSE_HEAD_PROFILE,hognoseRecipes,hognosePaint,patternAt,drawHeadCloseup,"+
  "getState:()=>({pixelStyle,individualIndex,detailHigh,animationClock,goal,status,running})};"+
  "draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);");

const noop=()=>{};
const draws={main:0,zoom:0,offscreen:0};
function fakeCtx(type){
  return new Proxy({
    createLinearGradient:()=>({addColorStop:noop}),
    createRadialGradient:()=>({addColorStop:noop}),
    drawImage(){draws[type]++}
  },{get:(obj,k)=>k in obj?obj[k]:noop,
     set:(obj,k,v)=>(obj[k]=v,true)});
}
const ctx=fakeCtx('main'),zoomCtx=fakeCtx('zoom'),off=fakeCtx('offscreen');
const controls=new Map();
const main={width:960,height:540,getContext:()=>ctx,listeners:{},
  addEventListener(n,fn){this.listeners[n]=fn},
  getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
const portrait={width:544,height:288,getContext:()=>zoomCtx};
function get(id){
  if(id==='scene')return main;
  if(id==='head-detail')return portrait;
  if(!controls.has(id))controls.set(id,{textContent:'',style:{},value:0,
    classList:{add:noop},listeners:{},setAttribute:noop,
    addEventListener(n,fn){this.listeners[n]=fn}});
  return controls.get(id);
}
const scope={document:{
  getElementById:get,
  createElement(tag){assert.equal(tag,'canvas');return {width:480,height:270,getContext:()=>off}}
},requestAnimationFrame:noop};
runInNewContext(instrumented,scope,{timeout:6000});
const p=scope.__probe;
assert.ok(p,'test hook should expose page logic');

const h=p.HOGNOSE_HEAD_PROFILE,points=h.outline;
assert.equal(points.length,14);
assert.ok(Object.isFrozen(h));
assert.ok(h.maxForwardRadius<19.5,'new muzzle must remain inside unchanged navigation clearance');
const upturn=h.snoutBase.y-h.snoutTip.y;
assert.ok(upturn>=0.7&&upturn<=3,'approved nose is mildly, not extremely, upturned');
assert.ok(h.snoutTip.x>h.nostril.x,'tip must be in front of nostril');
assert.ok(h.nearEye.x<h.nostril.x,'nostril remains ahead of the eye');
assert.ok(points.every(([x,y])=>Number.isFinite(x)&&Number.isFinite(y)));
assert.equal(p.hognoseRecipes.length,3);
assert.equal(p.hognosePaint.length,3);
assert.ok(p.hognoseRecipes.every(x=>
  x.patches.length===18 && x.speckles.length===54 && x.grains.length===128));
assert.notEqual(JSON.stringify(p.hognoseRecipes[0]),JSON.stringify(p.hognoseRecipes[1]));
const before=JSON.stringify(p.hognoseRecipes);
const first=p.patternAt(p.currentBody(),.33,.5);
assert.ok(Number.isFinite(first.x)&&Number.isFinite(first.y));
assert.ok(draws.main>0,'real scene draws a pixel body');
assert.ok(draws.zoom>0,'dynamic head closeup is visibly painted');

let minimum=Infinity,maximumStep=0,old=p.currentBody()[0];
for(let t=0;t<1100;t++){
  p.advance(.05);
  const next=p.currentBody()[0];
  maximumStep=Math.max(maximumStep,Math.hypot(next.x-old.x,next.y-old.y));old=next;
  if(t%11===0){
    const c=p.clearance(p.currentBody());
    minimum=Math.min(minimum,c);
    assert.ok(c>=1,'geometry overlap at frame '+t+': '+c);
  }
  assert.equal(p.getState().running,true,'navigation safety must remain intact');
}
assert.ok(maximumStep<5);
assert.equal(JSON.stringify(p.hognoseRecipes),before,'UV paint recipes cannot shuffle during movement');

const targets=[
  {x:125,y:453},{x:575,y:483},{x:745,y:414},
  {x:838,y:447},{x:268,y:423},{x:484,y:339}
];
for(const target of targets){
  assert.equal(p.navigate(target,true),true,'route must exist for requested point');
  let previous=p.currentBody()[0];
  for(let i=0;i<380;i++){
    p.advance(.05);
    if(i%17===0)assert.ok(p.clearance(p.currentBody())>=1);
    const next=p.currentBody()[0];
    assert.ok(Math.hypot(next.x-previous.x,next.y-previous.y)<5,'replan must not teleport the head');
    previous=next;
    assert.ok(p.getState().running,'the new nose cannot force an arbitrary collision stop');
  }
}
const oldMain=draws.main,oldZoom=draws.zoom;
p.draw();
assert.ok(draws.main>oldMain&&draws.zoom>oldZoom,'both main scene and zoom must rerender');
get('style').listeners.click();
assert.equal(p.getState().pixelStyle,false);
assert.match(get('style').textContent,/舊版 V0.3/);
get('style').listeners.click();
assert.equal(p.getState().pixelStyle,true);
get('detail').listeners.click();
assert.equal(p.getState().detailHigh,false);
assert.match(get('detail').textContent,/簡化/);
assert.match(get('patternCount').textContent,/112 個花紋標記/);
get('detail').listeners.click();
assert.equal(p.getState().detailHigh,true);
assert.match(get('patternCount').textContent,/200 個花紋標記/);
get('individual').listeners.click();
assert.equal(p.getState().individualIndex,1);
assert.match(get('individual').textContent,/淡沙參考/);
get('individual').listeners.click();
assert.match(get('individual').textContent,/棕斑參考/);
get('individual').listeners.click();
assert.match(get('individual').textContent,/橘白參考/);
get('hide').listeners.click();
assert.deepEqual([p.getState().goal.x,p.getState().goal.y],[125,453]);
main.listeners.pointerdown({clientX:820,clientY:406});
assert.deepEqual([p.getState().goal.x,p.getState().goal.y],[820,406]);
get('play').listeners.click();assert.equal(p.getState().running,false);
get('play').listeners.click();assert.equal(p.getState().running,true);
get('reset').listeners.click();assert.equal(p.getState().goal.x,811);
assert.equal(JSON.stringify(p.hognoseRecipes),before);
console.log('PASS V0.3B H. nasicus art test: safe mild nose, stable UV scales, 3 palettes, 1100-frame route, 6 replans, live head zoom and iPhone controls; min='+minimum.toFixed(2)+'px');
