import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';

export default {
    key: 'authority_herd',

    setup(scene) {
        // ---------- 建立所有角色 Sprite（預設隱藏） ----------
        const sprites = {};

        // 象王（老象，有皺紋）
        sprites.king = scene.add.sprite(3200, 200, 'old_elephant_king')
            .setScale(0.6)
            .setVisible(false);
        scene.registerAsset(sprites.king);

        // 中年象 × 3
        sprites.normals = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.add.sprite(3600 + i * 40, 240, 'young_elephant')
                .setScale(0.6)
                .setVisible(false);
            scene.registerAsset(s);
            sprites.normals.push(s);
        }

        // 年輕象領袖（顏色較深）
        sprites.youngLeader = scene.add.sprite(3220, 280, 'young_elephant_leader')
            .setScale(0.4)
            .setVisible(false);
        scene.registerAsset(sprites.youngLeader);

        // 年輕象 × 3
        sprites.youngs = [];
        for (let i = 0; i < 3; i++) {
            const s = scene.add.sprite(3180 + i * 35, 310, 'young_elephant')
                .setScale(0.4)
                .setVisible(false);
            scene.registerAsset(s);
            sprites.youngs.push(s);
        }

        // 小象（虛弱）
        sprites.little = scene.add.sprite(3230, 350, 'little_elephant_weak')
            .setScale(0.6)
            .setVisible(false);
        scene.registerAsset(sprites.little);

        // 祈雨石（可能在事件結尾獲得，先不顯示）
        sprites.rainStone = scene.add.sprite(3240, 380, 'rain_stone')
            .setScale(0.6)
            .setVisible(false);
        scene.registerAsset(sprites.rainStone);

        // 滾動的大石頭（預設隱藏）
        sprites.rock = scene.add.sprite(3500, 600, 'rock_rolling')
            .setScale(0.8)
            .setVisible(false);
        scene.registerAsset(sprites.rock);

        // 保存 sprite 引用到模組實例，方便後續步驟使用
        this.sprites = sprites;

        // // ---------- 建立觸發區域（新座標 2500, 400） ----------
        // const triggerZone = createTriggerZone(scene, { x: 2500, y: 400, width: 100, height: 100 });
        // let triggered = false;

        // scene.physics.add.overlap(scene.player, triggerZone, () => {
        //     if (triggered) return;
        //     triggered = true;
        //     // 啟動事件流程
        //     this._startEvent(scene);
        // });
        // ---------- 第一階段：偵測玩家走到 (2500, 400)，生成象群 ----------
        const spawnZone = createTriggerZone(scene, { x: 2500, y: 400, width: 100, height: 100 });
        let spawned = false;

        scene.physics.add.overlap(scene.player, spawnZone, () => {
            if (spawned) return;
            spawned = true;
            this._spawnHerd(scene);
        });

        this._easterEggTriggered = false; 

        // ---------- 第二階段：偵測玩家碰到象王，觸發對話 ----------
        // 在 _spawnHerd 中會建立這個碰撞
        this._conversationTriggered = false;

        this.choose_Far_Way = false;
    },

    // // ---------- 事件流程主控 ----------
    // _startEvent(scene) {
    //     const sprites = this.sprites;

    // ---- 輔助方法：將對話轉為純字串陣列 ----
    _formatLines(lines) {
        return lines.map(line => {
            if (typeof line === 'string') return line;
            if (line && typeof line === 'object') {
                const speaker = line.speaker ? `${line.speaker}：` : '';
                const text = line.text || '';
                return speaker + text;
            }
            return String(line);
        });
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
        const triggerZone = createTriggerZone(scene, { x: 2900, y: 300, width: 120, height: 120 });
        let triggered = false;

        scene.physics.add.overlap(scene.player, triggerZone, () => {
            if (triggered) return;
            if (this._conversationTriggered) return;
            triggered = true;
            this._conversationTriggered = true;
            console.log('[authority_herd] 玩家靠近象王，觸發動畫');
            // 播放象王轉身走向主角的動畫
            this._kingApproach(scene);
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
                                            { speaker: '年輕象領', text: '小象 缺水 渴' },
                                            { speaker: '年輕象A', text: '繞路 好遠' },
                                            { speaker: '年輕象B', text: '山路 沒有試過 安全 看起來' },
                                            { speaker: '年輕象領', text: '試試看 走嗎' },
                                            { speaker: '年輕象ABC', text: '......' },
                                        ];

                                        DialogueSystem.show(scene, this._formatLines(easterLines), () => {
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
            { speaker: "王", text: "你好..." },
            { "speaker": "王", "text": "要去 山的對面 嗎 你也" },
            { "speaker": "王", "text": "......" },
            { "speaker": "王", "text": "河谷 我們要去" },
            { "speaker": "王", "text": "一起嗎" },
            { "speaker": "王", "text": "......" }
        ];
        console.log(typeof(kingLines1));        
        console.log(kingLines1);
        DialogueSystem.show(scene, this._formatLines(kingLines1), () => {
            this._startEvent2(scene);
        });
    },
    _startEvent2(scene) {
        const sprites = this.sprites;
        sprites.rainStone.setVisible(false);
        //this._giveRainStone(scene, 'king');//0908
        sprites.king.setFlipX(false);

        const kingLines2 = [
            { speaker: '王', text: '山 很危險...很脆弱...' },
            { speaker: '王', text: '石頭 會掉下來...' },
            { speaker: '王', text: '......' },
            { speaker: '王', text: '象 上山不准 命令' },
            { speaker: '王', text: '我們 走安全 繞' },
            { speaker: '王', text: '王的 命令' },
            { speaker: '王', text: '你 聽從嗎' },
            { speaker: '王', text: '......' }
        ];


        DialogueSystem.show(scene, this._formatLines(kingLines2), () => {
            // 象王對話結束，不解鎖玩家，而是引導玩家前往岔路口
            console.log('[authority_herd] 象王對話結束，建立道路選擇觸發區');
            this._setupChoiceTrigger(scene);
            scene.playerController.enable();
        });
    },

// ---- 建立道路選擇的觸發區（岔路口） ----
_setupChoiceTrigger(scene) {
    // 在岔路口位置 (4000, 800) 建立一個觸發區域
    const choiceZone = createTriggerZone(scene, { x: 3100, y: 300, width: 100, height: 100 });
    let choiceTriggered = false;

    // 顯示一個提示文字（可選）
    const hint = scene.add.text(4000, 750, '前方岔路，選擇你的道路', {
        fontFamily: 'Huninn',
        fontSize: '24px',
        color: '#ffdd44',
        backgroundColor: '#00000088',
        padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(100);
    scene.registerAsset(hint); // 註冊以便 DevTools 可見

    // 偵測玩家進入
    scene.physics.add.overlap(scene.player, choiceZone, () => {
        if (choiceTriggered) return;
        if (this._choiceTriggered) return; // 避免重複
        choiceTriggered = true;
        this._choiceTriggered = true;
        console.log('[authority_herd] 玩家到達岔路口，觸發道路選擇');
        // 移除提示文字
        hint.destroy();
        //lock player dont move
        //scene.playerController.disable();
        // 顯示選擇
        this._showFirstChoice(scene);
    });
},

// ---- 第一個抉擇：跟隨 vs. 穿山 ----
_showFirstChoice(scene) {
    const options = [
        { key: "follow", label: '服從象王 跟隨繞山' },
        { key: "direct", label: '婉拒 直接穿過山脈' }
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
                {speaker:'王', text:'抉擇 明智 的 你'},
                {speaker:'王', text:'走吧 一起'},
                {speaker:'王', text:'......'},
            ];

            DialogueSystem.show(scene, this._formatLines(kinghappy), () => {
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
                {speaker:'王', text:'你 不屬於我們'},
                {speaker:'王', text:'我們 不冒險'},
                //{speaker:'王', text:''},
                {speaker:'王', text:'......'},
                {speaker:'王', text:'隨你 高興'},
                //{speaker:'王', text:'保重'},
                {speaker:'王', text:'......'},
            ];

            DialogueSystem.show(scene, this._formatLines(kingwarn), () => {
                // 對話結束，解鎖玩家
                scene.playerController.enable();
                console.log('into mountain road');
                this._choice_1_animate(scene);
            });

        };
    });
},

    _choice_0_animate(scene){
        // 只移動象王、中年象、王冠（年輕象群與小象不移動）
        const moveSprites = [
            this.sprites.king,
            ...this.sprites.normals,
            scene.player
        ];
        console.log('scene.player 是否存在？', scene.player);
        console.log('this.sprites.king:', this.sprites.king);
        console.log('this.sprites.normals:', this.sprites.normals);
        console.log('✅ 跟隨路線，目標數量：', moveSprites.length);
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
            onComplete: () => {
                this.sprites.king.setPosition(3600, 280);//0908
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
                        //scene.player.setPosition(3550, 300);//0908
                        this.sprites.normals.forEach((e)=>{
                            e.setFlipX(false);
                        })
                        const offsetX = 1100;   // 向右偏移
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
                                                {speaker:'王', text:'這條路 先王 教的'},
                                                {speaker:'王', text:'很安全'},
                                                {speaker:'王', text:'山上 危險 他說'},
                                                {speaker:'王', text:'......'},
                                            ];
                                            DialogueSystem.show(scene, this._formatLines(easterLines), () => {
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
                                    //shakeTime2 += 0.1;
                                    //const shakeOffset = Math.sin(shakeTime2 * 0.5) * 5;
                                    const elapsed = scene.time.now / 1000; // 秒
                                    const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                                    sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
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
                            });
                        });

                    }
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
                                {speaker:'王', text:'雨 好久 沒下了'},
                                {speaker:'王', text:'食物 也變少了'},
                                {speaker:'王', text:'......'},
                            ];
                            DialogueSystem.show(scene, this._formatLines(easterLines), () => {
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
                    const elapsed = scene.time.now / 1000; // 秒
                    const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5); // 固定頻率 20Hz
                    moveSprites[index].x += shakeOffset;  // 在目標 y 上疊加偏移
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
            {speaker:'中年象A', text:'咦'},
            {speaker:'中年象B', text:'他們是'},
            {speaker:'王', text:'...'},
            {speaker:'王', text:'規定 違反了 有象'},
            {speaker:'王', text:'...'},
            {speaker:'王', text:'。。。。。。'},
        ];

        DialogueSystem.show(scene, this._formatLines(teamarrive), () => {
            // 對話結束，解鎖玩家
            scene.playerController.enable();
            this._kingAngry(scene);
        });
    },

    _choice_1_animate(scene){
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
                const shakeOffset = Math.sin(shakeTime1 * 0.5) * 2.5;
                scene.player.y += shakeOffset;  // 在目標 y 上疊加偏移
                scene.player.x -= shakeOffset;  // 在目標 y 上疊加偏移
            },

            onStart: () => {
                this._kingmove(scene);
                scene.time.delayedCall(2000, () => {
                    const selftalk = [
                        {speaker:'player', text:'山路 比較快 應該'},
                        {speaker:'player', text:'...'},
                        {speaker:'player', text:'...啊!'},
                    ];

                    DialogueSystem.show(scene, this._formatLines(selftalk), () => {
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

    _rock_animate(scene){
        this.sprites.rock.setPosition(3400,1200);
        this.sprites.rock.setVisible(true);
        scene.tweens.add({
            targets: this.sprites.rock,
            x: 4500,
            y: 400,   // 保持同一水平線，或者稍微變化
            rotation: Math.PI * 2, // 旋轉一圈
            duration: 3000,
            ease: 'Linear',
            onComplete: () => {
                // // 移動結束後，確保石頭隱藏
                if (this.sprites.rock) this.sprites.rock.setVisible(false);

                //scene.playerController.enable();
                this._choice_1_animate2(scene);
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
            x: 4600,
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
                        {speaker:'player', text:'確實 危險 有點 ...'},
                        {speaker:'player', text:'...'},
                    ];

                    DialogueSystem.show(scene, this._formatLines(selftalk), () => {
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
            {speaker:'player', text:'但是 確實 比較快'},
            {speaker:'player', text:'......'},
            {speaker:'player', text:'這裡 是河谷'},
            {speaker:'player', text:'要快點 收集'},
            {speaker:'player', text:'......'},
        ];

        DialogueSystem.show(scene, this._formatLines(easterLines), () => {
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
        let x = this.choose_Far_Way?16000:16000;
        // 兩段路線：先到終點，再到水邊
        const offsetX = 1600;   // 向右偏移
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
                    //shakeTime2 += 0.1;
                    //const shakeOffset = Math.sin(shakeTime2 * 0.5) * 5;
                    const elapsed = scene.time.now / 1000; // 秒
                    const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                    sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
                },

                onComplete:()=>{

                    const offsetX = 0;   // 向右偏移
                    const offsetY = 500;  // 向下偏移
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
                                //shakeTime2 += 0.1;
                                //const shakeOffset = Math.sin(shakeTime2 * 0.5) * 5;
                                const elapsed = scene.time.now / 1000; // 秒
                                const shakeOffset = Math.sin(elapsed * 3) * 5 *(index%2-0.5)*2; 
                                sprite.y += shakeOffset;  // 在目標 y 上疊加偏移
                            },

                            onComplete:()=>{
                            }
                        })
                    })
                    if(!this.choose_Far_Way){
                        if(index==3){
                            const teamarrive = [
                                {speaker:'青年象A', text:'到了 果然 好快'},
                                {speaker:'青年象領', text:'...'},
                                {speaker:'青年象領', text:'帶小象 水'},
                                {speaker:'青年象領', text:'...'},
                            ];

                            DialogueSystem.show(scene, this._formatLines(teamarrive), () => {
                                // 對話結束，解鎖玩家
                                //scene.playerController.enable();
                                this._kingArrive(scene);
                            });
                        }

                    }

                }
            })
        })
    },

    _youngarrive2(scene){

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
            const offsetX = 1050;   // 向右偏移
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
                                    const teamarrive = [
                                        {speaker:'王', text:'...'},
                                        {speaker:'王', text:'規定 違反了 有象...'},
                                        {speaker:'王', text:'。。。。。。'},
                                    ];

                                    DialogueSystem.show(scene, this._formatLines(teamarrive), () => {
                                        // 對話結束，解鎖玩家
                                        //scene.playerController.enable();
                                        this._kingAngry(scene);
                                    });
                                }
                            }
                        })
                    })
                }
            })
        })
    },

    // 王抵達
    _kingAngry(scene) {
        const moveSprites = [
            this.sprites.king,
            //...this.sprites.normals,
            //this.sprites.crown,
        ];

///
        // 王上前訓斥
        scene.tweens.add({
            targets: moveSprites,
            x: 4600,
            y: 1550,
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                //scene.playerController.enable();
                this._startArgument(scene);
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
            x: 4600,
            y: 1650,
            duration: 3000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                //scene.playerController.enable();
                //this._startArgument(scene);
            }
        });
    },

    _normalsWatch(scene) {
        const youngs = this.sprites.normals;
        const positions = [
            { x: 4523.5, y: 1510.2 },
            { x: 4600.0, y: 1500.0 },
            { x: 4676.5, y: 1510.2 }
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
            { x: 4523.5, y: 1690.2 },
            { x: 4600.0, y: 1700.0 },
            { x: 4676.5, y: 1690.2 }
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
            { speaker: '王', text: '山上 不能走...' },
            { speaker: '王', text: '不聽話 危險...' },
            { speaker: '王', text: '不聽話 處罰...!!!' }
        ];
        DialogueSystem.show(scene, this._formatLines(kingScold), () => {
            this._youngLeaderAngry(scene);
            const youngProtest = [
                { speaker: '年輕象', text: '繞路 好久 水不夠...' },
                { speaker: '年輕象', text: '小象 缺水...' },
                { speaker: '年輕象', text: '你固執...!!!' },
            ];
            DialogueSystem.show(scene, this._formatLines(youngProtest), () => {
                this._normalsWatch(scene);
                const kingReply = [
                    { speaker: '王', text: '先王 訓令 不會錯...' },
                    { speaker: '王', text: '你們 不聽話 要處罰...' },
                    { speaker: '王', text: '......' },
                    { speaker: '王', text: '離開象群!!!' }
                ];
                DialogueSystem.show(scene, this._formatLines(kingReply), () => {
                    this._youngssWatch(scene);
                    // this._showSecondChoice(scene);

                    
                    const triggerZone = createTriggerZone(scene, { x: 4600, y: 1600, width: 300, height: 300 });
                    //let a03_triggered = false;
                    this._argumentTriggerZone = triggerZone;

                    scene.physics.add.overlap(scene.player, triggerZone, () => {
                        //if (a03_triggered) return;
                        if (this._secondChoiceTriggered) return;
                        //a03_triggered = true;
                        this._secondChoiceTriggered = true;
                        // 播放動畫
                        this._showSecondChoice(scene);
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
            { speaker: 'player', text: '(誰 有理 比較)' },
            { speaker: 'player', text: '(......)' },
        ];
        DialogueSystem.show(scene, this._formatLines(thinking), () => {
            const options = [
                { key: 'king', label: '👑 王有理' },
                { key: 'young', label: '🌱 年輕象有理' }
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
            {speaker:'player', text:'紀律 很 重要。'},
            {speaker:'年輕象', text:'......'},
            {speaker:'年輕象', text:'對不起 我們 違規'},
            {speaker:'年輕象', text:'我們 不聽話'},
            {speaker:'年輕象', text:'我們 離開'},
        ];
        DialogueSystem.show(scene, this._formatLines(youngLines), () => {
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
                onComplete:()=>{
                    count = count+1;
                    if (count===5){
                        //scene.playerController.enable();
                        this._kingApproach2(scene);
                    }
                }
            });
        });
    },
    _kingEnding2(scene) {
        scene.events.emit('authority_herd:young_leave');
        const thanks = [
            {speaker:'王', text:'你 明理'},
            {speaker:'王', text:'這個 給你 禮物'},
        ];
        DialogueSystem.show(scene, this._formatLines(thanks), () => {
            this._giveRainStone(scene, 'king');
            this.sprites.rainStone.setVisible(false);
            //scene.playerController.enable();
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
            },
            onComplete: () => {
                // 到達後，讓祈雨石稍微「浮現」或發光（可選）
                // 這裡我們直接進入對話
                console.log('[authority_herd] 象王已走到主角面前，拿出祈雨石');
                this._kingEnding2(scene);
            }
        });
    },

    // ---- 結局二：支持年輕象 ----
    _youngEnding(scene) {
        const kingApology = [
            {speaker:'player', text:'墨守成規 不好'},
            {speaker:'王', text:'.....'},
            {speaker:'王', text:'對不起 我 固執 了'},
            {speaker:'王', text:'沒有 考慮 小象 我的錯'},
            {speaker:'王', text:'原諒 你們'},
        ];
        DialogueSystem.show(scene, this._formatLines(kingApology), () => {
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
                // 讓祈雨石跟著象王移動（保持相對位置）
                sprites.rainStone.setVisible(true);
                sprites.rainStone.setPosition(king.x + 50*x, king.y + 20);
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
            {speaker:'年輕象', text:'謝謝 你 我們 幫助'},
            {speaker:'年輕象', text:'寶石 給你'},
            {speaker:'年輕象', text:''},
        ];
        DialogueSystem.show(scene, this._formatLines(kingApology), () => {
            this._giveRainStone(scene, 'young');
            this.sprites.rainStone.setVisible(false);
            //scene.playerController.enable();
        });
    },

    // ---- 給予祈雨石 ----
    _giveRainStone(scene, from) {
        scene.events.emit('authority_herd:get_rain_stone', from);
        if (typeof scene.giveRainStone === 'function') {
            scene.giveRainStone(this.key);
        } else {
            scene.sharedState = scene.sharedState || {};
            scene.sharedState.rainStone = true;
        }
        console.log('[authority_herd] 事件完成，獲得祈雨石');
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
        ].filter(s => s && s.active);

        const depthOffset = 2000;
        spritesToSort.forEach(sprite => {
            sprite.setDepth((depthOffset + sprite.y)/1000);
        });
    }
};