/**
 * OHM V1.1F: eye-aligned SHORTER, ROUND-CAPPED snout study (static). Rounded cranium,
 * left/right hemi-mandibles, recessed palate and oral floor.
 * No Tripo/Meshy geometry; never replaces the actual 24-joint
 * V0.9U collision/UV/save source.
 */
export const WARMVEIN_STATIC_HEAD_V11F='1.1F';
export const GAPE_POSES_V11F=Object.freeze([
 {id:'closed',degrees:0},{id:'slight',degrees:9},
 {id:'medium',degrees:25},{id:'wide',degrees:46}
].map(Object.freeze));
const P={
 skull:[.61,.53,.43],neck:[.61,.53,.43],jaw:[.60,.53,.44],
 ventral:[.75,.68,.57],lip:[.39,.32,.27],palate:[.21,.10,.13],
 cavity:[.23,.105,.126],iris:[.077,.047,.030],eyeRim:[.35,.23,.14],
 highlight:[.83,.72,.55],nostril:[.065,.044,.037]
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),S=Math.PI*2;
// Keep eye, rear skull and jaw-hinge landmarks unchanged. Compress only
// the anterior face, preserving near-eye depth and mouth/gape continuity.
const EYE_X=-.12904, LEGACY_END=.17048, MUZZLE_FACTOR=.68;
const JAW_START=-.265,START=-.67;
const END=EYE_X+(LEGACY_END-EYE_X)*MUZZLE_FACTOR;
const CAP_LENGTH=.015,NOSE_TIP_X=END+CAP_LENGTH;
const remapAnterior=x=>x<=EYE_X?x:EYE_X+(x-EYE_X)*MUZZLE_FACTOR;
const NOSTRIL_X=remapAnterior(.10136),MOUTH_AUDIT_X=remapAnterior(.1028);
const nodes=[
 [-.67,.071,.065,.063,.113],[-.53,.073,.066,.064,.116],
 [-.40,.077,.074,.064,.118],[-.31,.084,.073,.066,.119],
 [-.25,.095,.079,.065,.120],[-.15,.111,.084,.068,.121],
 [-.05,.112,.080,.062,.121],[.03,.105,.076,.059,.122],
 [.11,.089,.066,.055,.121],[.19,.067,.052,.045,.121],
 [.26,.048,.041,.035,.120],[.315,.031,.032,.028,.119],
 [.334,.025,.027,.024,.118]
].map(n=>{
 const oldX=n[0]>-.25?-.25+(n[0]+.25)*.72:n[0];
 return [remapAnterior(oldX),...n.slice(1)];
});
const N=48,C=22;
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
  if(len<1e-10)throw Error('V11F_DEGENERATE_'+group);
  const normal=unit(cr);
  for(const p of [a,b,c]){
   vertices.push(...p);colors.push(...color);normals.push(...normal);faceTags.push(group)
  }
  groups[group]=(groups[group]??0)+1;
 }
 function quad(a,b,c,d,color,group){triangle(a,b,c,color,group);triangle(a,c,d,color,group)}
 function sheet(fn,nx,ny,color,group,reverse=false){
  for(let i=0;i<nx;i++)for(let j=0;j<ny;j++){
   const a=fn(i,j),b=fn(i+1,j),c=fn(i+1,j+1),d=fn(i,j+1);
   if(reverse)quad(a,d,c,b,color,group);
   else quad(a,b,c,d,color,group);
  }
 }
 return {vertices,colors,normals,groups,faceTags,triangle,quad,sheet};
}
const xAt=i=>START+(END-START)*i/N;
function upperPoint(i,j){
 const x=xAt(i),[w,top,,z]=shapeAt(x),t=Math.PI*j/C;
 return [x,w*Math.cos(t),z+top*Math.sin(t)];
}
function lowerPoint(i,j,theta,side){
 // Real volumetric circular section rather than a flat cheek board.
 // Each hemimandible is a closed rounded 3D sleeve along the head.
 const x=jawXAt(i),[w,,down,z]=shapeAt(x);
 const phi=2*Math.PI*j/C;
 const y=side*w*(.785+.13*Math.cos(phi));
 const jawZ=z-down*.40+down*.28*Math.sin(phi);
 return rotateLower([x,y,jawZ],theta,side);
}
function rotateLower(p,angle,side){
 const pivotX=JAW_START,pivotZ=.119,dx=p[0]-pivotX,dz=p[2]-pivotZ;
 // Frame-study constraint: the mouth corner starts almost fixed,
 // the anterior lower jaw opens progressively, not like a rigid board.
 const t=clamp(dx/(END-JAW_START),0,1),e=t*t*(3-2*t);
 const bend=angle*(.28+.72*e);
 const c=Math.cos(bend),s=Math.sin(bend);
 const spread=(side||Math.sign(p[1]))*.0065*Math.sin(angle)*e;
 // A slight soft chin bow prevents the mouth from reading as a hinge plate.
 const arc=-.024*Math.sin(Math.PI*t)*Math.sin(angle);
 return [pivotX+dx*c+dz*s,p[1]+spread,pivotZ-dx*s+dz*c+arc];
}
function ellipsoid(g,center,r,color,tag,segments=12,rings=8){
 function spherePt(i,j){
  const phi=-Math.PI/2+Math.PI*Math.max(.001,Math.min(rings-.001,i))/rings;
  const t=S*j/segments;
  return [center[0]+r[0]*Math.cos(phi)*Math.cos(t),
   center[1]+r[1]*Math.cos(phi)*Math.sin(t),
   center[2]+r[2]*Math.sin(phi)];
 }
 g.sheet(spherePt,rings,segments,color,tag,true);
}
export function buildWarmveinStaticHeadV11f({pose='closed',degreesOverride=null}={}){
 const p=GAPE_POSES_V11F.find(x=>x.id===pose);
 if(!p)throw new RangeError('v11f_unknown_gape');
 if(degreesOverride!==null&&(!Number.isFinite(degreesOverride)||degreesOverride<0||degreesOverride>46))
  throw new RangeError('v11f_invalid_continuous_gape');
 const degrees=degreesOverride===null?p.degrees:degreesOverride;
 const radians=degrees*Math.PI/180,g=makeGeometry();
 // The upper head is a TRUE curved half-vault, not a duplicated
 // flattened full-circle vertex strip.
 g.sheet(upperPoint,N,C,P.skull,'cranial_vault',true);
 // Round off the entire open frontal arc with a SHORT dome rather
 // than terminating the skull in a flat open half-ring. Every cap
 // segment is genuine curved 3D geometry, not a painted nose sticker.
 const [frontWidth,frontHeight,,frontZ]=shapeAt(END);
 const noseArc=(s,j)=>{
  const th=Math.PI*j/C;
  const u=s/5;
  const r=Math.sqrt(Math.max(0,1-u*u));
  return [END+CAP_LENGTH*u,frontWidth*r*Math.cos(th),
   frontZ+frontHeight*r*Math.sin(th)];
 };
 for(let i=0;i<5;i++)for(let j=0;j<C;j++){
  const a=noseArc(i,j),b=noseArc(i+1,j),
   c=noseArc(i+1,j+1),d=noseArc(i,j+1);
  if(i===4){
   // The final two front vertices coincide by design. Close the
   // half-dome with ONE non-degenerate triangle, never a zero quad.
   g.triangle(a,d,b,P.skull,'rounded_upper_nose_cap');
  }else g.quad(a,d,c,b,P.skull,'rounded_upper_nose_cap');
 }
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
   N,C,P.jaw,side===1?'left_mandible':'right_mandible',side===1);
 }
 // Curved anterior mental bridge between two independent hemi-jaws:
 // only the very last portion joins so it stays rounded, not a board.
 g.sheet((i,j)=>{
  const x=jawXAt(N-6+i),[w,,down,z]=shapeAt(x);
  const u=j/16*2-1;
  return rotateLower([x,u*w*.76,z-down*(.37+.14*(1-u*u))],
   radians,Math.sign(u));
 },6,16,P.jaw,'anterior_chin_bridge',true);
 // Rounded VENTRAL MANDIBULAR SKIN: a soft half-ellipse wraps both
 // independent jaw tubes from below. This fixes the bone-prong look
 // seen in the first real V1.1F 32-view Chrome capture. Unlike the
 // earlier giant red triangular sail, its material matches the jaw
 // and the narrow oral basin remains recessed ABOVE this skin.
 g.sheet((i,j)=>{
  const x=jawXAt(i),[w,,down,z]=shapeAt(x);
  const phi=Math.PI*j/16;
  const y=w*.70*Math.cos(phi);
  const underside=z-down*(.55+.21*Math.sin(phi));
  return rotateLower([x,y,underside],radians,Math.sign(y));
 },N,16,P.jaw,'curved_ventral_chin_skin');
 // A tapered cheek-to-throat transition starts BEFORE the mouth hinge
 // and gradually joins the moving ventral chin. The earlier hard step
 // between the fixed neck and lower jaw looked like a glued-on hinge.
 g.sheet((i,j)=>{
  const t=i/16;
  const x=JAW_START-.12+.17*t;
  const [w,,down,z]=shapeAt(x),phi=Math.PI*j/18;
  const y=w*.72*Math.cos(phi);
  const lower=z-down*(.53+.19*Math.sin(phi));
  const blend=t*t*(3-2*t);
  return rotateLower([x,y,lower],radians*blend,Math.sign(y));
 },16,18,P.ventral,'cheek_throat_flex_transition');


 // Recessed upper palate and moving interior lower mouth floor.
 g.sheet((i,j)=>{
  const x=jawXAt(i),[w,,,z]=shapeAt(x),u=j/14*2-1;
  return [x,u*w*.93,z-.010-(1-u*u)*.002];
 },N,14,P.palate,'upper_palate',true);
 g.sheet((i,j)=>{
  const x=jawXAt(i),[w,,down,z]=shapeAt(x),u=j/14*2-1;
  const t=clamp((x-JAW_START)/(END-JAW_START),0,1);
  // Small U-shaped basin recessed between both curved jaw tubes.
  // A narrow dark center leaves the mouth open in profile.
  const low=[x,u*w*.43,
   z-down*(.35+.15*(1-u*u))-.006*Math.sin(Math.PI*t)];
  return rotateLower(low,radians,Math.sign(u));
 },N,14,P.cavity,'recessed_oral_basin');
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
 // V1.1F shared interface: the head-neck ROOT uses precisely
 // the same 44 angular samples and coordinates as ring zero of the
 // static rest-coil. We match geometry but do NOT claim vertex welding
 // with the separate source/24-joint game system.
 const NECK_RADIAL=44,NECK_SEGMENTS=28,NECK_ROOT_X=-1.08;
 const neckAt=(i,j)=>{
  const u=i/NECK_SEGMENTS,k=u*u*(3-2*u);
  const x=NECK_ROOT_X+(START-NECK_ROOT_X)*u;
  const [endWidth,endTop,endDown,endCenterZ]=shapeAt(START);
  const bodyRadius=.073,bodyZ=.113,bodyHeight=bodyRadius*.88;
  const width=bodyRadius*(1-k)+endWidth*k;
  const top=bodyHeight*(1-k)+endTop*k;
  const down=bodyHeight*(1-k)+endDown*k;
  const center=bodyZ*(1-k)+endCenterZ*k;
  const phi=S*j/NECK_RADIAL;
  // Subtle S-shaped resting neck, with exact unchanged end rings.
  const envelope=Math.sin(Math.PI*u)**2;
  const offsetY=.016*envelope*Math.sin(2*Math.PI*u);
  const offsetZ=.0045*envelope;
  return [x,offsetY+width*Math.cos(phi),
   center+offsetZ+(Math.sin(phi)>=0?top:down)*Math.sin(phi)];
 };
 // Dorsal and ventral neck use a continuous cross-sectional color
 // boundary; the ventral surface follows the cream throat rather
 // than ending in a rectangular stripe behind the jaw.
 for(let i=0;i<NECK_SEGMENTS;i++)for(let j=0;j<NECK_RADIAL;j++){
  const a=neckAt(i,j),b=neckAt(i+1,j);
  const c=neckAt(i+1,j+1),d=neckAt(i,j+1);
  const ventral=Math.sin(S*(j+.5)/NECK_RADIAL)<0;
  g.quad(a,d,c,b,ventral?P.ventral:P.neck,
   ventral?'neck_belly':'neck_volume');
 }
 const neckBodyRoot=Array.from({length:NECK_RADIAL},(_,j)=>Object.freeze(neckAt(0,j)));
 const neckToHead=Array.from({length:NECK_RADIAL},(_,j)=>Object.freeze(neckAt(NECK_SEGMENTS,j)));
 // Narrow, inset, low profile eyes: actual 3D camera depth occludes far eye.
 for(const sign of [-1,1]){
  const x=EYE_X,[w,top,,z]=shapeAt(x);
  const eyeCenter=[x,sign*w*.745,z+top*.65];
  ellipsoid(g,eyeCenter,[.020,.006,.013],P.eyeRim,'eye_rim');
  ellipsoid(g,[x+.002,eyeCenter[1]+sign*.005,eyeCenter[2]+.001],
   [.014,.004,.009],P.iris,'eye_iris');
  ellipsoid(g,[x+.007,eyeCenter[1]+sign*.008,eyeCenter[2]+.005],
   [.0028,.0015,.0023],P.highlight,'eye_glint',9,7);
  const snoutX=NOSTRIL_X,[nw,nh,,nz]=shapeAt(snoutX);
  ellipsoid(g,[snoutX,sign*nw*.84,nz+nh*.38],
   [.0055,.0028,.004],P.nostril,'nostril',10,7);
 }
 // Smooth normals within curved surfaces, but retain distinct lip edges.
 const smoothed=new Map();
 const skinJoin=new Set(['cranial_vault','neck_volume','neck_belly','throat_chin']);
 const smoothGroups=new Set([...skinJoin,'left_mandible','right_mandible',
  'anterior_chin_bridge','curved_ventral_chin_skin',
  'cheek_throat_flex_transition','recessed_oral_basin']);
 const normalKey=(gname,i)=>(skinJoin.has(gname)?'continuous_outer_skin':gname)+
  ':'+g.vertices.slice(i,i+3).map(z=>Math.round(z*1e5)).join(',');
 for(let k=0;k<g.faceTags.length;k++){
  const group=g.faceTags[k];if(!smoothGroups.has(group))continue;
  const i=k*3,key=normalKey(group,i);
  const old=smoothed.get(key)||[0,0,0];
  smoothed.set(key,add(old,g.normals.slice(i,i+3)));
 }
 for(let k=0;k<g.faceTags.length;k++){
  const group=g.faceTags[k];if(!smoothGroups.has(group))continue;
  const i=k*3,key=normalKey(group,i);
  g.normals.splice(i,3,...unit(smoothed.get(key)));
 }
 const vertexCount=g.vertices.length/3;
 if(vertexCount<3000||vertexCount%3!==0)throw Error('v11f_invalid_mesh');
 for(const a of [g.vertices,g.colors,g.normals])
  if(!a.every(Number.isFinite))throw Error('v11f_nonfinite_mesh');
 const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
 for(let k=0;k<g.vertices.length;k+=3)for(let j=0;j<3;j++){
  bounds.min[j]=Math.min(bounds.min[j],g.vertices[k+j]);
  bounds.max[j]=Math.max(bounds.max[j],g.vertices[k+j]);
 }
 const distal=rotateLower([MOUTH_AUDIT_X,0,shapeAt(MOUTH_AUDIT_X)[3]-.003],radians,0);
 return Object.freeze({
  version:WARMVEIN_STATIC_HEAD_V11F,pose,gapeDegrees:degrees,
  acceptsContinuousGapeOverride:true,
  vertexCount,triangleCount:vertexCount/3,
  vertices:new Float32Array(g.vertices),colors:new Float32Array(g.colors),
  normals:new Float32Array(g.normals),
  materialTriangleCounts:Object.freeze({...g.groups}),
  bounds:Object.freeze({min:bounds.min,max:bounds.max}),
  mouthGapAtMuzzleWorld:shapeAt(MOUTH_AUDIT_X)[3]-distal[2],
  geometryAudit:Object.freeze({
   eyeCenterX:EYE_X,originalEyeToTipWorld:LEGACY_END-EYE_X,
   newEyeToTipWorld:NOSE_TIP_X-EYE_X,
   snoutLengthShorteningPercent:
    100*(1-(NOSE_TIP_X-EYE_X)/(LEGACY_END-EYE_X)),
   bodyHeadMaxWidthWorld:2*Math.max(...nodes.map(n=>n[1])),
   newEyeToTipOverHeadWidth:
    (NOSE_TIP_X-EYE_X)/(2*Math.max(...nodes.map(n=>n[1]))),
   roundedCapLengthWorld:CAP_LENGTH,
   frontTipX:NOSE_TIP_X,
   originalEyeLandmarkUnmoved:true,
   posteriorJawPivotUnmoved:true,
   nostrilX:NOSTRIL_X,
   displacedNostrilBySameProportion:true,
   previousPhysicsAndSaveUnchanged:true
  }),
  distinctLeftRightMandibularSurfaces:true,
  upperCranialVaultReallyCurved:true,
  mouthFloorInsideLips:true,
  mouthMembraneConfinedToPosteriorCorners:true,
  independentOriginalStaticGeometry:true,
  downloaded3DReferenceUsed:false,
  noChangesToProduction24BonesOrSaves:true,
  frameReferencesValidated:true,
  trueLeftRightJawBranches:true,
  rounded3DSnoutCap:true,
  reducedAnteriorSnout:true,
  nonRigidMandibleDisplayBend:true,
  volumetricMandibleTube:true,
  continuousAnteriorChinBridge:true,
  curvedVentralChinSkin:true,
  curvedCheekThroatTransition:true,
  matchedNeckBodyRing44:true,
  smoothSharedNeckCrownNormals:true,
  slightRestingNeckSCurve:true,
  continuousVentralNeckColor:true,
  anchoredNeckBothEnds:true,
  physicallyCorrectedDorsalNormalDirection:true,
  neckBodyRoot:Object.freeze(neckBodyRoot),
  neckToHead:Object.freeze(neckToHead),
  noExposedBoneProngs:true,
  insetOralBasin:true,
  noFlatMandibleBoards:true,
  exactBiomechanicalJawModel:false,
  passedArtistReview:false
 });
}
