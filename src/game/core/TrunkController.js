import * as Phaser from 'phaser';

export class WandController {
    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;

        this.heldItem = null;
        this.maxReachDistance = 150;

        this.pointer = scene.input.activePointer;
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 1. 桿身 (Body)
        this.wandBody = scene.add.sprite(0, 0, 'wand_extendable_part');
        this.wandBody.setOrigin(0, 0.5);
        this.wandBody.setDepth(100);
        this.wandBody.setVisible(false);

        // 2. 尖端 (Tip)
        this.wandTip = scene.physics.add.sprite(0, 0, 'wand_tip');
        this.wandTip.setOrigin(0, 0.5);
        this.wandTip.setDepth(101);
        this.wandTip.body.setSize(20, 20);

        // 綁定空白鍵按下事件
        if (this.cursors.space) {
            this.cursors.space.on('down', () => {
                // 檢查是否拿到 rainStone，以及是否處於對話或自動移動中
                const hasUnlockedWand = this.scene.hasRainStone || this.scene.hasUnlockedWand;
                const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

                // 尚未取得 rainStone 或處於鎖定狀態時，禁止抓取
                if (!hasUnlockedWand || isLocked) {
                    return;
                }

                this.toggleGrab();
            });
        }
    }

    update() {
        const playerPos = this.player.getPosition();
        const pointerPos = { x: this.pointer.worldX, y: this.pointer.worldY };

        const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        const distance = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);

        const idleOffset = 10;
        let currentBodyLength = 0;

        // 核心解鎖條件：
        // 1. 玩家已經替猴子長老找到 rainStone (this.scene.hasRainStone)
        // 2. 當前不在對話中 (isDialogueActive) 且不在自動移動中 (isAutoMoving)
        const hasUnlockedWand = this.scene.hasRainStone || this.scene.hasUnlockedWand;
        const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

        // 只有「已解鎖能力」且「無鎖定」且「按住空白鍵」時，魔杖才會伸長
        if (hasUnlockedWand && !isLocked && this.cursors.space && this.cursors.space.isDown) {
            currentBodyLength = Math.min(distance, this.maxReachDistance);
        }

        // --- 1. 更新 Body (中間伸長段) ---
        if (currentBodyLength > 0) {
            this.wandBody.setVisible(true);
            this.wandBody.setPosition(playerPos.x, playerPos.y);
            this.wandBody.setRotation(angle);
            this.wandBody.displayWidth = currentBodyLength;
        } else {
            this.wandBody.setVisible(false);
        }

        // --- 2. 計算 Tip 位置與物品跟隨 ---
        this.tipX = playerPos.x + Math.cos(angle) * (currentBodyLength + idleOffset - 10.5);
        this.tipY = playerPos.y + Math.sin(angle) * (currentBodyLength + idleOffset - 14);

        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle);

        if (this.heldItem) {
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
        }
    }

    // ... toggleGrab, tryGrabItem, releaseItem 保持不變 ...
    toggleGrab() {
        if (this.heldItem) {
            this.releaseItem();
        } else {
            this.tryGrabItem();
        }
    }

    tryGrabItem() {
        if (!this.cursors.space.isDown) return;

        const items = this.scene.items ? (this.scene.items.getChildren ? this.scene.items.getChildren() : this.scene.items) : [];
        let closestItem = null;
        let minDistance = 40;

        items.forEach((itm) => {
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
}

