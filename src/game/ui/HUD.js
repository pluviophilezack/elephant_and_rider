import { THEME_FONT } from '../core/theme';
// UI元件：畫面上方的抬頭顯示，目前顯示玩家已蒐集的祈雨石數量（目標六顆）
const CAMERA_ZOOM_IN_MS = 1200;
const DANCE_END_AT_MS = 4200;
const CAMERA_ZOOM_OUT_MS = 800;
const CAMERA_RESTORED_AT_MS = DANCE_END_AT_MS + CAMERA_ZOOM_OUT_MS;
const STONE_FLIGHT_MS = 900;
const HUD_FLASH_MS = 1000;
const RAIN_STONE_SEQUENCE_MS = CAMERA_RESTORED_AT_MS + STONE_FLIGHT_MS + HUD_FLASH_MS;
const CELEBRATION_ZOOM = 1.55;
const FLYING_STONE_START_SCALE = 1.0;
const FLYING_STONE_END_SCALE = 0.3;

export class HUD {

    constructor(scene, { maxRainStones = 6 } = {}) {
        this.scene = scene;
        this.maxRainStones = maxRainStones;
        this.rainStoneCount = 0;
        this.feedbackDurationMs = RAIN_STONE_SEQUENCE_MS;
        this.feedbackEndsAt = 0;
        this.stoneTextureStartsAt = 0;
        this.stoneTextureEndsAt = 0;
        this.glowTween = null;
        this.danceTween = null;
        this.flipTimer = null;
        this.revealTimer = null;
        this.danceEndTimer = null;
        this.stoneFlightStartTimer = null;
        this.flashEndTimer = null;
        this.flyingStoneTween = null;
        this.flyingStone = null;

        this.container = scene.add.container(20, 20)
            .setScrollFactor(0)
            .setDepth(1000);

        this.background = scene.add.rectangle(0, 0, 176, 46, 0x1f2933, 0.78)
            .setOrigin(0)
            .setStrokeStyle(2, 0xffffff, 0.35);

        this.glowBorder = scene.add.rectangle(-4, -4, 184, 54, 0xffffff, 0)
            .setOrigin(0)
            .setStrokeStyle(5, 0xffffff, 1)
            .setAlpha(0);

        this.icon = scene.add.image(29, 23, 'rain_stone')
            .setScale(0.26);

        this.text = scene.add.text(58, 10, this._formatText(), {
            fontFamily: THEME_FONT,
            fontSize: 22,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });

        this.container.add([this.background, this.glowBorder, this.icon, this.text]);
    }

    addRainStone(amount = 1, onComplete = null) {
        const targetCount = Math.max(
            0,
            Math.min(this.rainStoneCount + amount, this.maxRainStones)
        );

        if (targetCount <= this.rainStoneCount) {
            onComplete?.();
            return;
        }

        this._playRainStoneFeedback(targetCount, onComplete);
    }

    update() {
        if (this.scene.time.now >= this.feedbackEndsAt) return;

        const playerController = this.scene.playerController;
        const player = playerController?.sprite ?? this.scene.player;
        if (!player?.active) return;

        if (playerController) {
            playerController.enabled = false;
        }
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.enabled = false;
        }
        player.body?.setVelocity(0, 0);

        const wand = this.scene.wandController;
        if (wand) {
            wand.currentBodyLength = 0;
            wand.wandBody?.setVisible(false);
            wand.wandTip?.setVisible(false);
        }

