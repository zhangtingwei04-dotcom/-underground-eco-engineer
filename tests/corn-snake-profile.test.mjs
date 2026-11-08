import {CORN_SNAKE_SPECIES_ID,CORN_SNAKE_MORPH_REFERENCES,createCornSnakeAppearance,validateCornSnakeAppearance} from '../src/ohm-core/corn-snake-profile.mjs';
const results=[];
function test(name,condition){results.push([name,!!condition]);console.log((condition?'PASS ':'FAIL ')+name);}
const a=createCornSnakeAppearance({individualId:'corn-1',morphId:'stripe',patternSeed:123});
test('snake species ID',CORN_SNAKE_SPECIES_ID==='pantherophis-guttatus');
test('separate color and pattern references',CORN_SNAKE_MORPH_REFERENCES.some(x=>x.id==='motley')&&CORN_SNAKE_MORPH_REFERENCES.some(x=>x.id==='amelanistic'));
test('creates appearance descriptor',a.ok&&a.appearance.referenceMorphId==='stripe'&&a.appearance.patternSeed===123);
test('can reload same descriptor',validateCornSnakeAppearance(JSON.parse(JSON.stringify(a.appearance))).ok);
test('seeds stable without random calls',JSON.stringify(a)===JSON.stringify(createCornSnakeAppearance({individualId:'corn-1',morphId:'stripe',patternSeed:123})));
test('reject unknown morph',!createCornSnakeAppearance({morphId:'fantasy-rainbow'}).ok);
test('reject invalid seed',!createCornSnakeAppearance({patternSeed:-1}).ok);
test('reject mutated species',!validateCornSnakeAppearance({...a.appearance,speciesId:'other'}).ok);
test('reject unverified claimed genetics',!validateCornSnakeAppearance({...a.appearance,geneticsVerified:true}).ok);
if(results.some(x=>!x[1]))process.exitCode=1;
