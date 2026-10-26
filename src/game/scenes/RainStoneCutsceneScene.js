import * as Phaser from "phaser";

/**
 * 安全新增 Image 函式：確保紋理存在才建立，避免找不到紋理而噴錯
 */
function safeAddImage(scene, x, y, key, depth = 0) {
    if (scene.textures.exists(key)) {
        return scene.add.image(x, y, key).setDepth(depth);
    }
    console.warn(`[Texture Warning] Key "${key}" 不存在於 Texture Manager 中`);
    return null;
}

export class RainStoneCutsceneScene extends Phaser.Scene {
    constructor() {
        super({ key: "RainStoneCutsceneScene" });
    }

    create() {
        const { width, height } = this.scale;
        const centerX = width / 2;
        const centerY = height / 2;

        // 鏡頭淡入
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // Add this temporary helper in create()
this.input.on('pointerdown', (pointer) => {
    const offsetX = Math.round(pointer.x - centerX);
    const offsetY = Math.round(pointer.y - centerY);
    console.log(`Clicked Slot Offset -> { offsetX: ${offsetX}, offsetY: ${offsetY} }`);
});

        // 1. 祭壇底圖 (直接使用 this.add.image)
        this.bg = safeAddImage(this, centerX, centerY, "stone_system_without_text", 1);
        if (this.bg) {
            this.bg.setOrigin(0.5).setDisplaySize(width, height);
        }

        // 五色寶石放置座標 offset (相對於螢幕中心)
        const stonePositions = [
            { key: "blue_stone", handKey: "hand_blue", offsetX: -165, offsetY: 180 },
            { key: "green_stone", handKey: "hand_green", offsetX: 15, offsetY: -100 },
            { key: "pink_stone", handKey: "hand_pink", offsetX: 295, offsetY: -100 },
            { key: "purple_stone", handKey: "hand_purple", offsetX: 150, offsetY: 180 },
            { key: "yellow_stone", handKey: "hand_yellow", offsetX: -290, offsetY: -100 }
        ];

        // 啟動儀式放置動畫序列
        this.playStonePlacementSequence(centerX, centerY, stonePositions);
    }

    /**
     * 寶石與祈雨石順序鑲嵌動畫序列
     */
    playStonePlacementSequence(centerX, centerY, stonePositions) {
        let delayOffset = 800; // 初始延遲

        // --- 階段 1：五色寶石依序放置 ---
        stonePositions.forEach((item) => {
            const targetX = centerX + item.offsetX;
            const targetY = centerY + item.offsetY;

            this.time.delayedCall(delayOffset, () => {
                // 使用 this.add.image 直接建立手部與寶石
                const hand = safeAddImage(this, targetX, centerY + 400, item.handKey, 10);

                if (hand) {
                    hand.setOrigin(0.5).setAlpha(0).setScale(0.8);

                    this.tweens.add({
                        targets: hand,
                        y: targetY,
                        alpha: 1,
                        duration: 600,
                        ease: "Power2.out",
                        onComplete: () => {
                            // 在目標點放置寶石
                            const stone = safeAddImage(this, targetX, targetY, item.key, 5);
                            if (stone) {
                                stone.setOrigin(0.5).setScale(5);

                                this.tweens.add({
                                    targets: stone,
                                    scale: { from: 0.9, to: 0.7 },
                                    duration: 300,
                                    ease: "Back.out"
                                });
                            }

                            // 手鬆開並退場
                            this.tweens.add({
                                targets: hand,
                                y: targetY + 150,
                                alpha: 0,
                                duration: 400,
                                ease: "Power1.in",
                                onComplete: () => hand.destroy()
                            });
                        }
                    });
                }
            });

            delayOffset += 900;
        });

        // --- 階段 2：中央核心「祈雨石 (Rain Stone)」放置 ---
        this.time.delayedCall(delayOffset + 400, () => {
            const rainHand = safeAddImage(this, centerX, centerY + 450, "hand_open", 20);
            const rainStone = safeAddImage(this, centerX, centerY + 300, "rain_stone", 15);

            if (rainHand && rainStone) {
                rainHand.setOrigin(0.5).setAlpha(0).setScale(1);
                rainStone.setOrigin(0.5).setAlpha(0).setScale(0.5);

                this.tweens.add({
                    targets: [rainHand, rainStone],
                    y: `-= 300`,
                    alpha: 1,
                    duration: 1000,
                    ease: "Cubic.out",
                    onComplete: () => {
                        this.tweens.add({
                            targets: rainStone,
                            scale: 1.2,
                            duration: 500,
                            yoyo: true,
                            repeat: 1,
                            ease: "Sine.easeInOut"
                        });

                        this.tweens.add({
                            targets: rainHand,
                            y: centerY + 300,
                            alpha: 0,
                            duration: 600,
                            ease: "Power2.in",
                            onComplete: () => rainHand.destroy()
                        });

                        // 更換背景為帶文字的完整底圖
                        this.time.delayedCall(800, () => {
                            if (this.bg && this.textures.exists("stone_system")) {
                                this.bg.setTexture("stone_system");
                            }
                            this.finishCutscene();
                        });
                    }
                });
            } else {
                this.finishCutscene();
            }
        });
    }

    /**
     * 動畫結束，切換至 EventCredits
     */
    finishCutscene() {
        this.time.delayedCall(5000, () => {
            this.cameras.main.fadeOut(1500, 0, 0, 0);

            this.cameras.main.once(
                Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => {
                    this.scene.start("EventCredits");
                }
            );
        });
    }
}