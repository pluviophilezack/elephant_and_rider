import { DialogueSystem } from "../../core/DialogueSystem";
import { ChoiceSystem } from "../../core/ChoiceSystem";
import { MoralState } from "../../core/MoralState";
import { createTriggerZone } from "../../core/TriggerZone";
import { AudioManager } from "../../core/AudioManager";
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
    this.isTalked = false;
    this.hasPlayedGuardWeakSFX = false; // 紀錄守衛哀號音效是否已觸發過

    this.currentForceX = -20;
    this.currentForceY = -10;
    this.conversationDistance = 125;
    this.guardWeakAudioDistance = 300; // 💡 觸發守衛衰弱哀號音效的距離閾值

    // 1. 背景裝飾與黑油水流區域
    this.pollutionOil = safeAddImage(scene, 4850, 2675, "pollution_oil", 1);
    this.slowZone = createTriggerZone(scene, {
      x: 4730,
      y: 2650,
      width: 860,
      height: 500,
    });

    // 2. 守衛與巨石
    this.guard = safeAddSprite(scene, 4835, 2680, "guard_trapped", 2);
    if (this.guard) this.guard.setScale(0.6);

    this.rockGuard = safeAddImage(scene, 4835, 2600, "rock_guard", 3);

    // 3. 祭壇與白蓮聖物
    this.lotusRelic = safeAddSprite(scene, 5000, 2700, "lotus_relic_clean", 3);
    if (this.lotusRelic) this.lotusRelic.setScale(0.4);

    this.altar = safeAddImage(scene, 5000, 2780, "altar", 2);

    // 4. 空白鍵事件註冊（先移除舊事件避免重載重複綁定）
    this._handleSpaceKey = () => this.handleSpaceInteraction(scene);
    scene.input.keyboard.off("keydown-SPACE", this._handleSpaceKey);
    scene.input.keyboard.on("keydown-SPACE", this._handleSpaceKey);

    // 當場景關閉時自動清理按鍵監聽
    scene.events.once("shutdown", () => {
      scene.input.keyboard.off("keydown-SPACE", this._handleSpaceKey);
    });

    this.guardWeakSound = null;
  },

  handleSpaceInteraction(scene) {
    if (
      !scene.player ||
      scene.isDialogueCooldown ||
      DialogueSystem.isShowing() ||
      ChoiceSystem.isShowing()
    ) {
      return;
    }

    // 與守衛對話觸發（嚴格檢查物件存活狀態 active）
    if (this.guard?.active && !this.isGuardRescued && !this.isTalked) {
      const distance = Phaser.Math.Distance.Between(
        scene.player.x,
        scene.player.y,
        this.guard.x,
        this.guard.y
      );

      if (distance <= this.conversationDistance) {
        this.triggerGuardDialogue(scene);
        return;
      }
    }

    // 與聖物互動觸發（嚴格檢查物件存活狀態 active）
    if (this.lotusRelic?.active && this.isTalked && !this.hasTakenRelic) {
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
  },

  triggerLotus(scene) {
    if (this.hasTakenRelic) return;
    this.hasTakenRelic = true;

    const dialogs = dialogueData || [];

    const onCompleteGainStone = () => {
      // 💡 獲得祈雨石邏輯與音樂淡出處理
      if (typeof scene.giveRainStone === "function") {
        scene.giveRainStone(this.key);
      }

      // 💡 規格指定：獲得該關卡祈雨石的時候，迅速淡出 bgm_energizing_loop（2秒）
      const audio = AudioManager.getInstance(scene);
      if (audio && typeof audio.fadeOutBGM === "function") {
        audio.fadeOutBGM(2000);
      }
    };

    if (this.isTrunkPolluted) {
      safeSetTexture(this.lotusRelic, "lotus_relic_polluted");
      DialogueSystem.show(scene, dialogs[3] || [], onCompleteGainStone);
    } else {
      safeSetTexture(this.lotusRelic, "lotus_relic_clean");
      DialogueSystem.show(scene, dialogs[1] || [], onCompleteGainStone);
    }
  },

  triggerGuardDialogue(scene) {
    const dialogs = dialogueData || [];

    DialogueSystem.show(scene, dialogs[0] || [], () => {
      this.isTalked = true;
      const options = [
        { key: "leave", label: "不救並離開" },
        { key: "save", label: "用象鼻移開石塊救牠" },
      ];

      if (ChoiceSystem?.prompt) {
          ChoiceSystem.prompt(scene, options, (choice) => {
            if (choice === "save") {
              this.isGuardRescued = true;
              this.isTrunkPolluted = true;

              if (this.rockGuard) {
                this.rockGuard.destroy();
                this.rockGuard = null;
              }
              safeSetTexture(this.guard, "guard_saved");

              MoralState?.add?.("harm", 1);
              DialogueSystem.show(scene, dialogs[2] || [], () => {});
            } else if (choice === "leave") {
              this.isTrunkPolluted = false;
              MoralState?.add?.("purity", 1);
              DialogueSystem.show(scene, dialogs[1] || [], () => {});
            }
          });
      }
    });
  },

  update(scene) {
    if (!scene.player || !scene.playerController) return;

    // 玩家距離犀牛一定距離時播放 sfx_purity_guard_weak
    if (this.guard?.active && !this.isGuardRescued) {
    const distanceToGuard = Phaser.Math.Distance.Between(
      scene.player.x,
      scene.player.y,
      this.guard.x,
      this.guard.y
    );

    // 進入範圍（300px 內）且音效尚未播放
    if (distanceToGuard <= this.guardWeakAudioDistance) {
      if (!this.guardWeakSound || !this.guardWeakSound.isPlaying) {
        if (scene.cache?.audio?.exists("sfx_purity_guard_weak")) {
          this.guardWeakSound = scene.sound.add("sfx_purity_guard_weak", { loop: true, volume: 1.0 });
          this.guardWeakSound.play();
        }
      }
    } else {
      // 💡 離開範圍（>300px）：如果正在叫，立刻停止
      if (this.guardWeakSound && this.guardWeakSound.isPlaying) {
        this.guardWeakSound.stop();
        this.guardWeakSound = null;
      }
    }
  } else {
    // 守衛已被救出，確保音效停止
    if (this.guardWeakSound && this.guardWeakSound.isPlaying) {
      this.guardWeakSound.stop();
      this.guardWeakSound = null;
    }
  }

    const isUIBusy =
      DialogueSystem.isShowing() ||
      ChoiceSystem.isShowing() ||
      scene.isDialogueCooldown;

    // 對話/選單/冷卻期間禁止移動與推力，但不硬改此Controller基本速度
    if (isUIBusy) {
      scene.playerController.speed = 0;
      if (scene.player.body) {
        scene.player.body.setVelocity(0, 0);
        scene.player.body.setAcceleration(0, 0);
      }
      return;
    }

    if (this.slowZone) {
      const isOverlapping = scene.physics.overlap(scene.player, this.slowZone);
      const baseSpeed = scene.playerController.baseSpeed ?? 160;

      if (isOverlapping ) {
        // 進入沼澤區降速 50%
        scene.playerController.speed = baseSpeed * 0.5;

        if (scene.player.texture?.key !== "main_character_uncomfortable") {
          safeSetTexture(scene.player, "main_character_uncomfortable");
        }

        if (scene.player.body) {
          scene.player.body.velocity.x += this.currentForceX;
          scene.player.body.velocity.y += this.currentForceY;
        }
      } else {
        // 離開區域恢復基準速度
        scene.playerController.speed = baseSpeed;

        if ((scene.player.texture?.key === "main_character_uncomfortable") && (scene.playerController.enabled)) {
          safeSetTexture(scene.player, "main_character_stand_still");
        }
      }
    }
  },
};
