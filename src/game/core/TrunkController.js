// 核心系統：騎象人的樹枝魔杖／象鼻互動——朝向跟隨滑鼠角度、按住空白鍵伸長、放開收回，
// 伸長時可拾起／放置場景中的單一物品（一次僅能拾起一個）
export class TrunkController {

    constructor(scene, playerController) {
        this.scene = scene;
        this.player = playerController;
        //抓取中物件
        this.heldItem = null;
        //最大伸長距離
        this.maxReachDistance = 150;
        //延伸視覺
        this.trunkGraphics = scene.add.graphics();
        //監聽滑鼠與鍵盤
        this.pointer = scene.input.activePointer();
        this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
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

        // 限制實際伸長不超過最大範圍
        const reachDistance = Math.min(distance, this.maxReachDistance);
        // 計算象鼻前端點 (Trunk Tip) 的座標
        this.tipX = playerPos.x + Math.cos(angle) * reachDistance;
        this.tipY = playerPos.y + Math.sin(angle) * reachDistance;

        // 繪製伸長的象鼻
        this.trunkGraphics.clear();
        this.trunkGraphics.lineStyle(4, 0x8B4513, 0.8);//顏色之後調
        this.trunkGraphics.lineBetween(playerPos.x, playerPos.y, this.tipX, this.tipY);

        // 若當前有抓取物件，讓物件跟隨象鼻前端點移動
        if (this.heldItem){
            this.heldObject.x = this.tipX;
            this.heldObject.y = this.tipY;
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
        // 取得場景中所有可被抓取的物件組（需要在場景中掛載 scene.interactiveItem)
        if (!this.scene.interactiveItem) return;

        const objects = this.scene.interactiveItem.getChildren();
        let closestItem = null;
        let minDistance = 40; // 抓取判定範圍距離

        //找出最近可抓取的物品
        item.forEach((itm) => {
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
                his.heldItem.body.enable = true; // 放置後恢復物理碰撞
            }
            this.heldItem = null;
        }
    }
}
