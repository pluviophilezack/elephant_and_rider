// 大地圖場景：整個遊戲唯一的連續場景，玩家在此移動、觸發各事件（見 game/events/）
import * as Phaser from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { WandController } from '../core/TrunkController';
import { EventManager } from '../core/EventManager';
import { MoralState } from '../core/MoralState';
import { HUD } from '../ui/HUD';
import domainElephants from '../events/domain_elephants';

// 將 Phaser 掛載到全域，修正其他模組中「Phaser is not defined」的錯誤
window.Phaser = Phaser;

const { Scene } = Phaser;

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

        // 建立玩家控制器（傳入初始座標 512, 384）
        this.playerController = new PlayerController(this, 512, 384);
        
        // 動態為 PlayerController 實例注入 getPosition 方法，以配合 WandController 呼叫
        this.playerController.getPosition = function() {
            return { x: this.sprite.x, y: this.sprite.y };
        };

        // 取得實際的主角 sprite，以供 EventManager 與其他系統使用
        this.player = this.playerController.sprite;

        // 建立魔杖/象鼻控制器（傳入 scene 與 playerController 實例）
        this.wandController = new WandController(this, this.playerController);

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
        this.wandController.update();
    }
}
