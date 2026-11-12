/**
 * Project OHM SNAKE V0.7G — front-glass terrarium wireframe projection.
 *
 * Use EXACTLY one V0.7C ground coordinate transform. Fixed front-facing
 * glass view: world X -> horizontal; world Y -> compressed depth at substrate,
 * physical-looking Z -> up. No top-down camera, arbitrary skin, animated
 * texture, copied game sprite or implicit ecological state.
 *
 * This is read-only 2.5D art/debug projection, NOT a photogrammetric camera,
 * 3D cage or physical lens. Visual decorations remain non-simulation data.
 */
import {
 snakeFloorToTerrariumV07c
} from './snake-terrarium-corridor-v07c.mjs';
export const SNAKE_FRONT_GLASS_PROJECTION_VERSION='0.7G';
const F=Object.freeze;
const fine=n=>typeof n==='number'&&Number.isFinite(n);
const within=(n,a,b)=>fine(n)&&n>=a&&n<=b;
const invalid=n=>{throw new RangeError(n)};
export const FRONT_GLASS_CAMERA_V07G=F({
 version:SNAKE_FRONT_GLASS_PROJECTION_VERSION,
 width:1440,height:810,
 left:68,right:1372,
 rearFloorY:500,frontFloorY:672,
 artHeightScale:163,
 view:'front_glass_horizontal_2_5d',
 status:'fixed_terrarium_front_observer_not_top_down'
});
const round=n=>Math.round(n*1000)/1000;
const P=(x,y)=>F({x:round(x),y:round(y)});
export function projectSnakeFrontGlassPointV07g(point,cam=FRONT_GLASS_CAMERA_V07G){
 if(!point||!within(point.x,-4,4)||!within(point.y,-1.6,1.6)||
   !within(point.z,-.25,3)||
   cam?.version!==SNAKE_FRONT_GLASS_PROJECTION_VERSION||
   !within(cam.left,0,cam.width)||!within(cam.right,0,cam.width)||
   cam.right<=cam.left||
   !within(cam.rearFloorY,0,cam.height)||
   !within(cam.frontFloorY,0,cam.height)||
   cam.frontFloorY<=cam.rearFloorY||
   !within(cam.artHeightScale,10,1000))
  invalid('invalid_front_glass_point');
 const world=snakeFloorToTerrariumV07c({x:point.x,y:point.y});
 return P(cam.left+(cam.right-cam.left)*world.x/1000,
  cam.rearFloorY+(cam.frontFloorY-cam.rearFloorY)*world.y/400-
   point.z*cam.artHeightScale);
}
const projections=(positions,cam)=>F(positions.map(p=>
 projectSnakeFrontGlassPointV07g(p,cam)));
function depthOf(p){return p.y;}
export function projectTransparentSnakeV07g({
 pose,head,scene,cam=FRONT_GLASS_CAMERA_V07G
}={}){
 if(!pose||!Array.isArray(pose.points)||
    pose.points.length<10||pose.points.length>64||
    !within(pose.bodyRadius,.001,.5)||
    !within(pose.segmentLength,.001,1)||
    !head||!Array.isArray(head.meshPositions)||
    head.meshPositions.length<16||head.meshPositions.length>1400||
    !scene||typeof scene.sceneId!=='string'||
    !Number.isSafeInteger(scene.revision))
  invalid('invalid_front_glass_frame');
 const spine=projections(pose.points,cam);
 const mesh=projections(head.meshPositions,cam);
 const unit=(cam.right-cam.left)/8;
 const radii=F(spine.map((_,i)=>{
  // Debug only, preserve taper towards the tail; NEVER treat as a
  // species-accurate anatomical measure or real skinned mesh radius.
  const u=i/(spine.length-1);
  const taper=u>.65?Math.max(.16,(1-u)/.35):1;
  return round(pose.bodyRadius*unit*taper);
 }));
 const connectors=F(spine.slice(1).map((p,i)=>F({
  from:spine[i],to:p,segment:i,
  nominalLength:pose.segmentLength,
  status:'screen_projection_only_not_bone_length_measurement'
 })));
 const width=head.meshPositions.length;
 // Canonical head attachment V0.1 uses 8-9 rings x 16 samples by default.
 // Use wireframe latitude/longitude edges from its own unchanged topology.
 const radial=16,headRibs=[];
 if(width%radial===0){
  const rings=width/radial;
  for(let i=0;i<rings;i++){
   for(let j=0;j<radial;j+=2){
    headRibs.push(F({from:mesh[i*radial+j],
     to:mesh[i*radial+(j+2)%radial]}));
    if(i<rings-1)headRibs.push(F({
     from:mesh[i*radial+j],to:mesh[(i+1)*radial+j]
    }));
   }
  }
 }
 return F({
  version:SNAKE_FRONT_GLASS_PROJECTION_VERSION,
  camera:'fixed_front_glass_not_top_down',
  sourceSceneId:scene.sceneId,sourceSceneRevision:scene.revision,
  spine,connectors,radii,
  headMesh:mesh,headRibs:F(headRibs),
  nominalSegmentLength:pose.segmentLength,
  status:'transparent_wireframe_technical_view_no_species_skin_or_real_physics',
  skinApplied:false
 });
}
export function createFrontGlassQADiagnosticsV07g({
 frame,previous=null,maximumScreenJump=30
}={}){
 if(frame?.version!==SNAKE_FRONT_GLASS_PROJECTION_VERSION||
    !Array.isArray(frame.spine)||!within(maximumScreenJump,1,200))
  invalid('invalid_front_glass_qa_frame');
 if(previous!==null&&(
  previous.version!==SNAKE_FRONT_GLASS_PROJECTION_VERSION||
  previous.spine.length!==frame.spine.length))
  invalid('incompatible_visual_qa_previous');
 const scale=FRONT_GLASS_CAMERA_V07G;
 let maxJump=0;
 if(previous)for(let i=0;i<frame.spine.length;i++){
  const a=frame.spine[i],b=previous.spine[i];
  maxJump=Math.max(maxJump,Math.hypot(a.x-b.x,a.y-b.y));
 }
 const boundsValid=frame.spine.every(p=>
  p.x>=scale.left-2&&p.x<=scale.right+2&&
  p.y>=scale.rearFloorY-3*scale.artHeightScale-3&&
  p.y<=scale.frontFloorY+scale.artHeightScale*.25);
 const noSkin=frame.skinApplied===false;
 return F({version:SNAKE_FRONT_GLASS_PROJECTION_VERSION,
  ok:boundsValid&&noSkin&&maxJump<=maximumScreenJump+1e-9,
  maxJointScreenDeltaPx:round(maxJump),
  maxPermittedDeltaPx:maximumScreenJump,
  withinGlassBounds:boundsValid,
  stillTransparent:noSkin,
  checks:'projection_bounds_and_per_frame_joint_displacement_not_visual_naturalness'
 });
}
