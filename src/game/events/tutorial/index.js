// 事件模組：教學階段——玩家學習用象鼻拾放物品，依序拿掉四塊木堆（woodpile_04 → 01）才能通過
import { DialogueSystem } from '../../core/DialogueSystem';
import dialogue from './dialogue.json';

export default {
    key: 'tutorial',

    // TODO(tutorial事件負責人)：改成實際地圖上木堆所在的座標
    triggerZone: { x: 700, y: 384, width: 150, height: 150 },

    onEnter(scene) {
        DialogueSystem.show(scene, dialogue.before_rain_stones);
        // TODO：串接 woodpile_04 ~ woodpile_01 依序移除的拾取邏輯
    }
};
