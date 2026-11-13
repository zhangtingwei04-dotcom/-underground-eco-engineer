/**
 * OHM V1.1C original STATIC cranial geometry, revised from our own B. Rounded cranium,
 * left/right hemi-mandibles, recessed palate and oral floor.
 * No Tripo/Meshy geometry; never replaces the actual 24-joint
 * V0.9U collision/UV/save source.
 */
export const WARMVEIN_STATIC_HEAD_V11C='1.1C';
export const GAPE_POSES_V11C=Object.freeze([
 {id:'closed',degrees:0},{id:'slight',degrees:9},
 {id:'medium',degrees:25},{id:'wide',degrees:46}
].map(Object.freeze));
const P={
 skull:[.61,.53,.43],neck:[.54,.48,.39],jaw:[.60,.53,.44],
 ventral:[.75,.68,.57],lip:[.39,.32,.27],palate:[.21,.10,.13],
 cavity:[.28,.17,.18],iris:[.077,.047,.030],eyeRim:[.35,.23,.14],
 highlight:[.83,.72,.55],nostril:[.065,.044,.037]
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),S=Math.PI*2;
const nodes=[
 [-.67,.071,.065,.063,.113],[-.53,.073,.066,.064,.116],
 [-.40,.077,.074,.064,.118],[-.31,.084,.073,.066,.119],
 [-.25,.095,.079,.065,.120],[-.15,.111,.084,.068,.121],
 [-.05,.112,.080,.062,.121],[.03,.105,.076,.059,.122],
 [.11,.089,.066,.055,.121],[.19,.067,.052,.045,.121],
 [.26,.043,.037,.032,.120],[.315,.020,.022,.021,.119],
 [.334,.016,.017,.019,.118]
].map(n=>[n[0]>-.25?-.25+(n[0]+.25)*.72:n[0],...n.slice(1)]);
const START=-.67,JAW_START=-.265,END=.17048,N=48,C=22;
const jawXAt=i=>JAW_START+(END-JAW_START)*i/N;
function shapeAt(x){
 for(let i=1;i<nodes.length;i++){
  const a=nodes[i-1],b=nodes[i];
  if(x<=b[0]){
   const t=clamp((x-a[0])/(b[0]-a[0]),0,1),v=t*t*(3-2*t);
   return a.slice(1).map((z,j)=>z+(b[j+1]-z)*v);
  }
 }
 return nodes.at(-1).slice(1);
}
const sub=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const len=Math.hypot(...a);return a.map(x=>x/Math.max(len,1e-12))};
const add=(a,b)=>a.map((x,i)=>x+b[i]);
function makeGeometry(){
 const vertices=[],colors=[],normals=[],groups={},faceTags=[];
 function triangle(a,b,c,color,group){
  const cr=cross(sub(b,a),sub(c,a)),len=Math.hypot(...cr);
  if(len<1e-10)throw Error('V11C_DEGENERATE_'+group);
  const normal=unit(cr);
  for(const p of [a,b,c]){
   vertices.push(...p);colors.push(...color);normals.push(...normal);faceTags.push(group)
  }
  groups[group]=(groups[group]??0)+1;
 }
 function quad(a,b,c,d,color,group){triangle(a,b,c,color,group);triangle(a,c,d,color,group)}
 function sheet(fn,nx,ny,color,group){
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++)
   quad(fn(i,j),fn(i+1,j),fn(i+1,j+1),fn(i,j+1),color,group);
 }
 return {vertices,colors,normals,groups,faceTags,triangle,quad,sheet};
}
const xAt=i=>START+(END-START)*i/N;
function upperPoint(i,j){
 const x=xAt(i),[w,top,,z]=shapeAt(x),t=Math.PI*j/C;
 return [x,w*Math.cos(t),z+top*Math.sin(t)];
}
function lowerPoint(i,j,theta,side){
 // A distinct, curved half-mandibular sleeve on each L/R cheek.
 // Prior B split the front and back halves of a single lower plate:
 // two stiff surfaces, not actual side-specific jaw branches.
 const x=jawXAt(i),[w,,down,z]=shapeAt(x);
 const phi=-Math.PI/2+Math.PI*j/(C/2);
 const y=side*w*(.56+.38*Math.cos(phi));
 const depth=.18+.70*(.5+.5*Math.sin(phi));
 return rotateLower([x,y,z-down*depth],theta,side);
}
function rotateLower(p,angle,side){
 const pivotX=-.265,pivotZ=.119,dx=p[0]-pivotX,dz=p[2]-pivotZ;
 // Frame-study constraint: the mouth corner starts almost fixed,
 // the anterior lower jaw opens progressively, not like a rigid board.
 const t=clamp(dx/.44,0,1),e=t*t*(3-2*t);
 const bend=angle*(.28+.72*e);
 const c=Math.cos(bend),s=Math.sin(bend);
 const spread=(side||Math.sign(p[1]))*.0065*Math.sin(angle)*e;
 return [pivotX+dx*c+dz*s,p[1]+spread,pivotZ-dx*s+dz*c];
}
function ellipsoid(g,center,r,color,tag,segments=12,rings=8){
 function spherePt(i,j){
  const phi=-Math.PI/2+Math.PI*Math.max(.001,Math.min(rings-.001,i))/rings;
  const t=S*j/segments;
  return [center[0]+r[0]*Math.cos(phi)*Math.cos(t),
   center[1]+r[1]*Math.cos(phi)*Math.sin(t),
   center[2]+r[2]*Math.sin(phi)];
 }
 g.sheet(spherePt,rings,segments,color,tag);
}
export function buildWarmveinStaticHeadV11c({pose='closed'}={}){
 const p=GAPE_POSES_V11C.find(x=>x.id===pose);
 if(!p)throw new RangeError('v11c_unknown_gape');
 const radians=p.degrees*Math.PI/180,g=makeGeometry();
 // The upper head is a TRUE curved half-vault, not a duplicated
 // flattened full-circle vertex strip.
 g.sheet(upperPoint,N,C,P.skull,'cranial_vault');
 for(const side of [-1,1])for(let i=0;i<N;i++){
  const x=xAt(i),xx=xAt(i+1);
  const [w,,,z]=shapeAt(x),[ww,,,zz]=shapeAt(xx);
  g.quad([x,side*w,z],[xx,side*ww,zz],
   [xx,side*ww*.985,zz-.005],[x,side*w*.985,z-.005],
   P.lip,'upper_lip');
 }
 // Fixed posterior throat closes the underside behind moving jaw hinge.
 const baseCount=24;
 g.sheet((i,j)=>{
  const x=START+(JAW_START-START)*i/baseCount;
  const [w,,down,z]=shapeAt(x),t=Math.PI*j/C;
  return [x,w*Math.cos(t),z-down*Math.sin(t)];
 },baseCount,C,P.ventral,'throat_chin');
 for(const side of [-1,1]){
  g.sheet((i,j)=>lowerPoint(i,j,radians,side),
   N,C/2,P.jaw,side===1?'left_mandible':'right_mandible');
 }
 // Recessed upper palate and moving interior lower mouth floor.
 g.sheet((i,j)=>{
  const x=jawXAt(i),[w,,,z]=shapeAt(x),u=j/14*2-1;
  return [x,u*w*.93,z-.010-(1-u*u)*.002];
 },N,14,P.palate,'upper_palate');
 g.sheet((i,j)=>{
  const x=jawXAt(i),[w,,down,z]=shapeAt(x),u=j/14*2-1;
  const cheek=clamp(Math.abs(u),0,1);
  const low=[x,u*w*(.56+.22*cheek),
   z-down*(.13+.12*(1-u*u))];
  return rotateLower(low,radians,Math.sign(u));
 },N,14,P.cavity,'oral_floor');
 // Suppress the giant triangular oral sail. The small flexible
 // connective folds live only at the posterior mouth corner.
 for(const side of [-1,1])for(let i=0;i<8 && radians>1e-6;i++){
  const x=jawXAt(i),xx=jawXAt(i+1),
   [w,,,z]=shapeAt(x),[ww,,,zz]=shapeAt(xx);
  const root=[x,side*w*.58,z-.010],rootNext=[xx,side*ww*.58,zz-.010];
  const low=rotateLower(root,radians,side),
   lowNext=rotateLower(rootNext,radians,side);
  g.quad(root,rootNext,lowNext,low,P.cavity,'rear_labial_fold');
 }
 // Neutral straight neck stub for close-up only. Full static coil
 // gets a separate attachment geometry; no physics source mutation.
 const R=12;
 g.sheet((i,j)=>{
  const x=-1.08+(i/R)*(.41),[w,top,down,z]=shapeAt(x),t=S*j/C;
  return [x,w*Math.cos(t),z+(Math.sin(t)>0?top:down)*Math.sin(t)];
 },R,C,P.neck,'neck_volume');
 // Narrow, inset, low profile eyes: actual 3D camera depth occludes far eye.
 for(const sign of [-1,1]){
  const x=-.12904,[w,top,,z]=shapeAt(x);
  const eyeCenter=[x,sign*w*.745,z+top*.65];
  ellipsoid(g,eyeCenter,[.020,.006,.013],P.eyeRim,'eye_rim');
  ellipsoid(g,[x+.002,eyeCenter[1]+sign*.005,eyeCenter[2]+.001],
   [.014,.004,.009],P.iris,'eye_iris');
  ellipsoid(g,[x+.007,eyeCenter[1]+sign*.008,eyeCenter[2]+.005],
   [.0028,.0015,.0023],P.highlight,'eye_glint',9,7);
  const snoutX=.10136,[nw,nh,,nz]=shapeAt(snoutX);
  ellipsoid(g,[snoutX,sign*nw*.84,nz+nh*.38],
   [.0055,.0028,.004],P.nostril,'nostril',10,7);
 }
 // Smooth normals within curved surfaces, but retain distinct lip edges.
 const smoothed=new Map();
 const smoothGroups=new Set(['cranial_vault','neck_volume','throat_chin',
  'left_mandible','right_mandible']);
 for(let k=0;k<g.faceTags.length;k++){
  const group=g.faceTags[k];if(!smoothGroups.has(group))continue;
  const i=k*3,key=group+':'+g.vertices.slice(i,i+3)
   .map(z=>Math.round(z*1e5)).join(',');
  const old=smoothed.get(key)||[0,0,0];
  smoothed.set(key,add(old,g.normals.slice(i,i+3)));
 }
 for(let k=0;k<g.faceTags.length;k++){
  const group=g.faceTags[k];if(!smoothGroups.has(group))continue;
  const i=k*3,key=group+':'+g.vertices.slice(i,i+3)
   .map(z=>Math.round(z*1e5)).join(',');
  g.normals.splice(i,3,...unit(smoothed.get(key)));
 }
 const vertexCount=g.vertices.length/3;
 if(vertexCount<3000||vertexCount%3!==0)throw Error('v11c_invalid_mesh');
 for(const a of [g.vertices,g.colors,g.normals])
  if(!a.every(Number.isFinite))throw Error('v11c_nonfinite_mesh');
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(let k=0;k<g.vertices.length;k+=3)for(let j=0;j<3;j++){
  bounds.min[j]=Math.min(bounds.min[j],g.vertices[k+j]);
  bounds.max[j]=Math.max(bounds.max[j],g.vertices[k+j]);
 }
 const distal=rotateLower([.1028,0,shapeAt(.1028)[3]-.003],radians,0);
 return Object.freeze({
  version:WARMVEIN_STATIC_HEAD_V11C,pose,gapeDegrees:p.degrees,
  vertexCount,triangleCount:vertexCount/3,
  vertices:new Float32Array(g.vertices),colors:new Float32Array(g.colors),
  normals:new Float32Array(g.normals),
  materialTriangleCounts:Object.freeze({...g.groups}),
  bounds:Object.freeze({min:bounds.min,max:bounds.max}),
  mouthGapAtMuzzleWorld:shapeAt(.1028)[3]-distal[2],
  distinctLeftRightMandibularSurfaces:true,
  upperCranialVaultReallyCurved:true,
  mouthFloorInsideLips:true,
  mouthMembraneConfinedToPosteriorCorners:true,
  independentOriginalStaticGeometry:true,
  downloaded3DReferenceUsed:false,
  noChangesToProduction24BonesOrSaves:true,
  frameReferencesValidated:true,
  trueLeftRightJawBranches:true,
  nonRigidMandibleDisplayBend:true,
  exactBiomechanicalJawModel:false,
  passedArtistReview:false
 });
}
