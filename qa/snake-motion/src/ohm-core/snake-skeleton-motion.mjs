/**
 * Project OHM — universal snake motion controls V0.5B.
 * 24 point (configurable) ENGINE-NEUTRAL procedural spine.
 * No species anatomy claims; no real-world dynamics, IK, ground friction,
 * weight, muscle activation or self-collision. Not a gameplay controller.
 * Coordinates in arbitrary artwork units; +Z is vertical; head index 0.
 */
export const OHM_SNAKE_SKELETON_MOTION_VERSION = '0.5B';
export const OHM_SNAKE_POSE_MODES = Object.freeze(['ground', 'explore', 'supported']);
const PI = Math.PI;
const clamp = (x, low, high) => Math.max(low, Math.min(high, x));
const smooth = x => { const t = clamp(x, 0, 1); return t*t*(3-2*t); };
const finite = x => Number.isFinite(x) && typeof x === 'number';
const magnitude = p => Math.hypot(p.x, p.y, p.z);
const between = (p, q) => ({x:q.x-p.x,y:q.y-p.y,z:q.z-p.z});
const dot = (a,b) => a.x*b.x+a.y*b.y+a.z*b.z;
const freezePoint = p => Object.freeze({x:p.x,y:p.y,z:p.z});

function liftAt(mode, u, length) {
  if (mode === 'ground') return 0;
  if (mode === 'explore') {
    // Raised front ~26% of the spine, while the rear stays on the floor.
    return length * .145 * (1 - smooth(u/.31));
  }
  // Raised, locally supported midpoint (the central bridge is an authored
  // kinematic contact, not a solved mass/gravity simulation).
  return length * .12 * smooth((u-.14)/.30) * (1-smooth((u-.60)/.28));
}

/**
 * Create a fixed-segment-length polyline. Each adjacent pair has EXACTLY
 * length/(boneCount-1) distance, even while raising head or supported trunk.
 * The first and last points are animation control centers, NOT the vertebral
 * count and not physical positions inferred from user video.
 */
export function makeUniversalSnakePose({
  mode='ground', time=0, length=1.4, boneCount=24,
  bodyRadius=.067, waveAmplitude=.29, cycles=1.65, waveSpeed=.43
}={}) {
  if (!OHM_SNAKE_POSE_MODES.includes(mode)) throw new RangeError('invalid_mode');
  if (!finite(time) || Math.abs(time)>1e6 || !finite(length) || length<.3 || length>5 ||
      !Number.isInteger(boneCount) || boneCount<8 || boneCount>64 ||
      !finite(bodyRadius) || bodyRadius<=0 || bodyRadius>=length*.13 ||
      !finite(waveAmplitude) || waveAmplitude<0 || waveAmplitude>.7 ||
      !finite(cycles) || cycles<.3 || cycles>4 ||
      !finite(waveSpeed) || waveSpeed<0 || waveSpeed>5)
    throw new RangeError('invalid_pose_parameters');
  const ds=length/(boneCount-1), points=new Array(boneCount),
        phase=2*PI*waveSpeed*time;
  points[boneCount-1]={x:0,y:0,z:bodyRadius};
  for(let i=boneCount-2;i>=0;i--){
    const u=i/(boneCount-1);
    const previous=points[i+1];
    const desiredZ=bodyRadius+liftAt(mode,u,length);
    // The prescribed vertical shape is smooth; this cap guards the small-LOD
    // case so each segment remains finite and the chain never stretches.
    const dz=clamp(desiredZ-previous.z,-.85*ds,.85*ds);
    const horizontal=Math.sqrt(Math.max(0,ds*ds-dz*dz));
    const heading=waveAmplitude * Math.sin(2*PI*cycles*u-phase);
    points[i]={x:previous.x+horizontal*Math.cos(heading),
               y:previous.y+horizontal*Math.sin(heading),
               z:previous.z+dz};
  }
  // Keep the head at the same XY origin; rig stays within a stable camera.
  const hx=points[0].x, hy=points[0].y;
  const spine=Object.freeze(points.map(p=>freezePoint({x:p.x-hx,y:p.y-hy,z:p.z})));
  let contacts=[];
  if(mode==='ground') contacts=Array.from({length:boneCount},(_,i)=>i);
  else if(mode==='explore') contacts=Array.from({length:boneCount},(_,i)=>i).filter(i=>i/(boneCount-1)>=.32);
  else contacts=Array.from({length:boneCount},(_,i)=>i).filter(i=>{
    const u=i/(boneCount-1);
    return u<=.12 || u>=.89 || (u>=.49 && u<=.56);
  });
  return Object.freeze({
    version:OHM_SNAKE_SKELETON_MOTION_VERSION,mode,time,length,boneCount,
    bodyRadius, segmentLength:ds,points:spine,
    contactIndices:Object.freeze(contacts),
    // Visual contact plane: for 'supported' it sits directly under the center
    // of a rigidly raised midpoint; contact is illustrative only.
    support:mode==='supported'?Object.freeze({
      kind:'illustrative_mid_body_perch',
      pointIndex:Math.round((boneCount-1)*.52),
      clearance:bodyRadius
    }):null,
    status:'kinematic_prototype_not_biomechanics'
  });
}

/** Inspect fixed length, bend-angle smoothness and simplified ground floor. */
export function inspectUniversalSnakePose(pose) {
  if(!pose || !Array.isArray(pose.points) || pose.points.length<3 || !finite(pose.segmentLength))
    throw new RangeError('invalid_pose');
  let maxLengthError=0, maxBendAngle=0,minGroundClearance=Infinity;
  const segments=[];
  for(let i=0;i<pose.points.length-1;i++){
    const a=pose.points[i],b=pose.points[i+1];
    if(![a.x,a.y,a.z,b.x,b.y,b.z].every(finite))throw new RangeError('nonfinite_pose');
    const step=between(a,b),dist=magnitude(step);
    maxLengthError=Math.max(maxLengthError,Math.abs(dist-pose.segmentLength));
    segments.push({x:step.x/dist,y:step.y/dist,z:step.z/dist});
    minGroundClearance=Math.min(minGroundClearance,a.z-pose.bodyRadius);
  }
  minGroundClearance=Math.min(minGroundClearance,pose.points.at(-1).z-pose.bodyRadius);
  for(let i=1;i<segments.length;i++){
    const cosine=clamp(dot(segments[i-1],segments[i]),-1,1);
    maxBendAngle=Math.max(maxBendAngle,Math.acos(cosine));
  }
  return Object.freeze({
    ok:maxLengthError<1e-8 && minGroundClearance>-1e-8,
    maxLengthError,maxBendAngleRadians:maxBendAngle,
    minGroundClearance,pointCount:pose.points.length,
    // Intentionally no self-collision pass / terrain collision claim.
    selfCollisionChecked:false,terrainCollisionChecked:false,
    biomechanicalValidation:false
  });
}
