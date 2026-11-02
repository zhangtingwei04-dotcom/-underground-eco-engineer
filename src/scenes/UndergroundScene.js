// 鱗片與種子：地下生態物語 | 地下主場景
class UndergroundScene extends Phaser.Scene {
    constructor() {
        super('UndergroundScene');
    }

    preload() {
        // 資源預載入
    }

    create() {
        // 初始化地下生態世界
        const textStyle = { font: '24px Arial', fill: '#ffffff' };
        this.add.text(50, 50, 'Scales & Seeds: Underground Ecosystem Tales', textStyle);
        this.add.text(50, 90, 'Alpha 2.0 - 系統運行中', { font: '18px Arial', fill: '#88cc88' });
    }

    update(time, delta) {
        // 核心更新循環
    }
}

// 掛載至全域以供 main.js 讀取
window.UndergroundScene = UndergroundScene;