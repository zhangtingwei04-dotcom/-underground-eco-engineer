import assert from 'node:assert/strict';
import {
 createTerrariumSceneGeometryV03d,
 isValidTerrariumSceneGeometryV03d,
 advanceTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 TERRARIUM_SCENE_RENDER_V03E_VERSION,
 createTerrariumRenderCameraV03e,
 isValidTerrariumRenderCameraV03e,
 projectTerrariumWorldPointV03e,
 projectTerrariumSceneForRenderV03e,
 terrariumScreenDeltaToWorldV03e,
 terrariumScreenPointToGroundV03e,
 hitTestTerrariumRenderV03e,
 moveTerrariumSceneObjectByScreenDeltaV03e,
 moveTerrariumLightByScreenDeltaV03e
} from '../src/ohm-core/terrarium-scene-render-projection-v03e.mjs';

const settings={
 sceneId:'scene_v03e',
 baseOptions:{
  biotaOptions:{
   environmentOptions:{
    microclimateOptions:{columns:5,rows:1,
     ambient:{temperatureC:24,relativeHumidity:.52}},
    substrateOptions:{zones:Array.from({length:5},()=>({
     surfaceWaterUnits:640,rootWaterUnits:1600,
     percolationPermille:0,lateralPermille:0
    }))}
   },
   zoneConfigs:[
    {plantKind:'moss',plantCoverUnits:140,litterUnits:350},
    {plantKind:'fern',plantCoverUnits:210,litterUnits:440},
    {plantKind:'none',plantCoverUnits:0,litterUnits:300},
    {plantKind:'moss',plantCoverUnits:250,litterUnits:950},
    {plantKind:'fern',plantCoverUnits:320,litterUnits:600}
   ]
  },
  fixtures:[{id:'daylight',type:'daylight_proxy',zoneIndex:2,
   strengthUnits:950,spreadZones:4,heightUnits:0,
   startMinute:0,durationMinutes:1440}]
 },
 mounts:[{fixtureId:'daylight',x:500,y:200,height:800}],
 objects:[{
  id:'roof',kind:'rock_overhang',x:570,y:120,width:60,
  depth:160,height:500,transmissionPermille:0
 },{
  id:'moss_canopy',kind:'canopy',x:100,y:90,width:130,
  depth:90,height:270,transmissionPermille:600
 }]
};
const source=createTerrariumSceneGeometryV03d(settings);
assert.equal(isValidTerrariumSceneGeometryV03d(source),true);
assert.equal(TERRARIUM_SCENE_RENDER_V03E_VERSION,'0.3e');
const cameraTop=createTerrariumRenderCameraV03e({
 view:'top',width:1000,height:500,padding:20
});
const cameraTilt=createTerrariumRenderCameraV03e({
 view:'oblique',width:950,height:600,padding:25
});
assert.ok(isValidTerrariumRenderCameraV03e(cameraTop));
assert.ok(isValidTerrariumRenderCameraV03e(cameraTilt));
assert.ok(Object.isFrozen(cameraTilt));
const top=projectTerrariumSceneForRenderV03e(source,{camera:cameraTop});
const oblique=projectTerrariumSceneForRenderV03e(source,{camera:cameraTilt});
assert.equal(top.version,'0.3e');
assert.equal(top.sceneId,source.sceneId);
assert.equal(top.zones.length,5);
assert.equal(oblique.objects.length,2);
assert.equal(top.mounts.length,1);
assert.deepEqual(top.zones.map(z=>z.id),source.zones.map(z=>z.id));
assert.deepEqual(top.objects.map(o=>o.id),['moss_canopy','roof'],
 'render order determined by world y, not mutation/creation order');
assert.equal(oblique.objects[0].faces.length,2);
assert.equal(top.objects[0].faces.length,0);
assert.equal(top.objects.find(o=>o.id==='roof').world.x,570);
assert.equal(oblique.objects.find(o=>o.id==='roof').world.x,570);
assert.equal(oblique.objects.find(o=>o.id==='roof').height,500);
assert.equal(oblique.objects.find(o=>o.id==='roof').transmissionPermille,0);
assert.equal(top.zones[3].rawLightUnits,
 oblique.zones[3].rawLightUnits);
assert.equal(top.zones[3].actualLightUnits,
 oblique.zones[3].actualLightUnits);
