// 鱗片與種子：地下生態物語
// Audio System V2.0
// Centralized Audio Manager
// 五頻道音訊管理 + 場景背景音樂 + 淡入淡出

import { SettingsSystem } from './settings-system.js';

export class AudioSystem {

    static game = null;

    static activeSounds = new Set();

    static currentBGM = null;

    static initialized = false;

    static settingsListener = null;

    static firstGestureRegistered = false;

    static gestureHandler = null;

    // ==========================================
    // 音訊頻道
    // ==========================================

    static CHANNELS = {

        BGM: {
            enabled: 'backgroundMusicEnabled',
            volume: 'backgroundMusicVolume'
        },

        AMBIENT: {
            enabled: 'ambientSoundEnabled',
            volume: 'ambientSoundVolume'
        },

        NPC: {
            enabled: 'npcMusicEnabled',
            volume: 'npcMusicVolume'
        },

        CREATURE: {
            enabled: 'creatureSoundEnabled',
            volume: 'creatureSoundVolume'
        },

        SFX: {
            enabled: 'soundEffectsEnabled',
            volume: 'soundEffectsVolume'
        }

    };

    // ==========================================
    // 場景音樂預留設定
    // ==========================================

    static SCENE_MUSIC = {

        LoginScene: {
            key: 'bgm_login',
            path: 'assets/audio/bgm/login.mp3',
            fadeIn: 1200,
            fadeOut: 1000
        },

        TerrariumSelectScene: {
            key: 'bgm_terrarium',
            path: 'assets/audio/bgm/terrarium.mp3',
            fadeIn: 1200,
            fadeOut: 1000
        },

        UndergroundScene: {
            key: 'bgm_underground',
            path: 'assets/audio/bgm/underground.mp3',
            fadeIn: 1500,
            fadeOut: 1200
        },

        EncyclopediaScene: {
            key: 'bgm_encyclopedia',
            path: 'assets/audio/bgm/encyclopedia.mp3',
            fadeIn: 1200,
            fadeOut: 1000
        }

    };

    // ==========================================
    // 初始化
    // ==========================================

    static initialize(game) {

        this.game = game;

        if (this.initialized) {

            this.applySettings();

            return;

        }

        this.settingsListener = () => {

            this.applySettings();

        };

        window.addEventListener(
            'settingsChanged',
            this.settingsListener
        );

        this.initialized = true;

        this.registerFirstGesture();

        this.applySettings();

        console.log(
            '[AudioSystem] 五頻道音訊系統初始化完成'
        );

    }

    // ==========================================
    // 註冊首次觸控
    // 適用 iPhone Safari 音訊限制
    // ==========================================

    static registerFirstGesture() {

        if (this.firstGestureRegistered) return;

        this.firstGestureRegistered = true;

        this.gestureHandler = async () => {

            if (!this.game || !this.game.sound) return;

            try {

                const context = this.game.sound.context;

                if (
                    context &&
                    context.state === 'suspended'
                ) {

                    await context.resume();

                }

                console.log(
                    '[AudioSystem] 使用者已啟動音訊'
                );

                this.removeFirstGesture();

            } catch (error) {

                console.warn(
                    '[AudioSystem] 音訊啟動受限',
                    error
                );

            }

        };

        const events = [
            'pointerdown',
            'touchstart',
            'click',
            'keydown'
        ];

        events.forEach(event => {

            document.addEventListener(
                event,
                this.gestureHandler,
                {
                    once: true,
                    passive: true
                }
            );

        });

    }

    static removeFirstGesture() {

        if (!this.gestureHandler) return;

        const events = [
            'pointerdown',
            'touchstart',
            'click',
            'keydown'
        ];

        events.forEach(event => {

            document.removeEventListener(
                event,
                this.gestureHandler
            );

        });

        this.gestureHandler = null;

    }

    // ==========================================
    // 取得頻道設定
    // ==========================================

