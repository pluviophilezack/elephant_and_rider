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
        this.CONVERSATION_DISTANCE = 100;
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

        // Giraffe (Guide) 
        this.giraffe = scene.physics.add.sprite(1652, 243, 'young_elephant').setScale(0.4).setDepth(10); // TODO 更換為giraffe texture
        scene.registerAsset(this.giraffe);
        this.giraffe.body.setImmovable(true);
        scene.physics.add.collider(this.playerSprite, this.giraffe);

        // 開啟對話
        scene.input.keyboard.on('keydown-SPACE', () => {
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.giraffe.x, this.giraffe.y);
            if (distance <= this.CONVERSATION_DISTANCE){
                this.startConversationGiraffe(scene);
            }
        })
        
        

        // Elder Monkey and its glasses

        // flag for monkey
        this.wear_glasses = false;
        this.turns_monkey = 0;

        if (!scene.sharedState.rain){
            this.monkeyElder = scene.physics.add.sprite(1110, 849, 'monkey_elder_sad').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        } else{
            this.monkeyElder = scene.physics.add.sprite(1110, 849, 'monkey_elder_pleased').setScale(0.6);
            scene.registerAsset(this.monkeyElder);
        }
        scene.physics.add.collider(this.playerSprite, this.monkeyElder);
        this.monkeyElder.body.setImmovable(true);

        this.glasses = scene.physics.add.sprite(222, 724, 'glasses');
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

        // Bushes
        const hardBushPositions = [    
        // Surrounded rock bushes                                                                   
        { x: 2420, y: 64 },                                                                        
        { x: 2410, y: 149 },
        { x: 2400, y: 220 },                                                                       
        { x: 2435, y: 292 },
        {x: 2511, y:338},
        // one side of footpath
        {x:2219,y:44},
        {x:2280, y:69},
        {x: 2345, y:74},
        {x: 2132, y: 65},
        {x:2048, y:82},
        {x: 1952, y: 106},
        {x:1851, y: 139},
        {x:1777, y: 189},
        // the other side of footpath
        { x: 1897, y: 469 },
        { x: 1993, y: 412 },
        { x: 2069, y: 403 },
        { x: 2144, y: 398 },
        { x: 2300, y: 413},
        { x: 2235, y: 414 },
        { x: 2373, y: 409 },
        { x: 2438, y: 374 },

        // Surrounded puddle
        { x: 17, y: 280 },
        { x: 105, y: 251 },
        { x: 170, y: 228 },
        { x: 242, y: 203 },
        { x: 280, y: 132 },
        { x: 201, y: 101 },
        { x: 122, y: 83 },
        { x: 54, y: 50 },
        { x: 28, y: 350 },
        { x: 114, y: 321 },
        { x: 200, y: 306 },
        { x: 269, y: 268 },

        // Right side of road
        { x: 1687, y: 195 },
        { x: 1619, y: 157 },
        { x: 1554, y: 127 },
        { x: 1485, y: 87 },
        { x: 1416, y: 50 },
        { x: 1353, y: 13 },

        // Right side of road (past footpath)
        { x: 560, y: 1790 },
        { x: 641, y: 1681 },
        { x: 773, y: 1598 },
        { x: 881, y: 1534 },
        { x: 1062, y: 1427 },
        { x: 1205, y: 1329 },
        { x: 1340, y: 1251 },
        { x: 1497, y: 1132 },
        { x: 1550, y: 1017 },
        { x: 1596, y: 895 },
        { x: 1676, y: 805 },
        { x: 1750, y: 735 },
        { x: 1829, y: 664 },
        { x: 1880, y: 570 },
        {x: 590, y: 1897}

        ];  
        this.hardBushes = hardBushPositions.map(({x, y})=> {
            const bush = scene.physics.add.sprite(x, y, 'bush_02');
            bush.body.setImmovable(true);
            scene.registerAsset(bush);
            return bush;
        });
        scene.physics.add.collider(this.playerSprite, this.hardBushes);

        // Soft bush
        const softBushPositions = [
            {x:1849, y: 334},
            { x: 1786, y: 270 },
            { x: 2327, y: 525 },
            { x: 2241, y: 521 },
            { x: 2160, y: 325 },
            { x: 2248, y: 327 },
            { x: 2161, y: 244 },
            { x: 2061, y: 271 },
            { x: 1892, y: 400 }
        ];
        this.softBushes = softBushPositions.map(({x, y})=> {
            const bush = scene.add.sprite(x, y, 'bush_01');
            scene.registerAsset(bush);
            return bush;
        })

        // Apple tree
        this.apple_tree_1 = scene.add.sprite(1750, 120, 'apple_tree');

    },

    // 縮放鏡頭function      
    zoomInCamera(scene ,onComplete = null) {                                       
        scene.cameras.main.zoomTo(1.25, 1000, 'Sine.easeInOut', true, 
            (camera, progress) => {
                if (progress ===1 && onComplete)
                    onComplete();
            }
        );                                                        
    },                                                                       
    zoomOutCamera(scene) {                                      
        scene.cameras.main.zoomTo(1, 800, 'Sine.easeInOut',     
  true);                                                        
    },

    startConversationGiraffe(scene) {
        if(this.isConversing) return;
        this.isConversing = true;
        this.zoomInCamera(scene, ()=> {
            DialogueSystem.show(scene, [
            '我長得不夠高，',
            '吃不到樹上的蘋果⋯⋯'
            ], () => {
            this.isConversing = false;
            this.zoomOutCamera(scene);
            })
        });


    },

    startConversationMonkey(scene) {
        if (this.isConversing) return;
        this.isConversing = true;

        if(this.turns_monkey === 0 ){
            DialogueSystem.show(scene, [ // 改成自動推進對話
                '是你嗎？',
                '快過來',
                '用空白鍵和我說說話'
            ], () => {
                this.isConversing = false;
            });
        }else if(!this.wear_glasses){
            DialogueSystem.show(scene, [
                '我老花，看不到⋯⋯',
                '⋯⋯',
                '用空白鍵，可以撿起身邊的東西',
                '幫我找找那個我需要的東西'
            ], ()=> {
                this.isConversing = false;
            });
        }else if(this.wear_glasses &&!this.isGetRainStone){
            DialogueSystem.show(scene, [
            '謝謝你',
            '大地久旱，河道乾涸，生靈塗炭',
            '70年前，當我還是隻小猴子時，大地綠意昂然，生機蓬勃',
            '當時東南方的祭壇仍完好無缺',
            '後來發生了一場暴風雨，祭壇倒塌，那裡供俸的聖物四散',
            '聖物⋯⋯',
            '對⋯⋯！那些聖物，也許就是恢復一切的關鍵',
            '也許它就在雜草蔓生之盡頭⋯⋯',
            '⋯⋯',
            
        ], ()=> {
            this.isConversing = false;
        });
        } else if(this.wear_glasses &&this.isGetRainStone){
            DialogueSystem.show(scene, [
            '就是它！',
            '「祈天降雨之石」',
            '我想起來了！傳說中集齊6顆，天降甘霖',
            '試圖適應冒險中遇到的難題，',
            '那些難題將觸動直覺的大象，而你作為騎象人，就是牠的夥伴',
            '我有種預感，聖潔、權威、忠誠、公平、關懷的價值抉擇將在眼前',
            '快去吧！尋找其他失散的5顆祈雨石。'
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
                '（什麼才是合乎道德的選擇？）',
            ])
        }else{
            DialogueSystem.show(scene, [
                '（木堆太高了，我們過不去）'
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
            
        // 對話時鎖定主角
        if (this.isConversing){
            const sprite = scene.playerController.sprite;
            sprite.setVelocity(0, 0);
            sprite.stop();
            sprite.setTexture('main_character_stand_still');
            return;
        }

        // 初始教學，自動開啟與monkey的對話
        if(this.turns_monkey === 0 &&!this.isConversing){
            const distance = Phaser.Math.Distance.Between(
            this.playerSprite.x, this.playerSprite.y,
            this.monkeyElder.x, this.monkeyElder.y);
            if (distance <= 250){
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
                this.glasses.setPosition(1104, 802);

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
                    '記得遵循大象，遵循你內心的道德',
                    '做正確的選擇。'
                ], () => {
                    this.isConversing = false;
                })
            };
        }
    }
};
