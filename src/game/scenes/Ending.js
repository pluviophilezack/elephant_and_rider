// 結局場景：蒐集六顆祈雨石後進入，依玩家本次遊玩的道德數值（MoralState）決定 NPC 對話與結局文案
import { Scene } from 'phaser';
import { MoralState } from '../core/MoralState';
import { GameProgress } from '../core/GameProgress';
import { TextStyles } from '../core/theme';

export class Ending extends Scene
{
    constructor ()
    {
        super('Ending');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x20262b);
        GameProgress.markCompleted();

        // TODO(核心負責人)：依 MoralState.getAll() 判斷玩家的道德傾向，顯示對應的猴長老結局對話
        const scores = MoralState.getAll();
        console.log('[Ending] 本次遊玩道德數值：', scores);

        this.add.text(512, 315, '旅程完成', {
            ...TextStyles.fontSetting,
            fontSize: '58px',
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const returnText = this.add.text(512, 440, '回到主選單', {
            ...TextStyles.fontSetting,
            fontSize: '30px',
            color: '#ffffff'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        returnText.once('pointerdown', () => {
            this.scene.start('MainMenu');
        });
    }
}
