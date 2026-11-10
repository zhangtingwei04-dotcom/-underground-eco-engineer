import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { OHM_MODULE_CATALOG, OHM_MODULE_STAGES, validateOhmModuleCatalog,
         getOhmModules, summarizeOhmModules } from '../src/ohm-core/module-catalog.mjs';

let passes = 0;
function check(name, fn) {
  try { fn(); console.log('PASS ' + name); passes++; }
  catch (error) { console.error('FAIL ' + name); throw error; }
}
const variant = modify => {
  const modules = OHM_MODULE_CATALOG.modules.map(m => ({ ...m, tests: [...m.tests], integrationRefs: [...m.integrationRefs] }));
  modify(modules);
  return { schemaVersion: 1, modules };
};
check('catalog schema is valid', () => assert.deepEqual(validateOhmModuleCatalog(OHM_MODULE_CATALOG), {ok:true}));
check('catalog is pure metadata (no runtime flags)', () => assert.ok(OHM_MODULE_CATALOG.modules.every(m => !('autoLoad' in m))));
check('every referenced file exists in repository', () => {
  const root = new URL('../', import.meta.url);
  for (const m of OHM_MODULE_CATALOG.modules) {
    for (const p of [m.entry, ...m.tests, m.docs, ...m.integrationRefs].filter(Boolean)) {
      assert.ok(existsSync(new URL(p, root)), `${m.id} missing ${p}`);
    }
  }
});
check('catalog is not empty', () => assert.ok(OHM_MODULE_CATALOG.modules.length >= 4));
check('statuses count every module', () => assert.equal(Object.values(summarizeOhmModules()).reduce((a,b)=>a+b,0), OHM_MODULE_CATALOG.modules.length));
check('statuses have known distinct labels', () => assert.equal(new Set(OHM_MODULE_STAGES).size, OHM_MODULE_STAGES.length));
check('filters do not return unrelated modules', () => assert.ok(getOhmModules({stage:'research'}).every(m => m.stage === 'research')));
check('unknown filter returns no modules', () => assert.deepEqual(getOhmModules({stage:'released'}), []));
check('module ids must be unique', () => assert.equal(validateOhmModuleCatalog(variant(a => a.push({...a[0]}))).error, 'duplicate_module_id'));
check('path traversal must be rejected', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].entry='../secrets.js';})).error, 'invalid_entry'));
check('unknown status must be rejected', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].stage='ready';})).error, 'invalid_module_stage'));
check('tested module requires tests', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].stage='tested';a[0].tests=[];})).error, 'missing_tests'));
check('integrated module requires integration evidence', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].stage='integrated';})).error, 'missing_integration_evidence'));
check('prototype must point at source', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].entry=null;})).error, 'missing_entry'));
check('runtime flags cannot be smuggled in', () => assert.equal(validateOhmModuleCatalog(variant(a => {a[0].autoLoad=true;})).error, 'runtime_flags_not_allowed'));
console.log(`${passes} Project OHM catalog checks passed`);