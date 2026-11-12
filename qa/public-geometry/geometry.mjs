/**
 * Public, general-purpose geometry sanity checks.
 * Independent teaching/test fixture. Not an animal model or a game engine.
 * No private project modules, authored game data, species models or assets.
 */

const finite = value => typeof value === 'number' && Number.isFinite(value);
const point3 = p => p !== null && typeof p === 'object' &&
  finite(p.x) && finite(p.y) && finite(p.z);
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 });
const centroid = (a, b, c) => ({ x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3, z: (a.z + b.z + c.z) / 3 });
const interpolate = (a, b, fraction) => ({
  x: a.x + (b.x - a.x) * fraction,
  y: a.y + (b.y - a.y) * fraction,
  z: a.z + (b.z - a.z) * fraction
});
const boxValid = b => b && ['minX','maxX','minY','maxY','minZ','maxZ'].every(k => finite(b[k])) &&
  b.minX < b.maxX && b.minY < b.maxY && b.minZ < b.maxZ;
const inside = (p, b) => p.x >= b.minX && p.x <= b.maxX &&
  p.y >= b.minY && p.y <= b.maxY && p.z >= b.minZ && p.z <= b.maxZ;
const fail = (reason, checked = 0) => Object.freeze({ ok: false, reason, samplesChecked: checked });

/** Reports fixed-link and optional world-box validity. Never modifies input. */
export function checkFixedLinks(points, { linkLength, tolerance = 1e-7, bounds } = {}) {
  if (!Array.isArray(points) || points.length < 2 || !points.every(point3) ||
      !finite(linkLength) || linkLength <= 0 || !finite(tolerance) || tolerance < 0 || tolerance > 0.01 ||
      (bounds !== undefined && !boxValid(bounds))) return fail('invalid_input');
  if (bounds && points.some(p => !inside(p, bounds))) return fail('outside_bounds');
  let maximumError = 0;
  for (let i = 1; i < points.length; i++) {
    const error = Math.abs(distance(points[i - 1], points[i]) - linkLength);
    maximumError = Math.max(maximumError, error);
    if (error > tolerance) return Object.freeze({ ...fail('link_length_mismatch'), segment: i - 1, maximumError });
  }
  return Object.freeze({ ok: true, segmentsChecked: points.length - 1, maximumError, totalNominalLength: (points.length - 1) * linkLength });
}

/**
 * Vertex, triangle centroid and edge-midpoint sampling; optional discrete
 * intermediate states. Passing does NOT prove continuous mesh collision safety.
 */
export function checkSampledMesh(mesh, {
  bounds, groundZ = -Infinity, obstacles = [], previousVertices = null, fractions = [0.5]
} = {}) {
  const vertices = mesh?.vertices, triangles = mesh?.triangles;
  if (!boxValid(bounds) || !finite(groundZ) ||
      !Array.isArray(vertices) || vertices.length < 3 || !vertices.every(point3) ||
      !Array.isArray(triangles) || triangles.length < 1 ||
      !triangles.every(t => Array.isArray(t) && t.length === 3 && t.every(i => Number.isInteger(i) && i >= 0 && i < vertices.length) && new Set(t).size === 3) ||
      !Array.isArray(obstacles) || !obstacles.every(boxValid) ||
      (previousVertices !== null && (!Array.isArray(previousVertices) || previousVertices.length !== vertices.length || !previousVertices.every(point3))) ||
      !Array.isArray(fractions) || fractions.some(t => !finite(t) || t <= 0 || t >= 1)) return fail('invalid_input');

  let checked = 0;
  const inspect = p => {
    checked++;
    if (!inside(p, bounds)) return 'outside_bounds';
    if (p.z < groundZ) return 'below_ground';
    if (obstacles.some(b => inside(p, b))) return 'inside_obstacle';
    return null;
  };
  const checkPose = pose => {
    for (const v of pose) { const reason = inspect(v); if (reason) return reason; }
    for (const [a, b, c] of triangles) {
      const p = pose[a], q = pose[b], r = pose[c];
      for (const sample of [centroid(p, q, r), midpoint(p, q), midpoint(q, r), midpoint(r, p)]) {
        const reason = inspect(sample);
        if (reason) return reason;
      }
    }
    return null;
  };
  const reason = checkPose(vertices);
  if (reason) return fail(reason, checked);
  if (previousVertices) {
    // Also check the preceding discrete pose so a bad starting frame cannot pass.
    const priorReason = checkPose(previousVertices);
    if (priorReason) return fail(priorReason, checked);
    for (const fraction of fractions) {
      const intermediate = vertices.map((p, i) => interpolate(previousVertices[i], p, fraction));
      const betweenReason = checkPose(intermediate);
      if (betweenReason) return fail(betweenReason, checked);
    }
  }
  return Object.freeze({ ok: true, samplesChecked: checked, sampledIntermediateFrames: previousVertices ? fractions.length : 0, continuousCollisionProven: false });
}

/** Measures 2D bend-change onset; this does not simulate forces or muscles. */
export function inspectBendOnset(frames, { thresholdRadians = 0.05 } = {}) {
  if (!Array.isArray(frames) || frames.length < 2 || !Array.isArray(frames[0]) ||
      frames[0].length < 4 || frames.some(f => !Array.isArray(f) || f.length !== frames[0].length || !f.every(point3)) ||
      !finite(thresholdRadians) || thresholdRadians <= 0 || thresholdRadians >= Math.PI) return fail('invalid_input');
  const turn = (arr, i) => {
    const a = arr[i - 1], b = arr[i], c = arr[i + 1];
    const ax = b.x - a.x, ay = b.y - a.y, bx = c.x - b.x, by = c.y - b.y;
    if (Math.hypot(ax, ay) < 1e-9 || Math.hypot(bx, by) < 1e-9) return null;
    return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  };
  const onset = [];
  for (let i = 1; i < frames[0].length - 1; i++) {
    const base = turn(frames[0], i);
    if (base === null) return fail('degenerate_segment');
    let first = null;
    for (let f = 1; f < frames.length; f++) {
      const next = turn(frames[f], i);
      if (next === null) return fail('degenerate_segment');
      const delta = Math.atan2(Math.sin(next - base), Math.cos(next - base));
      if (Math.abs(delta) > thresholdRadians) { first = f; break; }
    }
    onset.push(first);
  }
  const front = onset[0], rear = onset.at(-1);
  return Object.freeze({ ok: true, firstChangeByJoint: Object.freeze(onset),
    frontPrecedesRear: front !== null && rear !== null ? front <= rear : null,
    forceOrContactVerified: false });
}
