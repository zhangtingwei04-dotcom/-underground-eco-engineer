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

        backgroundMusicEnabled: true,
        backgroundMusicVolume: 0.8,

        soundEffectsEnabled: true,
        soundEffectsVolume: 0.8,

        animationsEnabled: true,
        nightModeEnabled: false,
        powerSavingEnabled: false,

        operationTipsEnabled: true
    };

    static settings = null;

    // 取得完整預設設定
    static getDefaults() {
        return { ...this.DEFAULT_SETTINGS };
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

        this.settings.backgroundMusicVolume = this.clamp(
            this.settings.backgroundMusicVolume,
            0,
            1,
            0.8
        );

        this.settings.soundEffectsVolume = this.clamp(
            this.settings.soundEffectsVolume,
            0,
            1,
            0.8
        );

        // 語言沿用既有語言系統
        this.settings.language =
            LanguageSystem.getLanguage();

        return this.getSettings();
    }

    // 儲存設定
    static save() {

        if (!this.settings) {
            this.load();
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

        this.settings[key] = value;

        return this.save();
    }

    // 修改多個設定
    static setMultiple(values) {

        if (!this.settings) {
            this.load();
        }

        if (
            !values ||
            typeof values !== 'object' ||
            Array.isArray(values)
        ) {
            return false;
        }

        Object.keys(values).forEach(key => {

            if (key in this.DEFAULT_SETTINGS) {
                this.settings[key] = values[key];
            }

        });

        return this.save();
    }

    // 恢復預設設定
    static reset() {

        this.settings = this.getDefaults();

        LanguageSystem.setLanguage('en');

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