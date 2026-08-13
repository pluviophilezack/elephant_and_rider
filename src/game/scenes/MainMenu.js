// 主選單場景：顯示開頭引導語、開始遊戲的入口，點擊後進入 Overworld 大地圖
import { Scene } from 'phaser';
import { TextStyles } from '../core/theme';

export class MainMenu extends Scene
{
    constructor ()
    {
        super('MainMenu');
    }

    create ()
    {
        this.add.image(512, 384, 'temp');

        const startText = this.add.text(512, 640, 'Start', {
            ...TextStyles.fontSetting,
                    fontSize: '38px',
                    align: 'center'
        }).setOrigin(0.5).setInteractive({useHandCursor: true});

        startText.once('pointerdown', () => {
            this.scene.start('Overworld');
        });
    }
}
