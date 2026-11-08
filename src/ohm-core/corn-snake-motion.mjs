/**
 * Ohm Core — procedural corn-snake prototype geometry.
 * Coordinates are normalized; a visual demonstrator, NOT measured biomechanics.
 * Pure functions. No DOM/Canvas/Phaser, no randomness from runtime.
 */
export const POSE_VERSION=1;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function generateSnakePose(timeSeconds,{segments=64,length=0.47,speed=1}={}){
  if(!Number.isFinite(timeSeconds)||!Number.isInteger(segments)||segments<12||segments>256||
     !Number.isFinite(length)||length<=0||length>0.8||
     !Number.isFinite(speed)||speed<0||speed>3)throw new RangeError('invalid_pose_params');
  const t=timeSeconds*speed;
  const result=[];
  // Head follows a slow elliptical loop; body samples preceding head trajectory.
  // Added small wave for visible curve propagation. Artistic parameterization only.
  for(let i=0;i<=segments;i++){
    const s=i/segments;
    const phase=t*0.44-s*length*4.2;
    const wave=Math.sin(phase*2.15 + s*8.2)*0.016*s;
    const x=0.50+0.31*Math.cos(phase)+wave*Math.cos(phase+Math.PI/2);
    const y=0.51+0.28*Math.sin(phase)*0.75+wave*Math.sin(phase+Math.PI/2);
    result.push({x:clamp(x,0.04,0.96),y:clamp(y,0.06,0.94),s});
  }
  return result;
}
/** Deterministic, sampleable pattern values; not an inheritance model. */
export function makeCornSnakePattern(seed,marks=35){
  if(!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||
    !Number.isInteger(marks)||marks<1||marks>100)return {ok:false,error:'invalid_pattern_options'};
  let state=seed>>>0;
  const rand=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
  return {ok:true,marks:Array.from({length:marks},(_,i)=>({
    position:(i+0.5+(rand()-.5)*0.15)/marks,
    size:0.55+rand()*0.4,
    angle:(rand()-0.5)*0.4
  }))};
}
