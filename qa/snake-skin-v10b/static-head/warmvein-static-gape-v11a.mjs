/**
 * OHM V1.1A — PUBLIC isolated 3D static snake-head/gape sculpt.
 * Original candidate geometry, not a downloaded Tripo/Meshy model.
 * Four frozen poses: closed / part-open / medium / wide.
 * No moving jaws in gameplay; independent from the actual 24-joint
 * source controller. Do not confuse this shape lab with V0.9U authority.
 *
 * Working hypothesis, not biological validation: upper cranium is
 * stationary; left/right lower jaw branches use a shared posterior
 * rotation plus a little lateral expansion; the flexible floor and
 * mouth lining span the opening. Actual snake gape involves additional
 * joints and mandibular kinesis not simulated here.
 */
export const WARMVEIN_STATIC_GAPE_V11A='1.1A';
export const MOUTH_POSES_V11A=Object.freeze([
 Object.freeze({id:'closed',label:'閉嘴',degrees:0}),
 Object.freeze({id:'slight',label:'微張',degrees:12}),
 Object.freeze({id:'medium',label:'中張',degrees:31}),
 Object.freeze({id:'wide',label:'大張',degrees:52})
]);
const F=Object.freeze;
const T=Math.PI*2;
const palette=F({
 cranium:F([.51,.44,.35]),neck:F([.45,.40,.33]),
 lowerJaw:F([.53,.46,.38]),lip:F([.32,.25,.22]),
 lining:F([.39,.13,.19]),palate:F([.30,.105,.14]),
 tongue:F([.66,.23,.33]),eye:F([.045,.033,.029]),
 eyeRim:F([.27,.155,.09]),eyeglint:F([.90,.84,.68]),
 nostril:F([.065,.047,.037]),belly:F([.64,.58,.49])
});
const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a,n)=>[a[0]*n,a[1]*n,a[2]*n];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],
 a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const length=v=>Math.hypot(...v);
