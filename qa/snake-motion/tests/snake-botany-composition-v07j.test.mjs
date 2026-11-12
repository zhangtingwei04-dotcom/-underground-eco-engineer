import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {buildSnakeFrontGlassEcologyV07h}
 from '../src/ohm-core/snake-front-glass-ecology-v07h.mjs';
import {buildSnakeRootedBotanyV07i}
 from '../src/ohm-core/snake-rooted-botany-v07i.mjs';
import {composeSnakeBotanyV07j,SNAKE_BOTANY_COMPOSITION_VERSION}
 from '../src/ohm-core/snake-botany-composition-v07j.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07j_no_new_life',
 baseOptions:{biotaOptions:{zoneConfigs:[
  {plantKind:'moss',plantCoverUnits:340,litterUnits:100},
  {plantKind:'fern',plantCoverUnits:530,litterUnits:100},
  {plantKind:'none',plantCoverUnits:0,litterUnits:100},
  {plantKind:'moss',plantCoverUnits:470,litterUnits:100},
  {plantKind:'fern',plantCoverUnits:610,litterUnits:100}
 ]}}
});
const before=JSON.stringify(scene);
const ecology=buildSnakeFrontGlassEcologyV07h(scene);
const original=buildSnakeRootedBotanyV07i(ecology);
const originalBefore=JSON.stringify(original);
const composed=composeSnakeBotanyV07j(original);
assert.equal(SNAKE_BOTANY_COMPOSITION_VERSION,'0.7J');
assert.equal(composed.version,'0.7J');
assert.equal(composed.sourceVersion,'0.7I');
assert.equal(composed.skinApplied,false);
assert.deepEqual(composed.effectOnEcology,[]);
assert.equal(composed.sceneId,original.sceneId);
assert.equal(composed.sceneRevision,original.sceneRevision);
assert.ok(Object.isFrozen(composed)&&Object.isFrozen(composed.patches));
assert.equal(composed.patches.length,ecology.flora.length);
assert.equal(composed.patches.some(p=>p.zoneId==='zone_2'),false);
let fernPatches=0,sourceFronds=0,visibleFronds=0,mossPatches=0;
for(const patch of composed.patches){
 const old=original.patches.find(p=>p.id===patch.id);
 assert.ok(old,'no newly invented plant patch');
 assert.equal(patch.zoneId,old.zoneId);
 assert.equal(patch.type,old.type);
 assert.equal(patch.appearanceOnly,true);
 assert.deepEqual(patch.root,old.root);
 assert.deepEqual(patch.sourceAnchor,old.sourceAnchor);
 assert.deepEqual(patch.soilBase,old.soilBase,
  'substrate collar and exact contact may not drift');
 assert.ok(Object.isFrozen(patch));
 if(patch.type==='fern'){
  fernPatches++;
  assert.equal(patch.sourceFrondCount,old.fronds.length);
  assert.equal(patch.fronds.length,3);
  assert.equal(patch.hiddenFrondCount,old.fronds.length-3);
  sourceFronds+=old.fronds.length;
  visibleFronds+=patch.fronds.length;
  const selected=[0,Math.floor((old.fronds.length-1)/2),old.fronds.length-1];
  for(let i=0;i<3;i++){
   const frond=patch.fronds[i],from=old.fronds[selected[i]];
   assert.equal(frond.index,from.index,'only old fronds selected');
   assert.deepEqual(frond.root,patch.root);
   assert.deepEqual(frond.stipe[0],patch.root);
   assert.equal(frond.pinnae.length,from.pinnae.length);
   assert.ok(Object.isFrozen(frond)&&Object.isFrozen(frond.pinnae));
   for(let j=0;j<frond.pinnae.length;j++){
    const leaflet=frond.pinnae[j];
    assert.equal(leaflet.side,from.pinnae[j].side);
    assert.equal(leaflet.index,from.pinnae[j].index);
    assert.equal(leaflet.blade.length,4);
    assert.deepEqual(leaflet.blade[0],leaflet.base);
    assert.deepEqual(leaflet.blade[2],leaflet.tip);
    assert.deepEqual(leaflet.attachmentToRachis.to,leaflet.base);
    assert.ok(leaflet.blade.every(v=>Number.isFinite(v.x)&&Number.isFinite(v.y)));
   }
  }
  assert.ok(patch.fronds[0].tip.x<old.fronds[0].tip.x,
   'left canopy fans outward rather than collapsing over middle');
  assert.ok(patch.fronds[2].tip.x>old.fronds.at(-1).tip.x,
   'right canopy fans outward rather than collapsing over middle');
 }else{
  mossPatches++;
  assert.deepEqual(patch.fronds,old.fronds);
  assert.deepEqual(patch.shoots,old.shoots);
  assert.deepEqual(patch.carpet,old.carpet);
  assert.deepEqual(patch.cushions,old.cushions);
 }
}
assert.ok(fernPatches>0&&mossPatches>0);
assert.ok(visibleFronds<sourceFronds);
assert.deepEqual(composed,composeSnakeBotanyV07j(original));
assert.equal(JSON.stringify(scene),before,'no original scene mutation');
assert.equal(JSON.stringify(original),originalBefore,'v07i source stays untouched');
for(const malformed of [
 null,{}, {...original,version:'0.7J'},
 {...original,skinApplied:true},
 {...original,patches:[...original.patches,original.patches[0]]},
 {...original,patches:original.patches.map((p,i)=>i===0?
  {...p,sourceAnchor:{x:p.root.x+1,y:p.root.y}}:p)}
])assert.throws(()=>composeSnakeBotanyV07j(malformed),RangeError);
const file=readFileSync(new URL('../src/ohm-core/snake-botany-composition-v07j.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/composeSnakeBotanyV07j/);
assert.match(html,/qaV07jComposed/);
assert.doesNotMatch(file,/Math[.]random|fetch|localStorage|indexedDB|saveGame|mineralUnits|applyTerrariumBiota/);
console.log('PASS V0.7J: '+fernPatches+' source fern patches, '+sourceFronds+
 ' original fronds -> '+visibleFronds+' displayed; '+mossPatches+
 ' moss patches unchanged; no invented life or skin, stable soil roots.');
