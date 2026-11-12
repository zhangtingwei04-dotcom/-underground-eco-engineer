/**
 * Project OHM — snake growth-to-motion geometry bridge V0.1.
 * Uses an explicitly supplied PRESENT body length; age does not determine
 * length here. The growth simulator will eventually produce this measurement.
 *
 * Reuses the existing 24-control-point pose and species rig (no new skeleton
 * topology). Length and collision clearance follow the body dimension;
 * wavelength and temporal movement rates remain unchanged as art placeholders.
 *
 * ENGINE-INDEPENDENT PROTOTYPE. No actual physics, measured ontogeny,
 * nutrition model, husbandry advice, save migration or per-frame growth.
 */
import {SNAKE_RIG_PROFILES,makeSnakeRig3D,deformSnakeRig3D}
  from './snake-rig-3d.mjs';
import {makeUniversalSnakePose,OHM_SNAKE_POSE_MODES}
  from './snake-skeleton-motion.mjs';
import {conformSnakePoseToTerrain,SNAKE_TERRAIN_PRESET}
  from './snake-terrain-contact.mjs';
import {conformSnakeBodyWithLocalSupport}
  from './snake-local-support-v06b.mjs';
import {makeSnakeHeadAttachment,poseSnakeHeadAttachment}
  from './snake-head-attachment.mjs';
import {sampleSnakeTravelPoseV07}
  from './snake-path-history-v07.mjs';

export const SNAKE_GROWTH_MOTION_VERSION='0.1';
export const SNAKE_GROWTH_STAGES=Object.freeze([
 'hatchling','juvenile','subadult','adult','senior'
]);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const finite=x=>typeof x==='number'&&Number.isFinite(x);

/**
 * Build/restamp ONLY when an animal's body dimensions change. The rig geometry
 * and UV are expensive to rebuild and should be reused across animation frames.
 *
 * bodyLength is in current OHM art units (not centimeters or verified species
 * body lengths). bodyRadius is a conservative constant broad-phase clearance
 * envelope; the final taper and detailed shape still need mesh collision.
 */
export function createSnakeGrowthMotionBridge({
 speciesId='generic_snake',bodyLength=1.4,
 growthStage='juvenile',boneCount=24,ringCount=97,
 radialSegments=16,headFactors={length:1,width:1,height:1}
}={}){
 if(typeof speciesId!=='string'||!own(SNAKE_RIG_PROFILES,speciesId))
   throw new RangeError('unsupported_species');
 if(!SNAKE_GROWTH_STAGES.includes(growthStage))
   throw new RangeError('invalid_growth_stage');
 if(!finite(bodyLength)||bodyLength<.3||bodyLength>5||
    !Number.isInteger(boneCount)||boneCount<8||boneCount>64||
    !Number.isInteger(ringCount)||ringCount<boneCount*2||ringCount>512||
    !Number.isInteger(radialSegments)||radialSegments<8||radialSegments>32)
   throw new RangeError('invalid_growth_dimensions');
 const profile=SNAKE_RIG_PROFILES[speciesId];
 const headAttachment=makeSnakeHeadAttachment({speciesId,length:bodyLength,factors:headFactors});
 const rig=makeSnakeRig3D({
   speciesId,length:bodyLength,boneCount,ringCount,radialSegments
 });
 // Width envelope is an engineering margin over the profile's maximum
 // approximate section; do not interpret as a species' actual girth.
 const envelope=bodyLength*profile.radiusScale*1.09;
 const motionParameters=Object.freeze({
   length:bodyLength,bodyRadius:envelope,boneCount,
   waveAmplitude:.29,cycles:1.65,waveSpeed:.43
 });
 return Object.freeze({
   version:SNAKE_GROWTH_MOTION_VERSION,speciesId,growthStage,
   bodyLength,boneCount,bodyRadius:envelope,
   motionParameters,rig,headAttachment,headShapeFactors:headAttachment.shape,profileId:speciesId,
   updatePolicy:'rebuild_on_dimension_change_not_each_frame',
   stagePolicy:'stage_is_metadata_not_an_age_to_length_formula',
   collisionPolicy:'broad_phase_radius_only_mesh_collision_not_implemented',
   status:'geometry_bridge_prototype_not_growth_or_real_physics'
 });
}

/** A frame deforms the *existing* mesh; body length and fixed segment
 * lengths remain invariant over time (until a new growth-size update).
 */
export function sampleSnakeGrowthMotionFrame(bridge,{
 mode='ground',time=0,terrain=null,headLook={},
 bodySupport='legacy',previousLift=null,follow=1,
 motionSource='legacy',pathState=null
}={}){
 if(!bridge||bridge.version!==SNAKE_GROWTH_MOTION_VERSION||
    !bridge.rig||bridge.rig.speciesId!==bridge.speciesId ||
    !OHM_SNAKE_POSE_MODES.includes(mode)||
    !['legacy','local-v06b'].includes(bodySupport)||
    !['legacy','path-history-v07'].includes(motionSource)||
    (motionSource==='path-history-v07'&&(mode!=='ground'||pathState===null))||
    (motionSource==='legacy'&&pathState!==null))
   throw new RangeError('invalid_growth_bridge_or_mode');
 // V0.7A is an explicit opt-in. The old in-place S wave and local support
 // remain fully unchanged for all callers who do not request route travel.
 const pose=motionSource==='path-history-v07'
   ?sampleSnakeTravelPoseV07(pathState,bridge.motionParameters)
   :makeUniversalSnakePose({...bridge.motionParameters,mode,time});
 const contacted=bodySupport==='local-v06b'
   ?conformSnakeBodyWithLocalSupport(pose,{
      terrain:terrain??SNAKE_TERRAIN_PRESET,previousLift,follow
    })
   :terrain===null?pose:conformSnakePoseToTerrain(pose,{terrain});
 const mesh=deformSnakeRig3D(bridge.rig,contacted.points);
 const head=poseSnakeHeadAttachment(bridge.headAttachment,contacted.points,headLook);
 return Object.freeze({
   bridgeVersion:SNAKE_GROWTH_MOTION_VERSION,
   speciesId:bridge.speciesId,growthStage:bridge.growthStage,
   size:bridge.bodyLength,mode,time,
   pose:contacted,mesh,head,
   poseSource:motionSource==='path-history-v07'
       ?(bodySupport==='local-v06b'
         ?'authored_head_trail_with_local_support_v07'
         :terrain===null?'authored_head_trail_v07'
           :'authored_head_trail_heightfield_v07')
       :bodySupport==='local-v06b'?'terrain_driven_local_support_v06b':
        terrain===null?'kinematic':'heightfield_approximation',
   ...(motionSource==='path-history-v07'?{
     travelDistance:pathState.distance,motionSource:'path-history-v07'
   }:{}),
   visualStatus:'engineering_preview_head_attached_no_neck_ik_or_complete_collision'
 });
}
