import assert from 'node:assert/strict';
import {
 createTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent,
 isValidTerrariumSceneGeometryV03d
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createTerrariumRenderCameraV03e,
 projectTerrariumSceneForRenderV03e,
 projectTerrariumWorldPointV03e
} from '../src/ohm-core/terrarium-scene-render-projection-v03e.mjs';
import {
 TERRARIUM_PIXEL_VISUAL_V03F_VERSION,
 buildTerrariumPixelVisualV03f,
 listTerrariumTouchTargetsV03f,
 resolveTerrariumTouchSelectionV03f
} from '../src/ohm-core/terrarium-pixel-visual-v03f.mjs';
const source=createTerrariumSceneGeometryV03d({
 sceneId:'visual_qa',baseOptions:{
  biotaOptions:{
   environmentOptions:{
    microclimateOptions:{columns:5,rows:1,
     ambient:{temperatureC:24,relativeHumidity:.52}},
    substrateOptions:{zones:Array.from({length:5},()=>({
     surfaceWaterUnits:600,rootWaterUnits:1400,
     percolationPermille:0,lateralPermille:0
    }))}
   },
   zoneConfigs:[
    {plantKind:'moss',plantCoverUnits:150,litterUnits:250},
    {plantKind:'fern',plantCoverUnits:260,litterUnits:200},
    {plantKind:'none',plantCoverUnits:0,litterUnits:100},
    {plantKind:'moss',plantCoverUnits:360,litterUnits:300},
    {plantKind:'fern',plantCoverUnits:280,litterUnits:250}
   ]
  },
  fixtures:[{
   id:'daylight',type:'daylight_proxy',zoneIndex:2,strengthUnits:950,
   spreadZones:4,heightUnits:0,startMinute:0,durationMinutes:1440
  }]
 },
 mounts:[{fixtureId:'daylight',x:500,y:200,height:800}],
 objects:[{
  id:'stone',kind:'rock_overhang',x:570,y:120,width:60,
  depth:160,height:500,transmissionPermille:0
 },{
  id:'leaf',kind:'canopy',x:100,y:80,width:125,
  depth:100,height:270,transmissionPermille:600
 }]
});
assert.equal(isValidTerrariumSceneGeometryV03d(source),true);
assert.equal(TERRARIUM_PIXEL_VISUAL_V03F_VERSION,'0.3f');
const cameras=[
 createTerrariumRenderCameraV03e({
  view:'top',width:960,height:600,padding:30
 }),
 createTerrariumRenderCameraV03e({
  view:'oblique',width:960,height:600,padding:30
 })
];
const top=projectTerrariumSceneForRenderV03e(source,{camera:cameras[0]});
const angled=projectTerrariumSceneForRenderV03e(source,{camera:cameras[1]});
const snapshot=JSON.stringify(source);
for(const frame of [top,angled]){
 const a=buildTerrariumPixelVisualV03f(frame);
 const again=buildTerrariumPixelVisualV03f(frame);
 const low=buildTerrariumPixelVisualV03f(frame,{detail:'low'});
 assert.deepEqual(a,again,'visual texture must be stable');
 assert.equal(a.version,'0.3f');
 assert.equal(a.zones.length,5);
 assert.equal(a.objects.length,2);
 assert.equal(a.palette,'woodland');
 assert.ok(a.zones.every(x=>x.stamps.length>0));
 assert.ok(a.objects.every(x=>x.stamps.length>0));
 assert.ok(Object.isFrozen(a));
 assert.ok(Object.isFrozen(a.zones));
 assert.ok(Object.isFrozen(a.objects[0].stamps[0]));
 assert.ok(a.zones[3].stamps.length>low.zones[3].stamps.length,
  'low visual detail must actually reduce drawn stamps');
 const rock=a.objects.find(o=>o.id==='stone');
 const tree=a.objects.find(o=>o.id==='leaf');
 assert.ok(rock.stamps.every(x=>/^#[a-f0-9]{6}$/.test(x.fill)));
 assert.notDeepEqual(
  [...new Set(rock.stamps.map(x=>x.fill))],
  [...new Set(tree.stamps.map(x=>x.fill))],
  'rock and canopy require distinct art palettes');
 assert.ok(a.zones[2].plantKind==='none',
  'empty water zone cannot pretend to be a live fern');
 assert.ok(rock.stamps.every(x=>Number.isFinite(x.x)&&Number.isFinite(x.y)));
}
const zeroCoverFrame=Object.freeze({...top,
 zones:top.zones.map((z,i)=>i===3?
  Object.freeze({...z,plantCoverUnits:0}):z)});
assert.equal(buildTerrariumPixelVisualV03f(zeroCoverFrame)
 .zones[3].stamps.length,0,
 'zero ecological plant cover must not yield phantom living vegetation stamps');
assert.equal(JSON.stringify(source),snapshot,
 'visual generation cannot mutate ecology source');
assert.notDeepEqual(
 buildTerrariumPixelVisualV03f(top).objects[0].stamps,
 buildTerrariumPixelVisualV03f(angled).objects[0].stamps,
 'decorative pixels must move with the changed camera');
const moved=applyTerrariumSceneGeometryV03dEvent(source,{
 channel:'object',type:'upsert',
 object:{...source.objects[0],x:640}
});
const movedFrame=projectTerrariumSceneForRenderV03e(moved,{camera:cameras[0]});
const oldStamp=buildTerrariumPixelVisualV03f(top).objects.find(o=>o.id==='stone');
const newStamp=buildTerrariumPixelVisualV03f(movedFrame).objects.find(o=>o.id==='stone');
assert.notDeepEqual(oldStamp.stamps,newStamp.stamps,
 'no artistic pixel coordinates may remain at old world position');
assert.deepEqual(
 buildTerrariumPixelVisualV03f(top),
 buildTerrariumPixelVisualV03f(top),
 'seed cannot depend on global RNG');
assert.ok(Object.isFrozen(top));
const zonePoint=projectTerrariumWorldPointV03e(cameras[0],{
 x:900,y:380,z:0
});
const zoneHits=listTerrariumTouchTargetsV03f(top,{
 x:zonePoint.x,y:zonePoint.y
});
assert.deepEqual(zoneHits,[{type:'zone',id:'zone_4'}]);
const object=top.objects.find(o=>o.id==='stone');
const center=object.roof.reduce((a,p)=>({
 x:a.x+p.x/4,y:a.y+p.y/4
}),{x:0,y:0});
const hits=listTerrariumTouchTargetsV03f(top,center);
assert.equal(hits[0].type,'object');
assert.equal(hits[0].id,'stone');
const overlap=applyTerrariumSceneGeometryV03dEvent(source,{
 channel:'object',type:'upsert',object:{
  ...source.objects[0],id:'rock_copy'
 }
});
const stack=projectTerrariumSceneForRenderV03e(overlap,{camera:cameras[0]});
const both=listTerrariumTouchTargetsV03f(stack,center);
assert.ok(both.some(x=>x.id==='stone'));
assert.ok(both.some(x=>x.id==='rock_copy'));
assert.equal(both.length,2);
const first=resolveTerrariumTouchSelectionV03f(stack,center);
const second=resolveTerrariumTouchSelectionV03f(stack,{
 ...center,selected:first.selected,previousTap:center
});
assert.notDeepEqual(first.selected,second.selected,
 'repeated tap at overlapped location must cycle the target');
assert.equal(second.cycled,true);
const far=resolveTerrariumTouchSelectionV03f(stack,{
 x:center.x+100,y:center.y+100,
 selected:first.selected,previousTap:center
});
assert.equal(far.cycled,false);
const bare=resolveTerrariumTouchSelectionV03f(top,{
 x:-500,y:-500
});
assert.equal(bare.selected,null);
assert.equal(bare.options.length,0);
const lamp=top.mounts[0].light;
assert.deepEqual(listTerrariumTouchTargetsV03f(top,{
 x:lamp.x,y:lamp.y
})[0],{type:'mount',id:'daylight'});
const expanded=listTerrariumTouchTargetsV03f(top,{
 x:lamp.x+16,y:lamp.y+12
});
assert.ok(expanded.some(x=>x.type==='mount'));
const partialFrame=Object.freeze({...top,
 zones:top.zones.map(z=>Object.freeze({...z,
  plantCoverUnits:600}))});
const detailed=buildTerrariumPixelVisualV03f(partialFrame,{pixelSize:8});
assert.ok(detailed.zones[1].stamps.length>0);
for(const call of [
 ()=>buildTerrariumPixelVisualV03f({},{}),
 ()=>buildTerrariumPixelVisualV03f(top,{pixelSize:1}),
 ()=>buildTerrariumPixelVisualV03f(top,{pixelSize:21}),
 ()=>buildTerrariumPixelVisualV03f(top,{detail:'high'}),
 ()=>buildTerrariumPixelVisualV03f(top,{palette:'unknown'}),
 ()=>listTerrariumTouchTargetsV03f(top,{x:NaN,y:0}),
 ()=>listTerrariumTouchTargetsV03f(top,{x:0,y:0,radius:200}),
 ()=>resolveTerrariumTouchSelectionV03f(top,{
  x:2,y:3,previousTap:{x:'bad',y:3}
 }),
 ()=>resolveTerrariumTouchSelectionV03f(top,{
  x:2,y:3,selected:{type:'unknown',id:'a'}
 })
])assert.throws(call,RangeError);
console.log('PASS V0.3f pixel style: seeded zone/object art, low-detail budget, moving camera/geometry sync, immutability, overlap cycle, accessible tap size and invalid input');
