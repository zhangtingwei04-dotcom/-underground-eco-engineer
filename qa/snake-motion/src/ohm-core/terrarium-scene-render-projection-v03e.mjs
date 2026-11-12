/**
 * OHM ECO V0.3e: portable scene -> renderer coordinate contract.
 *
 * Visual pixels NEVER own world positions. Only V0.3d owns objects, zones,
 * mounts and ecology. This module projects that state into deterministic
 * top-down or schematic 2.5D polygons and maps pointer drag back to the
 * existing validated V0.3d event API.
 *
 * Pure JS: no Canvas, Phaser, DOM, WebGL, clock, storage or network calls.
 * NOT a full 3D camera, pixel art, ray-traced shadows or plant physiology.
 */
import {
 isValidTerrariumSceneGeometryV03d,
 inspectTerrariumSceneGeometryV03d,
 applyTerrariumSceneGeometryV03dEvent
} from './terrarium-scene-geometry-v03d.mjs';

export const TERRARIUM_SCENE_RENDER_V03E_VERSION='0.3e';
const F=Object.freeze;
const bad=(name)=>{throw new RangeError(name)};
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
const int=(x,low,high)=>Number.isSafeInteger(x)&&x>=low&&x<=high;
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const exact=(x,keys)=>obj(x)&&Object.keys(x).every(k=>keys.includes(k));
const kinds=['top','oblique'];
const freezePts=points=>F(points.map(p=>F(p)));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));

export function createTerrariumRenderCameraV03e({
 view='oblique',width=900,height=540,padding=25
}={}){
 if(!kinds.includes(view)||!int(width,240,2000)||
    !int(height,180,1200)||!int(padding,0,80)||
    width-2*padding<100||height-2*padding<100)
   bad('invalid_renderer_camera');
 return F({view,width,height,padding,
  worldWidth:1000,worldDepth:400,
  renderer:'schematic_affine_2_5d_or_orthographic_top'});
}
function axes(camera){
 if(!isValidTerrariumRenderCameraV03e(camera))bad('invalid_camera');
 const {view,width:w,height:h,padding:p}=camera;
 if(view==='top')return {
  ox:p,oy:p,
  ax:(w-2*p)/1000,ay:0,bx:0,by:(h-2*p)/400,zScale:0
 };
 return {
  ox:w/2,oy:h*.61,
  ax:(w-2*p)*.70/1000,ay:(h-2*p)*.13/1000,
  bx:(w-2*p)*.20/400,by:(h-2*p)*.32/400,
  zScale:(h-2*p)*.36/1000
 };
}
export function isValidTerrariumRenderCameraV03e(c){
 return exact(c,['view','width','height','padding',
   'worldWidth','worldDepth','renderer'])&&
 kinds.includes(c.view)&&int(c.width,240,2000)&&
 int(c.height,180,1200)&&int(c.padding,0,80)&&
 c.width-2*c.padding>=100&&c.height-2*c.padding>=100&&
 c.worldWidth===1000&&c.worldDepth===400&&
 c.renderer==='schematic_affine_2_5d_or_orthographic_top';
}
function project(camera,x,y,z){
 const a=axes(camera);
 if(!finite(x)||!finite(y)||!finite(z))bad('invalid_world_point');
 const px=camera.view==='top'?x:x-500;
 const py=camera.view==='top'?y:y-200;
 return F({x:a.ox+a.ax*px+a.bx*py,
  y:a.oy+a.ay*px+a.by*py-a.zScale*z});
}
export function projectTerrariumWorldPointV03e(camera,{x,y,z=0}={}){
 if(!finite(x)||!finite(y)||!finite(z)||
    x<0||x>1000||y<0||y>400||z<0||z>2000)
   bad('invalid_world_point');
 return project(camera,x,y,z);
}
/** Delta inverse stays stable when dragging a roof or elevated object:
 * the drag changes the world FOOTPRINT, preserving the original z.
 */
