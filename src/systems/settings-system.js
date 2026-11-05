
// 鱗片與種子：地下生態物語
// Settings System Version 2.2
// Local Storage + Audio + Display + Language

import { LanguageSystem } from './language-system.js';

export class SettingsSystem {

    static STORAGE_KEY = 'scales_seeds_settings';

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

    static NUMERIC_RULES = {
        screenScale: { min: 0.8, max: 1.2, step: 0.05 },
        textSize: { min: 0.8, max: 1.3, step: 0.05 },

        backgroundMusicVolume: { min: 0, max: 1, step: 0.1 },
        ambientSoundVolume: { min: 0, max: 1, step: 0.1 },
        npcMusicVolume: { min: 0, max: 1, step: 0.1 },
        creatureSoundVolume: { min: 0, max: 1, step: 0.1 },
        soundEffectsVolume: { min: 0, max: 1, step: 0.1 }
    };

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

    // 初始化設定
    static load() {

        if (this.loaded && this.settings) {
            return this.settings;
        }

        let savedSettings = {};

        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);

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
            this.settings.language = LanguageSystem.getLanguage();
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

    static ensureLoaded() {
        if (!this.loaded || !this.settings) {
            this.load();
        }
    }

    static sanitizeAll() {

        for (const key of Object.keys(this.DEFAULT_SETTINGS)) {
            if (this.settings[key] === undefined) {
                this.settings[key] = this.DEFAULT_SETTINGS[key];
            }
        }

        for (const key of Object.keys(this.NUMERIC_RULES)) {
            this.settings[key] = this.clamp(
                key,
                this.settings[key]
            );
        }

        for (const key of this.BOOLEAN_KEYS) {
            this.settings[key] = Boolean(this.settings[key]);
        }

        if (
            !LanguageSystem.SUPPORTED_LANGUAGES.includes(
                this.settings.language
            )
        ) {
            this.settings.language = this.DEFAULT_SETTINGS.language;
        }
    }

    static clamp(key, value) {

        const rule = this.NUMERIC_RULES[key];

        if (!rule) {
            return value;
        }

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

    static get(key) {
        this.ensureLoaded();
        return this.settings[key];
    }

    // 相容舊版及新版呼叫名稱
    static getAll() {
        this.ensureLoaded();
        return { ...this.settings };
    }

    static getSettings() {
        return this.getAll();
    }

    static set(key, value) {

        this.ensureLoaded();

        if (!Object.prototype.hasOwnProperty.call(
            this.DEFAULT_SETTINGS,
            key
        )) {
            console.warn(
                '[SettingsSystem] 未知設定項目:',
                key
            );
            return false;
        }

        if (key === 'language') {
            return LanguageSystem.setLanguage(value);
        }

        if (Object.prototype.hasOwnProperty.call(
            this.NUMERIC_RULES,
            key
        )) {
            value = this.clamp(key, value);
        }

        if (this.BOOLEAN_KEYS.includes(key)) {
            value = Boolean(value);
        }

        this.settings[key] = value;

        this.save();

        return true;
    }

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

        for (const [key, value] of Object.entries(values)) {

            if (!Object.prototype.hasOwnProperty.call(
                this.DEFAULT_SETTINGS,
                key
            )) {
                continue;
            }

            if (key === 'language') {
                languageChanged = true;
                continue;
            }

            if (Object.prototype.hasOwnProperty.call(
                this.NUMERIC_RULES,
                key
            )) {
                this.settings[key] = this.clamp(key, value);
                continue;
            }

            if (this.BOOLEAN_KEYS.includes(key)) {
                this.settings[key] = Boolean(value);
                continue;
            }

            this.settings[key] = value;
        }

        this.save();

        if (languageChanged) {
            LanguageSystem.setLanguage(values.language);
        }

        return true;
    }

    static reset() {

        this.ensureLoaded();

        this.settings = {
            ...this.DEFAULT_SETTINGS
        };

        this.save();

        LanguageSystem.setLanguage(
            this.DEFAULT_SETTINGS.language
        );

        console.log(
            '[SettingsSystem] 已恢復預設設定'
        );

        return true;
    }

    static save() {

        if (!this.settings) {
            return false;
        }

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

    static registerLanguageListener() {

        if (typeof window === 'undefined') {
            return;
        }

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

            if (!LanguageSystem.SUPPORTED_LANGUAGES.includes(
                language
            )) {
                return;
            }

            if (!this.settings) {
                return;
            }

            this.settings.language = language;
            this.save();
        };

        window.addEventListener(
            'languageChanged',
            this.languageListener
        );
    }

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
