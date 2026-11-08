/** v0.6 decorative foliage occlusion; normalized screen-space art geometry only.
 * Not collision, habitat selection, or a measured corn-snake behavior.
 * Pure data so a future renderer can replace Canvas without changing sampling.
 */
export const CORN_FOLIAGE_V06=Object.freeze({left:.36,right:.64,top:.755,bottom:.86});
export function foliageOcclusionV06(pose,region=CORN_FOLIAGE_V06){
 if(!Array.isArray(pose)||pose.length<12)throw new TypeError('invalid_occlusion_pose');
 if(!region||!['left','right','top','bottom'].every(k=>Number.isFinite(region[k]))||
    region.left>=region.right||region.top>=region.bottom)
   throw new TypeError('invalid_occlusion_region');
 if(!pose.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)))
   throw new TypeError('invalid_occlusion_coordinates');
 const inside=p=>p.x>=region.left&&p.x<=region.right&&p.y>=region.top&&p.y<=region.bottom;
 const body=pose.slice(5,Math.ceil(pose.length*.8));
 const covered=body.filter(inside).length;
 const headExposed=!inside(pose[0]);
 return {headExposed,coveredBodySamples:covered,partialCover:covered>0&&headExposed,
  bodyCoverFraction:covered/body.length};
}
