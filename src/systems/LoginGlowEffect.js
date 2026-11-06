
// 鱗片與種子：地下生態物語
// Login Glow Effect V1.0
// 木製按鈕魔法微光特效
// Phaser 3.80.1

export class LoginGlowEffect {

    constructor(scene, config = {}) {

        this.scene = scene;

        this.config = {
            x: config.x ?? 0,
            y: config.y ?? 0,
            width: config.width ?? 220,
            height: config.height ?? 72,

            color: config.color ?? 0xFFD879,
            intensity: config.intensity ?? 1,

            particleCount: config.particleCount ?? 10,
            enabled: config.enabled ?? true
        };

        this.container = null;
        this.glowLayers = [];
        this.particles = [];

        this.isDestroyed = false;

        if (this.config.enabled) {
            this.create();
        }
    }

    // 建立特效
    create() {

        if (this.isDestroyed) return;

        const scene = this.scene;

        this.container = scene.add.container(
            this.config.x,
            this.config.y
        );

        this.container.setDepth(20);

        this.createGlow();
        this.createParticles();
        this.startAnimation();

    }

    // 建立柔和外圍光暈
    createGlow() {

        const scene = this.scene;

        const w = this.config.width;
        const h = this.config.height;
        const color = this.config.color;

        const layers = [
            { padding: 19, line: 15, alpha: 0.045 },
            { padding: 13, line: 10, alpha: 0.075 },
            { padding: 8, line: 6, alpha: 0.12 },
            { padding: 3, line: 3, alpha: 0.19 }
        ];

        layers.forEach((layer, index) => {

            const glow = scene.add.graphics();

            glow.lineStyle(
                layer.line,
                color,
                layer.alpha * this.config.intensity
            );

            glow.strokeRoundedRect(
                -w / 2 - layer.padding,
                -h / 2 - layer.padding,
                w + layer.padding * 2,
                h + layer.padding * 2,
                15
            );

            this.container.add(glow);

            this.glowLayers.push(glow);

        });

    }

    // 建立漂浮微光粒子
    createParticles() {

        const scene = this.scene;

        const w = this.config.width;
        const h = this.config.height;

        for (
            let i = 0;
            i < this.config.particleCount;
            i++
        ) {

            const angle =
                (Math.PI * 2 / this.config.particleCount) * i;

            const radiusX = w / 2 + 12;
            const radiusY = h / 2 + 12;

            const x = Math.cos(angle) * radiusX;
            const y = Math.sin(angle) * radiusY;

            const particle = scene.add.circle(
                x,
                y,
                1.5 + (i % 3) * 0.7,
                0xFFE6A0,
                0.75
            );

            particle.setBlendMode(
                Phaser.BlendModes.ADD
            );

            this.container.add(particle);

            this.particles.push(particle);

        }

    }

    // 啟動呼吸光效
    startAnimation() {

        const scene = this.scene;

        if (!scene || !this.container) return;

        this.glowLayers.forEach((glow, index) => {

            scene.tweens.add({

                targets: glow,

                alpha: {
                    from: 0.55,
                    to: 1
                },

                scaleX: {
                    from: 0.98,
                    to: 1.035
                },

                scaleY: {
                    from: 0.98,
                    to: 1.035
                },

                duration: 1800 + index * 250,

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'

            });

        });

        this.particles.forEach((particle, index) => {

            const originalY = particle.y;
            const originalX = particle.x;

            scene.tweens.add({

                targets: particle,

                x: originalX + (index % 2 === 0 ? 5 : -5),

                y: originalY - 7 - (index % 3) * 3,

                alpha: {
                    from: 0.15,
                    to: 0.95
                },

                scale: {
                    from: 0.7,
                    to: 1.3
                },

                duration: 1400 + index * 170,

                yoyo: true,

                repeat: -1,

                ease: 'Sine.easeInOut'

            });

        });

    }

    // 點擊時增強光效
    pulse() {

        if (!this.container || this.isDestroyed) {
            return;
        }

        this.scene.tweens.add({

            targets: this.container,

            scale: 1.045,

            duration: 130,

            yoyo: true,

            ease: 'Sine.easeOut'

        });

        this.glowLayers.forEach(glow => {

            this.scene.tweens.add({

                targets: glow,

                alpha: 1,

                duration: 180,

                yoyo: true,

                ease: 'Sine.easeOut'

            });

        });

    }

    // 調整位置與尺寸
    setPosition(x, y) {

        if (!this.container) return;

        this.config.x = x;
        this.config.y = y;

        this.container.setPosition(x, y);

    }

    // 開啟或關閉特效
    setEnabled(enabled) {

        if (enabled === this.config.enabled) return;

        this.config.enabled = enabled;

        if (enabled) {

            this.create();

        } else {

            this.destroy();

            this.isDestroyed = false;

        }

    }

    // 移除特效
    destroy() {

        if (!this.container) return;

        this.scene.tweens.killTweensOf(
            this.container
        );

        this.glowLayers.forEach(glow => {
            this.scene.tweens.killTweensOf(glow);
        });

        this.particles.forEach(particle => {
            this.scene.tweens.killTweensOf(particle);
        });

        this.container.destroy(true);

        this.container = null;

        this.glowLayers = [];
        this.particles = [];

        this.isDestroyed = true;

    }

}
