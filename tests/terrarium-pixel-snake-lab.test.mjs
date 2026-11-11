import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Execute the actual public pixel preview JS in a Canvas/DOM test harness.
// No replicated animation algorithm, so regressions reflect what iPhone loads.
const html=readFileSync(new URL('../terrarium-pixel-snake-lab.html',import.meta.url),'utf8');
assert.match(html,/像素蛇身與花紋 V0\.3/);
assert.doesNotMatch(html,/supabase|localStorage|fetch\(|src\/ohm-core/i);
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source,'HTML must contain one inline script');
const boot="  resetAll();draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(source.includes(boot),'bootstrap needs a regression hook');
const injected=source.replace(boot,
  "  resetAll();globalThis.__probe={advance,navigate,clearance,currentBody,patternAt,patterns:patternLibrary,draw,renderPixelSnake,getState:()=>({pixelStyle,individualIndex,detailHigh,goal,running,status})};draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);");

const noop=()=>{};
const ctx=new Proxy({
  createLinearGradient:()=>({addColorStop:noop}),
  createRadialGradient:()=>({addColorStop:noop})
},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const elements=new Map();
const canvas={width:960,height:540,getContext:()=>ctx,listeners:{},
  addEventListener(name,fn){this.listeners[name]=fn},
  getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
function get(id){
  if(id==='scene')return canvas;
  if(!elements.has(id))elements.set(id,{textContent:'',value:0,style:{},
    classList:{add:noop},listeners:{},setAttribute:noop,
    addEventListener(name,fn){this.listeners[name]=fn}});
  return elements.get(id);
}
const sandbox={document:{getElementById:get,createElement(tag){
  assert.equal(tag,'canvas','only offscreen Canvas creation is supported');
  return {width:320,height:180,getContext:()=>ctx};
}},requestAnimationFrame:noop};
runInNewContext(injected,sandbox,{timeout:4500});
const p=sandbox.__probe;
assert.ok(p && p.getState().pixelStyle);
assert.equal(p.patterns.length,3);
assert.ok(p.patterns.every(v=>v.coarse.length===66&&v.micro.length===156));
assert.notDeepEqual(JSON.stringify(p.patterns[0]),JSON.stringify(p.patterns[1]));
const pose=p.currentBody();
const bind=p.patternAt(pose,.43,.28);
assert.ok(Number.isFinite(bind.x)&&Number.isFinite(bind.y));
assert.deepEqual([p.patternAt(pose,.43,.28).x,p.patternAt(pose,.43,.28).y],[bind.x,bind.y],
  'body-local UV must not reroll between frames');
const immutable=JSON.stringify(p.patterns[0]);

let nearest=Infinity,jump=0,last=pose[0];
for(let i=0;i<600;i++){
  p.advance(.05);
  if(i%10===0){const c=p.clearance(p.currentBody());nearest=Math.min(nearest,c);assert.ok(c>=1,'do not collide while painting pixel version: '+c)}
  const head=p.currentBody()[0],step=Math.hypot(head.x-last.x,head.y-last.y);
  jump=Math.max(jump,step);assert.ok(step<5,'snake head teleported');last=head;
}
assert.equal(JSON.stringify(p.patterns[0]),immutable,'pattern never mutates during movement');
get('style').listeners.click();
assert.equal(p.getState().pixelStyle,false);
assert.match(get('style').textContent,/舊版輪廓/);
get('style').listeners.click();
assert.equal(p.getState().pixelStyle,true);
get('detail').listeners.click();
assert.equal(p.getState().detailHigh,false);
assert.match(get('patternCount').textContent,/106 標記/);
get('detail').listeners.click();
assert.equal(p.getState().detailHigh,true);
assert.match(get('patternCount').textContent,/222 標記/);
get('individual').listeners.click();
assert.equal(p.getState().individualIndex,1);
assert.match(get('individual').textContent,/02/);
get('individual').listeners.click();
get('individual').listeners.click();
assert.equal(p.getState().individualIndex,0);
get('hide').listeners.click();
assert.deepEqual([p.getState().goal.x,p.getState().goal.y],[125,453]);
canvas.listeners.pointerdown({clientX:826,clientY:443});
assert.deepEqual([p.getState().goal.x,p.getState().goal.y],[826,443]);
get('plants').listeners.click();
assert.match(get('plants').textContent,/關/);
get('collision').listeners.click();
assert.match(get('collision').textContent,/開/);
get('play').listeners.click();assert.equal(p.getState().running,false);
get('play').listeners.click();assert.equal(p.getState().running,true);
get('reset').listeners.click();assert.equal(p.getState().goal.x,811);
console.log('PASS V0.3 pixel snake: cached UV patterns, 3 seeds, 222/106 details, 600-frame collision and inputs; min='+nearest.toFixed(2)+'px step='+jump.toFixed(2)+'px');
