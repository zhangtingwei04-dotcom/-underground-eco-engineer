/**
 * OHM Snake Rig 3D — V0.4A engineering geometry foundation.
 * Private engine-neutral code. No Blender/Phaser/Three.js dependency.
 *
 * Body coordinates: u=0 head, u=1 tail; local +X is the forward nose
 * direction, rest spine points along -X. Cross-section local +Z = dorsum.
 * This is an artistic mesh prototype, NOT measured serpent anatomy.
 */
export const SNAKE_RIG_3D_VERSION=1;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const v=(x,y,z)=>Object.freeze({x,y,z});
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const mul=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const norm=a=>Math.hypot(a.x,a.y,a.z);
const unit=(a)=>{const n=norm(a);if(n<1e-8)throw new RangeError('degenerate_spine');return mul(a,1/n)};
const along=(a,b,t)=>add(a,mul(sub(b,a),t));
function validateVec(p){return p&&finite(p.x)&&finite(p.y)&&finite(p.z)}
/**
 * General snake rig + species-scoped ART profiles.
 * Generic is deliberately non-taxonomic; do not use its dimensions as
 * husbandry, growth, welfare, or correct species anatomy evidence.
 * Hognose values preserve V0.4A byte-equivalent default geometry.
 */
export const SNAKE_RIG_PROFILES=Object.freeze({
  hognose_snake:Object.freeze({label:'Western hognose art prototype',
    body:'hognose_legacy',head:'hognose_rostral_art',
    radiusScale:.056,verticalScale:.85,tailStart:.58}),
  generic_snake:Object.freeze({label:'Neutral medium snake skeleton reference',
    body:'neutral',head:'neutral_smooth',
    radiusScale:.052,verticalScale:.84,tailStart:.61}),
  corn_snake:Object.freeze({label:'Corn snake proportion test, not anatomical review',
    body:'slender',head:'corn_smooth_art',
    radiusScale:.045,verticalScale:.82,tailStart:.64})
});
function radiusAt(u,length,profile){
  if(profile.body==='hognose_legacy'){
    // Keep the original V0.4A hognose mesh exactly unchanged.
    const scale=length*.056;
    if(u<.065)return scale*(1.01-.18*(u/.065));
    if(u<.16)return scale*(.83+.20*((u-.065)/.095));
    if(u<.58)return scale*(1.03+0.03*Math.sin((u-.16)*Math.PI/.42));
    const tail=clamp((1-u)/.42,0,1);
    return Math.max(length*.001,scale*1.03*Math.pow(tail,1.15));
  }
  // Generic prototype: modest head/neck transition, round trunk,
  // gradual full-tail taper. Controls have no physical unit meaning.
  const scale=length*profile.radiusScale,slender=profile.body==='slender';
  if(u<.055)return scale*(slender?.80:.92);
  if(u<.16){
    const t=(u-.055)/.105;
    const neckStart=slender?.80:.92;
    return scale*(neckStart+(1-neckStart)*t);
  }
  if(u<profile.tailStart){
    return scale*(1+.025*Math.sin(Math.PI*(u-.16)/(profile.tailStart-.16)));
  }
  const fraction=clamp((1-u)/(1-profile.tailStart),0,1);
  return Math.max(length*.001,scale*Math.pow(fraction,slender?1.08:1.14));
}
function cumulative(points){
  const out=[0];
  for(let i=1;i<points.length;i++){
    const ds=norm(sub(points[i],points[i-1]));
    if(!finite(ds))throw new RangeError('invalid_spine');
    out.push(out[i-1]+ds);
  }
  if(out[out.length-1]<1e-4)throw new RangeError('degenerate_spine');
  return out;
}
function pointAt(points,cum,u){
  const target=u*cum[cum.length-1];
  let lo=0,hi=cum.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(cum[mid]<=target)lo=mid;else hi=mid}
  const t=clamp((target-cum[lo])/(cum[hi]-cum[lo]||1),0,1);
  return along(points[lo],points[hi],t);
}
/**
 * Stable parallel-transport-style cross-sections for modest 3D bending.
 * Not a physical IK solver; extreme reversals require further constraints.
 */
export function sampleSnakeSpine(points,{samples=65}={}){
  if(!Array.isArray(points)||points.length<2||points.length>2048||
    points.some(p=>!validateVec(p)))throw new RangeError('invalid_spine_points');
  if(!Number.isInteger(samples)||samples<3||samples>512)throw new RangeError('invalid_sample_count');
  const distance=cumulative(points),result=[];
  let previousNormal=null;
  for(let i=0;i<samples;i++){
    const u=i/(samples-1),p=pointAt(points,distance,u);
    const prev=pointAt(points,distance,clamp(u-1/(samples-1),0,1));
    const next=pointAt(points,distance,clamp(u+1/(samples-1),0,1));
    const tangent=unit(sub(next,prev));
    let normal;
    if(previousNormal){
      const projected=sub(previousNormal,mul(tangent,dot(previousNormal,tangent)));
      normal=norm(projected)>1e-7?unit(projected):null;
    }
    if(!normal){
      const up={x:0,y:0,z:1},side=cross(up,tangent);
      normal=unit(norm(side)>1e-7?side:cross({x:0,y:1,z:0},tangent));
    }
    const binormal=unit(cross(tangent,normal));
    result.push(Object.freeze({u,position:v(p.x,p.y,p.z),
      tangent:v(tangent.x,tangent.y,tangent.z),
      normal:v(normal.x,normal.y,normal.z),
      binormal:v(binormal.x,binormal.y,binormal.z)}));
    previousNormal=normal;
  }
  return Object.freeze(result);
}
/** Generate an anatomical-neutral continuous skinned tube + stable UV.
 * Index groups are glTF-friendly triangles; ends intentionally uncapped while
 * a detailed head sculpt and tail mesh are still being researched.
 */
