import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 buildTerrariumNaturalVariationV03q,
 TERRARIUM_NATURAL_VARIATION_V03Q_VERSION,
 TERRARIUM_V03Q_MATERIAL_DISPLAY_TYPES
} from '../src/ohm-core/terrarium-natural-variation-v03q.mjs';
import {
 createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createTerrariumRenderCameraV03e,
 projectTerrariumSceneForRenderV03e
} from '../src/ohm-core/terrarium-scene-render-projection-v03e.mjs';
import {
 buildTerrariumPixelSpritesV03g
} from '../src/ohm-core/terrarium-pixel-sprites-v03g.mjs';

const source=()=>createTerrariumSceneGeometryV03d({
 sceneId:'botany_stone_v03q',
 baseOptions:{
  biotaOptions:{
   environmentOptions:{
    microclimateOptions:{columns:5,rows:1,
     ambient:{temperatureC:24,relativeHumidity:.55}},
    substrateOptions:{zones:Array.from({length:5},()=>({
     surfaceWaterUnits:400,rootWaterUnits:1000
    }))}
   },
   zoneConfigs:[
    {plantKind:'moss',plantCoverUnits:120,litterUnits:100},
    {plantKind:'fern',plantCoverUnits:230,litterUnits:100},
    {plantKind:'none',plantCoverUnits:0,litterUnits:100},
    {plantKind:'moss',plantCoverUnits:400,litterUnits:100},
    {plantKind:'fern',plantCoverUnits:320,litterUnits:100}
   ]
  },
  fixtures:[{id:'lamp_1',type:'artificial_led',zoneIndex:2,
    strengthUnits:950,spreadZones:4,heightUnits:0,
    startMinute:0,durationMinutes:1440}]
 },
 objects:[
  {id:'slate_1',kind:'rock_overhang',x:570,y:120,
   width:60,depth:120,height:400,transmissionPermille:0},
  {id:'quartz_2',kind:'rock_overhang',x:730,y:120,
   width:70,depth:120,height:300,transmissionPermille:700},
  {id:'canopy_1',kind:'canopy',x:60,y:100,
   width:100,depth:100,height:240,transmissionPermille:500}
 ]
});
const scene=source();
const original=JSON.stringify(scene);
const camera=createTerrariumRenderCameraV03e({
 view:'oblique',width:1200,height:640,padding:25
});
const frame=projectTerrariumSceneForRenderV03e(scene,{camera});
const materials={slate_1:'slate',quartz_2:'quartz'};
const first=buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:materials});
const again=buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:materials});
assert.equal(TERRARIUM_NATURAL_VARIATION_V03Q_VERSION,'0.3q');
assert.deepEqual(first,again,'same authoritative world should not reroll cosmetics');
assert.equal(first.sceneId,scene.sceneId);
assert.equal(first.authority,'V0.3e_projection_only');
assert.deepEqual(first.ecologicalEffects,[]);
assert.equal(first.flora.length,5);
assert.equal(first.stones.length,2);
assert.equal(first.flora[0].kind,'moss');
assert.equal(first.flora[1].kind,'fern');
assert.equal(first.flora[2].present,false);
assert.equal(first.flora[2].detail,null,'zero cover cannot draw living moss');
assert.equal(first.flora[0].detail.display.glossHint,null,
 'root water must not be presented as measured moss leaf wetness');
assert.ok(first.flora[1].detail.display.glossHint>=0);
assert.equal(first.flora[0].identityScope,'zone_patch_not_an_individual_plant');
const slate=first.stones.find(x=>x.id==='slate_1');
const quartz=first.stones.find(x=>x.id==='quartz_2');
assert.equal(slate.material,'slate');
assert.equal(slate.classification,'rock');
assert.equal(slate.patternName,'thin_layers');
assert.equal(quartz.material,'quartz');
assert.equal(quartz.classification,'mineral');
assert.equal(quartz.patternName,'angular_facets');
assert.notDeepEqual(slate.pattern,quartz.pattern);
assert.ok(Object.isFrozen(first));
assert.ok(Object.isFrozen(first.flora));
assert.ok(Object.isFrozen(first.flora[1].detail.morphology));
assert.ok(Object.isFrozen(first.stones[0].pattern));
assert.deepEqual(TERRARIUM_V03Q_MATERIAL_DISPLAY_TYPES,[
 'unspecified_rock','slate','basalt','limestone','quartz'
]);
const top=projectTerrariumSceneForRenderV03e(scene,{
 camera:createTerrariumRenderCameraV03e({view:'top',width:960,height:540})
});
assert.deepEqual(first,buildTerrariumNaturalVariationV03q(top,{
 materialByObjectId:materials
}),'reorienting game camera must not regenerate plant/stone identity');
const changed=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{...scene.objects.find(x=>x.id==='slate_1'),x:600}
});
const moved=buildTerrariumNaturalVariationV03q(
 projectTerrariumSceneForRenderV03e(changed,{camera}),
 {materialByObjectId:materials});
