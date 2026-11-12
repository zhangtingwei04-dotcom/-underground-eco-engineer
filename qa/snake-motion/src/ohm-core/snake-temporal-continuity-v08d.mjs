/** Project OHM V0.8D — read-only source-bone temporal diagnostics.
 * 3D link angles are from actual tested poses. No body edit, skin, physics,
 * biological smoothness certification, saving, or gameplay authorization.
 */
export const SNAKE_TEMPORAL_CONTINUITY_VERSION='0.8D';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function subtract(a,b){return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}}
function length(v){return Math.hypot(v.x,v.y,v.z)}
function dot(a,b){return a.x*b.x+a.y*b.y+a.z*b.z}
function angle(a,b){return Math.acos(Math.max(-1,Math.min(1,dot(a,b))))}
function normalize(v){const m=length(v);if(m<1e-9)throw new RangeError('v08d_zero_length_link');return F({x:v.x/m,y:v.y/m,z:v.z/m})}
function analyze(pose){
 const pts=pose?.points,ds=pose?.segmentLength;
 if(!Array.isArray(pts)||![13,24].includes(pts.length)||!finite(ds)||
  Math.abs((pts.length-1)*ds-2.28)>1e-5||
  !pts.every(p=>p&&finite(p.x)&&finite(p.y)&&finite(p.z)&&
    Math.abs(p.x)<100&&Math.abs(p.y)<100&&Math.abs(p.z)<100))
  throw new RangeError('v08d_invalid_source_pose');
 const dirs=[];
 for(let i=1;i<pts.length;i++){
  const v=subtract(pts[i],pts[i-1]);
  if(Math.abs(length(v)-ds)>1e-5)throw new RangeError('v08d_source_length_changed');
  dirs.push(normalize(v));
 }
 const bends=[];
 for(let i=1;i<dirs.length;i++)bends.push(angle(dirs[i-1],dirs[i]));
 const maximumBendRadians=Math.max(0,...bends);
 const bendJointIndex=bends.indexOf(maximumBendRadians)+1;
 return {dirs,maximumBendRadians,bendJointIndex};
}
export function inspectSnakeTemporalContinuityV08d({
 previousPose,pose,seconds=1/30,visualBendLimit=.65
}={}){
 if(!finite(seconds)||seconds<=0||seconds>.1||
  !finite(visualBendLimit)||visualBendLimit<=0||visualBendLimit>1.2)
  throw new RangeError('v08d_invalid_clock_or_limit');
 const old=analyze(previousPose),now=analyze(pose);
 if(previousPose.points.length!==pose.points.length||
  Math.abs(previousPose.segmentLength-pose.segmentLength)>1e-8)
  throw new RangeError('v08d_source_chain_changed');
 const stepDistances=pose.points.map((p,i)=>length(subtract(p,previousPose.points[i])));
 let maxJointStep=0,maxJointStepIndex=-1;
 for(let i=0;i<stepDistances.length;i++)
  if(stepDistances[i]>maxJointStep){maxJointStep=stepDistances[i];maxJointStepIndex=i;}
 const rotations=now.dirs.map((d,i)=>angle(d,old.dirs[i]));
 return F({version:SNAKE_TEMPORAL_CONTINUITY_VERSION,ok:true,
  sourceJoints:pose.points.length,seconds,
  maximumBendRadians:now.maximumBendRadians,
  maximumBendJointIndex:now.bendJointIndex,
  previousBendRadians:old.maximumBendRadians,
  visualBendAccepted:now.maximumBendRadians<=visualBendLimit+1e-9,
  headStep:stepDistances[0],neckStep:stepDistances[1],
  tailStep:stepDistances.at(-1),maxJointStep,maxJointStepIndex,
  maxStepTangentRotationRadians:Math.max(0,...rotations),
  maxJointSpeed:maxJointStep/seconds,
  unchangedLength:true,sourceModified:false,skinApplied:false,
  collisionCertified:false,biologicalSmoothnessVerified:false,
  affectsSave:false,affectsEcology:false
 });
}
