
// 鱗片與種子：地下生態物語
// Unified Settings System
// 統一遊戲設定管理系統
// Version 2.0

import { LanguageSystem } from './language-system.js';

export class SettingsSystem {

    static STORAGE_KEY = 'scales_seeds_settings';

    // 所有設定的預設值
    static DEFAULT_SETTINGS = {

        language: 'en',

        // 畫面設定
        screenScale: 1,
        textSize: 1,

        // 頻道一：背景音樂
        backgroundMusicEnabled: true,
        backgroundMusicVolume: 0.8,

        // 頻道二：環境音
        ambientSoundEnabled: true,
        ambientSoundVolume: 0.7,

        // 頻道三：NPC 特殊音樂
        npcMusicEnabled: true,
        npcMusicVolume: 0.8,

        // 頻道四：遊戲音效
        soundEffectsEnabled: true,
        soundEffectsVolume: 0.8,

        // 頻道五：爬蟲與兩棲動物聲音
        creatureSoundEnabled: true,
        creatureSoundVolume: 0.7,

        // 系統設定
        animationsEnabled: true,
        nightModeEnabled: false,
        powerSavingEnabled: false,

        // 操作設定
        operationTipsEnabled: true
    };

    static settings = null;
    static languageListenerRegistered = false;

    // 數值設定範圍
    static NUMERIC_RULES = {
        screenScale: [0.8, 1.2, 1],
        textSize: [0.8, 1.3, 1],

        backgroundMusicVolume: [0, 1, 0.8],
        ambientSoundVolume: [0, 1, 0.7],
        npcMusicVolume: [0, 1, 0.8],
        soundEffectsVolume: [0, 1, 0.8],
        creatureSoundVolume: [0, 1, 0.7]
    };

    // 布林設定
    static BOOLEAN_KEYS = [
        'backgroundMusicEnabled',
        'ambientSoundEnabled',
        'npcMusicEnabled',
        'soundEffectsEnabled',
        'creatureSoundEnabled',

        'animationsEnabled',
        'nightModeEnabled',
        'powerSavingEnabled',

        'operationTipsEnabled'
    ];

    // 支援語言
    static getSupportedLanguages() {

        const languages = LanguageSystem.SUPPORTED_LANGUAGES;

        return Array.isArray(languages)
            ? languages
            : ['zh-TW', 'zh-CN', 'en', 'ja', 'ko',
               'th', 'fr', 'de', 'es', 'pt-BR'];
    }

    // 檢查語言是否合法
    static isValidLanguage(language) {

        return this.getSupportedLanguages().includes(language);
    }

    // 取得預設設定
    static getDefaults() {

        return { ...this.DEFAULT_SETTINGS };
    }

    // 註冊語言同步監聽
    static registerLanguageListener() {

        if (
            this.languageListenerRegistered ||
            typeof window === 'undefined'
        ) {
            return;
        }

        window.addEventListener('languageChanged', event => {

            if (!this.settings) {
                this.settings = this.getDefaults();
            }

            const eventLanguage =
                typeof event.detail === 'string'
                    ? event.detail
                    : event.detail?.language;

            const language = this.isValidLanguage(eventLanguage)
                ? eventLanguage
                : LanguageSystem.getLanguage();

            if (!this.isValidLanguage(language)) {
                return;
            }

            // 只有語言真的改變時才儲存
            if (this.settings.language !== language) {

                this.settings.language = language;

                this.save();
            }
        });

        this.languageListenerRegistered = true;
    }

    // 整理並驗證設定資料
    static sanitizeSettings(settings) {

        const result = {
            ...this.getDefaults(),
            ...settings
        };

        // 數值設定檢查
        Object.entries(this.NUMERIC_RULES).forEach(
            ([key, rule]) => {

                const [min, max, fallback] = rule;

                result[key] = this.clamp(
                    result[key],
                    min,
                    max,
                    fallback
                );
            }
        );

        // 布林設定檢查
        this.BOOLEAN_KEYS.forEach(key => {

            if (typeof result[key] !== 'boolean') {

                result[key] = this.DEFAULT_SETTINGS[key];
            }
        });

        // 語言檢查
        if (!this.isValidLanguage(result.language)) {

            result.language = this.DEFAULT_SETTINGS.language;
        }

        return result;
    }

    // 讀取設定
    static load() {

        let savedSettings = {};

        try {

            const raw = localStorage.getItem(
                this.STORAGE_KEY
            );

            if (raw) {

                const parsed = JSON.parse(raw);

                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    !Array.isArray(parsed)
                ) {
                    savedSettings = parsed;
                }
            }

        } catch (error) {

            console.error(
                '[SettingsSystem] 設定讀取失敗：',
                error
            );
        }

