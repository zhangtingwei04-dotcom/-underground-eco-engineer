/**
 * OHM snake terrain contact V0.6A — portable kinematic heightfield adapter.
 * Works with makeUniversalSnakePose()'s head-to-tail control points.
 * ART-UNIT PROTOTYPE, NOT AN ANATOMICAL / FORCES / RIGID-BODY SIMULATOR.
 *
 * Instead of lifting nodes independently and stretching the snake, we
 * reconstruct the chain from tail to head, solving every new step length by
 * bisection on the horizontal distance along the original heading.
 *
 * The rounded rock and log perch are SMOOTH HEIGHTFIELDS only. There are no
 * vertical walls, undercuts, static friction, muscle forces, terrain-side
 * repulsion, body self-collision, or exact skin-vs-rock collision yet.
 */
export const SNAKE_TERRAIN_CONTACT_VERSION='0.6A';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const smooth=t=>{const u=clamp(t,0,1);return u*u*(3-2*u)};
const finite=Number.isFinite;
const asNumber=(x,name)=>{if(typeof x!=='number'||!finite(x))throw new RangeError('invalid_'+name);return x};
export const SNAKE_TERRAIN_PRESET=Object.freeze({
  groundZ:0,
  rock:Object.freeze({x:-.70,y:-.03,radius:.35,height:.07}),
  perch:Object.freeze({x:-1.12,y:-.04,halfX:.17,halfY:.32,height:.055})
});

function validateTerrain(t){
  if(!t||typeof t!=='object')throw new RangeError('invalid_terrain');
  asNumber(t.groundZ,'ground');
  if(t.rock!=null){
    for(const k of ['x','y','radius','height'])asNumber(t.rock[k],'rock');
    if(t.rock.radius<=0||t.rock.radius>5||t.rock.height<0||t.rock.height>1)throw new RangeError('invalid_rock');
  }
  if(t.perch!=null){
    for(const k of ['x','y','halfX','halfY','height'])asNumber(t.perch[k],'perch');
    if(t.perch.halfX<=0||t.perch.halfY<=0||t.perch.halfX>5||t.perch.halfY>5||t.perch.height<0||t.perch.height>1)
      throw new RangeError('invalid_perch');
  }
}
/** Returns terrain height and the winning heightfield feature at XY. */
function surfaceRaw(x,y,terrain){
  const z0=terrain.groundZ; let height=z0,source='ground';
  if(terrain.rock){
    const r=terrain.rock,rr=Math.hypot(x-r.x,y-r.y)/r.radius;
    const value=z0+r.height*(1-smooth(rr));
    if(value>height+1e-12){height=value;source='rock_rounded_heightfield';}
  }
  if(terrain.perch){
    const p=terrain.perch;
    // Smoothed pedestal surrogate for a log; NOT collision with a cylinder.
    const dx=Math.abs(x-p.x)/p.halfX,dy=Math.abs(y-p.y)/p.halfY;
    const factor=(1-smooth(dx))*(1-smooth(dy));
    const value=z0+p.height*factor;
    if(value>height+1e-12){height=value;source='perch_heightfield';}
  }
  return {z:height,source};
}
export function sampleSnakeTerrain(x,y,terrain=SNAKE_TERRAIN_PRESET){
  asNumber(x,'x');asNumber(y,'y');validateTerrain(terrain);
  return Object.freeze(surfaceRaw(x,y,terrain));
}
const zAt=(x,y,lift,r,margin,terrain)=>surfaceRaw(x,y,terrain).z+r+margin+lift;

/**
 * Keep each new centerline segment fixed length. Preserves the *direction*
 * of the previous XY path, but NOT exact XY coordinates (necessary when
 * climbing). Assumes smooth, reachable heightfield contact surfaces.
 *
 * For a too-steep / discontinuous / non-reachable target: throw rather than
 * silently stretching a bone or claiming terrain clearance.
 */
