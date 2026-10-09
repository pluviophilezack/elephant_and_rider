import * as Phaser from 'phaser';
import { DialogueSystem } from './DialogueSystem';
import { DOCKS, SHALLOW_BERTH, TUTORIAL_RETURN, CURRENT_WARNINGS } from './DockLayout';
export { DOCKS } from './DockLayout';

export const BOAT_TRIP_DURATION = 10000;
export const BOAT_REQUIRED_STONES = 5;
export const BOAT_RETURN_STONES = 6;
export const BOAT_DRIFT_ROUTE = [
    [4190, 2530], [4200, 2660], [4010, 2760], [SHALLOW_BERTH.x, SHALLOW_BERTH.y]
];
export const BOAT_RETURN_ROUTE = [
    [SHALLOW_BERTH.x, SHALLOW_BERTH.y], [3300, 2810], [2750, 2790],
    [2150, 2750], [1600, 2820],
    [900, 2820], [400, 2730], [120, 2490], [65, 2120],
    [TUTORIAL_RETURN.berth.x, TUTORIAL_RETURN.berth.y]
];

// Both piers face east: the boat moors to the right, and passengers land left.
// Follow the eastern river around the peninsula rather than cutting over land.
export const BOAT_ROUTE = [
    [5040, 1640], [5040, 1840], [5020, 1980], [5000, 2210],
    [4770, 2440], [4460, 2620], [4200, 2660], [4190, 2530]
];

export class BoatTravel {
    constructor(scene) {
        this.scene = scene;
        this.isTravelling = false;
        this.isReleasing = false;
        this.currentDock = 'mainland';
        this.armed = true;
        this.phase = 'outbound';
        this.warningArmed = true;
        this.shallowWarningArmed = true;
        this.docks = {};
        for (const [key, dock] of Object.entries(DOCKS)) {
            const image = scene.add.image(dock.x, dock.y, 'port').setScale(1.2).setDepth(7);
            scene.registerAsset(image, `boat_dock_${key}`);
            // Board only near the boat-facing end, not at the pier entrance.
            const zone = scene.add.zone(dock.x + 150, dock.y + 25, 30, 80);
            scene.physics.add.existing(zone, true);
            this.docks[key] = { zone, image };
        }
        const berth = DOCKS.mainland.berth;
        // The hull draws in front of the passenger; both stay above the pier.
        this.boat = scene.add.image(berth.x, berth.y, 'boat').setScale(1.3).setDepth(45);
        scene.registerAsset(this.boat, 'river_boat');
        this.passenger = scene.add.sprite(0, 0, 'main_character_stand_still')
            .setOrigin(0.5, 1).setScale(0.3).setDepth(44).setVisible(false);
        this.currentZones = CURRENT_WARNINGS.map((warning, index) => {
            const sign = scene.add.image(warning.signX, warning.signY, 'sign_brown')
                .setDepth(16);
            scene.registerAsset(sign, `river_current_sign_${index}`);
            const signText = scene.add.text(sign.x, sign.y - 34, '水流\n湍急！', {
                fontFamily: 'naikaifont',
                fontSize: '26px',
                color: '#ffffff',
                align: 'center',
                padding: { x: 8, y: 4 }
            }).setOrigin(0.5).setDepth(sign.depth + 1);
            scene.registerAsset(signText, `river_current_sign_text_${index}`);
            const zone = scene.add.zone(warning.x, warning.y, warning.width, warning.height);
            scene.physics.add.existing(zone, true);
            return zone;
        });
        scene.events.once('shutdown', () => {
            this.tween?.stop();
            this.driftTween?.stop();
            this.releaseTween?.stop();
            this.restoreReleaseState();
            this.restoreHeldItemState();
            this.isTravelling = false;
        });
    }

    restoreHeldItemState() {
        const heldItem = this.scene.wandController?.heldItem;
        if (heldItem && this.savedItemDepth != null) {
            heldItem.setDepth(this.savedItemDepth);
            this.savedItemDepth = null;
        }
    }

