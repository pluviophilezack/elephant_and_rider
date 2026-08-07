// 事件模組：歌唱比賽的團隊精神（Ingroup）——找回落單的鳥，決定放牠自由或捉回鳥群
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'ingroup_bird_contest',

    // 事件負責人在這裡建立自己的 sprite、觸發區域或按鍵監聽，並在條件成立時呼叫 this.onEnter(scene)
    // TODO(此事件負責人)：建立落單小鳥的 sprite 與觸發邏輯
    setup(scene) {
    },

    // TODO(此事件負責人)：小鳥待機/移動動畫、限時追逐時的逐幀邏輯寫在這裡
    update(scene) {
    },

    onEnter(scene) {
        DialogueSystem.show(scene, dialogue.trigger_lines, () => {
            this._onFoundBird(scene);
        });
    },

    _onFoundBird(scene) {
        DialogueSystem.show(scene, dialogue.found_bird_lines, () => {
            ChoiceSystem.prompt(scene, dialogue.choice_options, (choiceKey) => {
                if (choiceKey === 'release') {
                    MoralState.add('ingroup', -1);
                    // TODO：播放小鳥往左上角跳走離開畫面的動畫
                } else {
                    MoralState.add('ingroup', 1);
                    // TODO：啟動限時追逐小鳥的互動，成功後 scene.giveRainStone()
                }
            });
        });
    }
};
