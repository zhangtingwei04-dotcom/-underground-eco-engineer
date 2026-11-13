import assert from 'node:assert/strict';
import {
 createTerrariumSceneGeometryV03d,
 advanceTerrariumSceneGeometryV03d,
 isValidTerrariumSceneGeometryV03d
} from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 previewTerrariumMicroActivityV03j,
 sampleTerrariumMicroActivityFrameV03j,
 TERRARIUM_MICRO_ACTIVITY_ROLE_CATALOG_V03J
} from '../src/ohm-core/terrarium-micro-activity-v03j.mjs';
import {previewTerrariumSceneFoodWebV03i}
 from '../src/ohm-core/terrarium-scene-foodweb-preview-v03i.mjs';

const baseOptions={
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{columns:5,rows:1,
    ambient:{temperatureC:24,relativeHumidity:.5}},
   substrateOptions:{zones:Array.from({length:5},(_,i)=>({
    surfaceWaterUnits:i===0?0:650,
    rootWaterUnits:i===0?0:1600,
    percolationPermille:0,lateralPermille:0
   }))}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:120,
    lightUnits:800,litterUnits:200,fragmentedUnits:20,
    fungiIndex:300,springtailIndex:600,isopodIndex:550},
   {plantKind:'fern',plantCoverUnits:120,
    lightUnits:500,litterUnits:250,fragmentedUnits:80,
    fungiIndex:300,springtailIndex:300,isopodIndex:250},
   {plantKind:'none',plantCoverUnits:0,
    litterUnits:0,fragmentedUnits:0,mineralUnits:0,
    fungiIndex:700,springtailIndex:700,isopodIndex:700},
   {plantKind:'moss',plantCoverUnits:250,
    lightUnits:600,litterUnits:4000,fragmentedUnits:700,
    fungiIndex:900,springtailIndex:200,isopodIndex:450},
   {plantKind:'fern',plantCoverUnits:320,
    lightUnits:800,litterUnits:3000,fragmentedUnits:300,
    fungiIndex:850,springtailIndex:400,isopodIndex:400}
  ]
 },
 fixtures:[{id:'led',type:'artificial_led',
  zoneIndex:2,strengthUnits:900,spreadZones:4,
  heightUnits:0,startMinute:0,durationMinutes:1440}]
};
const source=createTerrariumSceneGeometryV03d({
 sceneId:'v03j_source_real_five_zone',
 baseOptions,mounts:[{fixtureId:'led',x:500,y:200,height:800}],
 objects:[{id:'stone_01',kind:'rock_overhang',
  x:570,y:120,width:60,depth:160,height:500,
  transmissionPermille:0}]
});
assert.equal(isValidTerrariumSceneGeometryV03d(source),true);
const pristine=JSON.stringify(source);
const bacteria=[100,250,750,850,300];
const preview=previewTerrariumMicroActivityV03j({
 scene:source,minutes:60,bacteriaIndexesByZone:bacteria
});
assert.equal(preview.ok,true,
 'true V0.3d real five-zone micro activity preview');
assert.equal(preview.zoneCount,5);
assert.equal(preview.zones.length,5);
assert.equal(preview.version,'0.3j');
assert.equal(preview.periodicFramesOnlyVisual,true);
assert.equal(preview.noDailyPlayerObligations,true);
assert.equal(preview.foodwebShadowNeverCommitted,true);
assert.equal(preview.sourceSceneUnchanged,true);
assert.equal(preview.saveModified,false);
assert.equal(preview.gameplayReadOnly,true);
assert.equal(JSON.stringify(source),pristine);
assert.equal(TERRARIUM_MICRO_ACTIVITY_ROLE_CATALOG_V03J.length,3);
assert.deepEqual(preview.sourceLedgerBefore,preview.sourceLedgerAfter);
assert.equal(preview.sourceOrganicTotal,8550);
assert.equal(preview.afterSourceOrganicTotal,8550);
const original=previewTerrariumSceneFoodWebV03i({
 scene:source,minutes:60,bacteriaIndexesByZone:bacteria
});
assert.equal(original.ok,true);
assert.deepEqual(preview.sourceSceneCandidate,
 original.authoritativeSceneCandidate);
