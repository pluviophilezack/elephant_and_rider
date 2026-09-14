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
    this.isTalked = false;

    this.currentForceX = -20;
    this.currentForceY = -10;
    this.conversationDistance = 100;

    // 1. 背景裝飾與黑油水流區域
    this.pollutionOil = safeAddImage(scene, 4850, 2675, "pollution_oil", 1);
    this.slowZone = createTriggerZone(scene, {
      x: 4850,
      y: 2675,
      width: 1050,
      height: 650,
    });

    // 2. 守衛與巨石
    this.guard = scene.physics.add
      .sprite(4835, 2680, "guard_trapped")
      .setScale(0.6)
      .setDepth(2);

    this.rockGuard = safeAddImage(scene, 4835, 2600, "rock_guard", 3);

    // 3. 祭壇與白蓮聖物
    this.lotusRelic = scene.physics.add
      .sprite(5000, 2700, "lotus_relic_clean")
      .setScale(0.4)
      .setDepth(3);
    this.altar = safeAddImage(scene, 5000, 2780, "altar", 2);

    // 4. 空白鍵手動觸發對話 (距離判斷)
    scene.input.keyboard.on("keydown-SPACE", () => {
      if (!scene.player || DialogueSystem.isShowing() || ChoiceSystem.isShowing()) return;

      // 與守衛對話觸發
      if (this.guard && !this.isGuardRescued) {
        const distance = Phaser.Math.Distance.Between(
          scene.player.x,
          scene.player.y,
          this.guard.x,
          this.guard.y
        );

        if (distance <= this.conversationDistance) {
          this.triggerGuardDialogue(scene);
        }
      }

      // 與聖物互動觸發（加入 !this.hasTakenRelic 避免重複領取）
      if (this.lotusRelic && this.isTalked && !this.hasTakenRelic) {
        const distance = Phaser.Math.Distance.Between(
          scene.player.x,
          scene.player.y,
          this.lotusRelic.x,
          this.lotusRelic.y
        );

        if (distance <= this.conversationDistance) {
          this.triggerLotus(scene);
        }
      }
    });
  },

  triggerLotus(scene) {
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
        scene.giveRainStone?.();
    }
  },

  triggerGuardDialogue(scene) {
    const dialogs = dialogueData || [];
    this.isTalked = true;

    DialogueSystem.show(scene, dialogs[0] || [], () => {
      const options = [
        { key: "leave", label: "不救並離開" },
        { key: "save", label: "用象鼻移開石塊救牠" },
      ];

      if (ChoiceSystem?.prompt) {
        scene.time.delayedCall(150, () => {
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
      }
    });
  },

  update(scene) {
    if (!scene.player || !scene.playerController) return;

    // 對話或選擇中時停止玩家移動與黑油推力
    if (DialogueSystem.isShowing() || ChoiceSystem.isShowing()) {
      scene.playerController.speed = 0;
      if (scene.player.body) {
        scene.player.body.setVelocity(0, 0);
      }
      return;
    }

    if (this.slowZone) {
      const isOverlapping = scene.physics.overlap(scene.player, this.slowZone);

      if (isOverlapping) {
        scene.playerController.speed = scene.playerController.baseSpeed * 0.5;

        if (scene.player.texture?.key !== "main_character_uncomfortable") {
          safeSetTexture(scene.player, "main_character_uncomfortable");
        }

        if (scene.player.body) {
          scene.player.body.velocity.x += this.currentForceX;
          scene.player.body.velocity.y += this.currentForceY;
        }
      } else {
        scene.playerController.speed = scene.playerController.baseSpeed;

        if (scene.player.texture?.key === "main_character_uncomfortable") {
          safeSetTexture(scene.player, "main_character_stand_still");
        }
      }
    }
  },
};