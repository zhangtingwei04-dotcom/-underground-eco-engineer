// 地下生態工程師 | Underground Eco-Engineer
// 核心系統：生物外觀、基因、健康病徵與爬行蠕動動態渲染系統 (Creature Morph, Texture & Animation System)

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
            // 生命週期、生理指標與病徵狀態
            life: {
                age: 0,
                life_stage: "juvenile",
                health: 100,
                hydration: 100,
                nutrition: 100,
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
     */
    renderCreatureWithTexture: function(scene, x, y, individualData) {
        if (!scene) return null;

        const container = scene.add.container(x, y);
        const app = individualData.appearance || {};
        const symptoms = individualData.symptoms || {};

        let baseColorHex = parseInt((app.base_color || "#C8A27A").replace('#', '0x'), 16);
        let blotchColorHex = parseInt((app.blotch_color || "#5C381E").replace('#', '0x'), 16);

        if (symptoms.dull_skin) {
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

        container.setData('individualData', individualData);

        // 預設日常呼吸與探頭微動態
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
    },

    /**
     * 3. 專屬爬行與通道穿梭動態 (Crawl & Tunnel S-Curve Animation)
     * 讓寵物在生態箱或地道中呈現流暢的 S 型爬行蠕動與位移
     */
    playCrawlAnimation: function(scene, container, targetX, targetY, onCompleteCallback) {
        if (!scene || !container) return;

        const startX = container.x;
        const startY = container.y;

        // 計算朝向與距離
        const angle = Math.atan2(targetY - startY, targetX - startX);
        if (targetX < startX) {
            container.setScale(-1, 1); // 左右翻轉面向
        } else {
            container.setScale(1, 1);
        }

        // 執行 S 型穿梭蠕動補間動畫
        scene.tweens.add({
            targets: container,
            x: targetX,
            y: targetY,
            duration: 1800,
            ease: 'Sine.easeInOut',
            onUpdate: (tween, target) => {
                // 模擬爬行時身體的輕微上下起伏波浪
                const progress = tween.progress;
                target.y += Math.sin(progress * Math.PI * 6) * 2;
            },
            onComplete: () => {
                if (typeof onCompleteCallback === 'function') {
                    onCompleteCallback();
                }
            }
        });
    }
};