import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 SNAKE_TERRAIN_MESH_VERSION,createSnakeTerrainMeshV07m,
 sampleSnakeTerrainMeshV07m,inspectSnakeTerrainMeshV07m
} from '../src/ohm-core/snake-terrain-triangle-mesh-v07m.mjs';

const rock={
 id:'cave_rock_01',kind:'rock_overhang',
 x:470,y:160,width:60,depth:80,height:80,transmissionPermille:0
};
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07m_triangle_shell',objects:[rock]
});
const before=JSON.stringify(scene);
const ground={
 xStops:[-4,0,4],yStops:[-1.6,0,1.6],
 zRows:[[0,0,0],[0,.04,0],[0,0,0]],
 authority:'explicit_lab_heightfield_unmeasured'
};
const cave={
 id:'cave_lab_01',objectId:rock.id,
 floorCorners:[0,0,0,0],roofCorners:[.4,.4,.4,.4],
 authority:'explicit_lab_shell_unmeasured'
};
const pose=(y,z=.14)=>Object.freeze({
 segmentLength:.2,bodyRadius:.08,
 points:Object.freeze(Array.from({length:13},(_,i)=>Object.freeze({
  x:Math.round((-1.2+.2*i)*1e9)/1e9,y,z
 })))
});
const crossing=pose(0),outside=pose(.9);
assert.equal(SNAKE_TERRAIN_MESH_VERSION,'0.7M');
const mesh=createSnakeTerrainMeshV07m(scene,{ground,caves:[cave]});
assert.equal(mesh.version,'0.7M');
assert.equal(mesh.ground.triangles.length,8,
 '3x3 height samples create 8 triangular faces');
assert.equal(mesh.caves.length,1);
assert.equal(mesh.caves[0].floorTriangles.length,2);
assert.equal(mesh.caves[0].roofTriangles.length,2);
assert.equal(mesh.caves[0].playablePassageAuthorized,false);
assert.equal(mesh.playablePassageAuthorized,false);
assert.equal(mesh.skinApplied,false);
assert.ok(Object.isFrozen(mesh)&&Object.isFrozen(mesh.ground.triangles));
assert.ok(Object.isFrozen(mesh.ground.triangles[0].vertices));
assert.deepEqual(mesh,createSnakeTerrainMeshV07m(scene,{
 ground,caves:[cave]
}), 'mesh vertices must replay identically, no random terrain');
const center=sampleSnakeTerrainMeshV07m({
 scene,mesh,x:0,y:0
});
assert.equal(center.ok,true);
assert.ok(Math.abs(center.z-.04)<1e-10);
const slope=sampleSnakeTerrainMeshV07m({
 scene,mesh,x:1,y:0
});
assert.ok(slope.z>0&&slope.z<.04,
 'triangulated slope must interpolate between source heights');
const roof=sampleSnakeTerrainMeshV07m({
 scene,mesh,x:0,y:0,surface:'cave_roof',caveId:cave.id
});
const floor=sampleSnakeTerrainMeshV07m({
 scene,mesh,x:0,y:0,surface:'cave_floor',caveId:cave.id
});
assert.equal(roof.z,.4);
assert.equal(floor.z,0);
assert.equal(sampleSnakeTerrainMeshV07m({
 scene,mesh,x:1,y:1,surface:'cave_roof',caveId:cave.id
}).ok,false,
 'cannot fabricate a roof outside the original rock footprint');
const fullBody=inspectSnakeTerrainMeshV07m({
 scene,mesh,pose:crossing
});
assert.equal(fullBody.clearForGeometryOnly,false);
assert.equal(fullBody.reason,'hypothetical_tunnel_unverified',
 'even authored triangle shell cannot open a playable cave');
assert.equal(fullBody.playablePassageAuthorized,false);
assert.equal(fullBody.fullMeshCollisionVerified,false);
assert.equal(fullBody.headMeshChecked,false);
assert.equal(fullBody.caveBoneOverlaps>0,true);
assert.equal(fullBody.checkedSamples,300);
assert.equal(inspectSnakeTerrariumPoseV07c(crossing,scene).ok,false,
 'new triangles must NOT bypass old V0.7C footprint collision');
