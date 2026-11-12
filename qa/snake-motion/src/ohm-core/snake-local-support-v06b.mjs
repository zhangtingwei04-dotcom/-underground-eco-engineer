/**
 * Project OHM — Terrain-driven local body support V0.6B (engineering slice).
 *
 * Fixes the previous "supported" pose's fixed-index symmetric arch.
 * A moving snake can rest on a rounded rock/log heightfield, and nearby
 * unanchored segments blend into gravity-biased drapes.
 *
 * This is a constrained kinematic visual approximation, NOT muscle forces,
 * friction, actual log-cylinder collision, or validated snake biomechanics.
 * Head-to-tail node 0..N-1 follows the existing body pose; real navigation
 * and traveling head-path history are separate V0.7 research problems.
 */
import {
  sampleSnakeTerrain,conformSnakePoseToTerrain,SNAKE_TERRAIN_PRESET
} from './snake-terrain-contact.mjs';

export const SNAKE_LOCAL_SUPPORT_VERSION='0.6B';
const finite=x=>typeof x==='number'&&Number.isFinite(x);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const p3=p=>Object.freeze({x:p.x,y:p.y,z:p.z});
const error=s=>{throw new RangeError(s)};
function validate(base,options){
  if(!base||typeof base!=='object'||!Array.isArray(base.points)||
    base.points.length<8||base.points.length>64||
    !finite(base.segmentLength)||base.segmentLength<=0||
    !finite(base.bodyRadius)||base.bodyRadius<=0||
    !finite(base.length)||base.length<=0||
    base.points.some(p=>!p||![p.x,p.y,p.z].every(finite)))
    error('invalid_local_support_pose');
  if(!Number.isInteger(options.iterations)||options.iterations<1||options.iterations>180||
    !finite(options.gravity)||options.gravity<0||options.gravity>.02||
    !finite(options.relaxation)||options.relaxation<=0||options.relaxation>1||
    !finite(options.follow)||options.follow<0||options.follow>1||
    !finite(options.margin)||options.margin<0||options.margin>.05)
    error('invalid_local_support_parameters');
  if(options.previousLift!==null && (!Array.isArray(options.previousLift)||
    options.previousLift.length!==base.points.length||
    options.previousLift.some(x=>!finite(x)||x<0||x>base.length*.3)))
    error('invalid_previous_local_support');
}

/**
 * Bend a soft height envelope along existing path indices. Hard contact
 * surface is a lower bound, so it never dips into a rock. Free intervals
 * approach a gravity-biased mean of their neighbors rather than lifting
 * a hard-coded u-range. This is a visual relaxation, not a force solver.
 */
function relaxEnvelope(surface,gravity,iterations,relaxation){
  let state=surface.slice();
  const n=state.length;
  for(let pass=0;pass<iterations;pass++){
    const next=state.slice();
    for(let i=1;i<n-1;i++){
      const avg=(state[i-1]+state[i+1])*.5-gravity;
      next[i]=Math.max(surface[i],state[i]+relaxation*(avg-state[i]));
    }
    state=next;
  }
  return state;
}
function zonesFromContacts(contacts){
  const zones=[];
  for(const c of contacts){
    if(c.surface==='ground')continue;
    const last=zones.at(-1);
    if(last&&last.surface===c.surface&&last.endIndex===c.index-1){
      last.endIndex=c.index;last.nodeCount++;
    }else zones.push({surface:c.surface,startIndex:c.index,endIndex:c.index,nodeCount:1});
  }
  return Object.freeze(zones.map(z=>Object.freeze(z)));
}

/**
 * Always returns a fresh immutable pose; does not mutate original snake
 * frame or shared player/environment state.
 *
 * Input:
 *   basePose = makeUniversalSnakePose({mode:'ground', ...}).
 *   previousLift = preceding frame's lift data, optional.
 *
 * For legacy mode:'supported' we deliberately discard its pre-authored
 * fixed mid-body arch, relying on actual terrain height instead.
 */
export function conformSnakeBodyWithLocalSupport(basePose,{
  terrain=SNAKE_TERRAIN_PRESET,iterations=72,
  gravity=.00018,relaxation=.62,
  follow=1,previousLift=null,margin=.0035
}={}){
  const opts={iterations,gravity,relaxation,follow,previousLift,margin};
  validate(basePose,opts);
  const n=basePose.points.length;
  const surfaces=basePose.points.map(p=>sampleSnakeTerrain(p.x,p.y,terrain));
  const floor=surfaces.map(s=>s.z);
  const envelope=relaxEnvelope(floor,gravity*basePose.length,iterations,relaxation);
  const rawLift=envelope.map((z,i)=>Math.max(0,z-floor[i]));
  const lift=rawLift.map((value,i)=>{
    const blended=previousLift===null?value:
      previousLift[i]*(1-follow)+value*follow;
    return clamp(blended,0,basePose.length*.25);
  });
  // Preserve intentional exploration head-lift; ignore the old supported
  // arch which was anchored at fixed bone indices, not terrain contact.
  const desiredPoints=basePose.points.map((p,i)=>p3({
    x:p.x,y:p.y,
    z:basePose.bodyRadius+lift[i]+
      (basePose.mode==='explore'?Math.max(0,p.z-basePose.bodyRadius):0)
  }));
  const desiredPose={...basePose,points:desiredPoints};
  // Reconstruct from tail to head with exactly fixed segment lengths.
  // Recheck the heightfield between adjacent nodes for hidden penetration.
  const conformed=conformSnakePoseToTerrain(desiredPose,{terrain,margin});
  const supportContacts=zonesFromContacts(conformed.contacts);
  const supportedIndices=Object.freeze(conformed.contacts
    .filter(c=>c.surface!=='ground').map(c=>c.index));
  const suspendedIndices=Object.freeze(conformed.points.flatMap((p,i)=>{
    const local=sampleSnakeTerrain(p.x,p.y,terrain).z;
    return p.z>local+basePose.bodyRadius+margin+basePose.length*.001?[i]:[];
  }));
  return Object.freeze({
    version:SNAKE_LOCAL_SUPPORT_VERSION,
    mode:basePose.mode,
    time:basePose.time,
    length:basePose.length,
    boneCount:n,
    segmentLength:basePose.segmentLength,
    bodyRadius:basePose.bodyRadius,
    points:Object.freeze(conformed.points),
    contacts:Object.freeze(conformed.contacts),
    terrain:conformed.terrain,
    lift:Object.freeze(lift),
    supportedIndices,
    suspendedIndices,
    contactZones:supportContacts,
    source:'heightfield_contacts_not_fixed_body_indices',
    status:'gravity_biased_kinematic_support_no_physical_force_or_full_3d_collision'
  });
}
