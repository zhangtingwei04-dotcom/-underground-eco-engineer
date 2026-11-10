import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../terrarium-autonomy-lab.html',import.meta.url),'utf8');
assert.match(html,/生態箱｜自主避障實驗/);
assert.match(html,/B 版/);
assert.doesNotMatch(html,/(?:src\/ohm-core|supabase|localStorage|fetch\()/i);
const source=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(source,'standalone inline Canvas script required');
const marker="  resetAll();draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(source.includes(marker),'cannot inspect active script without stable test marker');
const testSource=source.replace(marker,
  "  resetAll();globalThis.__test={advance,navigate,currentBody,clearance,head:()=>trail[trail.length-1],state:()=>status,goal:()=>goal,running:()=>running,route:()=>route};draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);");
const noop=()=>{};
const ctx=new Proxy({
  createLinearGradient:()=>({addColorStop:noop}),
  createRadialGradient:()=>({addColorStop:noop})
},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const elements=new Map();
function ui(id){
  if(!elements.has(id))elements.set(id,{
    textContent:'',style:{},value:0,classList:{add:noop},listeners:{},
    setAttribute:noop,addEventListener(name,fn){this.listeners[name]=fn}
  });
  return elements.get(id);
}
const canvas={getContext:()=>ctx,addEventListener(name,fn){this.listeners[name]=fn},
  listeners:{},getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
const context={document:{getElementById:id=>id==='scene'?canvas:ui(id)},
  requestAnimationFrame:noop};
runInNewContext(testSource,context,{timeout:3500});
const p=context.__test;
assert.ok(p,'test must access real page logic');
const profile={minimum:Infinity,maximumJump:0};
function sample(seconds){
  let old=p.head();
  const iterations=Math.round(seconds/.05);
  for(let i=0;i<iterations;i++){
    p.advance(.05);
    if(i%10===0){
      const min=p.clearance(p.currentBody());
      profile.minimum=Math.min(profile.minimum,min);
      assert.ok(min>=1,'whole-body painted polygon clearance must be at least 1px: '+min);
    }
    const h=p.head(),jump=Math.hypot(h.x-old.x,h.y-old.y);
    profile.maximumJump=Math.max(jump,profile.maximumJump);
    assert.ok(jump<5,'no head position teleportation allowed: '+jump);
    assert.ok(p.running(),'planner stopped due to unsafe geometry: '+p.state());
    old=h;
  }
}
sample(110); // Repeated self-selected targets, both sides of stone.
for(const goal of [{x:270,y:420},{x:840,y:411},{x:484,y:335},{x:268,y:460},{x:823,y:409}]){
  assert.equal(p.navigate(goal,true),true);
  sample(30);
}
assert.ok(profile.minimum>1,'hard clearance invariant');
assert.ok(profile.maximumJump<5);
assert.ok(p.route().length>1);
assert.ok(ui('plans').textContent.endsWith('次'));
// Touch coordinates must control the ACTIVE planner, not just draw a marker.
canvas.listeners.pointerdown({clientX:220,clientY:460});
assert.equal(p.goal().x,220);
assert.equal(p.goal().y,460);
assert.match(ui('wander').textContent,/關/);
ui('right').listeners.click();
assert.equal(p.goal().x,823);
ui('left').listeners.click();
assert.equal(p.goal().x,268);
ui('speed').listeners.input({target:{value:'61'}});
assert.equal(ui('speedValue').textContent,'61 px/s');
ui('plants').listeners.click();
assert.match(ui('plants').textContent,/關/);
ui('collision').listeners.click();
assert.match(ui('collision').textContent,/開/);
ui('play').listeners.click();
assert.equal(p.running(),false);
ui('play').listeners.click();
assert.equal(p.running(),true);
ui('reset').listeners.click();
assert.equal(p.goal().x,811);
assert.match(ui('wander').textContent,/開/);
console.log('PASS autonomous terrarium: A* live goals, 110s roaming, 5 replans, collision, input and playback ('+
  profile.minimum.toFixed(2)+' px minimum clearance, '+profile.maximumJump.toFixed(2)+' px maximum step)');
