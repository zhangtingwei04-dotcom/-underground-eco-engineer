import assert from 'node:assert/strict';
import {
 buildTerrariumPixelSpritesV03g,
 TERRARIUM_PIXEL_SPRITES_V03G_VERSION
} from '../src/ohm-core/terrarium-pixel-sprites-v03g.mjs';
import {
 createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createTerrariumRenderCameraV03e,
 projectTerrariumSceneForRenderV03e
} from '../src/ohm-core/terrarium-scene-render-projection-v03e.mjs';

const create=()=>createTerrariumSceneGeometryV03d({
 sceneId:'v03g_sprite_demo',
 baseOptions:{
  biotaOptions:{
   environmentOptions:{
    microclimateOptions:{columns:5,rows:1,
     ambient:{temperatureC:24,relativeHumidity:.5}},
    substrateOptions:{zones:Array.from({length:5},()=>({
     surfaceWaterUnits:500,rootWaterUnits:1200
    }))}
   },
   zoneConfigs:[
    {plantKind:'moss',plantCoverUnits:120,litterUnits:100},
    {plantKind:'fern',plantCoverUnits:230,litterUnits:100},
    {plantKind:'none',plantCoverUnits:0,litterUnits:100},
    {plantKind:'moss',plantCoverUnits:320,litterUnits:100},
    {plantKind:'fern',plantCoverUnits:300,litterUnits:100}
   ]
  },
  fixtures:[{id:'lamp_1',type:'artificial_led',zoneIndex:2,
   strengthUnits:950,spreadZones:4,heightUnits:0,
   startMinute:0,durationMinutes:1440}]
 },
 mounts:[{fixtureId:'lamp_1',x:500,y:200,height:800}],
 objects:[
  {id:'rock_1',kind:'rock_overhang',
   x:570,y:120,width:60,depth:160,height:500,transmissionPermille:0},
  {id:'tree_1',kind:'canopy',
   x:80,y:90,width:125,depth:100,height:270,transmissionPermille:550},
  {id:'mesh_1',kind:'screen',
   x:340,y:85,width:80,depth:80,height:350,transmissionPermille:700}
 ]
});
assert.equal(TERRARIUM_PIXEL_SPRITES_V03G_VERSION,'0.3g');
const scene=create();
const cameraTop=createTerrariumRenderCameraV03e({
 view:'top',width:960,height:600,padding:30
});
const cameraTilt=createTerrariumRenderCameraV03e({
 view:'oblique',width:960,height:600,padding:30
});
const frame=projectTerrariumSceneForRenderV03e(scene,{camera:cameraTop});
const angled=projectTerrariumSceneForRenderV03e(scene,{camera:cameraTilt});
const serialized=JSON.stringify(scene);
const a=buildTerrariumPixelSpritesV03g(frame);
const b=buildTerrariumPixelSpritesV03g(frame);
const l=buildTerrariumPixelSpritesV03g(frame,{detail:'low'});
assert.deepEqual(a,b,'original pixel silhouettes must be deterministic');
assert.equal(a.version,'0.3g');
assert.equal(a.zones.length,5);
assert.equal(a.objects.length,3);
assert.equal(a.mounts.length,1);
assert.equal(a.zones[2].kind,null,
 'non-planted water zone must not invent live plant');
assert.deepEqual(a.zones[2].tiles,[]);
assert.equal(a.zones[0].kind,'moss');
assert.equal(a.zones[1].kind,'fern');
assert.equal(a.zones[3].kind,'moss');
assert.equal(a.objects.find(o=>o.id==='rock_1').kind,'rock');
assert.equal(a.objects.find(o=>o.id==='tree_1').kind,'canopy');
assert.equal(a.objects.find(o=>o.id==='mesh_1').kind,'screen');
assert.equal(a.mounts[0].kind,'lamp');
assert.ok(a.zones[0].tiles.length>10);
assert.ok(a.zones[1].tiles.length>10);
assert.ok(a.objects.every(o=>o.tiles.length>10));
assert.ok(a.mounts.every(m=>m.tiles.length>10));
assert.ok(a.zones[0].tiles.length>=l.zones[0].tiles.length);
assert.ok(a.objects[0].tiles.length>l.objects[0].tiles.length,
 'low-detail should reduce highlight cells');
assert.ok(Object.isFrozen(a));
assert.ok(Object.isFrozen(a.zones));
assert.ok(Object.isFrozen(a.zones[1].tiles));
assert.ok(Object.isFrozen(a.zones[1].tiles[0]));
assert.ok(a.zones[1].tiles.every(t=>/^#[0-9a-f]{6}$/i.test(t.fill)));
assert.ok(a.objects.every(o=>o.tiles.every(t=>
 Number.isFinite(t.x)&&Number.isFinite(t.y)&&t.width>0)));
assert.equal(JSON.stringify(scene),serialized,
 'painting cannot change animal habitat or the original ecology state');
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',
 object:{...scene.objects.find(o=>o.id==='rock_1'),x:660}
});
const movedSprite=buildTerrariumPixelSpritesV03g(
 projectTerrariumSceneForRenderV03e(moved,{camera:cameraTop}));
assert.notDeepEqual(
 a.objects.find(o=>o.id==='rock_1').tiles,
 movedSprite.objects.find(o=>o.id==='rock_1').tiles,
 'sprite should follow V0.3d movement automatically');
assert.deepEqual(
 a.objects.find(o=>o.id==='tree_1').tiles,
 movedSprite.objects.find(o=>o.id==='tree_1').tiles,
 'other objects stay where world-owned coordinates place them');
const tilted=buildTerrariumPixelSpritesV03g(angled);
assert.notDeepEqual(a.objects[0].tiles,tilted.objects[0].tiles,
 'changing camera must move the projected art');
assert.equal(
 angled.zones[3].actualLightUnits,
 frame.zones[3].actualLightUnits,
 'art camera cannot affect the real ecological light');
const zero=Object.freeze({...frame,zones:frame.zones.map((z,i)=>
 i===1?Object.freeze({...z,plantCoverUnits:0}):z)});
const noFern=buildTerrariumPixelSpritesV03g(zero);
assert.equal(noFern.zones[1].kind,null);
assert.deepEqual(noFern.zones[1].tiles,[]);
const noMoss=Object.freeze({...frame,zones:frame.zones.map((z,i)=>
 i===0?Object.freeze({...z,plantCoverUnits:0}):z)});
assert.equal(buildTerrariumPixelSpritesV03g(noMoss).zones[0].tiles.length,0);
for(const cb of [
 ()=>buildTerrariumPixelSpritesV03g({},{}),
 ()=>buildTerrariumPixelSpritesV03g(frame,{detail:'ultra'}),
 ()=>buildTerrariumPixelSpritesV03g(frame,{tileSize:1}),
 ()=>buildTerrariumPixelSpritesV03g(frame,{tileSize:100}),
 ()=>buildTerrariumPixelSpritesV03g({
  ...frame,zones:[{...frame.zones[0],plantCoverUnits:-1}]
 }),
 ()=>buildTerrariumPixelSpritesV03g({
  ...frame,objects:[{...frame.objects[0],kind:'unregistered'}]
 })
])assert.throws(cb,RangeError);
console.log('PASS V0.3g original pixel silhouettes: 5 zones, 3 object materials, source-owned plants, low detail, two cameras, moved geometry, immutable ecology, and input rejection');
