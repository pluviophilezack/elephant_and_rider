import { DialogueSystem } from "../../core/DialogueSystem";
import { ChoiceSystem } from "../../core/ChoiceSystem";
import { MoralState } from "../../core/MoralState";
import { createTriggerZone } from "../../core/TriggerZone";
import dialogueData from "./dialogue.json";

function safeAddImage(scene, x, y, key, depth = 0) {
  if (scene.textures.exists(key)) {
    return scene.add.image(x, y, key).setDepth(depth);
  }
  return null;
}

function safeAddSprite(scene, x, y, key, depth = 0) {
  if (scene.textures.exists(key)) {
    return scene.add.sprite(x, y, key).setDepth(depth);
  }
  return null;
}

function safeSetTexture(gameObject, key) {
  if (gameObject && gameObject.scene?.textures?.exists(key)) {
    gameObject.setTexture(key);
  }
}

export default {
  key: "purity_flooded_ruins",

  setup(scene) {
    this.isTrunkPolluted = false;
    this.isGuardRescued = false;
    this.hasTakenRelic = false;

    // 水流/油流推力參數 (可自行調整推力強度)
    this.currentForceX = -80; // 向左推力 (-X)
    this.currentForceY = -45; // 向上推力 (-Y)

    // 1. 背景裝飾與黑油水流區域
    this.pollutionOil = safeAddImage(scene, 4850, 2675, "pollution_oil", 1);
    this.slowZone = createTriggerZone(scene, {
      x: 4850,
      y: 2675,
      width: 1050,
      height: 650,
    });

    // 2. 守衛與巨石
    this.guard = safeAddSprite(scene, 5000, 2800, "guard_trapped", 2);
    this.rockGuard = safeAddImage(scene, 5000, 2800, "rock_guard", 3);

    // 3. 祭壇與白蓮聖物
    this.altar = safeAddImage(scene, 5400, 2800, "altar", 2);
    this.lotusRelic = safeAddImage(scene, 5400, 2760, "lotus_relic_clean", 3);

    // 4. 守衛救援觸發區域
    const guardTrigger = createTriggerZone(scene, {
      x: 5000,
      y: 2800,
      width: 120,
      height: 120,
    });

    if (guardTrigger) {
      scene.physics.add.overlap(scene.player, guardTrigger, () => {
        const dialogs = dialogueData || [];

        DialogueSystem.show(scene, dialogs[0] || [], () => {
          const options = [
            { key: "leave", label: "不救並離開" },
            { key: "save", label: "用象鼻移開石塊救牠" },
          ];

          ChoiceSystem.prompt(scene, options, (choice) => {
            if (choice === "save") {
              this.isGuardRescued = true;
              this.isTrunkPolluted = true;

              if (this.rockGuard) {
                this.rockGuard.destroy();
                this.rockGuard = null;
              }
              safeSetTexture(this.guard, "guard_saved");

              MoralState?.add?.("purity", -1);
              MoralState?.add?.("harm", 1);

              DialogueSystem.show(scene, dialogs[2] || [], () => {});
            } else if (choice === "leave") {
              this.isTrunkPolluted = false;
              DialogueSystem.show(scene, dialogs[1] || [], () => {});
            }
          });
        });

        guardTrigger.destroy();
      });
    }

    // 5. 祭壇互動觸發區域
    const altarTrigger = createTriggerZone(scene, {
      x: 5400,
      y: 2800,
      width: 100,
      height: 100,
    });

    if (altarTrigger) {
      scene.physics.add.overlap(scene.player, altarTrigger, () => {
        if (this.hasTakenRelic) return;
        this.hasTakenRelic = true;

        const dialogs = dialogueData || [];

        if (this.isTrunkPolluted) {
          safeSetTexture(this.lotusRelic, "lotus_relic_polluted");
          DialogueSystem.show(scene, dialogs[3] || [], () => {
            scene.giveRainStone?.();
          });
        } else {
          safeSetTexture(this.lotusRelic, "lotus_relic_clean");
          DialogueSystem.show(scene, dialogs[1] || [], () => {
            scene.giveRainStone?.();
          });
        }

        altarTrigger.destroy();
      });
    }
  },

  update(scene) {
    if (!scene.player || !scene.playerController) return;

    const isCurrentlyTalking = DialogueSystem.isShowing();
    if (isCurrentlyTalking){
      scene.player.body.setVelocity(0,0);
    }

    if (this.slowZone) {
      const isOverlapping = scene.physics.overlap(scene.player, this.slowZone);

      if (isOverlapping) {
        // 降低玩家主動控制的速度（模擬泥濘阻力）
        scene.playerController.speed = scene.playerController.baseSpeed * 0.5;

        // 表情切換為不適
        if (scene.player.texture?.key !== "main_character_uncomfortable") {
          safeSetTexture(scene.player, "main_character_uncomfortable");
        }

        // 新增：持續向左上方施加水流/黑油推力
        if (scene.player.body) {
          scene.player.body.velocity.x += this.currentForceX;
          scene.player.body.velocity.y += this.currentForceY;
        }
      } else {
        // 離開黑油區後恢復正常速度
        scene.playerController.speed = scene.playerController.baseSpeed;

        if (scene.player.texture?.key === "main_character_uncomfortable") {
          safeSetTexture(scene.player, "main_character_stand_still");
        }
      }
    }
  },
};