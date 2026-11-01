import * as Phaser from "phaser";
import { MoralState } from "../core/MoralState";

/**
 * 安全新增 Image 函式：確保紋理存在才建立，避免找不到紋理而噴錯
 */
function safeAddImage(scene, x, y, key, depth = 0, size = 2) {
    if (scene.textures.exists(key)) {
        const img = scene.add.image(x, y, key).setDepth(depth);
        img.setScale(size)
        return img;
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

        // 1. 鋪上符合遊戲風格的深灰褐色底色 (避免硬拉變形顯得空洞)
        this.add.rectangle(centerX, centerY, width, height, 0x20262b).setDepth(0);

        // 2. 祭壇底圖：保持原圖比例等比縮放，不硬拉變形
        this.bg = safeAddImage(this, centerX, centerY + 30, "stone_system_without_text", 1);
        if (this.bg) {
            this.bg.setOrigin(0.5);
            // 若底圖大於畫布則進行等比縮放
            const scale = Math.min(width / this.bg.width, height / this.bg.height) * 0.95;
            this.bg.setScale(scale);
        }

        // 取得玩家道德分數（判斷石頭亮暗）
        const moralScores = MoralState.getAll() || {};

        // 3. 五色寶石與對應美德/座標設定 (修正為精確置中座標與輕微自然旋轉)
        const stonePositions = [
            { key: "blue_stone", handKey: "hand_blue", offsetX: -120, offsetY: 180 },
            { key: "green_stone", handKey: "hand_green", offsetX: 0, offsetY: -70 },
            { key: "pink_stone", handKey: "hand_pink", offsetX: 240, offsetY: -70 },
            { key: "purple_stone", handKey: "hand_purple", offsetX: 120, offsetY: 180 },
            { key: "yellow_stone", handKey: "hand_yellow", offsetX: -240, offsetY: -70 }        ];

        // 啟動儀式放置動畫序列
        this.playStonePlacementSequence(centerX, centerY, stonePositions, moralScores);
    }

    /**
     * 寶石順序鑲嵌動畫序列
     */
    playStonePlacementSequence(centerX, centerY, stonePositions, moralScores) {
        let delayOffset = 600; // 初始延遲

        stonePositions.forEach((item) => {
            const targetX = centerX + item.offsetX;
            const targetY = centerY + item.offsetY;
            // 美德分數 <= 0 則設為暗色樣式
            const isBright = (moralScores[item.domain] ?? 0) > 0;

            this.time.delayedCall(delayOffset, () => {
                // 手部起始位置：從下方平緩向上移動，修正太高的問題
                const handStartY = targetY + 280;
                const hand = safeAddImage(this, targetX, handStartY, item.handKey, 10);

                if (hand) {
                    hand.setOrigin(0.5).setAlpha(0).setScale(0.85);

                    // 1. 手部放緩速度向上推至凹槽
                    this.tweens.add({
                        targets: hand,
                        y: targetY + 25, // 控制停止點，避免手部跑太高
                        alpha: 1,
                        duration: 900,  // 調慢手部移動速度
                        ease: "Cubic.out",
                        onComplete: () => {
                            const stone = safeAddImage(this, targetX, targetY, item.key, 5);
                            if (stone) {
                                // 明暗度控制：暗色則調低 Alpha 與 Tint 顏色的明亮度
                                if (!isBright) {
                                    stone.setAlpha(0.35);
                                    stone.setTint(0x777777);
                                } else {
                                    stone.setAlpha(1.0);
                                    stone.clearTint();
                                }

                                // 寶石落入凹槽衝擊動畫
                                this.tweens.add({
                                    targets: stone,
                                    scale: { from: 1.15, to: 0.85 },
                                    duration: 350,
                                    ease: "Back.out"
                                });
                            }

                            // 3. 手部自然鬆開向下退場
                            this.tweens.add({
                                targets: hand,
                                y: targetY + 200,
                                alpha: 0,
                                duration: 600, // 放緩退場速度
                                ease: "Power1.in",
                                onComplete: () => hand.destroy()
                            });
                        }
                    });
                }
            });

            delayOffset += 1100; // 各石頭之間的放置間隔拉長，使整體動畫更優雅
        });

        // 放置完成後：換成包含說明的背景完整圖，並準備進入結尾
        this.time.delayedCall(delayOffset + 600, () => {
            if (this.bg && this.textures.exists("stone_system")) {
                this.bg.setTexture("stone_system");
            }
            this.finishCutscene();
        });
    }

    /**
     * 動畫結束，帶參數切換至 EventCredits
     */
    finishCutscene() {
        this.time.delayedCall(4000, () => {
            this.cameras.main.fadeOut(1500, 0, 0, 0);

            this.cameras.main.once(
                Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
                () => {
                    const url = new URL(window.location.href);
                    url.searchParams.set("credits", "1");
                    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
                    this.scene.start("EventCredits");
                }
            );
        });
    }
}