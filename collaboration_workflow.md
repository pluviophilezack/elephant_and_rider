

## 建立並切換到新的 feature 分支

## 先確保本機版本是最新版本

> 目的：避免基於過期程式碼開發，降低後續合併衝突。\
> 可參考此教學https\://gitbook.tw/chapters/github/fail-to-push

```bash
# 1) 確認你在專案根目錄
pwd

# 2) 查看目前所在分支與檔案狀態（非必要但建議）
git status

# 3) 切換到 main 分支（我們將從最新 main 開新功能分支）
git checkout main

# 4) 取得遠端 main 的最新變更，更新本機 main
git pull origin main
```

### 再建立新分支

> 命名建議：`feature/<頁面或任務>`，例如 `feature/homepage`、`feature/news-search`。

```bash
# 1) 注意！應從「最新 main」 開出新分支
git checkout -b feature/your-task-name

# 2) 開發中，請頻繁小步提交（方便回溯）
#    每次完成一個可描述的小變更就 commit 一次
#    commit 訊息格式建議：
#    feat: 新增某功能 / fix: 修正某問題 / docs: 文件

git add .
git commit -m "feat: add header skeleton and nav links"
```

## 如果夥伴通過PR，更新了remote的main，我該如何把 main 的變更帶回我正在開發的 feature branch?（方式 A：merge main into feature）

> 目的：你的功能分支開發期間，main 可能被其他人更新。定期把 main 合入你的 feature，避免最終 PR 時一次出現大量衝突。可參考此教學：[https://gitbook.tw/chapters/branch/merge-branch](https://gitbook.tw/chapters/branch/merge-branch)

1. **抓取遠端最新 main 到本機**：

   ```
   git fetch origin
   ```

2. **切換到本機 main 分支並更新**：

   ```
   git checkout main
   git merge origin/main
   ```

   - 這樣保證你的本機 main 與遠端 main 完全同步。

3. **切回 feature 分支，手動合併 main**：

   ```
   git checkout feature/your-task
   git merge main
   ```

   - 若沒有衝突 → 完成一次合併 commit，繼續開發。
   - 若有衝突 → 依下一節的「處理衝突」步驟修正。



## 如果遇到衝突，該如何 merge？

> 觀念：衝突（conflict）是 Git 無法自動判定保留哪段程式碼，需要你手動決定。VS Code 會有「Accept Current / Incoming / Both」等按鈕可協助處理。

```bash
# 1) 檢查衝突檔案列表
git status

# 2) 打開有衝突的檔案，找到像這樣的衝突標記：
# <<<<<<< HEAD
# ... 你的 feature 分支內容（Current Change）
# =======
# ... 來自 main 的內容（Incoming Change）
# >>>>>>> origin/main
# 依據設計決策手動整合，保留正確內容並移除所有標記。

# 3) 標記已解決（把修好的檔案加入暫存）
git add path/to/conflicted-file.jsx

# 4) 完成此次 merge（若尚有衝突檔案，重複 2~3）
git commit

# 5) 將已解決衝突的進度推到遠端自己負責的feature branch上（備份 & 同步）
git push
```

> 小技巧：如果這次 merge 過程想要放棄（回到 merge 前狀態），可以用：

```bash
git merge --abort
```

> 推薦習慣：在開發期間，每 1 天或每完成一小段功能，就執行一次 `git fetch origin && git merge origin/main`，把 main 的更新帶回來，衝突就會小很多。

---

# 如何 push 我的成果給夥伴？

## push 至我自己管理的 feature/x 分支

> 目的：把你的進度備份到 GitHub，讓夥伴可檢視、也能避免本機資料遺失。

```bash
# 1) 確認在你的 feature 分支
git branch

# 2) 首次推送到遠端（-u 會建立「追蹤關係」，之後只要用 git push 即可）
git push -u origin feature/your-task-name

# 3) 後續只要繼續開發、commit，再 push 即可
# （因為已經設定 upstream，直接 git push）
git push
```

> 檢查：到 GitHub 你的 repo → Branches，即可看到 `feature/your-task-name` 已存在。

## 設定 main 的分支保護規則（這部分已經設定完成）

> 你們的規範：
>
> - Require a pull request before merging（需 PR 且至少 1 位 reviewer）
> - Dismiss stale pull request approvals when new commits are pushed（PR 期間若再推新 commit，舊的核可會失效需重審）

**設定路徑（GitHub 網頁端）**：

1. 進入 repo → **Settings** → **Branches** → **Branch protection rules** → **Add rule**
2. Branch name pattern：填入 `main`
3. 勾選：
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** → 設為 **1人**
   - ✅ **Dismiss stale pull request approvals when new commits are pushed**
4. 其他選項維持預設即可（目前不啟用 CI 狀態檢查）→ **Create** 儲存。

> 完成後，任何人要把 feature 合併進 main 都必須開 PR 並通過 1 人審查。

## 將feature/x 合併至 main（開 PR → 一位夥伴審查 → 合併），並通知夥伴（LINE）

> 目的：將你的功能正式整合進 main，讓夥伴在 `git pull origin main` 後能使用你的程式碼。

先在本地端將feature/x 合併至 main

```bash
git checkout main
git merge features/x
```

**在 GitHub 開 PR（網頁端）**：

1. 進入 repo → **Pull requests** → **New pull request**
2. **base** 選 `main`，**compare** 選 feature/x (要先將此branch push上去才會有選項)
3. 寫清楚：這個 PR 做了什麼、如何在本機測試（路徑與步驟）、是否有破壞性改動
4. 指定 **1 位 reviewer**（並以Line通知夥伴）
5. 若 reviewer 建議修改：在本機修正後 `git add . && git commit -m "fix: ..." && git push`，PR 會自動更新。若有新 commit，先前核可會被自動撤銷（符合你的規範）。
6. 審查通過後，在 PR 頁按 **Merge pull request**（**Create a merge commit**，盡量使用Squash，後續回顧歷史紀錄比較方便）。

**合併完成後（雙方動作）**：

```bash
# 原作者：在 PR 中留言「已合併」
# 夥伴：更新本機 main，取得最新功能

git checkout main
git pull origin main
```

> 清理已合併的遠端分支以保持整潔（自行決定，不一定要清除，留著或許比較保險）：

```bash
# 刪除遠端已合併的 feature 分支（僅在 PR 已合併後執行）
git push origin --delete feature/your-task-name

# 刪除本機同名分支（不再需要時）
git branch -d feature/your-task-name
```
