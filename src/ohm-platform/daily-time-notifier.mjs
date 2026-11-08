// Browser adapter for four real-world checkpoints per day (midnight, morning, noon, evening).
// Starts on game entry. Timer is scheduled for the next boundary rather than polling each second.
import {getBrowserGameClock,startBrowserGameClock} from './browser-game-clock.mjs';
import {DAILY_CHECKPOINTS,checkDailyTime,millisecondsUntilNextCheckpoint} from '../ohm-core/daily-time-checkpoints.mjs';
function calendarParts(nowMs,timeZone) {
  const parts=new Intl.DateTimeFormat('en-CA',{
    timeZone,year:'numeric',month:'2-digit',day:'2-digit',
    hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'
  }).formatToParts(new Date(nowMs));
  const get=type=>parts.find(p=>p.type===type)?.value;
  const hour=Number(get('hour')),minute=Number(get('minute')),second=Number(get('second'));
  const dateKey=[get('year'),get('month'),get('day')].join('-');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)||!Number.isInteger(hour)||hour>23||!Number.isInteger(minute)||minute>59||!Number.isInteger(second)||second>59)
    throw new Error('invalid_calendar');
  return {dateKey,minuteOfDay:hour*60+minute,second,millisecond:new Date(nowMs).getUTCMilliseconds()};
}
export class DailyTimeNotifier {
  constructor({clock=getBrowserGameClock(),setTimer=setTimeout,clearTimer=clearTimeout,timeZone='Asia/Taipei'}={}){
    this.clock=clock;this.setTimer=setTimer;this.clearTimer=clearTimer;this.timeZone=timeZone;
    this.listeners=new Set();this.processed=new Set();this.timer=null;this.running=false;
  }
  subscribe(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
  context(){const ms=this.clock.nowMs();if(ms===null)return null;return calendarParts(ms,this.timeZone);}
  start(){
    if(this.running)return;
    if(!this.clock.started)startBrowserGameClock();
    this.running=true;
    // Check current time on entry; past checkpoints are not treated as newly occurring events.
    const ctx=this.context();
    if(ctx)for(const checkpoint of DAILY_CHECKPOINTS)
      if(ctx.minuteOfDay>=checkpoint.minuteOfDay)this.processed.add(ctx.dateKey+':'+checkpoint.id);
    this.schedule();
  }
  resume(){
    if(!this.running)return;
    this.clock.recheck();
    this.evaluate();
  }
  evaluate(){
    if(!this.running)return;
    this.clearSchedule();
    const ctx=this.context();if(!ctx)return;
    // If the app slept across multiple checkpoints, notify only the latest one, not a burst of old events.
    const result=checkDailyTime({...ctx,processedKeys:[...this.processed]});
    if(result.ok && result.due.length){
      for(const key of result.keys)this.processed.add(key);
      const mostRecent=result.due[result.due.length-1];
      for(const listener of this.listeners){
        try{listener({checkpoint:mostRecent.id,label:mostRecent.label,dateKey:ctx.dateKey,source:'device_time'});}
        catch(error){console.error('[DailyTimeNotifier] listener failed',error);}
      }
    }
    // Keep only today's keys in memory, to avoid unbounded growth.
    this.processed=new Set([...this.processed].filter(key=>key.startsWith(ctx.dateKey+':')));
    this.schedule();
  }
  clearSchedule(){if(this.timer!==null){this.clearTimer(this.timer);this.timer=null;}}
  schedule(){
    if(!this.running)return;
    const ctx=this.context();if(!ctx)return;
    const delay=millisecondsUntilNextCheckpoint(ctx);
    if(delay!==null)this.timer=this.setTimer(()=>{this.timer=null;this.clock.recheck();this.evaluate();},Math.max(1,delay+25));
  }
  stop(){this.running=false;this.clearSchedule();this.listeners.clear();}
}
let singleton;
export function startDailyTimeNotifier(){
  if(!singleton)singleton=new DailyTimeNotifier();
  singleton.start();
  if(typeof document!=='undefined'&&!singleton.bound){
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)singleton.resume();});
    window.addEventListener('focus',()=>singleton.resume());
    singleton.bound=true;
  }
  return singleton;
}
