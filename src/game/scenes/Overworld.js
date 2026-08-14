// 大地圖場景：整個遊戲唯一的連續場景，玩家在此移動、觸發各事件（見 game/events/）
import { Scene } from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { WandController } from '../core/TrunkController';
import { createPickupRegistry } from '../core/PickupRegistry';
import { MoralState } from '../core/MoralState';
import { HUD } from '../ui/HUD';
import tutorial from '../events/tutorial';
import ingroupBirdContest from '../events/ingroup_bird_contest';
import fairnessWater from '../events/fairness_water';
import purityFloodedRuins from '../events/purity_flooded_ruins';
import authorityHerd from '../events/authority_herd';
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

        // TODO(核心負責人)：改用實際地圖尺寸、主角素材，並設定 camera bounds 以支援大地圖捲動
        // this.player = this.physics.add.sprite(512, 384, 'logo');
        // this.trunk = this.physics.add.sprite(512, 384, 'logo').setVisible(false);

        // this.playerController = new PlayerController(this, this.player);
        // this.trunkController = new TrunkController(this, this.player, this.trunk);
        // this.pickupRegistry = createPickupRegistry(this, this.trunkController);

        this.hud = new HUD(this);

        // 各事件自行建立 sprite／觸發區域／按鍵監聽／可拾取物註冊，並在條件成立時自己呼叫 onEnter(this)
        this.events_ = [tutorial, ingroupBirdContest, fairnessWater, purityFloodedRuins, authorityHerd, domainElephants];
        this.events_.forEach(event => event.setup(this));
    }

    // 供事件模組呼叫：玩家取得一顆祈雨石，集滿六顆後可觸發下一階段
    giveRainStone() {
        this.hud.addRainStone(1);
        if (this.hud.rainStoneCount >= 6) {
            this.scene.start('Ending');
        }
    }

    update () {
        // this.playerController.update();
        // this.trunkController.update();
        this.events_.forEach(event => event.update(this));
    }
}
