// UI元件：事件分支選擇時顯示的左右選項與游標，供 ChoiceSystem 呼叫
import * as Phaser from 'phaser';
export class ChoicePrompt {

    //constructor(scene, options) {
    constructor(scene, options, onConfirm = null) {
        this.scene = scene;
        this.options = options;
        this.selectedIndex = 0;
        this.inputEnabled = true;
        this._isConfirmed = false;          //是否已選擇選項
        this.onConfirm = onConfirm;         //儲存外部回調

        //手繪框參數0921
        this.roughness = 2;         // 抖動程度
        this.segmentLength = 10;    // 越小越細緻
        this.strokeColor = 0x5c5a93;
        this.strokeWidth = 2;

        this.container = scene.add.container(0, 0).setScrollFactor(0).setDepth(100000);
        this.optionTexts = options.map((option, i) => {
            const x = 512 + (i - (options.length - 1) / 2) * 320;////
            const text = scene.add.text(x, 600, option.label, {
                fontFamily: 'naikaifont',//'Arial Black',  //字形
                fontSize: 24, //大小
                color: '#5c5a93', //顏色
                align: 'center', //置中
                wordWrap: {
                    width: 200, //自動換行長度限制
                },
                lineSpacing: 16, //行距
                letterSpacing: 5, //字距
            }).setOrigin(0.5);

            ////滑鼠操作
            text.setInteractive({ useHandCursor: true });
            ////滑鼠點擊選擇
            text.on('pointerdown', () => { 
                //if (event) event.preventDefault();////阻止瀏覽器預設行為（文字選取、拖曳等）
                if (!this.inputEnabled || this._isConfirmed) return;

                this.selectedIndex = i;
                this._refreshHighlight();

                this._confirmChoice();
            });
            ////滑鼠移動選取
            text.on('pointerover', () => {
                if (!this.inputEnabled || this._isConfirmed) return;
                this.selectedIndex = i; ////選取移動到的選項
                this._refreshHighlight();
            });

            return text; 
        });

        this.container.add(this.optionTexts);

        // 文字邊框
        this.optionTexts.forEach((text) => {
            text.setStroke('#000000', 0); //顏色 寬度
        });

        // 建立文字的背景板
        this.optionBgs = [];
        this.optionBounds = [];   // 🆕 用來記錄每個選項的螢幕判定範圍0914
        this.optionSize = [];   // 🆕 記錄每個選項框尺寸，重繪時要用0921
        
        this.optionTexts.forEach((text) => {
            const paddingX = 20;
            const paddingY = 10;
            const bgWidth = text.width + paddingX * 2;
            const bgHeight = text.height + paddingY * 2;

            const bg = scene.add.graphics();
            bg.setPosition(text.x, text.y);  // 對齊文字中心
            // bg.fillStyle(0xffffff, 1);  //白色、透明度
            // bg.fillRect(
            //     - bgWidth / 2,//text.x - bgWidth / 2,
            //     - bgHeight / 2,//text.y - bgHeight / 2,
            //     bgWidth,
            //     bgHeight,
            // );
            // bg.lineStyle(5, 0x0000FF, 0); //寬度 顏色 透明度
            // bg.strokeRect(
            //     - bgWidth / 2,//text.x - bgWidth / 2,
            //     - bgHeight / 2,//text.y - bgHeight / 2,
            //     bgWidth,
            //     bgHeight,
            // );
            // 手繪外框
            this._drawHandDrawnRect(bg, -bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 101);

            // 將背景插入到文字下層
            const textIndex = this.container.getIndex(text);
            this.container.addAt(bg, textIndex);

            // 儲存背景物件
            this.optionBgs.push(bg);
            this.optionSize.push({ w: bgWidth, h: bgHeight });
//0914
            // 🆕 記錄判定範圍（螢幕座標，因為 UI 不隨鏡頭滾動）
            this.optionBounds.push({
                left: text.x - bgWidth / 2,
                right: text.x + bgWidth / 2,
                top: text.y - bgHeight / 2,
                bottom: text.y + bgHeight / 2
            });
//0914
        });

        this._refreshHighlight();

        // 🆕 滑鼠判定//0908
        this.inputLayer = scene.add.zone(
            0, 0,
            scene.scale.width,
            scene.scale.height
        )
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(100001)          // 比 container 更高
        .setInteractive();

        this.inputLayer.on('pointerdown', (pointer, x, y, event) => {
            // ✅ 安全地阻止瀏覽器預設行為
            const nativeEvent = pointer.event || event;
            if (nativeEvent && typeof nativeEvent.preventDefault === 'function') {
                nativeEvent.preventDefault();
            }

            if (this._isConfirmed) return;

            const hit = this._hitTest(pointer.x, pointer.y);
            if (hit >= 0) {
                this.selectedIndex = hit;
                this._refreshHighlight();
                this._confirmChoice();
            }
        });

        // 滑鼠移動選取
        this.inputLayer.on('pointermove', (pointer) => {
            if (this._isConfirmed) return;
            const hit = this._hitTest(pointer.x, pointer.y);
            if (hit >= 0 && hit !== this.selectedIndex) {
                this.selectedIndex = hit;
                this._refreshHighlight();
            }
        });
        //0914
    }

