import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import { AudioManager } from '../../core/AudioManager';

export default {
    key: 'authority_herd',
    _boundaries: null,

    setup(scene) {
        const sprites = {};
        // 前山谷
        sprites.mountain01_01 = scene.add.sprite(3150, 700, 'mountain_01')
            .setScale(1.5)
            .setAngle(15)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain01_01);
        sprites.mountain01_02 = scene.add.sprite(3750, 1200, 'mountain_01')
            .setScale(1)
            .setAngle(15)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain01_02);
        sprites.mountain01_03 = scene.add.sprite(4000, 1450, 'mountain_01')
            .setScale(1)
            .setAngle(15)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain01_03);

        // 後山谷
        sprites.mountain02_02 = scene.add.sprite(3300, 450, 'mountain_02')
            .setScale(0.8)
            .setAngle(12)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain02_02);
        sprites.mountain02_01 = scene.add.sprite(3600, 550, 'mountain_02')
            .setScale(1.2)
            .setAngle(10)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain02_01);
        sprites.mountain02_03 = scene.add.sprite(3900, 700, 'mountain_02')
            .setScale(1.5)
            .setAngle(8)   
            .setVisible(true);
        scene.registerAsset(sprites.mountain02_03);

        //空氣牆
        const walls=[];
        for(let i=0;i<15;i++){
            walls.push(scene.add.zone(2800+i*75, 600+i*50, 100, 100));
            walls.push(scene.add.zone(3200+i*75, 425+i*40, 100, 100));
        }
        const walls2=[];
        for(let i=0;i<5;i++){
            walls2.push(scene.add.zone(3775+i*75, 1400+i*50, 100, 100));
        }

        this._boundaries = walls.map(wall => {
            scene.physics.add.existing(wall, true);
            const collider = scene.physics.add.collider(scene.player, wall);
            return { wall, collider };
        });
        this._boundaries = walls2.map(wall => {
            scene.physics.add.existing(wall, true);
            const collider = scene.physics.add.collider(scene.player, wall);
            return { wall, collider };
        });

        // 象王（老象，有皺紋）
        sprites.king = scene.physics.add.sprite(3200, 200, 'old_elephant_king')
            .setScale(0.6)
            .setVisible(false)       
            .setImmovable(true);     
        this._setFootCollision(sprites.king, 0.5, 0.3, 0);
        scene.registerAsset(sprites.king);

        // 中年象 × 3
        sprites.normals = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.physics.add.sprite(3600 + i * 40, 240, 'young_elephant')
                .setScale(0.6)
                .setVisible(false)
                .setImmovable(true); 
            this._setFootCollision(s, 0.5, 0.3, 0);
            scene.registerAsset(s);
            sprites.normals.push(s);
        }

        // 年輕象領袖
        sprites.youngLeader = scene.physics.add.sprite(2890, 290, 'young_elephant_leader')
            .setScale(0.4)
            .setVisible(false)
            .setImmovable(true); 
        this._setFootCollision(sprites.youngLeader, 0.5, 0.3, 0);
        scene.registerAsset(sprites.youngLeader);

        // 年輕象 × 3
        sprites.youngs = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.physics.add.sprite(2850 + i * 35, 320, 'young_elephant')
                .setScale(0.4)
                .setVisible(false)
                .setImmovable(true); 
            this._setFootCollision(s, 0.5, 0.3, 0);
            scene.registerAsset(s);
            sprites.youngs.push(s);
        }

        // 小象
        sprites.little = scene.physics.add.sprite(2900, 360, 'elephant_sick')
            .setScale(0.6)
            .setVisible(false)
            .setImmovable(true); 
        this._setFootCollision(sprites.little, 0.5, 0.3, 0);
        scene.registerAsset(sprites.little);

        // 祈雨石
        sprites.rainStone = scene.physics.add.sprite(3240, 380, 'rain_stone')
            .setScale(0.6)
            .setVisible(false);
        scene.registerAsset(sprites.rainStone);
        sprites.rainStone.setDepth(1000);

        // 滾動的大石頭
        sprites.rock = scene.add.sprite(3500, 600, 'rock_rolling')
            .setScale(0.8)
            .setVisible(false);
        scene.registerAsset(sprites.rock);

        this.sprites = sprites;

        const player = scene.player;
        const allNPCs = [
            sprites.king,
            ...sprites.normals,
            sprites.youngLeader,
            ...sprites.youngs,
            sprites.little,
            sprites.rock,
        ].filter(s => s && s.body);

        allNPCs.forEach(npc => {
            scene.physics.add.collider(player, npc);
        });

        // ---------- 第一階段：生成象群 ----------
        const spawnZone = createTriggerZone(scene, { x: 2500, y: 650, width: 400, height: 400 });
        let spawned = false;

        scene.physics.add.overlap(scene.player, spawnZone, () => {
            if (spawned) return;
            spawned = true;

            const audio = AudioManager.getInstance(scene);
            if (audio) {
                audio.playBGM('bgm_energizing_loop', { loop: true, volume: 2.0 }, 5000);
            }

            this._spawnHerd(scene);
            spawnZone.destroy();
        });

        this._easterEggTriggered = false; 
        this._easterEgg2Triggered = false;
        this._AnimeStart = false;
        this._AnimeEnd = false;
        this._inAutoMoving = false;
        this._rainStoneCollected = false;

        this._conversationTriggered = false;
        this.choose_Far_Way = false;
        this._secondChoiceTriggered = false;
        this._metYoungChoiceTriggered = false;
        this.YoungArriveTriggered = false;
        this.KingArriveTriggered = false;
    },

    _spawnHerd(scene) {
        const sprites = this.sprites;

        sprites.king.setVisible(true).setPosition(3200, 200);
        sprites.normals.forEach((s, i) => s.setVisible(true).setPosition(3400 + i * 40, 280 - i*40).setFlipX(true));
        sprites.youngLeader.setVisible(true).setPosition(2750, 380);
        sprites.youngs.forEach((s, i) => s.setVisible(true).setPosition(2900 + i * 35, 470-i*35).setFlipX(true));
        sprites.little.setVisible(true).setPosition(2850, 400);

        const triggerZone = createTriggerZone(scene, { x: 3100, y: 300, width: 200, height: 220 });
        let triggered = false;

        scene.physics.add.overlap(scene.player, triggerZone, () => {
            if (triggered) return;
            if (this._conversationTriggered) return;
            triggered = true;
            this._conversationTriggered = true;
            this._kingApproach(scene);
            triggerZone.destroy();
        });

        const youngLeaderTrigger = createTriggerZone(scene, { x: 2700, y: 400, width: 300, height: 150 });
        let eggTriggered = false;

        scene.physics.add.overlap(scene.player, youngLeaderTrigger, () => {
            if (this._choiceTriggered) return; 
            if (this._easterEggTriggered) return;
            if (eggTriggered) return;
            eggTriggered = true;
            this._easterEggTriggered = true;
            this._youngEasterEgg(scene);
            youngLeaderTrigger.destroy();
        });
    },

    _kingApproach(scene) {
        const sprites = this.sprites;
        const player = scene.player;
        const king = sprites.king;

        scene.playerController.disable();

        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        if (player.x < king.x) {
            king.setFlipX(true);
        } else {
            king.setFlipX(false);
        }

        scene.tweens.add({
            targets: king,
            x: king.x,
            y: king.y-5,
            duration: 150,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: king,
                    x: king.x,
                    y: king.y+5,
                    duration: 150,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        scene.tweens.add({
                            targets: king,
                            x: king.x,
                            y: king.y-5,
                            duration: 150,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: king,
                                    x: king.x,
                                    y: king.y+5,
                                    duration: 150,
                                    ease: 'Sine.easeInOut',
                                    onComplete: () => {
                                        scene.tweens.add({
                                            targets: king,
                                            x: king.x,
                                            y: king.y,
                                            duration: 150,
                                            ease: 'Sine.easeInOut',
                                            onComplete: () => {
                                                const targetX = player.x - Math.cos(angle) * 200;
                                                const targetY = player.y - Math.sin(angle) * 100;
                                                let shakeTime = 0;

                                                scene.tweens.add({
                                                    targets: king,
                                                    x: targetX,
                                                    y: targetY,
                                                    duration: 2000,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: () => {
                                                        shakeTime += 0.1;
                                                        const shakeOffset = Math.sin(shakeTime * 0.5) * 5;
                                                        king.y += shakeOffset;
                                                    },
                                                    onComplete: () => {
                                                        this._startEvent(scene);
                                                        king.setPosition(targetX, targetY);
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    _youngEasterEgg(scene) {
        scene.playerController.disable();
        const young = this.sprites.youngLeader;

        scene.tweens.add({
            targets: young,
            x: young.x,
            y: young.y-5,
            duration: 150,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                scene.tweens.add({
                    targets: young,
                    x: young.x,
                    y: young.y+5,
                    duration: 150,
                    ease: 'Sine.easeInOut',
                    onComplete: () => {
                        scene.tweens.add({
                            targets: young,
                            x: young.x,
                            y: young.y-5,
                            duration: 150,
                            ease: 'Sine.easeInOut',
                            onComplete: () => {
                                scene.tweens.add({
                                    targets: young,
                                    x: young.x,
                                    y: young.y+5,
                                    duration: 150,
                                    ease: 'Sine.easeInOut',
                                    onComplete: () => {
                                        const easterLines = [
                                            {speaker: '小象', text: '呼...呼...'},
                                            {speaker: '年輕象A', text: '小象好久沒喝水了...再繞路會不會花費太久?'},
                                            {speaker: '年輕象B', text: '那條山路我們還沒有走過，看起來還算安全，要走走看嗎...'},
                                            {speaker: '年輕象領', text: '可能得試試看...了嗎...'},
                                            {speaker: '年輕象ABC', text: '......'},
                                            {speaker: '小象', text: '呼...(不安)'},
                                        ];

                                        DialogueSystem.show(scene, easterLines, () => {
                                            scene.playerController.enable();
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    },

    _startEvent(scene) {
        scene.playerController.disable();

        const kingLines1 =[
            { "speaker": "王", "text": "你好，朋友，你也要去山的對面嗎?" },
            { "speaker": "王", "text": "......" },
            { "speaker": "王", "text": "我們要去對岸的河谷，你要一起嗎" },
            { "speaker": "王", "text": "......" },
        ];
        DialogueSystem.show(scene, kingLines1, () => {
            this._startEvent2(scene);
        });
    },

    _startEvent2(scene) {
        const sprites = this.sprites;
        sprites.rainStone.setVisible(false);
        sprites.king.setFlipX(false);

        const kingLines2 = [
            { speaker: '王', text: '這座山，很危險...很脆弱...石頭，會掉下來...' },
            { speaker: '王', text: '......' },
            { speaker: '王', text: '我們象群，不准上山，這是命令' },
            { speaker: '王', text: '我們走安全的路，繞過他' },
            { speaker: '王', text: '王的命令，你，聽從嗎 ?' },
        ];

        DialogueSystem.show(scene, kingLines2, () => {
            this._setupChoiceTrigger(scene);
        });
    },

    _setupChoiceTrigger(scene) {
        const choiceZone = createTriggerZone(scene, { x: 3100, y: 300, width: 210, height: 230 });
        let choiceTriggered = false;

        scene.physics.add.overlap(scene.player, choiceZone, () => {
            if (choiceTriggered) return;
            if (this._choiceTriggered) return;
            choiceTriggered = true;
            this._choiceTriggered = true;
            scene.playerController.disable();
            this._showFirstChoice(scene);
            choiceZone.destroy();
        });
    },

    _showFirstChoice(scene) {
        const options = [
            { key: "follow", label: '服從象王\n走平地繞遠路' },
            { key: "direct", label: '婉拒\n走山中捷徑' }
        ];

        ChoiceSystem.prompt(scene, options, (chosenKey) => {
            scene.playerController.disable();

            scene.sharedState = scene.sharedState || {};
            scene.sharedState.authority_choice = chosenKey;

            if (chosenKey === 'follow') {
                MoralState.add('authority', 1);
                MoralState.getAll();
                this.choose_Far_Way = true;
            } else {
                MoralState.getAll();
                this.choose_Far_Way = false;
            }

            if (chosenKey === 'follow') {
                scene.playerController.disable();
                const kinghappy = [
                    {speaker:'王', text:'明智的抉擇，一起走吧'},
                    {speaker:'王', text:'......'},
                ];

                DialogueSystem.show(scene, kinghappy, () => {
                    this._choice_0_animate(scene);
                });
            } else {
                scene.playerController.disable();
                const kingwarn = [
                    {speaker:'王', text:'......'},
                    {speaker:'王', text:'............'},
                    {speaker:'王', text:'你，不屬於我們族群，我，管不了你...'},
                    {speaker:'王', text:'但是，我們，可不冒險'},
                    {speaker:'王', text:'......'},
                    {speaker:'王', text:'隨你高興吧。保重。'},
                    {speaker:'王', text:'......'},
                ];

                DialogueSystem.show(scene, kingwarn, () => {
                    this._choice_1_animate_0(scene);
                });
            }
        });
    },

    _choice_0_animate(scene){
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        this.sprites.mountain02_01.setDepth(100);
        this.sprites.mountain02_02.setDepth(100);
        this.sprites.mountain02_03.setDepth(100);

        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
            scene.player
        ];

        scene.tweens.add({
            targets: this.sprites.king,
            x: 3550,
            y: 280,
            duration: 6000,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                const elapsed = scene.time.now / 500;
                const shakeOffsetY = Math.sin(elapsed * 3) * 5 *0.5;                            
                const shakeOffsetX = Math.cos(elapsed ) * 5 *(-0.5); 
                this.sprites.king.y += shakeOffsetY;  
                this.sprites.king.x += shakeOffsetX;  
            },
            onStart: () => {
                scene.time.delayedCall(2000, () => {
                    scene.tweens.add({
                        targets:scene.player,
                        x: 3500,
                        y: 300,
                        duration: 5000,
                        ease: 'Sine.easeInOut',
                        onUpdate: () => {
                            const elapsed = scene.time.now / 500;
                            const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(-0.5);                            
                            const shakeOffsetX = Math.cos(elapsed ) * 5 *(0.5); 
                            scene.player.y += shakeOffsetY;  
                            scene.player.x += shakeOffsetX;
                        },
                        onStart:()=>{
                            this._AnimeStart = true;
                        },
                        onComplete: () => {
                            this._AnimeStart = false;
                        }
                    });
                });
            },
            onComplete: () => {
                this.sprites.normals.forEach((e)=>{
                    e.setFlipX(false);
                });
                const offsetX = 1000;
                const offsetY = 225;

                const targets = moveSprites.map(sprite => ({
                    x: sprite.x + offsetX,
                    y: sprite.y + offsetY
                }));

                let both = false;
                
                moveSprites.forEach((sprite, index) => {
                    scene.tweens.add({
                        targets: sprite,
                        x: targets[index].x,
                        y: targets[index].y,
                        duration: 15000,
                        ease: 'Sine.easeInOut',
                        onStart:() => {
                            this._AnimeStart = true;
                            scene.time.delayedCall(5000, () => {
                                this._youngArrive(scene);
                                if(index==4){
                                    const easterLines = [
                                        {speaker:'王', text:'先王說過，這條路，是最安全的，不會有，落石'},
                                        {speaker:'王', text:'山上，很危險，可能會受傷'},
                                        {speaker:'王', text:'......'},
                                    ];
                                    DialogueSystem.show(scene, easterLines, () => {
                                        if(both==true){
                                            this._AnimeStart = false;
                                            this._choice_0_animate2(scene);
                                        } else {
                                            both = true;
                                        }
                                    });       
                                }         
                            });
                        },
                        onUpdate: () => {
                            this._AnimeStart = true;
                            const elapsed = scene.time.now / 500;
                            const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                            const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                            sprite.y += shakeOffsetY;  
                            sprite.x += shakeOffsetX;  
                        },
                        onComplete:()=>{
                            if(index==4){
                                if(both == true){
                                    this._AnimeStart = false;
                                    this._choice_0_animate2(scene);
                                } else {
                                    this._AnimeStart = false;
                                    both = true;
                                }
                            }
                        }
                    });
                });
            }
        });
    },

    _choice_0_animate2(scene){
        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
            scene.player
        ];

        this.sprites.king.setFlipX(true);
        scene.player.setFlipX(true);
        const offsetX = -50;
        const offsetY = 900;
        let both = false;

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 15000,
                ease: 'Sine.easeInOut',
                onStart: () => {
                    this._AnimeStart = true;
                    scene.time.delayedCall(5000, () => {
                        if(index==4){
                            const easterLines = [
                                {speaker:'王', text:'雨已經，好久沒下了，大地，好乾...'},
                                {speaker:'王', text:'食物，越來越少，越來越難找了'},
                                {speaker:'王', text:'......'},
                            ];
                            DialogueSystem.show(scene, easterLines, () => {
                                if(both==true){
                                    this._choice_0_animate3(scene);
                                } else {
                                    both = true;
                                }
                            });   
                        }
                    });
                },
                onUpdate: () => {
                    const elapsed = scene.time.now / 500;
                    const shakeOffsetX = Math.sin(elapsed) * 5 *(index%2-0.5); 
                    const shakeOffsetY = Math.cos(elapsed * 3) * 5 *(index%2-0.5);
                    moveSprites[index].x += shakeOffsetX;  
                    moveSprites[index].y += shakeOffsetY;  
                },
                onComplete:()=>{
                    this._AnimeStart = false;
                    if(index==3){
                        if(both==true){
                            this._choice_0_animate3(scene);
                        } else {
                            both = true;
                        }
                    }
                }
            });
        });
    },

    _choice_0_animate3(scene){
        const teamarrive = [
            {speaker:'中年象A', text:'咦，他們是...'},
            {speaker:'中年象B', text:'小象與年輕象嗎...'},
            {speaker:'王', text:'...'},
            {speaker:'王', text:'看來，有人違反規定了...'},
            {speaker:'王', text:'。。。。。。'},
        ];

        DialogueSystem.show(scene, teamarrive, () => {
            scene.playerController.enable();
            this._kingAngry(scene);
        });
    },

    _choice_1_animate_0(scene){
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        this.sprites.mountain02_01.setDepth(5);
        this.sprites.mountain02_02.setDepth(5);
        this.sprites.mountain02_03.setDepth(5);

        const moveSprites = [scene.player];
        let shakeTime1 = 0;

        scene.tweens.add({
            targets: moveSprites,
            x: 3050,
            y: 450,
            duration: 2000,
            ease: 'Linear',
            onStart: () => {
                this._AnimeStart = true;
                scene.time.delayedCall(2000, () => {
                    this._kingmove(scene);
                });
            },
            onUpdate: () => {
                shakeTime1 += 0.05;
                const shakeOffsetX = Math.cos(shakeTime1 * 0.1) * 2.5;
                const shakeOffsetY = Math.sin(shakeTime1 * 0.5) * 2.5;
                scene.player.y += shakeOffsetY;  
                scene.player.x -= shakeOffsetX;  
            },
            onComplete: ()=>{       
                this._AnimeStart = false;
                const wanttogethertalk = [
                    {speaker:'年輕象領', text:'等等!'},
                    {speaker:'年輕象領', text:'我們，跟你一起，可以嗎...'},
                    {speaker:'player', text:'...我無所謂'},
                    {speaker:'年輕象領', text:'謝謝...'},
                ];             
                DialogueSystem.show(scene, wanttogethertalk, () => {
                    scene.tweens.add({
                        targets: this.sprites.youngLeader,
                        x: 3050,
                        y: 400,
                        duration: 2000,
                        ease: 'Linear',
                        onUpdate: () => {
                            shakeTime1 += 0.05;
                            const shakeOffsetX = Math.cos(shakeTime1 * 0.1) * 2.5;
                            const shakeOffsetY = Math.sin(shakeTime1 * 0.5) * 2.5;
                            this.sprites.youngLeader.y += shakeOffsetY;  
                            this.sprites.youngLeader.x -= shakeOffsetX;  
                        }
                    });

                    scene.tweens.add({
                        targets: this.sprites.little,
                        x: 3000,
                        y: 450,
                        duration: 2000,
                        ease: 'Linear',
                        onUpdate: () => {
                            shakeTime1 += 0.05;
                            const shakeOffsetX = Math.cos(shakeTime1 * 0.1) * 2.5;
                            const shakeOffsetY = Math.sin(shakeTime1 * 0.5) * 2.5;
                            this.sprites.little.y += shakeOffsetY;  
                            this.sprites.little.x -= shakeOffsetX;  
                        },
                        onComplete: ()=>{       
                            this._choice_1_animate_1(scene);
                        }
                    });

                    const moveSpritesYoung = [...this.sprites.youngs];
                    moveSpritesYoung.forEach((sprite) => {
                        sprite.setFlipX(false);
                    });
                });
            }
        });
    },

    _choice_1_animate_1(scene){
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        this.sprites.mountain02_01.setDepth(5);
        this.sprites.mountain02_02.setDepth(5);
        this.sprites.mountain02_03.setDepth(5);

        const moveSprites = [
            scene.player,
            this.sprites.little,
            ...this.sprites.youngs,
            this.sprites.youngLeader,
        ];
        let both = false;
        let offsetX = 550;
        let offsetY = 300;        

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 8000,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const elapsed = scene.time.now / 500;
                    const shakeOffsetX = Math.sin(elapsed) * 5 *(index%2-0.5); 
                    const shakeOffsetY = Math.cos(elapsed * 3) * 5 *(index%2-0.5);
                    moveSprites[index].x += shakeOffsetX;  
                    moveSprites[index].y += shakeOffsetY;  
                },
                onStart: () => {
                    this._AnimeStart = true;
                    if(index==1){
                        scene.time.delayedCall(2000, () => {
                            const selftalk = [
                                {speaker:'小象',text:'(好不舒服...)'},
                                {speaker:'年輕象領',text:'(需要儘快，找到水...)'},
                                {speaker:'player', text:'山路應該會，比較快的吧...'},
                                {speaker:'player', text:'...啊!糟糕!'},
                            ];

                            DialogueSystem.show(scene, selftalk, () => {
                                this._AnimeStart = false;
                                if(index==1){
                                    if(both==true){
                                        this._AnimeStart = false;
                                        this._rock_animate(scene);
                                    } else {
                                        both = true;
                                    }
                                }
                            });
                        });
                    }
                },
                onComplete: ()=>{                    
                    if(index==1){
                        if(both==true){
                            this._AnimeStart = false;
                            this._rock_animate(scene);
                        } else {
                            both = true;
                        }
                    }
                }
            });
        });
    },

    _choice_1_animate(scene){
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        this.sprites.mountain02_01.setDepth(5);
        this.sprites.mountain02_02.setDepth(5);
        this.sprites.mountain02_03.setDepth(5);

        const moveSprites = [
            this.sprites.rock,
            scene.player
        ];
        let shakeTime1 = 0;
        let both = false;

        scene.tweens.add({
            targets: moveSprites,
            x: 3600,
            y: 750,
            duration: 8000,
            ease: 'Linear',
            onUpdate: () => {
                shakeTime1 += 0.05;
                const shakeOffsetX = Math.cos(shakeTime1 * 0.1) * 2.5;
                const shakeOffsetY = Math.sin(shakeTime1 * 0.5) * 2.5;
                scene.player.y += shakeOffsetY;  
                scene.player.x -= shakeOffsetX;  
            },
            onStart: () => {
                this._AnimeStart = true;
                this._kingmove(scene);
                scene.time.delayedCall(2000, () => {
                    const selftalk = [
                        {speaker:'player', text:'山路應該會，比較快的吧...'},
                        {speaker:'player', text:'...'},
                        {speaker:'player', text:'...啊!糟糕!'},
                    ];

                    DialogueSystem.show(scene, selftalk, () => {
                        if(both==true){
                            this._rock_animate(scene);
                        } else {
                            both = true;
                        }
                    });
                });
            },
            onComplete: ()=>{                    
                this._AnimeStart = false;
                if(both==true){
                    this._rock_animate(scene);
                } else {
                    both = true;
                }
            }
        });
    },

    _rock_animate(scene){
        const curve = new Phaser.Curves.CubicBezier(
            new Phaser.Math.Vector2(3200, 560),
            new Phaser.Math.Vector2(4250, 1600),
            new Phaser.Math.Vector2(4200, 200),
            new Phaser.Math.Vector2(4500, 500)
        );

        const point = new Phaser.Math.Vector2();
        this.sprites.rock.setVisible(true);

        const audio = AudioManager.getInstance(scene);
        if (audio) {
            audio.playSFX('sfx_authority_rock_drop');
        }
        scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 3000,
            ease: 'Linear',
            onStart: ()=>{
                this._AnimeStart = false;
                scene.time.delayedCall(500, () => {
                    scene.player.setTexture('main_character_uncomfortable');
                    scene.time.delayedCall(1000, () => {
                        scene.player.setTexture('main_character_stand_still');
                        scene.time.delayedCall(500, () => {
                            scene.player.setTexture('main_character_uncomfortable');
                            scene.time.delayedCall(1000, () => {
                                scene.player.setTexture('main_character_stand_still');
                            });
                        });
                    });
                });
            },
            onUpdate: (tween) => {
                const t = tween.getValue();
                curve.getPoint(t, point);
                this.sprites.rock.setPosition(point.x, point.y);
                this.sprites.rock.rotation += 0.1;
            },
            onComplete: () => {
                this.sprites.rock.setVisible(false);
                this._choice_1_animate2(scene);                
            }
        });
    },

    _choice_1_animate2(scene){
        const moveSprites = [
            scene.player,
            this.sprites.little,
            ...this.sprites.youngs,
            this.sprites.youngLeader,
        ];
        let both = false;

        let offsetX = 900;
        let offsetY = 450;        

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 8000,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const elapsed = scene.time.now / 500;
                    const shakeOffsetX = Math.sin(elapsed) * 5 *(index%2-0.5); 
                    const shakeOffsetY = Math.cos(elapsed * 3) * 5 *(index%2-0.5);
                    moveSprites[index].x += shakeOffsetX;  
                    moveSprites[index].y += shakeOffsetY;  
                },
                onStart: () => {
                    this._AnimeStart = true;
                    if(index==1){
                        scene.time.delayedCall(2000, () => {
                            const selftalk = [
                                {speaker:'player', text:'剛剛，好危險...'},
                                {speaker:'player', text:'...'},
                                {speaker:'年輕象ABC', text:'(山路真的，比較危險...)'},
                            ];

                            DialogueSystem.show(scene, selftalk, () => {
                                if(both==true){
                                    this._choice_0_2_0(scene);
                                } else {
                                    both = true;
                                }
                            });
                        });
                    }
                },
                onComplete: ()=>{   
                    scene.tweens.add({
                        targets: sprite,
                        x: sprite.x,
                        y: sprite.y+200,
                        duration: 2000,
                        ease: 'Sine.easeInOut',
                        onUpdate: () => {
                            const elapsed = scene.time.now / 500;
                            const shakeOffsetX = Math.sin(elapsed) * 5 *(index%2-0.5); 
                            const shakeOffsetY = Math.cos(elapsed * 3) * 5 *(index%2-0.5);
                            moveSprites[index].x += shakeOffsetX;  
                            moveSprites[index].y += shakeOffsetY;  
                        },
                        onStart: () => {
                            this._AnimeStart = true;
                        },
                        onComplete: ()=>{   
                            this._AnimeStart = false;
                            if(index==1){
                                if(both==true){
                                    scene.playerController.enable();
                                    this._choice_0_2_0(scene);
                                } else {
                                    both=true;
                                }     
                            }         
                        }
                    });
                }
            });
        });
    },

    _choice_0_2_0(scene) {
        const easterLines = [
            {speaker:'player', text:'但是，好像有比較快'},
            {speaker:'player', text:'......'},
            {speaker:'player', text:'這裡就是河谷了...要快點才行...'},
            {speaker:'player', text:'趕快找到..下個寶石..水域廢墟..'},
            {speaker:'player', text:'疑，那邊有船...'},
        ];

        DialogueSystem.show(scene, easterLines, () => {
            scene.playerController.enable();
            this._youngarrive2(scene);
        });
    },

    _youngArrive(scene) {
        const moveSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];

        let x = this.choose_Far_Way?15000:10000;
        const offsetX = 1650;
        const offsetY = 900;

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: x,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const elapsed = scene.time.now / 500;
                    const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                    const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                    sprite.y += shakeOffsetY;  
                    sprite.x += shakeOffsetX;  
                },
                onComplete:()=>{
                    const offsetX = 0;
                    const offsetY = 450;
                    const targets = moveSprites.map(sprite => ({
                        x: sprite.x + offsetX,
                        y: sprite.y + offsetY
                    }));
                    if(this.choose_Far_Way){
                        moveSprites.forEach((sprite, index) => {
                            scene.tweens.add({
                                targets: sprite,
                                x: targets[index].x,
                                y: targets[index].y,
                                duration: 5000,
                                ease: 'Sine.easeInOut',
                                onUpdate: () => {
                                    const elapsed = scene.time.now / 500;
                                    const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                                    const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                                    sprite.y += shakeOffsetY;  
                                    sprite.x += shakeOffsetX;  
                                }
                            });
                        });
                    }
                    if(!this.choose_Far_Way){
                        const triggerZone = createTriggerZone(scene, { x: 4500, y: 1300, width: 400, height: 400 });

                        scene.physics.add.overlap(scene.player, triggerZone, () => {
                            if (this._YoungArriveTriggered) return;
                            this._YoungArriveTriggered = true;
                            this._youngarrive2(scene);
                            triggerZone.destroy();
                        });
                    }
                }
            });
        });
    },

    _youngarrive2(scene){
        const teamarrive = [
            {speaker:'青年象A', text:'到了，居然，快了好多...'},
            {speaker:'青年象B', text:'是最短時間的一次'},
            {speaker:'青年象領', text:'帶小象去水邊吧，趕快'},
            {speaker:'青年象領', text:'...'},
        ];

        DialogueSystem.show(scene, teamarrive, () => {
            const moveSprites = [
                this.sprites.youngLeader,
                ...this.sprites.youngs,
                this.sprites.little,
            ];
            const offsetX = 0;
            const offsetY = 350;
            const targets = moveSprites.map(sprite => ({
                x: sprite.x + offsetX,
                y: sprite.y + offsetY
            }));
            moveSprites.forEach((sprite, index) => {
                scene.tweens.add({
                    targets: sprite,
                    x: targets[index].x,
                    y: targets[index].y,
                    duration: 5000,
                    ease: 'Sine.easeInOut',
                    onUpdate: () => {
                        const elapsed = scene.time.now / 500;
                        const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                        const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                        sprite.y += shakeOffsetY;  
                        sprite.x += shakeOffsetX;  
                    },
                    onComplete:()=>{
                        if(index==3){
                            this._kingArrive(scene);
                        }
                    }
                });
            });
        });
    },

    _kingmove(scene){
        let shakeTime1 = 0;
        scene.tweens.add({
            targets: this.sprites.king,
            x: 3600,
            y: 280,
            duration: 6000,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                shakeTime1 += 0.1;
                const shakeOffset = Math.sin(shakeTime1 * 0.5) * 5;
                this.sprites.king.y += shakeOffset;  
            }
        });
    },

    _kingArrive(scene) {
        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
        ];
        moveSprites.forEach((sprite, index) => {
            const offsetX = 950;
            const offsetY = 225;

            const targets = moveSprites.map(sprite => ({
                x: sprite.x + offsetX,
                y: sprite.y + offsetY
            }));
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 1000,
                ease: 'Sine.easeInOut',
                onUpdate: () => {
                    const elapsed = scene.time.now / 1000;
                    const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                    sprite.y += shakeOffset;  
                },
                onComplete:()=>{
                    this.sprites.king.setFlipX(true);
                    const offsetX = -50;
                    const offsetY = 700;

                    const targets = moveSprites.map(sprite => ({
                        x: sprite.x + offsetX,
                        y: sprite.y + offsetY
                    }));

                    moveSprites.forEach((sprite, index) => {
                        scene.tweens.add({
                            targets: sprite,
                            x: targets[index].x,
                            y: targets[index].y,
                            duration: 10000,
                            ease: 'Sine.easeInOut',
                            onUpdate: () => {
                                const elapsed = scene.time.now / 1000;
                                const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                                sprite.y += shakeOffset;  
                            },
                            onComplete:()=>{
                                if(index==3){
                                    const triggerZone = createTriggerZone(scene, { x: 4400, y: 1300, width: 300, height: 300 });

                                    scene.physics.add.overlap(scene.player, triggerZone, () => {
                                        if (this._KingArriveTriggered) return;
                                        this._KingArriveTriggered = true;
                                        this._kingArrive2(scene);
                                        triggerZone.destroy();
                                    });
                                }
                            }
                        });
                    });
                }
            });
        });
    },

    _kingArrive2(scene) {
        const teamarrive = [
            {speaker:'王', text:'...'},
            {speaker:'王', text:'看來有象，違反規定了...'},
            {speaker:'王', text:'。。。。。。'},
        ];

        DialogueSystem.show(scene, teamarrive, () => {
            this._kingAngry(scene);
        });
    },

    _kingAngry(scene) {
        const moveSprites = [
            this.sprites.king,
        ];

        scene.tweens.add({
            targets: moveSprites,
            x: 4500,
            y: 1550,
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                const triggerZone = createTriggerZone(scene, { x: 4500, y: 1600, width: 300, height: 300 });
                scene.physics.add.overlap(scene.player, triggerZone, () => {
                    if (this._metYoungChoiceTriggered) return;
                    this._metYoungChoiceTriggered = true;
                    this._startArgument(scene);
                    triggerZone.destroy();
                });                
            }
        });
    },

    _youngLeaderAngry(scene) {
        const moveSprites = [
            this.sprites.youngLeader,
        ];

        scene.tweens.add({
            targets: moveSprites,
            x: 4500,
            y: 1650,
            duration: 3000,
            ease: 'Sine.easeInOut'
        });
    },

    _normalsWatch(scene) {
        const youngs = this.sprites.normals;
        const positions = [
            { x: 4423.5, y: 1510.2 },
            { x: 4500.0, y: 1500.0 },
            { x: 4576.5, y: 1510.2 }
        ];

        youngs.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: positions[index].x,
                y: positions[index].y,
                duration: 3000,
                ease: 'Sine.easeInOut'
            });
        });
    },

    _youngssWatch(scene) {
        const youngs = this.sprites.youngs;
        const positions = [
            { x: 4423.5, y: 1690.2 },
            { x: 4500.0, y: 1700.0 },
            { x: 4576.5, y: 1690.2 }
        ];

        youngs.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: positions[index].x,
                y: positions[index].y,
                duration: 3000,
                ease: 'Sine.easeInOut'
            });
        });
    },

    _startArgument(scene) {
        const kingScold = [
            { speaker: '王', text: '我說過了，山上很危險，不能走...' },
            { speaker: '王', text: '你們，不聽話，看來，必須，要處罰了...' },
        ];
        DialogueSystem.show(scene, kingScold, () => {
            this._youngLeaderAngry(scene);
            const youngProtest = [
                { speaker: '年輕象', text: '繞路要太久了...小象，很缺水...' },
                { speaker: '年輕象', text: '我們應該要優先保護他...' },
                { speaker: '年輕象', text: '你的規定，太過嚴格，不夠關懷...' },
            ];
            DialogueSystem.show(scene, youngProtest, () => {
                this._normalsWatch(scene);
                const kingReply = [
                    { speaker: '王', text: '先王留下的訓令，不會錯的...' },
                    { speaker: '王', text: '你們，不聽話，必須反省...' },
                    { speaker: '王', text: '......' },
                    { speaker: '王', text: '今天晚上，禁止留在象群，直到你們，認真反省...' }
                ];
                DialogueSystem.show(scene, kingReply, () => {
                    this._youngssWatch(scene);
                    
                    const triggerZone = createTriggerZone(scene, { x: 4500, y: 1600, width: 300, height: 300 });

                    scene.physics.add.overlap(scene.player, triggerZone, () => {
                        if (this._secondChoiceTriggered) return;
                        this._secondChoiceTriggered = true;
                        this._showSecondChoice(scene);
                        triggerZone.destroy();
                    });
                });
            });
        });
    },

    _showSecondChoice(scene) {
        const moveSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];
        moveSprites.forEach((e)=>{
            if (scene.player.x < e.x){
                e.setFlipX(true);
            } else {
                e.setFlipX(false);
            }
        });

        const thinking = [
            { speaker: 'player', text: '(誰的說法，比較支持)' },
            { speaker: 'player', text: '(......)' },
        ];
        DialogueSystem.show(scene, thinking, () => {
            const options = [
                { key: 'king', label: '王\n有理' },
                { key: 'young', label: '年輕象\n有理' }
            ];

            scene.playerController.disable();

            ChoiceSystem.prompt(scene, options, (chosenKey) => {
                scene.sharedState.argument_choice = chosenKey;

                if (chosenKey === 'king') {
                    MoralState.add('authority', 1);
                    MoralState.getAll();
                } else {
                    MoralState.add('harm', 1);
                    MoralState.getAll();
                }
                
                scene.playerController.disable();
                if (chosenKey === 'king') {
                    this._kingEnding(scene);
                } else {
                    this._youngEnding(scene);
                }
            });
        });
    },

    _kingEnding(scene) {
        const youngLines = [
            {speaker:'player', text:'團隊紀律，很重要。'},
            {speaker:'年輕象', text:'......'},
            {speaker:'年輕象', text:'對不起，是我們，違規了'},
            {speaker:'年輕象', text:'我們，願意受罰，離開反省'},
        ];
        DialogueSystem.show(scene, youngLines, () => {
            this._youngLeave(scene);
        });
    },

    _youngLeave(scene){
        const moveSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];

        this.sprites.king.setFlipX(true);
        scene.player.setFlipX(true);
        const offsetX = -2000;   
        const offsetY = -100;  

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));
        let count = 0;
        moveSprites.forEach((sprite, index) => {
            sprite.setFlipX(true);
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 4000,
                ease: 'Sine.easeInOut',
                onUpdate:()=>{
                    const elapsed = scene.time.now / 500;
                    const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                    const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                    sprite.y += shakeOffsetY;  
                    sprite.x += shakeOffsetX;  
                },
                onComplete:()=>{
                    count = count+1;
                    if (count===5){
                        this._spawnYoungEasterEgg2(scene);
                        this._kingApproach2(scene);
                    }
                }
            });
        });
    },

    _kingEnding2(scene) {
        scene.events.emit('authority_herd:young_leave');
        const thanks = [
            {speaker:'王', text:'你，很明理'},
            {speaker:'王', text:'這個，給你，作為禮物'},
        ];
        DialogueSystem.show(scene, thanks, () => {
            this._dropRainStone(scene);
            scene.playerController.enable();
        });
    },

    _spawnYoungEasterEgg2(scene) {
        const youngLeader = this.sprites.youngLeader;

        const eggZone = createTriggerZone(scene, {
            x: youngLeader.x,
            y: youngLeader.y,
            width: 250,
            height: 250
        });

        let eggTriggered = false;
        scene.physics.add.overlap(scene.player, eggZone, () => {
            if (eggTriggered) return;
            if (this._easterEgg2Triggered) return;
            eggTriggered = true;
            this._easterEgg2Triggered = true;
            this._youngEasterEgg2(scene);
            eggZone.destroy();
        });
    },

    _youngEasterEgg2(scene) {
        const lines = [
            { speaker: '小象', text: '對不起，都是我害的...' },
            { speaker: '年輕象ABC', text: '......' },
            { speaker: '年輕象領', text: '你的健康，最重要，沒關係的，我們支持' },
            { speaker: '小象', text: '...QAQ' },
            { speaker: '年輕象領', text: '等王消氣，再回去吧' },
        ];

        DialogueSystem.show(scene, lines, () => {});
    },

    _kingApproach2(scene) {
        const sprites = this.sprites;
        const player = scene.player;
        const king = sprites.king;
        let x = 1;
        
        this.sprites.king.setDepth(10);
        this.sprites.rainStone.setDepth(11);

        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        if (player.x < king.x) {
            king.setFlipX(true);
            x=x-2;
        } else {
            king.setFlipX(false);
        }

        const targetX = player.x - Math.cos(angle) * 200;
        const targetY = player.y - Math.sin(angle) * 100;

        scene.tweens.add({
            targets: king,
            x: targetX,
            y: targetY,
            duration: 2000,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                sprites.rainStone.setVisible(true);
                sprites.rainStone.setPosition(king.x + 90*x, king.y + 40);
                sprites.rainStone.setDepth(1000);
            },
            onComplete: () => {
                this._kingEnding2(scene);
            }
        });
    },

    _youngEnding(scene) {
        const kingApology = [
            {speaker:'player', text:'墨守成規，不好'},
            {speaker:'王', text:'.....'},
            {speaker:'王', text:'對不起，是我固執了'},
            {speaker:'王', text:'沒有考慮，小象的狀況，是我的錯'},
            {speaker:'王', text:'原諒你們了...'},
        ];
        DialogueSystem.show(scene, kingApology, () => {
            this._kinGoBack(scene);
        });
    },

    _kinGoBack(scene){
        const moveSprites = [
            this.sprites.king,
        ];

        const offsetX = 0;
        const offsetY = -300;

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 2000,
                ease: 'Sine.easeInOut',
                onComplete:()=>{
                    this._youngApproach(scene);
                }
            });
        });
    },

    _youngApproach(scene) {
        const sprites = this.sprites;
        const player = scene.player;
        const king = sprites.youngLeader;
        let x = 1;
        
        this.sprites.youngLeader.setDepth(10);
        this.sprites.rainStone.setDepth(11);

        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        if (player.x < king.x) {
            king.setFlipX(true);
            x=x-2;
        } else {
            king.setFlipX(false);
        }

        const targetX = player.x - Math.cos(angle) * 150;
        const targetY = player.y - Math.sin(angle) * 80;

        scene.tweens.add({
            targets: king,
            x: targetX,
            y: targetY,
            duration: 2000,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                sprites.rainStone.setVisible(true);
                sprites.rainStone.setPosition(king.x + 50*x, king.y + 20);
                sprites.rainStone.setDepth(1000);
            },
            onComplete: () => {
                this._youngEnding2(scene);
            }
        });
    },

    _youngEnding2(scene) {
        const kingApology = [
            {speaker:'年輕象', text:'謝謝你，幫助我們'},
            {speaker:'年輕象', text:'寶石給你，禮物'},
            {speaker:'年輕象', text:''},
        ];
        DialogueSystem.show(scene,kingApology, () => {
            this._dropRainStone(scene);
            scene.playerController.enable();
        });
    },

    // ---- 給予祈雨石邏輯 ----
    _giveRainStone(scene, from) {
        scene.events.emit('authority_herd:get_rain_stone', from);
        scene.playerController.enable();

        if (typeof scene.giveRainStone === 'function') {
            scene.giveRainStone(this.key);
        } else {
            scene.sharedState = scene.sharedState || {};
            scene.sharedState.rainStone = true;
        }
        console.log('獲得祈雨石');
    },

    _dropRainStone(scene) {
        const stone = this.sprites.rainStone;
        if (!stone) return;

        stone.setVisible(true);
        stone.setDepth(1000);

        if (scene.items && !scene.items.includes(stone)) {
            scene.items.push(stone);
        }

        scene.tweens.add({
            targets: stone,
            y: stone.y - 10,
            ease: 'Sine.easeInOut',
            yoyo: true,
            duration: 1500,
            repeat: -1
        });
    },

    _setFootCollision(sprite, widthRatio = 0.5, heightRatio = 0.15, footOffsetY = 0) {
        const frameW = sprite.frame.realWidth;
        const frameH = sprite.frame.realHeight;

        const bodyW = frameW * widthRatio;
        const bodyH = frameH * heightRatio;

        const offsetX = (frameW - bodyW) / 2;
        const offsetY = frameH - bodyH - frameH * footOffsetY;

        sprite.body.setSize(bodyW, bodyH);
        sprite.body.setOffset(offsetX, offsetY);
    },

    update(scene) {
        const spritesToSort = [
            this.sprites.king,
            ...this.sprites.normals,
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
            this.sprites.rock,
        ].filter(s => s && s.active);

        const depthOffset = scene.player.depth;
        spritesToSort.forEach(sprite => {
            sprite.setDepth(depthOffset - (scene.player.y + 30 - sprite.y)/50);
        });

        this._animatePlayerMovement(scene);

        // ---- 偵測玩家用象鼻撿起第五顆祈雨石 ----
        if (scene.wandController &&
            scene.wandController.heldItem === this.sprites.rainStone &&
            !this._rainStoneCollected) {

            this._rainStoneCollected = true;

            scene.wandController.heldItem = null;

            scene.tweens.killTweensOf(this.sprites.rainStone);
            this.sprites.rainStone.setVisible(false);

            this._giveRainStone(scene, 'player');

            // 💡 觸發 HUD 慶祝動畫：在石頭飛入面板之後，將背景音樂淡出結束！
            const targetHud = scene.hud || (scene.scene && scene.scene.get('Overworld') && scene.scene.get('Overworld').hud);
            if (targetHud && typeof targetHud.addRainStone === 'function') {
                targetHud.addRainStone(1, (isSuccess) => {
                    const audio = AudioManager.getInstance(scene);
                    if (audio && typeof audio.fadeOutBGM === 'function') {
                        // 第五顆石頭飛入面板完畢，將背景音樂淡出結束（例如 2 秒淡出）
                        audio.fadeOutBGM(2000);
                    }
                });
            }
        }
    },

    _animatePlayerMovement(scene) {
        const player = scene.player;
        if (!player || !player.active) return;

        const eventActive = (this._AnimeStart);
        if (!eventActive) {
            this._prevPlayerX = player.x;
            this._prevPlayerY = player.y;
            return;
        }

        const dx = player.x - (this._prevPlayerX ?? player.x);
        const dy = player.y - (this._prevPlayerY ?? player.y);
        const moved = Math.abs(dx) > 0 || Math.abs(dy) > 0;

        if (moved && !(this._inAutoMoving)) {
            this._inAutoMoving = true;
            player.setTexture('main_character_moving_01');
            scene.time.delayedCall(500, () => {
                if(!this._AnimeStart){
                    this._inAutoMoving = false;
                    return;
                }
                player.setTexture('main_character_stand_still');
                scene.time.delayedCall(500, () => {
                    if(!this._AnimeStart){
                        this._inAutoMoving = false;
                        return;
                    }
                    player.setTexture('main_character_moving_01');
                    this._inAutoMoving = false;
                });
            });
        }

        this._prevX = player.x;
        this._prevY = player.y;
    },
};
