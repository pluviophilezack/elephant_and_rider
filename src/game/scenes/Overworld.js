// 大地圖場景：整個遊戲唯一的連續場景，玩家在此移動、觸發各事件（見 game/events/）
import * as Phaser from 'phaser';
import { PlayerController } from '../core/PlayerController';
import { WandController } from '../core/TrunkController';
import { createPickupRegistry } from '../core/PickupRegistry';
import { MoralState } from '../core/MoralState';
import { HUD } from '../ui/HUD';
import { DevToolsManager } from '../core/DevToolsManager';
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
        // 1. 初始化主角控制器 (開發者可自訂座標，以便初始載入就能快速定位，但記得不要git add)
        this.playerController = new PlayerController(this, 300, 400);
        // 2. 初始化魔杖/象鼻控制器 (傳入主角控制器)
        this.wandController = new WandController(this, this.playerController);
        // 3. 設定攝影機跟隨主角移動
        this.cameras.main.startFollow(this.playerController.sprite);

        // 建立祈雨石計分面板
        this.hud = new HUD(this);



        // ==========================================
        // 大底圖拼接
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
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);

        // ==========================================
        // registerAsset
        // ==========================================
        this.registeredAssets = {};

        // 為了讓模組register assets時自動附上所屬模組
        this.currentActiveEventKey = null;
        // 各事件自行建立 sprite／觸發區域／按鍵監聽／可拾取物註冊，並在條件成立時自己呼叫 onEnter(this)
        this.events_ = [tutorial, ingroupBirdContest, fairnessWater, purityFloodedRuins, authorityHerd, domainElephants];
        this.events_.forEach(event => {
            this.currentActiveEventKey = event.key;
            event.setup(this);
            this.currentActiveEventKey = null;
        });

        // 建立開發者工具
        this.devToolsManager = new DevToolsManager(this, worldWidth, worldHeight);
    }

    // 供事件模組呼叫：玩家取得一顆祈雨石，集滿六顆後可觸發下一階段
    giveRainStone() {
        this.hud.addRainStone(1);
        if (this.hud.hasEnoughRainStones()) {
            this.scene.start('Ending');
        }
    }

    // 供事件模組呼叫：於add sprite後，將該sprite建立到遊戲系統中
    registerAsset(sprite, customID = null) {
        // 決定id
        // 模組負責人在特殊情況下，可自訂sprite ID
        let id;
        if (customID){
            id = customID;
        }
        else {
            const mappingKey = sprite.texture.key;
            let countSuffix = 0;
            id = mappingKey + "_" + countSuffix;
            while(true){
                if(this.registeredAssets[id]){
                    countSuffix++;
                    id = mappingKey + "_" + countSuffix;
                    continue;
                }
                break;
            }
        }
        sprite.id = id;
        
        // 決定eventKey
        let createdEvent;
        if (this.currentActiveEventKey){
            createdEvent = this.currentActiveEventKey;
        }else{
            createdEvent = 'other_module';
        }
        sprite.createdEvent = createdEvent;

        this.registeredAssets[id] = sprite;

        // TODO:理解destroy的觸發條件
        sprite.once('destroy', ()=>{
            // 此sprite被移除遊戲，清單隨同刪除
            delete this.registeredAssets[id];
        })
    }

    update () {
        // 更新主角與魔杖控制邏輯
        if (this.playerController) {
            this.playerController.update();
        }
        if (this.wandController) {
            this.wandController.update();
        }
        // 更新除錯工具
        if (this.devToolsManager) {
            this.devToolsManager.update();
        }
        //更新每個事件
        this.events_.forEach(event => event.update(this));
    }
}
