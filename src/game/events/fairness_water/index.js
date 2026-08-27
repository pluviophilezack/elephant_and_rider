import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

// 每個事件模組要呼叫一次giveRainStone()，以便在該事件獲得祈雨石。

let state = {
    hasTriggered: false,
    antelope: null,
    pondZone: null,
    tileSelfish: null,
    tileShare: null,
    textSelf: null,
    textShare: null,
    isDeciding: false,
    spaceDrinkCount: 0
};

export default {
    key: 'fairness_water',

    setup(scene) {
        // 1. 重設區域變數狀態
        state.hasTriggered = false;
        state.isDeciding = false;
        state.spaceDrinkCount = 0;

        // 2. 使用 Phaser 原生 Zone 建立池塘 Trigger 區域
        state.pondZone = scene.add.zone(2071, 1035, 850, 350);
        scene.physics.add.existing(state.pondZone, true);

        // 3. 建立羚羊 Sprite
        state.antelope = scene.add.sprite(2255, 1308, 'antelope_stand').setScale(0.5);

        // 4. 動畫設定：羚羊移動
        if (scene.textures.exists('antelope_moving_01') && scene.textures.exists('antelope_moving_02')) {
            if (!scene.anims.exists('antelope_walk')) {
                scene.anims.create({
                    key: 'antelope_walk',
                    frames: [
                        { key: 'antelope_moving_01' },
                        { key: 'antelope_moving_02' }
                    ],
                    frameRate: 4,
                    repeat: -1
                });
            }
        }

        // 5. 抓取正確的玩家物理實體
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        // 6. 註冊玩家觸發池塘重疊
        scene.physics.add.overlap(playerTarget, state.pondZone, () => {
            if (!state.hasTriggered) {
                state.hasTriggered = true;
                this.startFirstDrink(scene);
            }
        });
    },

    // 階段一：靠近喝一口水與觸發對話
    startFirstDrink(scene) {
    const hintText = scene.add.text(state.pondZone.x, state.pondZone.y - 50, '按下空白鍵喝一口水', {
        fontSize: '16px', color: '#ffffff', backgroundColor: '#00000088'
    }).setOrigin(0.5);

    const spaceKey = scene.input.keyboard.addKey('SPACE');
    const drinkListener = () => {
        spaceKey.removeListener('down', drinkListener);
        hintText.destroy();

        // 1. 既然 scene.player 本身就是 Sprite，直接指定給 player
        const player = scene.player;

        // 2. 確保 walk 動畫存在（如果還沒建過，在此處現場建立以防萬一）
        if (scene.textures.exists('main_character_moving_01') && scene.textures.exists('main_character_moving_02')) {
            if (!scene.anims.exists('walk')) {
                scene.anims.create({
                    key: 'walk',
                    frames: [
                        { key: 'main_character_moving_01' },
                        { key: 'main_character_moving_02' }
                    ],
                    frameRate: 6,
                    repeat: -1
                });
            }
        }

        // 3. 鎖定自動移動並暫停物理體
        player.isAutoMoving = true;
        if (player.body) player.body.enable = false;

        const moveDistance = Phaser.Math.Distance.Between(player.x, player.y, 1993, 1179);
        const playerMoveDuration = (moveDistance / 150) * 1000;

        // 4. 強制播放走路動畫
        player.play('walk', true);

        // 5. 執行 Tween 移動
        scene.tweens.add({
            targets: player,
            x: 1993,
            y: 1179,
            duration: Math.max(playerMoveDuration, 800),
            onComplete: () => {
                // 移動完成：停止動畫、恢復預設靜止幀、重啟物理
                player.isAutoMoving = false;
                player.stop();
                player.setTexture('main_character_moving_01'); // 確保有圖可顯示
                if (player.body) player.body.enable = true;

                // 6. 羚羊登場走過來
                const stopX = player.x + 150;
                const antelopeDistance = Math.abs(stopX - state.antelope.x);
                const antelopeDuration = (antelopeDistance / 150) * 1000;

                state.antelope.play('antelope_walk');
                scene.tweens.add({
                    targets: state.antelope,
                    x: stopX,
                    y: player.y,
                    duration: Math.max(antelopeDuration, 1000),
                    onComplete: () => {
                        state.antelope.stop();
                        state.antelope.setTexture('antelope_stand');

                        DialogueSystem.show(scene, [
                            '我們...',
                            '累...',
                            '渴...',
                            '一起...',
                            '喝水...？'
                        ], () => {
                            this.spawnChoiceTiles(scene);
                        });
                    }
                });
            }
        });
    };
    spaceKey.on('down', drinkListener);
},

    // 階段二：生成踩踏地塊
    spawnChoiceTiles(scene) {
        state.isDeciding = true;

        // 1. 獨佔地塊與文字 (池塘左側陸地)
        state.tileSelfish = scene.add.rectangle(state.pondZone.x - 350, state.pondZone.y + 250, 120, 120, 0xff4444, 0.4);
        state.tileSelfish.setStrokeStyle(4, 0xff0000, 0.8).setDepth(100);
        scene.physics.add.existing(state.tileSelfish, true);

        state.textSelf = scene.add.text(state.tileSelfish.x, state.tileSelfish.y - 75, '獨佔 (喝光水)', { 
            fontSize: '18px', color: '#ffaaaa', backgroundColor: '#000000bb', padding: { x: 8, y: 4 } 
        }).setOrigin(0.5).setDepth(101);

        // 2. 分享地塊與文字 (池塘右側陸地)
        state.tileShare = scene.add.rectangle(state.pondZone.x + 350, state.pondZone.y + 250, 120, 120, 0x44ff44, 0.4);
        state.tileShare.setStrokeStyle(4, 0x00ff00, 0.8).setDepth(100);
        scene.physics.add.existing(state.tileShare, true);

        state.textShare = scene.add.text(state.tileShare.x, state.tileShare.y - 75, '分享 (一同飲用)', { 
            fontSize: '18px', color: '#aaffaa', backgroundColor: '#000000bb', padding: { x: 8, y: 4 } 
        }).setOrigin(0.5).setDepth(101);

        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        // 碰撞檢測
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

    // 清理地塊與對應提示文字
    cleanupTiles() {
        if (state.textSelf) { state.textSelf.destroy(); state.textSelf = null; }
        if (state.textShare) { state.textShare.destroy(); state.textShare = null; }
        if (state.tileSelfish) { state.tileSelfish.destroy(); state.tileSelfish = null; }
        if (state.tileShare) { state.tileShare.destroy(); state.tileShare = null; }
    },

    // 路線 A：分享
    handleShareChoice(scene) {
        const playerTarget = scene.player.sprite || scene.player.player || scene.player;

        DialogueSystem.show(scene, [
            '謝謝...',
            '漂亮石頭...',
            '禮物！'
        ], () => {
            this.giveRainStone(scene, 2034, 1191);
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
                spaceKey.removeListener('down', pressHandler);
                hint.destroy();

                state.antelope.play('antelope_walk');
                scene.tweens.add({
                    targets: state.antelope,
                    x: state.antelope.x + 300,
                    alpha: 0,
                    duration: 2000,
                    onComplete: () => state.antelope.destroy()
                });

                this.giveRainStone(scene, state.pondZone.x, state.pondZone.y);
            }
        };

        spaceKey.on('down', pressHandler);
    },

    // 生成祈雨石
    giveRainStone(scene, x, y) {
        const stone = scene.physics.add.sprite(x, y, 'rain_stone');
        if (scene.items) {
            if (scene.items.add) {
                scene.items.add(stone);
            } else if (Array.isArray(scene.items)) {
                scene.items.push(stone);
            }
        }
    },

    update(scene) {
        // 若有需要持續更新的邏輯可寫在此處
    }
};
