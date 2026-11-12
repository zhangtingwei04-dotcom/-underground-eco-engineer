import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {buildSnakeFrontGlassEcologyV07h}
 from '../src/ohm-core/snake-front-glass-ecology-v07h.mjs';
import {buildSnakeRootedBotanyV07i}
 from '../src/ohm-core/snake-rooted-botany-v07i.mjs';
import {composeSnakeBotanyV07j}
 from '../src/ohm-core/snake-botany-composition-v07j.mjs';
import {buildMossSoilTransitionsV07k,SNAKE_MOSS_SOIL_VERSION}
 from '../src/ohm-core/snake-moss-soil-transition-v07k.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07k_soil_blend_test',
 baseOptions:{biotaOptions:{zoneConfigs:[
  {plantKind:'moss',plantCoverUnits:340,litterUnits:100},
  {plantKind:'fern',plantCoverUnits:530,litterUnits:100},
  {plantKind:'none',plantCoverUnits:0,litterUnits:100},
  {plantKind:'moss',plantCoverUnits:470,litterUnits:100},
  {plantKind:'fern',plantCoverUnits:610,litterUnits:100}
 ]}}
});
const sceneBefore=JSON.stringify(scene);
const ecology=buildSnakeFrontGlassEcologyV07h(scene);
const v07i=buildSnakeRootedBotanyV07i(ecology);
const botany=composeSnakeBotanyV07j(v07i);
const botanyBefore=JSON.stringify(botany);
const result=buildMossSoilTransitionsV07k(botany);
assert.equal(SNAKE_MOSS_SOIL_VERSION,'0.7K');
assert.equal(result.version,'0.7K');
assert.equal(result.sourceVersion,'0.7J');
assert.equal(result.sceneId,botany.sceneId);
assert.equal(result.sceneRevision,botany.sceneRevision);
assert.equal(result.skinApplied,false);
assert.deepEqual(result.effectsOnEcology,[]);
assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.transitions));
const mosses=botany.patches.filter(p=>p.type==='moss');
assert.ok(mosses.length>0);
assert.equal(result.transitions.length,mosses.length,
 'one nonliving soil seam per EXISTING moss patch only');
assert.equal(result.transitions.some(p=>p.zoneId==='zone_2'),false,
 'unplanted zone cannot gain a new living plant or a moss seam');
for(const seam of result.transitions){
 const source=mosses.find(p=>p.id===seam.id);
 assert.ok(source,'seam must reference genuine rooted moss');
 assert.equal(seam.zoneId,source.zoneId);
 assert.deepEqual(seam.root,source.root);
 assert.deepEqual(seam.sourceRoot,source.sourceAnchor);
 assert.equal(seam.backBlend.length,26);
 assert.equal(seam.frontBlend.length,26);
 assert.equal(seam.sediment.length,9);
 assert.equal(seam.role,'nonliving_substrate_edge_art_not_new_moss_or_root');
 assert.ok(Object.isFrozen(seam));
 assert.ok(Object.isFrozen(seam.backBlend));
 for(const p of [...seam.backBlend,...seam.frontBlend]){
  assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  assert.ok(Math.abs(p.x-source.root.x)<=source.soilBase.width+0.001,
   'edge seam cannot drift from its authoritative soil collar');
  assert.ok(Math.abs(p.y-source.root.y)<=source.soilBase.height*1.1+0.001,
   'soil seam is shallow art, not an invented terrain slope');
 }
 for(const grain of seam.sediment){
  assert.equal(grain.role,'nonliving_soil_art_grain');
  assert.ok(grain.radius>0&&grain.radius<2);
  assert.ok(Math.abs(grain.center.x-source.root.x)<
   source.soilBase.width);
 }
}
assert.deepEqual(buildMossSoilTransitionsV07k(botany),result,
 'same input must make exactly the same visual seam');
assert.equal(JSON.stringify(scene),sceneBefore,
 'no mutation of authoritative ecosystem data');
assert.equal(JSON.stringify(botany),botanyBefore,
 'no mutation of the v07j plants or source footprints');
for(const malformed of [
 null,{}, {...botany,version:'0.7I'},
 {...botany,skinApplied:true},
 {...botany,patches:[...botany.patches,botany.patches[0]]},
 {...botany,patches:botany.patches.map((p,i)=>i===0?
  {...p,root:{x:p.root.x+1,y:p.root.y}}:p)}
])assert.throws(()=>buildMossSoilTransitionsV07k(malformed),RangeError);
const src=readFileSync(new URL('../src/ohm-core/snake-moss-soil-transition-v07k.mjs',import.meta.url),'utf8');
const lab=readFileSync(new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(lab,/buildMossSoilTransitionsV07k/);
assert.match(lab,/drawMossSoilContact/);
assert.match(lab,/qaV07kMossContact/);
assert.doesNotMatch(src,/Math[.]random|fetch|localStorage|indexedDB|saveGame|mineralUnits|applyTerrariumBiota/);
console.log('PASS V0.7K: '+mosses.length+
 ' original moss patches each get a shallow deterministic nonliving soil seam, no new plants, source and snake unchanged.');
