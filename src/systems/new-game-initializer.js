/**
 * 《鱗片與種子：地下生態物語》
 * 新遊戲初始化系統
 *
 * 負責決定新玩家的初始內容。
 * 不負責存檔，也不直接管理物種資料。
 */

import { STARTING_CREATURE_CONFIG } from './starting-creature-config.js';
import { CreatureFactory } from './creature-factory.js';

export class NewGameInitializer {

    /**
     * 建立新玩家的初始寵物
     * @returns {Array} 初始寵物清單
     */
    static createStartingCreatures() {

        const startingCreature = CreatureFactory.create(
            STARTING_CREATURE_CONFIG
        );

        return [startingCreature];
    }

}

window.NewGameInitializer = NewGameInitializer;