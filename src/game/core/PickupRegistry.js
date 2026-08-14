// 整合工具：串接 A 組 TrunkController 既有的 'trunk-pick-request'/'trunk-place' 事件與 setHeldItem()，
// 讓各事件模組不必各自監聽、各自判斷距離，只需在 setup() 呼叫 register() 註冊自己的可拾取物
export function createPickupRegistry(scene, trunkController) {
    const pickables = []; // { sprite, onPick, onPlace }
    const PICK_RANGE = 60; // px，可依實際素材調整

    scene.events.on('trunk-pick-request', (trunkSprite) => {
        const nearest = _findNearest(trunkSprite);
        if (nearest) {
            nearest.onPick?.();
            trunkController.setHeldItem(nearest);
        }
    });

    scene.events.on('trunk-place', (heldItem) => {
        heldItem?.onPlace?.();
    });

    function _findNearest(trunkSprite) {
        let closest = null;
        let closestDist = Infinity;
        for (const item of pickables) {
            const dist = Phaser.Math.Distance.Between(
                trunkSprite.x, trunkSprite.y, item.sprite.x, item.sprite.y
            );
            if (dist <= PICK_RANGE && dist < closestDist) {
                closest = item;
                closestDist = dist;
            }
        }
        return closest;
    }

    return {
        // 供事件模組於 setup() 呼叫：註冊一個可被象鼻拾取/放置的物件
        register(sprite, { onPick, onPlace } = {}) {
            pickables.push({ sprite, onPick, onPlace });
        }
    };
}
