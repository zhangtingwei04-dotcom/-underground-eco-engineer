// 鱗片與種子：地下生態物語
// Audio System V2.1
// Centralized Audio Manager
// 五頻道音訊管理 + 場景背景音樂 + 淡入淡出
// 支援 iPhone Safari、設定即時更新、音樂自動恢復

import { SettingsSystem } from './settings-system.js';

export class AudioSystem {

    static game = null;
    static activeSounds = new Set();
    static currentBGM = null;
    static desiredBGM = null;
    static initialized = false;
    static settingsListener = null;
    static firstGestureRegistered = false;
    static gestureHandler = null;
    static audioUnlocked = false;
    static missingAudioWarnings = new Set();

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
    // 場景背景音樂設定
    // enabled: false 代表尚未加入音樂素材
    // ==========================================

    static SCENE_MUSIC = {
        LoginScene: {
            enabled: false,
            key: 'bgm_login',
            path: 'assets/audio/bgm/login.mp3',
            fadeIn: 1200,
            fadeOut: 1000
        },
        TerrariumSelectScene: {
            enabled: false,
            key: 'bgm_terrarium',
            path: 'assets/audio/bgm/terrarium.mp3',
            fadeIn: 1200,
            fadeOut: 1000
        },
        UndergroundScene: {
            enabled: false,
            key: 'bgm_underground',
            path: 'assets/audio/bgm/underground.mp3',
            fadeIn: 1500,
            fadeOut: 1200
        },
        EncyclopediaScene: {
            enabled: false,
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
            this.registerFirstGesture();
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
            '[AudioSystem] 五頻道音訊系統 V2.1 初始化完成'
        );
    }

    // ==========================================
    // 首次使用者操作
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

                if (
                    context &&
                    context.state !== 'running'
                ) {
                    return;
                }

                this.audioUnlocked = true;

                console.log(
                    '[AudioSystem] 使用者已啟動音訊'
                );

