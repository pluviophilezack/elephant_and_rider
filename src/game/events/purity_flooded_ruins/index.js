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
    this.guardSaved = scene.add.sprite(5000, 2800, 'guard_saved');

    const triggerZone = createTriggerZone(scene, {
      x: 5000,
      y: 2800,
      width: 100,
      height: 100,
    });

    this.slowZone = createTriggerZone(scene, {
      x: 4850,
      y: 2675,
      width: 1050, 
      height: 650
    })

    scene.physics.add.overlap(scene.player, triggerZone, () => {
      DialogueSystem.show(scene, dialogue[0], () => {
              const option = [{key: 'leave', label: "跑走"},{key: 'save', label: '救它'}];
      ChoiceSystem.prompt(scene, option, (o)=>{
        if(o == 'save'){
          DialogueSystem.show(scene, dialogue[2], () => {});
          MoralState.add('purity', -1);
          MoralState.add('harm', 1)
        }else if(o === 'leave') {
          DialogueSystem.show(scene, dialogue[1], () => {});
          scene.giveRainStone();
        }
      })
      });


      triggerZone.destroy();
    });
  },

  update(scene)  {
    if (this.slowZone && scene.player && scene.playerController) {
      const isOverlapping = scene.physics.overlap(scene.player, this.slowZone);

      if (isOverlapping) {
        scene.playerController.speed = scene.playerController.baseSpeed * 0.5;
      } else {
        scene.playerController.speed = scene.playerController.baseSpeed;
      }
    }
  }
};
