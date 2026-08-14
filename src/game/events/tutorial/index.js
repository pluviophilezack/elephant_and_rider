// 事件模組：教學階段——玩家學習用象鼻拾放物品，依序拿掉四塊木堆（woodpile_04 → 01）才能通過
import { DialogueSystem } from '../../core/DialogueSystem';
import dialogue from './dialogue.json';

export default {
    key: 'tutorial',

    // 事件負責人在這裡建立自己的 sprite、觸發區域或按鍵監聽，並在條件成立時呼叫 this.onEnter(scene)
    // TODO(tutorial事件負責人)：建立 woodpile_04~01 的 sprite，並用 pickupRegistry.register() 註冊拾取邏輯
    setup(scene) {
        // TODO：例如 this.woodpile = scene.add.sprite(x, y, 'woodpile_04');
        //       scene.pickupRegistry.register(this.woodpile, { onPick, onPlace });
    },

    // TODO(tutorial事件負責人)：待機動畫、木堆被拿起時跟隨象鼻位置等逐幀邏輯寫在這裡
    update(scene) {
    },

    onEnter(scene) {
        DialogueSystem.show(scene, dialogue.before_rain_stones);
        // TODO：串接 woodpile_04 ~ woodpile_01 依序移除的拾取邏輯
    }
};
