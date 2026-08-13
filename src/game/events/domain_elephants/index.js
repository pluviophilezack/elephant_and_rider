// 事件模組：地圖左下角四組裝飾性NPC大象（ingroup/fairness/authority/harm_elephants）
// 與主線事件不同，這裡是「每次靠近都可重複觸發、對話會循環」，由 Overworld 在 setup() 統一呼叫，
// 各自用 flag 記錄目前循環到第幾句對話
import { DialogueSystem } from '../../core/DialogueSystem';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogues from './dialogues.json';

// TODO(此事件負責人)：改成實際地圖上四組NPC所在的座標
const NPC_GROUPS = [
    { key: 'ingroup_elephants', data: dialogues.ingroup_elephants, zone: { x: 200, y: 2400, width: 150, height: 150 } },
    { key: 'fairness_elephants', data: dialogues.fairness_elephants, zone: { x: 400, y: 2400, width: 150, height: 150 } },
    { key: 'authority_elephants', data: dialogues.authority_elephants, zone: { x: 600, y: 2400, width: 150, height: 150 } },
    { key: 'harm_elephants', data: dialogues.harm_elephants, zone: { x: 800, y: 2400, width: 150, height: 150 } }
];

export default {
    key: 'domain_elephants',

    setup(scene) {
        NPC_GROUPS.forEach(group => {
            const zoneObject = createTriggerZone(scene, group.zone);
            let isSecondTurn = false;
            let isOverlapping = false;

            scene.physics.add.overlap(scene.player, zoneObject, () => {
                if (isOverlapping) return;
                isOverlapping = true;

                const lines = isSecondTurn ? group.data.second_trigger_lines : group.data.first_trigger_lines;
                isSecondTurn = !isSecondTurn;

                DialogueSystem.show(scene, lines, () => {
                    isOverlapping = false;
                });
            });
        });
    },

    // TODO(domain_elephants事件負責人)：四組 NPC 之後若需要待機動畫等逐幀邏輯，寫在這裡
    update(scene) {
    }
};
