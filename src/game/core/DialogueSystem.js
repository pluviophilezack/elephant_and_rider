// 核心系統：讀取事件的 dialogue.json（單詞列表形式的對話），依序在畫面上顯示文字泡
import { DialogueBox } from '../ui/DialogueBox';

export const DialogueSystem = {

    // 依序播放 lines（字串陣列），playedCallback 於全部播放完後呼叫
    show(scene, lines, onComplete) {
        if (!lines || lines.length === 0) {
            if (onComplete) onComplete();
            return;
        }

        const box = new DialogueBox(scene);
        let index = 0;

        const showNext = () => {
            if (index >= lines.length) {
                box.destroy();
                if (onComplete) onComplete();
                return;
            }
            box.setText(lines[index]);
            index += 1;
        };

        box.onAdvance(showNext);
        showNext();
    }
};