assert.equal(top.zones[3].transmissionPermille,
 source.base.transmissionByZone[3]);
assert.ok(top.zones[3].actualLightUnits<top.zones[3].rawLightUnits);
assert.ok(Object.isFrozen(top));
assert.ok(Object.isFrozen(top.objects[0].roof));
assert.ok(Object.isFrozen(top.zones[0].world));
const snapshot=JSON.stringify(source);
assert.deepEqual(top,projectTerrariumSceneForRenderV03e(source,{camera:cameraTop}),
 'projection deterministic');
assert.equal(JSON.stringify(source),snapshot,
 'rendering never changes the true scene');
assert.ok(top.objects[0].roof.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)));
assert.notDeepEqual(top.objects.find(o=>o.id==='roof').roof,
 oblique.objects.find(o=>o.id==='roof').roof,
 '2.5D oblique view genuinely lifts roofs');

for(const camera of [cameraTop,cameraTilt]){
 for(const point of [
  {x:0,y:0,z:0},{x:500,y:200,z:0},
  {x:820,y:330,z:0},{x:1000,y:400,z:0}
 ]){
  const screen=projectTerrariumWorldPointV03e(camera,point);
  const ground=terrariumScreenPointToGroundV03e(camera,screen);
  assert.ok(Math.abs(ground.x-point.x)<1e-7);
  assert.ok(Math.abs(ground.y-point.y)<1e-7);
 }
 const screenCenter=projectTerrariumWorldPointV03e(camera,{x:500,y:200,z:0});
 const screenEnd=projectTerrariumWorldPointV03e(camera,{x:600,y:260,z:0});
 const delta=terrariumScreenDeltaToWorldV03e(camera,{
  dx:screenEnd.x-screenCenter.x,dy:screenEnd.y-screenCenter.y
 });
 assert.ok(Math.abs(delta.dx-100)<1e-6);
 assert.ok(Math.abs(delta.dy-60)<1e-6);
}
const roof=top.objects.find(o=>o.id==='roof');
const middle=roof.roof.reduce((s,p)=>({
 x:s.x+p.x/4,y:s.y+p.y/4
}),{x:0,y:0});
assert.deepEqual(hitTestTerrariumRenderV03e(top,middle),
 {type:'object',id:'roof'});
const roofTilt=oblique.objects.find(o=>o.id==='roof');
const topCenter=roofTilt.roof.reduce((s,p)=>({
 x:s.x+p.x/4,y:s.y+p.y/4
}),{x:0,y:0});
assert.deepEqual(hitTestTerrariumRenderV03e(oblique,topCenter),
 {type:'object',id:'roof'});
const lampTop=top.mounts[0].light;
assert.deepEqual(hitTestTerrariumRenderV03e(top,{
 x:lampTop.x,y:lampTop.y}),{type:'mount',id:'daylight'});
const clearZone=projectTerrariumWorldPointV03e(cameraTop,{
 x:900,y:340,z:0
});
assert.deepEqual(hitTestTerrariumRenderV03e(top,clearZone),
 {type:'zone',id:'zone_4'});
assert.equal(hitTestTerrariumRenderV03e(top,{x:-1000,y:-1000}),null);

const oldOrganic=JSON.stringify(source.base.biota.ledger);
const oldWater=JSON.stringify(source.base.biota.environment.substrate.ledger);
const oldObject=source.objects.find(o=>o.id==='roof');
const xy0=projectTerrariumWorldPointV03e(cameraTilt,{x:100,y:100,z:0});
const xy1=projectTerrariumWorldPointV03e(cameraTilt,{x:210,y:150,z:0});
const shifted=moveTerrariumSceneObjectByScreenDeltaV03e(source,{
 id:'roof',camera:cameraTilt,
 dx:xy1.x-xy0.x,dy:xy1.y-xy0.y
});
assert.equal(isValidTerrariumSceneGeometryV03d(shifted),true);
const newObject=shifted.objects.find(o=>o.id==='roof');
assert.equal(newObject.x,680);
assert.equal(newObject.y,170);
assert.equal(newObject.height,oldObject.height);
assert.equal(newObject.width,oldObject.width);
assert.equal(source.objects.find(o=>o.id==='roof').x,570);
assert.equal(shifted.minute,source.minute,'UI drag does not tick ecology');
assert.equal(JSON.stringify(shifted.base.biota.ledger),oldOrganic);
assert.equal(JSON.stringify(shifted.base.biota.environment.substrate.ledger),oldWater);
const shiftedFrame=projectTerrariumSceneForRenderV03e(shifted,{camera:cameraTilt});
assert.notDeepEqual(shiftedFrame.objects.find(o=>o.id==='roof').roof,
 oblique.objects.find(o=>o.id==='roof').roof);
