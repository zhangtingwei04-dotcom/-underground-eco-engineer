// Ohm browser time service v0.1
// Detect wall time once on entering gameplay, then estimate it with monotonic elapsed time.
// Resync on foreground/focus and periodic drift check. Not authoritative for rewards/trades.
import { readBrowserTimeContext } from './browser-time-context.mjs';

export class BrowserGameClock {
  constructor({wallNow=()=>Date.now(),elapsedNow=()=>performance.now(),timeZone='Asia/Taipei',driftLimitMs=30000}={}) {
    this.wallNow=wallNow;
    this.elapsedNow=elapsedNow;
    this.timeZone=timeZone;
    this.driftLimitMs=driftLimitMs;
    this.started=false;
    this.baseWall=0;
    this.baseElapsed=0;
  }
  start(){
    this.sync();
    this.started=true;
    return this.snapshot();
  }
  sync(){
    const wall=this.wallNow(), elapsed=this.elapsedNow();
    if(!Number.isFinite(wall)||!Number.isFinite(elapsed)) return {ok:false,error:'invalid_clock'};
    this.baseWall=wall;
    this.baseElapsed=elapsed;
    return {ok:true};
  }
  nowMs(){
    if(!this.started) return null;
    const elapsed=this.elapsedNow()-this.baseElapsed;
    if(!Number.isFinite(elapsed)||elapsed<0) {
      this.sync();
      return this.baseWall;
    }
    return this.baseWall+elapsed;
  }
  recheck(){
    if(!this.started) return {ok:false,error:'not_started'};
    const predicted=this.nowMs(), actual=this.wallNow();
    if(!Number.isFinite(actual)) return {ok:false,error:'invalid_clock'};
    const drift=Math.abs(actual-predicted);
    if(drift>this.driftLimitMs) this.sync();
    return {ok:true,driftMs:drift,resynced:drift>this.driftLimitMs};
  }
  snapshot(){
    const ms=this.nowMs();
    if(ms===null||!Number.isFinite(ms)) return {ok:false,error:'not_started'};
    const ctx=readBrowserTimeContext({timeZone:this.timeZone,now:new Date(ms)});
    return ctx.ok?{...ctx,timestampMs:ms,source:'device_clock_monotonic'}:ctx;
  }
}

// Shared, lazy instance: only begins when a gameplay scene is entered.
let instance;
let listenersAttached=false;
export function getBrowserGameClock(){
  if(!instance) instance=new BrowserGameClock();
  return instance;
}
export function startBrowserGameClock(){
  const clock=getBrowserGameClock();
  if(!clock.started) clock.start();
  else clock.recheck();
  if(!listenersAttached && typeof document!=='undefined' && typeof window!=='undefined'){
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)clock.recheck();});
    window.addEventListener('focus',()=>clock.recheck());
    listenersAttached=true;
  }
  return clock.snapshot();
}
