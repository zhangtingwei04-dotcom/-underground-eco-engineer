/** OHM public V0.8C: source-bone bend sampler for synthetic visual QA.
 * Strictly read-only. Does not modify the pose, authorize skin/collision,
 * or claim real muscle forces or continuous self-collision safety.
 */
export const SNAKE_BEND_MONITOR_VERSION='0.8C';
const freeze=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function inspectSnakeBendFrameV08c({pose,limitRadians=.65}={}){
 const pts=pose?.points;
 if(!Array.isArray(pts)||![13,24].includes(pts.length)||
    !finite(pose.segmentLength)||pose.segmentLength<=0||
    Math.abs(pose.segmentLength*(pts.length-1)-2.28)>1e-6||
    !finite(limitRadians)||limitRadians<=0||limitRadians>1.1||
    !pts.every(p=>p&&finite(p.x)&&finite(p.y)&&finite(p.z)))
   throw new RangeError('v08c_untrusted_source_pose');
 const directions=[];
 for(let i=1;i<pts.length;i++){
   const a=pts[i-1],b=pts[i];
   const dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z;
   const length=Math.hypot(dx,dy,dz);
   if(Math.abs(length-pose.segmentLength)>1e-6)
     throw new RangeError('v08c_fixed_bone_length_lost');
   directions.push({x:dx/length,y:dy/length,z:dz/length});
 }
 let maximumRadians=0,jointIndex=-1;
 for(let i=1;i<directions.length;i++){
   const a=directions[i-1],b=directions[i];
   const dot=Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z));
   const bend=Math.acos(dot);
   if(bend>maximumRadians){maximumRadians=bend;jointIndex=i;}
 }
 return freeze({
   version:SNAKE_BEND_MONITOR_VERSION,ok:true,
   sourceJointCount:pts.length,
   maximumRadians,jointIndex,
   withinVisualLimit:maximumRadians<=limitRadians+1e-9,
   sourceModified:false,headColliderModified:false,
   skinApplied:false,affectsSave:false,affectsEcology:false,
   physicalCollisionCertified:false
 });
}
