import * as Phaser from 'phaser';

export class RainEffect {
    constructor(scene) {
        this.scene = scene;
        this.rainOverlay = null;
        this.rainParticles = null;
        this.rainStage = 0; // 0: 無雨, 1: 小雨 (5顆), 2: 大雨+遮罩 (6顆)
    }

    /**
     * 根據祈雨石數量切換雨勢
     * @param {number} stoneCount 祈雨石數量
     */
    updateRainByStones(stoneCount) {
        if (stoneCount >= 6 && this.rainStage < 2) {
            this.startHeavyRain();
        } else if (stoneCount >= 5 && this.rainStage < 1) {
            this.startLightRain();
        }
    }

    // -------------------------------------------------------------
    // 階段一：5 顆祈雨石 -> 下小雨 (無灰色遮罩)
    // -------------------------------------------------------------
    startLightRain() {
        this.rainStage = 1;
        this._ensureRainDropTexture();

        const { width } = this.scene.cameras.main;

        if (!this.rainParticles) {
            this.rainParticles = this.scene.add.particles(0, 0, 'rain_drop', {
                x: { min: -100, max: width + 100 },
                y: -20,
                lifespan: { min: 1000, max: 1400 },
                speedY: { min: 350, max: 500 },   // 較慢的落速
                speedX: { min: -40, max: -20 },   // 微風
                scaleY: { min: 0.6, max: 1.0 },
                scaleX: 0.6,
                alpha: { start: 0.4, end: 0.1 },
                quantity: 2,                      // 粒子量少
                frequency: 50,
                blendMode: 'ADD'
            });

            this.rainParticles.setScrollFactor(0);
            this.rainParticles.setDepth(901);
        }
    }

    // -------------------------------------------------------------
    // 階段二：6 顆祈雨石 -> 升級為大雨 + 灰色遮罩
    // -------------------------------------------------------------
    startHeavyRain(durationMs = 2000) {
        this.rainStage = 2;
        const { width, height } = this.scene.cameras.main;

        // 1. 建立並淡入深灰色陰雨天遮罩 (Dark Overlay)
        if (!this.rainOverlay) {
            this.rainOverlay = this.scene.add.rectangle(0, 0, width, height, 0x1c2833, 0)
                .setOrigin(0)
                .setScrollFactor(0)
                .setDepth(900);

            this.scene.tweens.add({
                targets: this.rainOverlay,
                fillAlpha: 0.45,
                duration: durationMs,
                ease: 'Sine.easeInOut'
            });
        }

        // 2. 升級雨滴粒子發射強度 (數量增加、速度加快)
        this._ensureRainDropTexture();

        if (this.rainParticles) {
            // 已有小雨時，直接動態更新發射器參數
            this.rainParticles.setConfig({
                x: { min: -200, max: width + 200 },
                y: -20,
                lifespan: { min: 700, max: 1000 },
                speedY: { min: 700, max: 1000 },  // 急促暴雨落速
                speedX: { min: -120, max: -60 },  // 強風斜雨
                scaleY: { min: 1.0, max: 1.8 },
                scaleX: 0.8,
                alpha: { start: 0.7, end: 0.2 },
                quantity: 5,                      // 雨絲大量增加
                frequency: 25,
                blendMode: 'ADD'
            });
        } else {
            // 若直接跳至 6 顆則新建大雨粒子
            this.rainParticles = this.scene.add.particles(0, 0, 'rain_drop', {
                x: { min: -200, max: width + 200 },
                y: -20,
                lifespan: { min: 700, max: 1000 },
                speedY: { min: 700, max: 1000 },
                speedX: { min: -120, max: -60 },
                scaleY: { min: 1.0, max: 1.8 },
                scaleX: 0.8,
                alpha: { start: 0.7, end: 0.2 },
                quantity: 5,
                frequency: 25,
                blendMode: 'ADD'
            });
            this.rainParticles.setScrollFactor(0);
            this.rainParticles.setDepth(901);
        }
    }

    _ensureRainDropTexture() {
        if (!this.scene.textures.exists('rain_drop')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillRect(0, 0, 2, 12);
            graphics.generateTexture('rain_drop', 2, 12);
            graphics.destroy();
        }
    }
}
