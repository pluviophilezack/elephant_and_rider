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
        this.load.image('temp', 'assets/main_characters/temp.gif');
    }

    create ()
    {
        if (document.fonts) {
            document.fonts.ready.then(()=> {
                this.scene.start('Preloader');
            }).catch((err) => {
                console.error("Font load error:", err);
                this.scene.start('Preloader');
            });
        }else {
            this.scene.start('Preloader');
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
