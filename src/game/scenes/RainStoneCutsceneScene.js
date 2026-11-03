import * as Phaser from "phaser";
import { MoralState } from "../core/MoralState";

/**
 * 安全新增 Image 函式：確保紋理存在才建立，避免找不到紋理而噴錯
 */
function safeAddImage(scene, x, y, key, depth = 0, size = 1) {
    if (scene.textures.exists(key)) {
        const img = scene.add.image(x, y, key).setDepth(depth);
        img.setScale(size);
        return img;
    }
    console.warn(`[Texture Warning] Key "${key}" 不存在於 Texture Manager 中`);
    return null;
}

export class RainStoneCutsceneScene extends Phaser.Scene {
    constructor() {
        super({ key: "RainStoneCutsceneScene" });
        this.bgScale = 1;
    }

    create() {
    const { width, height } = this.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // 鏡頭淡入
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // 1. 鋪上底色
    this.add.rectangle(centerX, centerY, width, height, 0xffffff).setDepth(0);

    // 2. 祭壇底圖：
    // B (無文字): 作為底圖，depth 設為 1，始終保持不變
    this.bgNoText = safeAddImage(this, centerX, centerY + 30, "stone_system_without_text", 1);
    
    // A (有文字): 上層，depth 設為 2，初始 alpha 設為 0 以便淡入
    this.bgWithText = safeAddImage(this, centerX, centerY + 30, "stone_system", 2);

    if (this.bgNoText && this.bgWithText) {
        this.bgNoText.setOrigin(0.5);
        this.bgWithText.setOrigin(0.5);

        // 計算縮放係數
        this.bgScale = Math.min(width / this.bgNoText.width, height / this.bgNoText.height) * 0.7;
        this.bgNoText.setScale(this.bgScale);
        this.bgWithText.setScale(this.bgScale);

        // 將 A (有文字) 設為完全透明
        this.bgWithText.setAlpha(0);

        // 淡入 A (從 0 到 1)，覆蓋在 B 之上
        this.tweens.add({
            targets: this.bgWithText,
            alpha: 1,
            duration: 4500,
            ease: "Quad.easeInOut"
        });
    }

    // 取得玩家道德分數（判斷石頭亮暗）
    const moralScores = MoralState.getAll() || {};

    // 3. 五色寶石與對應美德/座標設定
    const stonePositions = [
        { key: "blue_stone", handKey: "hand_blue", domain: "purity", offsetX: -72, offsetY: 118 },
        { key: "green_stone", handKey: "hand_green", domain: "fairness", offsetX: 4, offsetY: -30 },
        { key: "pink_stone", handKey: "hand_pink", domain: "authority", offsetX: 131, offsetY: -30 },
        { key: "purple_stone", handKey: "hand_purple", domain: "harm", offsetX: 77, offsetY: 118 },
        { key: "yellow_stone", handKey: "hand_yellow", domain: "ingroup", offsetX: -124, offsetY: -30 }
    ];

    // 啟動儀式放置動畫序列
    this.playStonePlacementSequence(centerX, centerY, stonePositions, moralScores);
}

    /**
     * 寶石順序鑲嵌動畫序列
     */
    playStonePlacementSequence(centerX, centerY, stonePositions, moralScores) {
        let delayOffset = 600;

        stonePositions.forEach((item) => {
            const targetX = centerX + (item.offsetX * (this.bgScale / 0.7));
            const targetY = centerY + (item.offsetY * (this.bgScale / 0.7));
            const isBright = (moralScores[item.domain] ?? 0) > 0;

            this.time.delayedCall(delayOffset, () => {
                // 手部起始與移動偏移量 (依 bgScale 自動調整)
                const handStartY = targetY + (280 * this.bgScale);
                const handTargetY = targetY + (25 * this.bgScale) + 60;
                const handExitY = targetY + (200 * this.bgScale);

                const hand = safeAddImage(this, targetX - 40, handStartY, item.handKey, 10);

                if (hand) {
                    hand.setOrigin(0.5).setAlpha(0).setScale(this.bgScale * 0.85);

                    // 1. 手部放緩速度向上推至凹槽
                    this.tweens.add({
                        targets: hand,
                        y: handTargetY,
                        alpha: 1,
                        duration: 2000,
                        ease: "Cubic.out",
                        onComplete: () => {
                            const stone = safeAddImage(this, targetX, targetY, item.key, 5);
                            if (stone) {
                                if (!isBright) {
                                    stone.setAlpha(0.35);
                                    stone.setTint(0x777777);
                                } else {
                                    stone.setAlpha(1.0);
                                    stone.clearTint();
                                }

                                // 2. 寶石落入凹槽衝擊動畫 (規模與背景同步)
                                this.tweens.add({
                                    targets: stone,
                                    scale: {
                                        from: this.bgScale * 1.25,
                                        to: this.bgScale
                                    },
                                    duration: 350,
                                    ease: "Back.out"
                                });
                            }

                            hand.setTexture("hand_open")

                            // 3. 手部自然鬆開向下退場
                            this.tweens.add({
                                targets: hand,
                                y: handExitY,
                                alpha: 0,
                                duration: 2000,
                                ease: "Power1.in",
                                onComplete: () => hand.destroy()
                            });
                        }
                    });
                }
            });

            delayOffset += 4500;
        });

        // 放置完成後：換成包含說明的背景完整圖
        this.time.delayedCall(delayOffset + 600, () => {
            this.finishCutscene();
        });
    }

    /**
     * 動畫結束，帶參數切換至 EventCredits (Fade-out 時間拉長至 3000ms)
     */
    finishCutscene() {
        this.time.delayedCall(4000, () => {
            // 將淡出時間改為 3000 毫秒 (3 秒) 以實現更平緩慢速的退場效果
            this.cameras.main.fadeOut(3000, 0, 0, 0);

            this.cameras.main.once(
                Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => {
                    this.scene.start("EventCredits");
                }
            );
        });
    }
}