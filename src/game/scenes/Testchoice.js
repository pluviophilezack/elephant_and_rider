import * as Phaser from 'phaser';
import { ChoiceSystem } from '../core/ChoiceSystem.js';

export class TestChoiceScene extends Phaser.Scene {
    constructor() {
        super('TestChoiceScene');
        this.storyState = {};      // 儲存玩家選擇，影響結局
        this.step = 0;            // 0: 開場, 1: 寶箱, 2: 生物, 3: 岔路, 4: 結局
    }

    create() {
        const { width, height } = this.scale;

        // 背景與標題（使用粉圓字體）
        this.add.text(width/2, 60, '🌿 森林中的抉擇', {
            fontFamily: 'Huninn',
            fontSize: '42px',
            color: '#f7d794'
        }).setOrigin(0.5);

        // 故事敘述區（顯示劇情文字）
        this.storyText = this.add.text(width/2, 180, '', {
            fontFamily: 'Huninn',
            fontSize: '28px',
            color: '#f5f5f5',
            align: 'center',
            wordWrap: { width: 800 }
        }).setOrigin(0.5, 0);

        // 結果文字（顯示最終結局）
        this.resultText = this.add.text(width/2, 500, '', {
            fontFamily: 'Huninn',
            fontSize: '32px',
            color: '#ffdd44',
            align: 'center',
            wordWrap: { width: 700 }
        }).setOrigin(0.5, 0);

        // 提示操作
        this.add.text(width/2, height - 60, '🖱️ 點擊選項 或 按 A/D 移動，Space 確認', {
            fontFamily: 'Huninn',
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        // 開始故事（延遲一下讓畫面先顯示）
        this.time.delayedCall(300, () => {
            this.startStory();
        });
    }

    startStory() {
        this.step = 0;
        this.storyState = {};
        this.resultText.setText('');
        this.showStep();
    }

    showStep() {
        const stepData = this.getStepData();
        if (!stepData) {
            this.showEnding();
            return;
        }

        // 顯示故事文字
        this.storyText.setText(stepData.narrative);
        this.resultText.setText('');  // 清空結果

        // 呼叫 ChoiceSystem（選項）
        ChoiceSystem.prompt(this, stepData.options, (chosenKey) => {
            // 記錄選擇
            this.storyState[`step${this.step}`] = chosenKey;
            // 前進到下一步
            this.step++;
            this.showStep();
        });
    }

    getStepData() {
    switch (this.step) {
        case 0: {
            return {
                narrative: '🌲 你漫步在神秘的森林中，陽光透過樹葉灑下斑駁光影。\n突然，你發現前方的草叢中有一個古老的寶箱。',
                options: [
                    { key: 'open', label: '🔓 打開寶箱' },
                    { key: 'observe', label: '🔍 仔細觀察周圍' },
                    { key: 'leave', label: '🚶 繼續前行，不理會' }
                ]
            };
        }
        case 1: {
            const prev1 = this.storyState.step0;
            let narrative = '🌿 當你正要離開時，一隻渾身散發微光的神秘生物從樹叢中走出。\n牠用清澈的眼睛看著你，似乎想表達什麼。';
            if (prev1 === 'open') {
                narrative = '🌿 寶箱裡只有一張泛黃的紙條，寫著：「小心前方的光。」\n你抬起頭，一道微光生物正靜靜地看著你。';
            } else if (prev1 === 'observe') {
                narrative = '🌿 你注意到樹叢中有動靜，一隻散發微光的生物緩緩走出。\n牠的出現似乎與你的謹慎有關。';
            }
            return {
                narrative: narrative,
                options: [
                    { key: 'talk', label: '🗣️ 試圖與牠交談' },
                    { key: 'fight', label: '⚔️ 防衛性驅趕' },
                    { key: 'flee', label: '🏃 轉身逃跑' }
                ]
            };
        }
        case 2: {
            const prev2 = this.storyState.step1;
            let narrative = '🌙 前方出現了三條岔路，分別通往不同的方向。\n你必須做出選擇……';
            if (prev2 === 'talk') {
                narrative = '🌙 生物似乎很友善，牠用頭指了指中間那條路。\n現在你面臨三條岔路……';
            } else if (prev2 === 'fight') {
                narrative = '🌙 你的防衛激怒了生物，牠低吼著消失。\n你匆忙跑到岔路口，三條路都顯得陰森。';
            } else if (prev2 === 'flee') {
                narrative = '🌙 你沒命地跑，來到一個三岔路口。\n你氣喘吁吁，不知該往哪走。';
            }
            return {
                narrative: narrative,
                options: [
                    { key: 'left', label: '⬅️ 左邊小路' },
                    { key: 'center', label: '⬆️ 中間大路' },
                    { key: 'right', label: '➡️ 右邊密徑' }
                ]
            };
        }
        default: {
            return null;
        }
    }
}

    showEnding() {
        // 根據所有選擇組合計算結局
        const s = this.storyState;
        let ending = '🏁 你的旅程暫時結束了。\n';

        // 簡單的條件判斷，製造不同結局
        const step0 = s.step0;
        const step1 = s.step1;
        const step2 = s.step2;

        if (step0 === 'open' && step1 === 'talk' && step2 === 'center') {
            ending = '🌟 你獲得了寶藏的指引，與友善的生物同行，走進森林深處。\n從此成為傳說中的「光之行者」！';
        } else if (step0 === 'observe' && step1 === 'flee' && step2 === 'left') {
            ending = '🌑 你憑藉敏銳的觀察躲過危險，卻迷失在濃霧中。\n你被困在時間迴廊，等待下一次月圓……';
        } else if (step0 === 'leave' && step1 === 'fight' && step2 === 'right') {
            ending = '🔥 你揮刀嚇退生物，卻闖入獵人的陷阱。\n你被當作森林的入侵者，成了下一則傳說中的「鐵籠中的騎士」。';
        } else if (step1 === 'talk' && step2 === 'center') {
            ending = '✨ 你與生物建立了信任，牠帶領你穿越中間大道，\n發現了失落精靈族的遺跡，你成了他們的新盟友。';
        } else if (step1 === 'fight' && step2 === 'left') {
            ending = '💥 你的防衛引發森林的震怒，左邊小路通往深淵。\n你必須面對自己的恐懼，才能重返光明。';
        } else if (step1 === 'flee' && step2 === 'right') {
            ending = '🌀 你逃離了生物，卻誤入右側密徑。\n那裡住著一位隱居的智者，你將接受考驗，獲得智慧。';
        } else {
            ending = '🌳 你走了一條平凡的路，但森林記住了你。\n故事結束，但你的冒險才剛剛開始……';
        }

        this.storyText.setText('📜 故事終章');
        this.resultText.setText(ending);

        // 重玩按鈕
        const replay = this.add.text(this.scale.width/2, 650, '🔄 重玩故事', {
            fontFamily: 'Huninn',
            fontSize: '26px',
            color: '#88ddff',
            backgroundColor: '#333',
            padding: { x: 20, y: 10 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            replay.destroy();
            this.startStory();
        });
    }
}

// import * as Phaser from 'phaser';
// import { ChoiceSystem } from '../core/ChoiceSystem.js';

// export class TestChoiceScene extends Phaser.Scene {
//     constructor() {
//         super('TestChoiceScene');
//     }

//     create() {
//         const { width, height } = this.scale;
//         this.add.text(width/2, 80, '🧪 C 系統測試', { fontSize: '40px', fill: '#fff' }).setOrigin(0.5);
//         this.add.text(width/2, 140, '按 A/D 移動，按 Space 選擇', { fontSize: '20px', fill: '#aaa' }).setOrigin(0.5);

//         const btn = this.add.text(width/2, 280, '點我 或 按 Enter', { fontSize: '28px', fill: '#88ddff', backgroundColor: '#333', padding: { x: 20, y: 10 } })
//             .setOrigin(0.5)
//             .setInteractive({ useHandCursor: true })
//             .on('pointerdown', () => this.launchMenu());

//         this.input.keyboard.on('keydown-ENTER', () => this.launchMenu());

//         this.resultText = this.add.text(width/2, 500, '', { fontSize: '24px', fill: '#ffdd44' }).setOrigin(0.5);
//     }

//     launchMenu() {
//         const options = [
//             { key: 'agree', label: '👍 同意' },
//             { key: 'disagree', label: '👎 不同意' },
//             { key: 'wait', label: '⏳ 再想想' }
//         ];

//         ChoiceSystem.prompt(this, options, (chosenKey) => {
//             this.resultText.setText(`✅ 你選了：${chosenKey}`);
//         });
//     }
// }