/**
 * Corn snake v0.6 head silhouette helper — pure presentation data.
 * Orientation follows the already-posed head/neck tangent: no extra rotation.
 * Measurements are canvas ART dimensions, not biological morphometry.
 */
export const CORN_HEAD_SILHOUETTE_V06_VERSION=1;
export function getCornSnakeHeadShapeV06(pose,{width=960,height=540}={}){
 if(!Array.isArray(pose)||pose.length<5||
    !Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)
   throw new TypeError('invalid_head_shape_arguments');
 const head=pose[0],neck=pose[4];
 if(!head||!neck||![head.x,head.y,neck.x,neck.y].every(Number.isFinite))
   throw new TypeError('invalid_head_neck_coordinates');
 const dx=(head.x-neck.x)*width,dy=(head.y-neck.y)*height;
 if(Math.hypot(dx,dy)<.001)throw new RangeError('collapsed_head_neck_tangent');
 return {
  x:head.x*width,y:head.y*height,angle:Math.atan2(dy,dx),
  back:13,front:21,halfWidth:10,eyeX:4,eyeY:6,nostrilX:17,nostrilY:2
 };
}
