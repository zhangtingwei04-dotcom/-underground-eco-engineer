/**
 * 《鱗片與種子：地下生態物語》 - 生物日常行為與活動判定系統 (creature-behavior-system.js)
 * 負責根據豬鼻蛇的生理狀態與環境，判定當前行為、動態產生生活化觀察紀錄
 */

import { ObservationJournalSystem } from './observation-journal-system.js';

export class CreatureBehaviorSystem {
    // 定義豬鼻蛇可能展現的行為清單與對應描述
    static BEHAVIORS = {
        SLEEPING_DEEP: {
            id: 'sleeping_deep',
            category: 'daily',
            description: '小傢伙把頭深深埋進底材裡，只露出一小截尾巴，在洞穴深處睡得非常香甜。'
        },
        SUNBASKING: {
            id: 'sunbasking',
            category: 'daily',
            description: '正慵懶地趴在溫控區的微溫石上，享受著舒適的溫度，看起來十分放鬆。'
        },
        TUNNELING: {
            id: 'tunneling',
            category: 'fun',
            description: '用扁平的小鼻子像鏟子一樣努力地推開底材，今天又在地底下開挖了一條新隧道！'
        },
        EXPLORING: {
            id: 'exploring',
            category: 'fun',
            description: '正順著沉木緩緩向上爬動，不時吐出細小的黑色舌頭，好奇地探索著周遭的空氣。'
        },
        SHEDDING_PREP: {
            id: 'shedding_prep',
            category: 'important',
            description: '眼睛蒙上一層淡淡的藍霧，身體顏色也略顯黯淡，看來這幾天就要準備脫皮了。'
        },
        STRESS_HIDING: {
            id: 'stress_hiding',
            category: 'warning',
            description: '因為環境或壓力影響，今天一直縮在角落的陰暗處，顯得有些緊張與疲憊。'
        },
        THIRSTY_RESTING: {
            id: 'thirsty_resting',
            category: 'warning',
            description: '靜靜地趴在水盆邊緣，似乎有些口渴，正等待著清澈的水源。'
        }
    };

    /**
     * 判定豬鼻蛇當前的核心行為狀態
     * @param {Object} hognose 豬鼻蛇實體資料
     * @param {Object} terrarium 生態箱環境資料
     */
    static determineCurrentBehavior(hognose, terrarium) {
        // 1. 優先判定脫皮準備期
        if (hognose.isShedding) {
            return this.BEHAVIORS.SHEDDING_PREP;
        }

        // 2. 判定壓力或身體不適引起的躲藏
        if (hognose.stress > 60 || hognose.health < 60) {
            return this.BEHAVIORS.STRESS_HIDING;
        }

        // 3. 判定水分過低
        if (hognose.hydration < 40) {
            return this.BEHAVIORS.THIRSTY_RESTING;
        }

        // 4. 根據環境溫度與隨機性判定日常活動（休息或探索/挖洞）
        const randomRoll = Math.random();
        
        if (terrarium.temperature >= 26 && terrarium.temperature <= 30 && randomRoll < 0.4) {
            return this.BEHAVIORS.SUNBASKING;
        } else if (randomRoll < 0.7) {
            return this.BEHAVIORS.TUNNELING;
        } else if (randomRoll < 0.85) {
            return this.BEHAVIORS.EXPLORING;
        } else {
            return this.BEHAVIORS.DESP_SLEEPING; // 預設深眠
        }
    }

    /**
     * 執行日常行為檢核，並自動將產生的行為寫入觀察日誌中
     * @param {Object} saveJson 遊戲存檔
     * @param {Object} hognose 豬鼻蛇實體
     * @param {Object} terrarium 生態箱資料
     */
    static processBehaviorTick(saveJson, hognose, terrarium) {
        const currentBehavior = this.determineCurrentBehavior(hognose, terrarium);

        // 將行為轉換並推入觀察日誌系統
        ObservationJournalSystem.addLog(
            saveJson, 
            currentBehavior.category, 
            currentBehavior.description
        );

        // 同時更新實體當前的行為標籤，供前端畫面顯示對應動畫或圖示
        hognose.currentBehaviorId = currentBehavior.id;

        return currentBehavior;
    }
}

window.CreatureBehaviorSystem = CreatureBehaviorSystem;