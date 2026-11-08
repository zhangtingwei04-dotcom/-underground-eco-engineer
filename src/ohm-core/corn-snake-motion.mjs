/**
 * Ohm Core — corn snake path-follow motion prototype v0.3.
 * Smooth 2.5D ground-plane route: head advances and the body follows at
 * distance-spaced samples, including turns. Deterministic and renderer-free.
 * All geometry, path speed and lateral undulation remain ART TEST VALUES,
 * not measured corn snake biomechanics or habitat collision data.
 */
export const POSE_VERSION=2;
const PATH_NODES=Object.freeze([[0.2,0.755],[0.35,0.708],[0.57,0.714],[0.78,0.755],[0.83,0.789],[0.75,0.834],[0.5,0.836],[0.29,0.818],[0.17,0.79]].map(p=>Object.freeze(p)));
const PATH_ASPECT=540/960,TRACK_SUBDIV=48,FORWARD_RATE=0.095;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function catmull1(a,b,c,d,t){
  const t2=t*t,t3=t2*t;
  return 0.5*(2*b+(-a+c)*t+(2*a-5*b+4*c-d)*t2+(-a+3*b-3*c+d)*t3);
}
function buildLoop(){
  const points=[];let distance=0,n=PATH_NODES.length;
  for(let i=0;i<n;i++){
    const p0=PATH_NODES[(i-1+n)%n],p1=PATH_NODES[i],p2=PATH_NODES[(i+1)%n],p3=PATH_NODES[(i+2)%n];
    for(let j=0;j<TRACK_SUBDIV;j++){
      const t=j/TRACK_SUBDIV,x=catmull1(p0[0],p1[0],p2[0],p3[0],t),y=catmull1(p0[1],p1[1],p2[1],p3[1],t);
      const previous=points[points.length-1];
      if(previous)distance+=Math.hypot(x-previous.x,(y-previous.y)*PATH_ASPECT);
      points.push({x,y,distance});
    }
  }
  const first=points[0],last=points[points.length-1];
  distance+=Math.hypot(first.x-last.x,(first.y-last.y)*PATH_ASPECT);
  points.push({x:first.x,y:first.y,distance});
  return Object.freeze({points:Object.freeze(points),length:distance});
}
const PATH=buildLoop();
function sampleLoop(distance){
  const total=PATH.length,d=((distance%total)+total)%total,points=PATH.points;
  let low=0,high=points.length-1;
  while(high-low>1){
    const mid=(low+high)>>1;
    if(points[mid].distance<=d)low=mid;else high=mid;
  }
  const a=points[low],b=points[high],span=b.distance-a.distance;
  const k=span>0?(d-a.distance)/span:0;
  return {x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};
}
export function generateSnakePose(timeSeconds,{segments=64,length=0.47,speed=1}={}){
  if(!Number.isFinite(timeSeconds)||!Number.isInteger(segments)||segments<12||segments>256||
     !Number.isFinite(length)||length<=0||length>0.8||
     !Number.isFinite(speed)||speed<0||speed>3)throw new RangeError('invalid_pose_params');
  const travel=timeSeconds*speed*FORWARD_RATE+PATH.length*0.23;
  const result=[];
  for(let i=0;i<=segments;i++){
    const s=i/segments,at=travel-s*length,position=sampleLoop(at);
    const ahead=sampleLoop(at+0.008),behind=sampleLoop(at-0.008);
    const dx=ahead.x-behind.x,dy=ahead.y-behind.y,normalLen=Math.hypot(dx,dy)||1;
    const wave=0.003*Math.sin(Math.PI*s)*Math.sin(timeSeconds*speed*4.2-s*13.5);
    const x=clamp(position.x-dy/normalLen*wave,0.04,0.96);
    const y=clamp(position.y+dx/normalLen*wave,0.67,0.87);
    result.push({x,y,s});
  }
  return result;
}
/** Stable individual blotches for the prototype; not a genetics model. */
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
