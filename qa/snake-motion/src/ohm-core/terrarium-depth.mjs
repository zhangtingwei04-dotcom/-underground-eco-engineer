/**
 * Ohm independent 2.5D terrarium experiment v0.1.
 * Render-agnostic geometry: finite polyline, path progress, full-body circle
 * clearance and local visual occlusion. ART TEST VALUES, not snake biomechanics.
 */
export const TERRARIUM_DEPTH_VERSION = 1;
export const HABITAT = Object.freeze({
  width:960, height:540,
  rock:Object.freeze({x:493,y:363,radius:70}),
  plant:Object.freeze({x:690,y:410,radiusX:57,radiusY:63}),
  path:Object.freeze([
    [70,371],[150,372],[241,370],[306,390],[365,447],
    [426,465],[496,465],[562,461],[622,445],
    [685,406],[756,391],[852,386],[917,383]
  ].map(p=>Object.freeze(p)))
});
const isPoint = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const cubic=(a,b,c,d,t)=> 0.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);
export function makeRoute(anchors=HABITAT.path,steps=28){
  if(!Array.isArray(anchors)||anchors.length<4||anchors.length>128||
     !Number.isInteger(steps)||steps<4||steps>80 ||
     anchors.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)))
    throw new RangeError('invalid_route');
  const points=[];let distance=0;
  for(let i=0;i<anchors.length-1;i++){
    const a=anchors[Math.max(0,i-1)],b=anchors[i],c=anchors[i+1],d=anchors[Math.min(i+2,anchors.length-1)];
    for(let j=0;j<steps;j++){
      const t=j/steps,p={x:cubic(a[0],b[0],c[0],d[0],t),y:cubic(a[1],b[1],c[1],d[1],t)};
      if(points.length){const q=points.at(-1);distance+=Math.hypot(p.x-q.x,p.y-q.y);}
      points.push({...p,d:distance});
    }
  }
  const last=anchors.at(-1),q=points.at(-1);
  distance+=Math.hypot(last[0]-q.x,last[1]-q.y);
  points.push({x:last[0],y:last[1],d:distance});
  return {points,length:distance};
}
export const DEMO_ROUTE=makeRoute();
export function sampleRoute(route,distance){
  if(!route||!Array.isArray(route.points)||route.points.length<2||
    !Number.isFinite(route.length)||route.length<=0||!Number.isFinite(distance))
    throw new RangeError('invalid_sample');
  const d=clamp(distance,0,route.length),points=route.points;
  let lo=0,hi=points.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(points[mid].d<=d)lo=mid;else hi=mid;}
  const a=points[lo],b=points[hi],t=b.d>a.d?(d-a.d)/(b.d-a.d):0;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};
}
const smoother=t=>{const u=clamp(t,0,1);return u*u*u*(u*(u*6-15)+10);};
// A demonstrable finite journey, with a true resting head and no looping reset.
export function journeyDistance(seconds,{route=DEMO_ROUTE}={}){
  if(!Number.isFinite(seconds)||seconds<0)throw new RangeError('invalid_time');
  const from=255,to=Math.min(route.length-5,route.length-30),u=smoother((seconds-1.2)/17.6);
  return from+(to-from)*u;
}
export function getBodyHalfWidth(s){
  if(!Number.isFinite(s)||s<0||s>1)throw new RangeError('invalid_body_progress');
  const taper=clamp((1-s)/.27,0,1),neck=.72+.28*clamp(s/.22,0,1);
  return (2.0+11.5*taper)*neck;
}
// All geometry in fixed habitat coordinates, independent of canvas size or FPS.
export function sampleSnake(seconds,{route=DEMO_ROUTE,segments=80,bodyLength=238}={}){
  if(!Number.isInteger(segments)||segments<16||segments>160||
    !Number.isFinite(bodyLength)||bodyLength<80||bodyLength>320)
    throw new RangeError('invalid_body');
  const headDistance=journeyDistance(seconds,{route}),points=[];
  for(let i=0;i<=segments;i++){
    const s=i/segments,p=sampleRoute(route,headDistance-s*bodyLength);
    points.push({...p,s,halfWidth:getBodyHalfWidth(s)});
  }
  return points;
}
export function checkRockClearance(body,rock=HABITAT.rock,padding=6){
  if(!Array.isArray(body)||body.length<2||!Number.isFinite(padding)||padding<0||
     !rock||![rock.x,rock.y,rock.radius].every(Number.isFinite)||rock.radius<=0||
     body.some(p=>!isPoint(p)||!Number.isFinite(p.halfWidth)||p.halfWidth<0))
    throw new RangeError('invalid_clearance');
  let minClearance=Infinity;
  for(let i=0;i<body.length-1;i++){
    const a=body[i],b=body[i+1],dx=b.x-a.x,dy=b.y-a.y;
    const t=clamp(((rock.x-a.x)*dx+(rock.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);
    const x=a.x+dx*t,y=a.y+dy*t;
    const radius=Math.max(a.halfWidth,b.halfWidth);
    minClearance=Math.min(minClearance,Math.hypot(x-rock.x,y-rock.y)-rock.radius-radius-padding);
  }
  return {clear:minClearance>=0,minClearance};
}
export function samplePlantOcclusion(body,plant=HABITAT.plant){
  if(!Array.isArray(body)||body.some(p=>!isPoint(p))||
     !plant||![plant.x,plant.y,plant.radiusX,plant.radiusY].every(Number.isFinite)||
     plant.radiusX<=0||plant.radiusY<=0)throw new RangeError('invalid_occlusion');
  // This is an engineering depth classification; actual alpha masking is renderer-owned.
  return body.map(p=>({s:p.s,behindPlant:
    ((p.x-plant.x)/plant.radiusX)**2+((p.y-plant.y)/plant.radiusY)**2<1 && p.y<plant.y+20}));
}
export function projectHabitatPoint(point,viewWidth,viewHeight){
  if(!isPoint(point)||![viewWidth,viewHeight].every(Number.isFinite)||viewWidth<=0||viewHeight<=0)
    throw new RangeError('invalid_projection');
  const scale=Math.min(viewWidth/HABITAT.width,viewHeight/HABITAT.height);
  return {x:point.x*scale+(viewWidth-HABITAT.width*scale)/2,
    y:point.y*scale+(viewHeight-HABITAT.height*scale)/2,scale};
}
