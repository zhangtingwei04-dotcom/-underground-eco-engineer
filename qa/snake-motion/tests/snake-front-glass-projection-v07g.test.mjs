import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createTerrariumSceneGeometryV03d}
 from '../src/ohm-core/terrarium-scene-geometry-v03d.mjs';
import {
 createSnakeTravelRouteV07,createSnakeTravelStateV07,
 advanceSnakeTravelStateV07
} from '../src/ohm-core/snake-path-history-v07.mjs';
import {sampleSnakeGroundNeckV07d}
 from '../src/ohm-core/snake-terrain-neck-v07d.mjs';
import {advanceSnakeNeckTemporalV07f}
 from '../src/ohm-core/snake-neck-temporal-v07f.mjs';
import {
 FRONT_GLASS_CAMERA_V07G,SNAKE_FRONT_GLASS_PROJECTION_VERSION,
 projectSnakeFrontGlassPointV07g,projectTransparentSnakeV07g,
 createFrontGlassQADiagnosticsV07g
} from '../src/ohm-core/snake-front-glass-projection-v07g.mjs';

const scene=createTerrariumSceneGeometryV03d({
 sceneId:'visual_qa_v07g',objects:[
  {id:'left_stone_01',kind:'rock_overhang',x:42,y:32,
   width:134,depth:76,height:230,transmissionPermille:0},
  {id:'rear_stone_02',kind:'rock_overhang',x:390,y:10,
   width:108,depth:70,height:190,transmissionPermille:0},
  {id:'right_stone_03',kind:'rock_overhang',x:836,y:30,
   width:105,depth:80,height:245,transmissionPermille:0}
 ]
});
const route=createSnakeTravelRouteV07([
 {x:-1.15,y:.23},{x:-.35,y:.22},{x:.45,y:.07},
 {x:1.15,y:-.13},{x:1.85,y:-.16},{x:2.35,y:.10},
 {x:2.60,y:.32}
]);
const body={length:2.5,boneCount:24,bodyRadius:.15};
const terrain={groundZ:0,rock:null,perch:null};
assert.equal(SNAKE_FRONT_GLASS_PROJECTION_VERSION,'0.7G');
assert.equal(FRONT_GLASS_CAMERA_V07G.view,'front_glass_horizontal_2_5d');
assert.equal(FRONT_GLASS_CAMERA_V07G.width,1440);
assert.equal(FRONT_GLASS_CAMERA_V07G.height,810);
assert.ok(FRONT_GLASS_CAMERA_V07G.right-FRONT_GLASS_CAMERA_V07G.left>1250);
const p=(x,y,z)=>projectSnakeFrontGlassPointV07g({x,y,z});
assert.equal(p(0,0,0).x,720);
assert.equal(p(0,0,0).y,
 (FRONT_GLASS_CAMERA_V07G.rearFloorY+
 FRONT_GLASS_CAMERA_V07G.frontFloorY)/2);
assert.ok(p(-1,0,0).x<p(0,0,0).x);
assert.ok(p(1,0,0).x>p(0,0,0).x);
assert.ok(p(0,-1,0).y<p(0,1,0).y,
 'back/far ground is projected higher than front floor');
assert.ok(p(0,0,.3).y<p(0,0,0).y,
 'raising actual snake Z raises visible body, not moving right/left');
assert.equal(p(0,0,.3).x,p(0,0,0).x);
assert.ok(p(0,0,.3).y>400);
assert.equal(p(-4,0,0).x,FRONT_GLASS_CAMERA_V07G.left);
assert.equal(p(4,0,0).x,FRONT_GLASS_CAMERA_V07G.right);

