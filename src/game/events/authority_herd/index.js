// 事件模組：象群事件（Authority）——整合劊子手（Harm vs Authority）、王權、跟隨、王與年輕象爭吵四段劇情
// 內容分支較多，此檔案先提供四個階段的骨架與 TODO，實際劇情走向由此事件負責人接續完成
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import dialogue from './dialogue.json';

export default {
    key: 'authority_herd',

    // TODO(此事件負責人)：改成實際地圖上非洲裂谷/象群所在的座標
    triggerZone: { x: 3800, y: 900, width: 250, height: 200 },

    onEnter(scene) {
        this._runExecutioner(scene);
    },

    _runExecutioner(scene) {
        const data = dialogue.executioner;
        ChoiceSystem.prompt(scene, data.choice_options, (choiceKey) => {
            if (choiceKey === 'execute') {
                MoralState.add('authority', 1);
                MoralState.add('harm', 1);
                scene.giveRainStone();
                this._runKingshipRebellion(scene, { canJoin: true });
            } else {
                MoralState.add('harm', -1);
                scene.giveRainStone();
                // GDD：協助逃脫後無法加入象群
                this._runKingshipRebellion(scene, { canJoin: false });
            }
        });
    },

    // TODO：依 GDD 分支A/A.A/A.B/B/C 實作完整王權事件邏輯，這裡先提供最小骨架
    _runKingshipRebellion(scene, { canJoin }) {
        if (!canJoin) {
            // TODO：顯示象王對話口氣不悅、直接跳過王權事件
            this._runHerdFollowing(scene);
            return;
        }

        const data = dialogue.kingship_rebellion;
        ChoiceSystem.prompt(scene, data.choice_options, (choiceKey) => {
            if (choiceKey === 'join_side_king' || choiceKey === 'persuade_king') {
                MoralState.add('authority', choiceKey === 'join_side_king' ? 1 : -1);
                scene.giveRainStone();
            } else if (choiceKey === 'help_overthrow') {
                MoralState.add('authority', -1);
                scene.giveRainStone();
            }
            // choiceKey === 'leave'：不加入象群，離去，不影響數值
            this._runHerdFollowing(scene);
        });
    },

    _runHerdFollowing(scene) {
        const data = dialogue.herd_following;
        DialogueSystem.show(scene, data.trigger_lines, () => {
            ChoiceSystem.prompt(scene, data.choice_options, (choiceKey) => {
                if (choiceKey === 'follow') {
                    MoralState.add('authority', 1);
                    DialogueSystem.show(scene, data.follow_rockslide_lines);
                } else {
                    MoralState.add('authority', -1);
                    DialogueSystem.show(scene, data.cross_meet_young_herd_lines);
                }
                this._runHerdArgument(scene);
            });
        });
    },

    _runHerdArgument(scene) {
        const data = dialogue.herd_argument;
        DialogueSystem.show(scene, data.king_scold_lines, () => {
            DialogueSystem.show(scene, data.young_herd_protest_lines, () => {
                DialogueSystem.show(scene, data.king_order_punishment_lines, () => {
                    ChoiceSystem.prompt(scene, data.choice_options, (choiceKey) => {
                        if (choiceKey === 'support_king') {
                            MoralState.add('authority', 1);
                            DialogueSystem.show(scene, data.support_king_result_lines, () => scene.giveRainStone());
                        } else {
                            MoralState.add('authority', -1);
                            DialogueSystem.show(scene, data.support_young_result_lines, () => scene.giveRainStone());
                        }
                        // TODO：之後象群幫玩家搭橋通過峽谷 or 玩家搭船順流而下，前往下一區
                    });
                });
            });
        });
    }
};