assert.deepEqual(preview.sourceSceneCandidate,
 advanceTerrariumSceneGeometryV03d(source,{minutes:60}));
for(let i=0;i<5;i++){
 const row=preview.zones[i],comparison=original.zones[i];
 assert.equal(row.id,'zone_'+i);
 assert.equal(row.cues.length,3);
 assert.deepEqual(row.sourceCurrentOrganic,comparison.sourceStart);
 assert.deepEqual(row.sourceAfterOldFormula,
  comparison.sourceAfterAuthoritativeAdvance);
 assert.deepEqual(row.alternativeAfterV03h,
  comparison.alternativeReadOnlyAfterSameInterval);
 assert.equal(row.sourceTotalOrganicUnits,
  comparison.bothModelsProxyTotal);
 assert.deepEqual(row.cues.map(x=>x.id),
  ['isopod','springtail','mycelium']);
 assert.ok(row.cues.every(x=>x.activityIsProxy));
 assert.equal(row.mossIsDecomposer,false);
 assert.equal(row.observationIsNotOrganismCount,true);
 assert.equal(row.shadowRateNotBiological,false);
 assert.equal(row.bacteriaIndexSyntheticOnly,bacteria[i]);
 assert.equal(row.photosyntheticPlantKind,
  source.base.biota.zones[i].plant.kind);
}
const dry=preview.zones[0];
assert.equal(dry.sourceMoisture,0);
assert.equal(dry.cues[0].state,'under_shelter');
assert.equal(dry.cues[0].visible,false);
assert.equal(dry.cues[1].state,'not_visible');
assert.equal(dry.cues[2].state,'not_visible');
const empty=preview.zones[2];
assert.equal(empty.sourceTotalOrganicUnits,0);
assert.ok(empty.cues.every(x=>!x.visible),
 'no organics may not fake feeding or mycelium');
assert.equal(empty.alternativeFragmentationUnits,0);
assert.equal(empty.alternativeMicrobialProcessingUnits,0);
const populated=preview.zones[3];
assert.equal(populated.cues[0].state,'litter_foraging');
assert.equal(populated.cues[1].state,'microbe_grazing');
assert.equal(populated.cues[2].state,'possible_decomposition');
assert.equal(populated.cues.every(x=>x.visible),true);
assert.ok(populated.alternativeFragmentationUnits>0);
assert.ok(populated.alternativeMicrobialProcessingUnits>0);
assert.equal(populated.sourceLightUnits,source.base.biota.zones[3].plant.lightUnits);

const disturbance=previewTerrariumMicroActivityV03j({
 scene:source,minutes:60,bacteriaIndexesByZone:bacteria,
 observedDisturbance:true,seed:7919
});
assert.equal(disturbance.ok,true);
assert.equal(disturbance.zones[3].cues[1].state,
 'disturbance_jump');
assert.equal(preview.zones[3].cues[1].state,
 'microbe_grazing');
assert.equal(disturbance.zones[3].cues[0].state,
 'litter_foraging');
assert.deepEqual(disturbance.sourceSceneCandidate,
 preview.sourceSceneCandidate);
assert.equal(disturbance.sourceOrganicTotal,
 preview.sourceOrganicTotal);
assert.equal(JSON.stringify(source),pristine);

const frame0=sampleTerrariumMicroActivityFrameV03j({
 preview,phase:0
});
const frame4=sampleTerrariumMicroActivityFrameV03j({
 preview,phase:4
});
const frame7=sampleTerrariumMicroActivityFrameV03j({
 preview,phase:7
});
assert.equal(frame0.ok,true);
assert.equal(frame4.ok,true);
assert.equal(frame7.ok,true);
assert.equal(frame0.frameCountInCycle,8);
assert.ok(frame0.markerCount>0);
assert.equal(frame0.markerCount,frame4.markerCount);
assert.equal(frame0.markerCount,frame7.markerCount);
assert.equal(frame0.frameNeverMovesWorldClock,true);
assert.equal(frame0.gameSaveModified,false);
assert.ok(frame0.markers.every(m=>
 m.localX>=0&&m.localX<=1&&
 m.localY>=0&&m.localY<=1&&
 m.illustrativeNotIndividualTracked===true));
