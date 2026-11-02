// 地下生態工程師 | Underground Eco-Engineer
// 核心主場景：電子寵物陪伴與棲息地主畫面 (Main Habitat & Companion Scene)

class UndergroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UndergroundScene' });
    }

    preload() {
        // 載入預設生物設定檔與生態箱規格
        this.load.json('hognose_data', 'src/entities/hognose.json');
        this.load.json('reserve_zones', 'src/entities/environment/reserve-zones.json');
        this.load.json('terrarium_types', 'src/entities/terrariums/terrarium-types.json');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. 初始化全域多生態箱管理系統與存檔系統（若尚未初始化）
        if (!window.globalTerrariumSystem && window.TerrariumSystem) {
            const typesConfig = this.cache.json.get('terrarium_types');
            window.globalTerrariumSystem = new window.TerrariumSystem(typesConfig);
            
            // 若完全沒有箱子，自動建立預設的小型與標準生態箱作為開局測試
            try {
                window.globalTerrariumSystem.createTerrarium('box_1', 'small', '新手小型生態箱');
                window.globalTerrariumSystem.createTerrarium('box_2', 'standard', '標準雨林生態箱');
            } catch (e) {
                console.log("[UndergroundScene] 生態箱初始化略過：", e);
            }
        }

        if (!window.globalTerrariumSaveSystem && window.TerrariumSaveSystem) {
            window.globalTerrariumSaveSystem = new window.TerrariumSaveSystem();
            // 嘗試載入本地存檔
            window.globalTerrariumSaveSystem.loadTerrariums(window.globalTerrariumSystem);
        }

        // 2. 初始化生態保護區分區系統
        const zonesData = this.cache.json.get('reserve_zones');
        if (zonesData && window.ReserveZoneSystem) {
            window.ReserveZoneSystem.init(zonesData);
        }

        // 3. 繪製手繪質感背景：人工基地牆面與自然地洞的融合
        this.createHabitatBackground(width, height);

        // 4. 生成玩家的核心寵物 (Core Companion Creature)
        const hognoseSpecies = this.cache.json.get('hognose_data');
        this.petData = window.CreatureMorphSystem ? window.CreatureMorphSystem.generateFromSeed(hognoseSpecies, 778899) : { identity: { name: "豬鼻蛇" }, symptoms: {} };

        if (window.CreatureMorphSystem) {
            this.petContainer = window.CreatureMorphSystem.renderCreatureWithTexture(
                this, 
                width / 2, 
                height / 2 + 40, 
                this.petData
            );

            this.petContainer.setSize(60, 60);
            this.petContainer.setInteractive();
            this.petContainer.on('pointerdown', () => {
                this.onPetClicked();
            });
        }

        // 5. 建立質感抬頭顯示 UI (Warm Eco UI)
        this.createCompanionUI(width, height);

        // 6. 聆聽視角切換事件
        this.events.on('view_changed', (data) => {
            console.log("視角切換至:", data.mode);
        });
    }

    /**
     * 繪製背景：人工觀察邊框與自然地貌
     */
    createHabitatBackground(width, height) {
        const bgGraphics = this.add.graphics();
        
        // 深層土壤與岩層底色 (Warm Earth Tones)
        bgGraphics.fillStyle(0x2b1d14, 1);
        bgGraphics.fillRect(0, 0, width, height);

        // 苔蘚與洞穴局部 (自然地貌區)
        bgGraphics.fillStyle(0x3d2b1f, 1);
        bgGraphics.fillCircle(width / 2, height / 2 + 50, 140);
        
        bgGraphics.fillStyle(0x1e3820, 0.6); // 苔蘚斑駁感
        bgGraphics.fillCircle(width / 2 - 40, height / 2 + 80, 60);

        // 人工基地邊框 (強化「人工保護區」的世界觀細節)
        bgGraphics.lineStyle(4, 0x5c4d41, 0.5);
        bgGraphics.strokeRoundedRect(20, 20, width - 40, height - 40, 16);
    }

    /**
     * 創建陪伴導向的 UI 介面
     */
    createCompanionUI(width, height) {
        // 頂部寵物名字與情感狀態
        const petName = this.petData.identity ? this.petData.identity.name : "豬鼻蛇";
        this.add.text(40, 35, `🌿 ${petName}`, {
            fontSize: '20px',
            color: '#e8d8c8',
            fontStyle: 'bold'
        });

        const hasDullSkin = this.petData.symptoms && this.petData.symptoms.dull_skin;
        const statusText = hasDullSkin 
            ? "狀態：神情略顯疲倦..." 
            : "狀態：正好奇地探頭探腦";

        this.statusLabel = this.add.text(40, 65, statusText, {
            fontSize: '14px',
            color: '#b8a695'
        });

        // 右下角：極簡互動功能按鈕 (手繪筆記風格)
        const btnY = height - 50;
        
        // 📦 生態箱總覽按鈕（串接 TerrariumSelectScene）
        this.createUIButton(width - 325, btnY, "📦 生態箱總覽", () => {
            console.log("[UndergroundScene] 切換至生態箱選擇總覽介面");
            this.scene.start('TerrariumSelectScene', {
                terrariumSystem: window.globalTerrariumSystem,
                saveSystem: window.globalTerrariumSaveSystem
            });
        });

        this.createUIButton(width - 215, btnY, "🔍 觀察診斷", () => {
            console.log("開啟自然科學觀察診斷日誌");
        });

        this.createUIButton(width - 120, btnY, "⛏️ 挖掘探索", () => {
            console.log("切換至地下剖面探勘視角");
            if (window.ReserveZoneSystem) {
                window.ReserveZoneSystem.switchToCrossSectionView(this);
            }
        });

        this.createUIButton(width - 40, btnY, "🔬 研究所", () => {
            console.log("打開科研與解鎖選單");
        });
    }

    createUIButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontSize: '13px',
            color: '#ffffff',
            backgroundColor: '#4a382a',
            padding: { x: 8, y: 8 }
        }).setInteractive().setOrigin(0.5);

        btn.on('pointerdown', callback);
        btn.on('pointerover', () => btn.setStyle({ color: '#ffd59e' }));
        btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
        return btn;
    }

    /**
     * 點擊寵物時的親密互動反應
     */
    onPetClicked() {
        if (this.petContainer) {
            this.tweens.add({
                targets: this.petContainer,
                scaleY: 1.15,
                scaleX: 0.9,
                duration: 120,
                yoyo: true,
                ease: 'Quad.easeOut'
            });
        }

        if (this.statusLabel && this.petData.identity) {
            this.statusLabel.setText(`狀態：${this.petData.identity.name} 注意到了你，輕輕動了動嘴唇！`);
        }
    }
}

window.UndergroundScene = UndergroundScene;