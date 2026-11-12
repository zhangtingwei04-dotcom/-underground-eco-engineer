/**
 * Offline V0.3g pixel silhouette and mobile zone lab. All ecology remains bundled from
 * nine canonical OHM modules. V0.3c is historical and never stacked twice.
 * Usage: node tools/build-terrarium-pixel-sprites-v03g-lab.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const files=[
 'src/ohm-core/terrarium-microclimate-v01.mjs',
 'src/ohm-core/terrarium-substrate-water-v02.mjs',
 'src/ohm-core/terrarium-ecology-coupled-v02b.mjs',
 'src/ohm-core/terrarium-biota-v03a.mjs',
 'src/ohm-core/terrarium-ecology-light-v03b.mjs',
 'src/ohm-core/terrarium-scene-geometry-v03d.mjs',
 'src/ohm-core/terrarium-scene-render-projection-v03e.mjs',
 'src/ohm-core/terrarium-pixel-visual-v03f.mjs',
 'src/ohm-core/terrarium-pixel-sprites-v03g.mjs'
];
const api=[
 ['createTerrariumMicroclimate','isValidTerrariumMicroclimate',
  'advanceTerrariumMicroclimate','changeTerrariumMicroclimateControls',
  'projectTerrariumMicroclimateSoilMoisture',
  'inspectTerrariumMicroclimate','buildTerrariumMicroclimateActionSnapshot'],
 ['createTerrariumSubstrateWater','isValidTerrariumSubstrateWater',
  'advanceTerrariumSubstrateWater','applyTerrariumSubstrateWaterEvent',
  'inspectTerrariumSubstrateWater'],
 ['createCoupledTerrariumEcology','isValidCoupledTerrariumEcology',
  'advanceCoupledTerrariumEcology','applyCoupledTerrariumEcologyEvent',
  'inspectCoupledTerrariumEcology','buildCoupledTerrariumEcologyActionSnapshot'],
 ['createTerrariumBiotaV03','isValidTerrariumBiotaV03',
  'advanceTerrariumBiotaV03','applyTerrariumBiotaV03Event',
  'inspectTerrariumBiotaV03','buildTerrariumBiotaV03ActionSnapshot'],
 ['createTerrariumEcologyLightV03b','isValidTerrariumEcologyLightV03b',
  'advanceTerrariumEcologyLightV03b','applyTerrariumEcologyLightV03bEvent',
  'setTerrariumEcologyLightTransmissionV03b',
  'inspectTerrariumEcologyLightV03b',
  'buildTerrariumEcologyLightV03bActionSnapshot'],
 ['createTerrariumSceneGeometryV03d','isValidTerrariumSceneGeometryV03d',
  'advanceTerrariumSceneGeometryV03d','applyTerrariumSceneGeometryV03dEvent',
  'calculateTerrariumGeometryTransmissionV03d',
  'inspectTerrariumSceneGeometryV03d',
  'buildTerrariumSceneGeometryV03dActionSnapshot'],
 ['createTerrariumRenderCameraV03e','isValidTerrariumRenderCameraV03e',
  'projectTerrariumWorldPointV03e','projectTerrariumSceneForRenderV03e',
  'terrariumScreenDeltaToWorldV03e','terrariumScreenPointToGroundV03e',
  'hitTestTerrariumRenderV03e','moveTerrariumSceneObjectByScreenDeltaV03e',
  'moveTerrariumLightByScreenDeltaV03e'],
 ['buildTerrariumPixelVisualV03f',
  'listTerrariumTouchTargetsV03f',
  'resolveTerrariumTouchSelectionV03f'],
 ['buildTerrariumPixelSpritesV03g']
];
function embed(src,i){
 if(src.includes('</script'))throw Error('Unexpected script terminator in JS source');
 let body=src,imported=[];
 const rx=i===2?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-(?:microclimate-v01|substrate-water-v02)\.mjs)';\s*/gm:
 i===3?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-ecology-coupled-v02b\.mjs)';\s*/gm:
 i===4?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-biota-v03a\.mjs)';\s*/gm:
 i===5?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-ecology-light-v03b\.mjs)';\s*/gm:
 i===6?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-scene-geometry-v03d\.mjs)';\s*/gm:
 i===7?
  /^import\s*\{[\s\S]*?\}\s*from\s*'(\.\/terrarium-scene-render-projection-v03e\.mjs)';\s*/gm:null;
 if(rx)body=body.replace(rx,(_,name)=>{imported.push(name);return '';});
 if(imported.length!==[0,0,2,1,1,1,1,1,0][i]||
    (i===2&&new Set(imported).size!==2))
  throw Error('Canonical module import dependencies changed at index '+i);
 if(/^\s*(?:import|export\s+\{)/m.test(body))
  throw Error('Unexpected import/re-export in module '+files[i]);
 for(const fn of api[i]){
  if(!new RegExp('\\bexport\\s+function\\s+'+fn+'\\b').test(body))
   throw Error('Canonical function missing: '+fn);
 }
 body=body.replace(/^export\s+(?=(?:function|const|class)\b)/gm,'');
 if(/^\s*(?:import|export)\b/m.test(body))
  throw Error('Unconverted JS source '+files[i]);
 return 'const {'+api[i].join(',')+'}=(function(){\n'+body+
  '\nreturn {'+api[i].join(',')+'};\n})();\n';
}
const marker='/*__OHM_V03G_CORE_BUNDLE__*/';
const template=read('tools/terrarium-pixel-sprites-v03g-lab.template.html');
if(template.split(marker).length!==2)throw Error('Missing or duplicate HTML marker');
const html=template.replace(marker,
 '// Nine canonical OHM modules: fixed ecology, 2.5D world, pixel silhouettes.\n'+
 files.map((file,i)=>embed(read(file),i)).join('\n'));
const target=path.join(root,'terrarium-pixel-sprites-v03g-lab.html');
if(process.argv.includes('--check')){
 if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==html){
  process.stderr.write('V0.3g mobile pixel lab is out of date\n');
  process.exitCode=1;
 }else process.stdout.write('PASS V0.3g mobile pixel lab equals nine canonical modules\n');
}else if(process.argv.length>2)throw Error('Unsupported argument');
else{
 fs.writeFileSync(target,html);
 process.stdout.write('Generated V0.3g pixel silhouette habitat lab\n');
}
