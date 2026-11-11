import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Real standalone V0.3C public-page JS, not a rewritten imitation.
const html=readFileSync(new URL('../terrarium-hognose-v03c-review.html',import.meta.url),'utf8');
assert.match(html,/西部豬鼻蛇｜V0\.3C 視覺修正實驗/);
assert.match(html,/固定視角的藝術用放大示意/);
assert.match(html,/drawBodyBand/);
assert.doesNotMatch(html,/supabase|localStorage|fetch\(|src\/ohm-core/i);
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'self-contained inline JS is required');
const marker="  resetAll();draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(script.includes(marker));
const injected=script.replace(marker,
  "  resetAll();globalThis.__test={draw,currentBody,clearance,softenBodyForDisplay,advance,navigate,"+
  "HOGNOSE_HEAD_PROFILE,getState:()=>({status,goal,pixelStyle,individualIndex,detailHigh,running})};"+
  "draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);");
const noop=()=>{},draws={scene:0,portrait:0,off:0};
function makeContext(id){
  return new Proxy({
    createLinearGradient:()=>({addColorStop:noop}),
    createRadialGradient:()=>({addColorStop:noop}),
    drawImage(){draws[id]++}
  },{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
}
const ctx=makeContext('scene'),headCtx=makeContext('portrait'),other=makeContext('off');
const map=new Map();
const main={width:960,height:540,getContext:()=>ctx,listeners:{},
  addEventListener(n,fn){this.listeners[n]=fn},
  getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
const portrait={width:544,height:288,getContext:()=>headCtx};
const doc={createElement(tag){
    assert.equal(tag,'canvas');return {width:480,height:270,getContext:()=>other};
  },getElementById(id){
    if(id==='scene')return main;if(id==='head-detail')return portrait;
    if(!map.has(id))map.set(id,{textContent:'',value:0,style:{},
      classList:{add:noop},listeners:{},setAttribute:noop,
      addEventListener(n,fn){this.listeners[n]=fn}});
    return map.get(id);
  }
};
const env={document:doc,requestAnimationFrame:noop};
runInNewContext(injected,env,{timeout:8000});
const p=env.__test;
assert.ok(draws.scene>0);
assert.ok(draws.portrait>0,'head viewport must draw independently');
assert.ok(/drawImage\(portraitPixels/.test(script),'specimen should use clean portrait buffer');
assert.ok(!/drawImage\(canvas,x,y,sourceW/.test(script),
  'head portrait must not crop live game props or goal marker');
assert.match(script,/if\(debug\)\{\s*ctx\.save\(\);ctx\.strokeStyle='#f0d69b'/,
  'goal halo must only display during debug');
const h=p.HOGNOSE_HEAD_PROFILE;
assert.ok(h.maxForwardRadius<19.5);
assert.equal(h.snoutBase.y-h.snoutTip.y,1);
assert.ok(h.snoutTip.x>h.nostril.x);
const initial=p.currentBody();
assert.ok(initial.at(-1).w<.9,'tail must taper to a fine point');
assert.ok(initial[0].w<initial[15].w,'neck should be narrower than trunk');
assert.ok(initial[55].w>initial[75].w,'body taper should be continuous through rear');

const stats={minimum:Infinity,displayMinimum:Infinity,maxStep:0,rejected:0,accepted:0,frames:0};
function sample(n){
 let old=p.currentBody()[0];
 for(let t=0;t<n;t++){
   p.advance(.05);
   const body=p.currentBody(),smooth=p.softenBodyForDisplay(body);
   const rawGap=p.clearance(body),displayGap=p.clearance(smooth);
   stats.minimum=Math.min(stats.minimum,rawGap);
   stats.displayMinimum=Math.min(stats.displayMinimum,displayGap);
   if(smooth===body)stats.rejected++;else stats.accepted++;
   const head=body[0],jump=Math.hypot(head.x-old.x,head.y-old.y);
   stats.maxStep=Math.max(stats.maxStep,jump);old=head;
   assert.ok(jump<5,'route cannot jump after a destination change');
   assert.ok(rawGap>=1&&displayGap>=1,
     'real and visual body must both be safely separated from obstacles');
   assert.ok(p.getState().running,'no silent collision stop is permitted');
   stats.frames++;
 }
}
sample(1100); // user-video repeat + longer autonomous wander
for(const goal of [
 {x:125,y:453},{x:575,y:483},{x:745,y:414},
 {x:838,y:447},{x:268,y:423},{x:484,y:339}
]){
 assert.equal(p.navigate(goal,true),true,'mid-route destination remains available');
 sample(380);
}
assert.ok(stats.accepted>0);
assert.ok(stats.minimum>1&&stats.displayMinimum>1);
assert.ok(stats.maxStep<5);
map.get('style').listeners.click();
assert.equal(p.getState().pixelStyle,false);
map.get('style').listeners.click();
assert.equal(p.getState().pixelStyle,true);
assert.match(map.get('style').textContent,/V0\.3C 修正版/);
map.get('detail').listeners.click();
assert.equal(p.getState().detailHigh,false);
map.get('detail').listeners.click();
assert.equal(p.getState().detailHigh,true);
map.get('individual').listeners.click();
assert.match(map.get('individual').textContent,/淡沙參考/);
map.get('hide').listeners.click();
assert.equal(p.getState().goal.x,125);
main.listeners.pointerdown({clientX:811,clientY:416});
assert.equal(p.getState().goal.x,811);
map.get('collision').listeners.click();
assert.match(map.get('collision').textContent,/開/);
map.get('play').listeners.click();assert.equal(p.getState().running,false);
map.get('play').listeners.click();assert.equal(p.getState().running,true);
map.get('reset').listeners.click();assert.equal(p.getState().goal.x,811);
console.log('PASS V0.3C: '+stats.frames+' movement frames, 6 replans, stable head inspection, tapered tail, collision-safe rendered curve, iPhone controls, minimum='+stats.displayMinimum.toFixed(2)+'px');
