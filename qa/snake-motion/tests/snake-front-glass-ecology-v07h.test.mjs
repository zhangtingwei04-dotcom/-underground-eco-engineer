import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 SNAKE_FRONT_GLASS_ECOLOGY_VERSION,
 buildSnakeFrontGlassEcologyV07h,
 classifyFrontGlassEcologyDepthV07h
} from '../src/ohm-core/snake-front-glass-ecology-v07h.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {terrariumFloorToSnakeV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
const stones=[
 {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,width:134,depth:76,
  height:230,transmissionPermille:0},
 {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,width:108,depth:70,
  height:190,transmissionPermille:0},
 {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,width:105,depth:80,
  height:245,transmissionPermille:0}
];
const create=(cover=340)=>createTerrariumSceneGeometryV03d({
 sceneId:'visual_botany_v07h',
 baseOptions:{
  biotaOptions:{zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:cover,litterUnits:100},
   {plantKind:'fern',plantCoverUnits:530,litterUnits:100},
   {plantKind:'none',plantCoverUnits:0,litterUnits:100},
   {plantKind:'moss',plantCoverUnits:470,litterUnits:100},
   {plantKind:'fern',plantCoverUnits:610,litterUnits:100}
  ]},
  fixtures:[{
   id:'lamp_1',type:'artificial_led',
   zoneIndex:2,strengthUnits:950,spreadZones:4,
   heightUnits:0,startMinute:0,durationMinutes:1440
  }]
 },
 objects:stones
});
const scene=create(),raw=JSON.stringify(scene);
const materials={left_stone_01:'slate',rear_stone_02:'basalt',
 right_stone_03:'limestone'};
const input=JSON.stringify(materials);
const a=buildSnakeFrontGlassEcologyV07h(scene,{
 materialByObjectId:materials
});
assert.equal(SNAKE_FRONT_GLASS_ECOLOGY_VERSION,'0.7H');
assert.equal(a.version,'0.7H');
assert.equal(a.sceneId,scene.sceneId);
assert.equal(a.sceneRevision,scene.revision);
assert.equal(a.stones.length,3);
assert.equal(a.zonePatches.length,5);
assert.equal(a.zonePatches[2].present,false);
assert.equal(a.flora.some(x=>x.zoneId==='zone_2'),false,
 'zero plant cover never draws spontaneous decorative moss');
assert.equal(a.ecologicalEffects.length,0);
assert.equal(a.worldChanges.length,0);
assert.ok(a.flora.length>=14,'actual existing cover produces visible patches');
assert.ok(Object.isFrozen(a));
assert.ok(Object.isFrozen(a.flora));
assert.ok(Object.isFrozen(a.flora[0]));
assert.ok(Object.isFrozen(a.flora[0].world));
assert.ok(Object.isFrozen(a.stones[0].pattern));
const again=buildSnakeFrontGlassEcologyV07h(scene,{
 materialByObjectId:materials
});
assert.deepEqual(a,again,'changing frames/restarting must not reroll scene art');
for(const zone of a.flora){
 assert.ok(['moss','fern'].includes(zone.plantKind));
 assert.equal(zone.visualRole,'representative_zone_patch_not_an_individual');
 assert.equal(zone.coverScale,
  a.zonePatches.find(p=>p.id===zone.zoneId).detail.display.coverScale);
 assert.ok(zone.anchor.x>=68&&zone.anchor.x<=1372);
 assert.ok(zone.anchor.y>=500&&zone.anchor.y<=672);
 assert.ok(Math.abs(zone.leafLeanDegrees)<=22);
 assert.ok(zone.size>0);
}
const slate=a.stones.find(s=>s.id==='left_stone_01');
const basalt=a.stones.find(s=>s.id==='rear_stone_02');
const limestone=a.stones.find(s=>s.id==='right_stone_03');
assert.equal(slate.material,'slate');
assert.equal(slate.patternName,'thin_layers');
assert.equal(slate.classification,'rock');
assert.equal(basalt.patternName,'fine_speckles');
assert.equal(limestone.patternName,'soft_layers');
assert.notDeepEqual(slate.pattern,basalt.pattern);
for(const stone of a.stones){
 const o=scene.objects.find(x=>x.id===stone.id);
 assert.deepEqual(stone.world,{x:o.x,y:o.y,width:o.width,
  depth:o.depth,height:o.height});
 const xy=terrariumFloorToSnakeV07c({
  x:o.x+o.width/2,y:o.y+o.depth/2
 });
 assert.deepEqual(stone.anchor,
  projectSnakeFrontGlassPointV07g({...xy,z:0}),
  'visible rock center must share the same world-to-camera transform as snake');
}
const newCover=buildSnakeFrontGlassEcologyV07h(create(680),{
 materialByObjectId:materials
});
assert.notEqual(newCover.flora.filter(x=>x.zoneId==='zone_0').length,
 a.flora.filter(x=>x.zoneId==='zone_0').length,
 'cover differences should affect visual abundance');
assert.deepEqual(newCover.zonePatches[0].detail.morphology,
 a.zonePatches[0].detail.morphology,
 'patch fingerprint must not reroll when biological cover changes');
