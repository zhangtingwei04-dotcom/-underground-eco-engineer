// 地下生態工程師 - 遊戲全局設定配置檔 (Global Game Configuration)

window.GameConfig = {
    // 畫面與渲染設定
    gameOptions: {
        width: 800,
        height: 600,
        fps: 60,
        scaleMode: 'FIT' // 自動縮放以適應螢幕
    },

    // 玩家自訂初始設定 (預留存檔連結)
    playerSettings: {
        defaultLanguage: 'zh-TW', // 預設語言
        soundVolume: 0.8,         // 遊戲音量 (0.0 ~ 1.0)
        musicVolume: 0.5,         // 背景音樂音量
        autoSaveInterval: 60000   // 自動存檔時間間隔 (毫秒，預設1分鐘)
    },

    // 生態模擬環境基礎常數
    ecoBalance: {
        baseTemperature: 22.5,    // 地底基礎溫度 (°C)
        baseHumidity: 40,         // 地底基礎濕度 (%)
        energyRegenRate: 2,       // 豬鼻蛇基礎精力恢復值
        diggingEnergyCost: 10     // 每次挖掘消耗精力值
    },

    // 開發者除錯模式切換
    debugMode: {
        showFps: true,
        showHitboxes: false,      // 是否顯示 Phaser 物理碰撞外框
        infiniteEnergy: false     // 測試用：無限精力模式開關
    }
};

console.log("【設定系統】全局遊戲配置配置檔 GameConfig 載入成功。");
