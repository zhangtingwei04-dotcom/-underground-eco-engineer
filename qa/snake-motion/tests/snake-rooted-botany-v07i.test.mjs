import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {buildSnakeFrontGlassEcologyV07h}
 from '../src/ohm-core/snake-front-glass-ecology-v07h.mjs';
import {
 buildSnakeRootedBotanyV07i,SNAKE_ROOTED_BOTANY_VERSION
} from '../src/ohm-core/snake-rooted-botany-v07i.mjs';

function makeScene(cover=530) {
 return createTerrariumSceneGeometryV03d({
  sceneId:'front_botany_v07i',
  baseOptions:{biotaOptions:{zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:360,litterUnits:100},
   {plantKind:'fern',plantCoverUnits:cover,litterUnits:100},
   {plantKind:'none',plantCoverUnits:0,litterUnits:100},
   {plantKind:'moss',plantCoverUnits:450,litterUnits:100},
   {plantKind:'fern',plantCoverUnits:610,litterUnits:100}
  ]}}
 });
}
const scene=makeScene(),before=JSON.stringify(scene);
const ecology=buildSnakeFrontGlassEcologyV07h(scene);
const botany=buildSnakeRootedBotanyV07i(ecology);
assert.equal(SNAKE_ROOTED_BOTANY_VERSION,'0.7I');
assert.equal(botany.version,'0.7I');
assert.equal(botany.sceneId,scene.sceneId);
assert.equal(botany.sceneRevision,scene.revision);
assert.equal(botany.skinApplied,false);
assert.deepEqual(botany.effectOnEcology,[]);
assert.equal(botany.patches.length,ecology.flora.length);
assert.ok(Object.isFrozen(botany));
assert.ok(Object.isFrozen(botany.patches));
assert.equal(botany.patches.some(x=>x.zoneId==='zone_2'),false);
let fernCount=0,mossCount=0,leafletCount=0;
for(const patch of botany.patches){
 const original=ecology.flora.find(x=>x.id===patch.id);
 assert.ok(original,'each painted patch belongs to an existing living zone');
 assert.equal(patch.zoneId,original.zoneId);
 assert.equal(patch.kind,original.plantKind);
 assert.deepEqual(patch.sourceAnchor,original.anchor,
  'all roots must attach to exactly the V0.7H source soil anchor');
 assert.deepEqual(patch.root,original.anchor,
  'rendered root is not arbitrary raised or shifted');
 assert.equal(patch.appearanceOnly,true);
 assert.ok(patch.soilBase.width>0&&patch.soilBase.height>0);
 assert.ok(Math.abs(patch.soilBase.center.y-patch.root.y)<1e-6);
 assert.ok(patch.soilBase.topY<=patch.root.y,
  'substrate collar must touch the ground, not float above it');
 assert.ok(Object.isFrozen(patch));
 assert.ok(Object.isFrozen(patch.soilBase));
 if(patch.kind==='fern'){
  fernCount++;
  assert.equal(patch.fronds.length>=4&&patch.fronds.length<=6,true);
  assert.equal(patch.shoots.length,0);
  for(const frond of patch.fronds){
   assert.deepEqual(frond.root,patch.root);
   assert.deepEqual(frond.stipe[0],patch.root,
    'fern rachis must start at the soil anchor');
   assert.equal(frond.stipe.length,3);
   assert.equal(frond.rachis.length,10);
   assert.ok(frond.tip.y<patch.root.y,
    'fronds must grow UP from ground in front-glass view');
   assert.ok(frond.pinnae.length>=12);
   const counts=new Map;
   for(const pinna of frond.pinnae){
    assert.ok([-1,1].includes(pinna.side));
    counts.set(pinna.index,(counts.get(pinna.index)||0)+1);
    assert.equal(pinna.blade.length,4,
     'narrow leaf blade, not giant blob/rounded circle');
    assert.ok(Object.isFrozen(pinna.blade));
    assert.ok(pinna.blade.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
    assert.ok(Math.hypot(
      pinna.tip.x-pinna.base.x,pinna.tip.y-pinna.base.y)>0.2,
     'each pinna is a genuine separated leaflet');
    leafletCount++;
   }
   assert.ok([...counts.values()].every(v=>v===2),
    'pinnate frond pairs have both left and right leaflets');
   const minTip=Math.min(...frond.pinnae.map(p=>p.tip.y));
   const height=Math.abs(frond.root.y-frond.tip.y);
   assert.ok(minTip>=frond.tip.y-height*.32,
    'pinna tips stay within a scale-relative frond art envelope');
  }
 }else{
  mossCount++;
  assert.equal(patch.fronds.length,0);
  assert.ok(patch.shoots.length>=11);
  assert.ok(['carpet_proxy','cushion_proxy'].includes(
   patch.visualGrowthHabit));
  assert.ok(patch.carpet.length+patch.cushions.length===1,
   'moss source patch is either a carpet or cushion art proxy');
  for(const shoot of patch.shoots){
   assert.ok(shoot.root.y<=patch.root.y);
   assert.ok(shoot.tip.y<shoot.root.y);
   assert.equal(shoot.leaves.length,3);
   assert.ok(shoot.leaves.every(p=>p.left&&p.right));
  }
 }
}
assert.ok(fernCount>0&&mossCount>0);
assert.ok(leafletCount>100);
const twice=buildSnakeRootedBotanyV07i(ecology);
assert.deepEqual(botany,twice,
 'all art geometry must be identical on restart/replay');
const high=buildSnakeRootedBotanyV07i(
 buildSnakeFrontGlassEcologyV07h(makeScene(870))
);
const originalFern=botany.patches.filter(x=>x.zoneId==='zone_1');
const highFern=high.patches.filter(x=>x.zoneId==='zone_1');
assert.ok(highFern.length>=originalFern.length,
 'more source zone cover may increase rendered patch count');
assert.deepEqual(originalFern[0].root,highFern[0].root,
 'same zone patch remains rooted at the identical V0.3d ground position');
assert.equal(originalFern[0].fronds.length,highFern[0].fronds.length,
 'same V0.3q morphology retains the number of structural fronds');
assert.notDeepEqual(originalFern[0].fronds[0].tip,
 highFern[0].fronds[0].tip,
 'larger COVER can resize art without rerolling the plant fingerprint');
// Only the scene identity and V0.3q fingerprint own a patch's appearance.
assert.deepEqual(botany,buildSnakeRootedBotanyV07i(ecology));
assert.equal(JSON.stringify(scene),before);
assert.ok(botany.patches.some(x=>x.type==='moss'&&
 x.visualGrowthHabit==='carpet_proxy'));
assert.ok(botany.patches.some(x=>x.type==='moss'&&
 x.visualGrowthHabit==='cushion_proxy'));
for(const malformed of [
 null,{}, {...ecology,version:'fake'},
 {...ecology,flora:[...ecology.flora,{
  ...ecology.flora[0],id:'invented_patch',zoneId:'zone_2',plantKind:'moss'
 }]},
 {...ecology,flora:[...ecology.flora,
  {...ecology.flora[0],id:ecology.flora[0].id}]},
 {...ecology,flora:ecology.flora.map((p,i)=>i===0?
  {...p,size:NaN}:p)},
 {...ecology,flora:ecology.flora.map((p,i)=>i===0?
  {...p,anchor:{x:NaN,y:300}}:p)},
 {...ecology,flora:ecology.flora.map((p,i)=>i===0?
  {...p,plantKind:'fictional'}:p)}
])assert.throws(()=>buildSnakeRootedBotanyV07i(malformed),RangeError);
const src=readFileSync(
 new URL('../src/ohm-core/snake-rooted-botany-v07i.mjs',import.meta.url),
 'utf8'
);
const lab=readFileSync(new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(lab,/buildSnakeRootedBotanyV07i/);
assert.match(lab,/drawRootedBotany/);
assert.match(lab,/soilBase/);
assert.match(lab,/frond\.pinnae/);
assert.doesNotMatch(lab,/function plant\(/,
 'no longer use arbitrary stamped round-leaf decorations');
assert.doesNotMatch(src,
 /\bfetch\s*\(|\blocalStorage\b|\bindexedDB\b|Math\.random\s*\(|saveGame\s*\(/);
assert.doesNotMatch(src,/mineralUnits|applyTerrariumBiota|setWorldTime/,
 'botanical art cannot invent mineral/health or ecological side effects');
console.log('PASS ECO/SNAKE V0.7I: '+fernCount+
 ' source-backed fern patches with '+leafletCount+
 ' paired pinnae, '+mossCount+
 ' root-attached moss carpets/cushions, zero plants in empty zone, deterministic geometry, no original world writes or snake skin.');
