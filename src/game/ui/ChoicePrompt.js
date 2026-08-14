// UI元件：事件分支選擇時顯示的左右選項與游標，供 ChoiceSystem 呼叫
import * as Phaser from 'phaser';
export class ChoicePrompt {

    //constructor(scene, options) {
    constructor(scene, options, onConfirm = null) {
        this.scene = scene;
        this.options = options;
        this.selectedIndex = 0;
        this._isConfirmed = false;          //是否已選擇選項
        this.onConfirm = onConfirm;         //儲存外部回調

        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        this.optionTexts = options.map((option, i) => {
            const x = 512 + (i - (options.length - 1) / 2) * 260;
            const text = scene.add.text(x, 600, option.label, {
                fontFamily: 'Arial Black',  //字形
                fontSize: 26, //大小
                color: '#ffffff', //顏色
                align: 'center', //置中
                wordWrap: {
                    width: 200, //自動換行長度限制
                }
            }).setOrigin(0.5);

            ////滑鼠操作
            text.setInteractive({ useHandCursor: true });
            ////滑鼠點擊選擇
            text.on('pointerdown', () => { 
                //if (event) event.preventDefault();////阻止瀏覽器預設行為（文字選取、拖曳等）
                if (this._isConfirmed) return;

                this.selectedIndex = i;
                this._refreshHighlight();

                this._confirmChoice();
            });
            ////滑鼠移動選取
            text.on('pointerover', () => {
                if (this._isConfirmed) return;
                this.selectedIndex = i; ////選取移動到的選項
                this._refreshHighlight();
            });

            return text; 
        });

        this.container.add(this.optionTexts);

        // 文字邊框
        this.optionTexts.forEach((text) => {
            text.setStroke('#000000', 1); //顏色 寬度
        });

        // 建立文字的背景板
        this.optionBgs = [];
        this.optionTexts.forEach((text) => {
            const paddingX = 24;
            const paddingY = 12;
            const bgWidth = text.width + paddingX * 2;
            const bgHeight = text.height + paddingY * 2;

            const bg = scene.add.graphics();
            bg.setPosition(text.x, text.y);  // 對齊文字中心
            bg.fillStyle(0xffffff, 0.75);  //白色、透明度
            bg.fillRect(
                - bgWidth / 2,//text.x - bgWidth / 2,
                - bgHeight / 2,//text.y - bgHeight / 2,
                bgWidth,
                bgHeight,
            );
            bg.lineStyle(1, 0x0000FF, 1); //寬度 顏色 透明度
            bg.strokeRect(
                - bgWidth / 2,//text.x - bgWidth / 2,
                - bgHeight / 2,//text.y - bgHeight / 2,
                bgWidth,
                bgHeight,
            );

            // 將背景插入到文字下層
            const textIndex = this.container.getIndex(text);
            this.container.addAt(bg, textIndex);

            // 儲存背景物件
            this.optionBgs.push(bg);
        });

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
            text.setColor(i === this.selectedIndex ? '#ffe066' : '#ffffff'); //被選時變色
            text.setScale(i === this.selectedIndex ? 1.05 : 1); //被選時變大
        });
        this.optionBgs.forEach((bg,i) => {
            bg.setAlpha(i === this.selectedIndex ? 1 : 0.5); //被選時不透明
            bg.setScale(i === this.selectedIndex ? 1.05 : 1); //被選時變大
        })
    }

    ////
    _confirmChoice() {
        if (this._isConfirmed) return; 
        this._isConfirmed = true;

        const chosen = this.getSelected();
        if (this.onConfirm) {
            this.onConfirm(chosen);
        }
        this.destroy();
    }
    ////

    destroy() {
        this.container.destroy();
    }
}