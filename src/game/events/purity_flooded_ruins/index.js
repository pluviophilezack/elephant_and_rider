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
    this.isTalking = false; // Locks velocity during dialogue & choice selection

    this.currentForceX = -80;
    this.currentForceY = -45;

    this.pollutionOil = safeAddImage(scene, 4850, 2675, "pollution_oil", 1);
    this.slowZone = createTriggerZone(scene, {
      x: 4850,
      y: 2675,
      width: 1050,
      height: 650,
    });

    this.guard = safeAddSprite(scene, 5000, 2800, "guard_trapped", 2);
    this.rockGuard = safeAddImage(scene, 5000, 2800, "rock_guard", 3);

    this.altar = safeAddImage(scene, 5400, 2800, "altar", 2);
    this.lotusRelic = safeAddImage(scene, 5400, 2760, "lotus_relic_clean", 3);

    const guardTrigger = createTriggerZone(scene, {
      x: 5000,
      y: 2800,
      width: 120,
      height: 120,
    });

    if (guardTrigger) {
      scene.physics.add.overlap(scene.player, guardTrigger, () => {
        const dialogs = dialogueData || [];
        this.isTalking = true;

        DialogueSystem.show(scene, dialogs[0] || [], () => {
          const options = [
            { key: "leave", label: "不救並離開" },
            { key: "save", label: "用象鼻移開石塊救牠" },
          ];
          //console.log("part 1");
          if (ChoiceSystem?.prompt) {
            ChoiceSystem.prompt(scene, options, (choice) => {
              //console.log("part 2");
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

                DialogueSystem.show(scene, dialogs[2] || [], () => {
                  this.isTalking = false;
                });
              } else if (choice === "leave"){
                this.isTrunkPolluted = false;
                DialogueSystem.show(scene, dialogs[1] || [], () => {
                  this.isTalking = false;
                });
              }
            });
          } else {
            this.isTalking = false;
          }
        });

        guardTrigger.destroy();
      });
    }

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
        this.isTalking = true;

        const dialogs = dialogueData || [];

        if (this.isTrunkPolluted) {
          safeSetTexture(this.lotusRelic, "lotus_relic_polluted");
          DialogueSystem.show(scene, dialogs[3] || [], () => {
            scene.giveRainStone?.();
            this.isTalking = false;
          });
        } else {
          safeSetTexture(this.lotusRelic, "lotus_relic_clean");
          DialogueSystem.show(scene, dialogs[1] || [], () => {
            scene.giveRainStone?.();
            this.isTalking = false;
          });
        }

        altarTrigger.destroy();
      });
    }
  },

  update(scene) {
    if (!scene.player || !scene.playerController) return;

    const isCurrentlyTalking = this.isTalking || DialogueSystem.isShowing();

    if (isCurrentlyTalking) {
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