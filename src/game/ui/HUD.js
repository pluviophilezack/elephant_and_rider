// UI元件：畫面上方的抬頭顯示，目前顯示玩家已蒐集的祈雨石數量（目標六顆）
export class HUD {

    constructor(scene) {
        this.scene = scene;
        this.rainStoneCount = 0;

        this.text = scene.add.text(20, 20, this._formatText(), {
            fontFamily: 'Arial Black', fontSize: 24, color: '#ffffff',
            stroke: '#000000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);
    }

    addRainStone(amount = 1) {
        this.rainStoneCount += amount;
        this.text.setText(this._formatText());
    }

    _formatText() {
        return `祈雨石 ${this.rainStoneCount} / 6`;
    }
}
