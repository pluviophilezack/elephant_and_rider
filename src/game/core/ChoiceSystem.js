// 核心系統：事件中的選擇互動
import * as Phaser from 'phaser';
import { ChoicePrompt } from '../ui/ChoicePrompt';

export const ChoiceSystem = {

    // options: [{ key: 'share', label: '分享' }, { key: 'drink_all', label: '獨飲' }]
    // onChoose(optionKey) 於玩家確認選擇後呼叫一次
    prompt(scene, options, onChoose, { inputDelayMs = 0 } = {}) {

        const prompt = new ChoicePrompt(scene, options, (chosen) => {
            scene.events.off('update', update);
            if (onChoose) onChoose(chosen.key);
        });

        const normalizedInputDelay = Math.max(0, inputDelayMs);
        let inputUnlockAt = scene.time.now + normalizedInputDelay;
        let hasObservedNeutralInput = normalizedInputDelay === 0;
        if (normalizedInputDelay > 0) {
            prompt.setInputEnabled(false);
        }
        //選擇期間禁止移動
        if(scene.playerController){
            scene.playerController.enabled = false;
            scene.playerController.sprite.setVelocity(0, 0);
            scene.playerController.sprite.stop();                // 停止動畫
            scene.playerController.sprite.setTexture('main_character_stand_still');
        }

        const keyA = scene.input.keyboard.addKey('A');
        const keyD = scene.input.keyboard.addKey('D');
        const keySpace = scene.input.keyboard.addKey('SPACE');

        if (normalizedInputDelay > 0) {
            hasObservedNeutralInput = !(
                keyA.isDown
                || keyD.isDown
                || keySpace.isDown
                || scene.input.activePointer?.isDown
            );
        }

        const update = () => {
            const pressedA = Phaser.Input.Keyboard.JustDown(keyA);
            const pressedD = Phaser.Input.Keyboard.JustDown(keyD);
            const pressedSpace = Phaser.Input.Keyboard.JustDown(keySpace);

            if (!prompt.inputEnabled) {
                const hasHeldInput = keyA.isDown
                    || keyD.isDown
                    || keySpace.isDown
                    || scene.input.activePointer?.isDown;

                if (!hasObservedNeutralInput) {
                    if (!hasHeldInput) {
                        hasObservedNeutralInput = true;
                        inputUnlockAt = scene.time.now + normalizedInputDelay;
                    }
                    return;
                }

                if (scene.time.now >= inputUnlockAt && !hasHeldInput) {
                    prompt.setInputEnabled(true);
                }
                return;
            }

            if (pressedA) prompt.moveCursor(-1); //上個選項
            if (pressedD) prompt.moveCursor(1); //下個選項

            if (pressedSpace) {
                //選擇完成後解禁
                if (scene.playerController){
                    scene.playerController.enabled = true;
                }
                prompt._confirmChoice(); //確認選項
            }
        };

        scene.events.on('update', update);
    }
};
