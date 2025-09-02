# 🔍 合約項目清理與檢查報告
生成時間：2025-08-16

## 📊 問題分析總結

### 1. 合約名稱更新狀況
| 項目 | 路徑 | 舊名稱殘留 | 狀態 |
|------|------|------------|------|
| 合約項目 | `/DungeonDelversContracts/contracts/current` | 0 | ✅ 完成 |
| 前端項目 | `/GitHub/DungeonDelvers` | 58 | ⚠️ 需更新 |
| 子圖項目 | `/DDgraphql/dungeon-delvers` | 81 | ⚠️ 需更新 |
| 後端項目 | `/dungeon-delvers-metadata-server` | 1 | ⚠️ 需更新 |
| 腳本項目 | `/DungeonDelversContracts/scripts` | 待檢查 | ⚠️ 需檢查 |

### 2. ABI 文件數量不匹配問題
- **合約項目 ABI**：8 個
- **前端項目 ABI**：15 個
- **子圖項目 ABI**：16 個

**問題原因**：
1. 前端和子圖包含了額外的歷史 ABI 文件
2. 某些合約可能已被棄用但 ABI 未清理
3. 同步腳本可能需要更新以匹配當前合約結構

### 3. 編譯警告分析

#### 未使用的參數警告
```solidity
// contracts/current/core/AltarOfAscension.sol:389
function _performFailedUpgrade(address user, ...) 
// user 參數未使用

// contracts/current/core/DungeonMaster.sol:283
function claimRewards(uint256 _partyId) external view
// _partyId 參數未使用（函數總是 revert）

// contracts/current/nft/Hero.sol:256
function _determineRarityFromSeed(..., address user, uint256 quantity)
// user 和 quantity 參數未使用

// contracts/current/nft/Relic.sol:258
function _determineRarityFromSeed(..., address user, uint256 quantity)
// user 和 quantity 參數未使用
```

#### 未使用的局部變量
```solidity
// contracts/current/core/DungeonMaster.sol:249
(uint256 provisionsRemaining, ..., ..., uint8 fatigueLevel)
// provisionsRemaining 和 fatigueLevel 未使用
```

### 4. 死代碼和歷史遺留功能

#### 保留但已無實際作用的功能
1. **DungeonMaster.claimRewards()**
   - 永遠 revert，提示獎勵自動存入 PlayerVault
   - 保留原因：維持接口兼容性

2. **Hero/Relic 的 isRevealed 字段**
   - 註釋顯示"保留但永遠為 true（向後相容）"
   - 保留原因：數據結構兼容性

3. **未使用的函數參數**
   - _determineRarityFromSeed 中的 user 和 quantity
   - 可能原本計劃基於用戶或數量調整稀有度

### 5. 需要歸檔的過時文檔（20個）

#### 部署記錄類（建議歸檔）
- DEPLOYMENT_MARKETPLACE_2025-07-29.md
- DEPLOYMENT_RECORD_2025-07-31.md
- DEPLOYMENT_SUCCESS_2025-08-06.md
- DEPLOYMENT-V25-FIX-2025-08-07.md
- V25_DEPLOYMENT_RECORD_2025-08-06.md

#### 版本相關文檔（建議歸檔）
- CONTRACT_ADDRESSES_V25.md
- DEPLOYMENT_SUMMARY_V25_FIX.md
- V25_*.md（多個文件）

#### 分析報告類（可考慮保留最新的）
- CONTRACT_ANALYSIS_REPORT_2025.md
- CONTRACT_OPTIMIZATION_2025-08-06.md
- HERO_CONTRACT_REFACTOR_2025.md

## 🛠️ 建議修復方案

### 1. 立即需要執行的任務

#### A. 更新前端和子圖的舊名稱引用
```bash
# 前端項目
cd /Users/sotadic/Documents/GitHub/DungeonDelvers
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/AltarOfAscensionVRF/AltarOfAscension/g' {} \;
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/Oracle_V22_Adaptive/Oracle/g' {} \;
find . -type f \( -name "*.js" -o -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/PartyV3/Party/g' {} \;

# 子圖項目
cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers
# 需要更新 subgraph.yaml 和映射文件
```

#### B. 歸檔過時文檔
```bash
cd /Users/sotadic/Documents/DungeonDelversContracts
mkdir -p docs/archive_2025-08-16

# 移動過時的部署記錄
mv DEPLOYMENT_*2025-07*.md docs/archive_2025-08-16/
mv DEPLOYMENT_*2025-08-06.md docs/archive_2025-08-16/
mv V25_*.md docs/archive_2025-08-16/
mv V24_*.md docs/archive_2025-08-16/ 2>/dev/null || true
```

#### C. 清理多餘的 ABI 文件
需要確認前端和子圖中哪些 ABI 是真正需要的：
- SoulShard.json
- USD.json
- VIPStaking.json
- 其他歷史版本的 ABI

### 2. 代碼優化建議

#### A. 移除未使用的參數（低優先級）
```solidity
// 可以使用下劃線命名來消除警告
function _performFailedUpgrade(
    address /* user */,  // 或 address _user (unused)
    uint256[] memory tokenIds,
    address tokenContract
)

// 或完全移除如果確實不需要
function _determineRarityFromSeed(uint256 randomValue) internal pure returns (uint8)
```

#### B. 移除死代碼（需謹慎評估）
- claimRewards 函數如果確實永不使用，可考慮移除
- isRevealed 字段如果所有依賴都已更新，可考慮移除

### 3. ABI 同步腳本改進

建議更新 `ultimate-config-system.js` 和 `cleanup-and-sync-abis.js`：
1. 添加 ABI 文件白名單機制
2. 自動檢測並報告多餘的 ABI
3. 版本控制 ABI 變更

## 📋 行動計劃優先級

### 高優先級（立即執行）
1. ✅ 更新前端和子圖中的舊合約名稱（58 + 81 處）
2. ✅ 歸檔過時的 MD 文檔
3. ✅ 統一 ABI 文件列表

### 中優先級（本週內）
1. 清理未使用的函數參數警告
2. 更新 ABI 同步腳本
3. 創建 ABI 版本管理機制

### 低優先級（後續迭代）
1. 評估並移除死代碼
2. 重構保留的兼容性代碼
3. 優化合約結構

## 🔒 風險評估

- **高風險**：刪除看似無用但實際被依賴的代碼
- **中風險**：ABI 不同步導致前端功能異常
- **低風險**：保留死代碼增加少量 gas 成本

## 📝 備註

1. 所有變更前務必備份
2. 修改合約代碼需要重新部署
3. 前端和子圖的更新可以熱更新
4. 建議在測試環境先驗證所有變更