const raw=JSON.stringify(scene);
let s=createSnakeTravelStateV07(route,{speed:.24,distance:0});
let temporal=null,lastYaw=null,lastFrame=null,accepted=0,paused=0;
let maxDx=0;
for(let i=0;i<260;i++){
 const isResting=i>=113&&i<134;
 s=advanceSnakeTravelStateV07(s,{
  seconds:1/30,moving:!isResting
 });
 const ground=sampleSnakeGroundNeckV07d({
  state:s,scene,body,terrain,speciesId:'hognose_snake',
  previousYaw:lastYaw,seconds:1/30
 });
 assert.equal(ground.ok,true,'V0.7D ground frame '+i);
 lastYaw=ground.neck.yaw;
 const smoothed=advanceSnakeNeckTemporalV07f({
  groundFrame:ground,scene,terrain,previousState:temporal,
  seconds:1/30,speciesId:'hognose_snake'
 });
 assert.equal(smoothed.renderable,true,
  'no unrenderable missing neck frame in chosen wide tank demo '+i);
 temporal=smoothed.nextState;
 const image=projectTransparentSnakeV07g({
  pose:smoothed.pose,head:smoothed.head,scene
 });
 assert.equal(image.camera,'fixed_front_glass_not_top_down');
 assert.equal(image.skinApplied,false);
 assert.equal(image.spine.length,body.boneCount);
 assert.equal(image.connectors.length,body.boneCount-1);
 assert.equal(image.radii.length,body.boneCount);
 assert.ok(image.headRibs.length>=60);
 assert.equal(image.headMesh.length,smoothed.head.meshPositions.length);
 assert.ok(image.radii[0]>image.radii.at(-1)*4,
  'transparent tapered outline should distinguish snake head from tail');
 assert.equal(image.sourceSceneRevision,scene.revision);
 assert.ok(Object.isFrozen(image));
 const qa=createFrontGlassQADiagnosticsV07g({
  frame:image,previous:lastFrame,maximumScreenJump:28
 });
 assert.equal(qa.ok,true,'all visible joints must project safely '+i);
 assert.equal(qa.withinGlassBounds,true);
 assert.equal(qa.stillTransparent,true);
 maxDx=Math.max(maxDx,qa.maxJointScreenDeltaPx);
 if(isResting&&lastFrame) {
  assert.deepEqual(image.spine,lastFrame.spine,
   'inactivity must keep entire skeleton position stable');
  paused++;
 }
 lastFrame=image;
 accepted++;
}
assert.equal(accepted,260);
assert.equal(paused,21);
assert.ok(maxDx<25,'no teleporting head or joints across rendered frames');
assert.equal(JSON.stringify(scene),raw,'visual preview must not rewrite ecosystem');

const ground=sampleSnakeGroundNeckV07d({
 state:s,scene,body,terrain,speciesId:'hognose_snake'
});
const post=advanceSnakeNeckTemporalV07f({
 groundFrame:ground,scene,terrain,speciesId:'hognose_snake'
});
assert.equal(post.renderable,true);
const frame=projectTransparentSnakeV07g({
 pose:post.pose,head:post.head,scene
});
assert.equal(createFrontGlassQADiagnosticsV07g({
 frame,previous:frame,maximumScreenJump:1
}).ok,true);
const fake={...frame,skinApplied:true};
assert.equal(createFrontGlassQADiagnosticsV07g({
 frame:fake
}).ok,false,'preview QA must reject a sneaked-in final skin');
assert.equal(createFrontGlassQADiagnosticsV07g({
 frame:{...frame,spine:frame.spine.map((v,i)=>i===3?
   {...v,x:v.x+80}:v)},
 previous:frame,maximumScreenJump:28
}).ok,false,'single-joint visual teleport must fail');
for(const fn of [
 ()=>projectSnakeFrontGlassPointV07g({x:NaN,y:0,z:0}),
 ()=>projectSnakeFrontGlassPointV07g({x:4.5,y:0,z:0}),
 ()=>projectSnakeFrontGlassPointV07g({x:0,y:2,z:0}),
 ()=>projectSnakeFrontGlassPointV07g({x:0,y:0,z:Infinity}),
 ()=>projectTransparentSnakeV07g({pose:null,head:post.head,scene}),
 ()=>projectTransparentSnakeV07g({pose:post.pose,head:null,scene}),
 ()=>projectTransparentSnakeV07g({pose:post.pose,head:post.head,scene:null}),
 ()=>createFrontGlassQADiagnosticsV07g({
  frame,previous:{...frame,spine:frame.spine.slice(1)}}),
 ()=>createFrontGlassQADiagnosticsV07g({frame,maximumScreenJump:0})
])assert.throws(fn,RangeError);

const source=readFileSync(new URL(
 '../src/ohm-core/snake-front-glass-projection-v07g.mjs',import.meta.url),'utf8');
const html=readFileSync(new URL('../snake-transparent-v07g-lab.html',import.meta.url),'utf8');
assert.match(html,/<canvas id="stage" width="1440" height="810"/);
assert.match(html,/透明骨架/);
assert.match(html,/projectTransparentSnakeV07g/);
assert.match(html,/createFrontGlassQADiagnosticsV07g/);
assert.match(html,/snakeMode/);
assert.match(html,/noindex,nofollow/);
assert.doesNotMatch(source,/Math\.random\s*\(|localStorage\b|fetch\s*\(|indexedDB\b/);
assert.doesNotMatch(source,/skinTexture|applySkin|generateTexture|scalePattern/,
 'debug camera must not secretly apply an invented snake skin');
console.log('PASS SNAKE V0.7G: 260 canonical hognose frames, 21 verified rest frames, no top-down, 1440x810 front glass camera, transparent head/neck/tail projection and 0 unsafe jumps; peak '+maxDx+'px.');
