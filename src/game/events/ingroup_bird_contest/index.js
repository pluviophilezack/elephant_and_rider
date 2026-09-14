import * as Phaser from 'phaser';
import { DialogueSystem } from '../../core/DialogueSystem';
import { ChoiceSystem } from '../../core/ChoiceSystem';
import { MoralState } from '../../core/MoralState';
import { createTriggerZone } from '../../core/TriggerZone';
import dialogue from './dialogue.json';

// 每個事件模組要呼叫一次giveRainStone() ，以便在該事件獲得祈雨石。
const BIRD_SCALE = 0.55;
const NOTE_SCALE = 0.72;
const FLOCK_DELIVERY_RADIUS = 105;
const FIRST_GRAB_ESCAPE_DELAY_MS = 1000;
const FIRST_GRAB_ESCAPE_MS = 320;
const ROCK_THROW_COOLDOWN_MS = 1500;
const ROCK_THROW_COUNT = 4;
const ROCK_THROW_STAGGER_MS = 170;
const ROCK_SCALE = 0.28;
const ROCK_FLIGHT_BASE_MS = 1400;
const ESCAPE_DASH_DISTANCE = 600;
const ESCAPE_DASH_MS = 2600;
const CHASE_FLEE_RADIUS = 500;
const CHASE_FAST_SPEED = 215;
const CHASE_TIRED_SPEED = 105;
const CHASE_SPRINT_MS = 14000;

const AREA = {
    flockCenter: { x: 2040, y: 1240 },
    loneStart: { x: 690, y: 850 },
    firstEscapeSpot: { x: 525, y: 900 },
    chaseBounds: new Phaser.Geom.Rectangle(180, 160, 1700, 1160)
};

const LONE_BIRD_BUSH_OFFSETS = [
    { x: 0, y: -62 },
    { x: 62, y: -44 },
    { x: 88, y: 0 },
    { x: 62, y: 44 },
    { x: 0, y: 62 },
    { x: -62, y: 44 },
    { x: -88, y: 0 },
    { x: -62, y: -44 }
];

