/**
 * Corn snake observation rhythm and head gestures v0.5.
 * Deterministic prototype choreography for a standalone visual test.
 * It is NOT a measured activity budget, cognition model, welfare metric,
 * or evidence that a snake understands it is being watched by a player.
 * Fully independent of Phaser, DOM, Canvas and saved-game state.
 */
export const CORN_ACTIVITY_VERSION=1;
export const CORN_ACTIVITY_CYCLE_SECONDS=52;
export const CORN_ACTIVITY_STATES=Object.freeze([
  'slither','rest','orient','observe','return','peek'
]);
const SEGMENTS=Object.freeze([
  {start:0,end:9,state:'slither',travelStart:0},
  {start:9,end:13,state:'rest',travelStart:9},
  {start:13,end:15,state:'orient',travelStart:9},
  {start:15,end:19,state:'observe',travelStart:9},
  {start:19,end:21,state:'return',travelStart:9},
  {start:21,end:32,state:'slither',travelStart:9},
  {start:32,end:36,state:'peek',travelStart:20},
  {start:36,end:40,state:'rest',travelStart:20},
  {start:40,end:52,state:'slither',travelStart:20}
].map(x=>Object.freeze(x)));
const MOTION_PER_CYCLE=32;
const ease=t=>t*t*(3-2*t);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/** seconds elapsed in playback, not wall clock time; freezes on pause. */
export function sampleCornSnakeActivity(seconds){
  if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('invalid_activity_time');
  const cycles=Math.floor(seconds/CORN_ACTIVITY_CYCLE_SECONDS);
  const local=seconds-cycles*CORN_ACTIVITY_CYCLE_SECONDS;
  const entry=SEGMENTS.find(s=>local>=s.start&&local<s.end)||SEGMENTS.at(-1);
  const progress=clamp((local-entry.start)/(entry.end-entry.start),0,1);
  const state=entry.state;
  const moving=state==='slither';
  const look=state==='orient'?ease(progress):
    state==='observe'?1:
    state==='return'?1-ease(progress):0;
  const peek=state==='peek'?Math.sin(Math.PI*progress):0;
  return {
    state,
    motionTime:cycles*MOTION_PER_CYCLE+entry.travelStart+(moving?local-entry.start:0),
    moving,
    look,
    peek
  };
}
/** Move the head and nearby neck in normalized body coordinates. Never move torso/tail. */
export function applyCornSnakeHeadGesture(pose,activity){
  if(!Array.isArray(pose)||pose.length<12||!activity||typeof activity!=='object')
    throw new TypeError('invalid_gesture_input');
  const look=activity.look??0,peek=activity.peek??0;
  if(!Number.isFinite(look)||look<0||look>1||!Number.isFinite(peek)||peek<0||peek>1)
    throw new RangeError('invalid_gesture_amount');
  if(look===0&&peek===0)return pose;
  const a=pose[0],b=pose[Math.min(5,pose.length-1)];
  const dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy)||1;
  const ux=dx/d,uy=dy/d;
  return pose.map((p,i)=>{
    const distance=i/(pose.length-1);
    const influence=Math.pow(Math.max(0,1-distance/0.20),2);
    // Camera-facing turn is represented as a small near-head shift, with
    // rotational appearance handled by the platform's head sprite adapter.
    const x=p.x+influence*(ux*0.014*peek);
    const y=p.y+influence*(0.010*look+(uy*0.014-0.012)*peek);
    return {...p,x:clamp(x,0.04,0.96),y:clamp(y,0.67,0.87)};
  });
}
