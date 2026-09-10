import * as Phaser from 'phaser';

export class WandController {
    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;

        this.heldItem = null;
        this.maxReachDistance = 150;
        this.currentBodyLength = 0; // 紀錄當前魔杖伸長長度

        this.pointer = scene.input.activePointer;
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 1. 桿身 (Body)
        this.wandBody = scene.add.sprite(0, 0, 'wand_extendable_part');
        this.wandBody.setOrigin(0, 0.5);
        this.wandBody.setDepth(100);
        this.wandBody.setVisible(false);

        // 2. 尖端 (Tip)
        this.wandTip = scene.physics.add.sprite(0, 0, 'wand_tip');
        this.wandTip.setOrigin(0.5, 0.5);
        this.wandTip.setDepth(101);
        this.wandTip.setVisible(false);

        // 設定圓形碰撞盒於尖端叉叉上
        const radius = 12;
        this.wandTip.body.setCircle(radius);
        this.wandTip.body.setOffset(
            (this.wandTip.width / 2) - radius,
            (this.wandTip.height / 2) - radius
        );

        // 綁定空白鍵抓取/釋放邏輯
        if (this.cursors.space) {
            this.cursors.space.on('down', () => {
                const isUnlocked = this.checkIsWandUnlocked();
                const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

                if (!isUnlocked || isLocked) return;

                // 按下空白鍵時進行切換抓取/放開判斷
                this.toggleGrab();
            });
        }
    }

    checkIsWandUnlocked() {
        if (this.scene.hasUnlockedWand || this.scene.hasRainStone) {
            return true;
        }

        const items = this.getItemsList();
        const glasses = items.find(itm => itm && itm.texture && itm.texture.key === 'glasses');
        if (glasses && glasses.x === 1104 && glasses.y === 802) {
            this.scene.hasUnlockedWand = true;
            return true;
        }

        return false;
    }

    update() {
        const playerPos = this.player.getPosition();
        const pointerPos = { x: this.pointer.worldX, y: this.pointer.worldY };

        const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        const distance = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);

        // 手持極座標偏移，確保魔杖發射點在手上
        const handSideOffset = 10;
        const handHeightOffset = -15;

        const handX = playerPos.x + Math.cos(angle + Math.PI / 2) * handSideOffset + Math.cos(angle) * handHeightOffset;
        const handY = playerPos.y + Math.sin(angle + Math.PI / 2) * handSideOffset + Math.sin(angle) * handHeightOffset;

        const hasUnlockedWand = this.checkIsWandUnlocked();
        const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

        // -------------------------------------------------------------
        // 模式 A：未解鎖魔杖 (靠身體接近拾取)
        // -------------------------------------------------------------
        if (!hasUnlockedWand) {
            this.wandBody.setVisible(false);
            this.wandTip.setVisible(false);
            this.currentBodyLength = 0;
            this.checkBodyPickup(playerPos);
            return;
        }

        // -------------------------------------------------------------
        // 模式 B：已解鎖魔杖 (需伸長才能抓取)
        // -------------------------------------------------------------
        this.wandTip.setVisible(true);

        // 按住空白鍵時伸長魔杖，否則長度為 0
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

        // --- 2. 計算 Tip 尖端座標與跟隨 ---
        const tipOffset = 25; // 叉叉位置微調
        const totalDistance = this.currentBodyLength + tipOffset;

        this.tipX = handX + Math.cos(angle) * totalDistance;
        this.tipY = handY + Math.sin(angle) * totalDistance;

        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle);

        // --- 3. 魔杖伸長時自動判斷周圍物品抓取 ---
        if (this.currentBodyLength > 0 && !this.heldItem) {
            this.autoCheckWandGrab();
        }

        // 若已抓取物品，讓物品固定在魔杖尖端叉叉上
        if (this.heldItem) {
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
        }
    }

    // 尚未解鎖魔杖時：身體靠近拾取
    checkBodyPickup(playerPos) {
        if (this.heldItem) {
            this.heldItem.x = playerPos.x;
            this.heldItem.y = playerPos.y;
            return;
        }

        const items = this.getItemsList();
        const pickupRadius = 35;

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, itm.x, itm.y);
            if (dist < pickupRadius) {
                this.heldItem = itm;
                if (this.heldItem.body) {
                    this.heldItem.body.enable = false;
                }
                break;
            }
        }
    }

    // 當魔杖伸長（currentBodyLength > 0）且尖端接觸物品時自動抓取
    autoCheckWandGrab() {
        // 核心限制：魔杖必須延伸達到一定距離（例如 > 10px），不能在收起狀態下抓取
        if (this.currentBodyLength <= 10) return;

        const items = this.getItemsList();
        const grabRadius = 30; // 尖端叉叉感應範圍

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            const dist = Phaser.Math.Distance.Between(this.tipX, this.tipY, itm.x, itm.y);
            if (dist < grabRadius) {
                this.heldItem = itm;
                if (this.heldItem.body) {
                    this.heldItem.body.enable = false;
                }
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
        // 關鍵核心限制：必須在魔杖伸長（currentBodyLength > 10）時才允許拾取物品
        if (this.currentBodyLength <= 10) return;

        const items = this.getItemsList();
        let closestItem = null;
        let minDistance = 35;

        items.forEach((itm) => {
            if (!itm || !itm.active) return;
            const dist = Phaser.Math.Distance.Between(this.tipX, this.tipY, itm.x, itm.y);
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
        }
    }

    releaseItem() {
        if (this.heldItem) {
            if (this.heldItem.body) {
                this.heldItem.body.enable = true;
            }
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
