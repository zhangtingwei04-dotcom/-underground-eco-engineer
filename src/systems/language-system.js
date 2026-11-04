
// 鱗片與種子：地下生態物語
// Unified Language System
// 支援 10 種語言、自動偵測、JSON 字典與舊版相容

export class LanguageSystem {

    static STORAGE_KEY = 'scales_seeds_language';
    static MANUAL_KEY = 'scales_seeds_language_manual';

    static DEFAULT_LANGUAGE = 'en';

    static SUPPORTED_LANGUAGES = [
        'zh-TW',
        'zh-CN',
        'en',
        'ja',
        'ko',
        'th',
        'fr',
        'de',
        'es',
        'pt-BR'
    ];

    static dictionaries = {};
    static initialized = false;
    static loadingPromise = null;

    // 保留舊版登入畫面翻譯
    static translations = {
        en: {
            gameTitle: 'Scales & Seeds',
            gameSubtitle: 'Underground Ecosystem Tales',
            welcome: 'Welcome to Your Underground World',
            welcomeMessage: 'Every scale tells a story. Every seed holds the promise of life.',
            startExploring: 'Start Exploring',
            login: 'Log In',
            createAccount: 'Create Account',
            logout: 'Log Out',
            email: 'Email Address',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            language: 'Language',
            english: 'English',
            traditionalChinese: 'Traditional Chinese',
            continueAsGuest: 'Continue as Guest',
            back: 'Back',
            confirm: 'Confirm',
            cancel: 'Cancel',
            loading: 'Loading...',
            loginSuccess: 'Login successful!',
            loginFailed: 'Login failed. Please try again.',
            registerSuccess: 'Account created successfully!',
            registerFailed: 'Account registration failed.',
            guestMode: 'Guest Mode',
            cloudSave: 'Cloud Save',
            localSave: 'Local Save',
            settings: 'Settings',
            saveSettings: 'Save Settings'
        },

        'zh-TW': {
            gameTitle: '鱗片與種子',
            gameSubtitle: '地下生態物語',
            welcome: '歡迎來到你的地下生態世界',
            welcomeMessage: '每一片鱗片，都有自己的故事；每一顆種子，都蘊藏著生命。',
            startExploring: '開始探索',
            login: '登入帳號',
            createAccount: '建立新帳號',
            logout: '登出',
            email: '電子郵件',
            password: '密碼',
            confirmPassword: '確認密碼',
            language: '語言',
            english: '英文',
            traditionalChinese: '繁體中文',
            continueAsGuest: '以訪客身分繼續',
            back: '返回',
            confirm: '確認',
            cancel: '取消',
            loading: '載入中...',
            loginSuccess: '登入成功！',
            loginFailed: '登入失敗，請重新嘗試。',
            registerSuccess: '帳號建立成功！',
            registerFailed: '帳號註冊失敗。',
            guestMode: '訪客模式',
            cloudSave: '雲端存檔',
            localSave: '本機存檔',
            settings: '設定',
            saveSettings: '儲存設定'
        }
    };

    // 對照瀏覽器語言代碼
    static detectDeviceLanguage() {

        let candidates = [];

        try {
            candidates = navigator.languages?.length
                ? navigator.languages
                : [navigator.language || 'en'];
        } catch (error) {
            return this.DEFAULT_LANGUAGE;
        }

        for (const candidate of candidates) {

            const code = String(candidate).replace('_', '-');
            const lower = code.toLowerCase();

            if (lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-mo') {
                return 'zh-TW';
            }

            if (lower === 'zh-cn' || lower === 'zh-sg') {
                return 'zh-CN';
            }

            const exact = this.SUPPORTED_LANGUAGES.find(
                lang => lang.toLowerCase() === lower
            );

            if (exact) {
                return exact;
            }

            const base = lower.split('-')[0];

            const baseMap = {
                en: 'en',
                ja: 'ja',
                ko: 'ko',
                th: 'th',
                fr: 'fr',
                de: 'de',
                es: 'es',
                pt: 'pt-BR'
            };

            if (baseMap[base]) {
                return baseMap[base];
            }
        }

        return this.DEFAULT_LANGUAGE;
    }

