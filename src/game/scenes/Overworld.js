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
        // 1. 初始化主角控制器 (測試用座標)
        this.playerController = new PlayerController(this, 400, 300);
        // 2. 初始化魔杖/象鼻控制器 (傳入主角控制器)
        this.wandController = new WandController(this, this.playerController);
        // 3. 設定攝影機跟隨主角移動
        this.cameras.main.startFollow(this.playerController.sprite);

        this.hud = new HUD(this);

        // ==========================================
        // TODO: 大底圖拼接與座標系統實作區
        // ==========================================
        
        // 步驟 1: 動態讀取底圖尺寸
        // 語法提示：
        // const img = this.textures.get('background_01_plain').getSourceImage();
        // const w = img.width;
        // const h = img.height;
        const img = this.textures.get('background_01_plain').getSourceImage();
        const w = img.width;
        const h = img.height;
        
        // 步驟 2: 計算物理世界總尺寸
        const worldWidth = w * 2;
        const worldHeight = h * 2;
        
        // 步驟 3: 拼接四張大地圖
        // 語法提示：
        // this.add.image(x座標, y座標, '貼圖Key').setOrigin(0, 0);
        // 左上
        this.add.image(0, 0, 'background_01_plain').setOrigin(0,0);
        // 左下
        this.add.image(0, worldHeight, 'background_02_plain').setOrigin(0, 1);
        // 右上
        this.add.image(worldWidth, 0, 'background_03_plain').setOrigin(1, 0);
        // 右下
        this.add.image(worldWidth, worldHeight, 'background_04_plain').setOrigin(1, 1)
        
        // 步驟 4: 動態設定物理世界邊界 (Physics Bounds) 
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);
        
        // 步驟 5: 動態設定鏡頭移動邊界 (Camera Bounds)
        // 語法提示：
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

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
        // 更新主角與魔杖控制邏輯
        if (this.playerController) {
            this.playerController.update();
        }
        if (this.wandController) {
            this.wandController.update();
        }
        //更新個事件邏輯
        this.events_.forEach(event => event.update(this));
    }
}
