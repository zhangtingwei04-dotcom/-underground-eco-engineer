// 地下生態工程師 | Underground Eco-Engineer
// 核心主場景：電子寵物陪伴與棲息地主畫面 (Main Habitat & Companion Scene)

class UndergroundScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UndergroundScene' });
    }

    preload() {
        // 載入預設生物設定檔
        this.load.json('hognose_data', 'src/entities/hognose.json');
        this.load.json('reserve_zones', 'src/entities/environment/reserve-zones.json');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. 初始化生態保護區分區系統
        const zonesData = this.cache.json.get('reserve_zones');
        window.ReserveZoneSystem.init(zonesData);

        // 2. 繪製手繪質感背景：人工基地牆面與自然地洞的融合
        this.createHabitatBackground(width, height);

        // 3. 生成玩家的核心寵物 (Core Companion Creature)
        const hognoseSpecies = this.cache.json.get('hognose_data');
        // 使用 Seed 生成具備獨一無二外觀、基因與生理狀態的個體
        this.petData = window.CreatureMorphSystem.generateFromSeed(hognoseSpecies, 778899);

        // 在場景中央偏下繪製三層式外觀寵物 (Layer 1 Base -> Layer 2 Pattern -> Layer 3 Grain)
        this.petContainer = window.CreatureMorphSystem.renderCreatureWithTexture(
            this, 
            width / 2, 
            height / 2 + 40, 
            this.petData
        );

        // 4. 點擊寵物互動（電子寵物核心體驗）
        this.petContainer.setSize(60, 60);
        this.petContainer.setInteractive();
        this.petContainer.on('pointerdown', () => {
            this.onPetClicked();
        });

        // 5. 建立質感抬頭顯示 UI (Warm Eco UI)
        this.createCompanionUI(width, height);

        // 6. 聆聽視角切換事件 (剖面縱覽 ↔ 局部生態)
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
        const petName = this.petData.identity.name;
        this.add.text(40, 35, `🌿 ${petName}`, {
            fontSize: '20px',
            color: '#e8d8c8',
            fontStyle: 'bold'
        });

        const statusText = this.petData.symptoms.dull_skin 
            ? "狀態：神情略顯疲倦..." 
            : "狀態：正好奇地探頭探腦";

        this.statusLabel = this.add.text(40, 65, statusText, {
            fontSize: '14px',
            color: '#b8a695'
        });

        // 右下角：極簡互動功能按鈕 (手繪筆記風格)
        const btnY = height - 60;
        
        this.createUIButton(width - 240, btnY, "🔍 觀察診斷", () => {
            console.log("開啟自然科學觀察診斷日誌");
        });

        this.createUIButton(width - 150, btnY, "⛏️ 挖掘探索", () => {
            console.log("切換至地下剖面探勘視角");
            window.ReserveZoneSystem.switchToCrossSectionView(this);
        });

        this.createUIButton(width - 60, btnY, "🔬 研究所", () => {
            console.log("打開科研與解鎖選單");
        });
    }

    createUIButton(x, y, text, callback) {
        const btn = this.add.text(x, y, text, {
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#4a382a',
            padding: { x: 10, y: 8 }
        }).setInteractive();

        btn.on('pointerdown', callback);
        btn.on('pointerover', () => btn.setStyle({ color: '#ffd59e' }));
        btn.on('pointerout', () => btn.setStyle({ color: '#ffffff' }));
    }

    /**
     * 點擊寵物時的親密互動反應
     */
    onPetClicked() {
        // 輕微跳躍動畫與愛心/好奇反應
        this.tweens.add({
            targets: this.petContainer,
            scaleY: 1.15,
            scaleX: 0.9,
            duration: 120,
            yoyo: true,
            ease: 'Quad.easeOut'
        });

        this.statusLabel.setText(`狀態：${this.petData.identity.name} 注意到了你，輕輕動了動嘴唇！`);
    }
}

window.UndergroundScene = UndergroundScene;