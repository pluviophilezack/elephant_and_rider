import { Scene } from 'phaser';
import { DialogueSystem } from '../core/DialogueSystem';

export class TestDialogueScene extends Scene {
    constructor() {
        super('TestDialogueScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#315d79');

        this.add.text(512, 120, 'Dialogue System Test', {
            fontFamily: 'Arial',
            fontSize: '42px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(512, 190, 'Click, Space, or Enter to advance.', {
            fontFamily: 'Arial',
            fontSize: '22px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.time.delayedCall(300, () => {
            DialogueSystem.show(this, [
                {
                    speaker: '猴長老',
                    text: '歡迎來到大象與騎象人的世界。'
                },
                {
                    speaker: '猴長老',
                    text: '這是一段較長的文字，用來測試自動換行、對話框高度與畫面縮放時的排版。'
                },
                {
                    speaker: '你',
                    text: '我可以使用滑鼠、Space 或 Enter 繼續對話。'
                }
            ], () => {
                this.add.text(512, 350, 'Dialogue completed!', {
                    fontFamily: 'Arial',
                    fontSize: '30px',
                    color: '#ffe066'
                }).setOrigin(0.5);
            });
        });
    }
}