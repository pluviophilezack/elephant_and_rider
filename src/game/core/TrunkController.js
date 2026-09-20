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

        // 綁定空白鍵按下事件（負責：手拉/放開物品、切換抓取）
        if (this.cursors.space) {
            this.cursors.space.on('down', () => {
                const isUnlocked = this.checkIsWandUnlocked();
                const isLocked = this.scene.isDialogueActive || (this.player && (this.player.isInteracting || this.player.isAutoMoving));

                if (isLocked) return;

                // 未解鎖魔杖時的按鍵處理
                if (!isUnlocked) {
                    if (this.heldItem) {
                        this.releaseItem();
                    } else {
                        const playerPos = this.player.getPosition();
                        this.checkBodyPickup(playerPos);
                    }
                    return;
                }

                // 已解鎖魔杖時：有拿物品就放下，沒拿物品就嘗試抓取
                this.toggleGrab();
            });
        }
    }

    // 核心判定：以 Overworld.js 的 sharedState.wand_unlocked 為主
    checkIsWandUnlocked() {
        if (this.scene.sharedState && this.scene.sharedState.wand_unlocked) {
            return true;
        }
        // 備用相容性判斷
        if (this.scene.wand_unlocked || this.scene.hasUnlockedWand || this.scene.hasRainStone) {
            return true;
        }
        return false;
    }

    getPlayerDepth() {
        if (this.player && this.player.sprite) {
            return this.player.sprite.depth || 10;
        }
        return 10;
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
        // 模式 A：未解鎖魔杖 (無魔杖狀態，走動與手持物品跟隨)
        // -------------------------------------------------------------
        if (!hasUnlockedWand) {
            this.wandBody.setVisible(false);
            this.wandTip.setVisible(false);
            this.currentBodyLength = 0;

            if (this.heldItem) {
                this.heldItem.x = playerPos.x;
                this.heldItem.y = playerPos.y;
            }
            return;
        }

        // -------------------------------------------------------------
        // 模式 B：已解鎖魔杖 (伸長魔杖與判定)
        // -------------------------------------------------------------
        this.wandTip.setVisible(true);

        // 按住空白鍵伸長魔杖；若未按住則縮回 (長度為 0)
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

        // --- 2. 計算 Tip 視覺座標 (位置保持在魔杖前端) ---
        const tipOffset = 25; 
        const totalDistance = this.currentBodyLength + tipOffset;

        this.tipX = handX + Math.cos(angle) * totalDistance;
        this.tipY = handY + Math.sin(angle) * totalDistance;

        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle);

        // --- 3. 單獨將「物理判定圈圈 (Hitbox)」往外推長 ---
        const extraHitboxPush = 20; 
        const localOffsetX = Math.cos(angle) * extraHitboxPush + (this.wandTip.width / 2) - this.hitboxRadius;
        const localOffsetY = Math.sin(angle) * extraHitboxPush + (this.wandTip.height / 2) - this.hitboxRadius;

        if (this.wandTip.body) {
            this.wandTip.body.setOffset(localOffsetX, localOffsetY);
        }

        // --- 4. 自動抓取與手持物品位置跟隨 ---
        if (this.currentBodyLength > 0 && !this.heldItem) {
            this.autoCheckWandGrab();
        }

        // 讓手持物品跟隨魔杖尖端 (tipX, tipY)
        if (this.heldItem) {
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
        }
    }

    // 未解鎖前近距離拾取
    checkBodyPickup(playerPos) {
        if (this.heldItem) return;

        const items = this.getItemsList();
        const pickupRadius = 45;

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            const dist = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, itm.x, itm.y);
            if (dist < pickupRadius) {
                this.attachItem(itm);
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

            const dist = Phaser.Math.Distance.Between(this.wandTip.body.center.x, this.wandTip.body.center.y, itm.x, itm.y);
            if (dist < grabRadius) {
                this.attachItem(itm);
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
            this.attachItem(closestItem);
        }
    }

    // 統一物品抓取與 Depth 設置
    attachItem(item) {
        if (!item) return;
        this.heldItem = item;

        // 1. 切斷物件可能殘留的 Tweens 動畫
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.heldItem);
        }

        // 2. 關閉物理 Body
        if (this.heldItem.body) {
            this.heldItem.body.enable = false;
        }

        // 把魔杖桿身、尖端與手持物品的 Depth 全部拉到主角與地形之上！
        const baseDepth = this.getPlayerDepth();
        
        if (this.wandBody) this.wandBody.setDepth(baseDepth + 5);
        if (this.wandTip) this.wandTip.setDepth(baseDepth + 6);
        
        // 物品疊在魔杖尖端的最上層 (比魔杖尖端再高 1 層)
        this.heldItem.setDepth(baseDepth + 100);
    }

   // 釋放/放下手上的物品
    releaseItem() {
        if (!this.heldItem) return;

        const item = this.heldItem;

        // 計算放下位置 (稍微前推避免重疊)
        const dropPush = 15; 
        const dropX = (this.tipX !== undefined ? this.tipX : item.x) + Math.cos(this.wandTip.rotation) * dropPush;
        const dropY = (this.tipY !== undefined ? this.tipY : item.y) + Math.sin(this.wandTip.rotation) * dropPush;

        // 1. 切斷動畫
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(item);
        }

        // 2. 更新座標
        item.setPosition(dropX, dropY);
        item.x = dropX;
        item.y = dropY;

        // 3. 恢復物理 Body 並重置
        if (item.body) {
            item.body.enable = true;
            item.body.reset(dropX, dropY);
            if (typeof item.body.setVelocity === 'function') {
                item.body.setVelocity(0, 0);
            }
        }

        // 放下時，強制將物品 Depth 設為比主角還低的層級 (低於主角)
        const playerDepth = this.getPlayerDepth();
        const groundDepth = Math.max(1, playerDepth - 5); // 確保在地上且低於主角
        item.setDepth(groundDepth);

        // 紀錄防二次吸附冷卻時間
        item.lastDroppedTime = this.scene.time.now;

        // 4. 清空手持狀態
        this.heldItem = null;
    }

    // 魔杖伸長時自動觸發抓取
    autoCheckWandGrab() {
        if (this.currentBodyLength <= 10) return;

        const items = this.getItemsList();
        const grabRadius = 35;
        const currentTime = this.scene.time.now;

        for (const itm of items) {
            if (!itm || !itm.active) continue;

            // 💡 關鍵檢查：如果這個物品剛被放下未滿 0.5 秒 (500ms)，跳過不抓取！
            if (itm.lastDroppedTime && (currentTime - itm.lastDroppedTime < 500)) {
                continue;
            }

            const dist = Phaser.Math.Distance.Between(this.wandTip.body.center.x, this.wandTip.body.center.y, itm.x, itm.y);
            if (dist < grabRadius) {
                this.attachItem(itm);
                break;
            }
        }
    }

    getItemsList() {
        if (!this.scene.items) return [];
        if (Array.isArray(this.scene.items)) return this.scene.items;
        if (typeof this.scene.items.getChildren === 'function') return this.scene.items.getChildren();
        return [];
    }
}
