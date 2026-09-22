import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';

export default {
    key: 'authority_herd',
    _boundaries: null,

    setup(scene) {
        // ---------- 建立所有角色 Sprite（預設隱藏） ----------
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
        //scene.physics.add.collider(scene.player, sprites.mountain01);   

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
            walls.push(scene.add.zone(2800+i*75, 600+i*50, 100, 100),);
            walls.push(scene.add.zone(3200+i*75, 425+i*40, 100, 100),);
        }
        //walls.push(scene.add.zone(3400, 850, 100, 150),);

        this._boundaries = walls.map(wall => {
            scene.physics.add.existing(wall, true);
            const collider = scene.physics.add.collider(scene.player, wall);
            return { wall, collider };
        });

        // 象王（老象，有皺紋）
        sprites.king = scene.physics.add.sprite(3200, 200, 'old_elephant_king')
            .setScale(0.6)
            .setVisible(false)       
            .setImmovable(true);     
        this._setFootCollision(sprites.king, 0.5, 0.15, 0);
        scene.registerAsset(sprites.king);

        // 中年象 × 3
        sprites.normals = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.physics.add.sprite(3600 + i * 40, 240, 'young_elephant')
                .setScale(0.6)
                .setVisible(false)
                .setImmovable(true); 
            this._setFootCollision(s, 0.5, 0.15, 0);
            scene.registerAsset(s);
            sprites.normals.push(s);
        }

        // 年輕象領袖（顏色較深）
        sprites.youngLeader = scene.physics.add.sprite(3120, 280, 'young_elephant_leader')
            .setScale(0.4)
            .setVisible(false)
            .setImmovable(true); 
        this._setFootCollision(sprites.youngLeader, 0.5, 0.15, 0);
        scene.registerAsset(sprites.youngLeader);

        // 年輕象 × 3
        sprites.youngs = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.physics.add.sprite(3080 + i * 35, 310, 'young_elephant')
                .setScale(0.4)
                .setVisible(false)
                .setImmovable(true); 
            this._setFootCollision(s, 0.5, 0.15, 0);
            scene.registerAsset(s);
            sprites.youngs.push(s);
        }

        // 小象
        sprites.little = scene.physics.add.sprite(3130, 350, 'little_elephant_weak')
            .setScale(0.6)
            .setVisible(false)
            .setImmovable(true); 
        this._setFootCollision(sprites.little, 0.5, 0.15, 0);
        scene.registerAsset(sprites.little);

        // 祈雨石（可能在事件結尾獲得，先不顯示）
        sprites.rainStone = scene.add.sprite(3240, 380, 'rain_stone')
            .setScale(0.6)
            //d.setVisible(false);
        scene.registerAsset(sprites.rainStone);
        sprites.rainStone.setDepth(1000);

        // 滾動的大石頭（預設隱藏）
        sprites.rock = scene.add.sprite(3500, 600, 'rock_rolling')
            .setScale(0.8)
            .setVisible(false);
        scene.registerAsset(sprites.rock);

        // 保存 sprite 引用到模組實例，方便後續步驟使用
        this.sprites = sprites;

        //碰撞邏輯
        // 建立完所有 NPC 後
        const player = scene.player;

        const allNPCs = [
            sprites.king,
            ...sprites.normals,
            sprites.youngLeader,
            ...sprites.youngs,
            sprites.little,
            sprites.rock,
        ].filter(s => s && s.body);   // 過濾掉沒有物理的

        allNPCs.forEach(npc => {
            scene.physics.add.collider(player, npc);
        });

        // ---------- 第一階段：偵測玩家走到 (2500, 400)，生成象群 ----------
        const spawnZone = createTriggerZone(scene, { x: 2600, y: 450, width: 200, height: 200 });
        let spawned = false;

        scene.physics.add.overlap(scene.player, spawnZone, () => {
            if (spawned) return;
            spawned = true;
            this._spawnHerd(scene);
            spawnZone.destroy(); //0921
        });

        this._easterEggTriggered = false; 
        this._easterEgg2Triggered = false;

        // ---------- 第二階段：偵測玩家碰到象王，觸發對話 ----------

        this._conversationTriggered = false;

        this.choose_Far_Way = false;

        this._secondChoiceTriggered = false;
        this._metYoungChoiceTriggered = false;
        this.YoungArriveTriggered = false;
        this.KingArriveTriggered = false;
    },
    // ---------- 生成象群（只顯示，不觸發對話） ----------
    _spawnHerd(scene) {
        const sprites = this.sprites;

        sprites.king.setVisible(true).setPosition(3200, 200);
        sprites.normals.forEach((s, i) => s.setVisible(true).setPosition(3400 + i * 40, 280 - i*40).setFlipX(true));
        sprites.youngLeader.setVisible(true).setPosition(2900, 30);
        sprites.youngs.forEach((s, i) => s.setVisible(true).setPosition(3050 + i * 35, 120-i*35).setFlipX(true));
        sprites.little.setVisible(true).setPosition(3000, 50);
        // sprites.crown.setVisible(true).setPosition(3200, 180);

        console.log('[authority_herd] 象群已生成在 (3200, 200)');

        // ---- 建立「碰到象王觸發動畫與對話」的碰撞偵測 ----
        const triggerZone = createTriggerZone(scene, { x: 2800, y: 350, width: 200, height: 200 });
        let triggered = false;

        scene.physics.add.overlap(scene.player, triggerZone, () => {
            if (triggered) return;
            if (this._conversationTriggered) return;
            triggered = true;
            this._conversationTriggered = true;
            console.log('[authority_herd] 玩家靠近象王，觸發動畫');
            // 播放象王轉身走向主角的動畫
            this._kingApproach(scene);
            triggerZone.destroy();//0921
        });

        //年輕象對話彩蛋
        const youngLeaderTrigger = createTriggerZone(scene, { x: 2900, y: 120, width: 100, height: 100 });
        let eggTriggered = false;

        scene.physics.add.overlap(scene.player, youngLeaderTrigger, () => {
            //if (this._conversationTriggered) return; // 如果已經觸發主線，彩蛋不再觸發
            if (this._choiceTriggered) return; // 如果已經觸發主線，彩蛋不再觸發 
            if (this._easterEggTriggered) return;
            if (eggTriggered) return;
            eggTriggered = true;
            this._easterEggTriggered = true;
            console.log('[authority_herd] 觸發年輕象彩蛋對話');
            this._youngEasterEgg(scene);
            youngLeaderTrigger.destroy();
        });
    },

    // ---- 象王走向主角並拿出祈雨石的動畫 ----
    _kingApproach(scene) {
        const sprites = this.sprites;
        const player = scene.player;
        const king = sprites.king;

        // 鎖定玩家
        scene.playerController.disable();

        // 計算象王面向主角的方向（讓象王轉向玩家）
        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        // 由於 sprite 預設是朝右，我們用 setFlipX 來控制左右翻轉
        // 假設象王的圖案預設朝右，當玩家在左側時翻轉
        if (player.x < king.x) {
            king.setFlipX(true);
        } else {
            king.setFlipX(false);
        }

        //注意到主角
        // this._cutejump(scene,king,this._kingApproach2(scene));
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
                                                // 移動到主角前方（距離主角 100px 處）
                                                const targetX = player.x - Math.cos(angle) * 200;
                                                const targetY = player.y - Math.sin(angle) * 100;
                                                let shakeTime = 0;

                                                // 顯示祈雨石（暫時放在象王身上，稍後再移動到特定位置）
                                                //sprites.rainStone.setVisible(true).setPosition(king.x, king.y - 40);

                                                // 象王移動 Tween
                                                //0908
                                                //addWalkShake(king);
                                                scene.tweens.add({
                                                    targets: king,
                                                    x: targetX,
                                                    y: targetY,
                                                    duration: 2000,
                                                    ease: 'Sine.easeInOut',
                                                    onUpdate: () => {
                                                        // // 讓祈雨石跟著象王移動（保持相對位置）
                                                        // sprites.rainStone.setVisible(true);
                                                        // sprites.rainStone.setPosition(king.x - 90, king.y + 40);

                                                        // 在移動過程中疊加上下晃動（幅度 5px，頻率 15Hz）
                                                        shakeTime += 0.1;
                                                        const shakeOffset = Math.sin(shakeTime * 0.5) * 5;
                                                        king.y += shakeOffset;  // 在目標 y 上疊加偏移
                                                    },
                                                    onComplete: () => {
                                                        // console.log('[authority_herd] 象王已走到主角面前，拿出祈雨石');
                                                        this._startEvent(scene);
                                                        king.setPosition(targetX, targetY);
                                                        // scene.tweens.killTweensOf(king);//0908
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

    // ---- 年輕象彩蛋對話 ----
    _youngEasterEgg(scene) {
        //lock player dont move
        scene.playerController.disable();
        const young = this.sprites.youngLeader;
        //0908
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
                                            { speaker: '年輕象A', text: '小象好久沒喝水了...再繞路會不會花費太久?' },
                                            { speaker: '年輕象B', text: '那條山路我們還沒有走過，看起來還算安全，要走走看嗎...' },
                                            { speaker: '年輕象領', text: '可能得試試看...了嗎...' },
                                            { speaker: '年輕象ABC', text: '......' },
                                        ];

                                        DialogueSystem.show(scene, easterLines, () => {
                                            // 彩蛋對話結束，解鎖玩家
                                            scene.playerController.enable();
                                            console.log('[authority_herd] 彩蛋對話結束，玩家可以繼續探索');
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
    // ---------- 事件流程主控（對話與後續） ----------
    _startEvent(scene) {
        const sprites = this.sprites;

        //lock player dont move
        scene.playerController.disable();

        const kingLines1 =[
            { "speaker": "王", "text": "你好，朋友，你也要去山的對面嗎?" },
            { "speaker": "王", "text": "......" },
            { "speaker": "王", "text": "我們要去對岸的河谷，你要一起嗎" },
            { "speaker": "王", "text": "......" },
        ];
        console.log(typeof(kingLines1));        
        console.log(kingLines1);
        DialogueSystem.show(scene, kingLines1, () => {
            this._startEvent2(scene);
        });
    },
    _startEvent2(scene) {
        const sprites = this.sprites;
        sprites.rainStone.setVisible(false);
        //this._giveRainStone(scene, 'king');//0908
        sprites.king.setFlipX(false);

        const kingLines2 = [
            { speaker: '王', text: '這座山，很危險...很脆弱...石頭，會掉下來...' },
            { speaker: '王', text: '......' },
            { speaker: '王', text: '我們象群，不准上山，這是命令' },
            { speaker: '王', text: '我們走安全的路，繞過他' },
            { speaker: '王', text: '王的命令，你，聽從嗎 ?' },
        ];


        DialogueSystem.show(scene, kingLines2, () => {
            // 象王對話結束，不解鎖玩家，而是引導玩家前往岔路口
            console.log('[authority_herd] 象王對話結束，建立道路選擇觸發區');
            this._setupChoiceTrigger(scene);
            scene.playerController.enable();
        });
    },

// ---- 建立道路選擇的觸發區（岔路口） ----
_setupChoiceTrigger(scene) {
    // 在岔路口位置 (4000, 800) 建立一個觸發區域
    const choiceZone = createTriggerZone(scene, { x: 2950, y: 300, width: 200, height: 200 });
    let choiceTriggered = false;

    // 偵測玩家進入
    scene.physics.add.overlap(scene.player, choiceZone, () => {
        if (choiceTriggered) return;
        if (this._choiceTriggered) return; // 避免重複
        choiceTriggered = true;
        this._choiceTriggered = true;
        console.log('[authority_herd] 玩家到達岔路口，觸發道路選擇');
        //lock player dont move
        //scene.playerController.disable();
        // 顯示選擇
        this._showFirstChoice(scene);
        choiceZone.destroy();
    });
},

// ---- 第一個抉擇：跟隨 vs. 穿山 ----
_showFirstChoice(scene) {
    const options = [
        { key: "follow", label: '服從象王\n走平地繞遠路' },
        { key: "direct", label: '婉拒\n走山中捷徑' }
    ];

    ChoiceSystem.prompt(scene, options, (chosenKey) => {
        // 選擇後解鎖玩家（移動動畫會再鎖一次）
        //scene.playerController.enable();

        scene.sharedState = scene.sharedState || {};
        scene.sharedState.authority_choice = chosenKey;

        if (chosenKey === 'follow') {
            MoralState.add('authority', 1);
            this.choose_Far_Way = true;
        } else {
            MoralState.add('fairness', 1);
            this.choose_Far_Way = false;
        }

        // ---- 決定移動的 Sprite 集合 ----
        //let moveSprites = {};
        if (chosenKey === 'follow') {
            scene.playerController.disable();
            const kinghappy = [
                {speaker:'王', text:'明智的抉擇，一起走吧'},
                {speaker:'王', text:'......'},
            ];

            DialogueSystem.show(scene, kinghappy, () => {
                // 對話結束，解鎖玩家
                //scene.playerController.enable();
                console.log('into mountain road');
                this._choice_0_animate(scene);
            });
    ///
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
                // 對話結束，解鎖玩家
                scene.playerController.enable();
                console.log('into mountain road');
                this._choice_1_animate(scene);
            });

        };
    });
},

    _choice_0_animate(scene){

        //mountain deep
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        //sprites.mountain01_03.setDepth(1000);
        this.sprites.mountain02_01.setDepth(100);
        this.sprites.mountain02_02.setDepth(100);
        this.sprites.mountain02_03.setDepth(100);

        // 只移動象王、中年象（年輕象群與小象不移動）
        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
            scene.player
        ];
        console.log('this.sprites.king:', this.sprites.king);
        console.log('this.sprites.normals:', this.sprites.normals);
        let shakeTime1 = 0;//0908

        // // 跟隨路線：先到中繼點，再到終點
        scene.tweens.add({
            targets: this.sprites.king,
            x: 3550,
            y: 280,
            duration: 6000,
            ease: 'Sine.easeInOut',

            //0908
            onUpdate: () => {
                shakeTime1 += 0.1;
                const shakeOffset = Math.sin(shakeTime1 * 0.5) * 5;
                this.sprites.king.y += shakeOffset;  // 在目標 y 上疊加偏移
            },
            onStart: () => {
                scene.time.delayedCall(2000, () => {
                    scene.tweens.add({
                        targets:scene.player,
                        x: 3500,
                        y: 300,
                        duration: 5000,
                        ease: 'Sine.easeInOut',
                        //0908
                        onUpdate: () => {
                            shakeTime1 += 0.1;
                            const shakeOffset = Math.sin(shakeTime1 * 0.5) * 5;
                            scene.player.y += shakeOffset;  // 在目標 y 上疊加偏移
                        },

                        onComplete: () => {

                        }
                    })
                })
            },
            onComplete: () => {
                //this.sprites.king.setPosition(3600, 280);//0908

                //scene.player.setPosition(3550, 300);//0908
                this.sprites.normals.forEach((e)=>{
                    e.setFlipX(false);
                })
                const offsetX = 1000;   // 向右偏移
                const offsetY = 225;  // 向下偏移

                const targets = moveSprites.map(sprite => ({
                    x: sprite.x + offsetX,
                    y: sprite.y + offsetY
                }));

                //let shakeTime2 = 0;
                let both = false;
                let count = 0;
                
                moveSprites.forEach((sprite, index) => {
                    scene.tweens.add({
                        targets: sprite,
                        x: targets[index].x,
                        y: targets[index].y,
                        duration: 15000,
                        ease: 'Sine.easeInOut',
                        //0908
                        onStart:() => {
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
                                            this._choice_0_animate2(scene);
                                        }
                                        else{
                                            both = true;
                                        }
                                    });       
                                }         
                            })
                        },

                        onUpdate: () => {
                            const elapsed = scene.time.now / 500; // 秒
                            const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                            const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                            sprite.y += shakeOffsetY;  
                            sprite.x += shakeOffsetX;  
                        },

                        onComplete:()=>{
                            if(index==4){
                                if(both == true){
                                    this._choice_0_animate2(scene);
                                }
                                else{
                                    both = true;
                                }
                            }
                        }

                    })
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
        //0908
        //this._youngArrive(scene);
        this.sprites.king.setFlipX(true);
        scene.player.setFlipX(true);
        const offsetX = -50;   // 向右偏移
        const offsetY = 700;  // 向下偏移
        let both = false;

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));

        //let shakeTime3 = 0;
        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 15000,
                ease: 'Sine.easeInOut',
                //0908
                onStart: () => {
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
                                }
                                else{
                                    both = true;
                                }
                            });   
                        }
                    })
                },
                onUpdate: () => {
                    // shakeTime3 += 0.1;
                    // const shakeOffset = Math.sin(shakeTime3 * 0.5) * 5;
                    // sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
                    const elapsed = scene.time.now / 500; // 秒
                    const shakeOffsetX = Math.sin(elapsed) * 5 *(index%2-0.5); 
                    const shakeOffsetY = Math.cos(elapsed * 3) * 5 *(index%2-0.5);
                    moveSprites[index].x += shakeOffsetX;  
                    moveSprites[index].y += shakeOffsetY;  
                },
                onComplete:()=>{
                    if(index==3){
                        if(both==true){
                            this._choice_0_animate3(scene);
                        }
                        else{
                            both = true;
                        }
                    }
                }
            });
        })
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
            // 對話結束，解鎖玩家
            scene.playerController.enable();
            // const triggerZone = createTriggerZone(scene, { x: 4500, y: 1600, width: 400, height: 400 });

            // scene.physics.add.overlap(scene.player, triggerZone, () => {
            //     if (this._metYoungChoiceTriggered) return;
            //     this._metYoungChoiceTriggered = true;
            //     this._kingAngry(scene);
            // });
            this._kingAngry(scene);
        });
    },

    _choice_1_animate(scene){

        //mountain deep
        this.sprites.mountain01_01.setDepth(100);
        this.sprites.mountain01_02.setDepth(100);
        //this.sprites.mountain01_03.setDepth(1000);
        this.sprites.mountain02_01.setDepth(5);
        this.sprites.mountain02_02.setDepth(5);
        this.sprites.mountain02_03.setDepth(5);

        const moveSprites = [
            this.sprites.rock,
            scene.player
        ];
        let shakeTime1 = 0;
        let both = false;
        // ---- 上山路線：直線移動，中途觸發石頭滾動 ----
        scene.tweens.add({
            targets: moveSprites,
            x: 3600,
            y: 750,
            duration: 8000,
            ease: 'Linear',
            //0908
            onUpdate: () => {
                shakeTime1 += 0.05;
                const shakeOffsetX = Math.cos(shakeTime1 * 0.1) * 2.5;
                const shakeOffsetY = Math.sin(shakeTime1 * 0.5) * 2.5;
                scene.player.y += shakeOffsetY;  
                scene.player.x -= shakeOffsetX;  
            },
            onStart: () => {
                this._kingmove(scene);
                scene.time.delayedCall(2000, () => {
                    const selftalk = [
                        {speaker:'player', text:'山路應該會，比較快的吧...'},
                        {speaker:'player', text:'...'},
                        {speaker:'player', text:'...啊!糟糕!'},
                    ];

                    DialogueSystem.show(scene, selftalk, () => {
                        // 對話結束，解鎖玩家
                        //scene.playerController.enable();
                        if(both==true){
                            this._rock_animate(scene);
                        }
                        else{
                            both = true;
                        }
                    });
                });
            },
            onComplete: ()=>{                    
                //scene.playerController.enable();
                if(both==true){
                    this._rock_animate(scene);
                }
                else{
                    both = true;
                }
            }
        });
    },

    // _rock_animate(scene){
    //     this.sprites.rock.setPosition(3400,1200);
    //     this.sprites.rock.setVisible(true);
    //     scene.tweens.add({
    //         targets: this.sprites.rock,
    //         x: 4500,
    //         y: 400,   // 保持同一水平線，或者稍微變化
    //         rotation: Math.PI * 2, // 旋轉一圈
    //         duration: 3000,
    //         ease: 'Linear',
    //         onComplete: () => {
    //             // // 移動結束後，確保石頭隱藏
    //             if (this.sprites.rock) this.sprites.rock.setVisible(false);

    //             //scene.playerController.enable();
    //             this._choice_1_animate2(scene);
    //         }
    //     });
    // },
    _rock_animate(scene){
        const curve = new Phaser.Curves.CubicBezier(
            new Phaser.Math.Vector2(3200, 460),  // 起點
            new Phaser.Math.Vector2(4250, 1500),   // 控制點 1
            new Phaser.Math.Vector2(4200, 100),   // 控制點 2
            new Phaser.Math.Vector2(4500, 400)    // 終點
        );

        const point = new Phaser.Math.Vector2();
        this.sprites.rock.setVisible(true);
        scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: 3000,
            ease: 'Linear',
            onStart: ()=>{
                scene.time.delayedCall(1000, () => {
                    scene.player.setTexture('main_character_uncomfortable');
                })
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
                scene.player.setTexture('main_character_moving_01');
                
            }
        });
    },

    _choice_1_animate2(scene){
        // 穿山路線：所有象群移動（原設計）
        const moveSprites = [
            this.sprites.rock,
            scene.player
        ];
        let shakeTime1 = 0;
        let both = false;
        scene.tweens.add({
            targets: moveSprites,
            x: 4500,
            y: 1200,
            duration: 8000,
            ease: 'Linear',
            //0908
            onUpdate: () => {
                shakeTime1 += 0.05;
                const shakeOffset = Math.sin(shakeTime1 * 0.5) * 2.5;
                scene.player.y += shakeOffset;  // 在目標 y 上疊加偏移
                scene.player.x -= shakeOffset;  // 在目標 y 上疊加偏移
            },

            onStart: () => {
                scene.time.delayedCall(2000, () => {
                    const selftalk = [
                        {speaker:'player', text:'剛剛，好危險...'},
                        {speaker:'player', text:'...'},
                    ];

                    DialogueSystem.show(scene, selftalk, () => {
                        // 對話結束，解鎖玩家
                        if(both==true){
                            scene.playerController.enable();
                            this._choice_0_2_0(scene);
                        }
                        else{
                            both = true;
                        }
                    });
                });
            },
            onComplete: ()=>{   
                if(both==true){
                    scene.playerController.enable();
                    this._choice_0_2_0(scene);
                }   
                else{
                    both=true;
                }              
            }
        });
    },


    // ---- 第二階段：象王與年輕象的爭吵 ----
    // 抵達後口渴
    _choice_0_2_0(scene) {
        //lock player dont move
        //scene.playerController.disable();

        const easterLines = [
            {speaker:'player', text:'但是，好像有比較快'},
            {speaker:'player', text:'......'},
            {speaker:'player', text:'這裡就是河谷了...要快點才行...'},
            {speaker:'player', text:'趕快找到...下個寶石...水域廢墟...'},
            {speaker:'player', text:'......'},
        ];

        DialogueSystem.show(scene, easterLines, () => {
            // 對話結束，解鎖玩家
            //scene.playerController.enable();
            this._youngArrive(scene);
        });
    },

    //水邊休息，看到年輕象群
    _youngArrive(scene) {
        const moveSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];

