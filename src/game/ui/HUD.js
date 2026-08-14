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

        this.icon = scene.add.graphics();
        this._drawRainStoneIcon();

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

    _drawRainStoneIcon() {
        this.icon.clear();
        this.icon.fillStyle(0x69c7ff, 1);
        this.icon.lineStyle(3, 0xffffff, 0.9);
        this.icon.beginPath();
        this.icon.moveTo(30, 7);
        this.icon.lineTo(47, 20);
        this.icon.lineTo(38, 39);
        this.icon.lineTo(18, 39);
        this.icon.lineTo(10, 20);
        this.icon.closePath();
        this.icon.fillPath();
        this.icon.strokePath();

        this.icon.fillStyle(0xffffff, 0.45);
        this.icon.fillCircle(25, 17, 4);
    }

    _formatText() {
        return `${this.rainStoneCount} / ${this.maxRainStones}`;
    }
}