export function terrariumScreenDeltaToWorldV03e(camera,{dx,dy}={}){
 const a=axes(camera);
 if(!finite(dx)||!finite(dy))bad('invalid_pointer_delta');
 const det=a.ax*a.by-a.ay*a.bx;
 if(Math.abs(det)<1e-10)bad('degenerate_camera');
 return F({dx:(dx*a.by-dy*a.bx)/det,
  dy:(dy*a.ax-dx*a.ay)/det});
}
export function terrariumScreenPointToGroundV03e(camera,{x,y}={}){
 const a=axes(camera);
 if(!finite(x)||!finite(y))bad('invalid_pointer_point');
 const dx=x-a.ox,dy=y-a.oy;
 const world=terrariumScreenDeltaToWorldV03e(camera,{dx,dy});
 return F({x:world.dx+(camera.view==='top'?0:500),
  y:world.dy+(camera.view==='top'?0:200)});
}
const boxCorners=(x,y,width,depth,z,camera)=>freezePts([
 project(camera,x,y,z),
 project(camera,x+width,y,z),
 project(camera,x+width,y+depth,z),
 project(camera,x,y+depth,z)
]);
function projectedObject(o,camera){
 const ground=boxCorners(o.x,o.y,o.width,o.depth,0,camera);
 const roof=boxCorners(o.x,o.y,o.width,o.depth,o.height,camera);
 const faces=camera.view==='top'?F([]):F([
  F({side:'right',polygon:freezePts([ground[1],ground[2],roof[2],roof[1]])}),
  F({side:'front',polygon:freezePts([ground[2],ground[3],roof[3],roof[2]])})
 ]);
 return F({
  id:o.id,kind:o.kind,
  world:F({...o}),
  floor:ground,roof,faces,
  depthKey:o.y+o.depth/2,
  height:o.height,transmissionPermille:o.transmissionPermille
 });
}
function fromScene(scene,camera){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
    !isValidTerrariumRenderCameraV03e(camera))
   bad('invalid_render_scene');
 const inspection=inspectTerrariumSceneGeometryV03d(scene);
 const zones=F(inspection.zones.map((z,i)=>F({
  id:z.id,world:F({...z}),
  polygon:boxCorners(z.x,z.y,z.width,z.depth,0,camera),
  plantKind:inspection.biota.zones[i].plant.kind,
  plantCoverUnits:inspection.biota.zones[i].plant.coverUnits,
  plantActivity:inspection.biota.zones[i].plantActivity,
  rootMoistureIndex:inspection.biota.zones[i].signals.rootMoistureIndex,
  rawLightUnits:inspection.rawLightUnitsByZone[i],
  actualLightUnits:inspection.actualLightUnitsByZone[i],
  transmissionPermille:inspection.transmissionByZone[i]
 })));
 const objects=F(inspection.objects.map(o=>
  projectedObject(o,camera)).sort((a,b)=>a.depthKey-b.depthKey||
   a.id.localeCompare(b.id)));
 const mounts=F(inspection.mounts.map(m=>F({
  fixtureId:m.fixtureId,world:F({...m}),
  base:project(camera,m.x,m.y,0),
  light:project(camera,m.x,m.y,m.height)
 })));
 return F({
  version:TERRARIUM_SCENE_RENDER_V03E_VERSION,
  camera,sceneId:scene.sceneId,
  minute:inspection.minute,revision:inspection.revision,
  bounds:inspection.bounds,
  zones,objects,mounts,
  organicReceipts:inspection.organicReceipts.length,
  organicLedger:inspection.biota.organicLedger,
  sceneModel:inspection.modelStatus,
  visualStatus:'render_projection_not_anatomic_photometric_or_3d_mesh'
 });
}
export function projectTerrariumSceneForRenderV03e(scene,{
 camera=createTerrariumRenderCameraV03e()
}={}){
 return fromScene(scene,camera);
}
function pointInPolygon(point,polygon){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  const cross=(a.x-b.x)*(point.y-b.y)-
    (a.y-b.y)*(point.x-b.x);
  if(Math.abs(cross)<1e-8&&
     point.x>=Math.min(a.x,b.x)-1e-8&&
     point.x<=Math.max(a.x,b.x)+1e-8&&
     point.y>=Math.min(a.y,b.y)-1e-8&&
     point.y<=Math.max(a.y,b.y)+1e-8)return true;
  const hit=(a.y>point.y)!==(b.y>point.y)&&
    point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x;
  if(hit)inside=!inside;
 }
 return inside;
}
export function hitTestTerrariumRenderV03e(frame,{x,y,hitRadius=15}={}){
 if(!obj(frame)||frame.version!==TERRARIUM_SCENE_RENDER_V03E_VERSION||
    !isValidTerrariumRenderCameraV03e(frame.camera)||
    !finite(x)||!finite(y)||!finite(hitRadius)||
    hitRadius<0||hitRadius>100||
    !Array.isArray(frame.objects)||!Array.isArray(frame.zones)||
    !Array.isArray(frame.mounts))bad('invalid_renderer_hit_test');
 for(let i=frame.mounts.length-1;i>=0;i--){
  const m=frame.mounts[i];
  if(Math.hypot(x-m.light.x,y-m.light.y)<=hitRadius)
   return F({type:'mount',id:m.fixtureId});
 }
 for(let i=frame.objects.length-1;i>=0;i--){
  const o=frame.objects[i];
  if(pointInPolygon({x,y},o.roof)||
     o.faces.some(face=>pointInPolygon({x,y},face.polygon)))
   return F({type:'object',id:o.id});
 }
 for(let i=0;i<frame.zones.length;i++){
  if(pointInPolygon({x,y},frame.zones[i].polygon))
   return F({type:'zone',id:frame.zones[i].id});
 }
 return null;
}
export function moveTerrariumSceneObjectByScreenDeltaV03e(scene,{
 id,dx,dy,camera
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
    !isValidTerrariumRenderCameraV03e(camera)||
    typeof id!=='string')bad('invalid_scene_drag');
 const object=scene.objects.find(o=>o.id===id);
 if(!object)bad('unknown_scene_object');
 const delta=terrariumScreenDeltaToWorldV03e(camera,{dx,dy});
 const x=clamp(Math.round(object.x+delta.dx),0,1000-object.width);
 const y=clamp(Math.round(object.y+delta.dy),0,400-object.depth);
 if(x===object.x&&y===object.y)return scene;
 return applyTerrariumSceneGeometryV03dEvent(scene,{
  channel:'object',type:'upsert',object:{...object,x,y}
 });
}
export function moveTerrariumLightByScreenDeltaV03e(scene,{
 fixtureId,dx,dy,camera
}={}){
 if(!isValidTerrariumSceneGeometryV03d(scene)||
    !isValidTerrariumRenderCameraV03e(camera)||
    typeof fixtureId!=='string')bad('invalid_light_drag');
 const mount=scene.mounts.find(x=>x.fixtureId===fixtureId);
 if(!mount)bad('unknown_light_mount');
 const delta=terrariumScreenDeltaToWorldV03e(camera,{dx,dy});
 const x=clamp(Math.round(mount.x+delta.dx),0,1000);
 const y=clamp(Math.round(mount.y+delta.dy),0,400);
 if(x===mount.x&&y===mount.y)return scene;
 return applyTerrariumSceneGeometryV03dEvent(scene,{
  channel:'mount',type:'upsert',mount:{...mount,x,y}
 });
}
