// Ohm Core: four low-frequency checkpoints, independent of display periods.
export const DAILY_CHECKPOINTS=Object.freeze([
  Object.freeze({id:'midnight',minuteOfDay:0,label:'凌晨'}),
  Object.freeze({id:'morning',minuteOfDay:6*60,label:'早'}),
  Object.freeze({id:'noon',minuteOfDay:12*60,label:'中'}),
  Object.freeze({id:'evening',minuteOfDay:18*60,label:'晚'})
]);

export function checkDailyTime({dateKey,minuteOfDay,processedKeys=[]}, checkpoints=DAILY_CHECKPOINTS) {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dateKey||'') ||
    !Number.isInteger(minuteOfDay)||minuteOfDay<0||minuteOfDay>=1440 ||
    !Array.isArray(processedKeys)) return {ok:false,error:'invalid_time_context'};
  const completed=new Set(processedKeys);
  const due=checkpoints.filter(entry=>minuteOfDay>=entry.minuteOfDay && !completed.has(dateKey+':'+entry.id));
  return {ok:true,due,keys:due.map(entry=>dateKey+':'+entry.id)};
}
export function millisecondsUntilNextCheckpoint({minuteOfDay,second=0,millisecond=0},checkpoints=DAILY_CHECKPOINTS) {
  if(!Number.isInteger(minuteOfDay)||minuteOfDay<0||minuteOfDay>1439||
    !Number.isInteger(second)||second<0||second>59||
    !Number.isInteger(millisecond)||millisecond<0||millisecond>999) return null;
  const now=minuteOfDay*60000+second*1000+millisecond;
  const times=checkpoints.map(p=>p.minuteOfDay*60000).filter(t=>t>now);
  return (times.length?Math.min(...times):86400000+checkpoints[0].minuteOfDay*60000)-now;
}
