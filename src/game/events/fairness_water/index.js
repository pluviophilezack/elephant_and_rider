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
    boundaries: []          // 新增：儲存鎖定區域用的空氣牆
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

        // 1. 池塘與重疊區域
        state.pondSprite = scene.add.sprite(2071, 1035, 'pond_01').setDepth(1);
        state.pondZone = scene.add.zone(2071, 1035, 850, 350);
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
                // 🔒 一踏入事件區域，立刻鎖定玩家離場邊界
                this.lockBoundary(scene);
                this.startFirstDrink(scene);
            }
        });
    },

    // 🔒 建立離場空氣牆（封鎖周圍通路）
    lockBoundary(scene) {
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        // 建立左側與右側封鎖牆 (依據池塘區域範圍圍住)
        const leftWall = scene.add.zone(state.pondZone.x - 700, state.pondZone.y, 50, 1000);
        const rightWall = scene.add.zone(state.pondZone.x + 700, state.pondZone.y, 50, 1000);
        const topWall = scene.add.zone(state.pondZone.x, state.pondZone.y - 500, 1400, 50);

        [leftWall, rightWall, topWall].forEach(wall => {
            scene.physics.add.existing(wall, true); // 建立靜態物理牆
            const collider = scene.physics.add.collider(playerTarget, wall); // 與玩家產生碰撞硬阻擋
            state.boundaries.push({ wall, collider });
        });
    },

    // 🔓 事件完成時解鎖邊界
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

            const player = scene.player;

            if (scene.textures.exists('main_character_moving_01') && scene.textures.exists('main_character_moving_02')) {
                if (!scene.anims.exists('walk')) {
                    scene.anims.create({
                        key: 'walk',
                        frames: [{ key: 'main_character_moving_01' }, { key: 'main_character_moving_02' }],
                        frameRate: 6,
                        repeat: -1
                    });
                }
            }

            player.isAutoMoving = true;
            if (player.body) player.body.enable = false;

            const targetX = 1850;
            const targetY = 1100;

            const moveDistance = Phaser.Math.Distance.Between(player.x, player.y, targetX, targetY);
            const playerMoveDuration = (moveDistance / 150) * 1000;

            player.play('walk', true);

            scene.tweens.add({
                targets: player,
                x: targetX,
                y: targetY,
                duration: Math.max(playerMoveDuration, 800),
                onComplete: () => {
                    player.isAutoMoving = false;
                    player.stop();
                    player.setTexture('main_character_moving_01');
                    if (player.body) player.body.enable = true;

                    if (state.pondSprite && scene.textures.exists('pond_02')) {
                        state.pondSprite.setTexture('pond_02');
                    }

                    // 🎥 羚羊漫步過來
                    state.antelopes.forEach((ant, idx) => {
                        const stopX = player.x + 200 + (idx * 45);
                        const stopY = player.y + (idx * 15 - 10);
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
                                            '我們...',
                                            '累...',
                                            '渴...',
                                            '一起...',
                                            '喝水...？'
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
        };

        spaceKey.on('down', drinkListener);
    },

    spawnChoiceTiles(scene) {
        state.isDeciding = true;

        const selfishX = 1832;
        const selfishY = 954;
        state.tileSelfish = scene.add.rectangle(selfishX, selfishY, 120, 120, 0xff4444, 0.4);
        state.tileSelfish.setStrokeStyle(4, 0xff0000, 0.8).setDepth(100);
        scene.physics.add.existing(state.tileSelfish, true);

        state.textSelf = scene.add.text(selfishX, selfishY - 75, '獨佔 (喝光水)', { 
            fontSize: '18px', color: '#ffaaaa', backgroundColor: '#000000bb', padding: { x: 8, y: 4 } 
        }).setOrigin(0.5).setDepth(101);

        const shareX = state.pondZone.x + 100;
        const shareY = state.pondZone.y + 250;
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

    // 路線 A：分享
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
                
                // 生成祈雨石
                this.giveRainStone(scene, giveX - 150, giveY);

                // 羚羊分散到湖周圍飲水
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

                // 🔓 【事件完成】解鎖離場邊界，恢復自由移動
                this.unlockBoundary(scene);
            });
        });
    },

    // 路線 B：喝光 (連按三次空白鍵)
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

                // 🔓 【事件完成】解鎖離場邊界，恢復自由移動
                this.unlockBoundary(scene);
            }
        };

        spaceKey.on('down', pressHandler);
    },

    giveRainStone(scene, x, y) {
        scene.hasRainStone = true;

        const stone = scene.physics.add.sprite(x, y, 'rain_stone');
        stone.setDepth(20);

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
    }
};
