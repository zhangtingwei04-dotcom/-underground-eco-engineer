/**
 * OHM — Snake head-and-neck attachment V0.1 (engineering mesh).
 *
 * A species-specific, continuous ring loft for a simple head proxy plus
 * bounded local orientation and stable eye/nostril/mouth/tongue anchors.
 * Uses the current head->tail XYZ spine as an attachment, never changes it.
 *
 * This is not an approved anatomical sculpt, true jaw skeleton, neck IK,
 * physical contact, or measured growth allometry. Artistic dimensions only.
 */
export const SNAKE_HEAD_ATTACH_VERSION='0.1';
const V=(x,y,z)=>Object.freeze({x,y,z});
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const length3=v=>Math.hypot(v.x,v.y,v.z);
const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
const mul=(a,k)=>({x:a.x*k,y:a.y*k,z:a.z*k});
const add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});
const norm=v=>{const l=length3(v);if(l<1e-9)throw new RangeError('degenerate_head_direction');return mul(v,1/l)};
const valid3=v=>v&&finite(v.x)&&finite(v.y)&&finite(v.z);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

/**
 * The section data is an art/rigging test, NOT proportional morphology data.
 * Sections: longitudinal x / total body length, lateral and vertical radii
 * relative to the selected species' technical trunk radius, dorsal nose lift.
 * The first ring is open and deliberately overlaps the existing neck mesh;
 * a proper joined sculpt + skinning remains future work.
 */
export const SNAKE_HEAD_ART_PROFILES=Object.freeze({
  generic_snake:Object.freeze({radiusRatio:.052,headStyle:'neutral',
    sections:Object.freeze([
      [-.066,.83,.79,0],[-.054,.86,.84,0],[-.038,1.01,.91,0],
      [-.020,1.06,.91,0],[-.002,.92,.75,0],
      [.015,.69,.54,0],[.029,.32,.30,0],[.033,.06,.08,0]
    ])
  }),
  corn_snake:Object.freeze({radiusRatio:.045,headStyle:'corn-smooth',
    sections:Object.freeze([
      [-.064,.80,.77,0],[-.050,.86,.82,0],[-.034,.97,.88,0],
      [-.016,1.06,.86,0],[.003,.91,.71,0],
      [.023,.62,.49,0],[.036,.26,.22,0],[.040,.06,.07,0]
    ])
  }),
  hognose_snake:Object.freeze({radiusRatio:.056,headStyle:'upturned-rostral',
    sections:Object.freeze([
      [-.066,.82,.80,0],[-.052,.87,.83,0],[-.036,1.04,.94,0],
      [-.021,1.16,1.01,0],[-.002,1.03,.86,0],
      [.013,.78,.66,.002],[.025,.51,.45,.009],
      [.032,.20,.24,.015],[.034,.06,.09,.016]
    ])
  })
});
function checkFactors(f){
  if(!f||typeof f!=='object'||Array.isArray(f)||
    Object.keys(f).some(k=>!['length','width','height'].includes(k)) ||
    !['length','width','height'].every(k=>finite(f[k])&&f[k]>=.75&&f[k]<=1.25))
      throw new RangeError('invalid_head_shape_factors');
}
function makeAnchors(p,length,factors){
  const w=p.radiusRatio*length*factors.width;
  const h=p.radiusRatio*length*factors.height;
  const l=length*factors.length;
  const hog=p.headStyle==='upturned-rostral';
  const nose=hog?.015*length*factors.height:0;
  return Object.freeze({
    rostralTip:V(l*(hog?.033:.030),0,nose),
    leftEye:V(-l*.020,+w*.96,h*.26),
    rightEye:V(-l*.020,-w*.96,h*.26),
    leftNostril:V(l*.019,+w*.42,hog?nose*.45:h*.14),
    rightNostril:V(l*.019,-w*.42,hog?nose*.45:h*.14),
    leftMouthCorner:V(-l*.028,+w*.82,-h*.33),
    rightMouthCorner:V(-l*.028,-w*.82,-h*.33),
    tongueRoot:V(l*.027,0,-h*.24),
    neckSocket:V(0,0,0)
  });
}

/** Create once per species/individual dimension update, not every frame. */
export function makeSnakeHeadAttachment({
  speciesId='generic_snake',length=1.4,
  factors={length:1,width:1,height:1},radialSegments=16
}={}){
  if(typeof speciesId!=='string'||!own(SNAKE_HEAD_ART_PROFILES,speciesId))
    throw new RangeError('unknown_head_profile');
  if(!finite(length)||length<.3||length>5||
    !Number.isInteger(radialSegments)||radialSegments<8||radialSegments>32)
    throw new RangeError('invalid_head_dimensions');
  checkFactors(factors);
  const p=SNAKE_HEAD_ART_PROFILES[speciesId];
  const vertices=[],uv=[],triangles=[];
  for(let i=0;i<p.sections.length;i++){
    const [x,side,height,rise]=p.sections[i];
    for(let j=0;j<radialSegments;j++){
      const theta=Math.PI*2*j/radialSegments;
      const yr=p.radiusRatio*length*side*factors.width*Math.sin(theta);
      const zr=p.radiusRatio*length*height*factors.height*Math.cos(theta)
        +rise*length*factors.height;
      vertices.push(V(x*length*factors.length,yr,zr));
      uv.push(Object.freeze({u:i/(p.sections.length-1),v:j/radialSegments}));
      if(i<p.sections.length-1){
        const a=i*radialSegments+j,b=i*radialSegments+(j+1)%radialSegments;
        triangles.push(a,a+radialSegments,b,b,a+radialSegments,b+radialSegments);
      }
    }
  }
  const shape=Object.freeze({length:factors.length,width:factors.width,height:factors.height});
  return Object.freeze({
    version:SNAKE_HEAD_ATTACH_VERSION,speciesId,headStyle:p.headStyle,
    totalBodyLength:length,shape,
    radialSegments,ringCount:p.sections.length,
    localVertices:Object.freeze(vertices),uv:Object.freeze(uv),
    triangles:Object.freeze(triangles),
    localAnchors:makeAnchors(p,length,factors),
    status:'artist_test_mesh_no_verified_anatomical_proportions'
  });
}

