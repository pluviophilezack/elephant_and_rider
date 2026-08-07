# `src/game/core/`、`src/game/scenes/`、`src/game/ui/` 分工表

4 人分工，工作量不強求平均，以「檔案之間的 import 依賴」與「概念上是否同一件事」為切分依據，讓每組彼此不需要修改對方的檔案。

| 負責人 | 檔案 | 這組在做什麼 |
|---|---|---|
| **A｜移動與鼻子互動** | `core/PlayerController.js`<br>`core/TrunkController.js` | 主角在地圖上的 WASD 移動、鼻子角度跟隨滑鼠與伸縮拾放 |
| **B｜對話系統** | `core/DialogueSystem.js`<br>`ui/DialogueBox.js` | 文字泡邏輯與外觀。`DialogueSystem` 直接 `import DialogueBox`，綁在同一人才不用兩人對接口 |
| **C｜選項系統** | `core/ChoiceSystem.js`<br>`ui/ChoicePrompt.js` | A/D 選項游標邏輯與外觀，`ChoiceSystem` 直接 `import ChoicePrompt`，理由同上 |
| **D｜場景整合與框架** | `scenes/Boot.js`<br>`scenes/Preloader.js`<br>`scenes/MainMenu.js`<br>`scenes/Overworld.js`<br>`scenes/Ending.js`<br>`core/TriggerZone.js`<br>`core/MoralState.js`<br>`ui/HUD.js` | 遊戲場景流程、把 A/B/C 三組系統組裝進 `Overworld.js`、道德數值 singleton、結局判斷、祈雨石 HUD |

## 分組理由

- **A、B、C**：機制與它自己的 UI 綁在同一人身上——這是唯二存在直接 `import` 關係的地方（`DialogueSystem → DialogueBox`、`ChoiceSystem → ChoicePrompt`），拆給不同人就得頻繁對接口，綁在一起完全不用溝通。
- **D**：整合者角色，工作量本來就比較多（8 個檔案，但多數很小，如 `Boot.js`/`HUD.js` 都在 20～30 行內），因為「把大家的系統接在一起」本質上就是要碰很多檔案。但 D 只需要「呼叫」A/B/C 暴露出來的公開方法，完全不需要進去改 A/B/C 的檔案內容。
- `MoralState.js` 是小工具，但主要呼叫方在 D 的 `Ending.js` 裡（讀取道德數值計算結局），歸給 D 符合「誰用歸誰管」。`TriggerZone.js` 同樣是共用工具類，雖由 `domain_elephants` 事件使用，但作為核心工具歸給 D 統一管理。

## 介面契約（開工前先講死，之後各自可自由重構內部實作）

只要以下方法的名稱與參數不變，D 與 A/B/C 之間、以及 `events/` 底下各事件負責人與 B/C 之間，都不需要互相溝通：

- **A** 提供：`playerController.update()`、`trunkController.update()`、`trunkController.setHeldItem(item)`
- **B** 提供：`DialogueSystem.show(scene, lines, onComplete)`
- **C** 提供：`ChoiceSystem.prompt(scene, options, onChoose)`
