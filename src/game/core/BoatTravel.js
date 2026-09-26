import * as Phaser from 'phaser';
import { DialogueSystem } from './DialogueSystem';
import { DOCKS } from './DockLayout';
export { DOCKS } from './DockLayout';

export const BOAT_TRIP_DURATION = 10000;
export const BOAT_REQUIRED_STONES = 5;

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
        this.currentDock = 'mainland';
        this.armed = true;
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
        scene.events.once('shutdown', () => {
            this.tween?.stop();
            this.isTravelling = false;
        });
    }

    update() {
        if (this.isTravelling) return;
        const { scene } = this;
        const controller = scene.playerController;
        const zone = this.docks[this.currentDock].zone;
        const atDock = scene.physics.overlap(controller.sprite, zone);
        // Require leaving the arrival trigger before another trip can begin.
        if (!atDock) this.armed = true;
        if (atDock && this.armed && controller.enabled && !controller.isAutoMoving
            && !controller.isInteracting && !DialogueSystem.isShowing() && !scene.isDialogueActive) {
            this.startTrip();
        }
    }

    startTrip() {
        if (this.isTravelling) return;
        const { scene } = this;
        this.armed = false;
        if ((scene.hud?.rainStoneCount ?? 0) < BOAT_REQUIRED_STONES) {
            this.boardingDialogue = DialogueSystem.show(scene, [
                { speaker: 'player', text: '祈雨石還沒收集到五顆，現在還不能搭船。' },
                { speaker: 'player', text: '回去看看吧，或許還有需要幫忙的夥伴。' }
            ]);
            return;
        }
        const controller = scene.playerController;
        const player = controller.sprite;
        const from = DOCKS[this.currentDock];
        const destinationKey = this.currentDock === 'mainland' ? 'ruins' : 'mainland';
        const to = DOCKS[destinationKey];
        const points = this.currentDock === 'mainland' ? BOAT_ROUTE : [...BOAT_ROUTE].reverse();
        const path = new Phaser.Curves.Spline(points.flat());
        const point = new Phaser.Math.Vector2();
        scene.devToolsManager?.stopSprint();
        if (scene.wandController?.heldItem) scene.wandController.releaseItem();
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
        scene.restoreRiverFlow();
        const start = { x: player.x, y: player.y + player.displayHeight / 2 };
        this.passenger.setPosition(start.x, start.y).setVisible(true);
        scene.cameras.main.startFollow(this.passenger, true, 0.12, 0.12);
        this.tween = scene.tweens.addCounter({
            from: 0, to: 1, duration: BOAT_TRIP_DURATION,
            onUpdate: tween => {
                const t = tween.getValue();
                if (t < 0.1) {
                    const p = Phaser.Math.Easing.Sine.InOut(t / 0.1);
                    this.passenger.setPosition(
                        Phaser.Math.Linear(start.x, from.berth.x - 25, p),
                        Phaser.Math.Linear(start.y, from.berth.y + 55, p)
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
                    this.passenger.setPosition(
                        Phaser.Math.Linear(to.berth.x - 25, to.landing.x, p),
                        Phaser.Math.Linear(to.berth.y + 55, to.landing.y + player.displayHeight / 2, p)
                    );
                }
                // Keep the hidden physical player near the passenger for other systems.
                player.setPosition(this.passenger.x, this.passenger.y - player.displayHeight / 2);
            },
            onComplete: () => {
                this.boat.setPosition(to.berth.x, to.berth.y).setAngle(0);
                player.body.reset(to.landing.x, to.landing.y);
                player.body.enable = this.savedState.bodyEnabled;
                player.setVisible(this.savedState.visible).setFlipX(this.savedState.flipX).setVelocity(0, 0);
                controller.isAutoMoving = this.savedState.autoMoving;
                controller.enabled = this.savedState.enabled;
                controller.speed = this.savedState.speed;
                this.passenger.setVisible(false);
                scene.cameras.main.startFollow(player);
                this.currentDock = destinationKey;
                this.isTravelling = false;
                scene.events.emit('boat:arrived', destinationKey);
            }
        });
    }
}
