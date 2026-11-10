/**
 * Scales & Seeds — guest-only, origin-to-origin transfer, v1.
 * This module only accesses explicit game save keys. NEVER export localStorage wholesale:
 * Supabase auth keys, login modes, cloud user IDs and other site data are not transferable.
 */
export const TRANSFER_FORMAT = 'scales-seeds-guest-origin-transfer-v1';
export const TRANSFER_MAX_BYTES = 2 * 1024 * 1024;
export const GUEST_SAVE_KEY = 'scales_seeds_save_v2';
export const TERRARIUM_SAVE_KEY = 'underground_eco_engineer_saves';
export const STAGING_KEY = 'scales_seeds_guest_transfer_pending_v1';
const denyKeys = new Set(['__proto__', 'prototype', 'constructor']);
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const bytes = value => new TextEncoder().encode(value).length;

function scan(value, depth = 0) {
    if (depth > 48) throw new Error('資料巢狀層數超過安全限制');
    if (value === null || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
        if (denyKeys.has(key)) throw new Error('存檔包含不安全欄位');
        scan(child, depth + 1);
    }
}

function safeParse(text, label) {
    if (typeof text !== 'string' || bytes(text) > TRANSFER_MAX_BYTES)
        throw new Error(`${label} 太大或不是文字資料`);
    let parsed;
    try { parsed = JSON.parse(text); }
    catch { throw new Error(`${label} 不是有效 JSON`); }
    if (!isObject(parsed)) throw new Error(`${label} 不是有效存檔物件`);
    scan(parsed);
    return parsed;
}

function describe(data) {
    return {
        hasGuestSave: data.guestSave !== null,
        hasTerrariumSave: data.terrariumSave !== null,
        guestSaveVersion: data.guestSave?.saveVersion ?? null,
        terrariumCount: Array.isArray(data.terrariumSave?.terrariums)
            ? data.terrariumSave.terrariums.length
            : (Array.isArray(data.guestSave?.terrariums) ? data.guestSave.terrariums.length : 0),
        guestUpdatedAt: data.guestSave?.updatedAt ?? null
    };
}

export function exportGuestTransfer(storage, now = new Date()) {
    const read = (key, label) => {
        const raw = storage.getItem(key);
        return raw === null ? null : safeParse(raw, label);
    };
    const data = {
        guestSave: read(GUEST_SAVE_KEY, '訪客存檔'),
        terrariumSave: read(TERRARIUM_SAVE_KEY, '舊生態箱資料')
    };
    if (!data.guestSave && !data.terrariumSave)
        throw new Error('這個網站目前沒有找到可匯出的訪客或舊生態箱存檔');
    if (data.guestSave?.isGuestData === false)
        throw new Error('找到的不是訪客資料，禁止用此工具轉移帳號存檔');

    const timestamp = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
    const payload = { format: TRANSFER_FORMAT, schemaVersion: 1, exportedAt: timestamp, data };
    const text = JSON.stringify(payload);
    if (bytes(text) > TRANSFER_MAX_BYTES)
        throw new Error('備份超過 2 MiB，請使用完整備份工具，這次未修改資料');
    return { text, preview: describe(data) };
}

export function inspectGuestTransfer(text) {
    if (typeof text !== 'string' || bytes(text) > TRANSFER_MAX_BYTES)
        throw new Error('備份檔超過 2 MiB 或不是有效文字');
    const value = safeParse(text, '備份檔');
    if (value.format !== TRANSFER_FORMAT || value.schemaVersion !== 1 ||
        !isObject(value.data))
        throw new Error('不是受支援的《鱗片與種子》跨網站訪客備份');
    const data = value.data;
    if (Object.keys(data).some(key => !['guestSave', 'terrariumSave'].includes(key)))
        throw new Error('備份包含未支援的資料種類');
    const guestSave = data.guestSave ?? null;
    const terrariumSave = data.terrariumSave ?? null;
    if (!guestSave && !terrariumSave)
        throw new Error('備份沒有任何遊戲存檔');
    if (guestSave !== null && !isObject(guestSave))
        throw new Error('訪客存檔格式錯誤');
    if (terrariumSave !== null && !isObject(terrariumSave))
        throw new Error('生態箱存檔格式錯誤');
    if (guestSave?.isGuestData === false)
        throw new Error('不能將帳號存檔匯入訪客儲存區');
    scan(value);
    return { payload: value, preview: describe({ guestSave, terrariumSave }) };
}

