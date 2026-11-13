/**
 * Standalone PUBLIC NEUTRAL development-only Canvas viewer.
 * NO external dependencies, save reads/writes, networking or user
 * accounts. The whole loop is a local, reproducible QA fixture.
 */
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {previewTerrariumMicroActivityV03j,
 sampleTerrariumMicroActivityFrameV03j}
 from '../src/ohm-core/terrarium-micro-activity-v03j.mjs';

const F=Object.freeze;
const cnv=document.getElementById('world');
const ctx=cnv.getContext('2d',{alpha:false});
const zones=document.getElementById('zones');
const summary=document.getElementById('summary');
const stepBtn=document.getElementById('step');
const pauseBtn=document.getElementById('pause');
const disturbBtn=document.getElementById('disturb');
const resetBtn=document.getElementById('reset');
const W=cnv.width,H=cnv.height,zoneW=W/5;
const prefersReducedMotion=window.matchMedia?.(
 '(prefers-reduced-motion: reduce)').matches??false;
const bacteria=F([100,250,750,850,300]);
const fixture=F({
 id:'led',type:'artificial_led',zoneIndex:2,
 strengthUnits:900,spreadZones:4,heightUnits:0,
 startMinute:0,durationMinutes:1440
});
const neutralSceneOptions={
 biotaOptions:{
  environmentOptions:{
   microclimateOptions:{
    columns:5,rows:1,
    ambient:{temperatureC:24,relativeHumidity:.5}
   },
   substrateOptions:{zones:Array.from({length:5},(_,i)=>({
    surfaceWaterUnits:i===0?0:650,
    rootWaterUnits:i===0?0:1600,
    percolationPermille:0,lateralPermille:0
   }))}
  },
  zoneConfigs:[
   {plantKind:'moss',plantCoverUnits:120,lightUnits:800,
    litterUnits:200,fragmentedUnits:20,
    fungiIndex:300,springtailIndex:600,isopodIndex:550},
   {plantKind:'fern',plantCoverUnits:120,lightUnits:500,
    litterUnits:250,fragmentedUnits:80,
    fungiIndex:300,springtailIndex:300,isopodIndex:250},
   {plantKind:'none',plantCoverUnits:0,lightUnits:0,
    litterUnits:0,fragmentedUnits:0,mineralUnits:0,
    fungiIndex:700,springtailIndex:700,isopodIndex:700},
   {plantKind:'moss',plantCoverUnits:250,lightUnits:600,
    litterUnits:4000,fragmentedUnits:700,
    fungiIndex:900,springtailIndex:200,isopodIndex:450},
   {plantKind:'fern',plantCoverUnits:320,lightUnits:800,
    litterUnits:3000,fragmentedUnits:300,
    fungiIndex:850,springtailIndex:400,isopodIndex:400}
  ]
 },
 fixtures:[fixture]
};
const buildScene=()=>createTerrariumSceneGeometryV03d({
 sceneId:'public_neutral_micro_life_preview',
 baseOptions:neutralSceneOptions,
 mounts:[{fixtureId:'led',x:500,y:200,height:800}],
 objects:[{id:'stone_01',kind:'rock_overhang',
  x:570,y:120,width:60,depth:160,height:500,
  transmissionPermille:0}]
});
let scene=buildScene(),preview=null,phase=0;
let paused=prefersReducedMotion,disturbance=false;
let clock=0,request=0;
const fmt=n=>new Intl.NumberFormat('zh-TW').format(n);
const rect=(x,y,w,h,color)=>{
 ctx.fillStyle=color;
 ctx.fillRect(Math.round(x),Math.round(y),
  Math.round(w),Math.round(h));
};
function write(textEl,parts){
 textEl.replaceChildren();
 for(const part of parts)textEl.append(part);
}
function addRow(parent,left,right,style=''){
 const line=document.createElement('div');
 line.className='row';
 const a=document.createElement('span');
 a.textContent=left;
 const b=document.createElement('span');
 b.textContent=right;
 b.className=style;
 line.append(a,b);parent.append(line);
}
const cueName=c=>{
 const names={
  litter_foraging:'落葉旁取食',
  under_shelter:'乾燥，隱蔽',
  seeking_cover:'尋找遮蔽',
  microbe_grazing:'攝食微生物',
  disturbance_jump:'受刺激而跳開',
  on_detritus:'腐植表面活動',
  filaments_near_organics:'菌絲與有機屑',
  possible_decomposition:'菌絲／分解可能活躍',
  not_visible:'未顯示活動',absent:'未設群落'
 };
 return names[c.state]??'未分類觀察';
};
function renderData(){
 const parts=[
  '測試時間：',String(preview.fromMinute/60),' → ',
  String(preview.toMinute/60),' 合成小時　',
  '五區有機物：',fmt(preview.sourceOrganicTotal),' → ',
  fmt(preview.afterSourceOrganicTotal),'　'
 ];
 summary.replaceChildren();
 const strong=document.createElement('strong');
 strong.textContent='守恆・不改玩家存檔';
 summary.append(document.createTextNode(parts.join('')),strong);
 zones.replaceChildren();
 const names=['乾燥邊緣','溫潤根區','缺乏有機物','落葉聚集區','蕨類潮濕區'];
 for(const z of preview.zones){
  const card=document.createElement('article');
  card.className='zone';
  const title=document.createElement('h3');
  title.textContent=(z.zoneIndex+1)+'. '+names[z.zoneIndex];
  card.append(title);
  const small=document.createElement('div');
  small.className='range';
  small.textContent='局部含水代理 '+Math.round(z.sourceMoisture*100)+'%　'
   +(z.photosyntheticPlantKind==='none'?'無植物':
     z.photosyntheticPlantKind==='moss'?'苔蘚・生產者':'蕨類・生產者');
  card.append(small);
  const states=document.createElement('div');
  states.className='states';
  for(const c of z.cues){
   const line=document.createElement('div');
   line.textContent=(c.id==='isopod'?'鼠婦':c.id==='springtail'?
    '跳蟲':'菌絲')+'：'+cueName(c);
   states.append(line);
  }
  card.append(states);
  addRow(card,'項目','原模型／候選','');
  const rows=[
   ['落葉','litterUnits'],['碎屑','fragmentedUnits'],
   ['處理後代理','processedProxyUnits']
  ];
  for(const [label,key] of rows){
   const line=document.createElement('div');
   line.className='row';
   const a=document.createElement('span');
   a.textContent=label;
   const b=document.createElement('span');
   const old=document.createElement('span');
   old.className='old';
   old.textContent=fmt(z.sourceAfterOldFormula[key]);
   const revised=document.createElement('span');
   revised.className='new';
   revised.textContent=fmt(z.alternativeAfterV03h[key]);
   b.append(old,document.createTextNode(' / '),revised);
   line.append(a,b);card.append(line);
  }
  const flow=document.createElement('div');
  flow.className='range';
  flow.textContent='替代模型：碎屑化 +'+
   fmt(z.alternativeFragmentationUnits)+
   '；微生物處理 +'+
   fmt(z.alternativeMicrobialProcessingUnits);
  card.append(flow);
  zones.append(card);
 }
}
function soilBackground(){
 rect(0,0,W,H,'#192c24');
 for(let i=0;i<5;i++){
  const z=preview.zones[i],x=i*zoneW;
  const light=Math.min(1,Math.max(0,z.sourceLightUnits/1500));
  const sky=light>.3?'#415640':'#283a33';
  rect(x,0,zoneW,104,sky);
  rect(x,102,zoneW,228,'#46382b');
  rect(x,122,zoneW,210,'#352c27');
  // Readable zone rows, not literal temperature/water mapping.
  for(let k=0;k<32;k++){
   const px=x+(k*67+i*17)%zoneW;
   const py=140+(k*31+i*19)%175;
   rect(px,py,3+(k%4),2,k%3===0?'#654d39':'#5b4535');
  }
  for(let j=0;j<Math.min(9,Math.floor(z.sourceCurrentOrganic.litterUnits/160));j++){
   const px=x+17+(j*29+i*31)%175,py=184+(j*23)%95;
   rect(px,py,14,3,j%2?'#c29358':'#a87340');
   rect(px+4,py-2,8,2,'#95714b');
  }
  if(z.photosyntheticPlantKind!=='none'&&z.sourceLightUnits>0){
   for(let j=0;j<4;j++){
    const px=x+33+j*46,py=111+(j%2)*12;
    rect(px,py,5,21,'#557a4a');
    rect(px-7,py+3,17,6,'#83a85b');
    rect(px+3,py-6,5,10,'#a3c77c');
   }
  }
  rect(x,103,zoneW,7,'#74533b');
  if(i>0)rect(x,0,2,H,'#d6bd8d');
  ctx.fillStyle='#f0e0bd';
  ctx.font='bold 16px system-ui';
  ctx.fillText('區域 '+(i+1),x+12,25);
  ctx.font='12px system-ui';
  ctx.fillText(z.sourceMoisture<.03?'乾燥／少活動':
   z.sourceCurrentOrganic.litterUnits===0?'無落葉投入':
    '局部生態活動提示',x+12,46);
 }
 // A neutral source-owned stone that really affects V0.3d light.
 for(const o of scene.objects){
  const sx=o.x/W*W,sw=o.width/W*W;
  const y=89;
  rect(sx,y,sw,34,'#625b4d');
  rect(sx+3,y+3,sw-6,7,'#898371');
 }
}
function drawIsopod(x,y){
 rect(x-10,y-3,22,8,'#342a25');
 rect(x-8,y-5,19,8,'#b58a65');
 for(let j=0;j<4;j++)rect(x-5+j*4,y-5,2,8,'#6b4935');
 rect(x+10,y-3,4,4,'#d0b18c');
 rect(x+14,y-7,2,4,'#cbab85');
 rect(x+16,y-6,2,3,'#cbab85');
 for(let j=0;j<5;j++)rect(x-8+j*4,y+5,2,3,'#78624b');
}
function drawSpringtail(x,y,jumped){
 rect(x-3,y-2,6,4,'#f5ebd2');
 rect(x-2,y-4,4,3,'#b7b19d');
 rect(x+3,y-2,2,2,'#f7e8c4');
 rect(x+4,y-5,2,3,'#f4f0d9');
 if(jumped){rect(x-1,y+3,5,2,'#d7d0b3')}
}
function drawMycelium(x,y,phaseN){
 // Branching and sparse: drawn as a filament CUE only.
 const len=10+(phaseN%3)*2;
 rect(x,y,2,len,'#b6cda4');
 rect(x-9,y+6,20,2,'#b6cda4');
 rect(x-12,y+3,4,2,'#d4e1c3');
 rect(x+9,y+9,8,2,'#d4e1c3');
 rect(x+4,y+2,2,7,'#d4e1c3');
 rect(x-4,y+12,3,3,'#d4e1c3');
}
function draw(){
 if(!preview?.ok)return;
 ctx.imageSmoothingEnabled=false;
 soilBackground();
 const frame=sampleTerrariumMicroActivityFrameV03j({
  preview,phase
 });
 if(!frame.ok)return;
 for(const m of frame.markers){
  const x=m.zoneIndex*zoneW+m.localX*zoneW;
  const y=142+m.localY*158;
  if(m.role==='isopod')drawIsopod(x,y);
  else if(m.role==='springtail')
   drawSpringtail(x,y,m.state==='disturbance_jump');
  else drawMycelium(x,y,phase);
 }
 rect(0,H-27,W,27,'#24362c');
 ctx.font='12px system-ui';ctx.fillStyle='#e1d1a7';
 ctx.fillText('開發用可見提示：鼠婦取食、跳蟲攝食或受刺激跳動、菌絲線索　｜　非個體位置與數量',16,H-9);
}
function prepare(){
 const result=previewTerrariumMicroActivityV03j({
  scene,minutes:60,
  bacteriaIndexesByZone:bacteria,
  observedDisturbance:disturbance,
  seed:7919
 });
 if(!result.ok){
  summary.textContent='無法建立生態預覽：'+result.reason;
  return;
 }
 preview=result;
 renderData();
 draw();
}
stepBtn.addEventListener('click',()=>{
 if(!preview?.ok)return;
 // Advance only the on-screen LOCAL development fixture's OLD
 // source candidate. Never write to cloud, localStorage or player.
 scene=preview.sourceSceneCandidate;
 phase=0;prepare();
});
disturbBtn.addEventListener('click',()=>{
 disturbance=!disturbance;
 disturbBtn.textContent='干擾測試：'+(disturbance?'開':'關');
 disturbBtn.setAttribute('aria-pressed',String(disturbance));
 phase=0;prepare();
});
pauseBtn.addEventListener('click',()=>{
 paused=!paused;
 pauseBtn.textContent=paused?'繼續動態':'暫停動態';
 pauseBtn.setAttribute('aria-pressed',String(paused));
 if(!paused)clock=0;
});
resetBtn.addEventListener('click',()=>{
 scene=buildScene();phase=0;disturbance=false;
 disturbBtn.textContent='干擾測試：關';
 disturbBtn.setAttribute('aria-pressed','false');
 prepare();
});
function animate(timestamp){
 request=window.requestAnimationFrame(animate);
 if(!preview?.ok||paused)return;
 if(!clock)clock=timestamp;
 if(timestamp-clock>=190){
  phase=(phase+1)%8;
  clock=timestamp;
  draw();
 }
}
pauseBtn.textContent=paused?'繼續動態':'暫停動態';
pauseBtn.setAttribute('aria-pressed',String(paused));
prepare();
request=window.requestAnimationFrame(animate);
// Explicitly public benign development QA readout for browser
// testing, never exposing actual player identities or saves.
window.__ohmEcoV03jQA=()=>Object.freeze({
 version:'0.3j',sourceMinute:scene.minute,
 previewOK:Boolean(preview?.ok),
 zoneCount:preview?.zoneCount??0,
 organicTotal:preview?.sourceOrganicTotal??null,
 framePhase:phase,disturbance,
 fullGameSaveWritten:false,debugOnly:true
});
