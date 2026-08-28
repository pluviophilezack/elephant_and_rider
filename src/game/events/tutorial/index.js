import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

// 每個事件模組要呼叫一次giveRainStone() ，以便在該事件獲得祈雨石。

export default {
    key: 'tutorial',
    setup(scene) {
        this.CONVERSATION_DISTANCE = 175;
        this.playerSprite = scene.playerController.sprite;
        this.isConversing = false;

        // Easter Egg: apple
        this.puddle = scene.add.sprite(80, 160, 'puddle');
        scene.registerAsset(this.puddle);
        

        // Floating apple

        this.apple_on_puddle = scene.add.sprite(120, 160, 'apple_without_leaf').setScale(0.6);
        scene.registerAsset(this.apple_on_puddle);
        // scene.pickupRegistry.register(this.apple_on_puddle, {
        //     onPick: () =>{
        //         console.log("pick up!");
        //     },
        //     onPlace: () => {
        //         console.log("placed.")
        //     }
        // });

        scene.tweens.add({
            targets: this.apple_on_puddle, 
            x: '-=100',
            ease: "Sine.easeInOut",
            duration: 12000,
            repeat: -1,
            yoyo: true
        })

        scene.tweens.add({
            targets: this.apple_on_puddle,
            y: {start: 160, from: 154, to: 170},
            ease: "Sine.easeInOut",
            yoyo: true,
            duration: 6000,
            repeat: -1
        })

        scene.tweens.add({
            targets: this.apple_on_puddle,
            angle: {start: 0, from: -60, to: 30},
            ease: "Sine.easeInOut",
            yoyo: true,
            duration: 8000,
            repeat: -1
        })

        // Elder Monkey

        if (!scene.sharedState.rain){
            this.monkeyElder = scene.add.sprite(1110, 849, 'monkey_elder_sad').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        } else{
            this.monkeyElder = scene.add.sprite(1110, 849, 'monkey_elder_pleased').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        }

        // flag for monkey
        this.wear_glasses = false;
        this.turns_monkey = 0;

        // 初始教學，自動開啟對話
        if(this.turns_monkey === 0){
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance <= this.CONVERSATION_DISTANCE){
                this.startConversationMonkey(scene);
            }
        }

        // 一般情況
        scene.input.keyboard.on('keydown-SPACE', () => {
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance <= this.CONVERSATION_DISTANCE){
                this.startConversationMonkey(scene);
            }
        })


        // 範例：使用 createTriggerZone 建立觸發區域，並設定與主角 (scene.player) 的重疊 (overlap) 偵測
        // const triggerZone = createTriggerZone(scene, { x: 800, y: 200, width: 100, height: 100 });
        // scene.physics.add.overlap(scene.player, triggerZone, () => {
        //     console.log("Trigger");
        // }); 


        // Elephant stretching
        

    },

    startConversationMonkey(scene) {
        if (this.isConversing) return;
        this.isConversing = true;

        if(this.turns_monkey === 0 ){
            DialogueSystem.show(scene, [
                '空白鍵',
                '說說話'
            ], () => {
                this.isConversing = false;
            });
        }else if(!this.wear_glasses){
            DialogueSystem.show(scene, [
                '老花',
                '看不到⋯⋯',
                '⋯⋯',
                '空白鍵',
                '可以撿起',
                '身邊的東西',
                '但我',
                '看不到空白鍵⋯⋯'
            ], ()=> {
                this.isConversing = false;
            });
        }else {
            DialogueSystem.show(scene, [
            '久旱',
            '河道乾涸',
            '生靈塗炭',
            '⋯⋯',
            '集齊6顆',
            '祈天降雨之石'
        ], ()=> {
            this.isConversing = false;
        });
        };

        
        this.turns_monkey++;
    },

    update(scene) {
    }
};
