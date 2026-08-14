// UI元件：畫面下方的對話文字泡，供 DialogueSystem 呼叫顯示單詞式對話
export class DialogueBox {

    constructor(scene) {
        this.scene = scene;
        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);

        this.background = scene.add.rectangle(512, 680, 600, 80, 0xffffff, 0.6)
            .setStrokeStyle(2, 0x000000);
        this.text = scene.add.text(512, 680, '', {
            fontFamily: 'Arial Black', fontSize: 28, color: '#000000',
            align: 'center'
        }).setOrigin(0.5);

        this.container.add([this.background, this.text]);

        this._advanceCallback = null;
        this.scene.input.on('pointerdown', this._handleAdvance, this);
    }

    setText(line) {
        this.text.setText(line);

        const padding = 40
        const newWidth = Math.max(this.text.width + padding, 300);
        this.background.setSize(newWidth, this.background.height);
    }

    onAdvance(callback) {
        this._advanceCallback = callback;
    }

    _handleAdvance() {
        if (this._advanceCallback) this._advanceCallback();
    }

    destroy() {
        this.scene.input.off('pointerdown', this._handleAdvance, this);
        this.container.destroy();
    }
}
