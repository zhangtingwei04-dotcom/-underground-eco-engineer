import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(
 new URL('../visual/warmvein-v10b-test.html',import.meta.url),'utf8');
const source=readFileSync(
 new URL('../visual/warmvein-v10b-test.mjs',import.meta.url),'utf8');
assert.match(html,/<button id="capture" type="button">/);
assert.match(html,/儲存目前真 WebGL2 畫面 PNG/);
assert.match(html,/本頁已公開的貼圖只在瀏覽器本機進行截圖處理/);
assert.match(source,/import \{inspectWarmveinGPUCaptureV10v\}/);
assert.match(source,/captureEl=document.getElementById\('capture'\)/);
assert.match(source,/function captureVisibleWebGLV10v\(\)/);
assert.match(source,/captureEl.addEventListener\('click',captureVisibleWebGLV10v\)/);
const fn=source.slice(
 source.indexOf('function captureVisibleWebGLV10v(){'),
 source.indexOf("captureEl.addEventListener('click',captureVisibleWebGLV10v);")
);
assert.ok(fn.length>800);
assert.match(fn,/stop\(\);\s*render\(\);/);
assert.match(fn,/gl\.readPixels\(0,0,canvas\.width,canvas\.height,/);
assert.match(fn,/gl\.RGBA,gl\.UNSIGNED_BYTE,rgba/);
assert.match(fn,/gl\.getError\(\)/);
assert.match(fn,/inspectWarmveinGPUCaptureV10v\(\{/);
assert.match(fn,/split:sameFrameSplit\(\),qtCompare:skinCompareMode\(\)/);
assert.match(fn,/if\(!audit\.ok\)/);
assert.match(fn,/ctx\.drawImage\(canvas,0,66\)/);
assert.match(fn,/ctx\.fillText\('左｜原版 V1\.0Q'/);
assert.match(fn,/ctx\.fillText\('右｜修正 V1\.0T'/);
assert.match(fn,/link\.download='warmvein-v10v-'/);
assert.match(fn,/link\.click\(\)/);
assert.doesNotMatch(fn,/fetch\(/);
assert.doesNotMatch(fn,/XMLHttpRequest/);
assert.doesNotMatch(fn,/setItem\(/);
assert.doesNotMatch(fn,/advanceSnakeVariableSizeMotionV09t\(/);
assert.match(source,/v10vSnapshotLocalOnly:true/);
assert.match(source,/v10vNoSourceTimeAdvanceDuringCapture:true/);
assert.match(source,/blinkFeatureEnabled:false/);
assert.match(source,/gameSaveWritten:false/);
console.log('PASS V1.0V browser capture hookup: readPixels from real same-frame GPU, stop/resume safe; no network, no state advance or saves');