function deriveBasis(spine,upHint){
  if(!Array.isArray(spine)||spine.length<3||spine.length>64||
    spine.some(p=>!valid3(p)))throw new RangeError('invalid_head_spine');
  const forward=norm(sub(spine[0],spine[1]));
  // Project caller-provided previous-up for temporally continuous rotation.
  // Without one, global Z is a reference, with a Y fallback near vertical.
  const hint=upHint??{x:0,y:0,z:1};
  if(!valid3(hint)||length3(hint)<1e-8)throw new RangeError('invalid_up_hint');
  let up=sub(hint,mul(forward,dot(hint,forward)));
  if(length3(up)<1e-5){
    const fallback=Math.abs(forward.y)<.9?{x:0,y:1,z:0}:{x:1,y:0,z:0};
    up=sub(fallback,mul(forward,dot(fallback,forward)));
  }
  up=norm(up);
  const side=norm(cross(up,forward));
  return {forward,side,up:norm(cross(forward,side))};
}
function orient(basis,yaw,pitch,roll){
  let {forward,side,up}=basis;
  const cy=Math.cos(yaw),sy=Math.sin(yaw);
  const yawForward=add(mul(forward,cy),mul(side,sy));
  side=add(mul(side,cy),mul(forward,-sy));
  const cp=Math.cos(pitch),sp=Math.sin(pitch);
  forward=add(mul(yawForward,cp),mul(up,sp));
  up=add(mul(up,cp),mul(yawForward,-sp));
  const cr=Math.cos(roll),sr=Math.sin(roll);
  const rolledSide=add(mul(side,cr),mul(up,sr));
  up=add(mul(up,cr),mul(side,-sr));
  return Object.freeze({forward:V(...[forward.x,forward.y,forward.z]),
    side:V(...[rolledSide.x,rolledSide.y,rolledSide.z]),
    up:V(up.x,up.y,up.z)});
}

/**
 * Apply small relative head look angles without resampling the body's
 * fixed-length spine. 3D neck IK and mesh seam blending are NOT solved.
 *
 * yaw/pitch limited to +/-0.30rad; roll to +/-0.12rad to prevent severe
 * discontinuity with the currently uncorrected neck. A later neck solver
 * must blend these into the first few vertebral control points.
 */
export function poseSnakeHeadAttachment(head,spine,{
  yaw=0,pitch=0,roll=0,tongueExtension=0,upHint=null
}={}){
  if(!head||head.version!==SNAKE_HEAD_ATTACH_VERSION||
    !Array.isArray(head.localVertices)||!head.localAnchors)
    throw new RangeError('invalid_head_attachment');
  if(!finite(yaw)||Math.abs(yaw)>.3||!finite(pitch)||Math.abs(pitch)>.3||
    !finite(roll)||Math.abs(roll)>.12||
    !finite(tongueExtension)||tongueExtension<0||tongueExtension>1)
    throw new RangeError('invalid_head_articulation');
  const base=deriveBasis(spine,upHint);
  const frame=orient(base,yaw,pitch,roll);
  const origin=spine[0];
  const transform=v=>V(
    origin.x+frame.forward.x*v.x+frame.side.x*v.y+frame.up.x*v.z,
    origin.y+frame.forward.y*v.x+frame.side.y*v.y+frame.up.y*v.z,
    origin.z+frame.forward.z*v.x+frame.side.z*v.y+frame.up.z*v.z
  );
  const anchors=Object.fromEntries(Object.entries(head.localAnchors)
    .map(([key,p])=>[key,transform(p)]));
  let tongue=null;
  if(tongueExtension>0){
    const l=head.totalBodyLength*tongueExtension;
    const root=head.localAnchors.tongueRoot;
    const stem={x:root.x+l*.022,y:0,z:root.z};
    const fork=l*.0075;
    tongue=Object.freeze({
      root:transform(root),stem:transform(stem),
      forkLeft:transform({x:stem.x+l*.012,y:fork,z:stem.z-l*.001}),
      forkRight:transform({x:stem.x+l*.012,y:-fork,z:stem.z-l*.001}),
      provenance:'art_animation_proxy_not_biological_frequency'
    });
  }
  return Object.freeze({
    version:SNAKE_HEAD_ATTACH_VERSION,speciesId:head.speciesId,
    origin:V(origin.x,origin.y,origin.z),frame,
    meshPositions:Object.freeze(head.localVertices.map(transform)),
    uv:head.uv,triangles:head.triangles,
    anchors:Object.freeze(anchors),tongue,
    neck:Object.freeze({
      first:V(spine[0].x,spine[0].y,spine[0].z),
      second:V(spine[1].x,spine[1].y,spine[1].z),
      third:V(spine[2].x,spine[2].y,spine[2].z),
      correctionRequired:Math.abs(yaw)+Math.abs(pitch)+Math.abs(roll)>1e-9
    }),
    status:'head_orientation_prototype_no_neck_ik_or_seam_blending'
  });
}
