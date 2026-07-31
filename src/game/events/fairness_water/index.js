// 事件模組：喝水事件（Fairness）——與羚羊公平分配池塘水資源，或自己獨飲
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'fairness_water',

    // TODO(此事件負責人)：改成實際地圖上池塘所在的座標
    triggerZone: { x: 2200, y: 1200, width: 200, height: 150 },

    onEnter(scene) {
        DialogueSystem.show(scene, dialogue.trigger_lines, () => {
            ChoiceSystem.prompt(scene, dialogue.choice_options, (choiceKey) => {
                if (choiceKey === 'share') {
                    DialogueSystem.show(scene, dialogue.share_lines, () => {
                        MoralState.add('fairness', 1);
                        scene.giveRainStone();
                    });
                } else {
                    // 自己喝光：無祈雨石加成，不改變 fairness 分數
                    // TODO：播放羚羊離開水邊的動畫
                }
            });
        });
    }
};
