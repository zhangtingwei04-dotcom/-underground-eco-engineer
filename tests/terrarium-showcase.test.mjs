import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

// Test the actual PUBLIC showcase's self-contained JS, not a duplicated
// geometry implementation that could drift away from the displayed route.
const html=readFileSync(new URL('../terrarium-showcase.html',import.meta.url),'utf8');
assert.match(html,/路線：B 明顯貼邊/);
assert.doesNotMatch(html,/(?:src\/ohm-core\/|supabase|localStorage|fetch\()/i);
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'inline showcase script must exist');
const marker="  draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(match[1].includes(marker),'showcase must end with initial draw and RAF');
const js=match[1].replace(marker,
  "  globalThis.__probe={body:currentBody,gap:clearance,setTime:t=>time=t,setMode:m=>selectedMode=m,getMode:()=>selectedMode};");
const noop=()=>{};
const ctx=new Proxy({
  createLinearGradient:()=>({addColorStop:noop}),
  createRadialGradient:()=>({addColorStop:noop})
},{get:(obj,key)=>key in obj?obj[key]:noop,set:(obj,key,val)=>(obj[key]=val,true)});
const elements=new Map();
const document={getElementById(id){
  if(id==='scene')return {getContext:()=>ctx};
  if(!elements.has(id))elements.set(id,{
    textContent:'',value:0,style:{},classList:{add:noop},listeners:{},
    setAttribute:noop,
    addEventListener(name,fn){this.listeners[name]=fn}
  });
  return elements.get(id);
}};
const sandbox={document,requestAnimationFrame:noop};
runInNewContext(js,sandbox,{timeout:2000});
const probe=sandbox.__probe;
assert.ok(probe,'script must expose internal probe only inside test VM');
const nearest={A:Infinity,B:Infinity};
for(const mode of ['A','B']){
  probe.setMode(mode);
  let prior=null;
  for(let i=0;i<=440;i++){
    probe.setTime(i*0.05);
    const body=probe.body(),gap=probe.gap(body);
    assert.equal(body.length,79);
    assert.ok(Number.isFinite(gap),mode+' finite gap');
    assert.ok(body.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.w>0));
    assert.ok(gap>=1,mode+' must preserve at least one canvas pixel of clearance at '+i/20+' seconds: '+gap);
    nearest[mode]=Math.min(nearest[mode],gap);
    assert.deepEqual(
      Array.from(probe.body(),p=>[p.x,p.y,p.w]),
      Array.from(body,p=>[p.x,p.y,p.w]),
      'same time and mode must yield identical pose');
    if(prior){
      const jump=Math.hypot(body[0].x-prior.x,body[0].y-prior.y);
      assert.ok(jump<6,mode+' head may not teleport: '+jump);
    }
    prior=body[0];
  }
}
assert.ok(nearest.A>20,'original A remains the noticeably wider bypass');
assert.ok(nearest.B>1 && nearest.B<4,'B passes close enough for visible rock-edge movement');
probe.setMode('B');probe.setTime(0);
const first=Array.from(probe.body(),p=>[p.x,p.y]);
probe.setTime(1);
assert.deepEqual(Array.from(probe.body(),p=>[p.x,p.y]),first,'rest keeps exact pose');
probe.setTime(21);
const last=Array.from(probe.body(),p=>[p.x,p.y]);
probe.setTime(22);
assert.deepEqual(Array.from(probe.body(),p=>[p.x,p.y]),last,'final rest does not reset body');
// Deliberately place a synthetic body inside the rock to ensure collision
// reports the problem instead of just showing "safe" for every possible pose.
assert.ok(probe.gap([{x:480,y:340,w:12},{x:510,y:351,w:12}])<0);
probe.setMode('B');probe.setTime(10);
const before=probe.body()[0];
elements.get('route').listeners.click();
assert.equal(probe.getMode(),'A','route button actually switches back to original mode');
assert.match(elements.get('route').textContent,/A 原版避障/);
assert.notDeepEqual(Array.from(probe.body()[0].x ? [probe.body()[0].x,probe.body()[0].y]:[]),
  [before.x,before.y]);
elements.get('route').listeners.click();
assert.equal(probe.getMode(),'B','route button switches to B again');
assert.match(elements.get('route').textContent,/B 明顯貼邊/);
console.log('PASS terrarium showcase B: 441-frame full-body polygon clearance, start/stop, route toggle, reproducibility');