assert.deepEqual(moved.stones,first.stones,
 'moving the same rock should not regenerate its texture fingerprint');
assert.deepEqual(moved.flora,first.flora,
 'moving a rock must not rewrite existing plant patch appearance data');
const patchFrame={...frame,zones:frame.zones.map((zone,i)=>i===1?{
 ...zone,plantCoverUnits:550
}:zone)};
const foliageChanged=buildTerrariumNaturalVariationV03q(patchFrame,{
 materialByObjectId:materials
});
assert.deepEqual(foliageChanged.flora[1].detail.morphology,
 first.flora[1].detail.morphology,
 'changing cover should not reroll innate silhouette and orientation');
assert.notDeepEqual(foliageChanged.flora[1].detail.display,
 first.flora[1].detail.display,
 'visually sensed cover must read existing ecology authority');
assert.equal(foliageChanged.flora[1].detail.display.coverScale,.55);
const missing=buildTerrariumNaturalVariationV03q({
 ...frame,zones:frame.zones.map((zone,i)=>i===1?{
  ...zone,plantKind:'none',plantCoverUnits:0
 }:zone)
},{materialByObjectId:materials});
assert.equal(missing.flora[1].present,false);
assert.deepEqual(buildTerrariumNaturalVariationV03q(frame).stones
 .map(s=>s.material),['unspecified_rock','unspecified_rock'],
 'material must NEVER be inferred from an object ID or appearance');
const types=new Set;
for(const material of TERRARIUM_V03Q_MATERIAL_DISPLAY_TYPES){
 const v=buildTerrariumNaturalVariationV03q(frame,{
  materialByObjectId:{slate_1:material}
 });
 const variant=v.stones.find(s=>s.id==='slate_1');
 types.add(variant.patternName);
 assert.ok(variant.status.includes('cosmetic_only'));
}
assert.equal(types.size,5,'material profiles must be visually distinct');
const legacySprites=buildTerrariumPixelSpritesV03g(frame);
assert.equal(legacySprites.version,'0.3g',
 'new visuals do not silently replace the old rendering or game frame');
assert.equal(JSON.stringify(scene),original,'no mutations of ecology or geometry');
assert.equal(JSON.stringify(materials),JSON.stringify({
 slate_1:'slate',quartz_2:'quartz'
}));
for(const fn of [
 ()=>buildTerrariumNaturalVariationV03q(null),
 ()=>buildTerrariumNaturalVariationV03q({...frame,version:'unsupported'}),
 ()=>buildTerrariumNaturalVariationV03q({...frame,sceneId:'invalid id'}),
 ()=>buildTerrariumNaturalVariationV03q({...frame,zones:[{
  ...frame.zones[0],rootMoistureIndex:NaN
 }]}),
 ()=>buildTerrariumNaturalVariationV03q({...frame,zones:[{
  ...frame.zones[0],plantKind:'none',plantCoverUnits:5
 }]}),
 ()=>buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:{
  slate_1:'fictional_magic_buff'
 }}),
 ()=>buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:{
  imaginary_item:'slate'
 }}),
 ()=>buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:{
  canopy_1:'basalt'
 }}),
 ()=>buildTerrariumNaturalVariationV03q(frame,{materialByObjectId:[]})
])assert.throws(fn,RangeError);
const src=readFileSync(new URL('../src/ohm-core/terrarium-natural-variation-v03q.mjs',import.meta.url),'utf8');
assert.doesNotMatch(src,/\blocalStorage\b\s*[.\[]|\bfetch\s*\(|\bwindow\b\s*[.\[]|\bindexedDB\b\s*[.\[]|Math\.random\s*\(|saveGame\s*\(/);
assert.doesNotMatch(src,/applyTerrariumSceneGeometryV03dEvent|applyTerrariumBiotaV03Event|advanceTerrariumSceneGeometryV03d/);
console.log('PASS ECO V0.3q: 5 zone plant morphologies, 2 distinct rocks/materials, deterministic across cameras/movement, cover-only display updates, missing-plant protection, no mineralUnits confusion and no world writes.');
