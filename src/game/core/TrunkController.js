// 核心系統：騎象人的樹枝魔杖／象鼻互動——朝向跟隨滑鼠角度、按住空白鍵伸長、放開收回，
// 伸長時可拾起／放置場景中的單一物品（一次僅能拾起一個）
import * as Phaser from 'phaser';

export class WandController {
    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;
        //抓取中物件
        this.heldItem = null;
        //最大伸長距離
        this.maxReachDistance = 150;
        //延伸視覺
        this.wandGraphics = scene.add.graphics();
        //監聽滑鼠與鍵盤
        this.pointer = scene.input.activePointer;
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.wandBody = scene.add.tileSprite(0, 0, 0, 16, 'wand_extendable_part');
        this.wandBody.setOrigin(0, 0.5); // 設定旋轉與延伸原點在左側中心
        this.wandTip = scene.physics.add.sprite(0, 0, 'wand_tip');
        this.wandTip.setOrigin(0.5, 0.5); // 原點在中心
        // 預設先隱藏桿身，放開鍵時不顯示
        this.wandBody.setVisible(false);
        this.wandTip.setVisible(true);
        
        // 空白鍵按下時觸發抓取或放置
        this.spaceKey.on('down', ()=>{
            this.toggleGrab();
        });
    }

    // 每個 frame 呼叫一次：更新象鼻角度與伸縮狀態，並處理拾放判定
    update() {
        const playerPos = this.player.getPosition();
        const pointerPos = { x: this.pointer.worldX, y: this.pointer.worldY };
        
        // 計算滑鼠與主角間的角度與距離
        const angle = Phaser.Math.Angle.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        const distance = Phaser.Math.Distance.Between(playerPos.x, playerPos.y, pointerPos.x, pointerPos.y);
        // 未按住空白鍵時預設極小距離（如 12px，代表放在主角手上）
        const idleOffset = 12;

        // 機制補齊：僅在「按住空白鍵」時伸長，放開時收回至主角位置
       if (this.spaceKey.isDown) {
            this.reachDistance = Math.min(distance, this.maxReachDistance);
        } else {
            this.reachDistance = idleOffset;
        }

        // 計算魔杖前端點 (Wand Tip) 的座標
        this.tipX = playerPos.x + Math.cos(angle) * reachDistance;
        this.tipY = playerPos.y + Math.sin(angle) * reachDistance;

        // 4. 更新尖端位置與旋轉角度
        this.wandTip.setPosition(this.tipX, this.tipY);
        this.wandTip.setRotation(angle); // 尖端跟隨滑鼠方向旋轉

        // 5. 更新中間桿身 (TileSprite)
        if (reachDistance > 0) {
            this.wandBody.setVisible(true);
            this.wandBody.setPosition(playerPos.x, playerPos.y); // 起始點在主角中心
            this.wandBody.width = reachDistance;                 // 依伸長距離動態調整長度
            this.wandBody.setRotation(angle);                    // 轉向滑鼠
        } else {
            this.wandBody.setVisible(false);
        }
        
        // 若當前有抓取物件，讓物件跟隨象鼻前端點移動
        if (this.heldItem){
            this.heldItem.x = this.tipX;
            this.heldItem.y = this.tipY;
        }
    }
    toggleGrab(){
        if (this.heldItem){
            //放置物件
            this.releaseItem();
        }else{
            //抓取物件
            this.tryGrabItem();
        }
    }

    tryGrabItem(){
        if (!this.spaceKey.isDown) return;
        // 取得場景中的可互動物品列表（例如 scene.items 陣列或 Physics Group）
        const items = this.scene.items ? (this.scene.items.getChildren ? this.scene.items.getChildren() : this.scene.items) : [];
        
        let closestItem = null;
        let minDistance = 40; // 抓取判定範圍距離

        //找出最近可抓取的物品
        items.forEach((itm) => {
            const dist = Phaser.Math.Distance.Between(this.tipX, this.tipY, itm.x, itm.y);
            if (dist < minDistance){
                minDistance = dist;
                closestItem = itm;
            }
        });

        if (closestItem){
            this.heldItem = closestItem;
            if (this.heldItem.body){
                this.heldItem.body.enable = false; // 抓取時關閉物理碰撞
            }
        }
    }

    releaseItem(){
        if (this.heldItem){
            if (this.heldItem.body){
                this.heldItem.body.enable = true; // 放置後恢復物理碰撞
            }
            this.heldItem = null;
        }
    }
}
