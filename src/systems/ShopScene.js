// 鱗片與種子：地下生態物語 | Scales & Seeds: Underground Ecosystem Tales
// 場景：商店與老馬克的爬蟲小店 (Shop Scene)

class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    create() {
        // 1. 背景與標題
        this.add.rectangle(400, 300, 800, 600, 0x1a2e26); // 沉浸式暗綠色系 (Cozy Terrarium style)
        
        this.add.text(400, 50, '鱗片與種子：老馬克的爬蟲小店', {
            fontSize: '28px',
            fill: '#d4af37',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // 2. 模擬讀取玩家存檔與今日進貨
        if (!window.playerSaveData) {
            window.playerSaveData = { wallet: { coins: 1000, crystals: 20 }, owned_creatures: [] };
        }

        const speciesMockList = [
            { id: "hognose_normal", species_name_zh: "西部豬鼻蛇 (標準型)", base_price: 250, morphs: [{ id: "normal", name_zh: "野生型", color_tint: "#8b5a2b", blotch_tint: "#3e2723" }] },
            { id: "ball_python", species_name_zh: "球蟒 (標準型)", base_price: 400, morphs: [{ id: "normal", name_zh: "正常蟒紋", color_tint: "#d2b48c", blotch_tint: "#5c4033" }] }
        ];

        // 取得今日進貨清單
        const dailyStockData = window.ShopDailyStockSystem ? 
            window.ShopDailyStockSystem.getDailyStock(speciesMockList, window.playerSaveData) : { stock_items: [] };

        // 3. 繪製今日進貨商品卡片
        this.renderStockItems(dailyStockData.stock_items);

        // 4. 返回按鈕
        const backButton = this.add.text(700, 50, '[ 離開商店 ]', {
            fontSize: '18px',
            fill: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 }
        }).setInteractive().on('pointerdown', () => {
            this.scene.start('UndergroundScene'); // 返回地下主場景
        });
    }

    renderStockItems(items) {
        let startY = 150;

        if (!items || items.length === 0) {
            this.add.text(400, 300, '今日架上暫無進貨，請稍後再來或使用預購功能。', {
                fontSize: '18px',
                fill: '#cccccc'
            }).setOrigin(0.5);
            return;
        }

        items.forEach((item, index) => {
            const cardBg = this.add.rectangle(400, startY + (index * 90), 600, 75, 0x2e4f4f);
            cardBg.setStrokeStyle(2, item.is_purchased ? 0x555555 : 0xd4af37);

            const infoText = `${item.species_name_zh}  |  售價: ${item.price} 金幣  ${item.is_purchased ? '(已售出)' : ''}`;
            const textObj = this.add.text(120, startY + (index * 90) - 12, infoText, {
                fontSize: '16px',
                fill: item.is_purchased ? '#888888' : '#ffffff'
            });

            if (!item.is_purchased) {
                const buyBtn = this.add.text(620, startY + (index * 90) - 12, ' 購買 ', {
                    fontSize: '16px',
                    fill: '#000000',
                    backgroundColor: '#d4af37',
                    padding: { x: 8, y: 4 }
                }).setInteractive().on('pointerdown', () => {
                    const result = window.ShopSystem.buyDailyStockItem(item.stock_id, window.playerSaveData);
                    alert(result.message_zh);
                    if (result.success) {
                        this.scene.restart(); // 重新整理場景畫面
                    }
                });
            }
        });
    }
}