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
        this.CONVERSATION_DISTANCE = 125;
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
        this.giraffe = scene.physics.add.sprite(1635, 220, 'young_elephant').setScale(0.4).setDepth(10); 
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

        this.glasses = scene.physics.add.sprite(222, 724, 'glasses').setScale(0.75);
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

        // // 確認眼鏡是否還在猴子臉上
        // scene.input.keyboard.on('keydown-SPACE', () =>{
        //     if (this.glasses && this.glasses.x === 1104 && this.glasses.y === 802) {
        //         return;
        //     } else if (scene.sharedState.wand_unlocked){
        //         this.startConversationMonkeyEasterEgg(scene);
        //     }

        // })

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

        // Woodpile_04
        this.woodpile04 = scene.physics.add.sprite(285, 1950, 'woodpile_04').setDepth(50); 
        this.woodpile04.body.setImmovable(true);
        this.woodpile04.held = false;
        scene.registerAsset(this.woodpile04);
        this.woodpile04Collider = scene.physics.add.collider(this.playerSprite, this.woodpile04);

        // Woodpile_03
        this.woodpile03 = scene.physics.add.sprite(285, 1900, 'woodpile_03').setDepth(50); 
        this.woodpile03.body.setImmovable(true);
        this.woodpile03.held = false;
        scene.registerAsset(this.woodpile03);

        // Woodpile_02
        this.woodpile02 = scene.physics.add.sprite(285, 1850, 'woodpile_02').setDepth(50); 
        this.woodpile02.body.setImmovable(true);
        this.woodpile02.held = false;
        scene.registerAsset(this.woodpile02);

        // Woodpile_01
        this.woodpile01 = scene.physics.add.sprite(285, 1800, 'woodpile_01').setDepth(50); 
        this.woodpile01.body.setImmovable(true);
        this.woodpile01.held = false;
        scene.registerAsset(this.woodpile01);

        // Woodpile list
        this.woodpiles = [this.woodpile01, this.woodpile02, this.woodpile03, this.woodpile04];
    
        // RainStone

        this.rock = scene.physics.add.sprite(2600, 140, 'rock_rolling').setScale(0.6);
        this.rock.body.setImmovable(true);
        scene.registerAsset(this.rock);
        scene.physics.add.collider(this.playerSprite, this.rock);

        
        this.rainStone = scene.physics.add.sprite(2600, 80, 'rain_stone').setScale(0.28);
        scene.items.push(this.rainStone);
        scene.tweens.add({
            targets: this.rainStone,
            y: {start: 85, from: 75, to: 90},
            ease: "Linear",
            yoyo: true,
            duration: 4000,
            repeat: -1
        })

        // Bushes
        const hardBushPositions = [    
        // one side of footpath
        { x: 2420, y: 64 },    
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
        {x: 2511, y:338},

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
        {x: 590, y: 1897},

        // Surrounded rock bushes
        {x: 2500, y: 160, scale: 0.8},
        {x: 2510, y: 250, scale: 0.8}

        ];  
        this.hardBushes = hardBushPositions.map(({x, y, scale})=> {
            const bush = scene.physics.add.sprite(x, y, 'bush_02');
            bush.body.setImmovable(true);
            if(scale){
                bush.setScale(scale);
            }
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
        this.apple_on_tree_1 = scene.physics.add.sprite(1774, 52, 'apple_with_leaf').setScale(0.3).setAngle(-30);
        scene.items.push(this.apple_on_tree_1);

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
            DialogueSystem.show(scene, [
            '我長得不夠高，',
            '吃不到樹上的蘋果⋯⋯'
            ], () => {
            this.isConversing = false;
            })
    },

    startConversationMonkey(scene) {
        if (this.isConversing) return;
        this.isConversing = true;

        if(this.turns_monkey === 0 ){
            DialogueSystem.show(scene, [ // TODO: 改成自動推進對話
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
            '謝謝你，我終於看清楚了。',
            '你們是⋯⋯心智的化身？',
            '太好了⋯⋯這一切就靠你們了', 
            '大地久旱，河道乾涸，生靈塗炭',
            '70年前，當我還是隻小猴子時，大地綠意昂然，生機蓬勃',
            '當時東南方的祭壇仍完好無缺',
            '後來發生了一場沙塵暴，祭壇倒塌，那裡供俸的聖物四散',
            '聖物⋯⋯',
            '對⋯⋯！那些聖物，也許就是恢復一切的關鍵',
            '也許它就在雜草蔓生之盡頭⋯⋯',
            '⋯⋯',
            '這是猴族代代相傳的魔法樹枝，它將助你一臂之力'
            
        ], ()=> {
            scene.sharedState.wand_unlocked = true;
            this.isConversing = false;
        });
        } else if(this.wear_glasses &&this.isGetRainStone){
            DialogueSystem.show(scene, [
            '就是它！',
            '「祈天降雨之石」',
            '我想起來了！傳說中集齊6顆，天降甘霖',
            '試圖適應冒險中遇到的難題，',
            '那些難題將觸動直覺的大象，而作為騎象人，你就是牠的夥伴',
            '我有種預感，聖潔、權威、忠誠、公平、關懷的價值抉擇將在眼前',
            '小心點，這片大地上的動物有著與你截然不同的價值觀',
            '快去吧！尋找其他失散的5顆祈雨石。'
            ], ()=> {
                this.shouldTriggerPartingDialogue = true;
                this.isConversing = false;
                scene.items.push(this.woodpile01);
            }) 
           
        }
        this.turns_monkey++;
        
    },

    startConversationMonkeyEasterEgg(scene) {     
        if (this.isConversing) return;
        DialogueSystem.show(scene, [
            '我看不到了⋯⋯',
            '魔法樹枝不是讓你這樣用的\n快把眼鏡還來⋯⋯'
        ])
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


        // 自動開啟與monkey的對話: 初始教學＆搶眼鏡彩蛋
        if(this.turns_monkey === 0){
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
            if (distance > 250){
                this.shouldTriggerPartingDialogue = false;
                this.isConversing = true;
                DialogueSystem.show(scene, [
                    '等等！',
                    '記得遵循大象，遵循你內心的道德',
                    '做正確的選擇。'
                ], () => {
                    this.isConversing = false;
                });
            }
        }

        // Woodpile
        if (this.woodpiles.includes(scene.wandController.heldItem)){
            for(let i = 0; i < this.woodpiles.length; i++) {
                if (scene.wandController.heldItem === this.woodpiles[i])
                {
                    if (i === 3 && this.woodpile04Collider){
                        this.woodpile04Collider.destroy();
                        this.woodpile04Collider = null;
                    }
                    const nextWood = this.woodpiles[i + 1];
                    if (nextWood && !scene.items.includes(nextWood)){
                        scene.items.push(nextWood);
                    }
                    this.woodpiles[i].setDepth(3);
                }


            }
        }
    }


};
