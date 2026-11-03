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
                content: '牠將身體慢慢埋入底材之中，在隱蔽的地下空間安靜休息。'
            }
        ],

        // --- 通用躲藏行為 ---
        hiding: [
            {
                type: 'daily',
                content: '牠躲在熟悉的躲藏穴中休息，偶爾吐舌探索周遭環境。'
            }
        ],

        // --- 西部豬鼻蛇專屬行為 ---
        defensive_playing_dead: [
            {
                type: 'warning',
                content: '受到驚嚇時，牠翻轉身體露出腹部，展現出特殊的防禦性裝死行為。'
            }
        ],

        // --- 玉米蛇行為 ---
        climbing: [
            {
                type: 'fun',
                content: '牠沿著藤蔓與沉木向上攀爬，隨後盤繞在枝條高處觀察周遭環境。'
            },
            {
                type: 'daily',
                content: '今天牠選擇在高處的軟木平台盤成一圈，享受安靜的休息時光。'
            }
        ],

        crepuscular_activity: [
            {
                type: 'fun',
                content: '隨著光線逐漸轉暗，牠開始沿著生態箱緩慢探索，展開黃昏時段的活動。'
            }
        ],

        exploration: [
            {
                type: 'daily',
                content: '牠吐著舌頭，好奇地探索箱內植物與裝飾物，仔細感受周遭環境。'
            }
        ],

        // --- 球蟒專屬行為 ---
        coiling_ball: [
            {
                type: 'daily',
                content: '牠將身體緊密地盤繞成一團，安靜地待在安全的位置休息。'
            },
            {
                type: 'fun',
                content: '牠熟練地將身體蜷成一個圓球，呈現出球蟒招牌般的防禦姿態。'
            }
        ],

        deep_hiding: [
            {
                type: 'daily',
                content: '牠選擇躲進狹窄而隱蔽的躲藏空間，享受安穩且不受打擾的休息。'
            }
        ],

        night_patrol: [
            {
                type: 'fun',
                content: '夜色降臨後，牠緩緩離開躲藏處，沿著生態箱邊緣展開夜間探索。'
            }
        ],

        // --- 加州王蛇專屬行為 ---
        active_exploration: [
            {
                type: 'fun',
                content: '牠在生態箱中四處探索，穿過裝飾物與躲藏設施，展現旺盛的活動力。'
            },
            {
                type: 'daily',
                content: '牠沿著不同區域緩慢移動，仔細探索環境中的每一個角落。'
            }
        ],

        boundary_patrol: [
            {
                type: 'daily',
                content: '牠沿著生態箱的邊緣移動，反覆探索不同角落與隱蔽空間。'
            }
        ],

        // --- 納爾遜奶蛇專屬行為 ---
        crevice_hiding: [
            {
                type: 'daily',
                content: '牠將身體藏入岩石與裝飾物之間的狹窄縫隙，尋找安全感十足的休息位置。'
            }
        ],

        leaf_litter_burrowing: [
            {
                type: 'fun',
                content: '牠鑽入落葉層之間，利用鬆散的葉片遮蔽身體，探索底部環境。'
            },
            {
                type: 'daily',
                content: '牠躲在落葉與底材交錯的空間中，安靜地休息。'
            }
        ],

        // --- 通用健康警訊行為 ---
        shedding_prep: [
            {
                type: 'important',
                content: '眼睛蒙上一層淡淡的藍霧，體色也略顯黯淡，看來這幾天就要準備脫皮了。'
            }
        ],

        stress_hiding: [
            {
                type: 'warning',
                content: '最近一直蜷縮在陰暗角落，活動量明顯下降，建議留意溫濕度與環境變化。'
            }
        ]
    };

    /**
     * 判定生物當前發生的行為，並自動推入觀察日誌
     */
    static processCreatureBehavior(
        saveJson,
        creature,
        terrarium,
        timeOfDay = 'day'
    ) {

        // 1. 檢查必要資料
        if (!creature || typeof creature !== 'object') {
            throw new Error(
                '[CreatureBehaviorSystem] 缺少有效的生物資料。'
            );
        }

        if (!terrarium || typeof terrarium !== 'object') {
            throw new Error(
                '[CreatureBehaviorSystem] 缺少有效的生態箱資料。'
            );
        }

        // 2. 取得標準物種 ID
        const speciesId = creature.speciesId || creature.species;

        if (!speciesId) {
            throw new Error(
                `[CreatureBehaviorSystem] 寵物缺少物種 ID，個體 ID：${creature.id || 'unknown'}`
            );
        }

        // 3. 查詢物種設定
        const speciesConfig =
            SpeciesConfigSystem.getSpeciesConfig(speciesId);

        if (!speciesConfig) {
            throw new Error(
                `[CreatureBehaviorSystem] 找不到物種設定：${speciesId}`
            );
        }

        // 4. 初始化行為結果
        let selectedTrait = 'hiding';

        // 5. 優先判定健康警訊與脫皮
        if (creature.isShedding) {

            selectedTrait = 'shedding_prep';

        } else if (
            creature.stress > 60 ||
            creature.health < 60
        ) {

            selectedTrait = 'stress_hiding';

        } else {

            // 6. 取得物種可用行為
            const traits = [
                ...speciesConfig.behavior_traits
            ];

            // 玉米蛇等具備攀爬傾向的物種
            if (
                terrarium.hasClimbingStructures &&
                traits.includes('climbing') &&
                (timeOfDay === 'dusk' || timeOfDay === 'night')
            ) {
                traits.push('climbing');
            }

            // 具備挖掘傾向且底材足夠的物種
            if (
                terrarium.deepSubstrate &&
                traits.includes('burrowing')
            ) {
                traits.push('burrowing');
            }

            // 7. 隨機選擇行為
            const randomIndex = Math.floor(
                Math.random() * traits.length
            );

            selectedTrait = traits[randomIndex];
        }

        // 8. 取得對應的行為日誌
        const behaviorPool =
            this.BEHAVIOR_LOGS[selectedTrait];

        if (!behaviorPool || behaviorPool.length === 0) {
            throw new Error(
                `[CreatureBehaviorSystem] 行為缺少日誌資料：${selectedTrait}`
            );
        }

        // 9. 隨機選擇日誌內容
        const chosenLog = behaviorPool[
            Math.floor(Math.random() * behaviorPool.length)
        ];

        // 10. 寫入觀察日誌
        ObservationJournalSystem.addLog(
            saveJson,
            chosenLog.type,
            chosenLog.content
        );

        // 11. 更新生物目前行為
        creature.currentBehavior = selectedTrait;

        return {
            trait: selectedTrait,
            category: chosenLog.type,
            content: chosenLog.content
        };
    }
}

window.CreatureBehaviorSystem = CreatureBehaviorSystem;