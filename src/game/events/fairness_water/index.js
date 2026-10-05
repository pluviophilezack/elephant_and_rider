import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

let state = {
    hasTriggered: false,
    antelopes: [],          
    giverAntelope: null,     
    pondSprite: null,        
    pondZone: null,
    pondStoneSprite: null, //  新增：湖上的石頭 Sprite
    tileSelfish: null,
    tileShare: null,
    textSelf: null,
    textShare: null,
    isDeciding: false,
    spaceDrinkCount: 0,
    isPlayerInPondZone: false,
    boundaries: [],
    rainStoneInstance: null,
    hasExtendedWhileHolding: false
};

export default {
    key: 'fairness_water',

    setup(scene) {
        state.hasTriggered = false;
        state.isDeciding = false;
        state.spaceDrinkCount = 0;
        state.isPlayerInPondZone = false;
        state.antelopes = [];
        state.boundaries = [];
        state.rainStoneInstance = null;
        state.hasExtendedWhileHolding = false;

        // 1. 池塘背景 (Depth 1)
        state.pondSprite = scene.add.sprite(1484, 1946, 'pond_01').setDepth(1).setScale(1.7);
        state.pondZone = scene.add.zone(1484, 1946, 1050, 400);
        scene.physics.add.existing(state.pondZone, true);

        // 2. 湖邊石頭外觀 (Depth 2)
        state.pondStoneSprite = scene.add.sprite(1484, 1946, 'pond_stone')
            .setDepth(2)
            .setScale(1.1);

        //  3. 建立擋住湖面中央與右上邊界的碰撞牆 (特意避開左下角缺口 1137, 2111)
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        // 湖心障礙物 (防止直接跨湖)
        const lakeCenterBlock = scene.add.zone(1484, 1900, 450, 200);
        scene.physics.add.existing(lakeCenterBlock, true);
        scene.physics.add.collider(playerTarget, lakeCenterBlock);

        // 右側障礙物 (擋住右半邊)
        const lakeRightBlock = scene.add.zone(1750, 1950, 200, 250);
        scene.physics.add.existing(lakeRightBlock, true);
        scene.physics.add.collider(playerTarget, lakeRightBlock);

        //  4. 遠處羚羊
        const farAwayPositions = [
            { x: 2430, y: 2174 },
            { x: 2492, y: 2131 },
            { x: 2514, y: 2252 }
        ];

        if (scene.textures.exists('antelope_moving_01') && scene.textures.exists('antelope_moving_02')) {
            if (!scene.anims.exists('antelope_walk')) {
                scene.anims.create({
                    key: 'antelope_walk',
                    frames: [{ key: 'antelope_moving_01' }, { key: 'antelope_moving_02' }],
                    frameRate: 4,
                    repeat: -1
                });
            }
        }

        farAwayPositions.forEach((pos, index) => {
            const ant = scene.add.sprite(pos.x, pos.y, 'antelope_stand')
                .setScale(0.15)
                .setAlpha(0.3)
                .setDepth(10);
            
            if (ant.body) ant.body.enable = false;

            state.antelopes.push(ant);
            if (index === 1) state.giverAntelope = ant;
        });
        if (!state.giverAntelope) state.giverAntelope = state.antelopes[0];

        // 觸發事件區域
        scene.physics.add.overlap(playerTarget, state.pondZone, () => {
            state.isPlayerInPondZone = true;
            if (!state.hasTriggered) {
                state.hasTriggered = true;
                this.lockBoundary(scene);
                this.startFirstDrink(scene);
            }
        });
    },
    lockBoundary(scene) {
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        const leftWall = scene.add.zone(state.pondZone.x - 700, state.pondZone.y, 50, 1000);
        const rightWall = scene.add.zone(state.pondZone.x + 700, state.pondZone.y, 50, 1000);
        const topWall = scene.add.zone(state.pondZone.x, state.pondZone.y - 500, 1400, 50);

        [leftWall, rightWall, topWall].forEach(wall => {
            scene.physics.add.existing(wall, true);
            const collider = scene.physics.add.collider(playerTarget, wall);
            state.boundaries.push({ wall, collider });
        });
    },

    unlockBoundary(scene) {
        state.boundaries.forEach(item => {
            if (item.collider) scene.physics.world.removeCollider(item.collider);
            if (item.wall) item.wall.destroy();
        });
        state.boundaries = [];
    },

    startFirstDrink(scene) {
        const hintText = scene.add.text(state.pondZone.x, state.pondZone.y - 50, '按下空白鍵喝一口水', {
            fontSize: '16px', color: '#ffffff', backgroundColor: '#00000088'
        }).setOrigin(0.5).setDepth(100);

        const spaceKey = scene.input.keyboard.addKey('SPACE');
        
        const drinkListener = () => {
            if (!state.isPlayerInPondZone) return;

            spaceKey.off('down', drinkListener);
            hintText.destroy();

            const playerController = scene.playerController || scene.player;
            const playerSprite = playerController.sprite || (playerController.player ? playerController.player : playerController);

            if (scene.textures.exists('main_character_moving_01') && scene.textures.exists('main_character_moving_02')) {
                if (!scene.anims.exists('slow_walk')) {
                    scene.anims.create({
                        key: 'slow_walk',
                        frames: [{ key: 'main_character_moving_01' }, { key: 'main_character_moving_02' }],
                        frameRate: 3,
                        repeat: -1
                    });
                }
            }

            if (playerController) playerController.isAutoMoving = true;
            if (playerSprite.body) playerSprite.body.enable = false;

            // 目的地：左下角缺口 (1137, 2111)
            const standing_point = { x: 1137, y: 2111 };

            // 方向翻轉控制
            const updateFacingDirection = (fromX, toX) => {
                if (toX < fromX - 5) {
                    playerSprite.setFlipX(true);  // 面向左
                } else if (toX > fromX + 5) {
                    playerSprite.setFlipX(false); // 面向右
                }
            };

            // 抵達缺口後的邏輯
            const onReachWater = () => {
                playerSprite.stop();
                playerSprite.setTexture('main_character_moving_01');
                playerSprite.setFlipX(false); // 站在缺口面向右側湖水

                if (playerController) playerController.isAutoMoving = false;
                if (playerSprite.body) playerSprite.body.enable = true;

                if (state.pondSprite && scene.textures.exists('pond_02')) {
                    state.pondSprite.setTexture('pond_02');
                }

                //  羚羊漫步過來 (聚集於缺口右側)
                state.antelopes.forEach((ant, idx) => {
                    const stopX = standing_point.x + 160 + (idx * 40);
                    const stopY = standing_point.y + (idx * 15 - 10);
                    const duration = 2200 + (idx * 200);

                    ant.play('antelope_walk');
                    scene.tweens.add({
                        targets: ant,
                        x: stopX,
                        y: stopY,
                        scale: 0.5,
                        alpha: 1.0,
                        duration: duration,
                        ease: 'Quad.easeOut',
                        onComplete: () => {
                            ant.stop();
                            ant.setTexture('antelope_stand');

                            if (idx === state.antelopes.length - 1) {
                                scene.isDialogueActive = true;
                                scene.time.delayedCall(100, () => {
                                    DialogueSystem.show(scene, [
                                        '我們好久沒看到水了',
                                        '好累...',
                                        '可不可以分我們一點水?'
                                    ], () => {
                                        scene.isDialogueActive = false;
                                        this.spawnChoiceTiles(scene);
                                    });
                                });
                            }
                        }
                    });
                });
            };

            if (scene.anims.exists('slow_walk')) {
                playerSprite.play('slow_walk', true);
            }

            const startX = playerSprite.x;
            const startY = playerSprite.y;

            // 根據觸發位置分支選取最適路線
            if (startX > 1600 &&startY < 1870) {
                // 情境 1：從右側觸發 (先走到右側轉折點 -> 再繞到湖底 -> 缺口)
                updateFacingDirection(startX, 2085);

                const tween1 = scene.tweens.add({
                    targets: playerSprite,
                    x: 2085,
                    y: 1850,
                    duration: 1500,
                    ease: 'Linear',
                    onComplete: () => {
                        updateFacingDirection(2085, 1799);
                    }
                });

                const tween2 = scene.tweens.add({
                    targets: playerSprite,
                    x: 1799,
                    y: 2171,
                    duration: 1500,
                    ease: 'Linear',
                    paused: true, // 先暫停，等 tween1 結束才播放
                    onComplete: () => {
                        updateFacingDirection(1799, 1137);
                        if (scene.anims.exists('slow_walk')) playerSprite.play('slow_walk', true);

                        // 階段三：走往缺口 (1137, 2111)
                        scene.tweens.add({
                            targets: playerSprite,
                            x: 1137,
                            y: 2111,
                            duration: 1500,
                            ease: 'Linear',
                            onComplete: onReachWater
                        });
                    }
                });

                // 鏈式播放
                tween1.on('complete', () => tween2.play());
            } else if (startY >= 1870) {
                // 情境 2：從正下方觸發 (先向左移至 1137, 2280 -> 垂直向上進入缺口)
                updateFacingDirection(startX, 1137);
                scene.tweens.add({
                    targets: playerSprite,
                    x: 1137,
                    y: 2280,
                    duration: 1500,
                    ease: 'Linear',
                    onComplete: () => {
                        updateFacingDirection(1137, 1137);
                        if (scene.anims.exists('slow_walk')) playerSprite.play('slow_walk', true);

                        scene.tweens.add({
                            targets: playerSprite,
                            x: standing_point.x,
                            y: standing_point.y,
                            duration: 1800,
                            ease: 'Linear',
                            onComplete: onReachWater
                        });
                    }
                });
            } else {
                // 情境 3：從左側觸發 (距離缺口近，直接走過去)
                updateFacingDirection(startX, standing_point.x);
                const tween1 = scene.tweens.add({
                    targets: playerSprite,
                    x: 774,
                    y: 1870,
                    duration: 1500,
                    ease: 'Linear',
                    onComplete: () => {
                        updateFacingDirection(774, 1870);
                    }
                });

                const tween2 = scene.tweens.add({
                    targets: playerSprite,
                    x: 980,
                    y: 2228,
                    duration: 1500,
                    ease: 'Linear',
                    paused: true, // 先暫停，等 tween1 結束才播放
                    onComplete: () => {
                        updateFacingDirection(980, 2228);
                        if (scene.anims.exists('slow_walk')) playerSprite.play('slow_walk', true);

                        // 階段三：走往缺口 (1137, 2111)
                        scene.tweens.add({
                            targets: playerSprite,
                            x: 1137,
                            y: 2111,
                            duration: 1500,
                            ease: 'Linear',
                            onComplete: onReachWater
                        });
                    }
                });

                // 鏈式播放
                tween1.on('complete', () => tween2.play());
            }
        };

        spaceKey.on('down', drinkListener);
    },

    spawnChoiceTiles(scene) {
        state.isDeciding = true;

        const selfishX = 1005;
        const selfishY = 2078;
        state.tileSelfish = scene.add.rectangle(selfishX, selfishY, 120, 120, 0xff4444, 0.4);
        state.tileSelfish.setStrokeStyle(4, 0xff0000, 0.8).setDepth(100);
        scene.physics.add.existing(state.tileSelfish, true);

        state.textSelf = scene.add.text(selfishX, selfishY - 75, '獨佔 (喝光水)', { 
            fontSize: '18px', color: '#ffaaaa', backgroundColor: '#000000bb', padding: { x: 8, y: 4 } 
        }).setOrigin(0.5).setDepth(101);

        const shareX = state.pondZone.x + 100;
        const shareY = state.pondZone.y + 350;
        state.tileShare = scene.add.rectangle(shareX, shareY, 120, 120, 0x44ff44, 0.4);
        state.tileShare.setStrokeStyle(4, 0x00ff00, 0.8).setDepth(100);
        scene.physics.add.existing(state.tileShare, true);

        state.textShare = scene.add.text(shareX, shareY - 75, '分享 (一同飲用)', { 
            fontSize: '18px', color: '#aaffaa', backgroundColor: '#000000bb', padding: { x: 8, y: 4 } 
        }).setOrigin(0.5).setDepth(101);

        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        scene.physics.add.overlap(playerTarget, state.tileSelfish, () => {
            if (state.isDeciding) {
                state.isDeciding = false;
                this.cleanupTiles();
                this.handleSelfishChoice(scene);
            }
        });

        scene.physics.add.overlap(playerTarget, state.tileShare, () => {
            if (state.isDeciding) {
                state.isDeciding = false;
                this.cleanupTiles();
                this.handleShareChoice(scene);
            }
        });
    },

    cleanupTiles() {
        if (state.textSelf) { state.textSelf.destroy(); state.textSelf = null; }
        if (state.textShare) { state.textShare.destroy(); state.textShare = null; }
        if (state.tileSelfish) { state.tileSelfish.destroy(); state.tileSelfish = null; }
        if (state.tileShare) { state.tileShare.destroy(); state.tileShare = null; }
    },

    handleShareChoice(scene) {
        scene.isDialogueActive = true;

        scene.time.delayedCall(100, () => {
            DialogueSystem.show(scene, [
                '謝謝...',
                '漂亮石頭...',
                '禮物！'
            ], () => {
                scene.isDialogueActive = false;
                
                // 祈雨石生成於 pond_stone 的位置上方
                const stoneX = state.pondStoneSprite ? state.pondStoneSprite.x - 300: state.pondZone.x;
                const stoneY = state.pondStoneSprite ? state.pondStoneSprite.y + 300 : state.pondZone.y;

                this.giveRainStone(scene, stoneX, stoneY);

                const drinkSpots = [
                    { x: state.pondZone.x + 220, y: state.pondZone.y - 80,  flip: false },
                    { x: state.pondZone.x - 200, y: state.pondZone.y - 100, flip: true  },
                    { x: state.pondZone.x + 300, y: state.pondZone.y + 60,  flip: false }
                ];

                state.antelopes.forEach((ant, idx) => {
                    const spot = drinkSpots[idx % drinkSpots.length];
                    const dist = Phaser.Math.Distance.Between(ant.x, ant.y, spot.x, spot.y);
                    const duration = (dist / 120) * 1000;

                    ant.setFlipX(spot.flip);
                    ant.play('antelope_walk');

                    scene.tweens.add({
                        targets: ant,
                        x: spot.x,
                        y: spot.y,
                        duration: Math.max(duration, 1200),
                        ease: 'Power1',
                        onComplete: () => {
                            ant.stop();
                            ant.setTexture('antelope_stand');
                        }
                    });
                });

                this.unlockBoundary(scene);
            });
        });
    },

    handleSelfishChoice(scene) {
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        const hint = scene.add.text(playerTarget.x, playerTarget.y - 50, '連按 3 次空白鍵喝光水 (0/3)', {
            fontSize: '14px', color: '#ffaaaa', backgroundColor: '#000000aa', padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(102);

        const spaceKey = scene.input.keyboard.addKey('SPACE');
        const pressHandler = () => {
            state.spaceDrinkCount++;
            hint.setText(`連按 3 次空白鍵喝光水 (${state.spaceDrinkCount}/3)`);

            if (state.spaceDrinkCount >= 3) {
                spaceKey.off('down', pressHandler);
                hint.destroy();

                if (state.pondSprite && scene.textures.exists('pond_03')) {
                    state.pondSprite.setTexture('pond_03');
                }

                state.antelopes.forEach((ant) => {
                    ant.setFlipX(true); 
                    ant.play('antelope_walk');
                    scene.tweens.add({
                        targets: ant,
                        x: ant.x + 400,
                        alpha: 0,
                        duration: 1500,
                        onComplete: () => ant.destroy()
                    });
                });

                // 💡 祈雨石生成於 pond_stone 的位置上方
                const stoneX = state.pondStoneSprite ? state.pondStoneSprite.x : state.pondZone.x;
                const stoneY = state.pondStoneSprite ? state.pondStoneSprite.y - 10 : state.pondZone.y;

                this.giveRainStone(scene, stoneX, stoneY);

                this.unlockBoundary(scene);
            }
        };

        spaceKey.on('down', pressHandler);
    },

    // 祈雨石生成邏輯：預設置於 pond_stone 上（Depth 設為 20 確保高於石頭）
    giveRainStone(scene, x, y) {
        const stoneX = x !== undefined ? x : (state.pondStoneSprite ? state.pondStoneSprite.x : 1484);
        const stoneY = y !== undefined ? y : (state.pondStoneSprite ? state.pondStoneSprite.y - 10 : 1900);

        const stone = scene.physics.add.sprite(stoneX, stoneY, 'rain_stone').setScale(0.5);
        stone.setDepth(20);
        state.rainStoneInstance = stone;
        state.hasExtendedWhileHolding = false;

        if (!scene.items) {
            scene.items = [stone];
        } else if (Array.isArray(scene.items)) {
            scene.items.push(stone);
        } else if (scene.items.add) {
            scene.items.add(stone);
        }
    },

    update(scene) {
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;
        if (state.pondZone && playerTarget && playerTarget.body) {
            state.isPlayerInPondZone = scene.physics.overlap(playerTarget, state.pondZone);
        }

        // 魔杖抓取祈雨石並縮回時，呼叫 HUD 
        if (state.rainStoneInstance && scene.wandController) {
            const isHoldingThisStone = (scene.wandController.heldItem === state.rainStoneInstance);
            const currentWandLength = scene.wandController.currentBodyLength || 0;

            if (isHoldingThisStone && currentWandLength > 10) {
                state.hasExtendedWhileHolding = true;
            }

            if (isHoldingThisStone && state.hasExtendedWhileHolding && currentWandLength === 0) {
                scene.wandController.heldItem = null;

                // 銷毀場景上的實體祈雨石
                state.rainStoneInstance.destroy();
                state.rainStoneInstance = null;
                state.hasExtendedWhileHolding = false;

                // 呼叫場景上的 HUD 觸發 addRainStone() 
                if (scene.hud && typeof scene.hud.addRainStone === 'function') {
                    scene.hud.addRainStone(1);
                } else if (typeof scene.giveRainStone === 'function') {
                    scene.giveRainStone();
                } else {
                    scene.hasRainStone = true;
                    if (scene.sharedState) {
                        scene.sharedState.rainStoneCount = (scene.sharedState.rainStoneCount || 0) + 1;
                    }
                }
            }
        }

        // 保持每影格更新 HUD 的動畫狀態
        if (scene.hud && typeof scene.hud.update === 'function') {
            scene.hud.update();
        }
    }
};
