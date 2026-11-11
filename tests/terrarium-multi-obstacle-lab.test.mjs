import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const html=readFileSync(new URL('../terrarium-multi-obstacle-lab.html',import.meta.url),'utf8');
assert.match(html,/生態箱｜多障礙自然探索 V0\.2/);
assert.doesNotMatch(html,/(?:supabase|localStorage|fetch\(|src\/ohm-core)/i);
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'self-contained browser script is required');
const hook="  resetAll();draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);";
assert.ok(script.includes(hook),'entrypoint hook must stay stable');
const testSource=script.replace(hook,
  "  resetAll();globalThis.__probe={advance,navigate,makeRoute,clearance,currentBody,head:()=>trail[trail.length-1],running:()=>running,goal:()=>goal,status:()=>status,colliders,sites};draw();$('fallback').classList.add('hidden');requestAnimationFrame(frame);");
const noop=()=>{};
const ctx=new Proxy({
  createLinearGradient:()=>({addColorStop:noop}),
  createRadialGradient:()=>({addColorStop:noop})
},{get:(o,k)=>k in o?o[k]:noop,set:(o,k,v)=>(o[k]=v,true)});
const controls=new Map();
const canvas={getContext:()=>ctx,listeners:{},addEventListener(n,f){this.listeners[n]=f},
  getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
function element(id){
  if(id==='scene')return canvas;
  if(!controls.has(id))controls.set(id,{textContent:'',value:0,style:{},listeners:{},
    classList:{add:noop},setAttribute:noop,addEventListener(n,f){this.listeners[n]=f}});
  return controls.get(id);
}
const window={document:{getElementById:element},requestAnimationFrame:noop};
runInNewContext(testSource,window,{timeout:3500});
const p=window.__probe;
assert.equal(p.colliders.length,5,'branch, root and three enterable-shelter walls');
assert.ok(p.colliders.some(c=>c.id==='branch'));
assert.ok(p.colliders.some(c=>c.id==='root'));
assert.equal(p.colliders.filter(c=>c.id.startsWith('hide-')).length,3);

const totals={min:Infinity,maxStep:0,frames:0};
function sample(maxFrames,breakOnArrival=false){
  let prior=p.head();
  for(let i=0;i<maxFrames;i++){
    p.advance(0.05);totals.frames++;
    const head=p.head(),jump=Math.hypot(head.x-prior.x,head.y-prior.y);
    totals.maxStep=Math.max(jump,totals.maxStep);
    assert.ok(jump<5,'teleport detected: '+jump);
    if(i%8===0){
      const c=p.clearance(p.currentBody());
      totals.min=Math.min(c,totals.min);
      assert.ok(c>=1,'body penetrated obstacle: '+c+' state '+p.status());
    }
    assert.ok(p.running(),'no unexpected safety stop: '+p.status());
    prior=head;
    if(breakOnArrival&&(p.status()==='抵達／觀察'||p.status()==='探入躲藏洞／休息'))break;
  }
}
sample(2400); // two minutes of deterministic multi-obstacle exploration
const targets=[
  {x:125,y:453,label:'hide'},
  {x:575,y:483,label:'branch'},
  {x:745,y:414,label:'plant'},
  {x:838,y:447,label:'right'},
  {x:268,y:423,label:'left'},
  {x:484,y:339,label:'solid rock tap'}
];
for(const target of targets){
  assert.equal(p.navigate(target,true),true,'must find a safe route to '+target.label);
  sample(1000,true);
  const physical=p.goal();
  if(target.label==='solid rock tap')assert.notDeepEqual([physical.x,physical.y],[target.x,target.y],
    'solid rock taps should be projected outside the obstacle');
  else assert.ok(Math.hypot(physical.x-target.x,physical.y-target.y)<16,
    'requested destinations should be reached without arbitrary teleportation');
}
assert.ok(totals.min>=1&&totals.maxStep<5);
const expectedTargets={hide:[125,453],branch:[575,483],plant:[745,414],left:[268,423],right:[823,410]};
for(const [id,coordinate] of Object.entries(expectedTargets)){
  element(id).listeners.click();
  assert.deepEqual([p.goal().x,p.goal().y],coordinate,
    id+' control should invoke the real planner');
}
canvas.listeners.pointerdown({clientX:813,clientY:435});
assert.equal(p.goal().x,813);
assert.equal(p.goal().y,435);
element('plants').listeners.click();
assert.match(element('plants').textContent,/關/);
element('collision').listeners.click();
assert.match(element('collision').textContent,/開/);
element('speed').listeners.input({target:{value:'60'}});
assert.equal(element('speedValue').textContent,'60 px/s');
element('play').listeners.click();
assert.equal(p.running(),false);
element('play').listeners.click();
assert.equal(p.running(),true);
element('reset').listeners.click();
assert.equal(p.goal().x,811);
assert.match(element('wander').textContent,/開/);
console.log('PASS V0.2 multi-obstacle + hide: '+totals.frames+
  ' simulated frames, min '+totals.min.toFixed(2)+'px, step '+totals.maxStep.toFixed(2)+'px');