    static getChannelSettings(channel) {

        const config = this.CHANNELS[channel];

        if (!config) {

            console.warn(
                '[AudioSystem] 未知音訊頻道：',
                channel
            );

            return null;

        }

        return {

            enabled: SettingsSystem.get(config.enabled),

            volume: SettingsSystem.get(config.volume)

        };

    }

    // ==========================================
    // 預載音訊
    // ==========================================

    static preload(scene, assets = {}) {

        if (!scene || !scene.load) return;

        Object.entries(assets).forEach(([key, path]) => {

            if (!key || !path) return;

            scene.load.audio(key, path);

        });

    }

    // ==========================================
    // 預載場景專屬背景音樂
    // ==========================================

    static preloadSceneBGM(scene) {

        if (!scene || !scene.load) return;

        const config = this.SCENE_MUSIC[scene.scene.key];

        if (!config) return;

        scene.load.audio(
            config.key,
            config.path
        );

        console.log(
            '[AudioSystem] 已加入場景音樂載入佇列：',
            scene.scene.key
        );

    }

    // ==========================================
    // 一般音效播放
    // ==========================================

    static play(scene, channel, key, options = {}) {

        if (!scene || !scene.sound || !key) return null;

        if (channel === 'BGM') {

            return this.transitionBGM(
                scene,
                key,
                options
            );

        }

        const channelConfig = this.getChannelSettings(channel);

        if (!channelConfig || !channelConfig.enabled) {
            return null;
        }

        if (!scene.cache.audio.exists(key)) {

            console.warn(
                '[AudioSystem] 找不到音訊素材：',
                key
            );

            return null;

        }

        if (
            options.loop &&
            ['AMBIENT', 'NPC'].includes(channel)
        ) {

            const existing = [...this.activeSounds].find(item =>

                item.scene === scene &&
                item.channel === channel &&
                item.key === key &&
                item.sound.isPlaying

            );

            if (existing) return existing.sound;

        }

        if (['AMBIENT', 'NPC'].includes(channel)) {

            this.stopChannel(channel, scene);

        }

        const baseVolume = Math.max(
            0,
            Math.min(
                1,
                Number(options.volume ?? 1)
            )
        );

        const sound = scene.sound.add(key, {

            loop: options.loop ?? false,

            volume: channelConfig.volume * baseVolume,

            rate: options.rate ?? 1,

            detune: options.detune ?? 0,

            seek: options.seek ?? 0

        });

        const record = {

            scene,

            channel,

            key,

            sound,

            baseVolume,

            fadeLevel: 1,

            fadeTimer: null

        };

        this.activeSounds.add(record);

        sound.once('complete', () => {

            this.removeSound(record);

        });

        sound.once('destroy', () => {

            this.removeSound(record);

        });

        this.registerSceneShutdown(scene);

        sound.play();

        return sound;

    }

    // ==========================================
    // 場景背景音樂切換
    // ==========================================

    static transitionBGM(scene, key, options = {}) {

        if (!this.game || !this.game.sound) return null;

        const channelConfig = this.getChannelSettings('BGM');

        if (!channelConfig) return null;

        if (!channelConfig.enabled) {

            if (this.currentBGM) {

                this.fadeOutBGM(
                    options.fadeOut ?? 800
                );

            }

            return null;

        }

        if (!this.game.cache.audio.exists(key)) {

            console.warn(
                '[AudioSystem] 背景音樂素材尚未載入：',
                key
            );

            return null;

        }

        if (
            this.currentBGM &&
            this.currentBGM.key === key &&
            this.currentBGM.sound.isPlaying
        ) {

            return this.currentBGM.sound;

        }

        // 淡出上一首音樂
        if (this.currentBGM) {

            this.fadeOutBGM(
                options.fadeOut ?? 1000
            );

        }

        const baseVolume = Math.max(
            0,
            Math.min(
                1,
                Number(options.volume ?? 1)
            )
        );

        // 使用遊戲共用音訊管理器
        // 避免場景關閉時音樂被 Phaser 自動中斷

        const sound = this.game.sound.add(key, {

            loop: true,

            volume: 0,

            rate: options.rate ?? 1

        });

        const record = {

            scene,

            channel: 'BGM',

            key,

            sound,

            baseVolume,

            fadeLevel: 0,

            fadeTimer: null

        };

        this.activeSounds.add(record);

        this.currentBGM = record;

        sound.once('destroy', () => {

            this.removeSound(record);

        });

        sound.play();

        this.fadeTo(

            record,

            1,

            options.fadeIn ?? 1200

        );

        console.log(
            '[AudioSystem] 正在播放場景背景音樂：',
            key
        );

        return sound;

    }

