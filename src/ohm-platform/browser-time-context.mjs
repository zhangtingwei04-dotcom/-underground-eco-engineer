// Browser-only adapter: detects the current real-world time in a configured time zone.
// Not authoritative for economic rewards or multiplayer. Never advances world.clock.
import { describeDayPeriod } from '../ohm-core/day-period.mjs';
export function readBrowserTimeContext({timeZone='Asia/Taipei',now=new Date()}={}) {
  try {
    if(!(now instanceof Date)||!Number.isFinite(now.getTime())) return {ok:false,error:'invalid_date'};
    const parts=new Intl.DateTimeFormat('en-US',{hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZone})
      .formatToParts(now);
    const hour=Number(parts.find(p=>p.type==='hour')?.value);
    const minute=Number(parts.find(p=>p.type==='minute')?.value);
    const described=describeDayPeriod({hour,minute});
    if(!described.ok)return described;
    return {...described,timeZone,hour,minute,source:'device_clock'};
  } catch {return {ok:false,error:'invalid_timezone'};}
}
