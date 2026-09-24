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
    tileSelfish: null,
    tileShare: null,
    textSelf: null,
    textShare: null,
    isDeciding: false,
    spaceDrinkCount: 0,
    isPlayerInPondZone: false,
    boundaries: [],
    rainStoneInstance: null,
    hasExtendedWhileHolding: false // 新增：紀錄抓取後是否有伸長過魔杖
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

        // 1. 池塘與重疊區域 (池塘中心點在 1484, 1946)
        state.pondSprite = scene.add.sprite(1484, 1946, 'pond_01').setDepth(1).setScale(1.7);
        state.pondZone = scene.add.zone(1484, 1946, 1000, 350);
        scene.physics.add.existing(state.pondZone, true);

        // 🎥 2. 營造遠處感受
        const farAwayPositions = [
            { x: 2750, y: 850 },
            { x: 2820, y: 830 },
            { x: 2710, y: 880 }
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

        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

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

            // 1. 正確取得大象/主角的 Sprite 實例
            const playerController = scene.playerController || scene.player;
            const playerSprite = playerController.sprite || (playerController.player ? playerController.player : playerController);

            // 2. 建立步履沉穩的大象走路動畫 (frameRate 設為 2~3 讓動作放慢)
            if (scene.textures.exists('main_character_moving_01') && scene.textures.exists('main_character_moving_02')) {
                if (!scene.anims.exists('slow_walk')) {
                    scene.anims.create({
                        key: 'slow_walk',
                        frames: [{ key: 'main_character_moving_01' }, { key: 'main_character_moving_02' }],
                        frameRate: 3, // 💡 調慢播放速度（數值越小越慢，例如 2 或 3）
                        repeat: -1
                    });
                }
            }

            // 鎖定操作與物理碰撞
            if (playerController) playerController.isAutoMoving = true;
            if (playerSprite.body) playerSprite.body.enable = false;

           //轉彎點
            const wayPointX = 2055;
            const wayPointY = 1893;
            const targetX = 1470;
            const targetY = 2160;

            // 轉向自動判斷
            const updateFacingDirection = (fromX, toX) => {
                if (toX < fromX - 5) {
                    playerSprite.setFlipX(true);  // 面向左
                } else if (toX > fromX + 5) {
                    playerSprite.setFlipX(false); // 面向右
                }
            };

            // 🐘 開始播放放慢後的走路動畫
            if (scene.anims.exists('slow_walk')) {
                playerSprite.play('slow_walk', true);
            }
            updateFacingDirection(playerSprite.x, wayPointX);

            // 階段一：走到指定的轉灣點 (2387, 2290)，拉長時間讓移動更平緩
            scene.tweens.add({
                targets: playerSprite,
                x: wayPointX,
                y: wayPointY,
                duration: 2000, // 💡 時間拉長至 2 秒，配合慢速動畫
                ease: 'Linear',
                onComplete: () => {
                    // 轉向下一個目的地並持續播放動畫
                    updateFacingDirection(wayPointX, targetX);
                    if (scene.anims.exists('slow_walk')) {
                        playerSprite.play('slow_walk', true);
                    }

                    // 階段二：從轉灣點走到飲水終點
                    scene.tweens.add({
                        targets: playerSprite,
                        x: targetX,
                        y: targetY,
                        duration: 2500, // 💡 時間拉長至 2.5 秒
                        ease: 'Linear',
                        onComplete: () => {
                            // 🐘 抵達終點：停止動畫，恢復預設站姿
                            playerSprite.stop();
                            playerSprite.setTexture('main_character_moving_01');
                            playerSprite.setFlipX(false);

                            if (playerController) playerController.isAutoMoving = false;
                            if (playerSprite.body) playerSprite.body.enable = true;

                            // 切換為喝水後池塘水紋 Texture
                            if (state.pondSprite && scene.textures.exists('pond_02')) {
                                state.pondSprite.setTexture('pond_02');
                            }

                            // 🎥 羚羊漫步過來
                            state.antelopes.forEach((ant, idx) => {
                                const stopX = playerSprite.x + 200 + (idx * 45);
                                const stopY = playerSprite.y + (idx * 15 - 10);
                                const duration = 2500 + (idx * 200);

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
                        }
                    });
                }
            });
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
                const playerTarget = scene.player.sprite || scene.player.player || scene.player;
                const giveX = state.giverAntelope ? state.giverAntelope.x - 20 : playerTarget.x + 60;
                const giveY = state.giverAntelope ? state.giverAntelope.y + 20 : playerTarget.y;
                
                this.giveRainStone(scene, giveX - 150, giveY);

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

                this.giveRainStone(scene, state.pondZone.x, state.pondZone.y);

                this.unlockBoundary(scene);
            }
        };

        spaceKey.on('down', pressHandler);
    },

    giveRainStone(scene, x, y) {
        const stone = scene.physics.add.sprite(x, y, 'rain_stone').setScale(0.5);
        stone.setDepth(20);
        state.rainStoneInstance = stone;
        state.hasExtendedWhileHolding = false; // 初始清空狀態

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

        // 💡 2. 只有經歷過「伸長魔杖抓取 → 縮回魔杖」才算拾取成功
        if (state.rainStoneInstance && scene.wandController) {
            const isHoldingThisStone = (scene.wandController.heldItem === state.rainStoneInstance);
            const currentWandLength = scene.wandController.currentBodyLength || 0;

            // 條件 A：正在抓著石頭且魔杖有伸長（> 10px）
            if (isHoldingThisStone && currentWandLength > 10) {
                state.hasExtendedWhileHolding = true;
            }

            // 條件 B：抓著石頭、曾經伸長過、且目前魔杖已完全縮回（=== 0）
            if (isHoldingThisStone && state.hasExtendedWhileHolding && currentWandLength === 0) {
                // 清空手持
                scene.wandController.heldItem = null;

                // 呼叫全域給予祈雨石 (計數 +1)
                if (typeof scene.giveRainStone === 'function') {
                    scene.giveRainStone();
                } else {
                    scene.hasRainStone = true;
                    if (scene.sharedState) {
                        scene.sharedState.rainStoneCount = (scene.sharedState.rainStoneCount || 0) + 1;
                    }
                }

                // 銷毀石頭，完全收集
                state.rainStoneInstance.destroy();
                state.rainStoneInstance = null;
                state.hasExtendedWhileHolding = false;
            }
        }
    }
};
