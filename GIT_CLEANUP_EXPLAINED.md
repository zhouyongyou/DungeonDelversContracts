# Git 歷史清理技術原理詳解

## 1. 為什麼私鑰在 Git 歷史中很危險？

### Git 的永久記錄特性
```
git log --all --grep="PRIVATE_KEY"  # 可以搜索所有歷史
git show <commit-hash>:.env         # 可以查看任何歷史版本的文件
```

即使你刪除了文件，Git 仍保留完整歷史：

```
Commit A: 添加 .env (包含私鑰) ← 私鑰在這裡！
    ↓
Commit B: 修改其他文件
    ↓  
Commit C: 刪除 .env ← 只是標記刪除，歷史仍在
    ↓
Commit D: 當前狀態 ← 看起來安全，但歷史可查
```

## 2. Git 對象存儲原理

### Git 對象類型
```
.git/objects/
├── 01/ 
│   └── 23456... (blob: 文件內容)
├── ab/
│   └── cdef0... (tree: 目錄結構)
├── fe/
│   └── dcba9... (commit: 提交信息)
```

### 對象關係圖
```
Commit Object (SHA: abc123)
    |
    ├── parent: def456 (父提交)
    ├── tree: 789abc (根目錄樹)
    ├── author: 作者信息
    └── message: 提交信息
         |
         v
    Tree Object (SHA: 789abc)
         |
         ├── blob 111222 .env (包含私鑰!)
         ├── blob 333444 README.md
         └── tree 555666 src/
```

## 3. BFG 工作原理

### 核心算法
```python
def bfg_clean(repo):
    # 1. 構建提交圖
    commit_graph = build_commit_graph(repo)
    
    # 2. 從最早的提交開始
    for commit in topological_sort(commit_graph):
        # 3. 掃描所有 blob
        for blob in commit.get_blobs():
            if contains_secret(blob):
                # 4. 創建新的 blob (內容已清理)
                new_blob = create_cleaned_blob(blob)
                # 5. 替換引用
                commit.replace_blob(blob.id, new_blob.id)
        
        # 6. 重新計算 commit hash
        commit.recalculate_hash()
```

### BFG vs filter-branch 性能對比
```
操作              | filter-branch | BFG
------------------|---------------|----------
10,000 commits    | 3-4 小時      | 1-2 分鐘
內存使用          | 持續增長       | 固定大小
並行處理          | 否            | 是
保護 HEAD        | 需手動處理     | 自動保護
```

## 4. 清理過程的 SHA 變化

### 原始歷史
```
A(sha:111) → B(sha:222) → C(sha:333) → D(sha:444)
    ↑
包含私鑰
```

### 清理後
```
A'(sha:aaa) → B'(sha:bbb) → C'(sha:ccc) → D'(sha:ddd)
     ↑
私鑰已替換為 ***REMOVED***
```

注意：所有 SHA 都變了，因為：
- A 的內容變了 → A' 有新 SHA
- B 的 parent 從 111 變成 aaa → B' 有新 SHA
- 以此類推...

## 5. 垃圾回收原理

### reflog 和 gc
```bash
# Git 保留引用日誌 (reflog) 默認 90 天
git reflog expire --expire=now --all

# 垃圾回收刪除不可達對象
git gc --prune=now --aggressive

# 原理：
# 1. 標記階段：從 refs 開始標記所有可達對象
# 2. 清理階段：刪除未標記的對象
```

### 對象可達性
```
refs/heads/main → Commit D' → Tree → Blobs (可達，保留)
                      ↓
                  Commit C' → Tree → Blobs (可達，保留)
                      
refs/original/  → Commit D  → Tree → Blobs (清理後變為不可達)
   (刪除後)           ↓
                  Commit C  → Tree → .env with private key (被刪除!)
```

## 6. 為什麼需要 Force Push？

### 正常 push 的校驗
```
本地: A' → B' → C' → D' (重寫後的歷史)
         ↑
      不是 fast-forward!
         ↓
遠程: A  → B  → C  → D  (原始歷史)
```

Git 拒絕 push 因為這不是 "fast-forward"（快進）更新。

### Force Push 原理
```bash
git push --force
# 等同於
git push --delete refs/heads/main  # 刪除遠程分支
git push refs/heads/main           # 推送新歷史
```

## 7. 完整清理檢查清單

```bash
# 1. 確認私鑰已清理
git log --all --full-history -- .env
# 應該返回空

# 2. 搜索私鑰字符串
git grep "0x8b5c" $(git rev-list --all)
# 應該返回空

# 3. 檢查 reflog
git reflog show --all | grep sensitive
# 確保沒有引用

# 4. 檢查對象庫大小
du -sh .git/objects
# 清理後應該變小

# 5. 驗證 packed-refs
cat .git/packed-refs
# 不應包含 refs/original/
```

## 8. 安全建議

### 預防措施
1. **使用 .gitignore**：預防勝於治療
2. **git-secrets**：自動掃描阻止提交
3. **環境變量管理**：使用 dotenv, Vault 等
4. **Git Hooks**：pre-commit 檢查

### 如果已經洩露
1. **立即輪換密鑰**：假設已被竊取
2. **審計訪問日誌**：檢查是否被利用
3. **通知相關方**：如果影響用戶
4. **考慮法律行動**：如果發現惡意使用

## 9. 高級：自定義清理腳本

```python
#!/usr/bin/env python3
import subprocess
import re

class GitCleaner:
    def __init__(self, patterns):
        self.patterns = patterns
        
    def clean_blob(self, blob_id):
        """清理單個 blob 對象"""
        content = subprocess.check_output(['git', 'show', blob_id])
        
        for pattern in self.patterns:
            content = re.sub(pattern, b'***REMOVED***', content)
            
        # 創建新 blob
        proc = subprocess.Popen(['git', 'hash-object', '-w', '--stdin'],
                              stdin=subprocess.PIPE,
                              stdout=subprocess.PIPE)
        new_blob_id, _ = proc.communicate(content)
        return new_blob_id.strip()
    
    def rewrite_history(self):
        """重寫整個歷史"""
        # 獲取所有 commits
        commits = subprocess.check_output(
            ['git', 'rev-list', '--all']
        ).decode().split()
        
        # 從最舊到最新處理
        for commit in reversed(commits):
            self.process_commit(commit)
```

## 10. 原理總結

**核心概念**：
1. Git 歷史是不可變的鏈式結構
2. 修改任何部分需要重寫後續所有部分  
3. 清理是創建平行歷史，不是修改原歷史
4. 原歷史需要垃圾回收才會真正刪除
5. Force push 是用新歷史替換舊歷史

**為什麼這麼複雜？**
- Git 設計目標是保護數據完整性
- 每個 commit 都是前一個的密碼學證明
- 這種設計防止歷史被篡改
- 但也讓刪除敏感數據變得困難

這就是為什麼預防（.gitignore）比治療（清理歷史）重要得多！