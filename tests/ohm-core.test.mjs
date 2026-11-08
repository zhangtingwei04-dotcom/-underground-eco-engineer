import { createWorld,validateWorld,dispatchWorld,DEMO_MAP } from '../src/ohm-core/world.mjs';
const outcomes=[];
function check(name,condition) {outcomes.push({name,pass:Boolean(condition)});}
const initial=createWorld();
const first=dispatchWorld(initial,{type:'TRAVEL',location:'terrarium-room'},DEMO_MAP);
check('initial schema validates',validateWorld(initial).ok);
check('travel to adjacent room',first.ok && first.state.location==='terrarium-room');
check('command never mutates source state',initial.location==='research-room' && initial.visited.length===1);
check('invalid travel rejected',!dispatchWorld(initial,{type:'TRAVEL',location:'hidden-room'},DEMO_MAP).ok);
check('prototype injection is not a valid command',!dispatchWorld(initial,{type:'__proto__'},DEMO_MAP).ok);
const observed=dispatchWorld(first.state,{type:'OBSERVE'},DEMO_MAP);
check('observations are recorded',observed.ok && observed.state.observations.length===1 && observed.events[0].type==='observation_recorded');
const timed=dispatchWorld(observed.state,{type:'TICK',minutes:5},DEMO_MAP);
check('time advances deterministically',timed.ok && timed.state.clock===5);
check('negative time rejected',!dispatchWorld(observed.state,{type:'TICK',minutes:-1},DEMO_MAP).ok);
check('future schema rejected',!validateWorld({...initial,schemaVersion:99}).ok);
check('invalid state rejected',!dispatchWorld({...initial,clock:-1},{type:'OBSERVE'},DEMO_MAP).ok);
check('save state is JSON serializable',JSON.parse(JSON.stringify(timed.state)).clock===5);
export const ohmCoreResults=outcomes;
export const ohmCorePassed=outcomes.every(x=>x.pass);
if(typeof process!=='undefined' && process?.versions?.node) {
  for(const x of outcomes) console.log((x.pass?'PASS':'FAIL')+' '+x.name);
  if(!ohmCorePassed) process.exitCode=1;
}