    update() {
        if (this.isTravelling || this.isReleasing) return;
        const { scene } = this;
        const controller = scene.playerController;
        const player = controller.sprite;
        const canInteract = controller.enabled && !controller.isAutoMoving
            && !controller.isInteracting && !DialogueSystem.isShowing() && !scene.isDialogueActive;
        const nearCurrent = this.currentZones.some(zone => scene.physics.overlap(player, zone));
        if (!nearCurrent) this.warningArmed = true;
        if (nearCurrent && this.warningArmed && canInteract) {
            this.warningArmed = false;
            DialogueSystem.show(scene, [{ speaker: 'player', text: '水流太湍急了，沒辦法逆流而上。' }]);
            return;
        }
        if (this.phase === 'stranded' && (scene.hud?.rainStoneCount ?? 0) >= BOAT_RETURN_STONES
            && !scene.hud?.feedbackEndsAt && canInteract) {
            this.showBoatRelease();
            return;
        }
        if (this.phase !== 'outbound') {
            const nearBoat = Phaser.Math.Distance.Between(player.x, player.y, this.boat.x, this.boat.y) < 190;
            if (!nearBoat) this.shallowWarningArmed = true;
            if (nearBoat && canInteract) {
                if (this.phase === 'returnReady' && (scene.hud?.rainStoneCount ?? 0) >= BOAT_RETURN_STONES) {
                    this.startTrip();
                } else if (this.phase === 'stranded' && this.shallowWarningArmed) {
                    this.shallowWarningArmed = false;
                    DialogueSystem.show(scene, [{ speaker: 'player', text: '船卡在淺灘了，得想辦法讓他重新浮起來。' }]);
                }
            }
            return;
        }
        const zone = this.docks[this.currentDock].zone;
        const atDock = scene.physics.overlap(controller.sprite, zone);
        // Require leaving the arrival trigger before another trip can begin.
        if (!atDock) this.armed = true;
        if (atDock && this.armed && controller.enabled && !controller.isAutoMoving
            && !controller.isInteracting && !DialogueSystem.isShowing() && !scene.isDialogueActive) {
            this.startTrip();
        }
    }

    showBoatRelease() {
        const { scene } = this;
        const controller = scene.playerController;
        const player = controller.sprite;
        const camera = scene.cameras.main;
        const keyboard = scene.input.keyboard;
        scene.devToolsManager?.stopSprint();
        this.releaseState = {
            enabled: controller.enabled, autoMoving: controller.isAutoMoving,
            bodyEnabled: player.body.enable, keyboardEnabled: keyboard?.enabled
        };
        this.phase = 'releasing';
        this.isReleasing = true;
        controller.disable();
        controller.isAutoMoving = true;
        player.body.enable = false;
        if (keyboard) { keyboard.resetKeys(); keyboard.enabled = false; }
        scene.wandController?.hideFor(4200);
        camera.stopFollow();
        const start = { x: camera.scrollX, y: camera.scrollY };
        const focus = camera.getScroll(this.boat.x, this.boat.y);
        this.releaseTween = scene.tweens.addCounter({
            from: 0, to: 4200, duration: 4200,
            onUpdate: tween => {
                const elapsed = tween.getValue();
                if (elapsed < 1200) {
                    const p = Phaser.Math.Easing.Sine.InOut(elapsed / 1200);
                    camera.setScroll(Phaser.Math.Linear(start.x, focus.x, p), Phaser.Math.Linear(start.y, focus.y, p));
                } else if (elapsed < 3000) {
                    camera.setScroll(focus.x, focus.y);
                    const p = Phaser.Math.Easing.Sine.InOut(Math.min(1, (elapsed - 1200) / 1400));
                    this.boat.setAngle(90 * (1 - p));
                } else {
                    const p = Phaser.Math.Easing.Sine.InOut((elapsed - 3000) / 1200);
                    camera.setScroll(Phaser.Math.Linear(focus.x, start.x, p), Phaser.Math.Linear(focus.y, start.y, p));
                }
            },
            onComplete: () => {
                this.boat.setAngle(0);
                this.restoreReleaseState();
                camera.startFollow(player);
                this.phase = 'returnReady';
            }
        });
    }

    restoreReleaseState() {
        if (!this.releaseState) return;
        const controller = this.scene.playerController;
        controller.enabled = this.releaseState.enabled;
        controller.isAutoMoving = this.releaseState.autoMoving;
        if (controller.sprite.body) {
            controller.sprite.body.enable = this.releaseState.bodyEnabled;
            controller.sprite.setVelocity(0, 0);
        }
        const keyboard = this.scene.input.keyboard;
        if (keyboard) { keyboard.resetKeys(); keyboard.enabled = this.releaseState.keyboardEnabled; }
        this.releaseState = null;
        this.isReleasing = false;
    }

    driftToShallows() {
        this.phase = 'drifting';
        const path = new Phaser.Curves.Spline(BOAT_DRIFT_ROUTE.flat());
        const point = new Phaser.Math.Vector2();
        this.driftTween = this.scene.tweens.addCounter({
            from: 0, to: 1, duration: 9000,
            onUpdate: tween => {
                const t = tween.getValue();
                path.getPoint(t, point);
                this.boat.setPosition(point.x, point.y).setFlipX(true)
                    .setAngle(90 * Phaser.Math.Easing.Sine.InOut(Math.max(0, (t - 0.8) / 0.2)));
            },
            onComplete: () => {
                this.boat.setPosition(SHALLOW_BERTH.x, SHALLOW_BERTH.y).setAngle(90);
                this.phase = 'stranded';
            }
        });
    }