function validateActivation(data) {
    if (data.guestSave !== null) {
        const save = data.guestSave;
        if (save.saveVersion !== 2 ||
            (save.version !== undefined && (typeof save.version !== 'string' || !/^2\./.test(save.version))) ||
            !isObject(save.player) || !Array.isArray(save.terrariums) || !isObject(save.inventory))
            throw new Error('這份訪客存檔不是受支援的 V2 格式；已保留備份，但不會啟用');
    }
    if (data.terrariumSave !== null) {
        const old = data.terrariumSave;
        if (old.version !== 1 || !Array.isArray(old.terrariums))
            throw new Error('舊生態箱資料格式不符合 V1，已保留備份但不啟用');
    }
}

export function stageGuestTransfer(storage, text) {
    const imported = inspectGuestTransfer(text);
    if (storage.getItem(STAGING_KEY) !== null)
        throw new Error('已有待確認的轉移資料；請先保管備份並處理現有暫存，避免覆蓋');
    storage.setItem(STAGING_KEY, text);
    return imported.preview;
}

export function inspectStagedGuestTransfer(storage) {
    const text = storage.getItem(STAGING_KEY);
    if (text === null) return null;
    const result = inspectGuestTransfer(text);
    let activatable = true;
    let blockReason = '';
    try { validateActivation(result.payload.data); }
    catch (error) { activatable = false; blockReason = error.message; }
    const data = result.payload.data;
    if ((data.guestSave !== null && storage.getItem(GUEST_SAVE_KEY) !== null) ||
        (data.terrariumSave !== null && storage.getItem(TERRARIUM_SAVE_KEY) !== null)) {
        activatable = false;
        blockReason = '新網站已有相同類型的存檔，為避免覆蓋，禁止啟用';
    }
    return { ...result.preview, activatable, blockReason };
}

/**
 * Never overwrite an existing primary save. Explicit confirmation is required.
 * No Supabase, login-mode, account storage or remote writes are made here.
 */
export function activateStagedGuestTransfer(storage, { confirmed = false } = {}) {
    if (confirmed !== true) throw new Error('沒有確認啟用，未修改主要存檔');
    const text = storage.getItem(STAGING_KEY);
    if (text === null) throw new Error('尚未選擇備份檔');
    const { payload } = inspectGuestTransfer(text);
    const data = payload.data;
    validateActivation(data);
    const entries = [];
    if (data.guestSave !== null) entries.push([GUEST_SAVE_KEY, JSON.stringify(data.guestSave)]);
    if (data.terrariumSave !== null) entries.push([TERRARIUM_SAVE_KEY, JSON.stringify(data.terrariumSave)]);
    for (const [key] of entries)
        if (storage.getItem(key) !== null)
            throw new Error('新網站已存在存檔，已停止操作，沒有覆蓋任何資料');

    const written = [];
    try {
        for (const [key, raw] of entries) {
            storage.setItem(key, raw);
            written.push(key);
        }
    } catch (error) {
        for (const key of written) {
            try { storage.removeItem(key); } catch { /* best-effort rollback */ }
        }
        throw new Error('寫入失敗，已嘗試回復未完成的轉移；請先保留外部 JSON 備份：' + (error?.message || String(error)));
    }
    try { storage.removeItem(STAGING_KEY); } catch { /* optional cleanup */ }
    return { success: true, keysAdded: written.length };
}

/** Explicitly remove only the unactivated temporary copy, never the active save. */
export function discardStagedGuestTransfer(storage, { confirmed = false } = {}) {
    if (confirmed !== true) throw new Error('需要確認才可清除暫存');
    storage.removeItem(STAGING_KEY);
    return { success: true };
}
