// 鱗片與種子：地下生態物語
// Settings System Version 2.3
// Local Storage + Audio + Display + Language
// 即時設定通知整合版

import { LanguageSystem } from './language-system.js';

export class SettingsSystem {

    static STORAGE_KEY = 'scales_seeds_settings';

    // ==========================================
    // 預設設定
    // ==========================================

    static DEFAULT_SETTINGS = {

        language: 'en',

        screenScale: 1,
        textSize: 1,

        backgroundMusicEnabled: true,
        backgroundMusicVolume: 0.8,

        ambientSoundEnabled: true,
        ambientSoundVolume: 0.7,

        npcMusicEnabled: true,
        npcMusicVolume: 0.8,

        creatureSoundEnabled: true,
        creatureSoundVolume: 0.7,

        soundEffectsEnabled: true,
        soundEffectsVolume: 0.8,

        animationsEnabled: true,
        nightModeEnabled: false,
        powerSavingEnabled: false,
        operationTipsEnabled: true

    };

    // ==========================================
    // 數值範圍
    // ==========================================

    static NUMERIC_RULES = {

        // 畫面縮放：80%～120%
        screenScale: {
            min: 0.8,
            max: 1.2,
            step: 0.05
        },

        textSize: {
            min: 0.8,
            max: 1.3,
            step: 0.05
        },

        backgroundMusicVolume: {
            min: 0,
            max: 1,
            step: 0.1
        },

        ambientSoundVolume: {
            min: 0,
            max: 1,
            step: 0.1
        },

        npcMusicVolume: {
            min: 0,
            max: 1,
            step: 0.1
        },

        creatureSoundVolume: {
            min: 0,
            max: 1,
            step: 0.1
        },

        soundEffectsVolume: {
            min: 0,
            max: 1,
            step: 0.1
        }

    };

    // ==========================================
    // 布林設定
    // ==========================================

    static BOOLEAN_KEYS = [

        'backgroundMusicEnabled',
        'ambientSoundEnabled',
        'npcMusicEnabled',
        'creatureSoundEnabled',
        'soundEffectsEnabled',

        'animationsEnabled',
        'nightModeEnabled',
        'powerSavingEnabled',
        'operationTipsEnabled'

    ];

    static settings = null;

    static loaded = false;

    static languageListener = null;

    // ==========================================
    // 初始化設定
    // ==========================================

    static load() {

        if (this.loaded && this.settings) {
            return this.settings;
        }

        let savedSettings = {};

        try {

            const saved = localStorage.getItem(
                this.STORAGE_KEY
            );

            if (saved) {

                const parsed = JSON.parse(saved);

                if (
                    parsed &&
                    typeof parsed === 'object' &&
                    !Array.isArray(parsed)
                ) {

                    savedSettings = parsed;

                }

            }

        } catch (error) {

            console.warn(
                '[SettingsSystem] 讀取設定失敗，使用預設設定',
                error
            );

        }

        this.settings = {

            ...this.DEFAULT_SETTINGS,

            ...savedSettings

        };

        this.sanitizeAll();

        if (
            LanguageSystem &&
            typeof LanguageSystem.getLanguage === 'function'
        ) {

            this.settings.language =
                LanguageSystem.getLanguage();

        }

        this.loaded = true;

        this.registerLanguageListener();

        this.save();

        console.log(
            '[SettingsSystem] 設定初始化完成',
            this.settings
        );

        return this.settings;

    }

    // ==========================================
    // 確保設定已載入
    // ==========================================

    static ensureLoaded() {

        if (!this.loaded || !this.settings) {

            this.load();

        }

    }

    // ==========================================
    // 數值限制
    // ==========================================

    static clamp(key, value) {

        const rule = this.NUMERIC_RULES[key];

        if (!rule) return value;

        let number = Number(value);

        if (!Number.isFinite(number)) {

            number = this.DEFAULT_SETTINGS[key];

        }

        number = Math.max(
            rule.min,
            Math.min(rule.max, number)
        );

        const precision =
            String(rule.step).split('.')[1]?.length || 0;

        return Number(number.toFixed(precision));

    }

    // ==========================================
    // 整理所有設定
    // ==========================================

    static sanitizeAll() {

        for (const key of Object.keys(this.DEFAULT_SETTINGS)) {

            if (this.settings[key] === undefined) {

                this.settings[key] =
                    this.DEFAULT_SETTINGS[key];

            }

        }

        for (const key of Object.keys(this.NUMERIC_RULES)) {

            this.settings[key] = this.clamp(
                key,
                this.settings[key]
            );

        }

        for (const key of this.BOOLEAN_KEYS) {

            this.settings[key] =
                Boolean(this.settings[key]);

        }

        if (
            !LanguageSystem.SUPPORTED_LANGUAGES.includes(
                this.settings.language
            )
        ) {

            this.settings.language =
                this.DEFAULT_SETTINGS.language;

        }

    }