    startTrip() {
        if (this.isTravelling) return;
        const returning = this.phase === 'returnReady';
        if (!returning && this.phase !== 'outbound') return;
        const { scene } = this;
        this.armed = false;
        if ((scene.hud?.rainStoneCount ?? 0) < (returning ? BOAT_RETURN_STONES : BOAT_REQUIRED_STONES)) {
            this.boardingDialogue = DialogueSystem.show(scene, [
                { speaker: 'player', text: '祈雨石還沒收集到五顆，現在還不能搭船。' },
                { speaker: 'player', text: '回去看看吧，或許還有需要幫忙的夥伴。' }
            ]);
            return;
        }
        const controller = scene.playerController;
        const player = controller.sprite;
        const from = returning ? { berth: SHALLOW_BERTH } : DOCKS.mainland;
        const destinationKey = returning ? 'tutorial' : 'ruins';
        const to = returning ? TUTORIAL_RETURN : DOCKS.ruins;
        const points = returning ? BOAT_RETURN_ROUTE : BOAT_ROUTE;
        const path = new Phaser.Curves.Spline(points.flat());
        const point = new Phaser.Math.Vector2();
        scene.devToolsManager?.stopSprint();
        const heldItem = scene.wandController?.heldItem;
        this.savedItemDepth = heldItem ? heldItem.depth : null;
        if (heldItem) {
            heldItem.setDepth(46);
        }
        this.savedState = {
            enabled: controller.enabled, autoMoving: controller.isAutoMoving,
            bodyEnabled: player.body.enable, visible: player.visible,
            speed: controller.speed, flipX: player.flipX
        };
        this.isTravelling = true;
        this.armed = false;
        controller.disable();
        controller.isAutoMoving = true;
        player.body.enable = false;
        player.setVisible(false);
        scene.wandController?.hideFor(BOAT_TRIP_DURATION);
        const start = { x: player.x, y: player.y + player.displayHeight / 2 };
        this.passenger.setPosition(start.x, start.y).setFlipX(player.flipX).setVisible(true);
        if (heldItem) {
            const itemOffsetX = this.passenger.flipX ? -8 : 8;
            heldItem.setPosition(this.passenger.x + itemOffsetX, this.passenger.y - 45);
        }
        scene.cameras.main.startFollow(this.passenger, true, 0.12, 0.12);
        this.tween = scene.tweens.addCounter({
            from: 0, to: 1, duration: BOAT_TRIP_DURATION,
            onUpdate: tween => {
                const t = tween.getValue();
                if (t < 0.1) {
                    const p = Phaser.Math.Easing.Sine.InOut(t / 0.1);
                    const destX = from.berth.x - 25;
                    const destY = from.berth.y + 55;
                    this.passenger.setFlipX(destX < start.x);
                    this.passenger.setPosition(
                        Phaser.Math.Linear(start.x, destX, p),
                        Phaser.Math.Linear(start.y, destY, p)
                    );
                } else if (t < 0.9) {
                    const p = (t - 0.1) / 0.8;
                    path.getPoint(p, point);
                    const bob = Math.sin(p * Math.PI * 12) * 4;
                    this.boat.setPosition(point.x, point.y + bob).setAngle(Math.sin(p * Math.PI * 8) * 2);
                    const left = path.getTangent(p).x < 0;
                    this.boat.setFlipX(left);
                    this.passenger.setFlipX(left).setPosition(point.x - 25, point.y + 55 + bob);
                } else {
                    this.boat.setPosition(to.berth.x, to.berth.y).setAngle(0);
                    const p = Phaser.Math.Easing.Sine.InOut((t - 0.9) / 0.1);
                    const startX = to.berth.x - 25;
                    const startY = to.berth.y + 55;
                    const destX = to.landing.x;
                    const destY = to.landing.y + player.displayHeight / 2;
                    this.passenger.setFlipX(destX < startX);
                    this.passenger.setPosition(
                        Phaser.Math.Linear(startX, destX, p),
                        Phaser.Math.Linear(startY, destY, p)
                    );
                }
                // Keep the hidden physical player near the passenger for other systems.
                player.setPosition(this.passenger.x, this.passenger.y - player.displayHeight / 2);
                if (heldItem) {
                    const itemOffsetX = this.passenger.flipX ? -8 : 8;
                    heldItem.setPosition(this.passenger.x + itemOffsetX, this.passenger.y - 45);
                }
            },
            onComplete: () => {
                this.boat.setPosition(to.berth.x, to.berth.y).setAngle(0);
                player.body.reset(to.landing.x, to.landing.y);
                player.body.enable = this.savedState.bodyEnabled;
                player.setVisible(this.savedState.visible).setFlipX(this.passenger.flipX).setVelocity(0, 0);
                controller.isAutoMoving = this.savedState.autoMoving;
                controller.enabled = this.savedState.enabled;
                controller.speed = this.savedState.speed;
                this.passenger.setVisible(false);
                if (heldItem) {
                    this.restoreHeldItemState();
                    heldItem.setPosition(player.x, player.y);
                }
                if (scene.wandController) {
                    scene.wandController.forceHiddenUntil = 0;
                }
                scene.cameras.main.startFollow(player);
                this.currentDock = destinationKey;
                this.isTravelling = false;
                if (returning) this.phase = 'complete';
                else this.driftToShallows();
                scene.events.emit('boat:arrived', destinationKey);
            }
        });
    }
}
