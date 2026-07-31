// 事件模組：水域廢墟事件——被污染的聖物（Purity）
// 玩家需持續控制大象走進黑油污染區，取得白蓮聖物；可選擇是否先移石救出被困守衛（影響 purity / harm）
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'purity_flooded_ruins',

    // TODO(此事件負責人)：改成實際地圖上水域廢墟入口的座標
    triggerZone: { x: 3000, y: 1600, width: 220, height: 180 },

    onEnter(scene) {
        DialogueSystem.show(scene, dialogue.guard_resist_lines, () => {
            ChoiceSystem.prompt(scene, [
                { key: 'rescue', label: '移開石塊救出守衛' },
                { key: 'ignore', label: '直接前往祭壇取聖物' }
            ], (choiceKey) => {
                if (choiceKey === 'rescue') {
                    this._rescueGuard(scene);
                } else {
                    DialogueSystem.show(scene, dialogue.guard_farewell_if_not_rescued, () => {
                        scene.giveRainStone();
                    });
                }
            });
        });
    },

    _rescueGuard(scene) {
        MoralState.add('purity', -1);
        MoralState.add('harm', 1);
        DialogueSystem.show(scene, dialogue.guard_rescued_lines, () => {
            DialogueSystem.show(scene, dialogue.guard_see_stained_relic_lines, () => {
                scene.giveRainStone();
            });
        });
    }
};
