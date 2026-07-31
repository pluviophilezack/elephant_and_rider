// 核心系統：統一註冊 events/ 底下所有事件模組，將玩家與各事件觸發區的碰撞掛進場景
// 事件負責人新增事件時，只需要在下方 EVENTS 陣列補上自己的模組，不需要修改其餘邏輯
import { createTriggerZone } from './TriggerZone';

import tutorial from '../events/tutorial';
import ingroupBirdContest from '../events/ingroup_bird_contest';
import fairnessWater from '../events/fairness_water';
import purityFloodedRuins from '../events/purity_flooded_ruins';
import authorityHerd from '../events/authority_herd';

const EVENTS = [
    tutorial,
    ingroupBirdContest,
    fairnessWater,
    purityFloodedRuins,
    authorityHerd
];

export const EventManager = {

    // 在 Overworld.create() 中呼叫一次，為每個事件建立觸發區並綁定 onEnter
    registerAll(scene, player) {
        EVENTS.forEach(event => {
            const zone = createTriggerZone(scene, event.triggerZone);
            let triggered = false;

            scene.physics.add.overlap(player, zone, () => {
                if (triggered) return;
                triggered = true;
                event.onEnter(scene);
            });
        });
    }
};