    // ==========================================
    // 取得單一設定
    // ==========================================

    static get(key) {

        this.ensureLoaded();

        return this.settings[key];

    }

    // ==========================================
    // 取得全部設定
    // ==========================================

    static getAll() {

        this.ensureLoaded();

        return {
            ...this.settings
        };

    }

    static getSettings() {

        return this.getAll();

    }

    // ==========================================
    // 發送設定變更通知
    // AudioSystem 會接收此事件
    // ==========================================

    static dispatchSettingsChanged(changedKey = null) {

        if (typeof window === 'undefined') return;

        try {

            window.dispatchEvent(

                new CustomEvent('settingsChanged', {

                    detail: {

                        key: changedKey,

                        settings: this.getAll(),

                        timestamp: Date.now()

                    }

                })

            );

        } catch (error) {

            console.warn(
                '[SettingsSystem] 設定通知發送失敗',
                error
            );

        }

    }

    // ==========================================
    // 修改單一設定
    // ==========================================

    static set(key, value) {

        this.ensureLoaded();

        if (
            !Object.prototype.hasOwnProperty.call(
                this.DEFAULT_SETTINGS,
                key
            )
        ) {

            console.warn(
                '[SettingsSystem] 未知設定項目：',
                key
            );

            return false;

        }

        if (key === 'language') {

            return LanguageSystem.setLanguage(value);

        }

        if (
            Object.prototype.hasOwnProperty.call(
                this.NUMERIC_RULES,
                key
            )
        ) {

            value = this.clamp(key, value);

        }

        if (this.BOOLEAN_KEYS.includes(key)) {

            value = Boolean(value);

        }

        this.settings[key] = value;

        this.save();

        this.dispatchSettingsChanged(key);

        return true;

    }

    // ==========================================
    // 批次修改設定
    // ==========================================

    static setMultiple(values = {}) {

        this.ensureLoaded();

        if (
            !values ||
            typeof values !== 'object' ||
            Array.isArray(values)
        ) {

            return false;

        }

        let languageChanged = false;

        const changedKeys = [];

        for (const [key, value] of Object.entries(values)) {

            if (
                !Object.prototype.hasOwnProperty.call(
                    this.DEFAULT_SETTINGS,
                    key
                )
            ) {

                continue;

            }

            if (key === 'language') {

                languageChanged = true;

                continue;

            }

            let newValue = value;

            if (
                Object.prototype.hasOwnProperty.call(
                    this.NUMERIC_RULES,
                    key
                )
            ) {

                newValue = this.clamp(key, value);

            }

            if (this.BOOLEAN_KEYS.includes(key)) {

                newValue = Boolean(value);

            }

            this.settings[key] = newValue;

            changedKeys.push(key);

        }

        this.save();

        this.dispatchSettingsChanged(changedKeys);

        if (languageChanged) {

            LanguageSystem.setLanguage(values.language);

        }

        return true;

    }

    // ==========================================
    // 恢復預設設定
    // ==========================================

    static reset() {

        this.ensureLoaded();

        this.settings = {
            ...this.DEFAULT_SETTINGS
        };

        this.save();

        LanguageSystem.setLanguage(
            this.DEFAULT_SETTINGS.language
        );

        this.dispatchSettingsChanged('reset');

        console.log(
            '[SettingsSystem] 已恢復預設設定'
        );

        return true;

    }

    // ==========================================
    // 儲存設定
    // ==========================================

    static save() {

        if (!this.settings) return false;

        try {

            localStorage.setItem(

                this.STORAGE_KEY,

                JSON.stringify(this.settings)

            );

            return true;

        } catch (error) {

            console.error(
                '[SettingsSystem] 儲存設定失敗',
                error
            );

            return false;

        }

    }

    // ==========================================
    // 語言變更監聽
    // ==========================================

    static registerLanguageListener() {

        if (typeof window === 'undefined') return;

        if (this.languageListener) {

            window.removeEventListener(
                'languageChanged',
                this.languageListener
            );

        }

        this.languageListener = event => {

            const language =
                event.detail?.language ||
                LanguageSystem.getLanguage();

            if (
                !LanguageSystem.SUPPORTED_LANGUAGES.includes(
                    language
                )
            ) {

                return;

            }

            if (!this.settings) return;

            this.settings.language = language;

            this.save();

            this.dispatchSettingsChanged('language');

        };

        window.addEventListener(
            'languageChanged',
            this.languageListener
        );

    }

    // ==========================================
    // 銷毀監聽
    // ==========================================

    static destroy() {

        if (
            typeof window !== 'undefined' &&
            this.languageListener
        ) {

            window.removeEventListener(
                'languageChanged',
                this.languageListener
            );

        }

        this.languageListener = null;

    }

}