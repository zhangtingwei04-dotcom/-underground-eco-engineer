/**
 * 《鱗片與種子：地下生態物語》 - 物種習性與動態行為系統 (creature-behavior-system.js)
 * 根據物種配置 (SpeciesConfigSystem)、生態箱配備與日夜時段，動態判定生物行為並記錄觀察日誌
 */

import { SpeciesConfigSystem } from './species-config-system.js';
import { ObservationJournalSystem } from './observation-journal-system.js';

export class CreatureBehaviorSystem {
    // 跨物種行為與觀察文本資料庫
    static BEHAVIOR_LOGS = {
        // --- 豬鼻蛇 (Hognose) 專屬/偏好行為 ---
        burrowing: [
            { type: 'fun', content: '小傢伙用扁平的小鼻子像鏟子一樣努力推開底材，今天又在地底下開挖了一條新隧道！' },
            { type: 'daily', content: '把頭深深埋進底材裡，只露出一小截尾巴，在洞穴深處睡得非常香甜。' }
        ],
        hiding: [
            { type: 'daily', content: '躲在溫暖的躲藏穴中休息，偶爾微微吐舌探索周遭環境。' }
        ],
        defensive_playing_dead: [
            { type: 'warning', content: '因為受到驚嚇或環境緊繃，突然翻過身肚子朝上伸出舌頭，展開了戲劇性的裝死！' }
        ],

        // --- 玉米蛇 (Corn Snake) 專屬/偏好行為 ---
        climbing: [
            { type: 'fun', content: '沿著高處的藤蔓與沉木優雅地攀爬，隨後盘繞在枝條高處靜靜俯瞰整個生態箱。' },
            { type: 'daily', content: '今天選擇在高處的軟木平台盤成一個漂亮的圓圈打盹。' }
        ],
        crepuscular_activity: [
            { type: 'fun', content: '隨著地下室的光線轉暗，牠開始在微光中順著箱壁緩慢爬動，展開黃昏時分的例行探索。' }
        ],
        exploration: [
            { type: 'daily', content: '吐著細小的黑色舌頭，好奇地繞著箱內的植物葉片尋訪了一整圈。' }
        ],

        // --- 通用與健康警訊行為 ---
        shedding_prep: [
            { type: 'important', content: '眼睛蒙上一層淡淡的藍霧，體色也略顯黯淡，看來這幾天就要準備脫皮了。' }
        ],
        stress_hiding: [
            { type: 'warning', content: '最近一直蜷縮在陰暗角落，活動量明顯下降，建議留意溫濕度與環境變化。' }
        ]
    };

    /**
     * 判定生物當前發生的行為，並自動推入觀察日誌
     * @param {Object} saveJson 遊戲存檔
     * @param {Object} creature 生物實體 (包含 speciesId, stress, health, isShedding, personality 等)
     * @param {Object} terrarium 生態箱環境 (包含 temperature, humidity, hasClimbingStructures, deepSubstrate 等)
     * @param {string} timeOfDay 當前時段 ('morning', 'day', 'dusk', 'night')
     */
    static processCreatureBehavior(saveJson, creature, terrarium, timeOfDay = 'day') {
        const speciesId = creature.speciesId || 'hognose_snake';
        const speciesConfig = SpeciesConfigSystem.getSpeciesConfig(speciesId);

        let selectedTrait = 'hiding';
        let logCategory = 'daily';
        let logContent = '小生命安靜地在生態箱中休息。';

        // 1. 優先判定健康警訊與脫皮
        if (creature.isShedding) {
            selectedTrait = 'shedding_prep';
        } else if (creature.stress > 60 || creature.health < 60) {
            selectedTrait = 'stress_hiding';
        } else {
            // 2. 根據物種特徵與生態箱配備過濾可用行為
            const traits = speciesConfig ? [...speciesConfig.behavior_traits] : ['hiding'];

            // 如果箱子有攀爬結構且物種支援攀爬（如玉米蛇）
            if (terrarium.hasClimbingStructures && traits.includes('climbing')) {
                // 玉米蛇在黃昏/夜間更高機率選擇攀爬與探索
                if (timeOfDay === 'dusk' || timeOfDay === 'night') {
                    traits.push('climbing', 'crepuscular_activity');
                }
            }

            // 如果箱子有深層底材且物種支援挖掘（如豬鼻蛇）
            if (terrarium.deepSubstrate && traits.includes('burrowing')) {
                traits.push('burrowing');
            }

            // 隨機挑選一個符合條件的行為特徵
            const randomIndex = Math.floor(Math.random() * traits.length);
            selectedTrait = traits[randomIndex];
        }

        // 3. 從行為日誌庫中提取對應的描述文字
        const behaviorPool = this.BEHAVIOR_LOGS[selectedTrait] || this.BEHAVIOR_LOGS.hiding;
        const chosenLog = behaviorPool[Math.floor(Math.random() * behaviorPool.length)];

        logCategory = chosenLog.type;
        logContent = chosenLog.content;

        // 4. 自動寫入觀察日誌
        ObservationJournalSystem.addLog(saveJson, logCategory, logContent);

        creature.currentBehavior = selectedTrait;

        return {
            trait: selectedTrait,
            category: logCategory,
            content: logContent
        };
    }
}

window.CreatureBehaviorSystem = CreatureBehaviorSystem;