    // ==========================================
    // 自動播放場景專屬音樂
    // ==========================================

    static playSceneBGM(scene, options = {}) {

        if (!scene) return null;

        const config = this.SCENE_MUSIC[scene.scene.key];

        if (!config) {

            console.warn(
                '[AudioSystem] 此場景沒有背景音樂設定：',
                scene.scene.key
            );

            return null;

        }

        return this.transitionBGM(
            scene,
            config.key,
            {

                fadeIn: options.fadeIn ?? config.fadeIn,

                fadeOut: options.fadeOut ?? config.fadeOut,

                volume: options.volume ?? 1

            }
        );

    }

    // ==========================================
    // 淡入淡出控制
    // ==========================================

    static fadeTo(record, target, duration = 1000, destroyOnComplete = false) {

        if (!record || !record.sound) return;

        if (record.fadeTimer) {

            clearInterval(record.fadeTimer);

            record.fadeTimer = null;

        }

        const start = record.fadeLevel;

        const end = Math.max(
            0,
            Math.min(1, target)
        );

        if (duration <= 0) {

            record.fadeLevel = end;

            this.updateRecordVolume(record);

            if (destroyOnComplete) {

                this.destroyRecord(record);

            }

            return;

        }

        const startTime = Date.now();

        record.fadeTimer = setInterval(() => {

            const elapsed = Date.now() - startTime;

            const progress = Math.min(
                1,
                elapsed / duration
            );

            // 平滑淡入淡出
            const eased = progress * progress * (3 - 2 * progress);

            record.fadeLevel =
                start + (end - start) * eased;

            this.updateRecordVolume(record);

            if (progress >= 1) {

                clearInterval(record.fadeTimer);

                record.fadeTimer = null;

                record.fadeLevel = end;

                this.updateRecordVolume(record);

                if (destroyOnComplete) {

                    this.destroyRecord(record);

                }

            }

        }, 30);

    }

    static fadeOutBGM(duration = 1000) {

        const record = this.currentBGM;

        if (!record) return;

        this.currentBGM = null;

        this.fadeTo(
            record,
            0,
            duration,
            true
        );

    }

    // ==========================================
    // 更新單一音效音量
    // ==========================================

    static updateRecordVolume(record) {

        if (!record || !record.sound) return;

        const config = this.getChannelSettings(record.channel);

        if (!config) return;

        record.sound.setMute(!config.enabled);

        record.sound.setVolume(

            config.volume *
            record.baseVolume *
            record.fadeLevel

        );

    }

    // ==========================================
    // 場景音樂快捷方法
    // ==========================================

    static playBGM(scene, key, options = {}) {

        return this.transitionBGM(
            scene,
            key,
            {
                fadeIn: 1200,
                fadeOut: 1000,
                ...options
            }
        );

    }

    static playAmbient(scene, key, options = {}) {

        return this.play(
            scene,
            'AMBIENT',
            key,
            {
                loop: true,
                ...options
            }
        );

    }

    static playNPCMusic(scene, key, options = {}) {

        return this.play(
            scene,
            'NPC',
            key,
            {
                loop: false,
                ...options
            }
        );

    }

    static playCreatureSound(scene, key, options = {}) {

        return this.play(
            scene,
            'CREATURE',
            key,
            {
                loop: false,
                ...options
            }
        );

    }

