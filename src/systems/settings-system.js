
// 鱗片與種子：地下生態物語
// Unified Settings System
// 統一遊戲設定管理系統

import { LanguageSystem } from './language-system.js';

export class SettingsSystem {

    static STORAGE_KEY = 'scales_seeds_settings';

    static DEFAULT_SETTINGS = {

        language: 'en',

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

        animationsEnabled: true,
        nightModeEnabled: false,
        powerSavingEnabled: false,

        operationTipsEnabled: true
    };

    static settings = null;
    static languageListenerRegistered = false;

    // 取得完整預設設定
    static getDefaults() {
        return { ...this.DEFAULT_SETTINGS };
    }

    // 註冊語言同步
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

            const language =
                event.detail?.language ||
                LanguageSystem.getLanguage();

            this.settings.language = language;

            this.save();
        });

        this.languageListenerRegistered = true;
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

        this.settings = {
            ...this.getDefaults(),
            ...savedSettings
        };

        // 數值安全檢查
        this.settings.screenScale = this.clamp(
            this.settings.screenScale,
            0.8,
            1.2,
            1
        );

        this.settings.textSize = this.clamp(
            this.settings.textSize,
            0.8,
            1.3,
            1
        );

        // 四個頻道的音量安全檢查
        const volumeKeys = [
            'backgroundMusicVolume',
            'ambientSoundVolume',
            'npcMusicVolume',
            'soundEffectsVolume'
        ];

        volumeKeys.forEach(key => {

            this.settings[key] = this.clamp(
                this.settings[key],
                0,
                1,
                this.DEFAULT_SETTINGS[key]
            );

        });

        // 四個頻道的開關安全檢查
        const toggleKeys = [
            'backgroundMusicEnabled',
            'ambientSoundEnabled',
            'npcMusicEnabled',
            'soundEffectsEnabled',
            'animationsEnabled',
            'nightModeEnabled',
            'powerSavingEnabled',
            'operationTipsEnabled'
        ];

        toggleKeys.forEach(key => {

            if (typeof this.settings[key] !== 'boolean') {
                this.settings[key] = this.DEFAULT_SETTINGS[key];
            }

        });

        // 語言以 LanguageSystem 為準
        this.settings.language = LanguageSystem.getLanguage();

        this.registerLanguageListener();

        // 將新增的預設欄位補進舊設定
        this.save();

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

            window.dispatchEvent(
                new CustomEvent('settingsChanged', {
                    detail: this.getSettings()
                })
            );

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

    // 修改單一設定
    static set(key, value) {

        if (!this.settings) {
            this.load();
        }

        if (!(key in this.DEFAULT_SETTINGS)) {

            console.warn(
                '[SettingsSystem] 未知設定項目：',
                key
            );

            return false;
        }

        // 音量與畫面數值限制
        const numericRules = {
            screenScale: [0.8, 1.2, 1],
            textSize: [0.8, 1.3, 1],
            backgroundMusicVolume: [0, 1, 0.8],
            ambientSoundVolume: [0, 1, 0.7],
            npcMusicVolume: [0, 1, 0.8],
            soundEffectsVolume: [0, 1, 0.8]
        };

        if (numericRules[key]) {

            const [min, max, fallback] = numericRules[key];

            value = this.clamp(value, min, max, fallback);
        }

        // 布林設定檢查
        if (typeof this.DEFAULT_SETTINGS[key] === 'boolean') {

            if (typeof value !== 'boolean') {
                return false;
            }
        }

        // 語言設定交由 LanguageSystem 管理
        if (key === 'language') {

            LanguageSystem.setLanguage(value);

            this.settings.language = LanguageSystem.getLanguage();

            return this.save();
        }

        this.settings[key] = value;

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

        Object.entries(values).forEach(([key, value]) => {

            if (!(key in this.DEFAULT_SETTINGS)) return;

            const numericRules = {
                screenScale: [0.8, 1.2, 1],
                textSize: [0.8, 1.3, 1],
                backgroundMusicVolume: [0, 1, 0.8],
                ambientSoundVolume: [0, 1, 0.7],
                npcMusicVolume: [0, 1, 0.8],
                soundEffectsVolume: [0, 1, 0.8]
            };

            if (numericRules[key]) {

                const [min, max, fallback] = numericRules[key];

                value = this.clamp(value, min, max, fallback);
            }

            if (
                typeof this.DEFAULT_SETTINGS[key] === 'boolean' &&
                typeof value !== 'boolean'
            ) {
                return;
            }

            if (key === 'language') {
                LanguageSystem.setLanguage(value);
                this.settings.language = LanguageSystem.getLanguage();
                changed = true;
                return;
            }

            this.settings[key] = value;
            changed = true;
        });

        return changed ? this.save() : false;
    }

    // 恢復預設設定
    static reset() {

        this.settings = this.getDefaults();

        LanguageSystem.setLanguage('en');

        this.settings.language = LanguageSystem.getLanguage();

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
window.SettingsSystem = SettingsSystem;