export default {
    key: 'ingroup_bird_contest',

    setup(scene) {
        this.state = scene.sharedState[this.key] ? 'completed' : 'waiting_flock';
        this.hasAwardedRainStone = scene.sharedState[this.key];
        this.hasShownReleaseReaction = false;
        this.isFlockAngry = false;
        this.hasTriggeredFirstGrab = false;
        this.controlsLocked = false;
        this.wasHoldingLoneBird = false;
        this.nextRockThrowAt = 0;
        this.rockThrowBatch = 0;
        this.captureStartedAt = 0;
        this.flockBirds = [];
        this.musicNotes = [];
        this.angerMarks = [];
        this.loneBirdBushes = [];

        if (!scene.items) {
            scene.items = [];
        }

        this._createFlock(scene);
        this._createLoneBird(scene);

        this.flockTrigger = createTriggerZone(scene, {
            x: AREA.flockCenter.x,
            y: AREA.flockCenter.y,
            width: 300,
            height: 220
        });

        scene.physics.add.overlap(scene.player, this.flockTrigger, () => {
            this._handleFlockOverlap(scene);
        });
    },

    update(scene) {
        if (this.controlsLocked) {
            this._freezeControls(scene);
        }

        this._syncWandGrabFallback(scene);
        this._updateLoneBirdGrabState(scene);
        this._updateCapture(scene);
        this._updateDepths(scene);
    },

    _createFlock(scene) {
        const offsets = [
            { x: -78, y: 28 },
            { x: -26, y: -6 },
            { x: 28, y: -6 },
            { x: 80, y: 28 }
        ];

        offsets.forEach((offset, index) => {
            const bird = scene.add.sprite(
                AREA.flockCenter.x + offset.x,
                AREA.flockCenter.y + offset.y,
                `bird_member_0${index + 1}`
            )
                .setScale(BIRD_SCALE)
                .setDepth(20);

            scene.registerAsset(bird, `ingroup_flock_bird_${index + 1}`);
            this.flockBirds.push(bird);

            scene.tweens.add({
                targets: bird,
                angle: index % 2 === 0 ? 5 : -5,
                y: bird.y - 7,
                duration: 680 + index * 90,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        });

        for (let i = 0; i < 5; i += 1) {
            const note = scene.add.image(
                AREA.flockCenter.x - 112 + i * 54,
                AREA.flockCenter.y - 106 - (i % 2) * 22,
                'music_note'
            )
                .setScale(NOTE_SCALE)
                .setAlpha(0.78)
                .setDepth(21);

            scene.registerAsset(note, `ingroup_music_note_${i + 1}`);
            this.musicNotes.push(note);

            scene.tweens.add({
                targets: note,
                y: note.y - 34,
                alpha: 0.15,
                duration: 1200 + i * 170,
                delay: i * 160,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        }
    },

    _createLoneBird(scene) {
        this.loneBirdBushes = LONE_BIRD_BUSH_OFFSETS.map((offset, index) => {
            const bush = scene.physics.add.sprite(
                AREA.loneStart.x + offset.x,
                AREA.loneStart.y + offset.y,
                'bush_02'
            )
                .setDepth(offset.y > 0 ? 29 : (offset.y < 0 ? 25 : 27));

            bush.body.setImmovable(true);
            scene.registerAsset(bush, `ingroup_lone_bird_bush_${index + 1}`);
            return bush;
        });
        scene.physics.add.collider(scene.player, this.loneBirdBushes);

        this.loneBird = scene.add.sprite(AREA.loneStart.x, AREA.loneStart.y, 'bird_member_05')
            .setScale(BIRD_SCALE)
            .setDepth(27);
        scene.registerAsset(this.loneBird, 'ingroup_lone_bird');

        scene.tweens.add({
            targets: this.loneBird,
            y: AREA.loneStart.y - 16,
            duration: 520,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    },

    _handleFlockOverlap(scene) {
        if (this.state === 'waiting_flock') {
            this.state = 'flock_dialogue';
            this._showDialogue(scene, dialogue.flock_request_lines, () => {
                this.state = 'finding_lone';
                this._addToItems(scene, this.loneBird);
            });
            return;
        }

        if (this.state === 'released' || this.state === 'released_rocking') {
            this.state = 'released_rocking';
            this._setFlockAngry(scene);
            this._throwRocksAtPlayer(scene);

            if (!this.hasShownReleaseReaction) {
                this.hasShownReleaseReaction = true;
                this._showDialogue(scene, dialogue.flock_throws_rocks_lines);
            }
        }
    },

    _syncWandGrabFallback(scene) {
        if (!['finding_lone', 'capture_chase'].includes(this.state)) return;
        if (!scene.wandController || scene.wandController.heldItem || !this.loneBird?.active) return;
        if (!scene.wandController.cursors?.space?.isDown) return;

        const distanceToTip = Phaser.Math.Distance.Between(
            scene.wandController.tipX,
            scene.wandController.tipY,
            this.loneBird.x,
            this.loneBird.y
        );

        if (distanceToTip > 54) return;

        scene.tweens.killTweensOf(this.loneBird);
        scene.wandController.heldItem = this.loneBird;
        if (this.loneBird.body) {
            this.loneBird.body.enable = false;
        }
    },

    _updateLoneBirdGrabState(scene) {
        const isHoldingLoneBird = scene.wandController?.heldItem === this.loneBird;

        if (isHoldingLoneBird && !this.wasHoldingLoneBird) {
            this._resetMovementInput(scene);

            if (this.state === 'finding_lone' && !this.hasTriggeredFirstGrab) {
                this.hasTriggeredFirstGrab = true;
                this.state = 'first_grab_hold';
                this._removeFromItems(scene, this.loneBird);
                scene.time.delayedCall(FIRST_GRAB_ESCAPE_DELAY_MS, () => {
                    this._escapeFirstGrab(scene);
                });
            }
        }

        this.wasHoldingLoneBird = isHoldingLoneBird;
    },

    _escapeFirstGrab(scene) {
        if (scene.wandController?.heldItem === this.loneBird) {
            scene.wandController.releaseItem();
        }

        this.wasHoldingLoneBird = false;
        this._resetMovementInput(scene);
        scene.tweens.killTweensOf(this.loneBird);
        this.state = 'first_grab_escape';

        scene.tweens.add({
            targets: this.loneBird,
            x: AREA.firstEscapeSpot.x,
            y: AREA.firstEscapeSpot.y,
            angle: Phaser.Math.Between(-10, 10),
            duration: FIRST_GRAB_ESCAPE_MS,
            ease: 'Back.easeOut',
            onComplete: () => {
                this.state = 'lone_dialogue';
                this._showDialogue(scene, dialogue.lone_bird_lines, () => {
                    this._promptChoice(scene);
                });
            }
        });
    },

    _promptChoice(scene) {
        this.state = 'choosing';
        this._setControlsLocked(scene, true);
        ChoiceSystem.prompt(scene, dialogue.choice_options, (choiceKey) => {
            scene.time.delayedCall(0, () => {
                if (choiceKey === 'release') {
                    this._releaseLoneBird(scene);
                } else {
                    this._startCapture(scene);
                }
            });
        });
    },

    _releaseLoneBird(scene) {
        this.state = 'released';
        MoralState.add('ingroup', -1);
        scene.tweens.killTweensOf(this.loneBird);
        this._awardRainStone(scene, this.loneBird.x, this.loneBird.y);

        this._showDialogue(scene, dialogue.release_result_lines);

        scene.tweens.add({
            targets: this.loneBird,
            x: this.loneBird.x - 430,
            y: this.loneBird.y - 360,
            alpha: 0,
            angle: -18,
            duration: 1900,
            ease: 'Sine.easeInOut',
            onComplete: () => this.loneBird.destroy()
        });
    },

    _startCapture(scene) {
        this.state = 'capture_intro';
        MoralState.add('ingroup', 1);
        scene.tweens.killTweensOf(this.loneBird);
        this.loneBird.setTexture('bird_member_05').setAlpha(1);

        this._showDialogue(scene, dialogue.capture_start_lines, () => {
            this._startEscapeDash(scene);
        });
    },

    _startEscapeDash(scene) {
        this.state = 'capture_escape';
        const player = scene.playerController.getPosition();
        const angleAway = Phaser.Math.Angle.Between(
            player.x,
            player.y,
            this.loneBird.x,
            this.loneBird.y
        );
        const targetX = Phaser.Math.Clamp(
            this.loneBird.x + Math.cos(angleAway) * ESCAPE_DASH_DISTANCE,
            AREA.chaseBounds.left,
            AREA.chaseBounds.right
        );
        const targetY = Phaser.Math.Clamp(
            this.loneBird.y + Math.sin(angleAway) * ESCAPE_DASH_DISTANCE,
            AREA.chaseBounds.top,
            AREA.chaseBounds.bottom
        );

        scene.tweens.add({
            targets: this.loneBird,
            x: targetX,
            y: targetY,
            angle: Phaser.Math.Between(-12, 12),
            duration: ESCAPE_DASH_MS,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                this.captureStartedAt = scene.time.now;
                this._addToItems(scene, this.loneBird);
                this.state = 'capture_chase';
            }
        });
    },

    _updateCapture(scene) {
        if (this.state === 'capture_chase') {
            if (scene.wandController?.heldItem === this.loneBird) {
                this.state = 'capture_return';
                return;
            }

            const player = scene.playerController.getPosition();
            const distance = Phaser.Math.Distance.Between(player.x, player.y, this.loneBird.x, this.loneBird.y);
            const delta = scene.game.loop.delta / 1000;

            if (distance < CHASE_FLEE_RADIUS) {
                const angleAway = Phaser.Math.Angle.Between(player.x, player.y, this.loneBird.x, this.loneBird.y);
                const wobble = Math.sin(scene.time.now / 165) * 0.62;
                const sprintProgress = Phaser.Math.Clamp(
                    (scene.time.now - this.captureStartedAt) / CHASE_SPRINT_MS,
                    0,
                    1
                );
                const speed = Phaser.Math.Linear(CHASE_FAST_SPEED, CHASE_TIRED_SPEED, sprintProgress);
                this.loneBird.x += Math.cos(angleAway + wobble) * speed * delta;
                this.loneBird.y += Math.sin(angleAway + wobble) * speed * delta;
            } else {
                this.loneBird.x += Math.sin(scene.time.now / 300) * 42 * delta;
                this.loneBird.y += Math.cos(scene.time.now / 340) * 34 * delta;
            }

            this._clampLoneBirdToChaseArea();
            return;
        }

        if (this.state !== 'capture_return') return;

        if (scene.wandController?.heldItem !== this.loneBird) {
            this.state = 'capture_chase';
            return;
        }

        const distanceToFlock = Phaser.Math.Distance.Between(
            this.loneBird.x,
            this.loneBird.y,
            AREA.flockCenter.x,
            AREA.flockCenter.y
        );

        if (distanceToFlock <= FLOCK_DELIVERY_RADIUS) {
            scene.wandController.releaseItem();
            this._completeCapture(scene);
        }
    },

    _completeCapture(scene) {
        this.state = 'completed';
        scene.tweens.killTweensOf(this.loneBird);
        this._removeFromItems(scene, this.loneBird);
        this.loneBird.setPosition(AREA.flockCenter.x, AREA.flockCenter.y + 58);
        this.loneBird.setAlpha(1);
        this.loneBird.setDepth(20);
        this.flockBirds.push(this.loneBird);

        scene.tweens.add({
            targets: this.flockBirds,
            y: '+=10',
            duration: 260,
            yoyo: true,
            repeat: 5
        });

        this._awardRainStone(scene, AREA.flockCenter.x, AREA.flockCenter.y - 40);
        this._showDialogue(scene, dialogue.capture_success_lines);
    },

    _awardRainStone(scene, x, y) {
        if (this.hasAwardedRainStone) return;
        this.hasAwardedRainStone = true;

        const stone = scene.add.image(x, y - 44, 'rain_stone')
            .setScale(0.28)
            .setDepth(40);
        scene.registerAsset(stone, 'ingroup_reward_rain_stone');

        scene.tweens.add({
            targets: stone,
            y: stone.y - 36,
            alpha: 0,
            duration: 900,
            ease: 'Sine.easeInOut',
            onComplete: () => stone.destroy()
        });

        scene.giveRainStone(this.key);
    },

    _throwRocksAtPlayer(scene) {
        if (scene.time.now < this.nextRockThrowAt) return;

        this.nextRockThrowAt = scene.time.now + ROCK_THROW_COOLDOWN_MS;
        this.rockThrowBatch += 1;

        for (let i = 0; i < ROCK_THROW_COUNT; i += 1) {
            scene.time.delayedCall(i * ROCK_THROW_STAGGER_MS, () => {
                const bird = this.flockBirds[i % this.flockBirds.length];
                if (bird?.active) {
                    this._launchRock(scene, bird, i);
                }
            });
        }
    },

    _launchRock(scene, bird, index) {
        const player = scene.playerController.getPosition();
        const startX = bird.x;
        const startY = bird.y - 12;
        const targetX = player.x + Phaser.Math.Between(-55, 55);
        const targetY = player.y + Phaser.Math.Between(-30, 35);
        const controlX = (startX + targetX) / 2 + Phaser.Math.Between(-70, 70);
        const controlY = Math.min(startY, targetY) - Phaser.Math.Between(180, 250);
        const spinDirection = index % 2 === 0 ? 1 : -1;
        const rock = scene.add.image(startX, startY, 'rock_rolling')
            .setScale(ROCK_SCALE * 0.9)
            .setDepth(32)
            .setAlpha(0.96);

        scene.registerAsset(rock, `ingroup_thrown_rock_${this.rockThrowBatch}_${index + 1}`);

        scene.tweens.addCounter({
            from: 0,
            to: 1,
            duration: ROCK_FLIGHT_BASE_MS + index * 70,
            ease: 'Sine.easeInOut',
            onUpdate: (tween) => {
                const progress = tween.getValue();
                rock.x = Phaser.Math.Interpolation.QuadraticBezier(
                    progress,
                    startX,
                    controlX,
                    targetX
                );
                rock.y = Phaser.Math.Interpolation.QuadraticBezier(
                    progress,
                    startY,
                    controlY,
                    targetY
                );
                rock.setAngle(progress * 420 * spinDirection);
                rock.setScale(ROCK_SCALE * (0.9 + Math.sin(Math.PI * progress) * 0.22));
                rock.setAlpha(progress < 0.82 ? 0.96 : 0.96 * (1 - progress) / 0.18);
            },
            onComplete: () => rock.destroy()
        });
    },

    _setFlockAngry(scene) {
        if (this.isFlockAngry) return;
        this.isFlockAngry = true;

        this.flockBirds.forEach((bird, index) => {
            const angryTexture = `bird_member_angry_0${index + 1}`;
            if (scene.textures.exists(angryTexture)) {
                bird.setTexture(angryTexture);
            }
        });

        this.musicNotes.forEach((note, index) => {
            scene.tweens.killTweensOf(note);
            note
                .setTint(index % 2 === 0 ? 0xef3e2f : 0xff8a24)
                .setAlpha(0.95)
                .setAngle(index % 2 === 0 ? -28 : 32);

            scene.tweens.add({
                targets: note,
                x: note.x + (index % 2 === 0 ? -18 : 18),
                y: note.y + Phaser.Math.Between(-18, 20),
                angle: note.angle + (index % 2 === 0 ? 58 : -64),
                scale: NOTE_SCALE * 1.18,
                duration: 120 + index * 18,
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1
            });
        });

        scene.tweens.add({
            targets: this.flockBirds,
            x: '+=7',
            duration: 85,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            stagger: 28
        });

        [-55, 58].forEach((offsetX, index) => {
            const mark = scene.add.graphics()
                .setPosition(AREA.flockCenter.x + offsetX, AREA.flockCenter.y - 145)
                .setDepth(34);

            mark.lineStyle(6, 0xe6372b, 1);
            mark.beginPath();
            mark.moveTo(-22, -4);
            mark.lineTo(-9, -4);
            mark.lineTo(-9, -18);
            mark.moveTo(22, -4);
            mark.lineTo(9, -4);
            mark.lineTo(9, -18);
            mark.moveTo(-22, 4);
            mark.lineTo(-9, 4);
            mark.lineTo(-9, 18);
            mark.moveTo(22, 4);
            mark.lineTo(9, 4);
            mark.lineTo(9, 18);
            mark.strokePath();
            mark.setScale(0.78).setAlpha(0.82);

            this.angerMarks.push(mark);
            scene.tweens.add({
                targets: mark,
                scale: 1.08,
                alpha: 1,
                angle: index === 0 ? -7 : 7,
                duration: 170,
                ease: 'Back.easeOut',
                yoyo: true,
                repeat: -1
            });
        });
    },

    _updateDepths(scene) {
        const sprites = [...this.flockBirds];
        if (this.loneBird?.active && !sprites.includes(this.loneBird)) {
            sprites.push(this.loneBird);
        }

        sprites.forEach((sprite) => {
            sprite.setDepth(18 + Math.round(sprite.y / 100));
        });

        scene.player?.setDepth(18 + Math.round(scene.player.y / 100));
    },

    _clampLoneBirdToChaseArea() {
        this.loneBird.x = Phaser.Math.Clamp(this.loneBird.x, AREA.chaseBounds.left, AREA.chaseBounds.right);
        this.loneBird.y = Phaser.Math.Clamp(this.loneBird.y, AREA.chaseBounds.top, AREA.chaseBounds.bottom);
    },

    _removeFromItems(scene, sprite) {
        if (!scene.items) return;

        if (scene.items.getChildren) {
            scene.items.remove(sprite, false, false);
            return;
        }

        const index = scene.items.indexOf(sprite);
        if (index >= 0) {
            scene.items.splice(index, 1);
        }
    },

    _addToItems(scene, sprite) {
        if (!scene.items) {
            scene.items = [];
        }

        if (scene.items.getChildren) {
            if (!scene.items.contains(sprite)) {
                scene.items.add(sprite);
            }
            return;
        }

        if (!scene.items.includes(sprite)) {
            scene.items.push(sprite);
        }
    },

    _setControlsLocked(scene, locked) {
        if (this.controlsLocked === locked) return;

        this.controlsLocked = locked;
        if (locked) {
            this.previousAutoMoving = Boolean(scene.playerController?.isAutoMoving);
            this.wandTipWasVisible = scene.wandController?.wandTip?.visible ?? true;
            this._resetMovementInput(scene);
            this._freezeControls(scene);
            return;
        }

        if (scene.playerController) {
            scene.playerController.isAutoMoving = this.previousAutoMoving;
        }
        this._resetMovementInput(scene);
        scene.wandController?.wandTip?.setVisible(this.wandTipWasVisible);
    },

    _resetMovementInput(scene) {
        const playerController = scene.playerController;
        playerController?.sprite?.setVelocity(0, 0);

        const movementKeys = new Set([
            playerController?.cursors?.left,
            playerController?.cursors?.right,
            playerController?.cursors?.up,
            playerController?.cursors?.down,
            playerController?.wasd?.left,
            playerController?.wasd?.right,
            playerController?.wasd?.up,
            playerController?.wasd?.down
        ]);

        movementKeys.forEach((key) => key?.reset());
    },

    _freezeControls(scene) {
        const playerController = scene.playerController;
        if (playerController) {
            playerController.isAutoMoving = true;
            playerController.sprite.body?.setVelocity(0, 0);
            playerController.sprite.stop();
            playerController.sprite.setTexture('main_character_stand_still');
        }

        scene.wandController?.wandBody?.setVisible(false);
        scene.wandController?.wandTip?.setVisible(false);
    },

    _showDialogue(scene, moves, onComplete) {
        const lines = moves.map((move) => {
            if (typeof move === 'string') return move;
            return move.text;
        });

        this._setControlsLocked(scene, true);
        DialogueSystem.show(scene, lines, () => {
            this._setControlsLocked(scene, false);
            if (onComplete) onComplete();
        });
    }
};
