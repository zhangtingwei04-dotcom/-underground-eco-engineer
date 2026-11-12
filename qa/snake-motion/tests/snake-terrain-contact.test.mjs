import assert from 'node:assert/strict';
import {makeUniversalSnakePose} from '../src/ohm-core/snake-skeleton-motion.mjs';
import {SNAKE_TERRAIN_CONTACT_VERSION,SNAKE_TERRAIN_PRESET,
  sampleSnakeTerrain,conformSnakePoseToTerrain,inspectSnakeTerrainClearance
} from '../src/ohm-core/snake-terrain-contact.mjs';

assert.equal(SNAKE_TERRAIN_CONTACT_VERSION,'0.6A');
assert.equal(sampleSnakeTerrain(0,5).z,0);
assert.ok(sampleSnakeTerrain(-.7,-.03).z>.06);
assert.ok(sampleSnakeTerrain(-1.12,-.04).z>.045);
const flat={groundZ:0,rock:null,perch:null};
let cases=0;
for(const terrain of [flat,SNAKE_TERRAIN_PRESET]){
  for(const mode of ['ground','explore','supported']){
    for(const count of [16,24,48]){
      for(const time of [0,.05,.4,1.7,4.0]){
        const base=makeUniversalSnakePose({mode,time,boneCount:count});
        const adjusted=conformSnakePoseToTerrain(base,{terrain});
        const chk=inspectSnakeTerrainClearance(adjusted,{terrain});
        assert.ok(chk.ok,`${mode}/${count}/${time}: ${JSON.stringify(chk)}`);
        assert.ok(chk.maxBoneError<1e-8,'preserve bone length');
        assert.equal(adjusted.points.length,count);
        assert.ok(Object.isFrozen(adjusted.points));
        assert.deepEqual(adjusted,conformSnakePoseToTerrain(base,{terrain}),'deterministic');
        assert.equal(chk.exactMeshCollisionChecked,false);
        cases++;
      }
    }
  }
}
const base=makeUniversalSnakePose({mode:'ground'});
const adjusted=conformSnakePoseToTerrain(base);
assert.ok(adjusted.points.some((p,i)=>p.z>base.points[i].z+.05),'climb rounded rock');
assert.ok(adjusted.contacts.some(c=>c.surface==='rock_rounded_heightfield'),'rock contact labels');
const raised=conformSnakePoseToTerrain(makeUniversalSnakePose({mode:'explore'}));
assert.ok(raised.contacts.length<adjusted.contacts.length,'raised front is not touching floor');
const original=structuredClone(base.points);
conformSnakePoseToTerrain(base);
assert.deepEqual(base.points,original,'does not mutate source');
assert.throws(()=>sampleSnakeTerrain(0,Infinity),RangeError);
assert.throws(()=>sampleSnakeTerrain(0,0,{groundZ:0,rock:{x:0,y:0,radius:-1,height:1}}),RangeError);
assert.throws(()=>conformSnakePoseToTerrain({}),RangeError);
assert.throws(()=>conformSnakePoseToTerrain(base,{margin:-1}),RangeError);
assert.throws(()=>inspectSnakeTerrainClearance({}),RangeError);
const penetrated={...adjusted,points:adjusted.points.map(p=>({...p,z:p.z-.2}))};
assert.equal(inspectSnakeTerrainClearance(penetrated).ok,false,'clearance test catches below surface');
console.log('PASS V0.6A snake terrain: '+cases+' valid pose/terrain cases; clearance, length, immutability and guards');
