
// 鱗片與種子：地下生態物語
// Audio System - Centralized 4-Channel Audio Manager
// 四頻道中央音訊管理系統

import { SettingsSystem } from './settings-system.js';

export class AudioSystem {

    static game = null;
    static activeSounds = new Set();
    static initialized = false;

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
        SFX: {
            enabled: 'soundEffectsEnabled',
            volume: 'soundEffectsVolume'
        }
    };

    // 初始化音訊系統
    static initialize(game) {

        this.game = game;

        if (this.initialized) {
            this.applySettings();
            return;
        }

        window.addEventListener(
            'settingsChanged',
            () => this.applySettings()
        );

        this.initialized = true;

        this.applySettings();

        console.log('[AudioSystem] 四頻道音訊系統已初始化');
    }

    // 取得頻道設定
    static getChannelSettings(channel) {

        const config = this.CHANNELS[channel];

        if (!config) {
            console.warn('[AudioSystem] 未知音訊頻道：', channel);
            return null;
        }

        return {
            enabled: SettingsSystem.get(config.enabled),
            volume: SettingsSystem.get(config.volume)
        };
    }

    // 載入音訊素材
    // assets 格式：
    // { winter: 'assets/audio/winter.mp3' }
    static preload(scene, assets = {}) {

        Object.entries(assets).forEach(([key, path]) => {

            if (!key || !path) return;

            scene.load.audio(key, path);

        });
    }

    // 播放指定頻道音訊
    static play(scene, channel, key, options = {}) {

        if (!scene || !scene.sound || !key) {
            return null;
        }

        const channelConfig = this.getChannelSettings(channel);

        if (!channelConfig || !channelConfig.enabled) {
            return null;
        }

        if (!scene.cache.audio.exists(key)) {
            console.warn(
                `[AudioSystem] 找不到音訊素材：${key}`
            );
            return null;
        }

        // 同一場景、同一頻道的循環音樂不重複播放
        if (
            options.loop &&
            ['BGM', 'AMBIENT', 'NPC'].includes(channel)
        ) {

            const existing = [...this.activeSounds].find(item =>
                item.scene === scene &&
                item.channel === channel &&
                item.key === key &&
                item.sound.isPlaying
            );

            if (existing) {
                return existing.sound;
            }
        }

        // BGM、環境音、NPC 音樂各自維持單一主要播放項目
        if (['BGM', 'AMBIENT', 'NPC'].includes(channel)) {
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
            baseVolume
        };

        this.activeSounds.add(record);

        sound.once('complete', () => {
            this.removeSound(record);
        });

        sound.once('destroy', () => {
            this.removeSound(record);
        });

        // 場景結束時清除該場景的音訊
        if (!scene.__audioSystemShutdownRegistered) {

            scene.__audioSystemShutdownRegistered = true;

            scene.events.once('shutdown', () => {
                this.stopScene(scene);
                scene.__audioSystemShutdownRegistered = false;
            });
        }

        sound.play();

        return sound;
    }

    // 播放背景音樂
    static playBGM(scene, key, options = {}) {
        return this.play(scene, 'BGM', key, {
            loop: true,
            ...options
        });
    }

    // 播放環境音
    static playAmbient(scene, key, options = {}) {
        return this.play(scene, 'AMBIENT', key, {
            loop: true,
            ...options
        });
    }

    // 播放 NPC 特殊事件音樂
    static playNPCMusic(scene, key, options = {}) {
        return this.play(scene, 'NPC', key, {
            loop: false,
            ...options
        });
    }

    // 播放操作音效
    static playSFX(scene, key, options = {}) {
        return this.play(scene, 'SFX', key, {
            loop: false,
            ...options
        });
    }

    // 移除播放紀錄
    static removeSound(record) {
        this.activeSounds.delete(record);
    }

    // 停止指定頻道
    static stopChannel(channel, scene = null) {

        for (const record of [...this.activeSounds]) {

            if (record.channel !== channel) continue;

            if (scene && record.scene !== scene) continue;

            record.sound.stop();
            record.sound.destroy();

            this.activeSounds.delete(record);
        }
    }

    // 停止指定場景所有音訊
    static stopScene(scene) {

        for (const record of [...this.activeSounds]) {

            if (record.scene !== scene) continue;

            record.sound.stop();
            record.sound.destroy();

            this.activeSounds.delete(record);
        }
    }

    // 停止所有音訊
    static stopAll() {

        for (const record of [...this.activeSounds]) {

            record.sound.stop();
            record.sound.destroy();
        }

        this.activeSounds.clear();
    }

    // 套用設定到正在播放的音訊
    static applySettings() {

        for (const record of this.activeSounds) {

            const config = this.getChannelSettings(
                record.channel
            );

            if (!config) continue;

            record.sound.setMute(!config.enabled);

            record.sound.setVolume(
                config.volume * record.baseVolume
            );
        }
    }

    // 恢復瀏覽器音訊播放權限
    // iOS Safari 通常需要使用者操作後才能啟動音訊
    static async resume(scene) {

        try {

            const soundManager = scene?.sound;

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
                '[AudioSystem] 音訊啟動受限：',
                error
            );

            return false;
        }
    }

    // 清除系統
    static destroy() {

        this.stopAll();

        if (this.game) {
            this.game = null;
        }

        this.initialized = false;
    }
}

window.AudioSystem = AudioSystem;
