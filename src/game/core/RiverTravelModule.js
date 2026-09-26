import { BoatTravel } from './BoatTravel';
import { createTerrainCollision } from './TerrainCollision';

// Loaded by DevToolsManager, the shared integration point allowed for this feature.
// Keep event layouts, fonts, world bounds and Overworld's source unchanged.
export function installRiverTravel(scene) {
    scene.terrainCollision = createTerrainCollision(scene);
    scene.boatTravel = new BoatTravel(scene);

    // Phaser assigns sceneUpdate after create(), so attach at the CREATE event.
    // Suspend the normal frame callback only during travel; tweens/physics retain
    // their normal lifecycle. Restore the callback when this scene shuts down.
    let originalUpdate;
    let travelUpdate;
    const attach = () => {
        originalUpdate = scene.sys.sceneUpdate;
        travelUpdate = function (time, delta) {
            scene.boatTravel.update();
            if (scene.boatTravel.isTravelling) {
                scene.hud?.update();
                return;
            }
            originalUpdate.call(this, time, delta);
        };
        scene.sys.sceneUpdate = travelUpdate;
    };
    scene.events.once('create', attach);
    scene.events.once('shutdown', () => {
        scene.events.off('create', attach);
        if (travelUpdate && scene.sys.sceneUpdate === travelUpdate) {
            scene.sys.sceneUpdate = originalUpdate;
        }
    });
}
