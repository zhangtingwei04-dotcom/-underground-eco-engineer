
// 鱗片與種子：地下生態物語
// Unified Language System
// 10 Languages + Auto Detection + JSON Dictionaries

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

    // 舊版登入畫面翻譯相容
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

    // 舊版翻譯鍵值對照
    static LEGACY_KEY_MAP = {
        'game.title': 'gameTitle',
        'game.subtitle': 'gameSubtitle',
        'login.welcome': 'welcome',
        'login.welcome_message': 'welcomeMessage',
        'login.start_exploring': 'startExploring',
        'login.login': 'login',
        'login.create_account': 'createAccount'
    };

    // 偵測裝置語言
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

            if (
                lower === 'zh-tw' ||
                lower === 'zh-hk' ||
                lower === 'zh-mo'
            ) {
                return 'zh-TW';
            }

            if (
                lower === 'zh-cn' ||
                lower === 'zh-sg'
            ) {
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

    // 取得目前語言
    static getLanguage() {

        try {
            const saved = localStorage.getItem(
                this.STORAGE_KEY
            );

            if (
                saved &&
                this.SUPPORTED_LANGUAGES.includes(saved)
            ) {
                return saved;
            }

        } catch (error) {
            console.warn(
                '[LanguageSystem] 無法讀取語言設定',
                error
            );
        }

        return this.detectDeviceLanguage();
    }

    // 手動切換語言
    static setLanguage(language) {

        if (!this.SUPPORTED_LANGUAGES.includes(language)) {
            console.warn(
                '[LanguageSystem] 不支援的語言:',
                language
            );

            return false;
        }

        try {
            localStorage.setItem(
                this.STORAGE_KEY,
                language
            );

            localStorage.setItem(
                this.MANUAL_KEY,
                'true'
            );

        } catch (error) {
            console.warn(
                '[LanguageSystem] 語言設定無法儲存:',
                error
            );
        }

        window.dispatchEvent(
            new CustomEvent('languageChanged', {
                detail: { language }
            })
        );

        return true;
    }

    // 載入全部 JSON 語言字典
    static async initialize() {

        if (this.initialized) {
            return true;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = (async () => {

            const results = await Promise.all(
                this.SUPPORTED_LANGUAGES.map(
                    async language => {

                        try {
                            const response = await fetch(
                                `src/locales/${language}.json`
                            );

                            if (!response.ok) {
                                console.warn(
                                    `[LanguageSystem] ${language} 載入失敗：`,
                                    response.status
                                );

                                return false;
                            }

                            const dictionary = await response.json();

                            if (
                                !dictionary ||
                                typeof dictionary !== 'object' ||
                                Array.isArray(dictionary)
                            ) {
                                console.warn(
                                    `[LanguageSystem] ${language} 字典格式錯誤`
                                );

                                return false;
                            }

                            this.dictionaries[language] = dictionary;

                            console.log(
                                `[LanguageSystem] ${language} 載入成功`
                            );

                            return true;

                        } catch (error) {

                            console.warn(
                                `[LanguageSystem] 無法載入 ${language}`,
                                error
                            );

                            return false;
                        }
                    }
                )
            );

            this.initialized = true;

            if (typeof window !== 'undefined') {
                window.dispatchEvent(
                    new CustomEvent('languageDictionariesReady', {
                        detail: {
                            loaded: Object.keys(this.dictionaries),
                            successCount: results.filter(Boolean).length
                        }
                    })
                );
            }

            console.log(
                '[LanguageSystem] 初始化完成',
                '已載入語言：',
                Object.keys(this.dictionaries)
            );

            return true;

        })();

        try {
            return await this.loadingPromise;
        } finally {
            this.loadingPromise = null;
        }
    }

    // 讀取巢狀 JSON 欄位
    static getNestedValue(dictionary, key) {

        if (!dictionary || !key) {
            return undefined;
        }

        return String(key)
            .split('.')
            .reduce((current, part) => {

                if (
                    current &&
                    Object.prototype.hasOwnProperty.call(
                        current,
                        part
                    )
                ) {
                    return current[part];
                }

                return undefined;

            }, dictionary);
    }

    // 統一翻譯入口
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

        // 目前語言沒有時，使用英文字典
        if (value === undefined) {
            value = this.getNestedValue(
                englishDictionary,
                key
            );
        }

        // 舊版翻譯鍵值相容
        const legacyKey =
            this.LEGACY_KEY_MAP[key] || key;

        if (value === undefined) {
            value = this.translations[language]?.[legacyKey];
        }

        if (value === undefined) {
            value = this.translations.en?.[legacyKey];
        }

        if (typeof value !== 'string') {
            value = value === undefined
                ? key
                : String(value);
        }

        // 替換動態變數
        return value.replace(
            /\{(\w+)\}/g,
            (match, name) => {

                return variables[name] !== undefined
                    ? String(variables[name])
                    : match;

            }
        );
    }

    // 舊版相容 API
    static isEnglish() {
        return this.getLanguage() === 'en';
    }

    static isTraditionalChinese() {
        return this.getLanguage() === 'zh-TW';
    }

    // 取得可用語言
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

// 舊版全域 API
if (typeof window !== 'undefined') {

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
}
