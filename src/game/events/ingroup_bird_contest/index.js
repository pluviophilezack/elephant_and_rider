// 事件模組：歌唱比賽的團隊精神（Ingroup）——找回落單的鳥，決定放牠自由或捉回鳥群
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'ingroup_bird_contest',

    // TODO(此事件負責人)：改成實際地圖上鳥群所在的座標
    triggerZone: { x: 1400, y: 900, width: 200, height: 150 },

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
