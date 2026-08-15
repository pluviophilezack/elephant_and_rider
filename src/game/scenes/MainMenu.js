// 主選單場景：顯示開頭引導語、開始遊戲的入口，點擊後進入 Overworld 大地圖
// 同時作為資源讀取場景，在背景動畫播放時默默下載後續資源，並於載入完成且首播動畫結束後顯示 Start 按鈕
import { Scene } from 'phaser';
import { TextStyles } from '../core/theme';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    init ()
    {
        // 是否開啟測試用慢速載入（設為 true 可方便調整進度條外觀，調校好後可改為 false）
        this.debugSlowLoad = false;

        // 初始化兩個主要條件狀態
        this.firstPlayFinished = false;
        this.isLoadingComplete = false;
        this.startText = null;

        // 1. 建立背景 Sprite 並播放動畫
        const bg = this.add.sprite(512, 384, 'main_menu_background');
        const scaleX = 1024 / bg.width;
        const scaleY = 768 / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);

        // 播放動畫：先播 start，完畢後接著播 loop
        bg.play('main_menu_bg_start');
        // 類似 EventListener，當bg播放完畢，Phaser會發生animationcomplete。animationcomplete會附帶animation, frame, gameObject三個instance，這邊我們只需要EventListener，當bg播放完畢，Phaser會發生animationcomplete。animationcomplete會附帶animation(資訊)
        bg.on('animationcomplete', (animation) => {
            if (animation.key === 'main_menu_bg_start') {
                this.firstPlayFinished = true;
                bg.play('main_menu_bg_loop');

                // 動畫第一次播放完畢，即顯示遊戲標題文字。因此無論載入時間多長，標題都會在一樣的時間出現。
                this.showTitleText();
                
                // 條件判斷：如果資源也已經載入完成了，就顯示 start 按鈕
                if (this.isLoadingComplete) {
                    this.showStartButton();
                }
            }
        });

        // 2. 建立進度條元件
        this.progressOutline = this.add.rectangle(512, 640, 468, 32).setStrokeStyle(1, 0x4d3d8f);
        this.progressBar = this.add.rectangle(512-230, 640, 4, 28, 0xb2a12c).setOrigin(0, 0.5);

        // 3. 監聽載入進度，動態更新進度條
        if (this.debugSlowLoad) {
            // 測試模式：使用 Tween 模擬慢速載入 3 秒鐘
            this.tweens.addCounter({
                from: 0,
                to: 1,
                duration: 3000,
                onUpdate: (tween) => {
                    const progress = tween.getValue();
                    if (this.progressBar && this.progressBar.active) {
                        this.progressBar.width = 4 + (460 * progress);
                    }
                },
                onComplete: () => {
                    this.isLoadingComplete = true;
                    // 銷毀進度條元件
                    if (this.progressOutline) this.progressOutline.destroy();
                    if (this.progressBar) this.progressBar.destroy();
                    
                    // 動畫也播完的話就顯示按鈕
                    if (this.firstPlayFinished) {
                        this.showStartButton();
                    }
                }
            });
        } else {
            // 正式模式：監聽真實載入進度
            this.load.on('progress', (progress) => {
                if (this.progressBar && this.progressBar.active) {
                    this.progressBar.width = 4 + (460 * progress);
                }
            });
        }
    }

    preload ()
    {
        // 設定資源路徑並載入遊戲後續核心素材
        this.load.setPath('assets');
        
        // 建立素材清單
        const assetFiles = import.meta.glob('../../../public/assets/**/*', {
            eager: true,
            query: '?url',
            import: 'default'
        });

        // 依序載入asset
        for (const path in assetFiles) {
            // 排除其他特殊asset
            if (
                path.includes('main_menu_spritesheet.png') ||
                path.includes('.DS_Store') ||
                path.endsWith('.py')
            ) {
                continue;
            }

            // 進一步判斷載入與否、方式
            const relativePath = path.replace('../../../public/assets/', '');
            const filename = relativePath.split('/').pop();
            const extension = filename.split('.').pop().toLowerCase();
            const key = filename.substring(0, filename.lastIndexOf('.')) || filename //substring 擷取從第0個char至最後一個dot

            // A: 自動載入。特殊檔案留待下方 Phaser 引擎載入處理
            if (['png', 'jpg', 'jpeg', 'webp'].includes(extension)){
                if (!key.endsWith('_sheet') && !key.endsWith('_atlas')) {
                    this.load.image(key, relativePath); // * 若要使用該素材，其檔名（不含extension）即 key
                }
            } else if (['mp3', 'wav', 'ogg'].includes(extension)){
                this.load.audio(key, relativePath);
            }

            // B: 特殊手動載入
            // 如果未來有動畫（TODO）
            

        }


        

    }

    create ()
    {
        if (!this.debugSlowLoad) {
            // 標記資源載入已完成
            this.isLoadingComplete = true;

            // 銷毀進度條元件
            if (this.progressOutline) this.progressOutline.destroy();
            if (this.progressBar) this.progressBar.destroy();

            // 條件判斷：如果第一次動畫播放也已經完成了，就立即顯示 Start 按鈕
            if (this.firstPlayFinished) {
                this.showStartButton();
            }
        }
    }

    showStartButton ()
    {
        // 避免重複建立按鈕
        if (this.startText) return;

        // 顯示 Start 按鈕文字
        this.startText = this.add.text(512, 640, 'Start', {
            ...TextStyles.fontSetting,
            fontSize: '52px',
            align: 'center'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // 淡入動畫
        this.titleText.setAlpha(0);
        this.tweens.add({
            targets: this.titleText,
            alpha: 1,
            duration: 600,
            ease: 'Power2'
        });


        // 點擊後正式進入遊戲大地圖
        this.startText.once('pointerdown', () => {
            this.scene.start('Overworld');
        });
    }

            showTitleText ()                                                                                                                                                                 
        {
            // 避免重複建立標題
            if (this.titleText) return;
  
            // 建立並顯示標題文字（例如放在畫面中央偏上的位置：x=512, y=250）
            this.titleText = this.add.text(512, 120, '大象與騎象人', {
                ...TextStyles.fontSetting,
                fontSize: '64px',
            }).setOrigin(0.5);
  
            // 淡入動畫
            this.titleText.setAlpha(0);
            this.tweens.add({
                targets: this.titleText,
                alpha: 1,
                duration: 600,
                ease: 'Power2'
            });
        }
}


// 筆記：start文字的出現邏輯
//   ──────                                                                                                                                                                                 
//   ### 情況 A：資源載入很快（資源先好，動畫後播完）                                                                                                                                       
                                                                                                                                                                                         
//   1. 資源下載完畢，Phaser 進入 create()：                                                                                                                                                
//       • 將 this.isLoadingComplete 設為 true。
//       • 檢查 if (this.firstPlayFinished)：此時動畫還在播（為 false），因此不顯示按鈕。
//   2. 隨後動畫播完，觸發 init() 裡註冊的監聽器：
//       • 將 this.firstPlayFinished 設為 true。
//       • 檢查 if (this.isLoadingComplete)：此時資源早已載入完畢（為 true），因此顯示按鈕。
  

//   ### 情況 B：資源載入很慢（動畫先播完，資源後好）
  
//   1. 動畫先播放完畢，觸發 init() 裡註冊的監聽器：
//       • 將 this.firstPlayFinished 設為 true。
//       • 檢查 if (this.isLoadingComplete)：此時資源還在下載（為 false），因此不顯示按鈕。
//   2. 隨後資源終於下載完畢，Phaser 進入 create()：
//       • 將 this.isLoadingComplete 設為 true。
//       • 檢查 if (this.firstPlayFinished)：此時動畫早已播完（為 true），因此顯示按鈕。
