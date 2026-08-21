/**
 * DevToolsManager.js
 * 
 * 開發用定位工具模組
 * 
 */


export class DevToolsManager {
    /**
     * 步驟 1: 宣告建構子與變數
     * 
     * 步驟指引：
     * 1. 接收並儲存 scene, worldWidth, worldHeight 實例。
     * 2. 設定 initialized 變數：isDevMode = false，gridStep = 100。
     * 3. 在建構子結尾依序呼叫初始化方法：this.initGrid(), this.initHUD(), this.initInputs()。
     * 
     * 核心 Phaser 語法提示：
     * this.scene = scene;
     */
    constructor(scene, worldWidth, worldHeight) {
        // 參數設定
        this.isDevMode = true;
        
        this.scene = scene;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.initCrossLine();
        this.initInputs();
        this.initHUD();
    }

    
    // 十字線

    initCrossLine() {
        // 繪圖物件
        this.cross = this.scene.add.graphics();
        this.cross.lineStyle(4, 0x6600db, 0.3);
        this.cross.setScrollFactor(0);

        const centerX = this.scene.scale.width/2;
        const centerY = this.scene.scale.height/2;

        // horizontal line
        this.cross.moveTo(0, centerY).lineTo(this.scene.scale.width, centerY);

        // vertical line
        this.cross.moveTo(centerX, 0).lineTo(centerX, this.scene.scale.height);
        
        // 畫出那筆的動作
        this.cross.strokePath();

        this.cross.setVisible(this.isDevMode);
    }

    initHUD() {
        
        const styleObject = 
        {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#3c00ff',
            backgroundColor: '#e2bdff',
            padding: { x: 8, y: 6 }
        }
        this.hudText = this.scene.add.text(860, 10, '', styleObject)
        this.hudText.setScrollFactor(0);
        this.hudText.setVisible(this.isDevMode);
    }

    initInputs() {

        // 測試鍵盤輸入鍵
        // this.scene.input.keyboard.on('keydown', (event) => {
        //     console.log(event.key, event.code);
        // })

        const toggleKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F2);

        // Switch DevMode
        toggleKey.on('down', () => {
            this.isDevMode = !this.isDevMode;
            console.log("isDevModeOpen: ", this.isDevMode);
            this.cross.setVisible(this.isDevMode);
            this.hudText.setVisible(this.isDevMode);
        });

        // Location
        this.scene.input.on('pointerdown', (pointer) => {
            if (!this.isDevMode) return;
            const worldPoint = pointer.positionToCamera(this.scene.cameras.main);
            const clickX = Math.round(worldPoint.x);
            const clickY = Math.round(worldPoint.y);

            console.log(`\n(${clickX}, ${clickY})`);

            for (const sprite of Object.values(this.scene.registeredAssets)){
                const bounds = sprite.getBounds(); 
                if (bounds.contains(worldPoint.x, worldPoint.y)){
                    console.log(`'${sprite.id}'  created by: ${sprite.createdEvent}`);
                }
            }

            // ==============================================================================
            // 實作指引：複製點擊座標到剪貼簿 (跨平台相容寫法)
            // 
            // 虛擬碼：
            // 1. 將 { x: clickX, y: clickY } 轉換成 JSON 字串格式
            // 2. 判斷是否有 navigator.clipboard：
            //    - 若有：執行 navigator.clipboard.writeText(JSON字串) 複製
            //    - 若無 (備用方案)：
            //        a. 建立一個不可見的 <textarea> 元素
            //        b. 將 textToCopy 指派給它的 value
            //        c. 用 document.body.appendChild 將它加入 DOM
            //        d. 呼叫該元素的 select() 方法選取文字
            //        e. 呼叫 document.execCommand('copy') 執行複製
            //        f. 用 document.body.removeChild 將該元素從網頁中移除
            // ==============================================================================
            const copyText = `(${clickX}, ${clickY})`
            if(navigator.clipboard){
                navigator.clipboard.writeText(copyText);
            }
        })
    }

    // 步驟 6: 隨滑鼠移動更新 HUD 座標
    update() {
        if (!this.isDevMode) return;

        const pointerNow = this.scene.input.activePointer;
        const worldPoint = pointerNow.positionToCamera(this.scene.cameras.main);
        const clickX = Math.round(worldPoint.x);
        const clickY = Math.round(worldPoint.y);
        this.hudText.setText(`(${clickX}, ${clickY})`);
        
    }
}
