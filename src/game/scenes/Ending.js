// 結局場景：蒐集六顆祈雨石後進入，依玩家本次遊玩的道德數值（MoralState）決定 NPC 對話與結局文案
import { Scene } from 'phaser';
import { MoralState } from '../core/MoralState';

export class Ending extends Scene
{
    constructor ()
    {
        super('Ending');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x028af8);

        // TODO(核心負責人)：依 MoralState.getAll() 判斷玩家的道德傾向，顯示對應的猴長老結局對話
        const scores = MoralState.getAll();
        console.log('[Ending] 本次遊玩道德數值：', scores);

        this.add.text(512, 384, 'Ending', {
            fontFamily: 'Arial Black', fontSize: 48, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('MainMenu');

        });
    }
}
