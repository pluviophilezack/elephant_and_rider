import * as Phaser from 'phaser';

export class WandController {
    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;

        this.heldItem = null;
        this.maxReachDistance = 150;

        this.pointer = scene.input.activePointer;
        this.cursors = scene.input.keyboard.createCursorKeys();

        // 1. 桿身 (Body)：改用一般 Sprite，原點設在左側中心 (0, 0.5)
        this.wandBody = scene.add.sprite(0, 0, 'wand_extendable_part');
        this.wandBody.setOrigin(0, 0.5);
        this.wandBody.setDepth(100);
        this.wandBody.setVisible(false);

        // 2. 尖端 (Tip)：物理 Sprite，原點設在左側底部切齊點 (0, 0.5)
        this.wandTip = scene.physics.add.sprite(0, 0, 'wand_tip');
        this.wandTip.setOrigin(0, 0.5); // 讓屁股剛好黏在 Body 頂端
        this.wandTip.setDepth(101);

        // 縮小 Tip 的物理碰撞盒，避免過大
        this.wandTip.body.setSize(20, 20);

        // 綁定空白鍵按下事件
        if (this.cursors.space) {
            this.cursors.space.on('down', () => this.toggleGrab());
        }
    }

    update() {
        const playerPos = this.player.getPosition();
        const pointerPos = { x: this.pointer.worldX, y: this.pointer.worldY };

        // 計算角度與距離
        const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        const distance = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);

        const idleOffset = 10; // 平常停在手上的微小距離
        let currentBodyLength = 0;

        // 當按住空白鍵時計算伸長距離
        if (this.cursors.space && this.cursors.space.isDown) {
            currentBodyLength = Math.min(distance, this.maxReachDistance);
        }

        // --- 1. 更新 Body (中間伸長段) ---
        if (currentBodyLength > 0) {
            this.wandBody.setVisible(true);
            this.wandBody.setPosition(playerPos.x, playerPos.y);
            this.wandBody.setRotation(angle);
            // 使用 displayWidth 直接等比拉長 Body
            this.wandBody.displayWidth = currentBodyLength;
        } else {
            this.wandBody.setVisible(false);
        }

        // --- 2. 計算 Tip (樹枝頭) 位置 ---
        // Tip 的位置永遠等於：主角座標 + Body 當前伸長總長度
        this.tipX = playerPos.x + Math.cos(angle) * (currentBodyLength + idleOffset - 10.5);
        this.tipY = playerPos.y + Math.sin(angle) * (currentBodyLength + idleOffset - 14);

        // --- 3. 更新 Tip 座標與角度 ---
        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle);

        // --- 4. 抓取物品跟隨 ---
        if (this.heldItem) {
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
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
        // 必須按住空白鍵伸長時才能抓取
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
