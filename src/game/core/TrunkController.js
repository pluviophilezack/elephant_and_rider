import * as Phaser from 'phaser';

export class WandController {
    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;

        this.heldItem = null;
        this.maxReachDistance = 150;
        this.currentBodyLength = 0;

        this.pointer = scene.input.activePointer;
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 1. 桿身 (Body)
        this.wandBody = scene.add.sprite(0, 0, 'wand_extendable_part');
        this.wandBody.setOrigin(0, 0.5);
        this.wandBody.setDepth(100);
        this.wandBody.setVisible(false);

        // 2. 尖端 (Tip Sprite)
        this.wandTip = scene.physics.add.sprite(0, 0, 'wand_tip');
        this.wandTip.setOrigin(0.5, 0.5);
        this.wandTip.setDepth(101);
        this.wandTip.setVisible(false);

        // 初始化物理判定圈圈 (半徑 12px)
        this.hitboxRadius = 12;
        this.wandTip.body.setCircle(this.hitboxRadius);

        // 綁定空白鍵抓取/釋放邏輯
        if (this.cursors.space) {
            this.cursors.space.on('down', () => {
                const isUnlocked = this.checkIsWandUnlocked();
                const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

                if (!isUnlocked || isLocked) return;

                this.toggleGrab();
            });
        }
    }

    // 取得主角 Depth
    getPlayerDepth() {
        if (this.player && this.player.sprite) {
            return this.player.sprite.depth || 10;
        }
        return 10;
    }

    // 核心判定：優先偵測 tutorial 新增的 wand_unlocked 狀態
    checkIsWandUnlocked() {
        // 1. 檢查場景全域標記
        if (this.scene.wand_unlocked || this.scene.hasUnlockedWand || this.scene.hasRainStone) {
            return true;
        }

        // 2. 檢查目前執行的事件模組 (tutorial/index.js) 內的 wand_unlocked 屬性
        if (this.scene.eventsModule && this.scene.eventsModule.wand_unlocked) {
            return true;
        }
        if (this.scene.currentEvent && this.scene.currentEvent.wand_unlocked) {
            return true;
        }

        // 備用：若座標到達 1104, 802 (眼鏡交給長老時)
        const items = this.getItemsList();
        const glasses = items.find(itm => itm && itm.texture && itm.texture.key === 'glasses');
        if (glasses && glasses.x === 1104 && glasses.y === 802) {
            return true;
        }

        return false;
    }

    update() {
        const playerPos = this.player.getPosition();
        const pointerPos = { x: this.pointer.worldX, y: this.pointer.worldY };

        const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        const distance = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);

        // 手持極座標偏移 (讓魔杖從手部發出)
        const handSideOffset = 10;
        const handHeightOffset = -15;

        const handX = playerPos.x + Math.cos(angle + Math.PI / 2) * handSideOffset + Math.cos(angle) * handHeightOffset;
        const handY = playerPos.y + Math.sin(angle + Math.PI / 2) * handSideOffset + Math.sin(angle) * handHeightOffset;

        const hasUnlockedWand = this.checkIsWandUnlocked();
        const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

        // -------------------------------------------------------------
        // 模式 A：未解鎖魔杖 (走到旁邊按空白鍵拾取)
        // -------------------------------------------------------------
        if (!hasUnlockedWand) {
            this.wandBody.setVisible(false);
            this.wandTip.setVisible(false);
            this.currentBodyLength = 0;

            if (this.cursors.space && this.cursors.space.isDown) {
                this.checkBodyPickup(playerPos);
            } else if (this.heldItem) {
                this.heldItem.x = playerPos.x;
                this.heldItem.y = playerPos.y;
            }
            return;
        }

        // -------------------------------------------------------------
        // 模式 B：已解鎖魔杖 (伸長魔杖與判定)
        // -------------------------------------------------------------
        this.wandTip.setVisible(true);

        if (!isLocked && this.cursors.space && this.cursors.space.isDown) {
            this.currentBodyLength = Math.min(distance, this.maxReachDistance);
        } else {
            this.currentBodyLength = 0;
        }

        // --- 1. 更新 Body (桿身伸長) ---
        if (this.currentBodyLength > 0) {
            this.wandBody.setVisible(true);
            this.wandBody.setPosition(handX, handY);
            this.wandBody.setRotation(angle);
            this.wandBody.displayWidth = this.currentBodyLength;
        } else {
            this.wandBody.setVisible(false);
        }

        // --- 2. 計算 Tip 視覺座標與跟隨 (位置維持原樣) ---
        const tipOffset = 25; 
        const totalDistance = this.currentBodyLength + tipOffset;

        this.tipX = handX + Math.cos(angle) * totalDistance;
        this.tipY = handY + Math.sin(angle) * totalDistance;

        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle);

        // --- 3. 💡 單獨將「物理判定圈圈 (Body)」往外推長 ---
        const extraHitboxPush = 20; // 想要單獨往外推半徑的像素距離
        const localOffsetX = Math.cos(angle) * extraHitboxPush + (this.wandTip.width / 2) - this.hitboxRadius;
        const localOffsetY = Math.sin(angle) * extraHitboxPush + (this.wandTip.height / 2) - this.hitboxRadius;

        if (this.wandTip.body) {
            this.wandTip.body.setOffset(localOffsetX, localOffsetY);
        }

        // --- 4. 自動抓取與手持物品跟隨 ---
        if (this.currentBodyLength > 0 && !this.heldItem) {
            this.autoCheckWandGrab();
        }

        if (this.heldItem) {
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
        }
    }

    // 未解鎖前：近距離按空白鍵拾取
    checkBodyPickup(playerPos) {
        if (this.heldItem) {
            this.heldItem.x = playerPos.x;
            this.heldItem.y = playerPos.y;
            return;
        }

        const items = this.getItemsList();
        const pickupRadius = 45;

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, itm.x, itm.y);
            if (dist < pickupRadius) {
                this.heldItem = itm;
                if (this.heldItem.body) {
                    this.heldItem.body.enable = false;
                }
                // 拾取後圖層置於主角上方
                this.heldItem.setDepth(this.getPlayerDepth() + 1);
                break;
            }
        }
    }

    // 魔杖伸長時自動觸發抓取
    autoCheckWandGrab() {
        if (this.currentBodyLength <= 10) return;

        const items = this.getItemsList();
        const grabRadius = 35;

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            // 依據推出去後的判定點做感應
            const dist = Phaser.Math.Distance.Between(this.wandTip.body.center.x, this.wandTip.body.center.y, itm.x, itm.y);
            if (dist < grabRadius) {
                this.heldItem = itm;
                if (this.heldItem.body) {
                    this.heldItem.body.enable = false;
                }
                // 拾取後圖層置於主角上方
                this.heldItem.setDepth(this.getPlayerDepth() + 1);
                break;
            }
        }
    }

    toggleGrab() {
        if (this.heldItem) {
            this.releaseItem();
        } else {
            this.tryGrabItem();
        }
    }

    tryGrabItem() {
        if (this.currentBodyLength <= 10) return;

        const items = this.getItemsList();
        let closestItem = null;
        let minDistance = 35;

        items.forEach((itm) => {
            if (!itm || !itm.active) return;
            const dist = Phaser.Math.Distance.Between(this.wandTip.body.center.x, this.wandTip.body.center.y, itm.x, itm.y);
            if (dist < minDistance) {
                minDistance = dist;
                closestItem = itm;
            }
        });

        if (closestItem) {
            this.heldItem = closestItem;
            if (this.heldItem.body) {
                this.heldItem.body.enable = false;
            }
            this.heldItem.setDepth(this.getPlayerDepth() + 1);
        }
    }

    releaseItem() {
        if (this.heldItem) {
            if (this.heldItem.body) {
                this.heldItem.body.enable = true;
            }
            // 釋放物品後圖層還原至底部
            this.heldItem.setDepth(1);
            this.heldItem = null;
        }
    }

    getItemsList() {
        if (!this.scene.items) return [];
        if (Array.isArray(this.scene.items)) return this.scene.items;
        if (typeof this.scene.items.getChildren === 'function') return this.scene.items.getChildren();
        return [];
    }
}