const unit=v=>mul(v,1/Math.max(1e-10,length(v)));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const sizeStops=F([
 [-.46,.080,.081],[-.33,.084,.083],[-.23,.099,.087],
 [-.10,.107,.089],[.02,.110,.090],[.13,.102,.080],
 [.24,.087,.067],[.35,.067,.052],[.45,.041,.038],
 [.52,.014,.018]
].map(x=>F(x)));
function sizeAt(x){
 for(let i=1;i<sizeStops.length;i++){
  const a=sizeStops[i-1],b=sizeStops[i];
  if(x<=b[0]){
   const t=clamp((x-a[0])/(b[0]-a[0]),0,1);
   const z=t*t*(3-2*t);
   return [a[1]+(b[1]-a[1])*z,
    a[2]+(b[2]-a[2])*z];
  }
 }
 return sizeStops.at(-1).slice(1);
}
const headX=F(Array.from({length:37},(_,i)=>-.46+i*(.98/36)));
function transformLower([x,y,z],angle){
 const pivotX=-.34,pivotZ=-.012;
 const dx=x-pivotX,dz=z-pivotZ;
 const c=Math.cos(angle),s=Math.sin(angle);
 const spread=Math.sin(angle)*.014;
 return [
  pivotX+dx*c+dz*s,
  y+(Math.sign(y)||0)*spread*Math.pow(clamp(dx/.85,0,1),1.15),
  pivotZ-dx*s+dz*c
 ];
}
function ringUpper(x,j,n=16){
 const [w,h]=sizeAt(x),t=Math.PI*j/n;
 return [x,w*Math.cos(t),.012+h*Math.pow(Math.max(0,Math.sin(t)),.76)];
}
function ringLower(x,j,angle,n=16){
 const [w,h]=sizeAt(x),t=Math.PI*j/n;
 const u=[x,w*Math.cos(t),-.017-h*.66*Math.sin(t)];
 return transformLower(u,angle);
}
function builder(){
 const vertices=[],colors=[],normals=[],tags=Object.create(null);
 const note=tag=>{tags[tag]=(tags[tag]??0)+1};
 function tri(a,b,c,color,tag){
  const n=unit(cross(sub(b,a),sub(c,a)));
  if(length(n)<1e-8)throw new Error('degenerate_surface_'+tag);
  vertices.push(...a,...b,...c);
  colors.push(...color,...color,...color);
  normals.push(...n,...n,...n);
  note(tag);
 }
 function quad(a,b,c,d,color,tag){
  tri(a,b,c,color,tag);tri(a,c,d,color,tag);
 }
 function uvSurface(uv,nU,nV,color,tag){
  for(let i=0;i<nU;i++)for(let j=0;j<nV;j++){
   const a=uv(i,j),b=uv(i+1,j),c=uv(i+1,j+1),d=uv(i,j+1);
   quad(a,b,c,d,color,tag);
  }
 }
 return {tri,quad,uvSurface,vertices,colors,normals,tags};
}
function sphere(g,center,r,color,tag,latN=8,lonN=12){
 const point=(i,j)=>{
  const phi=-Math.PI/2+Math.PI*i/latN;
  const theta=T*j/lonN;
  return [center[0]+r*Math.cos(phi)*Math.cos(theta),
   center[1]+r*Math.cos(phi)*Math.sin(theta),
   center[2]+r*Math.sin(phi)];
 };
 // avoid degenerate poles with a 0.001 rad inset
 const safe=(i,j)=>{
  const ii=Math.max(.002,Math.min(latN-.002,i));
  return point(ii,j);
 };
 g.uvSurface(safe,latN,lonN,color,tag);
}
function neckTube(g){
 // A real hollow-looking neck is continuous with the same head socket,
 // but this STATIC artist mock is deliberately not the V0.9U source mesh.
 const path=[
  [-1.42,-.08,-.025,.090],[-1.20,-.055,-.015,.091],
  [-.98,-.020,-.010,.088],[-.76,0,0,.084],
  [-.55,0,0,.081],[-.46,0,0,.080]
 ];
 const point=(i,j)=>{
  const p=path[i],t=T*j/16;
  return [p[0],p[1]+Math.cos(t)*p[3],
   p[2]+Math.sin(t)*p[3]*.88];
 };
 for(let i=0;i<path.length-1;i++)
  for(let j=0;j<16;j++)
   g.quad(point(i,j),point(i+1,j),point(i+1,(j+1)%16),
    point(i,(j+1)%16),j>8?palette.belly:palette.neck,'neck');
}
export function buildWarmveinStaticGapeV11a({pose='closed'}={}){
 const def=MOUTH_POSES_V11A.find(x=>x.id===pose);
 if(!def)throw new RangeError('v11a_invalid_static_gape_pose');
 const g=builder(),angle=def.degrees*Math.PI/180;
 // Crown, face and snout, 37 longitudinal rings x 16 curved arc facets.
 g.uvSurface((i,j)=>ringUpper(headX[i],j),headX.length-1,16,
  palette.cranium,'upper_skull');
 // Small raised snout rim and separated upper lip side contours.
 for(let side of [-1,1]){
  for(let i=0;i<headX.length-1;i++){
   const x=headX[i],xx=headX[i+1];
   const [w]=sizeAt(x),[ww]=sizeAt(xx);
   const a=[x,side*w,.012],b=[xx,side*ww,.012];
   g.quad(a,b,[xx,side*ww,.004],[x,side*w,.004],
    palette.lip,'upper_lip');
  }
 }
 // Dark palate visible only after the lower jaw has rotated away.
 g.uvSurface((i,j)=>{
  const x=headX[i],[w]=sizeAt(x),y=(j/12*2-1)*w*.98;
  return [x,y,.003+.0015*Math.cos(Math.PI*y/Math.max(.001,w))];
 },headX.length-1,12,palette.palate,'palate');
 // Two separate lower hemi-mandibular arcs (joined by a flexing mental
 // membrane, not rigidly fused in a permanent lower-jaw block).
 for(let side of [0,1]){
  const begin=side*8;
  g.uvSurface((i,j)=>{
   const x=headX[i],base=ringLower(x,begin+j,angle);
   return base;
  },headX.length-1,8,palette.lowerJaw,
    side===0?'left_lower_jaw':'right_lower_jaw');
 }
 // Inner floor: open pose stretches and sinks with lower jaw; the
 // CLOSED configuration is flattened and hidden beneath the upper lip.
 g.uvSurface((i,j)=>{
  const x=headX[i],[w]=sizeAt(x);
  const y=(j/12*2-1)*w*.93;
  const z=-.022-.007*(1-(y/w)**2);
  return transformLower([x,y,z],angle);
 },headX.length-1,12,palette.lining,'inner_floor');
 // Elastic side lining between roof / moving left-and-right lips.
 for(const side of [-1,1]){
  for(let i=0;i<headX.length-1;i++){
   const x=headX[i],next=headX[i+1];
   const w=sizeAt(x)[0],ww=sizeAt(next)[0];
   const p=[x,side*w,.006],q=[next,side*ww,.006];
   const a=transformLower([x,side*w,-.017],angle);
   const b=transformLower([next,side*ww,-.017],angle);
   // Even when closed the lining is a slender concealed labial strip.
   g.quad(p,q,b,a,palette.lining,'stretching_labial_membrane');
  }
 }
 // Two anchored eyes. Surface occlusion is handled by the renderer's
 // actual depth buffer, not by painting missing far-side eye pixels.
 for(const side of [-1,1]){
  const x=.010,w=sizeAt(x)[0];
  const c=[x,side*(w*.88),.079];
  sphere(g,c,.020,palette.eyeRim,'eye_socket');
  sphere(g,[c[0]+.004,c[1]+side*.011,c[2]+.001],
   .012,palette.eye,'eye_iris');
  sphere(g,[c[0]+.008,c[1]+side*.019,c[2]+.007],
   .003,palette.eyeglint,'eye_glint',5,8);
  const n=[.426,side*.029,.045];
  sphere(g,n,.0043,palette.nostril,'nostril',6,9);
 }
 // Simple forked tongue is present only in wide/static jaw inspection,
 // not as a claim about a snake's yawn or swallowing behavior.
 // It will be added later if the surrounding oral geometry passes.
 neckTube(g);
 const points=g.vertices.length/3;
 if(points<3000||points%3!==0)throw Error('v11a_empty_or_bad_static_geometry');
 const bounds={
  min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]
 };
 for(let i=0;i<g.vertices.length;i+=3)
  for(let a=0;a<3;a++){
   const p=g.vertices[i+a];
   if(!Number.isFinite(p))throw Error('v11a_nonfinite_geometry');
   bounds.min[a]=Math.min(bounds.min[a],p);
   bounds.max[a]=Math.max(bounds.max[a],p);
  }
 return F({
  version:WARMVEIN_STATIC_GAPE_V11A,pose,gapeDegrees:def.degrees,
  vertexCount:points,triangleCount:points/3,
  vertices:new Float32Array(g.vertices),
  colors:new Float32Array(g.colors),
  normals:new Float32Array(g.normals),
  materialTriangleCounts:F({...g.tags}),
  bounds:F({min:F(bounds.min),max:F(bounds.max)}),
  distinctLeftRightMandibularSurfaces:true,
  connectedElasticFloor:true,
  noMovingSourceMotion:true,collisionAndSaveUntouched:true,
  actualV09uMeshUsed:false,
  modelImportedFromExternalGenerator:false,
  threeDimensionalGeometry:true,
  simulatedAnatomyNotScientificallyCertified:true,
  staticVisualApprovalPending:true
 });
}