assert.deepEqual(
 newCover.flora.find(x=>x.id==='zone_0_patch_0').anchor,
 a.flora.find(x=>x.id==='zone_0_patch_0').anchor
);
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{...stones[0],x:stones[0].x+20}
});
const shifted=buildSnakeFrontGlassEcologyV07h(moved,{
 materialByObjectId:materials
});
assert.equal(shifted.sceneRevision,scene.revision+1);
assert.notDeepEqual(shifted.stones.find(x=>x.id===slate.id).anchor,
 slate.anchor,'rock moving in authoritative scene must move visual footprint');
assert.deepEqual(shifted.stones.find(x=>x.id===slate.id).pattern,
 slate.pattern,'moving same rock must not re-randomize its surface');
assert.deepEqual(shifted.flora,a.flora,
 'moving rock must not rewrite established plant patch silhouettes');
assert.equal(JSON.stringify(scene),raw,'source scene stays unmodified');
assert.equal(JSON.stringify(materials),input,'material dictionary stays unmodified');

const pose={points:Array.from({length:24},(_,i)=>({
 ...terrariumFloorToSnakeV07c({
  x:300+i/23*400,y:175+i/23*50
 }),z:.15
}))};
const depth=classifyFrontGlassEcologyDepthV07h(a,pose);
assert.equal(depth.version,'0.7H');
assert.equal(depth.sceneId,a.sceneId);
assert.ok(depth.behind.length>=3,'real rear stones must be behind the snake');
assert.ok(depth.front.some(x=>x.plantKind==='fern')||
 depth.front.some(x=>x.plantKind==='moss'),
 'genuine foreground plant patches must render in front of transparent snake');
assert.equal(depth.snakeWorldDepthRange.minY,175);
assert.equal(depth.snakeWorldDepthRange.maxY,225);
assert.equal(depth.behind.filter(x=>x.drawLayer==='behind_snake').length,
 depth.behind.length);
assert.ok(depth.front.every(x=>x.world.y>=225));
assert.ok(depth.unresolved.every(x=>x.drawLayer==='mixed_unresolved'));
assert.deepEqual(classifyFrontGlassEcologyDepthV07h(a,pose),depth);
const far={points:pose.points.map(p=>({...p,y:-.6}))};
const near={points:pose.points.map(p=>({...p,y:1.32}))};
const back=classifyFrontGlassEcologyDepthV07h(a,far);
const front=classifyFrontGlassEcologyDepthV07h(a,near);
assert.notDeepEqual(
 back.front.map(x=>x.id),front.front.map(x=>x.id),
 'occlusion order updates from REAL moving snake world depth');
assert.ok(back.front.length>front.front.length);
assert.equal(a.source,'V0.3d_scene_V0.3e_biology_V0.3q_cosmetics');
for(const bad of [
 ()=>buildSnakeFrontGlassEcologyV07h(null),
 ()=>buildSnakeFrontGlassEcologyV07h({
  ...scene,objects:[{...stones[0],width:NaN},...stones.slice(1)]
 }),
 ()=>buildSnakeFrontGlassEcologyV07h(scene,{
  materialByObjectId:{imaginary_stone:'quartz'}
 }),
 ()=>buildSnakeFrontGlassEcologyV07h(scene,{
  materialByObjectId:{left_stone_01:'magical_health_buff'}
 }),
 ()=>buildSnakeFrontGlassEcologyV07h(scene,{
  materialByObjectId:[1,2]
 }),
 ()=>classifyFrontGlassEcologyDepthV07h(null,pose),
 ()=>classifyFrontGlassEcologyDepthV07h(a,{points:[]}),
 ()=>classifyFrontGlassEcologyDepthV07h(a,{
  points:pose.points.map((p,i)=>i===4?{...p,y:NaN}:p)
 })
])assert.throws(bad,RangeError);
const src=readFileSync(new URL(
 '../src/ohm-core/snake-front-glass-ecology-v07h.mjs',import.meta.url
),'utf8');
const html=readFileSync(new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/buildSnakeFrontGlassEcologyV07h/);
assert.match(html,/classifyFrontGlassEcologyDepthV07h/);
assert.match(html,/drawEcologyItems\(layers.front\)/);
assert.match(html,/drawContinuousTransparentRig\(shown,nodes\)/);
assert.match(html,/buildContinuousTransparentRigV07o/);
assert.doesNotMatch(html,/drawWireframe\(shown,nodes\)/,
 'V0.7O must not regress to independently painted glowing bone cylinders');
assert.match(html,/plantKind:'none',plantCoverUnits:0/);
assert.doesNotMatch(src,
 /Math\.random\s*\(|\blocalStorage\b|\bindexedDB\b|\bfetch\s*\(|saveGame\s*\(/);
assert.doesNotMatch(src,/mineralUnits|healthBuff|modifyTerrarium|applyTerrariumSceneGeometryV03dEvent/,
 'geological classification must not affect snake welfare/biology');
console.log('PASS SNAKE/ECO V0.7H: stable source-owned moss+fern zone patches and 3 real material rock patterns, missing-plant guard, moving stone identity, actual world depth layering, transparent snake, no saves or biological buffs.');