export function conformSnakePoseToTerrain(pose,{
  terrain=SNAKE_TERRAIN_PRESET,margin=.0035,iterations=30
}={}){
  validateTerrain(terrain);
  if(!pose||!Array.isArray(pose.points)||pose.points.length<3||
     typeof pose.segmentLength!=='number'||!finite(pose.segmentLength)||pose.segmentLength<=0||
     typeof pose.bodyRadius!=='number'||!finite(pose.bodyRadius)||pose.bodyRadius<=0||
     !Number.isInteger(iterations)||iterations<12||iterations>70||
     typeof margin!=='number'||!finite(margin)||margin<0||margin>.1)
    throw new RangeError('invalid_contact_pose');
  const n=pose.points.length,ds=pose.segmentLength,r=pose.bodyRadius;
  const points=new Array(n),contact=new Array(n),lift=new Array(n);
  for(let i=0;i<n;i++){
    const p=pose.points[i];
    if(!p||![p.x,p.y,p.z].every(finite))throw new RangeError('invalid_contact_pose');
    lift[i]=Math.max(0,p.z-r);
  }
  const extra=new Array(n).fill(0);
  // Build a fixed-length chain with local clearance allowance.
  // Up to 22 passes account for a segment passing over the middle of
  // a hump even when both control points touch its surface.
  for(let pass=0;pass<22;pass++){
    const last=pose.points[n-1], lastSurface=surfaceRaw(last.x,last.y,terrain);
    points[n-1]={x:last.x,y:last.y,z:lastSurface.z+r+margin+lift[n-1]+extra[n-1]};
    contact[n-1]=lastSurface.source;
    for(let i=n-2;i>=0;i--){
      const prev=points[i+1],target=pose.points[i],behind=pose.points[i+1];
      let dx=target.x-behind.x,dy=target.y-behind.y;
      const dxy=Math.hypot(dx,dy);
      if(dxy<1e-9)throw new RangeError('degenerate_pose_path');
      dx/=dxy;dy/=dxy;
      const f=h=>{
        const x=prev.x+h*dx,y=prev.y+h*dy;
        const z=zAt(x,y,lift[i]+extra[i],r,margin,terrain);
        return h*h+(z-prev.z)**2-ds*ds;
      };
      let lo=0,hi=ds;
      if(f(0)>1e-9)throw new RangeError('terrain_too_steep_for_chain');
      for(let k=0;k<iterations;k++){
        const mid=(lo+hi)*.5;
        if(f(mid)<0)lo=mid;else hi=mid;
      }
      const h=(lo+hi)*.5,x=prev.x+h*dx,y=prev.y+h*dy;
      const surface=surfaceRaw(x,y,terrain);
      points[i]={x,y,z:surface.z+r+margin+lift[i]+extra[i]};
      contact[i]=surface.source;
    }
    const bumps=new Array(n).fill(0);
    let any=false;
    for(let i=0;i<n-1;i++){
      const a=points[i],b=points[i+1];
      let min=Infinity;
      for(let k=1;k<24;k++){
        const t=k/24,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;
        const z=a.z+(b.z-a.z)*t;
        min=Math.min(min,z-r-surfaceRaw(x,y,terrain).z);
      }
      if(min < -.00001){
        any=true;
        const correction=-min+.00035;
        bumps[i]=Math.max(bumps[i],correction);
        bumps[i+1]=Math.max(bumps[i+1],correction);
      }
    }
    if(!any)break;
    if(pass===21)throw new RangeError('terrain_clearance_unresolved');
    for(let i=0;i<n;i++)extra[i]+=bumps[i];
  }
  const sampled=[];
  for(let i=0;i<n;i++){
    const p=points[i];
    sampled.push(Object.freeze({x:p.x,y:p.y,z:p.z}));
  }
  // Authored lift vs terrain-heightfield contact only.
  // A node on a heightfield is NOT proof of ground reaction / friction.
  const contacts=[];
  for(let i=0;i<n;i++){
    if(lift[i]<1e-5 && extra[i]<margin*2)contacts.push(Object.freeze({index:i,surface:contact[i]}));
  }
  return Object.freeze({
    version:SNAKE_TERRAIN_CONTACT_VERSION,mode:pose.mode,bodyRadius:r,
    segmentLength:ds,points:Object.freeze(sampled),
    contacts:Object.freeze(contacts),terrain,
    status:'terrain_heightfield_kinematic_not_physics'
  });
}

/**
 * Samples each centerline bone at several points. Uses constant bodyRadius
 * as a conservative clearance proxy, NOT the final tapered body mesh.
 */
export function inspectSnakeTerrainClearance(pose,{
  terrain=pose?.terrain??SNAKE_TERRAIN_PRESET,samplesPerBone=8
}={}){
  validateTerrain(terrain);
  if(!pose||!Array.isArray(pose.points)||pose.points.length<3||
    !finite(pose.segmentLength)||!finite(pose.bodyRadius)||
    !Number.isInteger(samplesPerBone)||samplesPerBone<2||samplesPerBone>48)
    throw new RangeError('invalid_clearance_pose');
  let minimum=Infinity,maxBoneError=0;
  for(let i=1;i<pose.points.length;i++){
    const a=pose.points[i-1],b=pose.points[i];
    if(!a||!b||![a.x,a.y,a.z,b.x,b.y,b.z].every(finite))throw new RangeError('invalid_clearance_pose');
    const distance=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);
    maxBoneError=Math.max(maxBoneError,Math.abs(distance-pose.segmentLength));
    for(let k=0;k<=samplesPerBone;k++){
      const t=k/samplesPerBone,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t,z=a.z+(b.z-a.z)*t;
      minimum=Math.min(minimum,z-pose.bodyRadius-surfaceRaw(x,y,terrain).z);
    }
  }
  return Object.freeze({
    ok:minimum>=-1e-5 && maxBoneError<=1e-7,
    minimumClearance:minimum,maxBoneError,
    segmentSamples:samplesPerBone,
    groundHeightfieldChecked:true,
    exactMeshCollisionChecked:false,selfCollisionChecked:false,
    biomechanicalValidation:false
  });
}
