import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

// 每個事件模組要呼叫一次giveRainStone() ，以便在該事件獲得祈雨石。

export default {
    setup(scene) {

        // 範例：加入猴長老悲傷表情 (monkey_elder_sad) 的 sprite
        if (!scene.sharedState.rain){
            this.monkeyElderSad = scene.add.sprite(300, 200, 'monkey_elder_sad');
        } else{
            this.monkeyElderPleased = scene.add.sprite(300, 200, 'monkey_elder_pleased');
        }

        // 範例：使用 createTriggerZone 建立觸發區域，並設定與主角 (scene.player) 的重疊 (overlap) 偵測
        const triggerZone = createTriggerZone(scene, { x: 800, y: 200, width: 100, height: 100 });
        scene.physics.add.overlap(scene.player, triggerZone, () => {
            console.log("Trigger");
        });
    },

    update(scene) {
    }
};
