// UI元件：畫面上方的抬頭顯示，目前顯示玩家已蒐集的祈雨石數量（目標六顆）
export class HUD {

    constructor(scene, { maxRainStones = 6 } = {}) {
        this.scene = scene;
        this.maxRainStones = maxRainStones;
        this.rainStoneCount = 0;

        this.container = scene.add.container(20, 20)
            .setScrollFactor(0)
            .setDepth(1000);

        this.background = scene.add.rectangle(0, 0, 176, 46, 0x1f2933, 0.78)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff, 0.35);

        this.icon = scene.add.image(29, 23, 'rain_stone')
            .setScale(0.26);

        this.text = scene.add.text(58, 10, this._formatText(), {
            fontFamily: 'Arial Black',
            fontSize: 22,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.container.add([this.background, this.icon, this.text]);
    }

    addRainStone(amount = 1) {
        this.setRainStoneCount(this.rainStoneCount + amount);
    }

    setRainStoneCount(count) {
        this.rainStoneCount = Math.max(0, Math.min(count, this.maxRainStones));
        this.text.setText(this._formatText());
    }

    resetRainStones() {
        this.setRainStoneCount(0);
    }

    hasEnoughRainStones() {
        return this.rainStoneCount >= this.maxRainStones;
    }

    _formatText() {
        return `${this.rainStoneCount} / ${this.maxRainStones}`;
    }
}
