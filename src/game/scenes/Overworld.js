// 大地圖場景：整個遊戲唯一的連續場景，玩家在此移動、觸發各事件（見 game/events/）
import * as Phaser from 'phaser';
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

// 將 Phaser 掛載到全域，修正其他模組中「Phaser is not defined」的錯誤
// Note：The code out of export... only run one time when this module loaded.
window.Phaser = Phaser;
const { Scene } = Phaser;

export class Overworld extends Scene
{
    constructor ()
    {
        
        super('Overworld'); // Note: Run constructor in parent class(Phaser.Scene)
    }

    create ()
    {
        // 每次重新開始遊戲時，重置本次遊玩的道德數值
        MoralState.reset();

        this.hud = new HUD(this);

        // 建立主角Controller
        this.playerController = new PlayerController(this, 400, 300);
        this.wandController = new WandController(this, this.playerController);
        // 供事件模組（如 domain_elephants）進行物理碰撞/重疊偵測
        this.player = this.playerController.sprite; 

        // TODO: 建立相機模組，傳入this.player

        // 建立拾取物紀錄區，方便各事件呼叫
        this.pickupRegistry = createPickupRegistry(this, this.wandController);

        // 各事件自行建立 sprite／觸發區域／按鍵監聽／可拾取物註冊，並在條件成立時自己呼叫 onEnter(this)
        this.events_ = [tutorial, ingroupBirdContest, fairnessWater, purityFloodedRuins, authorityHerd, domainElephants];
        this.events_.forEach(event => event.setup(this));
    }

    // 供事件模組呼叫：玩家取得一顆祈雨石，集滿六顆後可觸發下一階段
    giveRainStone() {
        this.hud.addRainStone(1);
        if (this.hud.hasEnoughRainStones()) {
            this.scene.start('Ending');
        }
    }

    update () {
        if (this.playerController) this.playerController.update();
        if (this.wandController) this.wandController.update();

        this.events_.forEach(event => event.update(this));
    }
}