    static playSFX(scene, key, options = {}) {

        return this.play(
            scene,
            'SFX',
            key,
            {
                loop: false,
                ...options
            }
        );

    }

    // ==========================================
    // 場景關閉事件
    // ==========================================

    static registerSceneShutdown(scene) {

        if (!scene || scene.__audioSystemShutdownRegistered) {
            return;
        }

        scene.__audioSystemShutdownRegistered = true;

        scene.events.once('shutdown', () => {

            this.stopScene(scene);

            scene.__audioSystemShutdownRegistered = false;

        });

    }

    // ==========================================
    // 移除音效紀錄
    // ==========================================

    static removeSound(record) {

        if (!record) return;

        if (record.fadeTimer) {

            clearInterval(record.fadeTimer);

            record.fadeTimer = null;

        }

        this.activeSounds.delete(record);

        if (this.currentBGM === record) {

            this.currentBGM = null;

        }

    }

    // ==========================================
    // 銷毀音效
    // ==========================================

    static destroyRecord(record) {

        if (!record) return;

        if (record.fadeTimer) {

            clearInterval(record.fadeTimer);

            record.fadeTimer = null;

        }

        try {

            record.sound.stop();

            record.sound.destroy();

        } catch (error) {

            console.warn(
                '[AudioSystem] 音效銷毀警告',
                error
            );

        }

        this.activeSounds.delete(record);

        if (this.currentBGM === record) {

            this.currentBGM = null;

        }

    }

    // ==========================================
    // 停止指定頻道
    // ==========================================

    static stopChannel(channel, scene = null) {

        for (const record of [...this.activeSounds]) {

            if (record.channel !== channel) continue;

            if (scene && record.scene !== scene) continue;

            this.destroyRecord(record);

        }

    }

    // ==========================================
    // 停止指定場景音效
    // 背景音樂不會因場景關閉而被直接停止
    // ==========================================

    static stopScene(scene) {

        for (const record of [...this.activeSounds]) {

            if (record.scene !== scene) continue;

            if (record.channel === 'BGM') continue;

            this.destroyRecord(record);

        }

    }

    // ==========================================
    // 停止全部音效
    // ==========================================

    static stopAll() {

        for (const record of [...this.activeSounds]) {

            this.destroyRecord(record);

        }

        this.activeSounds.clear();

        this.currentBGM = null;

    }

    // ==========================================
    // 套用音訊設定
    // ==========================================

    static applySettings() {

        for (const record of [...this.activeSounds]) {

            const config = this.getChannelSettings(record.channel);

            if (!config) continue;

            if (
                record.channel === 'BGM' &&
                !config.enabled
            ) {

                if (this.currentBGM === record) {

                    this.fadeOutBGM(500);

                } else {

                    this.destroyRecord(record);

                }

                continue;

            }

            this.updateRecordVolume(record);

        }

    }

    // ==========================================
    // 恢復音訊
    // ==========================================

    static async resume(scene = null) {

        try {

            const soundManager =
                scene?.sound || this.game?.sound;

            if (!soundManager) return false;

            const context = soundManager.context;

            if (
                context &&
                context.state === 'suspended'
            ) {

                await context.resume();

            }

            return true;

        } catch (error) {

            console.warn(
                '[AudioSystem] 音訊恢復失敗',
                error
            );

            return false;

        }

    }

    // ==========================================
    // 銷毀系統
    // ==========================================

    static destroy() {

        this.stopAll();

        this.removeFirstGesture();

        if (this.settingsListener) {

            window.removeEventListener(
                'settingsChanged',
                this.settingsListener
            );

        }

        this.settingsListener = null;

        this.firstGestureRegistered = false;

        this.game = null;

        this.initialized = false;

        console.log(
            '[AudioSystem] 音訊系統已銷毀'
        );

    }

}

// ==========================================
// 全域存取
// ==========================================

window.AudioSystem = AudioSystem;