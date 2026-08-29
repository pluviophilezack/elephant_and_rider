import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

// 每個事件模組要呼叫一次giveRainStone() ，以便在該事件獲得祈雨石。

export default {
    key: 'tutorial',
    setup(scene) {
        scene.items = scene.items || [];
        this.CONVERSATION_DISTANCE = 200;
        this.playerSprite = scene.playerController.sprite;
        this.isConversing = false;
        this.isGetRainStone = false;

        // Floating apple
        this.puddle = scene.add.sprite(80, 160, 'puddle');
        scene.registerAsset(this.puddle);

        this.apple_on_puddle = scene.physics.add.sprite(120, 160, 'apple_without_leaf').setScale(0.6);
        scene.registerAsset(this.apple_on_puddle);
        scene.items.push(this.apple_on_puddle);


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

        // Elder Monkey and its glasses

        // flag for monkey
        this.wear_glasses = false;
        this.turns_monkey = 0;

        if (!scene.sharedState.rain){
            this.monkeyElder = scene.add.sprite(1110, 849, 'monkey_elder_sad').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        } else{
            this.monkeyElder = scene.add.sprite(1110, 849, 'monkey_elder_pleased').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        }

        // TODO: Replace rock tiny with glasses
        this.glasses = scene.physics.add.sprite(222, 724, 'rock_tiny');
        scene.registerAsset(this.glasses);
        scene.items.push(this.glasses);




        // 一般情況
        scene.input.keyboard.on('keydown-SPACE', () => {
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance <= this.CONVERSATION_DISTANCE){
                this.startConversationMonkey(scene);
            }
        })


        // 自言自語路段
        
        
        if (!this.isGetRainStone){
            const triggerZone = createTriggerZone(scene, { x: 300, y: 1600, width: 400, height: 1 });
            scene.physics.add.overlap(scene.player, triggerZone, ()=>{
                this.startConversationRider(scene);
                triggerZone.destroy();
            })
        }else{
            const triggerZone = createTriggerZone(scene, { x: 700, y: 1400, width: 100, height: 400 });
            scene.physics.add.overlap(scene.player, triggerZone, () => {
            this.startConversationRider();
            triggerZone.destroy();
        }); 



        }

        /// Woodpile
        this.woodpile = scene.physics.add.sprite(285, 1884, 'woodpile_04').setDepth(15); 
        this.woodpile.body.setImmovable(true);

        //TODO: Change texture when player take one wood
        let offset_y = 150;
        let wood_remaining_number =4;

        // 3. Set the custom collider size (w, h)
        // (Using raw width is safer for dynamic body calculations)
        if (wood_remaining_number === 3){
            this.woodpile.setTexture('woodpile_03');
            offset_y = 100;
        } else if(wood_remaining_number ===2){
            this.woodpile.setTexture('woodpile_02');
            offset_y = 50;
        } else if(wood_remaining_number ===1){
            this.woodpile.setTexture('woodpile_01')
            offset_y = 0;
        }
        this.woodpile.body.setSize(this.woodpile.width, offset_y, false);
        this.woodpile.body.setOffset(0, offset_y);
        scene.registerAsset(this.woodpile);
        scene.physics.add.collider(this.playerSprite, this.woodpile);



        // RainStone

        this.rock = scene.add.sprite(2531, 200, 'rock_rolling');
        scene.registerAsset(this.rock);
        
        this.rainStone = scene.physics.add.sprite(2532, 80, 'rain_stone');
        scene.items.push(this.rainStone);
        scene.tweens.add({
            targets: this.rainStone,
            y: {start: 85, from: 70, to: 100},
            ease: "Linear",
            yoyo: true,
            duration: 4000,
            repeat: -1
        })

        // TODO: Add bushes surround rock


    },


    startConversationMonkey(scene) {
        if (this.isConversing) return;
        this.isConversing = true;

        if(this.turns_monkey === 0 ){
            DialogueSystem.show(scene, [ // 改成自動推進對話
                '是你嗎？',
                '快過來',
                '用空白鍵',
                '和我說說話'
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
                '幫我找找',
                '那個東西'
            ], ()=> {
                this.isConversing = false;
            });
        }else if(this.wear_glasses &&!this.isGetRainStone){
            DialogueSystem.show(scene, [
            '謝謝你',
            '這裡',
            '久旱',
            '河道乾涸',
            '生靈塗炭',
            '⋯⋯',
            '拜託你找找',
            '一顆',
            '懸浮的石頭',
            '好像在',
            '枯枝小徑'
            
        ], ()=> {
            this.isConversing = false;
        });
        } else if(this.wear_glasses &&this.isGetRainStone){
            DialogueSystem.show(scene, [
            '就是它！',
            '「祈天降雨之石」',
            '傳說',
            '集齊6顆',
            '天降甘霖',
            '快去吧！'
            ], ()=> {
                this.shouldTriggerPartingDialogue = true;
                this.isConversing = false;

            }) 
        }

    
        this.turns_monkey++;
    },
    
    startConversationRider(scene){
        if (this.isConversing) return;
        if (this.isGetRainStone){
            DialogueSystem.show(scene, [
                '（正確的選擇⋯⋯）', // 改成自動推進對話
                '（什麼）',
                '（才是）',
                '（合乎）',
                '（道德之選擇？）'
            ])
        }else{
            DialogueSystem.show(scene, [
                '（木堆）',
                '（太高）',
                '（過不去）'
            ])
        }
    },

    update(scene) {
        // Detect if the player picked up the apple
            if (scene.wandController.heldItem === this.apple_on_puddle) {
                // Stop the floating tweens completely            
                scene.tweens.killTweensOf(this.apple_on_puddle);                
            }
            if (scene.wandController.heldItem === this.rainStone){
                scene.tweens.killTweensOf(this.rainStone);
            }
            

        // 初始教學，自動開啟與monkey的對話
        if(this.turns_monkey === 0 &&!this.isConversing){
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance <= this.CONVERSATION_DISTANCE){
                this.startConversationMonkey(scene);
            }
        }
        // Glasses Logic
        if (scene.wandController.heldItem === this.glasses) {
            const playerSprite = scene.playerController.sprite;
            
            // Check distance between player and monkey
            const distance = Phaser.Math.Distance.Between(
                playerSprite.x, playerSprite.y,
                this.monkeyElder.x, this.monkeyElder.y
            );

            // If player is close enough to the monkey while holding the glasses
            if (distance <= this.CONVERSATION_DISTANCE) {
                // 1. Set the flag to true (setting both names to be safe)
                this.wear_glasses = true;

                // 2. Remove the held item from the player's trunk
                scene.wandController.heldItem = null;

                // 3. Destroy/Remove the glasses sprite from the map
                this.glasses.destroy();

                // 4. Automatically trigger the next dialogue (where the monkey puts them on)
                this.startConversationMonkey(scene);
            }
        }

        // rainStone Logic
        if (scene.wandController.heldItem === this.rainStone) {
            const playerSprite = scene.playerController.sprite;
            
            // Check distance between player and monkey
            const distance = Phaser.Math.Distance.Between(
                playerSprite.x, playerSprite.y,
                this.monkeyElder.x, this.monkeyElder.y
            );

            // If player is close enough to the monkey while holding the glasses
            if (distance <= this.CONVERSATION_DISTANCE) {

                this.isGetRainStone = true;

                scene.wandController.heldItem = null;

                scene.giveRainStone();

                this.rainStone.destroy();


                this.startConversationMonkey(scene);
            }
        }

        // Parting Warning
        if (this.shouldTriggerPartingDialogue && !this.isConversing){
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance > this.CONVERSATION_DISTANCE){
                this.shouldTriggerPartingDialogue = false;
                this.isConversing = true;
                DialogueSystem.show(scene, [
                    '等等！',
                    '記得',
                    '遵循',
                    '你內心的道德',
                    '做正確的選擇'
                ], () => {
                    this.isConversing = false;
                })
            };
        }
    }
};