    // 首次啟動時決定語言
    static getLanguage() {

        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);

            if (
                saved &&
                this.SUPPORTED_LANGUAGES.includes(saved)
            ) {
                return saved;
            }

        } catch (error) {
            console.warn('[LanguageSystem] 無法讀取語言設定', error);
        }

        return this.detectDeviceLanguage();
    }

    // 設定語言並記錄為玩家手動選擇
    static setLanguage(language) {

        if (!this.SUPPORTED_LANGUAGES.includes(language)) {
            console.warn('[LanguageSystem] 不支援的語言:', language);
            return false;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, language);
            localStorage.setItem(this.MANUAL_KEY, 'true');
        } catch (error) {
            console.warn('[LanguageSystem] 語言設定無法儲存:', error);
        }

        window.dispatchEvent(
            new CustomEvent('languageChanged', {
                detail: { language }
            })
        );

        return true;
    }

    // 載入 JSON 字典
    static async initialize() {

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {

            const languages = this.SUPPORTED_LANGUAGES;

            for (const language of languages) {

                try {
                    const response = await fetch(
                        `src/locales/${language}.json`
                    );

                    if (!response.ok) {
                        continue;
                    }

                    this.dictionaries[language] =
                        await response.json();

                } catch (error) {
                    console.warn(
                        `[LanguageSystem] 無法載入 ${language}`,
                        error
                    );
                }
            }

            this.initialized = true;

            console.log(
                '[LanguageSystem] 語言系統初始化完成',
                Object.keys(this.dictionaries)
            );

            return true;
        })();

        return this.loadingPromise;
    }

    // 取得巢狀 JSON 文字
    static getNestedValue(dictionary, key) {

        if (!dictionary || !key) {
            return undefined;
        }

        return String(key)
            .split('.')
            .reduce((current, part) => {

                if (
                    current &&
                    Object.prototype.hasOwnProperty.call(current, part)
                ) {
                    return current[part];
                }

                return undefined;

            }, dictionary);
    }

    // 統一翻譯入口，支援巢狀及舊版 key
    static t(key, variables = {}) {

        const language = this.getLanguage();

        const currentDictionary =
            this.dictionaries[language];

        const englishDictionary =
            this.dictionaries.en;

        let value = this.getNestedValue(
            currentDictionary,
            key
        );

        if (value === undefined) {
            value = this.getNestedValue(
                englishDictionary,
                key
            );
        }

        // 舊版登入畫面字典相容
        if (value === undefined) {
            value = this.translations[language]?.[key];
        }

        if (value === undefined) {
            value = this.translations.en?.[key];
        }

        if (typeof value !== 'string') {
            return value === undefined ? key : value;
        }

        // 替換 {name} 等文字變數
        return value.replace(/\{(\w+)\}/g, (match, name) => {
            return variables[name] !== undefined
                ? String(variables[name])
                : match;
        });
    }

    // 舊版相容
    static isEnglish() {
        return this.getLanguage() === 'en';
    }

    static isTraditionalChinese() {
        return this.getLanguage() === 'zh-TW';
    }

    static getAvailableLanguages() {

        const names = {
            'zh-TW': '繁體中文',
            'zh-CN': '简体中文',
            en: 'English',
            ja: '日本語',
            ko: '한국어',
            th: 'ไทย',
            fr: 'Français',
            de: 'Deutsch',
            es: 'Español',
            'pt-BR': 'Português (Brasil)'
        };

        return this.SUPPORTED_LANGUAGES.map(code => ({
            code,
            name: names[code]
        }));
    }
}

// 保留舊版全域 gameLocales API
window.gameLocales = {
    translate(key, variables = {}) {
        return LanguageSystem.t(key, variables);
    },

    switchLanguage(language) {
        return LanguageSystem.setLanguage(language);
    },

    initialize() {
        return LanguageSystem.initialize();
    },

    get currentLanguage() {
        return LanguageSystem.getLanguage();
    }
};
