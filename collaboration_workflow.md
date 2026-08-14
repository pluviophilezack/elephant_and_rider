# 團隊 Git 分支與 PR（Pull Request，發送請求）操作指引
如果有問題，亦可直接詢問預先建立好的genAI：
https://share.gemini.google/K5cdG4SzASTW

## 一、核心原則（Core Rules）

1. **`main` 是主幹**：
   * 本地與遠端的 `main` **不允許直接 commit 或直接 push**，不然歷史紀錄會越來越亂！
   * **絕不在本地端將開發分支 merge 進 `main`**；所有將程式碼合併入 `main` 的動作，一律交由 GitHub 上的 PR 審核後在雲端完成。
2. **本地 `main` 的唯一用途**：
   * 隨時保持乾淨，只負責同步遠端最新進度（`git pull origin main`），作為開新分支的基準線。
3. **任務結束即清理**：
   * 功能分支在 PR 正式合併後即完成使命，建議刪除舊分支；下一個階段的任務必定從最新 `main` 開新分支。

---

## 二、標準開發流程：從開分支到送出 PR，會經歷哪些步驟？

```
[確保 main 最新] ➔ [開新 feature 分支] ➔ [在分支上開發、提交多個 Commit] ➔ [Push 該分支到 GitHub] ➔ [開 PR & 夥伴審核通過並且Merge至origin/main] ➔ [本地清理分支] ➔ （從頭循環）
```

### Step 1. 確保本機版本為最新
> 目的：避免基於過期程式碼開發，降低後續合併衝突。

```bash
# 1) 確認在專案根目錄
pwd

# 2) 查看目前狀態（非必要但建議）
git status

# 3) 切換到 main 分支
git switch main

# 4) 取得遠端 main 的最新變更，更新本機 main
git pull origin main
```

### Step 2. 建立並切換到新的 feature 分支
> 命名建議：`feature/<頁面或任務>`，例如 `feature/homepage`、`feature/add-asset`。

```bash
# 1) 從最新 main 開出新分支
git switch -b feature/your-task-name

# 2) 開發中請頻繁小步提交（每次完成一個小變更就 commit 一次）
git add .
git commit -m "feat: add header skeleton and nav links"
```

### Step 3. Push 進度至遠端 GitHub
> 目的：將進度備份至遠端，讓夥伴能檢視程式碼。

```bash
# 1) 推送到遠端
git push origin feature/your-task-name
```

### Step 4. 在 GitHub 建立 PR 並指派審查
1. 進入 pGitHub repo](https://github.com/pluviophilezack/elephant_and_rider) ，開PR
2. **base** 選擇 `main`，**compare** 選擇你的 `feature/your-task-name`。
3. **填寫 PR 內容**：清楚說明做了什麼修改、如何在本機測試驗證、是否有破壞性變更。
4. **回應修改建議**：若 Reviewer 提出修改要求，直接在本地修改後重新提交並 push：
   ```bash
   git add .
   git commit -m "fix: resolve review comments"
   git push
   ```

### Step 5. 審核通過後的合併與本地清理
1. 審查通過後，由負責人在 GitHub PR 頁面點擊**Merge pull request**完成合併。
2. 合併完成後，團隊成員（原作者與夥伴）皆需更新本地 `main`，並刪除已完成任務的分支：

```bash
# 1) 切回 main 並更新
git switch main
git pull origin main

# 2) 刪除本地已合併的舊分支
git branch -d feature/your-task-name

# 3) （可選）刪除遠端已合併的分支
git push origin --delete feature/your-task-name
```

---
接著回到Step 1.

## 三、開發期間同步主幹與衝突處理

### 當遠端 `main` 有更新，如何帶回正在開發的 feature 分支？
> 目的：開發期間定期把主幹最新進度合入 feature，避免累積過多差異。

```bash
# 1) 切換到本地 main 並同步遠端最新進度
git switch main
git pull origin main

# 2) 切回你的 feature 分支，將 main 的變更併進來
git switch feature/your-task-name
git merge main
```
* **若無衝突**：自動產生一次 Merge commit，即可繼續開發。
* **若有衝突**：依下方步驟手動解決。

### 遇到衝突（Conflict）時的處理步驟
衝突標記範例：
```
<<<<<<< HEAD
... 你目前 feature 分支的修改（Current Change）
=======
... 來自 main 的更新內容（Incoming Change）
>>>>>>> main
```

1. **檢查衝突檔案**：
   ```bash
   git status
   ```
2. **手動編輯檔案**：使用 VS Code（可搭配內建的「Accept Current / Incoming / Both」按鈕）整合程式碼，並刪除所有 `<<<<<<<`、`=======`、`>>>>>>>` 標記。
3. **標記已解決並完成 Commit**：
   ```bash
   git add path/to/conflicted-file.js
   git commit -m "chore: resolve merge conflicts with main"
   ```
4. **推送到遠端**：
   ```bash
   git push
   ```
> **小技巧**：若解衝突過程中想要放棄並回到合併前的狀態，可輸入：
> ```bash
> git merge --abort
> ```

---

## 四、等待 PR 審核期間的開發策略

當你的 PR 正在等待審核，但需要繼續推進進度時：

| 情況 | 推薦處理方式 | 說明 |
| :--- | :--- | :--- |
| **新進度完全獨立** | 從最新 `main` 開新分支 | `git switch main` -> `git switch -b feature/new-independent-task`，完成後直接開獨立 PR。 |
| **新進度高度依賴前一個 PR** | 從前一個 feature 分支切出新分支 | `git switch feature/task-1` -> `git switch -b feature/task-2`。<br>在本地先開發，**等 PR 1 在 GitHub 合併進 `main` 後**，本地更新 `main`，再把最新 `main` 併入 `feature/task-2` 後推送開 PR。 |

---

## 五、多個 PR 同時通過時的合併順序

1. **依序點擊合併**：GitHub 無法批次合併多個 PR，需逐一進入各 PR 頁面點擊 **Merge pull request**。
2. **依相依性依序合併**：若 PR 2 依賴 PR 1 的改動，**務必先合併 PR 1**。
3. **後續 PR 出現衝突時**：
   ```bash
   git switch feature/task-2     # 切換到你發生conflict、正在等待review的branch
   git pull origin main          # 拉取剛合併進 main 的最新進度。在本地解決衝突有時候會遇到分叉，需要指定merge的策略，此時請使用：
   git pull --no-rebase origin main

   # (手動修復衝突檔案並 git add / git commit)
   git push origin feature/task-2  # 推送後 GitHub PR 會自動解除衝突狀態
   ```

---

## 六、常見錯誤救援指引（FAQ）

### Q1：我不小心在本地把開發分支 merge 進 `main` 了，怎麼辦？
**症狀**：在本地 `main` 誤輸入了 `git merge feature/...`（尚未 push）。

* **還原方法（強制對齊遠端）**：

  ```bash
  # 1) 確認在 main 分支
  git switch main

  # 2) 強制將本地 main 重設回遠端乾淨的狀態
  git reset --hard origin/main
  ```
  *重設後，本地 `main` 會恢復乾淨，你的開發進度仍安全保留在 feature 分支上。*

### Q2：我可以在舊的 feature 分支上繼續寫下一個階段的功能嗎？
* **不建議**。當前一個 PR 已經 Squash/Merge 進 `main` 後，舊分支的歷史紀錄與主幹已經脫鉤。繼續使用舊分支容易產生衝突與重複 commit。請務必遵守：**「PR 合併後刪除舊分支 -> 同步最新 `main` -> 建立全新分支」**。