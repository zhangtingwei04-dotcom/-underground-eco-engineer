// 地上生態工程師 | Underground Eco-Engineer
// 核心系統：生物外觀、基因與健康病徵渲染系統 (Creature Morph, Texture & Health System)

window.CreatureMorphSystem = {
    /**
     * 1. 根據生物種類設定與隨機種子，生成具備獨立基因、外觀與完整生命/健康歷史的個體
     */
    generateIndividual: function(speciesData, forcedSeed = null) {
        const seed = forcedSeed || Math.floor(Math.random() * 899999 + 100000);
        return this.generateFromSeed(speciesData, seed);
    },

    /**
     * 根據固定 Seed 重建外觀與生命健康資料，確保存檔讀取時狀態完全一致
     */
    generateFromSeed: function(speciesData, seed) {
        const morphs = (speciesData && speciesData.morphs) ? speciesData.morphs : [];
        
        // 偽隨機因子選定品系
        const morphIndex = seed % (morphs.length || 1);
        const selectedMorph = morphs[morphIndex] || {
            id: "wild_type",
            color_tint: "#C8A27A",
            blotch_tint: "#5C381E",
            pattern_style: "standard_blotches"
        };

        const category = (speciesData && speciesData.category) ? speciesData.category : "snake";

        return {
            creature_id: (speciesData ? speciesData.id : "creature") + "_" + seed,
            identity: {
                name: (speciesData ? speciesData.species_name_zh : "未知生物") + " (個體 #" + seed + ")",
                personality: "curious",
                profession: "explorer"
            },
            appearance: {
                base_color: selectedMorph.color_tint || "#C8A27A",
                blotch_color: selectedMorph.blotch_tint || "#5C381E",
                pattern_style: selectedMorph.pattern_style || "standard_blotches",
                pattern_density: 0.65,
                pattern_contrast: 0.8,
                scale_texture: category === "snake" ? "fine" : (category === "lizard" ? "rough" : "smooth"),
                grain_texture: "pencil_noise",
                pixel_style: "soft_pixel"
            },
            // V1.0 新增：生命週期、生理指標與病徵狀態
            life: {
                age: 0,
                life_stage: "juvenile", // 幼年期、青年期、成年期、老年期
                health: 100,            // 健康值
                hydration: 100,         // 水分
                nutrition: 100,         // 營養
                is_alive: true,
                death: {
                    occurred: false,
                    cause: null,
                    date: null
                }
            },
            symptoms: {
                dull_skin: false,       // 體色黯淡（生病/脫水病徵）
                lethargy: false,        // 活動力下降
                anorexia: false,        // 拒食
                abnormal_respiration: false // 呼吸異常
            },
            health_history: [
                { day: 1, event_zh: "個體順利孵化/誕生，健康狀態良好。" }
            ],
            generation: {
                seed: seed,
                morph_id: selectedMorph.id,
                randomized: true
            }
        };
    },

    /**
     * 2. 三層式生物繪製與健康病徵渲染接口
     * 整合外觀色調、花紋與「體色黯淡（Dull Skin）」病徵表現
     */
    renderCreatureWithTexture: function(scene, x, y, individualData) {
        if (!scene) return null;

        const container = scene.add.container(x, y);
        const app = individualData.appearance || {};
        const symptoms = individualData.symptoms || {};

        // 色彩解析：如果偵測到體色黯淡病徵（dull_skin），將色彩轉為較灰暗的色調
        let baseColorHex = parseInt((app.base_color || "#C8A27A").replace('#', '0x'), 16);
        let blotchColorHex = parseInt((app.blotch_color || "#5C381E").replace('#', '0x'), 16);

        if (symptoms.dull_skin) {
            // 模擬病態黯淡灰化處理
            baseColorHex = 0x8a7f72;
            blotchColorHex = 0x4a4238;
        }

        // --- 第一層：基礎身體動態渲染 ---
        const bodyGraphics = scene.add.graphics();
        bodyGraphics.fillStyle(baseColorHex, 1);
        
        bodyGraphics.fillCircle(-12, 4, 8);
        bodyGraphics.fillCircle(-4, 0, 9);
        bodyGraphics.fillCircle(4, -4, 8);
        bodyGraphics.fillTriangle(10, -8, 22, -6, 12, 0); // 翹鼻
        container.add(bodyGraphics);

        // --- 第二層：基因花紋渲染 ---
        const patternGraphics = scene.add.graphics();
        patternGraphics.fillStyle(blotchColorHex, symptoms.dull_skin ? 0.6 : 0.9);
        patternGraphics.fillCircle(-10, 2, 3);
        patternGraphics.fillCircle(-2, -2, 3.5);
        patternGraphics.fillCircle(6, -5, 3);
        container.add(patternGraphics);

        // 眼睛圖層
        const eyeGraphics = scene.add.graphics();
        eyeGraphics.fillStyle(0xffffff, 1);
        eyeGraphics.fillCircle(12, -6, 2.5);
        eyeGraphics.fillStyle(0x000000, 1);
        eyeGraphics.fillCircle(13, -6, 1.2);
        container.add(eyeGraphics);

        // --- 第三層：顆粒與質感貼圖接口 ---
        if (scene.textures && scene.textures.exists(app.grain_texture)) {
            const textureOverlay = scene.add.image(0, 0, app.grain_texture);
            textureOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
            textureOverlay.setAlpha(symptoms.dull_skin ? 0.5 : 0.35);
            container.add(textureOverlay);
        }

        // 綁定個體資料
        container.setData('individualData', individualData);

        // 根據健康狀態調整微動態（生病時呼吸晃動幅度減弱、甚至呈現無力狀態）
        const tweenDuration = symptoms.lethargy ? 2500 : 1300;
        scene.tweens.add({
            targets: container,
            y: y - (symptoms.lethargy ? 1 : 3),
            duration: tweenDuration,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return container;
    }
};