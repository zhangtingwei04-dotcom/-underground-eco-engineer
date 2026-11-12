/**
 * Project OHM SNAKE V0.7O — continuous translucent SCREEN-SPACE rig silhouette.
 *
 * Draw-only contour derived from V0.7G's exact projected head-to-tail spine,
 * with the same existing display radii. No new body dynamics, bone offsets,
 * 3D collision, animal measurements, scales, skin, textures or saved state.
 *
 * Segment-local cubic Hermite tangents are clamped to avoid overshoot on
 * sharp bends; each sample carries an orthogonal width, not an independent
 * round "bead". Debug nodes belong to an optional developer-only overlay.
 */
export const SNAKE_CONTINUOUS_RIG_VERSION='0.7O';
const F=Object.freeze;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const between=(n,a,b)=>finite(n)&&n>=a&&n<=b;
const fail=why=>{throw new RangeError(why)};
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const length=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
const bezier=(a,b,m,n,t)=>{
 const t2=t*t,t3=t2*t;
 const c0=2*t3-3*t2+1,c1=t3-2*t2+t;
 const c2=-2*t3+3*t2,c3=t3-t2;
 return {x:c0*a.x+c1*m.x+c2*b.x+c3*n.x,
         y:c0*a.y+c1*m.y+c2*b.y+c3*n.y};
};
const derivative=(a,b,m,n,t)=>{
 const t2=t*t;
 const c0=6*t2-6*t,c1=3*t2-4*t+1;
 const c2=-6*t2+6*t,c3=3*t2-2*t;
 return {x:c0*a.x+c1*m.x+c2*b.x+c3*n.x,
         y:c0*a.y+c1*m.y+c2*b.y+c3*n.y};
};
const tangent=(points,i,lim)=>{
 const a=points[Math.max(0,i-1)];
 const b=points[Math.min(points.length-1,i+1)];
 const dx=(b.x-a.x)*.5,dy=(b.y-a.y)*.5;
 const d=Math.hypot(dx,dy),size=Math.min(d,lim*1.35);
 return d<1e-9?{x:0,y:0}:{x:dx*size/d,y:dy*size/d};
};
const q=(n)=>Math.round(n*1000)/1000;
const P=(x,y)=>F({x:q(x),y:q(y)});
const checkFrame=frame=>{
 if(frame?.version!=='0.7G'||frame.skinApplied!==false||
    !Array.isArray(frame.spine)||!Array.isArray(frame.radii)||
    frame.spine.length<10||frame.spine.length>64||
    frame.spine.length!==frame.radii.length||
    !frame.spine.every(p=>p&&between(p.x,-100,1540)&&
      between(p.y,-150,1000))||
    !frame.radii.every(r=>between(r,1,100)))
  fail('invalid_v07o_source_frame');
 const pts=frame.spine;
 for(let i=1;i<pts.length;i++)
  if(length(pts[i-1],pts[i])<1e-6)
   fail('v07o_degenerate_projected_bone');
};
/**
 * The OUTPUT is a closed 2D silhouette, NOT a new skin/3D body mesh.
 * Smooth inner guide and 2 outer edges share exactly the same sampled axis.
 * The existing head mesh (V0.7G) is still rendered separately.
 */
export function buildContinuousTransparentRigV07o(frame,{
 subdivisions=6,widthScale=.84
}={}){
 checkFrame(frame);
 if(!Number.isInteger(subdivisions)||subdivisions<3||
    subdivisions>12||!between(widthScale,.3,1.1))
  fail('invalid_v07o_art_options');
 const axis=[],left=[],right=[],widths=[];
 const count=frame.spine.length;
 for(let i=0;i<count-1;i++){
  const a=frame.spine[i],b=frame.spine[i+1];
  const span=length(a,b);
  const m=tangent(frame.spine,i,span);
  const n=tangent(frame.spine,i+1,span);
  for(let k=0;k<subdivisions;k++){
   const t=k/subdivisions;
   const p=bezier(a,b,m,n,t);
   let d=derivative(a,b,m,n,t);
   let norm=Math.hypot(d.x,d.y);
   if(norm<1e-6){
    d={x:b.x-a.x,y:b.y-a.y};
    norm=Math.hypot(d.x,d.y);
   }
   const width=(frame.radii[i]*(1-t)+frame.radii[i+1]*t)*
    widthScale;
   const nx=-d.y/norm,ny=d.x/norm;
   axis.push(P(p.x,p.y));
   left.push(P(p.x+nx*width,p.y+ny*width));
   right.push(P(p.x-nx*width,p.y-ny*width));
   widths.push(q(width));
  }
 }
 // Final tail sample must coincide exactly with the V0.7G tail joint.
 const tail=frame.spine[count-1],prev=frame.spine[count-2];
 const vx=tail.x-prev.x,vy=tail.y-prev.y;
 const d=Math.hypot(vx,vy);
 const w=frame.radii.at(-1)*widthScale;
 axis.push(P(tail.x,tail.y));
 left.push(P(tail.x-vy/d*w,tail.y+vx/d*w));
 right.push(P(tail.x+vy/d*w,tail.y-vx/d*w));
 widths.push(q(w));
 const shape=F([...left,...right.slice().reverse()]);
 const freeze=v=>F(v);
 const mid=freeze(axis),l=freeze(left),r=freeze(right),ws=freeze(widths);
 return F({
  version:SNAKE_CONTINUOUS_RIG_VERSION,
  sourceVersion:'0.7G',
  status:'screen_space_silhouette_overlay_only_not_a_skinned_mesh',
  camera:'V0.7G_front_glass',
  axis:mid,left:l,right:r,outline:shape,widths:ws,
  sourceJointCount:count,sourcePointCount:count,
  subdivisions,contourPointCount:shape.length,
  headPoint:mid[0],tailPoint:mid.at(-1),
  debugJointRingsDefault:false,
  skinApplied:false,animalGeometryChanged:false,
  affectsCollision:false,affectsEcology:false,
  widthScale
 });
}
