// 核心系統：事件中的選擇互動
import * as Phaser from 'phaser';
import { ChoicePrompt } from '../ui/ChoicePrompt';

export const ChoiceSystem = {

    // options: [{ key: 'share', label: '分享' }, { key: 'drink_all', label: '獨飲' }]
    // onChoose(optionKey) 於玩家確認選擇後呼叫一次
    prompt(scene, options, onChoose) {

        const prompt = new ChoicePrompt(scene, options, (chosen) => {
            scene.events.off('update', update);
            if (onChoose) onChoose(chosen.key);
        });

        const keyA = scene.input.keyboard.addKey('A');
        const keyD = scene.input.keyboard.addKey('D');
        const keySpace = scene.input.keyboard.addKey('SPACE');

        const update = () => {
            if (Phaser.Input.Keyboard.JustDown(keyA)) prompt.moveCursor(-1); //上個選項
            if (Phaser.Input.Keyboard.JustDown(keyD)) prompt.moveCursor(1); //下個選項
            // if (Phaser.Input.Keyboard.JustDown(keySpace)) {
            //     scene.events.off('update', update);
            //     const chosen = prompt.getSelected();
            //     prompt.destroy();
            //     onChoose(chosen.key);
            // }
            if (Phaser.Input.Keyboard.JustDown(keySpace)) {
                prompt._confirmChoice(); //確認選項
            }
        };

        scene.events.on('update', update);
    }
};
