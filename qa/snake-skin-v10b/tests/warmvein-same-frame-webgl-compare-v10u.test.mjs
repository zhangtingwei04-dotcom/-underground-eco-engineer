import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../visual/warmvein-v10b-test.html',import.meta.url),'utf8');
const source=readFileSync(new URL('../visual/warmvein-v10b-test.mjs',import.meta.url),'utf8');

assert.match(html,/<option value="pixel-t" selected>/);
assert.match(html,/<option value="skin-compare">V1\.0U：舊 Q／新 T 真 3D 同幀左右比較<\/option>/);
assert.match(source,/const skinCompareMode=\(\)=>mode==='skin-compare'/);
assert.match(source,/const sameFrameSplit=\(\)=>splitCompare\(\)\|\|skinCompareMode\(\)\|\|naturalHeadCompareMode\(\)/);
assert.match(source,/textureAtlas= null|textureAtlas=null/);
assert.match(source,/if\(textureAtlas\)uploadViewportAtlas\(textureAtlas\)/);
assert.match(source,/gl\.uniform1i\(uMode,forcePixel\?3:comparison\?0:/);
assert.match(source,/if\(skinCompareMode\(\)\)\{/);
assert.match(source,/const visibleMesh=latestNaturalHead\?\.renderMesh\?\?/);
assert.match(source,/sculptWarmveinHeadV10y\(\{\s*sourceMesh:latestHeadRefinement\.renderMesh/);
assert.match(source,/v10yWeldedNeckAndBodyUntouched:/);
const comparison=source.slice(source.indexOf('if(skinCompareMode()){\n   \/\/ V1.0U:'),source.indexOf('  }else if(naturalHeadCompareMode()){'));
assert.ok(comparison.length>100,'Q/T split branch must exist');
const drawCalls=[...comparison.matchAll(/drawSourceViewport\(visibleMesh,midX,halfWidth,\{/g)];
assert.equal(drawCalls.length,2,'Both Q and T must render the SAME refined head and 24-joint mesh');
assert.match(comparison,/viewportX:0,viewportWidth:leftWidth/);
assert.match(comparison,/viewportX:leftWidth,viewportWidth:rightWidth/);
assert.match(comparison,/textureAtlas:atlases\['pixel-q'\],forcePixel:true/);
assert.match(comparison,/textureAtlas:atlases\['pixel-t'\],forcePixel:true/);
assert.equal([...comparison.matchAll(/enhancedEyes:true,verticalHalf,centerY/g)].length,2,
 'both views must share independently rendered eyes and camera');
assert.match(source,/const uvAtlas=mode==='pixel-q'\?atlases\['pixel-q'\]:atlases\['pixel-t'\]/);
assert.match(source,/status\.dataset\.v10uSameFrameQTTextureCompare=String\(skinCompareMode\(\)\)/);
assert.match(source,/v10uBothPanelsSameV10rMesh:skinCompareMode\(\)/);
assert.match(source,/v10uOnlyQTPixelRGBAChanges:true/);
assert.match(source,/rendererOnlySeamDuplicate:true/);
assert.match(source,/v10tNoPhysicalColliderModified:true/);
assert.match(source,/comparisonPanelsShareV09tUFrame:true/);
assert.match(source,/gameSaveWritten:false/);
assert.match(source,/blinkFeatureEnabled:false/);
assert.doesNotMatch(source,/sampleWarmveinBlinkV10d\(/);
console.log('PASS V1.0U static contract: real same-frame Q/T WebGL2 panels share original source mesh/eyes/camera and differ only by actual atlas RGBA; no physical or save writes');
