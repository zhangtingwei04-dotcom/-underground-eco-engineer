import assert from 'node:assert/strict';
import {buildSnakeActionInputFromEcology, SNAKE_ECOLOGY_ACTION_VERSION}
  from '../src/ohm-core/snake-ecology-action-adapter.mjs';
import {chooseSnakeActivityPoint}
  from '../src/ohm-core/snake-activity-points.mjs';

const base={revision:12,sites:[
 {id:'cover01',kind:'hide',safe:true,reachable:true,distanceCost:.1,
  conditions:{hasCover:true,microclimate:'normal'}},
 {id:'stone01',kind:'warm_area',safe:true,reachable:true,distanceCost:.15,
  conditions:{thermalService:true}},
 {id:'cool01',kind:'cool_area',safe:true,reachable:true,distanceCost:.1,
  conditions:{thermalService:true}},
 {id:'bowl01',kind:'water',safe:true,reachable:true,distanceCost:.2,
  conditions:{hasWater:true}},
 {id:'soil01',kind:'loose_substrate',safe:true,reachable:true,distanceCost:.1,
  conditions:{diggable:true}},
 {id:'branch01',kind:'branch',safe:true,reachable:true,distanceCost:.15,
  conditions:{branchStable:true}},
 {id:'plants01',kind:'covered_area',safe:true,reachable:true,distanceCost:.2,
  conditions:{hasCover:true,microclimate:'too_damp'}},
 {id:'edge01',kind:'open_area',safe:true,reachable:true,distanceCost:.15,
  conditions:{qualityFlag:false}}
]};
const project=(snapshot=base,more={})=>buildSnakeActionInputFromEcology({
 snapshot,speciesId:'corn_snake',...more
});
const a=project();
assert.equal(SNAKE_ECOLOGY_ACTION_VERSION,'0.1');
assert.equal(a.ecologyRevision,12);
assert.equal(a.points.length,8);
assert.equal(a.points.every(p=>p.safe&&p.reachable),true);
assert.equal(a.reports.find(p=>p.id==='plants01').available,true,
 'dampness alone does not prove a hazard');
assert.ok(Object.isFrozen(a.points));
assert.ok(Object.isFrozen(a.reports));
assert.deepEqual(a,project(),'same snapshot produces same result');
assert.equal(chooseSnakeActivityPoint({...a,needs:{...a.needs,hydration:1}}).targetId,'bowl01');

const replace=(id,conditions)=>({...base,revision:13,
 sites:base.sites.map(s=>s.id===id?{...s,conditions:{...s.conditions,...conditions}}:s)});
const emptyWater=project(replace('bowl01',{hasWater:false}));
assert.equal(emptyWater.points.find(p=>p.id==='bowl01').waterAccessible,false);
assert.equal(emptyWater.points.find(p=>p.id==='bowl01').reachable,false);
assert.deepEqual(chooseSnakeActivityPoint({...emptyWater,needs:{...emptyWater.needs,hydration:1}}).unmetNeeds,
 ['no_safe_accessible_water']);
const brokenBranch=project(replace('branch01',{branchStable:false}));
assert.equal(brokenBranch.points.find(p=>p.id==='branch01').supportStable,false);
assert.equal(brokenBranch.reports.find(p=>p.id==='branch01').available,false);
const compactSoil=project(replace('soil01',{diggable:false}));
assert.equal(compactSoil.points.find(p=>p.id==='soil01').diggable,false);
const goneCover=project(replace('cover01',{hasCover:false}));
assert.equal(goneCover.points.find(p=>p.id==='cover01').reachable,false);
const heaterOff=project(replace('stone01',{thermalService:false}),{thermalSignal:'seek_warm'});
assert.equal(heaterOff.points.find(p=>p.id==='stone01').reachable,false);
assert.deepEqual(chooseSnakeActivityPoint(heaterOff).unmetNeeds,['no_safe_accessible_warm_area']);
assert.equal(project(base,{thermalSignal:'seek_cool'}).needs.thermal,'seek_cool');

const flagged=project(replace('plants01',{qualityFlag:true}));
assert.equal(flagged.points.find(p=>p.id==='plants01').safe,false);
assert.ok(flagged.reports.find(p=>p.id==='plants01').reasons.includes('environment_quality_flag'));
const unsafe={...base,sites:base.sites.map(s=>s.id==='cover01'?{...s,safe:false}:s)};
assert.equal(project(unsafe).points.find(p=>p.id==='cover01').safe,false);
for(const c of [
 ()=>project({...base,revision:-1}),
 ()=>project({...base,sites:[base.sites[0],base.sites[0]]}),
 ()=>project({...base,sites:base.sites.map(s=>({...s,distanceCost:2}))}),
 ()=>project(replace('bowl01',{hasWater:'maybe'})),
 ()=>project(replace('plants01',{microclimate:'fatal'})),
 ()=>project(base,{thermalSignal:'invalid'}),
 ()=>project(base,{needs:{thermal:'seek_warm'},thermalSignal:'seek_cool'}),
 ()=>project(base,{speciesId:'not valid'})
])assert.throws(c,RangeError);
assert.equal(project().status,'ecology_input_adapter_not_physiology_or_collision');
console.log('PASS OHM snake ecology action adapter V0.1: site changes, safety, thermal, needs and guards');
