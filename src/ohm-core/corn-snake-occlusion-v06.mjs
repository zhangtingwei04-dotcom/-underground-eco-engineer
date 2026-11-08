/** v0.6 decorative foliage occlusion; normalized screen-space art geometry only.
 * Not collision, habitat selection, or a measured corn-snake behavior.
 * Pure data so a future renderer can replace Canvas without changing sampling.
 */
export const CORN_FOLIAGE_V06=Object.freeze({left:.36,right:.64,top:.755,bottom:.86});
export function foliageOcclusionV06(pose,region=CORN_FOLIAGE_V06){
 if(!Array.isArray(pose)||pose.length<12)throw new TypeError('invalid_occlusion_pose');
 const inside=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=region.left&&p.x<=region.right&&p.y>=region.top&&p.y<=region.bottom;
 const covered=pose.slice(5,Math.ceil(pose.length*.8)).filter(inside).length;
 return {headExposed:!inside(pose[0]),coveredBodySamples:covered,partialCover:covered>0&&!inside(pose[0])};
}