assert.notDeepEqual(shifted.base.transmissionByZone,
 source.base.transmissionByZone,
 'moving scene geometry alters the ORIGINAL plant light contract');
const restored=moveTerrariumSceneObjectByScreenDeltaV03e(shifted,{
 id:'roof',camera:cameraTilt,
 dx:xy0.x-xy1.x,dy:xy0.y-xy1.y
});
assert.equal(restored.objects.find(o=>o.id==='roof').x,570);
assert.equal(restored.objects.find(o=>o.id==='roof').y,120);
assert.deepEqual(restored.base.transmissionByZone,source.base.transmissionByZone);
const nothing=moveTerrariumSceneObjectByScreenDeltaV03e(source,{
 id:'roof',camera:cameraTop,dx:0,dy:0
});
assert.equal(nothing,source,'zero-delta no-op reuses same immutable scene');
const movedLamp=moveTerrariumLightByScreenDeltaV03e(source,{
 fixtureId:'daylight',camera:cameraTop,dx:120,dy:0
});
assert.equal(movedLamp.mounts[0].x,625);
assert.equal(movedLamp.mounts[0].y,200);
assert.notEqual(movedLamp.base.transmissionByZone[3],
 source.base.transmissionByZone[3],
 'moving light changes the same canonical visibility calculation');
assert.equal(JSON.stringify(movedLamp.base.biota.ledger),oldOrganic);
assert.equal(JSON.stringify(movedLamp.base.biota.environment.substrate.ledger),oldWater);
const night=advanceTerrariumSceneGeometryV03d(source,{minutes:120});
assert.equal(isValidTerrariumSceneGeometryV03d(night),true);
const nightRender=projectTerrariumSceneForRenderV03e(night,{camera:cameraTilt});
assert.equal(nightRender.minute,120);
assert.equal(nightRender.zones[0].plantCoverUnits,
 night.base.biota.zones[0].plant.coverUnits);
const withLeaf=applyTerrariumSceneGeometryV03dEvent(source,{
 channel:'base',event:{channel:'organic',type:'litter_input',
 eventId:'leaf_v03e',minute:0,zoneId:'zone_3',amountUnits:200,
 source:{kind:'player_placement',referenceId:'demo_v03e'}}
});
assert.equal(projectTerrariumSceneForRenderV03e(withLeaf,{
 camera:cameraTop}).organicReceipts,1);

for(const cb of [
 ()=>createTerrariumRenderCameraV03e({view:'3d'}),
 ()=>createTerrariumRenderCameraV03e({height:20}),
 ()=>createTerrariumRenderCameraV03e({width:0}),
 ()=>createTerrariumRenderCameraV03e({padding:800}),
 ()=>projectTerrariumWorldPointV03e(cameraTop,{x:1001,y:0}),
 ()=>terrariumScreenDeltaToWorldV03e(cameraTilt,{dx:NaN,dy:1}),
 ()=>terrariumScreenPointToGroundV03e(cameraTop,{x:5,y:Infinity}),
 ()=>projectTerrariumSceneForRenderV03e({},{camera:cameraTop}),
 ()=>hitTestTerrariumRenderV03e({}, {x:10,y:10}),
 ()=>hitTestTerrariumRenderV03e(top,{x:1,y:2,hitRadius:-1}),
 ()=>moveTerrariumSceneObjectByScreenDeltaV03e(source,{
  id:'ghost',dx:1,dy:0,camera:cameraTilt
 }),
 ()=>moveTerrariumLightByScreenDeltaV03e(source,{
  fixtureId:'bad',dx:0,dy:0,camera:cameraTop
 })
])assert.throws(cb,RangeError);
console.log('PASS V0.3e: world-owned top/oblique projections, reversible screen transforms, hit picking, coordinate drag from real geometry, light/water/organic single owners, JSON and time snapshots');
