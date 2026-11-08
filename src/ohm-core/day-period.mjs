// Platform-neutral time interpretation. Caller supplies wall-clock parts; no Date or timers here.
export function describeDayPeriod({hour,minute=0}={}) {
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59)
    return {ok:false,error:'invalid_time'};
  const period=hour>=5&&hour<11?'morning':hour>=11&&hour<17?'afternoon':hour>=17&&hour<22?'evening':'night';
  const labels={morning:'早晨',afternoon:'下午',evening:'傍晚',night:'夜間'};
  return {ok:true,period,label:labels[period]};
}
