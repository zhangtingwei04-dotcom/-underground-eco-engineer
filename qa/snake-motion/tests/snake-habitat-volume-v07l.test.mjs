import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createTerrariumSceneGeometryV03d,applyTerrariumSceneGeometryV03dEvent
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {inspectSnakeTerrariumPoseV07c}
 from '../src/ohm-core/snake-terrarium-corridor-v07c.mjs';
import {
 createSnakeHabitatVolumeV07l,inspectSnakeHabitatVolumeV07l,
 SNAKE_HABITAT_VOLUME_VERSION
} from '../src/ohm-core/snake-habitat-volume-v07l.mjs';

const rock={
 id:'cave_rock_01',kind:'rock_overhang',
 x:470,y:160,width:60,depth:80,
 height:80,transmissionPermille:0
};
const scene=createTerrariumSceneGeometryV03d({
 sceneId:'v07l_volume_lab',objects:[rock]
});
const unchanged=JSON.stringify(scene);
const pose=y=>Object.freeze({
 segmentLength:.2,bodyRadius:.08,
 points:Object.freeze(Array.from({length:13},(_,i)=>Object.freeze({
  x:Math.round((-1.2+i*.2)*1e9)/1e9,y,z:.14
 })))
});
const crossing=pose(0);
const outside=pose(.9);
const caveHypothesis={
 id:'cave_lab_hypothesis_01',objectId:rock.id,
 floorZ:0,undersideZ:.6,
 source:'explicit_lab_hypothesis_unmeasured'
};
assert.equal(SNAKE_HABITAT_VOLUME_VERSION,'0.7L');
const solid=createSnakeHabitatVolumeV07l(scene);
assert.equal(solid.version,'0.7L');
assert.equal(solid.openingAuthorized,false);
assert.equal(solid.obstacles.length,1);
assert.equal(solid.obstacles[0].inferredRoofZ,null,
 'V0.3d light-occlusion object height is NOT tunnel ceiling');
assert.ok(Object.isFrozen(solid)&&Object.isFrozen(solid.obstacles));
const oldCorridor=inspectSnakeTerrariumPoseV07c(crossing,scene);
assert.equal(oldCorridor.ok,false,
 'unchanged V0.7C collision system blocks source rock');
const noPassage=inspectSnakeHabitatVolumeV07l({scene,pose:crossing});
assert.equal(noPassage.ok,false);
assert.equal(noPassage.reason,'solid_xy_source_blocker');
assert.equal(noPassage.objectId,rock.id);
const proposed=createSnakeHabitatVolumeV07l(scene,{
 passages:[caveHypothesis]
});
const candidate=inspectSnakeHabitatVolumeV07l({
 scene,pose:crossing,snapshot:proposed
});
assert.equal(candidate.ok,false,
 'EVEN a hypothetically tall cave is still BLOCKED to gameplay');
assert.equal(candidate.reason,'hypothetical_tunnel_unverified');
assert.equal(candidate.playableCaveAuthorized,false);
assert.equal(candidate.meshCollisionVerified,false);
assert.ok(candidate.candidateBoneOverlaps>0);
assert.deepEqual(proposed,createSnakeHabitatVolumeV07l(scene,{
 passages:[caveHypothesis]
}), 'same source and proposal must create the same bounded snapshot');
assert.equal(inspectSnakeTerrariumPoseV07c(crossing,scene).ok,false,
 'explicit height hypothesis must NEVER bypass V0.7C');
for(const heights of [
 {...caveHypothesis,undersideZ:.17},
 {...caveHypothesis,floorZ:.09}
]){
 const tooSmall=createSnakeHabitatVolumeV07l(scene,{passages:[heights]});
 const blocked=inspectSnakeHabitatVolumeV07l({
  scene,pose:crossing,snapshot:tooSmall
 });
 assert.equal(blocked.ok,false);
 assert.equal(blocked.reason,'hypothetical_tunnel_too_low_or_high_floor');
}
const free=inspectSnakeHabitatVolumeV07l({
 scene,pose:outside,snapshot:proposed
});
assert.equal(free.ok,true);
assert.equal(free.reason,'clear_2d_corridor_only');
assert.equal(free.playableCaveAuthorized,false,
 'unobstructed is not a new certified 3D cave');
const wall=pose(1.54);
assert.equal(inspectSnakeHabitatVolumeV07l({
 scene,pose:wall,snapshot:proposed
}).reason,'wall_boundary');
const moved=applyTerrariumSceneGeometryV03dEvent(scene,{
 channel:'object',type:'upsert',object:{...rock,x:720}
});
assert.throws(()=>inspectSnakeHabitatVolumeV07l({
 scene:moved,pose:crossing,snapshot:proposed
}),RangeError,'scene revision invalidates any preflight snapshot');
assert.equal(inspectSnakeHabitatVolumeV07l({
 scene:moved,pose:crossing
}).ok,true,'actual moved scene no longer overlaps this body');
assert.throws(()=>inspectSnakeHabitatVolumeV07l({
 scene,pose:crossing,snapshot:{...proposed,openingAuthorized:true}
}),RangeError,'fake approval must not unlock caves');
assert.throws(()=>inspectSnakeHabitatVolumeV07l({
 scene,pose:crossing,snapshot:{...proposed,obstacles:[]}
}),RangeError,'cannot delete source rocks from the snapshot');
for(const invalid of [
 {...caveHypothesis,id:caveHypothesis.id+'!'},
 {...caveHypothesis,objectId:'unknown'},
 {...caveHypothesis,undersideZ:NaN},
 {...caveHypothesis,undersideZ:caveHypothesis.floorZ+.01},
 {...caveHypothesis,source:'measured_and_safe'}
]){
 assert.throws(()=>createSnakeHabitatVolumeV07l(scene,{
  passages:[invalid]
 }),RangeError);
}
assert.throws(()=>createSnakeHabitatVolumeV07l(scene,{
 passages:[caveHypothesis,caveHypothesis]
}),RangeError);
const stretched={
 ...crossing,points:crossing.points.map((p,i)=>i===3?
  {...p,z:p.z+.04}:p)
};
assert.throws(()=>inspectSnakeHabitatVolumeV07l({
 scene,pose:stretched
}),RangeError,'no clearance pass with non-fixed-length skeleton');
assert.equal(JSON.stringify(scene),unchanged,
 'preflight may not write the ecology/scene/collision source');
const source=readFileSync(
 new URL('../src/ohm-core/snake-habitat-volume-v07l.mjs',import.meta.url),
 'utf8'
);
assert.doesNotMatch(source,
 /localStorage|indexedDB|fetch|Math[.]random|saveGame|applyTerrariumSceneGeometryV03dEvent/);
console.log('PASS V0.7L: source rock remains solid, low roof/high floor blocked, hypothetical tall cave still unapproved, all 13 fixed-body joints checked, stale/forged snapshot rejected, no save or ecology writes.');
