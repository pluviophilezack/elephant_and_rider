// 事件模組：喝水事件（Fairness）——與羚羊公平分配池塘水資源，或自己獨飲
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'fairness_water',

    // 事件負責人在這裡建立自己的 sprite、觸發區域或按鍵監聽，並在條件成立時呼叫 this.onEnter(scene)
    // TODO(此事件負責人)：建立池塘與羚羊的 sprite 與觸發邏輯
    setup(scene) {
    },

    // TODO(此事件負責人)：羚羊待機動畫、離開動畫等逐幀邏輯寫在這裡
    update(scene) {
    },

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