        player.stop();
        if (
            this.scene.time.now >= this.stoneTextureStartsAt
            && this.scene.time.now < this.stoneTextureEndsAt
        ) {
            player.setTexture('main_character_stone');
        } else {
            player.setTexture('main_character_stand_still');
        }
    }

    setRainStoneCount(count) {
        this.rainStoneCount = Math.max(0, Math.min(count, this.maxRainStones));
        this.text.setText(this._formatText());
    }

    resetRainStones() {
        this.setRainStoneCount(0);
    }

    hasEnoughRainStones() {
        return this.rainStoneCount >= this.maxRainStones;
    }

    _formatText() {
        return `${this.rainStoneCount} / ${this.maxRainStones}`;
    }

    _playRainStoneFeedback(targetCount, onComplete) {
        if (this.scene.time.now < this.feedbackEndsAt) {
            this._finishRainStoneFeedback(false);
        }

        const scene = this.scene;
        const playerController = scene.playerController;
        const player = playerController?.sprite ?? scene.player;
        const camera = scene.cameras.main;

        this.pendingRainStoneCount = targetCount;
        this.feedbackCompleteCallback = onComplete;
        this.feedbackEndsAt = scene.time.now + RAIN_STONE_SEQUENCE_MS;
        this.stoneTextureStartsAt = scene.time.now + CAMERA_ZOOM_IN_MS;
        this.stoneTextureEndsAt = scene.time.now + DANCE_END_AT_MS;
        this.previousPlayerEnabled = playerController?.enabled ?? true;
        this.previousKeyboardEnabled = scene.input.keyboard?.enabled ?? true;
        this.originalPlayerAngle = player?.angle ?? 0;
        this.originalPlayerFlipX = player?.flipX ?? false;
        this.originalCameraZoom = camera.zoom;

        if (playerController) {
            playerController.enabled = false;
        }
        if (scene.input.keyboard) {
            scene.input.keyboard.resetKeys();
            scene.input.keyboard.enabled = false;
        }
        player?.body?.setVelocity(0, 0);
        player?.stop();
        player?.setTexture('main_character_stand_still');

        scene.wandController?.hideFor(RAIN_STONE_SEQUENCE_MS);
        camera.zoomTo(CELEBRATION_ZOOM, CAMERA_ZOOM_IN_MS, 'Sine.easeInOut', true);

        this.revealTimer = scene.time.delayedCall(CAMERA_ZOOM_IN_MS, () => {
            this.revealTimer = null;
            this._startDance();
        });

        this.danceEndTimer = scene.time.delayedCall(DANCE_END_AT_MS, () => {
            this.danceEndTimer = null;
            this._stopDance();
            camera.zoomTo(this.originalCameraZoom, CAMERA_ZOOM_OUT_MS, 'Sine.easeInOut', true);
        });

        this.stoneFlightStartTimer = scene.time.delayedCall(CAMERA_RESTORED_AT_MS, () => {
            this.stoneFlightStartTimer = null;
            camera.setZoom(this.originalCameraZoom);
            this._flyStoneToHud();
        });
    }

    _startDance() {
        const player = this.scene.playerController?.sprite ?? this.scene.player;
        if (!player?.active) return;

        player.setTexture('main_character_stone');
        player.setAngle(this.originalPlayerAngle - 4);
        this.danceTween = this.scene.tweens.add({
            targets: player,
            angle: this.originalPlayerAngle + 4,
            duration: 240,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        this.flipTimer = this.scene.time.addEvent({
            delay: 300,
            loop: true,
            callback: () => player.setFlipX(!player.flipX)
        });
    }

    _stopDance() {
        const player = this.scene.playerController?.sprite ?? this.scene.player;

        this.danceTween?.stop();
        this.flipTimer?.remove(false);
        this.danceTween = null;
        this.flipTimer = null;

        if (player?.active) {
            player.setAngle(this.originalPlayerAngle);
            player.setFlipX(this.originalPlayerFlipX);
            player.stop();
            player.setTexture('main_character_stand_still');
        }
    }

    _flyStoneToHud() {
        const scene = this.scene;
        const camera = scene.cameras.main;
        const player = scene.playerController?.sprite ?? scene.player;
        if (!player?.active) {
            this._completeStoneDelivery();
            return;
        }

        const startX = camera.x + (player.x - camera.worldView.x) * camera.zoom + 46;
        const startY = camera.y + (player.y - camera.worldView.y) * camera.zoom - 28;
        const targetX = this.container.x + this.icon.x;
        const targetY = this.container.y + this.icon.y;

        this.flyingStone = scene.add.image(startX, startY, 'rain_stone')
            .setScrollFactor(0)
            .setDepth(1002)
            .setScale(FLYING_STONE_START_SCALE);

        this.flyingStoneTween = scene.tweens.add({
            targets: this.flyingStone,
            x: targetX,
            y: targetY,
            angle: 540,
            scale: FLYING_STONE_END_SCALE,
            duration: STONE_FLIGHT_MS,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
                this.flyingStone?.destroy();
                this.flyingStone = null;
                this.flyingStoneTween = null;
                this._completeStoneDelivery();
            }
        });
    }

    _completeStoneDelivery() {
        this.setRainStoneCount(this.pendingRainStoneCount);
        this._flashHudBorder();

        this.flashEndTimer = this.scene.time.delayedCall(HUD_FLASH_MS, () => {
            this.flashEndTimer = null;
            this._finishRainStoneFeedback(true);
        });
    }

    _flashHudBorder() {
        this.glowTween?.stop();
        this.glowBorder.setAlpha(1);
        this.glowTween = this.scene.tweens.add({
            targets: this.glowBorder,
            alpha: 0.15,
            duration: 125,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: 3,
            onComplete: () => {
                this.glowBorder.setAlpha(0);
                this.glowTween = null;
            }
        });
    }

    _cancelScheduledFeedback() {
        this.revealTimer?.remove(false);
        this.danceEndTimer?.remove(false);
        this.stoneFlightStartTimer?.remove(false);
        this.flashEndTimer?.remove(false);
        this.flyingStoneTween?.stop();
        this.glowTween?.stop();
        this._stopDance();
        this.flyingStone?.destroy();

        this.revealTimer = null;
        this.danceEndTimer = null;
        this.stoneFlightStartTimer = null;
        this.flashEndTimer = null;
        this.flyingStoneTween = null;
        this.glowTween = null;
        this.flyingStone = null;
        this.glowBorder.setAlpha(0);
    }

    _finishRainStoneFeedback(notifyComplete) {
        const playerController = this.scene.playerController;
        const player = playerController?.sprite ?? this.scene.player;
        const completeCallback = this.feedbackCompleteCallback;

        this.feedbackEndsAt = 0;
        this._cancelScheduledFeedback();

        if (player?.active) {
            player.setAngle(this.originalPlayerAngle);
            player.setFlipX(this.originalPlayerFlipX);
            player.stop();
            player.setTexture('main_character_stand_still');
        }
        if (playerController) {
            playerController.enabled = this.previousPlayerEnabled;
        }
        if (this.scene.input.keyboard) {
            this.scene.input.keyboard.resetKeys();
            this.scene.input.keyboard.enabled = this.previousKeyboardEnabled;
        }
        this.scene.cameras.main.setZoom(this.originalCameraZoom);

        this.feedbackCompleteCallback = null;
        if (notifyComplete) {
            completeCallback?.();
        }
    }
}
