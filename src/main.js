// 地下生態工程師 | Underground Eco-Engineer
// 遊戲主程式與 Phaser 3 環境初始化設定

// 1. 遊戲核心設定
const config = {
    type: Phaser.AUTO, // 自動選擇 WebGL 或 Canvas 渲染
    width: 800,        // 依健檢報告建議，設定適合側視剖面的寬度
    height: 600,       // 設定高度以容納地下地層與下方操作 UI
    parent: 'game-container', // 指定嵌入到 index.html 的容器中
    backgroundColor: '#3d2817', // 使用地底泥土風格的深褐色背景
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// 2. 啟動 Phaser 遊戲實例
const game = new Phaser.Game(config);

// 3. 預先載入資源階段 (Preload)
function preload() {
    console.log("【系統】開始載入遊戲資源...");
    // 未來在這裡載入豬鼻蛇精靈圖與方塊貼圖
    // this.load.image('hognose', 'assets/creatures/hognose.png');
}

// 4. 建立遊戲世界階段 (Create)
function create() {
    console.log("【系統】Phaser 遊戲環境初始化成功！");
    
    // 在畫面上印出遊戲標題文字（測試用）
    this.add.text(20, 20, "Underground Eco-Engineer", { 
        font: "28px Arial", 
        fill: "#ffffff",
        weight: "bold"
    });

    this.add.text(20, 60, "Alpha 0.1 - 地下世界初始化中...", { 
        font: "16px Arial", 
        fill: "#a8907c" 
    });

    // 畫出一個代表地底剖面的基礎矩形矩陣（模擬中央地下世界）
    let graphics = this.add.graphics();
    graphics.fillStyle(0x5c4033, 1); // 泥土色
    graphics.fillRect(50, 150, 700, 300);

    this.add.text(60, 160, "[中央地下世界區域 - 待地圖生成系統實作]", {
        font: "14px Arial",
        fill: "#ffffff"
    });
}

// 5. 遊戲每影更新邏輯 (Update)
function update() {
    // 處理生物動畫、精力動態恢復或滑鼠即時偵測
}