    //手繪風不規則矩形（從 DialogueBox 移植過來）0921
    _drawHandDrawnRect(graphics, x, y, width, height, seed = 0) {
        graphics.clear();

        const roughness = this.roughness;
        const segmentLength = this.segmentLength;
        const points = [];

        const cols = Math.max(2, Math.ceil(width / segmentLength));
        const rows = Math.max(2, Math.ceil(height / segmentLength));

        const getJitter = (i, offsetKey) => {
            const val = Math.sin(i * 12.9898 + offsetKey * 78.233 + seed * 53.7) * 43758.5453;
            return (val - Math.floor(val) - 0.5) * 2 * roughness;
        };

        // 上邊
        for (let i = 0; i <= cols; i++) {
            points.push({
                x: x + (i / cols) * width,
                y: y + (i === 0 || i === cols ? 0 : getJitter(i, 1)),
            });
        }
        // 右邊
        for (let i = 1; i <= rows; i++) {
            points.push({
                x: x + width + (i === rows ? 0 : getJitter(i, 2)),
                y: y + (i / rows) * height,
            });
        }
        // 下邊
        for (let i = 1; i <= cols; i++) {
            points.push({
                x: x + width - (i / cols) * width,
                y: y + height + (i === cols ? 0 : getJitter(i, 3)),
            });
        }
        // 左邊
        for (let i = 1; i < rows; i++) {
            points.push({
                x: x + getJitter(i, 4),
                y: y + height - (i / rows) * height,
            });
        }

        // 填白底
        graphics.fillStyle(0xffffff, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
    }

    //0914
    // 🆕 座標判定
    _hitTest(sx, sy) {
        for (let i = 0; i < this.optionBounds.length; i++) {
            const b = this.optionBounds[i];
            if (sx >= b.left && sx <= b.right && sy >= b.top && sy <= b.bottom) {
                return i;
            }
        }
        return -1;
    }

    setInputEnabled(enabled) {
        this.inputEnabled = enabled;
    }

    moveCursor(direction) {
        if (!this.inputEnabled) return;
        this.selectedIndex = Phaser.Math.Wrap(this.selectedIndex + direction, 0, this.options.length);
        this._refreshHighlight();
    }

    getSelected() {
        return this.options[this.selectedIndex];
    }

    _refreshHighlight() {
        this.optionTexts.forEach((text, i) => {
            text.setColor(i === this.selectedIndex ? '#42406c' : '#5c5a93'); //被選時變色
            text.setScale(i === this.selectedIndex ? 1.05 : 1); //被選時變大
        });
        this.optionBgs.forEach((bg,i) => {
            bg.setAlpha(i === this.selectedIndex ? 1 : 0.4); //被選時不透明
            bg.setScale(i === this.selectedIndex ? 1.05 : 1); //被選時變大
        })
    }

    ////
    _confirmChoice() {
        if (!this.inputEnabled || this._isConfirmed) return;
        this._isConfirmed = true;

        const chosen = this.getSelected();
        if (this.onConfirm) {
            this.onConfirm(chosen);
        }
        this.destroy();
    }
    ////

    destroy() {
        // 🆕 銷毀輸入層
        if (this.inputLayer) {
            this.inputLayer.destroy();
            this.inputLayer = null;
        }
        //0914
        this.container.destroy();
    }
}