assert.deepEqual(frame0,sampleTerrariumMicroActivityFrameV03j({
 preview,phase:0
}),'every frame must be reproducible, not per-render random');
assert.notDeepEqual(frame0.markers,frame4.markers,
 'illustrative markers should shift while source pools stay fixed');
const jump4=sampleTerrariumMicroActivityFrameV03j({
 preview:disturbance,phase:4
});
assert.equal(jump4.ok,true);
const spring0=frame4.markers.filter(x=>
 x.zoneId==='zone_3'&&x.role==='springtail');
const springJump=jump4.markers.filter(x=>
 x.zoneId==='zone_3'&&x.role==='springtail');
assert.equal(spring0.length,springJump.length);
assert.notDeepEqual(spring0.map(x=>x.localY),
 springJump.map(x=>x.localY));
assert.equal(JSON.stringify(source),pristine);
assert.deepEqual(frame0,
 sampleTerrariumMicroActivityFrameV03j({
  preview:previewTerrariumMicroActivityV03j({
   scene:source,minutes:60,bacteriaIndexesByZone:bacteria
  }),phase:0
 }));

// Visual cycles alone NEVER consume organics, create "population"
// or move game time forward. The formal source still owns all clocks.
for(let p=0;p<8;p++){
 const frame=sampleTerrariumMicroActivityFrameV03j({
  preview,phase:p
 });
 assert.equal(frame.ok,true);
 assert.equal(frame.fromMinute,0);
 assert.equal(frame.toMinute,60);
 assert.equal(frame.stateValuesUnmodified,true);
 assert.equal(frame.gameSaveModified,false);
}
assert.equal(source.minute,0);
assert.equal(preview.sourceSceneCandidate.minute,60);
assert.deepEqual(source.base.biota.zones,
 JSON.parse(pristine).base.biota.zones);
for(const args of [
 {scene:null},
 {scene:source,minutes:30},
 {scene:source,minutes:300},
 {scene:source,observedDisturbance:'yes'},
 {scene:source,seed:-1},
 {scene:source,bacteriaIndexesByZone:[1,2]},
 {scene:{...source,revision:-1}},
 {scene:{...source,base:{...source.base,biota:{
  ...source.base.biota,ledger:{...source.base.biota.ledger,
   initialUnits:999999}
 }}}}
]){
 const r=previewTerrariumMicroActivityV03j(args);
 assert.equal(r.ok,false);
 assert.equal(r.saveModified,false);
}
assert.equal(sampleTerrariumMicroActivityFrameV03j({
 preview,phase:8
}).ok,false);
assert.equal(sampleTerrariumMicroActivityFrameV03j({
 preview:{...preview,ok:false},phase:0
}).ok,false);
console.log('PASS ECO V0.3j source-tied mycelium/isopod/springtail differentiated visual cues, 5-zone comparison, 8 phase animation without ecology mutation');
console.log(JSON.stringify({
 sourceZones:5,organicTotalBefore:preview.sourceOrganicTotal,
 organicTotalAfter:preview.afterSourceOrganicTotal,
 populatedZone3:populated.cues.map(x=>[x.id,x.state]),
 dryZone0:dry.cues.map(x=>[x.id,x.visible]),
 noFoodZone2:empty.cues.map(x=>[x.id,x.visible]),
 drawnDebugMarkers:frame0.markerCount,
 uniqueAnimationPhases:8,
 actualSpringtailJumpRequiresDebugDisturbance:true,
 formalAnimalCountsSimulated:false,
 noDailyPlayerObligations:true,
 sourceSaveOrTimeNeverChanged:true
}));
