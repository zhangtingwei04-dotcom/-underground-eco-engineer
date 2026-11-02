// 地下生態工程師 - 生物模組化外觀與動態系統 (Creature Morph & Motion System)

window.CreatureMorphSystem = {
    // 預設品系資料 (確保 JSON 讀取失敗時仍能正常運作)
    defaultMorphs: [
        { id: "wild_type", name_zh: "普通野生型", name_en: "Wild Type", rarity: "Common", weight: 60, color_tint: 0x8b5a2b },
        { id: "anaconda", name_zh: "蟒紋變異", name_en: "Anaconda Morph", rarity: "Uncommon", weight: 25, color_tint: 0xd2b48c },
        { id: "arctic", name_zh: "極地高對比", name_en: "Arctic Morph", rarity: "Rare", weight: 10, color_tint: 0xe0e0e0 },
        { id: "albino", name_zh: "夢幻白化型", name_en: "Albino Morph", rarity: "Legendary", weight: 5, color_tint: 0xfffacd }
    ],

    /**
     * 為生物隨機生成獨一無二的外觀特徵碼
     */
    generateIndividualMorph: function(morphList) {
        const list = morphList || this.defaultMorphs;
        const totalWeight = list.reduce((sum, item) => sum + (item.weight || 10), 0);
        let randomNum = Math.random() * totalWeight;

        let selected = list[0];
        for (let morph of list) {
            if (randomNum < morph.weight) {
                selected = morph;
                break;
            }
            randomNum -= morph.weight;
        }

        return {
            individualId: "hog_" + Math.floor(Math.random() * 899999 + 100000),
            morphId: selected.id,
            name_zh: selected.name_zh,
            name_en: selected.name_en,
            rarity: selected.rarity,
            colorTint: typeof selected.color_tint === 'string' ? parseInt(selected.color_tint, 16) : selected.color_tint,
            currentAnimState: "idle", // 動作狀態: idle (擺頭), crawl (爬行), sleep (蜷曲休息), play_dead (翻肚)
            animFrame: 0
        };
    },

    /**
     * 程式化動態繪製生物（現階段以向量圖形模擬手繪骨架與動態，未來可無痛切換為圖片精靈）
     */
    renderCreatureSprite: function(scene, x, y, morphData) {
        if (!scene) return null;
        const container = scene.add.container(x, y);
        const tint = morphData.colorTint || 0x8b5a2b;

        const bodyGraphics = scene.add.graphics();
        container.add(bodyGraphics);
        container.setData('morphData', morphData);

        // 啟動個體微動態（呼吸/擺頭/休息）
        scene.tweens.add({
            targets: container,
            y: y - 3,
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.drawCreatureState(bodyGraphics, morphData.currentAnimState, tint);
        return container;
    },

    /**
     * 繪製生物在不同狀態下的形態
     */
    drawCreatureState: function(graphics, state, tint) {
        graphics.clear();

        if (state === "sleep") {
            // 蜷曲休息姿態
            graphics.fillStyle(tint, 1);
            graphics.fillCircle(0, 0, 16);
            graphics.fillStyle(0x3e2723, 1);
            graphics.fillCircle(4, -2, 10); // 趴著的頭部
            return;
        }

        // 一般及待機姿態 (S 型身體 + 翹鼻子頭部)
        graphics.fillStyle(tint, 1);
        graphics.fillCircle(-12, 4, 8);
        graphics.fillCircle(-4, 0, 9);
        graphics.fillCircle(4, -4, 8);

        // 手繪風格頭部與微翹鼻子
        graphics.fillStyle(tint, 1);
        graphics.fillTriangle(10, -8, 22, -6, 12, 0); // 翹鼻
        graphics.fillStyle(0xffffff, 1);
        graphics.fillCircle(12, -6, 3); // 眼睛白
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(13, -6, 1.5); // 眼珠
    }
};