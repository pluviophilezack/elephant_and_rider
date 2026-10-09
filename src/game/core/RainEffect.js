import * as Phaser from 'phaser';

export class RainEffect {
    constructor(scene) {
        this.scene = scene;
        this.rainOverlay = null;
        this.rainParticles = null;
        this.emitter = null;
        this.isRaining = false;
    }

    /**
     * 觸發下雨動畫與天色變暗
     * @param {number} durationMs 漸變過渡時間（預設 2000ms）
     */
    startRain(durationMs = 2000) {
        if (this.isRaining) return;
        this.isRaining = true;

        const { width, height } = this.scene.cameras.main;

        // -------------------------------------------------------------
        // 1. 建立灰色/深藍陰雨天遮罩 (Dark Overlay)
        // -------------------------------------------------------------
        this.rainOverlay = this.scene.add.rectangle(0, 0, width, height, 0x1c2833, 0)
            .setOrigin(0)
            .setScrollFactor(0)  // 固定在螢幕，不隨攝影機移動
            .setDepth(900);      // 壓在背景與人物之上，UI 之下

        // 漸變將遮罩 Alpha 拉高到 0.45 (營造烏雲密佈的灰色感)
        this.scene.tweens.add({
            targets: this.rainOverlay,
            fillAlpha: 0.3,
            duration: durationMs,
            ease: 'Sine.easeInOut'
        });

        if (!this.scene.textures.exists('rain_drop')) {
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(0xffffff, 0.7);
            graphics.fillRect(0, 0, 2, 12); // 雨滴長條狀
            graphics.generateTexture('rain_drop', 2, 12);
            graphics.destroy();
        }

        this.rainParticles = this.scene.add.particles(0, 0, 'rain_drop', {
            x: { min: -200, max: width + 200 },
            y: -20,
            lifespan: { min: 800, max: 1200 },
            speedY: { min: 600, max: 900 },    // 下墜速度
            speedX: { min: -100, max: -50 },   // 傾斜風向
            scaleY: { min: 0.8, max: 1.5 },
            scaleX: 0.8,
            alpha: { start: 0.6, end: 0.2 },
            quantity: 4,                       // 每 frame 產生的雨滴數
            frequency: 30,                     // 發射頻率 (ms)
            blendMode: 'ADD'
        });

        this.rainParticles.setScrollFactor(0); // 讓雨絲對齊螢幕
        this.rainParticles.setDepth(901);      // 壓在灰色遮罩之上

        // 雨滴從少變多的漸入效果
        this.rainParticles.setAlpha(0);
        this.scene.tweens.add({
            targets: this.rainParticles,
            alpha: 1,
            duration: durationMs,
            ease: 'Linear'
        });
    }

}
