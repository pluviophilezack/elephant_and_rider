import { DialogueSystem } from "../../core/DialogueSystem";
import { ChoiceSystem } from "../../core/ChoiceSystem";
import { MoralState } from "../../core/MoralState";
import { createTriggerZone } from "../../core/TriggerZone";
import dialogue from "./dialogue.json";

// 每個事件模組要呼叫一次giveRainStone() ，以便在該事件獲得祈雨石。

export default {
  key: "purity_flooded_ruins",
  setup(scene) {
    // guard pos: (4800, 2500)
    this.guardSaved = scene.add.sprite(4800, 2500, 'guard_saved');

    const triggerZone = createTriggerZone(scene, {
      x: 4800,
      y: 2500,
      width: 100,
      height: 100,
    });
    scene.physics.add.overlap(scene.player, triggerZone, () => {
      DialogueSystem.show(scene, dialogue[0], () => {});
      DialogueSystem.show(scene, dialogue[1], () => {});
      triggerZone.destroy();
    });
  },

  update(scene) {},
};