        // 合併舊設定與新設定
        this.settings = this.sanitizeSettings(
            savedSettings
        );

        // 語言由 LanguageSystem 統一管理
        const currentLanguage = LanguageSystem.getLanguage();

        if (this.isValidLanguage(currentLanguage)) {

            this.settings.language = currentLanguage;
        }

        // 註冊語言監聽
        this.registerLanguageListener();

        // 儲存補齊後的設定
        this.save();

        console.log(
            '[SettingsSystem] 設定載入完成',
            this.getSettings()
        );

        return this.getSettings();
    }

    // 儲存設定
    static save() {

        if (!this.settings) {

            this.settings = this.getDefaults();
        }

        try {

            localStorage.setItem(
                this.STORAGE_KEY,
                JSON.stringify(this.settings)
            );

            if (typeof window !== 'undefined') {

                window.dispatchEvent(
                    new CustomEvent('settingsChanged', {
                        detail: this.getSettings()
                    })
                );
            }

            return true;

        } catch (error) {

            console.error(
                '[SettingsSystem] 設定儲存失敗：',
                error
            );

            return false;
        }
    }

    // 取得全部設定
    static getSettings() {

        if (!this.settings) {

            this.load();
        }

        return { ...this.settings };
    }

    // 取得單一設定
    static get(key) {

        if (!this.settings) {

            this.load();
        }

        return this.settings[key];
    }

    // 驗證單一設定值
    static validateValue(key, value) {

        if (!(key in this.DEFAULT_SETTINGS)) {

            console.warn(
                '[SettingsSystem] 未知設定項目：',
                key
            );

            return {
                valid: false,
                value: undefined
            };
        }

        // 數值檢查
        if (this.NUMERIC_RULES[key]) {

            const [min, max, fallback] =
                this.NUMERIC_RULES[key];

            return {
                valid: true,
                value: this.clamp(
                    value,
                    min,
                    max,
                    fallback
                )
            };
        }

        // 布林檢查
        if (this.BOOLEAN_KEYS.includes(key)) {

            if (typeof value !== 'boolean') {

                return {
                    valid: false,
                    value: undefined
                };
            }

            return {
                valid: true,
                value
            };
        }

        // 語言檢查
        if (key === 'language') {

            if (!this.isValidLanguage(value)) {

                console.warn(
                    '[SettingsSystem] 不支援的語言：',
                    value
                );

                return {
                    valid: false,
                    value: undefined
                };
            }

            return {
                valid: true,
                value
            };
        }

        return {
            valid: false,
            value: undefined
        };
    }

    // 修改單一設定
    static set(key, value) {

        if (!this.settings) {

            this.load();
        }

        const result = this.validateValue(
            key,
            value
        );

        if (!result.valid) {

            return false;
        }

        // 語言交由 LanguageSystem 管理
        if (key === 'language') {

            if (
                LanguageSystem.getLanguage() === result.value
            ) {
                this.settings.language = result.value;
                return this.save();
            }

            LanguageSystem.setLanguage(result.value);

            this.settings.language =
                LanguageSystem.getLanguage();

            return this.save();
        }

        this.settings[key] = result.value;

        return this.save();
    }

    // 修改多個設定
    static setMultiple(values) {

        if (
            !values ||
            typeof values !== 'object' ||
            Array.isArray(values)
        ) {
            return false;
        }

        if (!this.settings) {

            this.load();
        }

        let changed = false;
        let languageToSet = null;

        Object.entries(values).forEach(([key, value]) => {

            const result = this.validateValue(
                key,
                value
            );

            if (!result.valid) return;

            if (key === 'language') {

                languageToSet = result.value;
                return;
            }

            if (this.settings[key] !== result.value) {

                this.settings[key] = result.value;

                changed = true;
            }
        });

        // 最後才處理語言，避免中途重複儲存
        if (languageToSet !== null) {

            if (
                LanguageSystem.getLanguage() !== languageToSet
            ) {

                LanguageSystem.setLanguage(languageToSet);
            }

            this.settings.language =
                LanguageSystem.getLanguage();

            changed = true;
        }

        return changed ? this.save() : false;
    }

    // 恢復全部預設設定
    static reset() {

        this.settings = this.getDefaults();

        // 語言恢復英文
        LanguageSystem.setLanguage('en');

        this.settings.language =
            LanguageSystem.getLanguage();

        console.log(
            '[SettingsSystem] 已恢復預設設定'
        );

        return this.save();
    }

    // 數值限制
    static clamp(value, min, max, fallback) {

        const number = Number(value);

        if (!Number.isFinite(number)) {

            return fallback;
        }

        return Math.min(
            max,
            Math.max(min, number)
        );
    }
}

// 掛載至全域
if (typeof window !== 'undefined') {

    window.SettingsSystem = SettingsSystem;
}