///
        let x = this.choose_Far_Way?15000:10000;
        // 兩段路線：先到終點，再到水邊
        const offsetX = 1500;   // 向右偏移
        const offsetY = 1250;  // 向下偏移

        const targets = moveSprites.map(sprite => ({
            x: sprite.x + offsetX,
            y: sprite.y + offsetY
        }));
        //let shakeTime2 = 0;

        moveSprites.forEach((sprite, index) => {
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: x,
                ease: 'Sine.easeInOut',
                //0908
                onUpdate: () => {
                    const elapsed = scene.time.now / 500; // 秒
                    const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                    const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                    sprite.y += shakeOffsetY;  
                    sprite.x += shakeOffsetX;  
                },

                onComplete:()=>{

                    const offsetX = 0;   // 向右偏移
                    const offsetY = 450;  // 向下偏移
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
                                //0908
                                onUpdate: () => {
                                    const elapsed = scene.time.now / 500; // 秒
                                    const shakeOffsetY = Math.sin(elapsed * 3) * 5 *(index%2-0.5);                            
                                    const shakeOffsetX = Math.cos(elapsed ) * 5 *(index%2-0.5); 
                                    sprite.y += shakeOffsetY;  
                                    sprite.x += shakeOffsetX;  
                                },

                                onComplete:()=>{
                                }
                            })
                        })
                    }
                    if(!this.choose_Far_Way){

                        const triggerZone = createTriggerZone(scene, { x: 4500, y: 1300, width: 400, height: 400 });

                        scene.physics.add.overlap(scene.player, triggerZone, () => {
                            if (this._YoungArriveTriggered) return;
                            this._YoungArriveTriggered = true;
                            this._youngarrive2(scene);
                            triggerZone.destroy();
                        });

                        // if(index==3){
                        //     const teamarrive = [
                        //         {speaker:'青年象A', text:'到了 果然 好快'},
                        //         {speaker:'青年象領', text:'...'},
                        //         {speaker:'青年象領', text:'帶小象 水'},
                        //         {speaker:'青年象領', text:'...'},
                        //     ];

                        //     DialogueSystem.show(scene, teamarrive, () => {
                        //         // 對話結束，解鎖玩家
                        //         //scene.playerController.enable();
                        //         this._kingArrive(scene);
                        //     });
                        // }

                    }

                }
            })
        })
    },

    _youngarrive2(scene){

        const teamarrive = [
            {speaker:'青年象A', text:'到了，居然，快了好多...'},
            {speaker:'青年象領', text:'...'},
            {speaker:'青年象領', text:'帶小象去水邊吧，趕快'},
            {speaker:'青年象領', text:'...'},
        ];

        DialogueSystem.show(scene, teamarrive, () => {

            const moveSprites = [
                this.sprites.youngLeader,
                ...this.sprites.youngs,
                this.sprites.little,
            ];
            const offsetX = 0;   // 向右偏移
            const offsetY = 450;  // 向下偏移
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
                    //0908
                    onUpdate: () => {
                        const elapsed = scene.time.now / 500; // 秒
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
                })
            })
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

            //0908
            onUpdate: () => {
                shakeTime1 += 0.1;
                const shakeOffset = Math.sin(shakeTime1 * 0.5) * 5;
                this.sprites.king.y += shakeOffset;  // 在目標 y 上疊加偏移
            },
            onComplete: () => {
            }
        })
    },

    // 王抵達
    _kingArrive(scene) {
        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
            // this.sprites.crown,
        ];
        moveSprites.forEach((sprite, index) => {
            const offsetX = 950;   // 向右偏移
            const offsetY = 225;  // 向下偏移

            const targets = moveSprites.map(sprite => ({
                x: sprite.x + offsetX,
                y: sprite.y + offsetY
            }));
            scene.tweens.add({
                targets: sprite,
                x: targets[index].x,
                y: targets[index].y,
                duration: 3000,
                ease: 'Sine.easeInOut',
                //0908
                onUpdate: () => {
                    //shakeTime2 += 0.1;
                    //const shakeOffset = Math.sin(shakeTime2 * 0.5) * 5;
                    const elapsed = scene.time.now / 1000; // 秒
                    const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                    sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
                },

                onComplete:()=>{
                    this.sprites.king.setFlipX(true);
                    const offsetX = -50;   // 向右偏移
                    const offsetY = 700;  // 向下偏移

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
                            //0908
                            onUpdate: () => {
                                //shakeTime2 += 0.1;
                                //const shakeOffset = Math.sin(shakeTime2 * 0.5) * 5;
                                const elapsed = scene.time.now / 1000; // 秒
                                const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                                sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
                            },

                            onComplete:()=>{
                                if(index==3){
                                    const triggerZone = createTriggerZone(scene, { x: 4500, y: 1300, width: 400, height: 400 });

                                    scene.physics.add.overlap(scene.player, triggerZone, () => {
                                        if (this._KingArriveTriggered) return;
                                        this._KingArriveTriggered = true;
                                        this._kingArrive2(scene);
                                        triggerZone.destroy();
                                    });
                                }
                            }
                        })
                    })
                }
            })
        })
    },

    _kingArrive2(scene) {
        const teamarrive = [
            {speaker:'王', text:'...'},
            {speaker:'王', text:'看來有象，違反規定了...'},
            {speaker:'王', text:'。。。。。。'},
        ];

        DialogueSystem.show(scene, teamarrive, () => {
            // 對話結束，解鎖玩家
            //scene.playerController.enable();
            this._kingAngry(scene);
        });
    },

    // 王angry
    _kingAngry(scene) {
        const moveSprites = [
            this.sprites.king,
        ];

///
        // 王上前訓斥
        scene.tweens.add({
            targets: moveSprites,
            x: 4500,
            y: 1550,
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                //scene.playerController.enable();
                const triggerZone = createTriggerZone(scene, { x: 4500, y: 1600, width: 300, height: 300 });
                scene.physics.add.overlap(scene.player, triggerZone, () => {
                    if (this._metYoungChoiceTriggered) return;
                    this._metYoungChoiceTriggered = true;
                    this._startArgument(scene);
                    triggerZone.destroy();
                });                
                //this._startArgument(scene);
            }
        });
    },

    _youngLeaderAngry(scene) {
        const moveSprites = [
            this.sprites.youngLeader,
            //...this.sprites.normals,
            //this.sprites.crown,
        ];

        // 年輕象回嗆
        scene.tweens.add({
            targets: moveSprites,
            x: 4500,
            y: 1650,
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
            }
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
        const sprites = this.sprites;

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
                    // this._showSecondChoice(scene);
                    
                    const triggerZone = createTriggerZone(scene, { x: 4500, y: 1600, width: 200, height: 200 });
                    //let a03_triggered = false;
                    //this._argumentTriggerZone = triggerZone;

                    scene.physics.add.overlap(scene.player, triggerZone, () => {
                        //if (a03_triggered) return;
                        if (this._secondChoiceTriggered) return;
                        //a03_triggered = true;
                        this._secondChoiceTriggered = true;
                        // 播放動畫
                        this._showSecondChoice(scene);
                        triggerZone.destroy();
                    });

                });
            });
        });
    },

    // ---- 第二個抉擇：支持王 vs. 支持年輕象 ----
    _showSecondChoice(scene) {

        const moveSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];
        moveSprites.forEach((e)=>{
            if (scene.player.x < e.x){
                e.setFlipX(true);
            } 
            else{
                e.setFlipX(false);
            }
        })

        const thinking = [
            { speaker: 'player', text: '(誰的說法，比較支持)' },
            { speaker: 'player', text: '(......)' },
        ];
        DialogueSystem.show(scene, thinking, () => {
            const options = [
                { key: 'king', label: '王\n有理' },
                { key: 'young', label: '年輕象\n有理' }
            ];

            //scene.playerController.disable();

            ChoiceSystem.prompt(scene, options, (chosenKey) => {
                scene.sharedState.argument_choice = chosenKey;

                if (chosenKey === 'king') {
                    MoralState.add('authority', 2);
                } else {
                    MoralState.add('fairness', 2);
                    MoralState.add('ingroup', 1);
                }

                if (chosenKey === 'king') {
                    this._kingEnding(scene);
                } else {
                    this._youngEnding(scene);
                }
            });
        });


    },

    // ---- 結局一：支持王 ----
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
                        const elapsed = scene.time.now / 500; // 秒
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
            //this._giveRainStone(scene, 'king');
            //this.sprites.rainStone.setVisible(false);
            //scene.playerController.enable();
        });
    },

    //彩蛋區
    _spawnYoungEasterEgg2(scene) {
        const youngLeader = this.sprites.youngLeader;

        // 在年輕象群離開後的新位置建立觸發區
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
            console.log('年輕象群彩蛋（離開後）');
            this._youngEasterEgg2(scene);
            eggZone.destroy();
        });
    },

    _youngEasterEgg2(scene) {
        const player = scene.player;

        // 讓年輕象群面向玩家
        const youngSprites = [
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
        ];

        const lines = [
            { speaker: '小象', text: '對不起，都是我害的...' },
            { speaker: '年輕象ABC', text: '......' },
            { speaker: '年輕象領', text: '你的健康，最重要，沒關係的，我們支持' },
            { speaker: '小象', text: '...QAQ' },
            { speaker: '年輕象領', text: '等王消氣，再回去吧' },
        ];

        DialogueSystem.show(scene, lines, () => {
            console.log('彩蛋結束');
        });
    },

    // ---- 象王走向主角並拿出祈雨石的動畫 ----
    _kingApproach2(scene) {
        const sprites = this.sprites;
        const player = scene.player;
        const king = sprites.king;
        let x = 1;
        
        this.sprites.king.setDepth(10);
        this.sprites.rainStone.setDepth(11);

        // 鎖定玩家
        //scene.playerController.disable();

        // 計算象王面向主角的方向（讓象王轉向玩家）
        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        // 由於 sprite 預設是朝右，我們用 setFlipX 來控制左右翻轉
        // 假設象王的圖案預設朝右，當玩家在左側時翻轉
        if (player.x < king.x) {
            king.setFlipX(true);
            x=x-2;
        } else {
            king.setFlipX(false);
        }

        // 移動到主角前方（距離主角 100px 處）
        const targetX = player.x - Math.cos(angle) * 200;
        const targetY = player.y - Math.sin(angle) * 100;

        // 顯示祈雨石（暫時放在象王身上，稍後再移動到特定位置）
        //sprites.rainStone.setVisible(true).setPosition(king.x, king.y - 40);

        // 象王移動 Tween
        scene.tweens.add({
            targets: king,
            x: targetX,
            y: targetY,
            duration: 2000,
            ease: 'Sine.easeInOut',
            onUpdate: () => {
                // 讓祈雨石跟著象王移動（保持相對位置）
                sprites.rainStone.setVisible(true);
                sprites.rainStone.setPosition(king.x + 90*x, king.y + 40);
                sprites.rainStone.setDepth(1000);
            },
            onComplete: () => {
                // 到達後，讓祈雨石稍微「浮現」或發光（可選）
                // 這裡我們直接進入對話
                console.log('象王祈雨石');
                this._kingEnding2(scene);
            }
        });
    },

    // ---- 結局二：支持年輕象 ----
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

        const offsetX = 0;   // 向右偏移
        const offsetY = -300;  // 向下偏移

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
                    // scene.playerController.enable();
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

        // 鎖定玩家
        //scene.playerController.disable();

        // 計算象王面向主角的方向（讓象王轉向玩家）
        const angle = Phaser.Math.Angle.Between(king.x, king.y, player.x, player.y);
        // 由於 sprite 預設是朝右，我們用 setFlipX 來控制左右翻轉
        // 假設象王的圖案預設朝右，當玩家在左側時翻轉
        if (player.x < king.x) {
            king.setFlipX(true);
            x=x-2;
        } else {
            king.setFlipX(false);
        }

        // 移動到主角前方（距離主角 100px 處）
        const targetX = player.x - Math.cos(angle) * 150;
        const targetY = player.y - Math.sin(angle) * 80;
        // 象王移動 Tween
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
                // 到達後，讓祈雨石稍微「浮現」或發光（可選）
                // 這裡我們直接進入對話
                console.log('[authority_herd] 象王已走到主角面前，拿出祈雨石');
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
            //this._giveRainStone(scene, 'young');
            //this.sprites.rainStone.setVisible(false);
            //this._spawnlittleEgg2(scene);
            scene.playerController.enable();
        });
    },

    // ---- 給予祈雨石 ----
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

    // ---- 腳下碰撞箱輔助方法 ----
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

    // ---------- update（可留空） ----------
    update(scene) {
        const spritesToSort = [
            this.sprites.king,
            ...this.sprites.normals,
            this.sprites.youngLeader,
            ...this.sprites.youngs,
            this.sprites.little,
            //this.sprites.rainStone,
            scene.player,
            this.sprites.rock,
            //this.sprites.mountain01_01,
            //this.sprites.mountain01_02,
            //this.sprites.mountain02_01,
            //this.sprites.mountain02_02,
            //this.sprites.mountain02_03,
        ].filter(s => s && s.active);

        const depthOffset = 10;
        spritesToSort.forEach(sprite => {
            sprite.setDepth(depthOffset - (scene.player.y - sprite.y)/50);
            //console.log(scene.player.y - sprite.y);
        });
    }
};