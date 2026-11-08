import assert from 'node:assert/strict';
import {generateSnakePose} from '../src/ohm-core/corn-snake-motion.mjs';
import {sampleCornSnakeActivityV06,applyCornSnakeGestureV06} from '../src/ohm-core/corn-snake-activity-v06.mjs';
import {CORN_FOLIAGE_V06,foliageOcclusionV06} from '../src/ohm-core/corn-snake-occlusion-v06.mjs';
const sample=()=>Array.from({length:65},(_,i)=>({x:.12+i*.01,y:.80,s:i/64}));
assert.deepEqual(foliageOcclusionV06(sample()),foliageOcclusionV06(sample()),'deterministic screen-space occlusion');
assert.ok(foliageOcclusionV06(sample()).partialCover,'head clear, torso behind foliage');
assert.equal(foliageOcclusionV06(sample().map(p=>({...p,y:.70}))).partialCover,false,'outside foliage is clear');
assert.throws(()=>foliageOcclusionV06([]),TypeError);
let found=false;
for(let t=0;t<600;t+=.25){
 const a=sampleCornSnakeActivityV06(t,{seed:1049});
 const pose=applyCornSnakeGestureV06(generateSnakePose(a.motionTime),a);
 const result=foliageOcclusionV06(pose);
 if(result.partialCover){found=true;break;}
}
assert.ok(found,'default individual can preview head-exposed partial-body occlusion');
assert.ok(CORN_FOLIAGE_V06.left<CORN_FOLIAGE_V06.right);
console.log('PASS v0.6 static foliage layering and preview search');
