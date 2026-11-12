import test from 'node:test';
import assert from 'node:assert/strict';
import { checkFixedLinks, checkSampledMesh, inspectBendOnset } from './geometry.mjs';

const bounds = Object.freeze({ minX: -2, maxX: 2, minY: -2, maxY: 2, minZ: -1, maxZ: 2 });
const p = (x, y, z = 0.2) => Object.freeze({ x, y, z });

test('generic 3D fixed links hold their length without modifying positions', () => {
  const chain = Object.freeze([p(0,0),p(.5,0),p(1,0),p(1.5,0)]);
  const before = JSON.stringify(chain);
  const result = checkFixedLinks(chain, { linkLength: .5, bounds });
  assert.equal(result.ok, true);
  assert.equal(result.segmentsChecked, 3);
  assert.equal(result.totalNominalLength, 1.5);
  assert.equal(JSON.stringify(chain), before);
  assert.equal(checkFixedLinks([...chain.slice(0, 2), p(1.01, 0), chain[3]], { linkLength: .5 }).reason, 'link_length_mismatch');
  assert.equal(checkFixedLinks([p(0,0),p(3,0)], { linkLength: 3, bounds }).reason, 'outside_bounds');
  assert.equal(checkFixedLinks([p(0,0), {x:NaN,y:0,z:0}], { linkLength: .5 }).reason, 'invalid_input');
});

test('sampling rejects ground, world bounds and obstacle-intersecting triangles', () => {
  const mesh = { vertices:[p(.1,.1),p(.8,.1),p(.1,.8)], triangles:[[0,1,2]] };
  const valid = checkSampledMesh(mesh, { bounds, groundZ: 0 });
  assert.equal(valid.ok, true);
  assert.equal(valid.samplesChecked, 7);
  assert.equal(valid.continuousCollisionProven, false);
  const centerBlock = { minX:.31, maxX:.36, minY:.31, maxY:.36, minZ:0, maxZ:.5 };
  assert.equal(checkSampledMesh(mesh, { bounds, groundZ:0, obstacles:[centerBlock] }).reason, 'inside_obstacle');
  const edgeBlock = { minX:.44, maxX:.46, minY:.09, maxY:.11, minZ:0, maxZ:.5 };
  assert.equal(checkSampledMesh(mesh, { bounds, groundZ:0, obstacles:[edgeBlock] }).reason, 'inside_obstacle');
  assert.equal(checkSampledMesh(mesh, { bounds, groundZ:.3 }).reason, 'below_ground');
  assert.equal(checkSampledMesh({ vertices:[...mesh.vertices.slice(0,2),p(5,.8)], triangles:[[0,1,2]] }, { bounds, groundZ:0 }).reason, 'outside_bounds');
  assert.equal(checkSampledMesh({ vertices:mesh.vertices, triangles:[[0,1,77]] }, {bounds,groundZ:0}).reason, 'invalid_input');
});

test('discrete halfway sampling can detect a forbidden mid-motion position', () => {
  const before=[p(-.7,.1),p(-.4,.1),p(-.7,.4)];
  const after =[p(.5,.1),p(.8,.1),p(.5,.4)];
  const triangle = {vertices:after,triangles:[[0,1,2]]};
  const obstacle={ minX:-.15, maxX:-.05, minY:.08, maxY:.12, minZ:.1, maxZ:.3 };
  assert.equal(checkSampledMesh(triangle,{bounds,groundZ:0,obstacles:[obstacle]}).ok,true);
  const result=checkSampledMesh(triangle,{bounds,groundZ:0,obstacles:[obstacle],previousVertices:before,fractions:[.5]});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'inside_obstacle');
  assert.equal(checkSampledMesh(triangle,{bounds,groundZ:0,previousVertices:before,fractions:[.5]}).samplesChecked,21);
});

test('bend onset tracks front before rear, with no force-model claim', () => {
  const straight=[p(0,0),p(.5,0),p(1,0),p(1.5,0)];
  const headTurn=[p(0,.2),p(.5,0),p(1,0),p(1.5,0)];
  const tailTurn=[p(0,.2),p(.5,0),p(1,0),p(1.5,.2)];
  const result=inspectBendOnset([straight,headTurn,tailTurn]);
  assert.equal(result.ok,true);
  assert.deepEqual(result.firstChangeByJoint,[1,2]);
  assert.equal(result.frontPrecedesRear,true);
  assert.equal(result.forceOrContactVerified,false);
  assert.equal(inspectBendOnset([straight,tailTurn,headTurn]).frontPrecedesRear,true);
  assert.equal(inspectBendOnset([straight,[p(0,0),p(.5,0),p(.5,0),p(1.5,0)]]).reason,'degenerate_segment');
});
