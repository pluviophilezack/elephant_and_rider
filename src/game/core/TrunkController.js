// 核心系統：騎象人的樹枝魔杖／象鼻互動——朝向跟隨滑鼠角度、按住空白鍵伸長、放開收回，
// 伸長時可拾起／放置場景中的單一物品（一次僅能拾起一個）
import * as Phaser from 'phaser';
export class TrunkController {

    constructor(scene, sprite, trunkSprite) {
        this.scene = scene;
        this.sprite = sprite;
        this.trunkSprite = trunkSprite;
        this.spaceKey = scene.input.keyboard.addKey('SPACE');
        this.heldItem = null;
    }

    // 每個 frame 呼叫一次：更新象鼻角度與伸縮狀態，並處理拾放判定
    update() {
        const pointer = this.scene.input.activePointer;
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            pointer.worldX, pointer.worldY
        );
        this.trunkSprite.setRotation(angle);

        const isStretched = this.spaceKey.isDown;
        this.trunkSprite.setTexture(isStretched ? 'wand_stretched' : 'wand_default');

        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
            this._tryPickOrPlace();
        }
    }

    // 嘗試在象鼻末端拾起或放下物品，交由呼叫方（各事件模組）判斷實際物件邏輯
    _tryPickOrPlace() {
        if (this.heldItem) {
            this.scene.events.emit('trunk-place', this.heldItem);
            this.heldItem = null;
        } else {
            this.scene.events.emit('trunk-pick-request', this.trunkSprite);
        }
    }

    // 供事件模組回呼：確認拾起了哪個物品
    setHeldItem(item) {
        this.heldItem = item;
    }
}
