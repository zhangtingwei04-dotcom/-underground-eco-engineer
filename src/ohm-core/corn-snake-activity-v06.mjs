/**
 * Corn snake v0.6 — reproducible, individual-seeded NON-PERIODIC visual choreography.
 * These ranges are ART DIRECTION ONLY, not measured activity rates or welfare advice.
 * Stateless sampler: no DOM, renderer, Phaser, timers, or saved-game state.
 * Older v0.5 API remains unchanged.
 */
export const CORN_ACTIVITY_V06_VERSION=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ease=x=>{const t=clamp(x,0,1);return t*t*(3-2*t);};
function randomFor(seed,index,salt=0){
 let x=(seed^Math.imul(index+1,0x9e3779b1)^salt)>>>0;
 x=Math.imul(x^(x>>>16),0x7feb352d);x=Math.imul(x^(x>>>15),0x846ca68b);
 return ((x^(x>>>16))>>>0)/4294967296;
}
function validateSeed(seed){if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('invalid_individual_seed');}
function duration(seed,index){
 const r=randomFor(seed,index,19);
 return index%2===0?5+9*r:3+7*r;
}
function segment(seed,index){
 const moving=index%2===0;
 const startState=moving?'slither':'rest';
 const r=randomFor(seed,index,97);
 const state=moving?'slither':r<.42?'rest':r<.70?'orient':r<.90?'explore':'rest';
 return {state,moving,duration:duration(seed,index),index};
}
/**
 * The sampler has no 52s reset: a deterministic variable-duration sequence.
 * Work bounded to 2000 segments (~4h playback); no unbounded loops.
 * motionTime is continuous and freezes in non-moving states.
 */
export function sampleCornSnakeActivityV06(seconds,{seed=1049}={}){
 if(!Number.isFinite(seconds)||seconds<0||seconds>14400)throw new RangeError('invalid_activity_time');
 validateSeed(seed);
 let start=0,motionTime=0,index=0,entry;
 while(index<2000){
  entry=segment(seed,index);
  if(seconds<start+entry.duration)break;
  if(entry.moving)motionTime+=entry.duration;
  start+=entry.duration;index++;
 }
 if(index>=2000)throw new RangeError('activity_segment_limit');
 const t=(seconds-start)/entry.duration;
 if(entry.moving)motionTime+=seconds-start;
 const gesture=entry.state==='orient'?Math.sin(Math.PI*ease(t)):0;
 const peek=entry.state==='explore'?Math.sin(Math.PI*ease(t)):0;
 const tongueCandidate=!entry.moving&&randomFor(seed,index,311)<.34;
 const tonguePhase=(t-.64)/.14;
 const tongue=tongueCandidate&&tonguePhase>0&&tonguePhase<1?
   Math.sin(Math.PI*ease(tonguePhase)):0;
 const angle=gesture*(randomFor(seed,index,51)*2-1)*.50;
 return {state:entry.state,moving:entry.moving,motionTime,look:0,peek,
  headTurn:angle,tongue,seed,segmentIndex:index,segmentProgress:t};
}
/** Smooth local neck offset; tail and rear torso unchanged. */
export function applyCornSnakeGestureV06(pose,activity){
 if(!Array.isArray(pose)||pose.length<12||!activity)throw new TypeError('invalid_v06_gesture');
 const turn=activity.headTurn??0,peek=activity.peek??0;
 if(!Number.isFinite(turn)||Math.abs(turn)>1||!Number.isFinite(peek)||peek<0||peek>1)
  throw new RangeError('invalid_v06_gesture_amount');
 if(turn===0&&peek===0)return pose;
 const head=pose[0],neck=pose[Math.min(6,pose.length-1)];
 const dx=head.x-neck.x,dy=head.y-neck.y,n=Math.hypot(dx,dy)||1;
 const nx=-dy/n,ny=dx/n,ux=dx/n,uy=dy/n;
 return pose.map((p,i)=>{
  const s=i/(pose.length-1),weight=Math.pow(Math.max(0,1-s/.19),2);
  return {...p,x:p.x+weight*(nx*.018*turn+ux*.012*peek),
   y:p.y+weight*(ny*.018*turn+uy*.012*peek)};
 });
}