                this.removeFirstGesture();
                this.startDesiredBGM();

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
                { passive: true }
            );
        });
    }

    // ==========================================
    // 移除首次操作監聽
    // ==========================================

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
        this.firstGestureRegistered = false;
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

        const enabled = SettingsSystem.get(
            config.enabled
        );

        const volume = Number(
            SettingsSystem.get(config.volume) ?? 1
        );

        return {
            enabled: enabled !== false,
            volume: Math.max(0, Math.min(1, volume))
        };
    }

    // ==========================================
    // 確認音訊素材是否存在
    // ==========================================

    static hasAudio(key) {
        if (!this.game || !this.game.cache || !key) {
            return false;
        }

        try {
            return this.game.cache.audio.exists(key);
        } catch (error) {
            return false;
        }
    }

    // ==========================================
    // 輸出素材不存在警告
    // 同一素材只警告一次
    // ==========================================

    static warnMissingAudio(key) {
        if (this.missingAudioWarnings.has(key)) return;

        this.missingAudioWarnings.add(key);

        console.warn(
            '[AudioSystem] 音訊素材尚未載入：',
            key
        );
    }

    // ==========================================
    // 預載一般音訊
    // ==========================================

    static preload(scene, assets = {}) {
        if (!scene || !scene.load) return;

        Object.entries(assets).forEach(([key, path]) => {
            if (!key || !path) return;
            if (scene.cache?.audio?.exists(key)) return;

            scene.load.audio(key, path);
        });
    }

    // ==========================================
    // 預載場景專屬背景音樂
    // 只有 enabled: true 才會載入
    // ==========================================

    static preloadSceneBGM(scene) {
        if (!scene || !scene.load) return;

        const sceneKey = scene.scene.key;
        const config = this.SCENE_MUSIC[sceneKey];

        if (!config) return;

        if (!config.enabled) {
            console.log(
                '[AudioSystem] 場景音樂尚未啟用：',
                sceneKey
            );
            return;
        }

        if (scene.cache?.audio?.exists(config.key)) {
            return;
        }

        scene.load.audio(
            config.key,
            config.path
        );

        console.log(
            '[AudioSystem] 已加入背景音樂載入佇列：',
            sceneKey
        );
    }

    // ==========================================
    // 一般音效播放
    // ==========================================

    static play(scene, channel, key, options = {}) {
        if (!scene || !scene.sound || !key) {
            return null;
        }

        if (channel === 'BGM') {
            return this.transitionBGM(
                scene,
                key,
                options
            );
        }

        const channelConfig = this.getChannelSettings(
            channel
        );

        if (!channelConfig || !channelConfig.enabled) {
            return null;
        }

        if (!scene.cache?.audio?.exists(key)) {
            this.warnMissingAudio(key);
            return null;
        }

        // 避免重複播放相同循環音效
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

        // 同場景同頻道只保留一個音效
        if (['AMBIENT', 'NPC'].includes(channel)) {
            this.stopChannel(channel, scene);
        }

        const baseVolume = Math.max(
            0,
            Math.min(1, Number(options.volume ?? 1))
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

        try {
            sound.play();
            return sound;
        } catch (error) {
            console.warn(
                '[AudioSystem] 音效播放失敗：',
                error
            );
            this.removeSound(record);
            return null;
        }
    }
        // ==========================================
    // 記錄目前需要播放的背景音樂
    // ==========================================

    static transitionBGM(scene, key, options = {}) {

        if (!scene || !key) return null;

        this.desiredBGM = {
            scene,
            key,
            options: {
                fadeIn: options.fadeIn ?? 1200,
                fadeOut: options.fadeOut ?? 1000,
                volume: options.volume ?? 1,
                rate: options.rate ?? 1
            }
        };

        const channelConfig = this.getChannelSettings('BGM');

        if (!channelConfig) return null;

        // 背景音樂關閉時，只記錄播放目標
        if (!channelConfig.enabled) {

            this.fadeOutBGM(
                options.fadeOut ?? 800
            );

            return null;
        }

        return this.startDesiredBGM();
    }

    // ==========================================
    // 真正啟動目前指定的背景音樂
    // ==========================================

    static startDesiredBGM() {

        if (!this.desiredBGM) return null;
        if (!this.game || !this.game.sound) return null;

        const channelConfig = this.getChannelSettings('BGM');

        if (!channelConfig || !channelConfig.enabled) {
            return null;
        }

        // iPhone Safari 尚未解鎖時先等待
        const context = this.game.sound.context;

        if (
            context &&
            context.state === 'suspended' &&
            !this.audioUnlocked
        ) {
            return null;
        }

        const {
            scene,
            key,
            options
        } = this.desiredBGM;

        // 尚未載入素材時不播放
        if (!this.hasAudio(key)) {
            this.warnMissingAudio(key);
            return null;
        }

        // 同一首音樂已經播放，就不重複建立
        if (
            this.currentBGM &&
            this.currentBGM.key === key &&
            this.currentBGM.sound &&
            this.currentBGM.sound.isPlaying
        ) {
            this.currentBGM.scene = scene;
            return this.currentBGM.sound;
        }

        // 淡出上一首
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
        // 場景切換時不會直接中斷背景音樂

        let sound;

        try {

            sound = this.game.sound.add(key, {
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
                '[AudioSystem] 正在播放背景音樂：',
                key
            );

            return sound;

        } catch (error) {

            console.warn(
                '[AudioSystem] 背景音樂播放失敗：',
                error
            );

            return null;
        }
    }

    // ==========================================
    // 自動播放場景專屬音樂
    // ==========================================

    static playSceneBGM(scene, options = {}) {

        if (!scene) return null;

        const sceneKey = scene.scene.key;
        const config = this.SCENE_MUSIC[sceneKey];

        if (!config) {
            console.warn(
                '[AudioSystem] 此場景沒有背景音樂設定：',
                sceneKey
            );
            return null;
        }

        // 音樂素材尚未正式啟用時，不記錄播放目標
        // 避免嘗試播放不存在的音樂檔
        if (!config.enabled) {
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

    static fadeTo(
        record,
        target,
        duration = 1000,
        destroyOnComplete = false
    ) {

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

            if (!record.sound) {
                clearInterval(record.fadeTimer);
                record.fadeTimer = null;
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);

            // Smoothstep 平滑曲線
            const eased =
                progress * progress * (3 - 2 * progress);

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
        // ==========================================
    // 淡出目前背景音樂
    // ==========================================

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

        const config = this.getChannelSettings(
            record.channel
        );

        if (!config) return;

        try {

            record.sound.setMute(!config.enabled);

            record.sound.setVolume(
                config.volume *
                record.baseVolume *
                record.fadeLevel
            );

        } catch (error) {

            console.warn(
                '[AudioSystem] 音量更新失敗',
                error
            );

        }
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
    // 背景音樂不會因場景關閉而停止
    // ==========================================

    static registerSceneShutdown(scene) {

        if (
            !scene ||
            scene.__audioSystemShutdownRegistered
        ) {
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

            if (record.sound) {
                record.sound.stop();
                record.sound.destroy();
            }

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
    // ==========================================

    static stopScene(scene) {

        for (const record of [...this.activeSounds]) {

            if (record.scene !== scene) continue;

            // 背景音樂由全域系統管理
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
        this.desiredBGM = null;
    }

    // ==========================================
    // 套用音訊設定
    // ==========================================

    static applySettings() {

        const bgmConfig = this.getChannelSettings('BGM');

        // 背景音樂關閉：淡出目前音樂
        if (bgmConfig && !bgmConfig.enabled) {
            this.fadeOutBGM(500);
        }

        // 更新所有音訊音量
        for (const record of [...this.activeSounds]) {

            if (
                record.channel === 'BGM' &&
                !bgmConfig.enabled
            ) {
                continue;
            }

            this.updateRecordVolume(record);

        }

        // 背景音樂重新開啟：
        // 自動恢復目前場景應播放的音樂
        if (bgmConfig && bgmConfig.enabled) {
            this.startDesiredBGM();
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

            const success =
                !context || context.state === 'running';

            if (success) {

                this.audioUnlocked = true;

                this.startDesiredBGM();

            }

            return success;

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
        this.audioUnlocked = false;

        this.missingAudioWarnings.clear();

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