const noCave=createSnakeTerrainMeshV07m(scene,{ground});
assert.equal(inspectSnakeTerrainMeshV07m({
 scene,mesh:noCave,pose:crossing
}).reason,'solid_xy_source_blocker');
const tooLow=createSnakeTerrainMeshV07m(scene,{
 ground,caves:[{...cave,roofCorners:[.17,.17,.17,.17]}]
});
assert.equal(inspectSnakeTerrainMeshV07m({
 scene,mesh:tooLow,pose:crossing
}).reason,'cave_triangle_clearance_failed',
 'authored roof intersects continuous body radius');
const highHill=createSnakeTerrainMeshV07m(scene,{
 ground:{...ground,zRows:[[0,0,0],[0,.24,0],[0,0,0]]},
 caves:[cave]
});
assert.equal(inspectSnakeTerrainMeshV07m({
 scene,mesh:highHill,pose:crossing
}).reason,'ground_triangle_clearance_failed',
 'a high hill cannot be ignored because the end bones look level');
const clear=inspectSnakeTerrainMeshV07m({
 scene,mesh,pose:outside
});
assert.equal(clear.clearForGeometryOnly,true);
assert.equal(clear.reason,'clear_sampled_ground_and_old_xy_only');
assert.equal(clear.playablePassageAuthorized,false);
assert.equal(clear.fullMeshCollisionVerified,false);
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{...rock,x:720}
});
assert.throws(()=>inspectSnakeTerrainMeshV07m({
 scene:moved,mesh,pose:crossing
}),RangeError,'a moved rock invalidates every old triangle shell snapshot');
assert.throws(()=>sampleSnakeTerrainMeshV07m({
 scene,mesh:{...mesh,playablePassageAuthorized:true},x:0,y:0
}),RangeError,'cannot forge passage approval');
assert.throws(()=>sampleSnakeTerrainMeshV07m({
 scene,mesh:{...mesh,ground:{...mesh.ground,triangles:[]}},x:0,y:0
}),RangeError,'cannot forge or discard the authored triangle data');
assert.throws(()=>sampleSnakeTerrainMeshV07m({
 scene,mesh,x:0,y:0,surface:'cave_roof',caveId:'unknown'
}),RangeError);
const stretched={
 ...crossing,points:crossing.points.map((p,i)=>i===3?
  {...p,z:p.z+.04}:p)
};
assert.throws(()=>inspectSnakeTerrainMeshV07m({
 scene,mesh,pose:stretched
}),RangeError,'stretched bone must never gain collision clearance');
for(const malformed of [
 {...ground,xStops:[-4,0,0,4]},
 {...ground,zRows:[[0,0,0],[0,NaN,0],[0,0,0]]},
 {...ground,xStops:[-4,0,3]},
 {...ground,zRows:[[0,0],[0,0],[0,0]]}
])assert.throws(()=>createSnakeTerrainMeshV07m(
 scene,{ground:malformed,caves:[cave]}
),RangeError);
for(const invalid of [
 {...cave,objectId:'unknown_rock'},
 {...cave,roofCorners:[0,0,0,0]},
 {...cave,floorCorners:[0,0,0,NaN]},
 {...cave,authority:'measured_verified'},
 {...cave,playablePassageAuthorized:true}
])assert.throws(()=>createSnakeTerrainMeshV07m(scene,{
 ground,caves:[invalid]
}),RangeError);
assert.equal(JSON.stringify(scene),before,
 'authoritative V0.3d ecology must be unchanged');
const source=readFileSync(
 new URL('../src/ohm-core/snake-terrain-triangle-mesh-v07m.mjs',import.meta.url),
 'utf8'
);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS SNAKE V0.7M: explicit ground and cave triangles interpolate, shallow clearance and ceiling collision checked, all body segments sampled, V0.7C still blocks, stale/forged/invalid mesh rejected, snake skin and ecology untouched.');
