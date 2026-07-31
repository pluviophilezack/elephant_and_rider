// UI元件：事件分支選擇時顯示的左右選項與游標，供 ChoiceSystem 呼叫
export class ChoicePrompt {

    constructor(scene, options) {
        this.scene = scene;
        this.options = options;
        this.selectedIndex = 0;

        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.optionTexts = options.map((option, i) => {
            const x = 512 + (i - (options.length - 1) / 2) * 260;
            return scene.add.text(x, 600, option.label, {
                fontFamily: 'Arial Black', fontSize: 26, color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
        });

        this.container.add(this.optionTexts);
        this._refreshHighlight();
    }

    moveCursor(direction) {
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.options.length);
        this._refreshHighlight();
    }

    getSelected() {
        return this.options[this.selectedIndex];
    }

    _refreshHighlight() {
        this.optionTexts.forEach((text, i) => {
            text.setColor(i === this.selectedIndex ? '#ffe066' : '#ffffff');
        });
    }

    destroy() {
        this.container.destroy();
    }
}
