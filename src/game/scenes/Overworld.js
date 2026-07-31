// 大地圖場景：整個遊戲唯一的連續場景，玩家在此移動、觸發各事件（見 game/events/）
import { Scene } from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { TrunkController } from '../core/TrunkController';
import { EventManager } from '../core/EventManager';
import { MoralState } from '../core/MoralState';
import { HUD } from '../ui/HUD';
import domainElephants from '../events/domain_elephants';

export class Overworld extends Scene
{
    constructor ()
    {
        super('Overworld');
    }

    create ()
    {
        // 每次重新開始遊戲時，重置本次遊玩的道德數值
        MoralState.reset();

        this.add.image(512, 384, 'background');

        // TODO(核心負責人)：改用實際地圖尺寸、主角素材，並設定 camera bounds 以支援大地圖捲動
        this.player = this.physics.add.sprite(512, 384, 'logo');
        this.trunk = this.physics.add.sprite(512, 384, 'logo').setVisible(false);

        this.playerController = new PlayerController(this, this.player);
        this.trunkController = new TrunkController(this, this.player, this.trunk);

        this.hud = new HUD(this);

        EventManager.registerAll(this, this.player);
        domainElephants.register(this, this.player);
    }

    // 供事件模組呼叫：玩家取得一顆祈雨石，集滿六顆後可觸發下一階段
    giveRainStone() {
        this.hud.addRainStone(1);
        if (this.hud.rainStoneCount >= 6) {
            this.scene.start('Ending');
        }
    }

    update () {
        this.playerController.update();
        this.trunkController.update();
    }
}
