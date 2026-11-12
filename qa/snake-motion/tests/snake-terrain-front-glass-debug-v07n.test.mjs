import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {createSnakeTerrainMeshV07m}
 from '../src/ohm-core/snake-terrain-triangle-mesh-v07m.mjs';
import {projectSnakeFrontGlassPointV07g}
 from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';
import {
 createSnakeTerrainDebugV07n,SNAKE_TERRAIN_DEBUG_VERSION
} from '../src/ohm-core/snake-terrain-front-glass-debug-v07n.mjs';

const stone={id:'rear_stone_02',kind:'rock_overhang',
 x:390,y:10,width:108,depth:70,height:190,transmissionPermille:0};
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'terrain_debug_v07n_test',objects:[stone]
});
const before=JSON.stringify(scene);
const ground={
 authority:'explicit_lab_heightfield_unmeasured',
 xStops:[-4,0,4],yStops:[-1.6,0,1.6],
 zRows:[[0,0,0],[0,.07,0],[0,0,0]]
};
const cave={
 id:'rear_cave_probe',objectId:stone.id,
 floorCorners:[0,0,0,0],roofCorners:[.40,.40,.40,.40],
 authority:'explicit_lab_shell_unmeasured'
};
const mesh=createSnakeTerrainMeshV07m(scene,{ground,caves:[cave]});
const input=JSON.stringify(mesh);
const overlay=createSnakeTerrainDebugV07n({scene,mesh});
assert.equal(SNAKE_TERRAIN_DEBUG_VERSION,'0.7N');
assert.equal(overlay.version,'0.7N');
assert.equal(overlay.sourceVersion,'0.7M');
assert.equal(overlay.sceneId,scene.sceneId);
assert.equal(overlay.sceneRevision,scene.revision);
assert.equal(overlay.camera,'V0.7G_front_glass');
assert.equal(overlay.skinApplied,false);
assert.equal(overlay.playablePassageAuthorized,false);
assert.equal(overlay.affectsCollision,false);
assert.equal(overlay.affectsEcology,false);
assert.equal(overlay.debugOnly,true);
assert.equal(overlay.groundTriangles.length,8);
assert.equal(overlay.caves.length,1);
assert.equal(overlay.caves[0].floorTriangles.length,2);
assert.equal(overlay.caves[0].roofTriangles.length,2);
assert.equal(overlay.caves[0].authorized,false);
assert.ok(Object.isFrozen(overlay)&&Object.isFrozen(overlay.groundTriangles));
assert.ok(Object.isFrozen(overlay.caves[0])&&
 Object.isFrozen(overlay.caves[0].roofCorners));
for(let i=0;i<mesh.ground.triangles.length;i++){
 for(let j=0;j<3;j++){
  assert.deepEqual(overlay.groundTriangles[i].points[j],
   projectSnakeFrontGlassPointV07g(mesh.ground.triangles[i].vertices[j]),
   'all geometry projected by V0.7G world-point camera, not a new lens');
 }
}
const roofCorner=mesh.caves[0].roofTriangles[0].vertices[0];
assert.deepEqual(
 overlay.caves[0].roofTriangles[0].points[0],
 projectSnakeFrontGlassPointV07g(roofCorner));
assert.deepEqual(overlay,createSnakeTerrainDebugV07n({scene,mesh}),
 'repeatability: no random or time-based terrain mesh change');
assert.equal(JSON.stringify(mesh),input,'V0.7M source mesh unchanged');
assert.equal(JSON.stringify(scene),before,'V0.3d world unchanged');
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{...stone,x:420}
});
assert.throws(()=>createSnakeTerrainDebugV07n({scene:moved,mesh}),
 RangeError,'stale rock geometry must never show as fresh');
assert.throws(()=>createSnakeTerrainDebugV07n({
 scene,mesh:{...mesh,playablePassageAuthorized:true}
}),RangeError,'cannot forge cave passage certification');
assert.throws(()=>createSnakeTerrainDebugV07n({
 scene,mesh:{...mesh,ground:{...mesh.ground,triangles:[]}}
}),RangeError,'cannot substitute unrelated triangle data');
assert.throws(()=>createSnakeTerrainDebugV07n({
 scene,mesh:{...mesh,skinApplied:true}
}),RangeError,'must not contain skin');
assert.throws(()=>createSnakeTerrainDebugV07n({scene,mesh:null}),
 RangeError);
const source=readFileSync(new URL(
 '../src/ohm-core/snake-terrain-front-glass-debug-v07n.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL(
 '../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/createSnakeTerrainDebugV07n/);
assert.match(html,/drawTerrainDebugOverlay/);
assert.match(html,/qaV07nOverlayReady/);
assert.match(html,/id="terrainDebug"/);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7N: V0.7M triangles projected unchanged through front-glass camera, rooted rock shell, stale/forged mesh rejected, no skin/biology/collision/player changes.');
