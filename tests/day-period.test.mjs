import {describeDayPeriod} from '../src/ohm-core/day-period.mjs';
import {readBrowserTimeContext} from '../src/ohm-platform/browser-time-context.mjs';
const cases=[
 ['early morning',describeDayPeriod({hour:5}).period==='morning'],
 ['before morning',describeDayPeriod({hour:4,minute:59}).period==='night'],
 ['afternoon',describeDayPeriod({hour:13}).period==='afternoon'],
 ['evening',describeDayPeriod({hour:18}).period==='evening'],
 ['night',describeDayPeriod({hour:23}).period==='night'],
 ['reject invalid hour',!describeDayPeriod({hour:24}).ok],
 ['reject fractional hour',!describeDayPeriod({hour:9.5}).ok],
 ['timezone Taipei',readBrowserTimeContext({now:new Date('2026-11-08T04:00:00Z')}).period==='afternoon'],
 ['timezone UTC',readBrowserTimeContext({timeZone:'UTC',now:new Date('2026-11-08T04:00:00Z')}).period==='night'],
 ['reject bad timezone',!readBrowserTimeContext({timeZone:'not-a-zone'}).ok],
 ['reject invalid date',!readBrowserTimeContext({now:new Date('invalid')}).ok]
];
for(const [name,pass] of cases) console.log((pass?'PASS ':'FAIL ')+name);
export const dayPeriodResults=cases;
export const dayPeriodPassed=cases.every(x=>x[1]);
if(typeof process!=='undefined'&&process?.versions?.node&&!dayPeriodPassed)process.exitCode=1;
