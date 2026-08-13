// 開機場景：遊戲啟動後最先執行的場景，只載入 Preloader 畫面本身需要的極少量資源
import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        //  The Boot Scene is typically used to load in any assets you require for your Preloader, such as a game logo or background.
        //  The smaller the file size of the assets, the better, as the Boot Scene itself has no preloader.
        this.load.spritesheet('main_menu_background', 'assets/backgrounds/main_menu_spritesheet.png', {
            frameWidth: 1024,
            frameHeight: 768
        });
    }

    create ()
    {
        // 註冊背景動畫的設定值，並且儲存在main_menu_background物件中，這樣在下一個場景（Preloader）一載入時就能立刻播放
        this.anims.create({
            key: 'main_menu_bg_start',
            frames: this.anims.generateFrameNumbers('main_menu_background', { start: 0, end: 28 }),
            frameRate: 6,
            repeat: 0
        });

        this.anims.create({
            key: 'main_menu_bg_loop',
            frames: this.anims.generateFrameNumbers('main_menu_background', { start: 8, end: 28 }),
            frameRate: 12,
            repeat: -1
        });

        if (document.fonts) {
            // 顯式加載 naikaifont，確保進入主選單前字型已就緒
            document.fonts.load('10px naikaifont')
                .then(() => {
                    this.scene.start('MainMenu');
                })
                .catch((err) => {
                    console.error("Font load error:", err);
                    this.scene.start('MainMenu');
                });
        } else {
            this.scene.start('MainMenu');
        }

    // Just for Test
        // const gameW = this.scale.width;
        // const gameH = this.scale.height;
        // this.bg = this.add.image(0, 0, 'background');
        // this.bg.setPosition(gameW/2, gameH/2);
        // this.bg.setScale(0.5, 0.5);
        // this.bg.setDepth(2);

        // // The same
        // this.bg.setRotation(Math.PI /4);
    }
}
