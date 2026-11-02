// 地下生態工程師 - 雙語即時切換管理系統 (Locales Loader)

/**
 * 語系管理器類別，負責控管遊戲內所有多語言文字的切換
 */
class LocalesLoader {
    constructor() {
        this.currentLanguage = 'zh-TW'; // 預設使用繁體中文
        this.dictionaries = {
            'zh-TW': null,
            'en': null
        };
    }

    /**
     * 初始化並加載所有語言字典檔（串接專案內的 json 檔案）
     */
    async initialize() {
        console.log("【語系系統】正在初始化中英雙語字典...");
        try {
            // 在實際 Phaser 運行環境中，透過 fetch 讀取我們在專案中建立的 json 檔案
            const resZh = await fetch('src/locales/zh-TW.json');
            this.dictionaries['zh-TW'] = await resZh.json();

            const resEn = await fetch('src/locales/en.json');
            this.dictionaries['en'] = await resEn.json();
            
            console.log("【語系系統】中英雙語字典加載成功！");
            return true;
        } catch (error) {
            console.warn("【語系系統】本地加載失敗，啟動記憶體內建備用翻譯包。");
            this.loadMockDictionaries();
            return false;
        }
    }

    /**
     * 即時切換遊戲語言
     * @param {string} langCode - 'zh-TW' 或 'en'
     */
    switchLanguage(langCode) {
        if (this.dictionaries[langCode]) {
            this.currentLanguage = langCode;
            console.log(`【語系系統】成功切換語系至: ${langCode}`);
            return true;
        }
        console.error(`【語系系統】不支援的語系代碼: ${langCode}`);
        return false;
    }

    /**
     * 核心翻譯函式：根據 Key 值抓取對應語言的字串
     * @param {string} key - 字典檔內的鍵值 (例如: "creature_hognose_desc")
     * @returns {string} 翻譯後的文字
     */
    translate(key) {
        const dict = this.dictionaries[this.currentLanguage];
        if (dict && dict[key]) {
            return dict[key];
        }
        // 如果找不到對應的 Key，返回 Key 本身作為邊界保護，防止畫面變白
        return key; 
    }

    /**
     * 當環境無法 fetch 時的防禦底包
     */
    loadMockDictionaries() {
        this.dictionaries['zh-TW'] = {
            "game_title": "地下生態工程師",
            "menu_start": "開始遊戲",
            "stats_energy": "目前精力",
            "creature_hognose_snake": "豬鼻蛇",
            "block_sand_name": "沙土方塊"
        };
        this.dictionaries['en'] = {
            "game_title": "Underground Eco-Engineer",
            "menu_start": "Start Game",
            "stats_energy": "Current Energy",
            "creature_hognose_snake": "Hognose Snake",
            "block_sand_name": "Sand Block"
        };
    }
}

// 全域掛載，方便 main.js 直接調用
window.gameLocales = new LocalesLoader();
