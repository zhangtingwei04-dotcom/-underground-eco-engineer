/**
 * 《鱗片與種子：地下生態物語》
 * 物種習性與動態行為系統 (creature-behavior-system.js)
 *
 * 根據物種配置、生態箱配備與日夜時段，
 * 動態判定生物行為並記錄觀察日誌。
 */

import { SpeciesConfigSystem } from './species-config-system.js';
import { ObservationJournalSystem } from './observation-journal-system.js';

export class CreatureBehaviorSystem {

    // 跨物種行為與觀察文本資料庫
    static BEHAVIOR_LOGS = {

        // --- 通用挖掘行為 ---
        burrowing: [
            {
                type: 'fun',
                content: '牠持續用身體推開底材，在生態箱底部探索並開闢了一條新的通道！'
            },
            {
                type: 'daily',