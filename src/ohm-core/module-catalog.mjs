/**
 * Project OHM module catalog v0.1.
 * This module only describes research/prototype/integration status.
 * It does not import, initialize, or execute any game or third-party module.
 * Pure JavaScript; safe to consume from Node and a static browser page.
 */
export const OHM_CATALOG_VERSION = 1;
export const OHM_MODULE_STAGES = Object.freeze([
  'research', 'prototype', 'tested', 'integrated'
]);

const idPattern = /^[a-z][a-z0-9-]{1,63}$/;
const sourcePattern = /^src\/(?:ohm-core|ohm-platform|ohm-engine)\/[a-z0-9/_-]+\.(?:mjs|js)$/;
const testPattern = /^tests\/[a-z0-9/_-]+\.test\.mjs$/;
const docPattern = /^docs\/[a-z0-9/_-]+\.md$/i;
const kinds = new Set(['core', 'platform', 'engine']);
const stages = new Set(OHM_MODULE_STAGES);
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const failure = (error, index = null) => ({ ok: false, error, index });

export function validateOhmModuleCatalog(catalog) {
  if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) return failure('invalid_catalog');
  if (catalog.schemaVersion !== OHM_CATALOG_VERSION) return failure('unsupported_schema');
  if (!Array.isArray(catalog.modules) || catalog.modules.length > 128) return failure('invalid_module_list');
  const seen = new Set();
  for (let i = 0; i < catalog.modules.length; i++) {
    const m = catalog.modules[i];
    if (!m || typeof m !== 'object' || Array.isArray(m)) return failure('invalid_module', i);
    if (typeof m.id !== 'string' || !idPattern.test(m.id)) return failure('invalid_module_id', i);
    if (seen.has(m.id)) return failure('duplicate_module_id', i);
    seen.add(m.id);
    if (typeof m.name !== 'string' || !m.name.trim() || m.name.length > 90) return failure('invalid_module_name', i);
    if (!kinds.has(m.kind)) return failure('invalid_module_kind', i);
    if (!stages.has(m.stage)) return failure('invalid_module_stage', i);
    if (m.entry !== null && (typeof m.entry !== 'string' || !sourcePattern.test(m.entry))) return failure('invalid_entry', i);
    if (m.stage !== 'research' && m.entry === null) return failure('missing_entry', i);
    if (!Array.isArray(m.tests) || m.tests.some(p => typeof p !== 'string' || !testPattern.test(p)) ||
        new Set(m.tests).size !== m.tests.length) return failure('invalid_tests', i);
    if ((m.stage === 'tested' || m.stage === 'integrated') && m.tests.length === 0) return failure('missing_tests', i);
    if (typeof m.docs !== 'string' || !docPattern.test(m.docs)) return failure('invalid_docs', i);
    if (!Array.isArray(m.integrationRefs) ||
        m.integrationRefs.some(p => typeof p !== 'string' || !/^(?:src|tests)\/[a-z0-9/_-]+\.(?:mjs|js)$/.test(p)) ||
        new Set(m.integrationRefs).size !== m.integrationRefs.length) return failure('invalid_integration_refs', i);
    if (m.stage === 'integrated' && m.integrationRefs.length === 0) return failure('missing_integration_evidence', i);
    if (typeof m.summary !== 'string' || !m.summary.trim() || m.summary.length > 240) return failure('invalid_summary', i);
    if (own(m, 'enabled') || own(m, 'autoLoad')) return failure('runtime_flags_not_allowed', i);
  }
  return { ok: true };
}

const item = (id, name, kind, stage, entry, tests, docs, summary, integrationRefs = []) => Object.freeze({
  id, name, kind, stage, entry, tests: Object.freeze([...tests]), docs, summary,
  integrationRefs: Object.freeze([...integrationRefs])
});

/** Statuses are conservative: a test FILE existing is not proof of a green CI run. */
export const OHM_MODULE_CATALOG = Object.freeze({
  schemaVersion: OHM_CATALOG_VERSION,
  modules: Object.freeze([
    item('world-rules', '世界狀態與指令', 'core', 'prototype',
      'src/ohm-core/world.mjs', ['tests/ohm-core.test.mjs'],
      'docs/OHM_CORE_ARCHITECTURE_SECURITY_BASELINE.md',
      '純 JavaScript 世界狀態；已有程式及測試檔，正式 Phaser 整合仍待驗證。'),
    item('scene-navigation', '場景註冊與導覽', 'core', 'prototype',
      'src/ohm-core/scene-registry.mjs', ['tests/scene-registry.test.mjs'],
      'docs/OHM_CORE_SCENE_REGISTRY_V02.md',
      '獨立場景圖與出口驗證；目前屬示範用地圖而非完整歐姆世界。'),
    item('reptile-motion', '爬蟲動態能力規約', 'core', 'prototype',
      'src/ohm-core/reptile-motion.mjs', ['tests/reptile-motion.test.mjs'],
      'docs/OHM_CORE_REPTILE_MOTION_FOUNDATION_V01.md',
      '動作狀態與轉移驗證；不能視為真實物種行為動畫已全部完成。'),
    item('offline-catchup', '離線時間結算', 'core', 'prototype',
      'src/ohm-core/offline-catch-up.mjs', ['tests/offline-catch-up.test.mjs'],
      'docs/OHM_OFFLINE_TIME_POLICY.md',
      '離線計算的獨立規則切片；正式跨裝置時間與資料安全仍待整合。'),
    item('cable-train-motion', '多節纜車運動骨架', 'engine', 'research', null, [],
      'docs/research/transport/CABLE_TRAIN_MOTION_RESEARCH_INDEX_V01.md',
      'S02-B v09 候選：同一路徑的車廂、連續吊掛、轉向和真實車窗視差，尚未實作。'),
    item('ohm-renderer', '歐姆自有渲染器', 'engine', 'research', null, [],
      'docs/project-ohm/README.md',
      '長期候選，現階段仍以 Phaser 負責正式畫面，不提前替換。')
  ])
});

export function getOhmModules({ stage = null, kind = null } = {}) {
  if (stage !== null && !stages.has(stage)) return [];
  if (kind !== null && !kinds.has(kind)) return [];
  return OHM_MODULE_CATALOG.modules.filter(m =>
    (stage === null || m.stage === stage) && (kind === null || m.kind === kind));
}

export function summarizeOhmModules() {
  return Object.freeze(Object.fromEntries(OHM_MODULE_STAGES.map(stage =>
    [stage, getOhmModules({ stage }).length])));
}