export function makeSnakeRig3D({speciesId='hognose_snake',length=1.4,
  boneCount=14,ringCount=97,radialSegments=16}={}){
  // Shared technical skeleton; only explicitly registered shape profiles allowed.
  if(!Object.prototype.hasOwnProperty.call(SNAKE_RIG_PROFILES,speciesId))
    throw new RangeError('species_not_implemented');
  const profile=SNAKE_RIG_PROFILES[speciesId];
  if(!finite(length)||length<.3||length>5||
     !Number.isInteger(boneCount)||boneCount<4||boneCount>64||
     !Number.isInteger(ringCount)||ringCount<boneCount*2||ringCount>512||
     !Number.isInteger(radialSegments)||radialSegments<8||radialSegments>32)
    throw new RangeError('invalid_rig_parameters');
  const bones=Array.from({length:boneCount},(_,i)=>Object.freeze({
    name:'OHM_Spine_'+String(i).padStart(2,'0'),
    parent:i?i-1:null,
    restHead:v(-length*i/boneCount,0,0),
    restTail:v(-length*(i+1)/boneCount,0,0)
  }));
  const vertices=[],uv=[],joints=[],weights=[],triangles=[];
  for(let i=0;i<ringCount;i++){
    const u=i/(ringCount-1),r=radiusAt(u,length,profile),at=u*(boneCount-1);
    const a=Math.min(boneCount-2,Math.floor(at)),b=a+1,t=clamp(at-a,0,1);
    for(let j=0;j<radialSegments;j++){
      const theta=2*Math.PI*j/radialSegments;
      const y=r*Math.sin(theta),z=r*profile.verticalScale*Math.cos(theta);
      vertices.push(v(-length*u,y,z));
      uv.push(Object.freeze({u,v:j/radialSegments}));
      joints.push(Object.freeze([a,b,0,0]));
      weights.push(Object.freeze([1-t,t,0,0]));
      if(i<ringCount-1){
        const nx=i*radialSegments+j,n1=i*radialSegments+(j+1)%radialSegments;
        triangles.push(nx,nx+radialSegments,n1);
        triangles.push(n1,nx+radialSegments,n1+radialSegments);
      }
    }
  }
  return Object.freeze({
    schemaVersion:SNAKE_RIG_3D_VERSION,speciesId,profileId:speciesId,
    headStyle:profile.head,length,boneCount,ringCount,radialSegments,
    bones:Object.freeze(bones),vertices:Object.freeze(vertices),
    uv:Object.freeze(uv),joints:Object.freeze(joints),weights:Object.freeze(weights),
    triangles:Object.freeze(triangles),
    headAnchors:Object.freeze(profile.head==='hognose_rostral_art'?{
      rostralTip:v(length*.023,0,length*.014), // preserve old mild rostral art
      nearEye:v(-length*.018,-length*.027,length*.028),
      farEye:v(-length*.018,length*.027,length*.028),
      nearNostril:v(length*.012,-length*.016,length*.018),
      farNostril:v(length*.012,length*.016,length*.018)
    }:{
      // Generic smooth head: NO upturned hognose rostral feature.
      // Placeholders for future species-reviewed head mesh, not eye anatomy.
      rostralTip:v(length*.018,0,0),
      nearEye:v(-length*.017,-length*.022,length*.020),
      farEye:v(-length*.017,length*.022,length*.020),
      nearNostril:v(length*.007,-length*.013,length*.010),
      farNostril:v(length*.007,length*.013,length*.010)
    }),
    status:'prototype_no_anatomical_validation'
  });
}
/** Deform art mesh onto supplied head-to-tail XYZ centerline.
 * u/v and per-vertex weights remain unchanged across poses, preventing
 * the material pattern's identity from rerolling during animation.
 */
export function deformSnakeRig3D(rig,spinePoints){
  if(!rig||rig.schemaVersion!==SNAKE_RIG_3D_VERSION||
    !Array.isArray(rig.vertices)||!Array.isArray(rig.uv)||
    !Array.isArray(spinePoints))throw new RangeError('invalid_rig');
  const rings=sampleSnakeSpine(spinePoints,{samples:rig.ringCount});
  if(rings.length*rig.radialSegments!==rig.vertices.length)
    throw new RangeError('inconsistent_rig');
  const posed=rig.vertices.map((vert,i)=>{
    const frame=rings[Math.floor(i/rig.radialSegments)];
    const p=add(add(frame.position,mul(frame.normal,vert.y)),
      mul(frame.binormal,vert.z));
    return v(p.x,p.y,p.z);
  });
  return Object.freeze({
    schemaVersion:SNAKE_RIG_3D_VERSION,
    positions:Object.freeze(posed),uv:rig.uv,
    triangles:rig.triangles,headFrame:rings[0],tailFrame:rings.at(-1),
    frames:rings
  });
}
